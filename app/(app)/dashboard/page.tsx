// app/(app)/dashboard/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { requireProfile, supabaseAdmin } from '@/lib/supabase'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const profile = await requireProfile()

  // Fetch in parallel
  const [
    { data: courseProgress },
    { data: recentBadges },
    { data: leaderboardRank },
    { data: recentXP },
  ] = await Promise.all([
    supabaseAdmin
      .from('course_progress')
      .select('course_id, course_title, pct_complete, is_complete, completed_lessons, total_lessons, xp_earned')
      .eq('user_id', profile.id)
      .order('last_activity', { ascending: false })
      .limit(5),

    supabaseAdmin
      .from('user_badges')
      .select('badge_id, earned_at, badges(id, name, icon, rarity, xp_reward)')
      .eq('user_id', profile.id)
      .order('earned_at', { ascending: false })
      .limit(6),

    supabaseAdmin
      .from('leaderboard')
      .select('rank')
      .eq('id', profile.id)
      .single(),

    supabaseAdmin
      .from('xp_transactions')
      .select('amount, reason, created_at')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const rank = (leaderboardRank as any)?.rank
  const pctToNext = Math.round(((profile.xp_total % profile.xp_to_next) / profile.xp_to_next) * 100)

  const stats = [
    { label: 'Global Rank',  value: rank ? `#${rank}` : '—',         sub: 'Top learners',     color: 'text-codex-gold' },
    { label: 'XP Earned',    value: `${(profile.xp_total/1000).toFixed(1)}k`, sub: 'total points', color: 'text-codex-text' },
    { label: 'Day Streak',   value: `${profile.streak_current}`,      sub: 'days in a row',   color: 'text-codex-success' },
    { label: 'Lessons Done', value: `${profile.lessons_completed}`,   sub: 'completed',       color: 'text-codex-info' },
  ]

  return (
    <div className="h-full overflow-y-auto p-8 space-y-8">

      {/* ── Greeting ──────────────────────────────── */}
      <div>
        <h1 className="font-display font-bold text-2xl text-codex-text mb-1">
          Welcome back, {profile.full_name?.split(' ')[0] || profile.username} 👋
        </h1>
        <p className="text-codex-muted text-sm">Here&apos;s your progress. Keep the streak alive.</p>
      </div>

      {/* ── XP Progress ───────────────────────────── */}
      <div className="cx-card p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="cx-section-title">Level {profile.xp_level} Progress</div>
          <div className="cx-xp-badge">{profile.xp_to_next.toLocaleString()} XP to next level</div>
        </div>
        <div className="cx-progress-bar h-3 mb-2">
          <div className="cx-progress-fill bg-gradient-to-r from-codex-goldDim to-codex-gold"
            style={{ width: `${pctToNext}%` }} />
        </div>
        <div className="flex justify-between text-xs text-codex-muted">
          <span>{profile.xp_total.toLocaleString()} XP</span>
          <span>{pctToNext}% to Level {profile.xp_level + 1}</span>
        </div>
      </div>

      {/* ── Stats ─────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="cx-stat">
            <div className="text-xs text-codex-muted uppercase tracking-wider mb-2">{s.label}</div>
            <div className={`font-display font-bold text-3xl ${s.color} mb-0.5`}>{s.value}</div>
            <div className="text-xs text-codex-muted">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Course Progress ───────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="cx-section-title">Your Courses</div>
          <Link href="/courses" className="text-xs text-codex-gold hover:underline">View all →</Link>
        </div>

        {courseProgress?.length ? (
          <div className="space-y-3">
            {courseProgress.map((c: any) => (
              <Link key={c.course_id} href={`/learn/${c.course_id}`}
                className="cx-card-up cx-hover-gold flex items-center gap-4 p-4 block group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-sm text-codex-text truncate">{c.course_title}</span>
                    {c.is_complete && (
                      <span className="text-[10px] font-bold text-codex-success bg-codex-success/10
                                       border border-codex-success/30 px-2 py-0.5 rounded-md flex-shrink-0">
                        ✓ DONE
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 cx-progress-bar">
                      <div className="cx-progress-fill bg-codex-gold" style={{ width: `${c.pct_complete}%` }} />
                    </div>
                    <span className="text-xs text-codex-muted flex-shrink-0">
                      {c.completed_lessons}/{c.total_lessons}
                    </span>
                  </div>
                </div>
                <span className="text-codex-muted group-hover:text-codex-gold text-sm transition-colors">→</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="cx-card-up p-8 text-center">
            <div className="text-4xl mb-3">🚀</div>
            <p className="text-codex-muted text-sm mb-4">Start your first course and begin earning XP</p>
            <Link href="/courses" className="cx-btn-primary inline-block w-auto px-6">
              Browse Courses →
            </Link>
          </div>
        )}
      </div>

      {/* ── Bottom row: Badges + Recent XP ────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4">

        {/* Badges */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="cx-section-title">Recent Badges</div>
            <Link href="/badges" className="text-xs text-codex-gold hover:underline">All badges →</Link>
          </div>
          {recentBadges?.length ? (
            <div className="grid grid-cols-3 gap-3">
              {(recentBadges as any[]).map(ub => {
                const b = ub.badges
                const rarityClass = `cx-rarity-${b.rarity}`
                return (
                  <div key={ub.badge_id}
                    className={`cx-card-up border rounded-xl p-3 text-center ${rarityClass}`}>
                    <div className="text-2xl mb-1.5">{b.icon}</div>
                    <div className="text-[10px] font-bold truncate">{b.name}</div>
                    <div className={`text-[9px] mt-0.5 uppercase tracking-wider ${rarityClass}`}>{b.rarity}</div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="cx-card-up p-6 text-center text-codex-muted text-sm">
              Complete lessons to unlock badges
            </div>
          )}
        </div>

        {/* Recent XP */}
        <div>
          <div className="cx-section-title mb-4">XP History</div>
          <div className="space-y-2">
            {recentXP?.length ? (recentXP as any[]).map((tx, i) => (
              <div key={i} className="cx-card-up flex items-center justify-between p-3 px-4">
                <div>
                  <div className="text-xs font-medium text-codex-text capitalize">
                    {tx.reason.replace(/_/g, ' ')}
                  </div>
                  <div className="text-[10px] text-codex-muted">
                    {new Date(tx.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="font-display font-bold text-codex-gold text-sm">+{tx.amount}</div>
              </div>
            )) : (
              <div className="cx-card-up p-6 text-center text-codex-muted text-sm">
                No XP earned yet. Start learning!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// app/(app)/profile/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { requireProfile, supabaseAdmin } from '@/lib/supabase'

export const metadata: Metadata = { title: 'My Profile' }

export default async function ProfilePage() {
  const profile = await requireProfile()

  const [{ data: badges }, { data: completedCourses }, { data: recentActivity }] = await Promise.all([
    supabaseAdmin
      .from('user_badges')
      .select('badge_id, earned_at, badges(id, name, icon, rarity, xp_reward)')
      .eq('user_id', profile.id)
      .order('earned_at', { ascending: false }),

    supabaseAdmin
      .from('course_progress')
      .select('course_id, course_title, xp_earned, last_activity')
      .eq('user_id', profile.id)
      .eq('is_complete', true)
      .order('last_activity', { ascending: false }),

    supabaseAdmin
      .from('xp_transactions')
      .select('amount, reason, meta, created_at')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const totalBadgeXP = (badges || []).reduce((sum: number, b: any) => sum + (b.badges?.xp_reward || 0), 0)
  const pctToNext = Math.round(((profile.xp_total % profile.xp_to_next) / profile.xp_to_next) * 100)

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="max-w-3xl mx-auto space-y-8">

        {/* Profile header */}
        <div className="cx-card p-6 flex items-start gap-6">
          <div className="w-20 h-20 rounded-2xl flex-shrink-0 flex items-center justify-center
                          text-3xl font-bold text-black"
            style={{ background: 'linear-gradient(135deg, #f5a623, #7c3aed)' }}>
            {(profile.full_name || profile.username).charAt(0).toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h1 className="font-display font-bold text-2xl text-codex-text">
                  {profile.full_name || profile.username}
                </h1>
                <div className="text-codex-muted text-sm">@{profile.username}</div>
              </div>
              <div className="flex gap-2">
                <span className={`cx-plan-badge cx-plan-${profile.plan}`}>
                  {profile.plan === 'elite' ? '⭐ Elite' : profile.plan === 'learner' ? 'Learner' : 'Explorer'}
                </span>
              </div>
            </div>

            {profile.bio && <p className="text-sm text-codex-muted mb-3 leading-relaxed">{profile.bio}</p>}

            {/* XP / Level */}
            <div className="flex items-center gap-3 mb-3">
              <div className="cx-level-badge">Level {profile.xp_level}</div>
              <div className="flex-1 cx-progress-bar">
                <div className="cx-progress-fill bg-codex-gold" style={{ width: `${pctToNext}%` }} />
              </div>
              <span className="text-xs text-codex-muted">{profile.xp_total.toLocaleString()} XP</span>
            </div>

            {/* Stats row */}
            <div className="flex gap-4 flex-wrap">
              {[
                { label: 'Streak',   value: `🔥 ${profile.streak_current}d` },
                { label: 'Badges',   value: `✦ ${(badges || []).length}` },
                { label: 'Courses',  value: `◉ ${(completedCourses || []).length} done` },
                { label: 'Country',  value: profile.country },
              ].map(s => (
                <div key={s.label} className="text-sm">
                  <span className="text-codex-muted">{s.label}: </span>
                  <span className="font-medium text-codex-text">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Completed courses + certificates */}
        {(completedCourses || []).length > 0 && (
          <div>
            <div className="cx-section-title mb-4">Completed Courses</div>
            <div className="space-y-3">
              {(completedCourses as any[]).map(c => (
                <div key={c.course_id}
                  className="cx-card-up flex items-center gap-4 p-4">
                  <div className="text-codex-success text-xl flex-shrink-0">✓</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-codex-text">{c.course_title}</div>
                    <div className="text-xs text-codex-muted">
                      Completed {new Date(c.last_activity).toLocaleDateString()} · {c.xp_earned?.toLocaleString()} XP earned
                    </div>
                  </div>
                  <a href={`/api/certificate?course_id=${c.course_id}`}
                    target="_blank"
                    className="flex-shrink-0 text-xs font-bold text-codex-gold border border-codex-gold/30
                               px-3 py-1.5 rounded-lg hover:bg-codex-gold/10 transition-all">
                    ↓ Certificate
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Badge showcase */}
        {(badges || []).length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="cx-section-title">Badges ({(badges || []).length})</div>
              <div className="text-xs text-codex-gold">{totalBadgeXP.toLocaleString()} XP from badges</div>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
              {(badges as any[]).map(ub => {
                const b = ub.badges
                return (
                  <div key={ub.badge_id} title={`${b.name} — ${b.rarity}`}
                    className={`cx-card-up border rounded-xl p-3 text-center cursor-help
                      ${b.rarity === 'legendary' ? 'border-codex-gold/40' : b.rarity === 'epic' ? 'border-codex-accent/40' : 'border-codex-border'}`}>
                    <div className="text-2xl mb-1">{b.icon}</div>
                    <div className="text-[9px] font-bold text-codex-muted truncate">{b.name}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Edit profile */}
        <div className="cx-card p-6">
          <div className="cx-section-title mb-4">Edit Profile</div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-codex-muted uppercase tracking-wider mb-1.5">Display Name</label>
              <input defaultValue={profile.full_name || ''} className="cx-input" />
            </div>
            <div>
              <label className="block text-xs text-codex-muted uppercase tracking-wider mb-1.5">Bio</label>
              <textarea defaultValue={profile.bio || ''} rows={3}
                className="cx-input resize-none" placeholder="Tell the community about yourself..." />
            </div>
            <div>
              <label className="block text-xs text-codex-muted uppercase tracking-wider mb-1.5">Country</label>
              <input defaultValue={profile.country} className="cx-input" />
            </div>
            <div className="flex gap-3">
              <button className="cx-btn-primary w-auto px-6">Save Changes</button>
              <Link href="/subscription" className="cx-btn-ghost w-auto px-6 text-center flex items-center">
                Manage Plan
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

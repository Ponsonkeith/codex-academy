// app/(app)/leaderboard/page.tsx
import type { Metadata } from 'next'
import { requireProfile, supabaseAdmin } from '@/lib/supabase'

export const metadata: Metadata = { title: 'Leaderboard' }

export default async function LeaderboardPage() {
  const profile = await requireProfile()

  const [{ data: top100 }, { data: myRank }] = await Promise.all([
    supabaseAdmin
      .from('leaderboard')
      .select('id, username, full_name, avatar_url, country, xp_total, xp_level, streak_current, plan, rank')
      .limit(100),
    supabaseAdmin
      .from('leaderboard')
      .select('rank, xp_total, streak_current')
      .eq('id', profile.id)
      .single(),
  ])

  const userRank = (myRank as any)?.rank
  const podium = (top100 || []).slice(0, 3)
  const rest   = (top100 || []).slice(3)

  const rankMedal = (r: number) => r === 1 ? '🥇' : r === 2 ? '🥈' : '🥉'
  const rankColor = (r: number) => r === 1 ? '#f5a623' : r === 2 ? '#c0c0c0' : '#cd7f32'
  const planBadge = (plan: string) =>
    plan === 'elite' ? <span className="cx-plan-badge cx-plan-elite text-[9px]">Elite</span>
    : plan === 'learner' ? <span className="cx-plan-badge cx-plan-learner text-[9px]">Learner</span>
    : null

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl text-codex-text mb-1">Global Leaderboard</h1>
        <p className="text-codex-muted text-sm">Updated daily. Top performers unlock exclusive badges and XP multipliers.</p>
      </div>

      {/* Your rank callout */}
      {userRank && (
        <div className="cx-card-up border-codex-gold/30 p-4 mb-8 flex items-center gap-4
                        bg-codex-gold/5 border rounded-xl">
          <div className="text-2xl">{'🏅'}</div>
          <div>
            <div className="text-sm font-bold text-codex-gold">You&apos;re ranked #{userRank} globally</div>
            <div className="text-xs text-codex-muted mt-0.5">
              {(myRank as any).xp_total.toLocaleString()} XP · {(myRank as any).streak_current} day streak
            </div>
          </div>
          <div className="ml-auto text-xs text-codex-muted">
            {userRank > 10 ? `${userRank - 10} spots from Top 10` : 'You\'re in the Top 10! 👑'}
          </div>
        </div>
      )}

      {/* Podium */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[podium[1], podium[0], podium[2]].filter(Boolean).map((u: any, i) => {
          const actualRank = i === 0 ? 2 : i === 1 ? 1 : 3
          const isMe = u.id === profile.id
          return (
            <div key={u.id}
              className={`cx-card p-5 text-center relative overflow-hidden
                ${actualRank === 1 ? 'ring-1 ring-codex-gold/40' : ''}`}>
              {actualRank === 1 && (
                <div className="absolute inset-0 bg-codex-gold/3 pointer-events-none" />
              )}
              <div className="text-4xl mb-2">{rankMedal(actualRank)}</div>
              <div className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center
                              text-base font-bold flex-shrink-0"
                style={{ background: `${rankColor(actualRank)}20`, border: `1px solid ${rankColor(actualRank)}40`, color: rankColor(actualRank) }}>
                {(u.full_name || u.username).charAt(0).toUpperCase()}
              </div>
              <div className="font-semibold text-sm text-codex-text mb-0.5">
                {u.full_name || u.username}
                {isMe && <span className="text-codex-gold ml-1">(you)</span>}
              </div>
              <div className="text-xs text-codex-muted mb-2">{u.country}</div>
              <div className="font-display font-bold text-xl" style={{ color: rankColor(actualRank) }}>
                {u.xp_total.toLocaleString()}
              </div>
              <div className="text-xs text-codex-muted">XP</div>
            </div>
          )
        })}
      </div>

      {/* Rest of leaderboard */}
      <div className="space-y-2">
        {rest.map((u: any) => {
          const isMe = u.id === profile.id
          return (
            <div key={u.id}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-200
                ${isMe
                  ? 'bg-codex-gold/5 border-codex-gold/30'
                  : 'bg-codex-surfaceUp border-codex-border hover:border-codex-border/80'}`}>
              <div className="font-display font-bold w-8 text-center text-sm text-codex-muted">
                #{u.rank}
              </div>
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: isMe ? '#f5a62320' : '#7c3aed20', color: isMe ? '#f5a623' : '#a78bfa' }}>
                {(u.full_name || u.username).charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`font-semibold text-sm ${isMe ? 'text-codex-gold' : 'text-codex-text'}`}>
                    {u.full_name || u.username}
                  </span>
                  <span className="text-sm">{u.country}</span>
                  {isMe && (
                    <span className="text-[9px] font-bold text-codex-gold bg-codex-gold/10
                                     border border-codex-gold/30 px-1.5 py-0.5 rounded">YOU</span>
                  )}
                  {planBadge(u.plan)}
                </div>
                <div className="text-[11px] text-codex-muted">🔥 {u.streak_current} day streak · Lv.{u.xp_level}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className={`font-display font-bold text-sm ${isMe ? 'text-codex-gold' : 'text-codex-text'}`}>
                  {u.xp_total.toLocaleString()}
                </div>
                <div className="text-[10px] text-codex-muted">XP</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

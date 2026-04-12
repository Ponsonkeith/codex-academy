'use client'
// components/AppTopbar.tsx
import type { Profile } from '@/types/database'

interface Props { profile: Pick<Profile,'username'|'full_name'|'xp_total'|'xp_level'|'xp_to_next'|'streak_current'|'plan'|'avatar_url'> }

export default function AppTopbar({ profile }: Props) {
  const pct = Math.round(((profile.xp_total % profile.xp_to_next) / profile.xp_to_next) * 100)

  return (
    <header className="h-12 bg-codex-surface border-b border-codex-border
                       flex items-center px-5 gap-4 flex-shrink-0">
      {/* XP bar */}
      <div className="flex items-center gap-3 flex-1 max-w-xs">
        <div className={`cx-level-badge`}>LVL {profile.xp_level}</div>
        <div className="flex-1 cx-progress-bar">
          <div className="cx-progress-fill bg-codex-gold" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs text-codex-muted whitespace-nowrap">
          {profile.xp_total.toLocaleString()} XP
        </span>
      </div>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-3">
        {profile.streak_current > 0 && (
          <div className="cx-xp-badge">🔥 {profile.streak_current}d</div>
        )}
        <div className={`cx-plan-badge cx-plan-${profile.plan}`}>
          {profile.plan === 'elite' ? '⭐ Elite' : profile.plan === 'learner' ? 'Learner' : 'Free'}
        </div>
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-codex-gold to-codex-accent
                        flex items-center justify-center text-xs font-bold text-black flex-shrink-0">
          {profile.full_name?.charAt(0) || profile.username.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  )
}

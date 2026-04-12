// app/(app)/badges/page.tsx
import type { Metadata } from 'next'
import { requireProfile, supabaseAdmin } from '@/lib/supabase'

export const metadata: Metadata = { title: 'Badge Vault' }

const RARITY_ORDER = { legendary: 0, epic: 1, rare: 2, common: 3 }

export default async function BadgesPage() {
  const profile = await requireProfile()

  const [{ data: allBadges }, { data: earned }] = await Promise.all([
    supabaseAdmin.from('badges').select('*').eq('is_active', true),
    supabaseAdmin.from('user_badges').select('badge_id, earned_at').eq('user_id', profile.id),
  ])

  const earnedSet = new Set((earned || []).map((e: any) => e.badge_id))
  const earnedMap = Object.fromEntries((earned || []).map((e: any) => [e.badge_id, e.earned_at]))

  const sorted = (allBadges || []).sort((a: any, b: any) => {
    // Earned first, then by rarity
    const aEarned = earnedSet.has(a.id) ? 0 : 1
    const bEarned = earnedSet.has(b.id) ? 0 : 1
    if (aEarned !== bEarned) return aEarned - bEarned
    return (RARITY_ORDER as any)[a.rarity] - (RARITY_ORDER as any)[b.rarity]
  })

  const totalEarned = earnedSet.size
  const totalXP = (allBadges || [])
    .filter((b: any) => earnedSet.has(b.id))
    .reduce((sum: number, b: any) => sum + b.xp_reward, 0)

  const rarityBorderColor: Record<string, string> = {
    legendary: 'border-codex-gold/40',
    epic:      'border-codex-accent/40',
    rare:      'border-codex-info/40',
    common:    'border-codex-border',
  }
  const rarityGlow: Record<string, string> = {
    legendary: 'shadow-[0_0_20px_#f5a62318]',
    epic:      'shadow-[0_0_20px_#7c3aed18]',
    rare:      '',
    common:    '',
  }

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl text-codex-text mb-1">Badge Vault</h1>
        <p className="text-codex-muted text-sm">
          {totalEarned}/{sorted.length} earned · {totalXP.toLocaleString()} XP from badges
        </p>
      </div>

      {/* Summary bar */}
      <div className="cx-card p-5 mb-8 flex items-center gap-6 flex-wrap">
        {['legendary','epic','rare','common'].map(r => {
          const total = (allBadges || []).filter((b: any) => b.rarity === r).length
          const got   = (allBadges || []).filter((b: any) => b.rarity === r && earnedSet.has(b.id)).length
          return (
            <div key={r} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full
                ${r === 'legendary' ? 'bg-codex-gold' : r === 'epic' ? 'bg-codex-accent' : r === 'rare' ? 'bg-codex-info' : 'bg-codex-muted'}`} />
              <span className="text-xs text-codex-muted capitalize">{r}</span>
              <span className="text-xs font-bold text-codex-text">{got}/{total}</span>
            </div>
          )
        })}
        <div className="ml-auto cx-progress-bar flex-1 max-w-[200px]">
          <div className="cx-progress-fill bg-codex-gold"
            style={{ width: `${Math.round(totalEarned / sorted.length * 100)}%` }} />
        </div>
        <span className="text-xs text-codex-muted">{Math.round(totalEarned / sorted.length * 100)}% complete</span>
      </div>

      {/* Badge grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {sorted.map((badge: any) => {
          const isEarned = earnedSet.has(badge.id)
          const earnedAt = earnedMap[badge.id]

          return (
            <div key={badge.id}
              className={`relative cx-card-up border rounded-2xl p-4 text-center transition-all duration-300
                ${isEarned ? rarityBorderColor[badge.rarity] + ' ' + rarityGlow[badge.rarity] : 'border-codex-border opacity-50'}
                ${isEarned ? 'hover:-translate-y-0.5' : ''}`}>

              {/* Legendary sparkle */}
              {badge.rarity === 'legendary' && isEarned && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-codex-gold animate-pulse" />
              )}

              <div className={`text-3xl mb-2 ${!isEarned ? 'grayscale' : ''}`}>
                {isEarned ? badge.icon : '🔒'}
              </div>

              <div className={`text-[11px] font-bold mb-1 ${
                badge.rarity === 'legendary' ? 'text-codex-gold'
                : badge.rarity === 'epic' ? 'text-purple-400'
                : badge.rarity === 'rare' ? 'text-codex-info'
                : 'text-codex-text'}`}>
                {badge.name}
              </div>

              <div className="text-[9px] text-codex-muted leading-tight mb-2 line-clamp-2">
                {badge.description}
              </div>

              <div className="flex items-center justify-center gap-1.5">
                <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border
                  ${badge.rarity === 'legendary' ? 'cx-rarity-legendary'
                  : badge.rarity === 'epic' ? 'cx-rarity-epic'
                  : badge.rarity === 'rare' ? 'cx-rarity-rare'
                  : 'cx-rarity-common'}`}>
                  {badge.rarity}
                </span>
              </div>

              <div className="font-display font-bold text-codex-gold text-[11px] mt-2">
                +{badge.xp_reward} XP
              </div>

              {isEarned && earnedAt && (
                <div className="text-[9px] text-codex-muted mt-1">
                  {new Date(earnedAt).toLocaleDateString()}
                </div>
              )}

              {badge.xp_multiplier > 1 && isEarned && (
                <div className="text-[9px] text-codex-success font-bold mt-1">
                  ×{badge.xp_multiplier} XP boost
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

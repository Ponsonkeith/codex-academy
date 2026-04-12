// app/api/leaderboard/route.ts
// ─────────────────────────────────────────────────────────────
// GET /api/leaderboard — Paginated global leaderboard
// Also handles rank-change badge checks
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const limit  = parseInt(req.nextUrl.searchParams.get('limit')  || '20')
  const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0')

  const { data: rows } = await supabaseAdmin
    .from('leaderboard')
    .select('id,username,full_name,avatar_url,country,xp_total,xp_level,streak_current,plan,rank')
    .range(offset, offset + limit - 1)

  // Get current user's rank (if logged in)
  let userRank: any = null
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabaseAdmin
        .from('leaderboard')
        .select('rank,xp_total,xp_level,streak_current')
        .eq('id', user.id)
        .single()
      userRank = data

      // Check if user just cracked top 10 or top 3 → award badges
      if (data?.rank) await checkLeaderboardBadges(user.id, data.rank)
    }
  } catch {}

  return NextResponse.json({ rows, userRank, limit, offset })
}

async function checkLeaderboardBadges(userId: string, rank: number) {
  const badgesToCheck: Array<{ id: string; threshold: number }> = [
    { id: 'top10', threshold: 10 },
    { id: 'top3',  threshold: 3  },
  ]

  for (const { id, threshold } of badgesToCheck) {
    if (rank > threshold) continue

    const { data: existing } = await supabaseAdmin
      .from('user_badges')
      .select('id')
      .eq('user_id', userId)
      .eq('badge_id', id)
      .single()

    if (existing) continue

    const { data: badge } = await supabaseAdmin
      .from('badges')
      .select('xp_reward')
      .eq('id', id)
      .single()

    await supabaseAdmin.from('user_badges').insert({ user_id: userId, badge_id: id })

    if (badge?.xp_reward) {
      await supabaseAdmin.rpc('award_xp', {
        p_user_id: userId,
        p_amount: badge.xp_reward,
        p_reason: 'badge_earned',
        p_meta: { badge_id: id },
      })
    }
  }
}

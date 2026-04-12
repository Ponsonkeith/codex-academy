// app/api/community/route.ts
// ─────────────────────────────────────────────────────────────
// GET  /api/community?channel=general — Get posts
// POST /api/community — Create a post
// PUT  /api/community — Toggle like on a post
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { requireProfile, supabaseAdmin, createServerSupabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const channel = req.nextUrl.searchParams.get('channel') || 'general'
  const cursor  = req.nextUrl.searchParams.get('cursor')
  const limit   = 30

  let query = supabaseAdmin
    .from('community_posts')
    .select(`
      id, content, likes_count, created_at, channel, reply_to,
      profiles:user_id (id, username, full_name, avatar_url, xp_level, plan)
    `)
    .eq('channel', channel)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (cursor) query = query.lt('created_at', cursor)

  const { data: posts, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Get current user's liked post IDs (if logged in)
  let likedIds: string[] = []
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (user && posts?.length) {
      const { data: likes } = await supabaseAdmin
        .from('post_likes')
        .select('post_id')
        .eq('user_id', user.id)
        .in('post_id', posts.map(p => p.id))
      likedIds = likes?.map(l => l.post_id) || []
    }
  } catch {}

  const nextCursor = posts?.length === limit ? posts[posts.length - 1]?.created_at : null

  return NextResponse.json({ posts, likedIds, nextCursor })
}

export async function POST(req: NextRequest) {
  try {
    const profile = await requireProfile()
    const { content, channel = 'general', replyTo } = await req.json()

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }
    if (content.length > 2000) {
      return NextResponse.json({ error: 'Post too long (max 2000 chars)' }, { status: 400 })
    }

    const validChannels = ['general', 'ai-help', 'projects', 'off-topic']
    if (!validChannels.includes(channel)) {
      return NextResponse.json({ error: 'Invalid channel' }, { status: 400 })
    }

    const { data: post, error } = await supabaseAdmin
      .from('community_posts')
      .insert({
        user_id: profile.id,
        content: content.trim(),
        channel,
        reply_to: replyTo || null,
      })
      .select(`
        id, content, likes_count, created_at, channel,
        profiles:user_id (id, username, full_name, avatar_url, xp_level, plan)
      `)
      .single()

    if (error) throw error

    // Update post count
    await supabaseAdmin.from('profiles').update({
      community_posts: profile.community_posts + 1,
    }).eq('id', profile.id)

    // Check social badge (5 posts)
    if (profile.community_posts + 1 >= 5) {
      const { data: existing } = await supabaseAdmin
        .from('user_badges')
        .select('id')
        .eq('user_id', profile.id)
        .eq('badge_id', 'social_5')
        .single()

      if (!existing) {
        await supabaseAdmin.from('user_badges').insert({
          user_id: profile.id,
          badge_id: 'social_5',
        })
        await supabaseAdmin.rpc('award_xp', {
          p_user_id: profile.id,
          p_amount: 100,
          p_reason: 'badge_earned',
          p_meta: { badge_id: 'social_5' },
        })
      }
    }

    return NextResponse.json({ post }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const profile = await requireProfile()
    const { postId } = await req.json()

    if (!postId) return NextResponse.json({ error: 'postId required' }, { status: 400 })

    // Toggle like
    const { data: existing } = await supabaseAdmin
      .from('post_likes')
      .select('post_id')
      .eq('user_id', profile.id)
      .eq('post_id', postId)
      .single()

    if (existing) {
      // Unlike
      await supabaseAdmin.from('post_likes').delete()
        .eq('user_id', profile.id)
        .eq('post_id', postId)

      await supabaseAdmin.rpc('decrement_likes', { post_id: postId }) // use SQL function below
        .catch(() =>
          supabaseAdmin.from('community_posts')
            .update({ likes_count: supabaseAdmin.raw('likes_count - 1') })
            .eq('id', postId)
        )

      return NextResponse.json({ liked: false })
    } else {
      // Like
      await supabaseAdmin.from('post_likes').insert({ user_id: profile.id, post_id: postId })
      await supabaseAdmin.from('community_posts')
        .update({ likes_count: supabaseAdmin.rpc('increment', { x: 1 }) })
        .eq('id', postId)
        .catch(() => {})

      // Simpler approach: raw update
      await supabaseAdmin.rpc('increment_post_likes', { p_post_id: postId }).catch(() => {})

      return NextResponse.json({ liked: true })
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 })
  }
}

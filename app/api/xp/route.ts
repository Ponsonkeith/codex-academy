// app/api/xp/route.ts
// ─────────────────────────────────────────────────────────────
// POST /api/xp — Award XP for completing a lesson
// GET  /api/xp — Get XP history for current user
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { requireProfile, supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const profile = await requireProfile()
    const { lessonId, courseId } = await req.json()

    if (!lessonId || !courseId) {
      return NextResponse.json({ error: 'lessonId and courseId required' }, { status: 400 })
    }

    // Fetch lesson details
    const { data: lesson, error: lessonError } = await supabaseAdmin
      .from('lessons')
      .select('id, title, xp_reward, course_id')
      .eq('id', lessonId)
      .single()

    if (lessonError || !lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    // Check if already completed (don't double-award XP)
    const { data: existing } = await supabaseAdmin
      .from('lesson_progress')
      .select('id, completed')
      .eq('user_id', profile.id)
      .eq('lesson_id', lessonId)
      .single()

    if (existing?.completed) {
      return NextResponse.json({
        message: 'Already completed',
        xp_earned: 0,
        badges_earned: [],
      })
    }

    // Mark lesson as complete
    await supabaseAdmin.from('lesson_progress').upsert({
      user_id: profile.id,
      lesson_id: lessonId,
      course_id: courseId,
      completed: true,
      completed_at: new Date().toISOString(),
      xp_earned: lesson.xp_reward,
    }, { onConflict: 'user_id,lesson_id' })

    // Increment lesson counter on profile
    await supabaseAdmin.from('profiles').update({
      lessons_completed: profile.lessons_completed + 1,
    }).eq('id', profile.id)

    // Update streak
    const { data: newStreak } = await supabaseAdmin.rpc('update_streak', {
      p_user_id: profile.id,
    })

    // Award XP (stored procedure handles multipliers)
    const { data: xpEarned } = await supabaseAdmin.rpc('award_xp', {
      p_user_id: profile.id,
      p_amount: lesson.xp_reward,
      p_reason: 'lesson_complete',
      p_meta: { lesson_id: lessonId, course_id: courseId, lesson_title: lesson.title },
    })

    // Check and award any newly unlocked badges
    const { data: newBadges } = await supabaseAdmin.rpc('check_badges', {
      p_user_id: profile.id,
    })

    // Check if this completes the course
    const { data: progress } = await supabaseAdmin
      .from('course_progress')
      .select('is_complete, total_lessons, completed_lessons')
      .eq('user_id', profile.id)
      .eq('course_id', courseId)
      .single()

    let courseBadge = null
    if (progress?.is_complete && profile.lessons_completed === 1) {
      // First course completion badge
      const { data: badge } = await supabaseAdmin
        .from('badges')
        .select('xp_reward')
        .eq('id', 'course_first')
        .single()

      await supabaseAdmin.from('user_badges').upsert({
        user_id: profile.id,
        badge_id: 'course_first',
      }, { onConflict: 'user_id,badge_id', ignoreDuplicates: true })

      if (badge) {
        await supabaseAdmin.rpc('award_xp', {
          p_user_id: profile.id,
          p_amount: badge.xp_reward,
          p_reason: 'badge_earned',
          p_meta: { badge_id: 'course_first' },
        })
        courseBadge = 'course_first'
      }
    }

    // Fetch updated profile
    const { data: updatedProfile } = await supabaseAdmin
      .from('profiles')
      .select('xp_total, xp_level, xp_to_next, streak_current')
      .eq('id', profile.id)
      .single()

    return NextResponse.json({
      xp_earned: xpEarned,
      badges_earned: [...(newBadges || []), ...(courseBadge ? [courseBadge] : [])],
      streak: newStreak,
      profile: updatedProfile,
      course_complete: progress?.is_complete || false,
    })

  } catch (err: any) {
    console.error('[XP]', err)
    return NextResponse.json(
      { error: err.message || 'Failed to award XP' },
      { status: err.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const profile = await requireProfile()

    const { data: history } = await supabaseAdmin
      .from('xp_transactions')
      .select('amount, reason, meta, created_at')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(50)

    return NextResponse.json({ history, total: profile.xp_total })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 })
  }
}

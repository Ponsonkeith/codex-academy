// app/api/quiz/route.ts
// ─────────────────────────────────────────────────────────────
// POST /api/quiz — Submit quiz answers, grade them, award XP
// GET  /api/quiz?quiz_id=xxx — Get quiz questions
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { requireProfile, supabaseAdmin } from '@/lib/supabase'
import { generateQuizFeedback } from '@/lib/claude'

export async function GET(req: NextRequest) {
  try {
    const quizId = req.nextUrl.searchParams.get('quiz_id')
    if (!quizId) return NextResponse.json({ error: 'quiz_id required' }, { status: 400 })

    const { data: quiz } = await supabaseAdmin
      .from('quizzes')
      .select('*, quiz_questions(*)')
      .eq('id', quizId)
      .single()

    if (!quiz) return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })

    // Strip correct answers before sending to client
    const sanitized = {
      ...quiz,
      quiz_questions: quiz.quiz_questions.map((q: any) => ({
        id: q.id,
        question: q.question,
        options: q.options,
        sort_order: q.sort_order,
        // correct_index is NEVER sent to client
      })),
    }

    return NextResponse.json(sanitized)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const profile = await requireProfile()
    const { quizId, answers, timeTakenSecs } = await req.json()
    // answers: [{ questionId: string, selectedIndex: number }]

    if (!quizId || !answers) {
      return NextResponse.json({ error: 'quizId and answers required' }, { status: 400 })
    }

    // Fetch quiz with correct answers
    const { data: quiz } = await supabaseAdmin
      .from('quizzes')
      .select('*, quiz_questions(*)')
      .eq('id', quizId)
      .single()

    if (!quiz) return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })

    // Grade the quiz
    const questions = quiz.quiz_questions as any[]
    let correct = 0
    const wrongAnswers: any[] = []

    for (const answer of answers) {
      const question = questions.find((q: any) => q.id === answer.questionId)
      if (!question) continue

      if (question.correct_index === answer.selectedIndex) {
        correct++
      } else {
        wrongAnswers.push({
          question: question.question,
          userAnswer: question.options[answer.selectedIndex],
          correctAnswer: question.options[question.correct_index],
          explanation: question.explanation,
        })
      }
    }

    const score = Math.round((correct / questions.length) * 100)
    const passed = score >= quiz.pass_threshold
    const isPerfect = score === 100

    // Calculate XP reward
    let xpReward = 0
    if (passed) {
      xpReward = quiz.xp_reward
      if (isPerfect) xpReward += quiz.xp_perfect_bonus
    } else {
      xpReward = Math.round(quiz.xp_reward * (score / 100) * 0.5) // partial XP for effort
    }

    // Save attempt
    await supabaseAdmin.from('quiz_attempts').insert({
      user_id: profile.id,
      quiz_id: quizId,
      score,
      answers,
      passed,
      is_perfect: isPerfect,
      xp_earned: xpReward,
      time_taken_secs: timeTakenSecs,
    })

    // Update profile stats
    const profileUpdate: any = {
      quizzes_completed: profile.quizzes_completed + 1,
    }
    if (isPerfect) {
      profileUpdate.perfect_quizzes = profile.perfect_quizzes + 1
    }
    await supabaseAdmin.from('profiles').update(profileUpdate).eq('id', profile.id)

    // Award XP
    let xpEarned = 0
    if (xpReward > 0) {
      const { data } = await supabaseAdmin.rpc('award_xp', {
        p_user_id: profile.id,
        p_amount: xpReward,
        p_reason: passed ? 'quiz_passed' : 'quiz_attempted',
        p_meta: { quiz_id: quizId, score, is_perfect: isPerfect },
      })
      xpEarned = data
    }

    // Check for new badges (perfect quiz badge, etc.)
    const { data: newBadges } = await supabaseAdmin.rpc('check_badges', {
      p_user_id: profile.id,
    })

    // Generate AI feedback (async — don't block response)
    let feedback = ''
    try {
      feedback = await generateQuizFeedback(score, wrongAnswers, profile.full_name || profile.username)
    } catch {}

    // Return detailed results (WITH correct answers now)
    const detailedResults = questions.map((q: any) => {
      const userAnswer = answers.find((a: any) => a.questionId === q.id)
      return {
        question: q.question,
        options: q.options,
        correct_index: q.correct_index,
        selected_index: userAnswer?.selectedIndex ?? -1,
        is_correct: q.correct_index === userAnswer?.selectedIndex,
        explanation: q.explanation,
      }
    })

    return NextResponse.json({
      score,
      passed,
      is_perfect: isPerfect,
      correct,
      total: questions.length,
      xp_earned: xpEarned,
      badges_earned: newBadges || [],
      wrong_answers: wrongAnswers,
      detailed_results: detailedResults,
      ai_feedback: feedback,
    })

  } catch (err: any) {
    console.error('[Quiz]', err)
    return NextResponse.json(
      { error: err.message },
      { status: err.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}

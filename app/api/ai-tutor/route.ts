// app/api/ai-tutor/route.ts
// ─────────────────────────────────────────────────────────────
// POST /api/ai-tutor — Streaming AI tutor chat endpoint
// Requires learner or elite plan
// ─────────────────────────────────────────────────────────────

import { NextRequest } from 'next/server'
import { requireProfile, supabaseAdmin } from '@/lib/supabase'
import { streamTutorResponse, AI_TUTOR_LIMITS } from '@/lib/claude'

export async function POST(req: NextRequest) {
  let profile: any
  try {
    profile = await requireProfile()
  } catch {
    return new Response('Unauthorized', { status: 401 })
  }

  // ── Plan check ───────────────────────────────────────────
  const limit = AI_TUTOR_LIMITS[profile.plan] ?? 0
  if (limit === 0) {
    return new Response(
      JSON.stringify({ error: 'AI Tutor requires a Learner or Elite subscription' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // ── Monthly usage check (for Learner plan) ────────────────
  if (profile.plan === 'learner') {
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count } = await supabaseAdmin
      .from('ai_conversations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', profile.id)
      .gte('created_at', startOfMonth.toISOString())

    if ((count || 0) >= limit) {
      return new Response(
        JSON.stringify({ error: `Monthly AI Tutor limit (${limit} messages) reached. Upgrade to Elite for unlimited access.` }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }

  // ── Parse request ─────────────────────────────────────────
  const { messages, context, conversationId } = await req.json()

  if (!messages || !Array.isArray(messages)) {
    return new Response('messages array required', { status: 400 })
  }

  // ── Stream response ───────────────────────────────────────
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      let fullResponse = ''

      try {
        const tutorStream = await streamTutorResponse({ messages, context })

        for await (const chunk of tutorStream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            const text = chunk.delta.text
            fullResponse += text
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
          }
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'))

        // Save conversation to DB (fire and forget)
        const updatedMessages = [
          ...messages,
          { role: 'assistant', content: fullResponse, timestamp: new Date().toISOString() },
        ]

        if (conversationId) {
          await supabaseAdmin
            .from('ai_conversations')
            .update({ messages: updatedMessages, updated_at: new Date().toISOString() })
            .eq('id', conversationId)
            .eq('user_id', profile.id)
        } else {
          await supabaseAdmin.from('ai_conversations').insert({
            user_id: profile.id,
            lesson_id: context?.lessonId || null,
            messages: updatedMessages,
          })
        }

      } catch (err: any) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: err.message })}\n\n`)
        )
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

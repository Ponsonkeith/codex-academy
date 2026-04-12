// lib/claude.ts
// ─────────────────────────────────────────────────────────────
// Claude AI Tutor for Codex Academy
// ─────────────────────────────────────────────────────────────

import Anthropic from '@anthropic-ai/sdk'

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

// Monthly message limits per plan
export const AI_TUTOR_LIMITS: Record<string, number> = {
  explorer: 0,     // No AI tutor on free plan
  learner:  50,    // 50 messages/month
  elite:    99999, // Unlimited
}

// Build the AI Tutor system prompt
export function buildTutorSystemPrompt(context: {
  courseName: string
  lessonTitle: string
  lessonContent?: string
  userName: string
  userLevel: number
  userXP: number
}) {
  return `You are Axiom, the AI tutor for Codex Academy — the world's most elite AI learning platform.

Student: ${context.userName} (Level ${context.userLevel}, ${context.userXP.toLocaleString()} XP)
Current Course: ${context.courseName}
Current Lesson: ${context.lessonTitle}

${context.lessonContent ? `Lesson Context:\n${context.lessonContent}\n` : ''}

YOUR PERSONALITY:
- Brilliant, encouraging, and direct — like a world-class mentor
- Use analogies and real-world examples to make concepts stick
- Challenge the student when they're ready, but never make them feel stupid
- Celebrate progress and acknowledge effort
- If they seem stuck, guide them step-by-step without just giving the answer

YOUR RULES:
- Only teach topics relevant to AI, machine learning, data science, and the course content
- Keep responses focused and actionable — no fluff
- Use code examples when relevant (Python, pseudocode)
- If asked something outside your scope, redirect to learning
- Never complete assignments or quizzes FOR the student — guide them to the answer
- Format responses clearly with bullet points or numbered steps when listing things

Remember: Your mission is to help this student master AI and climb the Codex Academy leaderboard.`
}

// Stream a response from the AI Tutor
export async function streamTutorResponse({
  messages,
  context,
}: {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  context: Parameters<typeof buildTutorSystemPrompt>[0]
}) {
  return anthropic.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: buildTutorSystemPrompt(context),
    messages,
  })
}

// Generate quiz questions for a lesson (used by admin)
export async function generateQuizQuestions(
  lessonContent: string,
  count: number = 5
): Promise<Array<{ question: string; options: string[]; correct_index: number; explanation: string }>> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: `Generate ${count} challenging multiple-choice quiz questions for this AI lesson content. 
      
Return ONLY valid JSON array. Each question must have:
- question (string)
- options (array of 4 strings)  
- correct_index (0-3)
- explanation (brief explanation of why this is correct)

Lesson content:
${lessonContent}

Return format: [{"question":"...","options":["a","b","c","d"],"correct_index":0,"explanation":"..."}]`
    }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) throw new Error('Failed to parse quiz questions from AI response')
  return JSON.parse(jsonMatch[0])
}

// Generate personalized feedback on quiz performance
export async function generateQuizFeedback(
  score: number,
  wrongAnswers: Array<{ question: string; userAnswer: string; correctAnswer: string }>,
  userName: string
): Promise<string> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: `Give personalized, motivating feedback to ${userName} who scored ${score}% on a quiz.
      
${wrongAnswers.length > 0 ? `They got these questions wrong:\n${wrongAnswers.map(w => `Q: ${w.question}\nThey answered: ${w.userAnswer}\nCorrect: ${w.correctAnswer}`).join('\n\n')}` : 'They got everything correct!'}

Be specific, encouraging, and actionable. Keep it under 3 sentences.`
    }],
  })

  return response.content[0].type === 'text' ? response.content[0].text : ''
}

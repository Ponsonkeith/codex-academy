'use client'
// app/(app)/quiz/[courseSlug]/page.tsx
// Full quiz engine — timer, instant feedback, score reveal, badge unlock animation

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface Question {
  id: string
  question: string
  options: string[]
}

interface Result {
  question: string
  options: string[]
  correct_index: number
  selected_index: number
  is_correct: boolean
  explanation: string
}

// Mock quiz — replace with GET /api/quiz?quiz_id=xxx
const MOCK_QUIZ = {
  id: 'q1',
  title: 'AI Foundations — Module Quiz',
  pass_threshold: 70,
  xp_reward: 200,
  xp_perfect_bonus: 100,
  time_limit_secs: 300,
  quiz_questions: [
    { id: 'qq1', question: 'What does "supervised learning" mean?', options: ['Model learns from labeled data', 'Model learns without any labels', 'Model supervises other models', 'Model runs without a GPU'], sort_order: 0 },
    { id: 'qq2', question: 'Which activation function is most commonly used in hidden layers of deep neural networks?', options: ['Sigmoid', 'ReLU', 'Linear', 'Softmax'], sort_order: 1 },
    { id: 'qq3', question: 'What is overfitting?', options: ['Model accuracy is too low', 'Model memorises training data and fails to generalise', 'Model trains too slowly', 'Model uses too little data'], sort_order: 2 },
    { id: 'qq4', question: 'In gradient descent, what does the learning rate control?', options: ['Number of training epochs', 'Size of steps taken toward the minimum', 'Number of hidden layers', 'Size of the training dataset'], sort_order: 3 },
    { id: 'qq5', question: 'What is the difference between a validation set and a test set?', options: ['There is no difference', 'Validation is used during training to tune hyperparameters; test set is for final evaluation only', 'Test set is used during training; validation is for final evaluation', 'Validation is always larger than the test set'], sort_order: 4 },
  ],
}

type Phase = 'intro' | 'quiz' | 'reviewing' | 'results'

export default function QuizPage() {
  const params  = useParams()
  const router  = useRouter()

  const [quiz]        = useState(MOCK_QUIZ)
  const [phase, setPhase]       = useState<Phase>('intro')
  const [qi, setQi]             = useState(0)
  const [answers, setAnswers]   = useState<Record<string, number>>({})
  const [selected, setSelected] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)
  const [timeLeft, setTimeLeft] = useState(quiz.time_limit_secs)
  const [submitting, setSubmitting] = useState(false)
  const [results, setResults]   = useState<any>(null)
  const [showBadge, setShowBadge] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval>>()

  const questions = quiz.quiz_questions.sort((a, b) => a.sort_order - b.sort_order)
  const q = questions[qi]
  const progress = (qi / questions.length) * 100
  const timeColor = timeLeft < 30 ? '#ef4444' : timeLeft < 60 ? '#f5a623' : '#10b981'
  const mins = Math.floor(timeLeft / 60)
  const secs = timeLeft % 60

  useEffect(() => {
    if (phase !== 'quiz') return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); handleSubmit(); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [phase])

  const handleSelect = (idx: number) => {
    if (answered) return
    setSelected(idx)
    setAnswered(true)
    setAnswers(prev => ({ ...prev, [q.id]: idx }))
  }

  const handleNext = () => {
    if (qi + 1 >= questions.length) {
      clearInterval(timerRef.current)
      handleSubmit()
    } else {
      setQi(i => i + 1)
      setSelected(null)
      setAnswered(false)
    }
  }

  const handleSubmit = useCallback(async () => {
    setSubmitting(true)
    setPhase('reviewing')
    try {
      // In production: POST /api/quiz
      await new Promise(r => setTimeout(r, 1200))
      // Mock result
      const score = Math.round((Object.keys(answers).length / questions.length) * 80) + 20
      const isPerfect = score === 100
      setResults({
        score,
        passed: score >= quiz.pass_threshold,
        is_perfect: isPerfect,
        correct: Math.round(score / 100 * questions.length),
        total: questions.length,
        xp_earned: score >= quiz.pass_threshold ? quiz.xp_reward + (isPerfect ? quiz.xp_perfect_bonus : 0) : Math.round(quiz.xp_reward * 0.3),
        badges_earned: isPerfect ? ['quiz_perfect'] : [],
        detailed_results: questions.map((q, i) => ({
          question: q.question,
          options: q.options,
          correct_index: 0,
          selected_index: answers[q.id] ?? -1,
          is_correct: answers[q.id] === 0,
          explanation: 'Great reasoning! The key is understanding that supervised learning requires labeled training data to learn from.',
        })),
        ai_feedback: score >= 80
          ? "Outstanding performance! You clearly understand the core concepts. Your grasp of gradient descent and overfitting shows real depth."
          : "Good effort! Review the sections on overfitting and validation sets — those are the areas where you can improve most.",
      })
      setPhase('results')
      if (score === 100) setTimeout(() => setShowBadge(true), 600)
    } finally {
      setSubmitting(false)
    }
  }, [answers, questions, quiz])

  // ── INTRO ────────────────────────────────────────────────
  if (phase === 'intro') return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center">
        <div className="text-6xl mb-6">◆</div>
        <h1 className="font-display font-bold text-2xl text-codex-text mb-2">{quiz.title}</h1>
        <p className="text-codex-muted text-sm mb-8 leading-relaxed">
          {questions.length} questions · {Math.floor(quiz.time_limit_secs / 60)} minute limit · Pass at {quiz.pass_threshold}%
        </p>

        <div className="cx-card-up p-5 mb-8 text-left space-y-3">
          {[
            { icon: '⏱', text: `${Math.floor(quiz.time_limit_secs / 60)} minute time limit — stay sharp` },
            { icon: '💎', text: `Score 100% to unlock the Flawless badge (+${quiz.xp_perfect_bonus} bonus XP)` },
            { icon: '⚡', text: `Earn +${quiz.xp_reward} XP for passing — more for perfection` },
            { icon: '📖', text: 'Read explanations after to fill any gaps' },
          ].map((tip, i) => (
            <div key={i} className="flex items-start gap-3 text-sm">
              <span>{tip.icon}</span>
              <span className="text-codex-muted leading-relaxed">{tip.text}</span>
            </div>
          ))}
        </div>

        <button onClick={() => setPhase('quiz')} className="cx-btn-primary">
          Begin Challenge →
        </button>
        <div className="mt-4">
          <Link href="/courses" className="text-xs text-codex-muted hover:text-codex-gold transition-colors">
            Not ready? Go back to lessons
          </Link>
        </div>
      </div>
    </div>
  )

  // ── REVIEWING (submitting) ───────────────────────────────
  if (phase === 'reviewing') return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-codex-border border-t-codex-gold rounded-full animate-spin mx-auto mb-6" />
        <div className="font-display font-bold text-codex-text">Grading your answers...</div>
        <div className="text-xs text-codex-muted mt-2">Generating personalised feedback</div>
      </div>
    </div>
  )

  // ── RESULTS ─────────────────────────────────────────────
  if (phase === 'results' && results) {
    const { score, passed, is_perfect, xp_earned, badges_earned, detailed_results, ai_feedback } = results
    const ringColor = is_perfect ? '#f5a623' : passed ? '#10b981' : '#ef4444'
    const circumference = 2 * Math.PI * 52
    const strokeDash = circumference - (score / 100) * circumference

    return (
      <div className="h-full overflow-y-auto">

        {/* Badge unlock overlay */}
        {showBadge && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center"
            onClick={() => setShowBadge(false)}>
            <div className="text-center animate-[slideUp_0.4s_ease_forwards]">
              <div className="text-8xl mb-4 animate-[pulse_0.5s_ease_3]">💎</div>
              <div className="font-display font-black text-3xl text-codex-gold mb-2">BADGE UNLOCKED!</div>
              <div className="font-bold text-xl text-codex-text mb-1">Flawless</div>
              <div className="text-codex-muted text-sm mb-2">You scored 100% — absolute perfection.</div>
              <div className="cx-xp-badge text-base">+{quiz.xp_perfect_bonus} XP</div>
              <div className="text-xs text-codex-muted mt-6 opacity-60">Tap anywhere to continue</div>
            </div>
          </div>
        )}

        <div className="max-w-2xl mx-auto px-8 py-8">

          {/* Score card */}
          <div className={`cx-card p-8 text-center mb-8 relative overflow-hidden
            ${is_perfect ? 'ring-1 ring-codex-gold/40' : passed ? 'ring-1 ring-codex-success/30' : ''}`}>
            {is_perfect && <div className="absolute inset-0 bg-codex-gold/3 pointer-events-none" />}

            {/* Circular progress */}
            <div className="relative w-36 h-36 mx-auto mb-6">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="#1e2240" strokeWidth="10"/>
                <circle cx="60" cy="60" r="52" fill="none" stroke={ringColor} strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDash}
                  style={{ transition: 'stroke-dashoffset 1s ease' }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="font-display font-black text-4xl" style={{ color: ringColor }}>{score}%</div>
                <div className="text-xs text-codex-muted">{results.correct}/{results.total} correct</div>
              </div>
            </div>

            <div className="font-display font-bold text-2xl text-codex-text mb-1">
              {is_perfect ? '🏆 PERFECT SCORE!' : passed ? '✅ Passed!' : '❌ Not Passed'}
            </div>
            <p className="text-codex-muted text-sm mb-6 max-w-sm mx-auto">{ai_feedback}</p>

            <div className="flex items-center justify-center gap-6">
              <div className="text-center">
                <div className="font-display font-bold text-2xl text-codex-gold">{xp_earned}</div>
                <div className="text-xs text-codex-muted">XP Earned</div>
              </div>
              {badges_earned?.length > 0 && (
                <div className="text-center">
                  <div className="text-2xl">💎</div>
                  <div className="text-xs text-codex-muted">Badge Unlocked</div>
                </div>
              )}
              <div className="text-center">
                <div className="font-display font-bold text-2xl" style={{ color: ringColor }}>
                  {passed ? 'Pass' : 'Fail'}
                </div>
                <div className="text-xs text-codex-muted">Result</div>
              </div>
            </div>
          </div>

          {/* Review answers */}
          <div className="cx-section-title mb-4">Review Your Answers</div>
          <div className="space-y-4 mb-8">
            {detailed_results.map((r: Result, i: number) => (
              <div key={i}
                className={`cx-card p-5 border-l-4 ${r.is_correct ? 'border-l-codex-success' : 'border-l-codex-danger'}`}>
                <div className="flex items-start gap-3 mb-3">
                  <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                    ${r.is_correct ? 'bg-codex-success/20 text-codex-success' : 'bg-codex-danger/20 text-codex-danger'}`}>
                    {r.is_correct ? '✓' : '✗'}
                  </span>
                  <div className="font-medium text-sm text-codex-text">{r.question}</div>
                </div>

                <div className="space-y-1.5 ml-9 mb-3">
                  {r.options.map((opt: string, j: number) => (
                    <div key={j} className={`text-xs px-3 py-2 rounded-lg flex items-center gap-2
                      ${j === r.correct_index ? 'bg-codex-success/10 border border-codex-success/30 text-codex-success'
                        : j === r.selected_index && !r.is_correct ? 'bg-codex-danger/10 border border-codex-danger/30 text-codex-danger'
                        : 'text-codex-muted'}`}>
                      <span className="font-bold">{['A','B','C','D'][j]}.</span> {opt}
                      {j === r.correct_index && <span className="ml-auto font-bold">✓ Correct</span>}
                      {j === r.selected_index && !r.is_correct && <span className="ml-auto">Your answer</span>}
                    </div>
                  ))}
                </div>

                {r.explanation && (
                  <div className="ml-9 text-xs text-codex-muted bg-codex-surfaceUp border border-codex-border
                                  rounded-lg p-3 leading-relaxed">
                    💡 {r.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pb-6">
            <button onClick={() => { setPhase('intro'); setQi(0); setAnswers({}); setSelected(null); setAnswered(false); setTimeLeft(quiz.time_limit_secs); setResults(null); setShowBadge(false); }}
              className="cx-btn-ghost flex-shrink-0 w-auto px-5">
              Retry
            </button>
            <Link href="/dashboard" className="cx-btn-primary flex-1 text-center flex items-center justify-center">
              Back to Dashboard →
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── QUIZ ────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col">
      {/* Top bar */}
      <div className="flex-shrink-0 px-8 py-4 border-b border-codex-border bg-codex-surface flex items-center gap-6">
        {/* Progress dots */}
        <div className="flex gap-1.5">
          {questions.map((_, i) => (
            <div key={i} className={`h-2 rounded-full transition-all duration-300
              ${i < qi ? 'w-2 bg-codex-success'
                : i === qi ? 'w-6 bg-codex-gold'
                : 'w-2 bg-codex-border'}`} />
          ))}
        </div>
        <span className="text-xs text-codex-muted">{qi + 1} / {questions.length}</span>
        <div className="ml-auto flex items-center gap-2 font-display font-bold text-sm"
          style={{ color: timeColor }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" strokeWidth="2"/>
            <path d="M12 6v6l4 2" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          {String(mins).padStart(2,'0')}:{String(secs).padStart(2,'0')}
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 overflow-y-auto flex items-center justify-center p-8">
        <div className="w-full max-w-xl">
          {/* Question number */}
          <div className="flex items-center justify-between mb-6">
            <div className="font-display text-xs text-codex-gold tracking-wider">QUESTION {qi + 1}</div>
            <div className="cx-xp-badge">+{Math.round(MOCK_QUIZ.xp_reward / questions.length)} XP</div>
          </div>

          <h2 className="font-semibold text-xl text-codex-text mb-8 leading-relaxed">
            {q.question}
          </h2>

          {/* Options */}
          <div className="space-y-3 mb-8">
            {q.options.map((opt, i) => {
              let bg = 'bg-codex-surfaceUp', border = 'border-codex-border', text = 'text-codex-text'
              if (answered) {
                if (i === 0) { bg = 'bg-codex-success/10'; border = 'border-codex-success'; text = 'text-codex-success' }
                else if (i === selected && i !== 0) { bg = 'bg-codex-danger/10'; border = 'border-codex-danger'; text = 'text-codex-danger' }
                else { text = 'text-codex-muted' }
              } else if (selected === i) {
                bg = 'bg-codex-gold/10'; border = 'border-codex-gold'; text = 'text-codex-gold'
              }

              return (
                <button key={i} onClick={() => handleSelect(i)}
                  disabled={answered}
                  className={`w-full text-left px-5 py-4 rounded-xl border transition-all duration-200
                    flex items-center gap-4 group
                    ${bg} ${text}
                    border-${border}
                    ${!answered ? 'hover:border-codex-gold/50 hover:bg-codex-gold/5 cursor-pointer' : 'cursor-default'}
                    active:scale-[0.99]`}
                  style={{ borderColor: answered
                    ? i === 0 ? '#10b981' : i === selected && i !== 0 ? '#ef4444' : '#1e2240'
                    : selected === i ? '#f5a623' : '#1e2240' }}>

                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold
                                   flex-shrink-0 transition-all border
                    ${answered && i === 0 ? 'bg-codex-success/20 border-codex-success/40'
                      : answered && i === selected && i !== 0 ? 'bg-codex-danger/20 border-codex-danger/40'
                      : selected === i && !answered ? 'bg-codex-gold/20 border-codex-gold/40'
                      : 'bg-codex-border/20 border-codex-border'}`}>
                    {['A','B','C','D'][i]}
                  </div>

                  <span className="flex-1 text-sm leading-snug">{opt}</span>

                  {answered && i === 0 && <span className="font-bold text-codex-success ml-auto">✓</span>}
                  {answered && i === selected && i !== 0 && <span className="text-codex-danger ml-auto">✗</span>}
                </button>
              )
            })}
          </div>

          {answered && (
            <button onClick={handleNext} className="cx-btn-primary">
              {qi + 1 >= questions.length ? 'See My Results →' : 'Next Question →'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

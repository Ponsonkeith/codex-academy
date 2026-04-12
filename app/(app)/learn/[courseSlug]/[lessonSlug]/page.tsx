'use client'
// app/(app)/learn/[courseSlug]/[lessonSlug]/page.tsx
// Full lesson player — video, reading content, lesson nav, AI Tutor panel

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface Lesson {
  id: string
  title: string
  slug: string
  type: 'video' | 'reading' | 'quiz' | 'project'
  duration_mins: number
  xp_reward: number
  sort_order: number
  content?: string
  video_url?: string
  completed?: boolean
}

interface Course {
  id: string
  title: string
  slug: string
  color: string
  icon: string
  xp_reward: number
}

// Mock data so the page renders standalone (replace with real Supabase fetch)
const MOCK_CONTENT = `
## What is Supervised Learning?

Supervised learning is one of the most powerful paradigms in machine learning. The core idea is simple: **you train a model on a dataset where every example has both an input and a known correct output** (called a label).

The model learns to map inputs to outputs by minimising its prediction errors over thousands or millions of examples.

### The Training Loop

\`\`\`python
for epoch in range(num_epochs):
    for X_batch, y_batch in dataloader:
        # Forward pass
        predictions = model(X_batch)
        loss = criterion(predictions, y_batch)
        
        # Backward pass (gradient descent)
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()
\`\`\`

### Key Concepts

**Training data** is the labelled dataset the model learns from. Think of it like a textbook with an answer key.

**Validation data** is held out during training so you can check the model isn't just memorising — it needs to actually generalise.

**Test data** is your final exam. You only touch it once, after all training is complete.

> 🔑 The fundamental challenge: your model needs to generalise from training examples to unseen data. A model that perfectly memorises training data but fails on new examples has **overfit**.

### Types of Supervised Problems

**Classification** — predicting a category (spam/not spam, dog/cat/bird).

**Regression** — predicting a continuous value (house price, temperature, stock movement).

### Why Does It Work?

Mathematically, we're minimising a **loss function** — a measure of how wrong our predictions are. By taking thousands of small steps in the direction that reduces loss (gradient descent), the model's parameters gradually adjust until predictions become accurate.
`

export default function LearnPage() {
  const params   = useParams()
  const router   = useRouter()

  // In production: fetch from Supabase based on params.courseSlug + params.lessonSlug
  const [course]    = useState<Course>({ id: 'c1', title: 'AI Foundations', slug: 'ai-foundations', color: '#f5a623', icon: '🧠', xp_reward: 1200 })
  const [lessons]   = useState<Lesson[]>([
    { id: 'l1', title: 'What is AI?',                  slug: 'what-is-ai',              type: 'video',   duration_mins: 8,  xp_reward: 100, sort_order: 0, completed: true },
    { id: 'l2', title: 'History of Machine Learning',  slug: 'history-ml',              type: 'reading', duration_mins: 12, xp_reward: 80,  sort_order: 1, completed: true },
    { id: 'l3', title: 'Types of AI Systems',          slug: 'types-of-ai',             type: 'video',   duration_mins: 10, xp_reward: 100, sort_order: 2, completed: true },
    { id: 'l4', title: 'Supervised vs Unsupervised',   slug: 'supervised-unsupervised', type: 'reading', duration_mins: 15, xp_reward: 120, sort_order: 3, completed: false },
    { id: 'l5', title: 'Neural Network Basics',        slug: 'neural-network-basics',   type: 'video',   duration_mins: 18, xp_reward: 140, sort_order: 4, completed: false },
    { id: 'l6', title: 'Training Your First Model',    slug: 'first-model',             type: 'project', duration_mins: 30, xp_reward: 200, sort_order: 5, completed: false },
    { id: 'l7', title: 'Module Quiz',                  slug: 'module-quiz',             type: 'quiz',    duration_mins: 10, xp_reward: 200, sort_order: 6, completed: false },
  ])

  const [activeIdx, setActiveIdx]     = useState(3)
  const [completed, setCompleted]     = useState(new Set(['l1','l2','l3']))
  const [showTutor, setShowTutor]     = useState(false)
  const [xpPopup, setXpPopup]         = useState<number | null>(null)
  const [marking, setMarking]         = useState(false)
  const [tutorMessages, setTutorMessages] = useState<Array<{role:string;content:string}>>([])
  const [tutorInput, setTutorInput]   = useState('')
  const [tutorLoading, setTutorLoading] = useState(false)
  const tutorBottomRef = useRef<HTMLDivElement>(null)

  const lesson = lessons[activeIdx]
  const completedCount = completed.size
  const pct = Math.round((completedCount / lessons.length) * 100)

  useEffect(() => { tutorBottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [tutorMessages])

  const markComplete = async () => {
    if (completed.has(lesson.id) || marking) return
    setMarking(true)
    try {
      // In production: POST /api/xp with lessonId + courseId
      await new Promise(r => setTimeout(r, 600))
      setCompleted(prev => new Set([...prev, lesson.id]))
      setXpPopup(lesson.xp_reward)
      setTimeout(() => setXpPopup(null), 2000)
      // Auto-advance
      if (activeIdx < lessons.length - 1) {
        setTimeout(() => setActiveIdx(i => i + 1), 800)
      }
    } finally {
      setMarking(false)
    }
  }

  const sendTutor = async () => {
    if (!tutorInput.trim() || tutorLoading) return
    const userMsg = tutorInput.trim()
    setTutorInput('')
    setTutorMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setTutorLoading(true)

    // Stream from /api/ai-tutor
    try {
      const res = await fetch('/api/ai-tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...tutorMessages, { role: 'user', content: userMsg }],
          context: {
            courseName: course.title,
            lessonTitle: lesson.title,
            lessonContent: MOCK_CONTENT,
            userName: 'Alex',
            userLevel: 8,
            userXP: 12800,
          },
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        setTutorMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${err.error || 'Upgrade to Learner or Elite to use the AI Tutor.'}` }])
        return
      }

      let fullText = ''
      setTutorMessages(prev => [...prev, { role: 'assistant', content: '' }])

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '))
        for (const line of lines) {
          const data = line.slice(6)
          if (data === '[DONE]') break
          try {
            const { text } = JSON.parse(data)
            if (text) {
              fullText += text
              setTutorMessages(prev => {
                const next = [...prev]
                next[next.length - 1] = { role: 'assistant', content: fullText }
                return next
              })
            }
          } catch {}
        }
      }
    } catch (e) {
      setTutorMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Please try again.' }])
    } finally {
      setTutorLoading(false)
    }
  }

  const typeIcon = (type: string) => type === 'video' ? '▶' : type === 'reading' ? '📄' : type === 'quiz' ? '◆' : '🔨'
  const typeColor = (type: string) => type === 'quiz' ? '#7c3aed' : type === 'project' ? '#10b981' : '#f5a623'

  return (
    <div className="flex h-full overflow-hidden">

      {/* ── Lesson Sidebar ────────────────────────── */}
      <aside className="w-64 border-r border-codex-border bg-codex-surface flex flex-col flex-shrink-0 overflow-hidden">
        {/* Course header */}
        <div className="px-4 py-4 border-b border-codex-border flex-shrink-0">
          <Link href="/courses" className="text-xs text-codex-muted hover:text-codex-gold transition-colors mb-2 block">
            ← Courses
          </Link>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">{course.icon}</span>
            <div className="font-semibold text-sm text-codex-text truncate">{course.title}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-codex-border rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: course.color }} />
            </div>
            <span className="text-xs text-codex-muted flex-shrink-0">{pct}%</span>
          </div>
          <div className="text-xs text-codex-muted mt-1">{completedCount}/{lessons.length} lessons</div>
        </div>

        {/* Lesson list */}
        <div className="flex-1 overflow-y-auto py-2">
          {lessons.map((l, i) => {
            const done = completed.has(l.id)
            const active = i === activeIdx
            return (
              <button key={l.id} onClick={() => setActiveIdx(i)}
                className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-all duration-150 border-l-2
                  ${active
                    ? 'bg-codex-gold/8 border-l-codex-gold'
                    : 'border-l-transparent hover:bg-codex-surfaceUp'}`}>
                {/* Step indicator */}
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 transition-all
                  ${done ? 'bg-codex-success text-black' : active ? 'bg-codex-gold text-black' : 'bg-codex-border text-codex-muted'}`}>
                  {done ? '✓' : i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-xs font-medium leading-tight mb-1
                    ${active ? 'text-codex-gold' : done ? 'text-codex-muted' : 'text-codex-text'}`}>
                    {l.title}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px]" style={{ color: typeColor(l.type) }}>{typeIcon(l.type)}</span>
                    <span className="text-[10px] text-codex-muted">{l.duration_mins} min</span>
                    <span className="text-[10px] font-bold text-codex-gold">+{l.xp_reward}</span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* AI Tutor toggle */}
        <div className="border-t border-codex-border p-3 flex-shrink-0">
          <button onClick={() => setShowTutor(t => !t)}
            className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all
              ${showTutor
                ? 'bg-codex-accent/20 border border-codex-accent/40 text-purple-400'
                : 'bg-codex-surfaceUp border border-codex-border text-codex-muted hover:text-codex-text hover:border-codex-accent/40'}`}>
            🤖 {showTutor ? 'Hide Axiom' : 'Ask Axiom AI'}
          </button>
        </div>
      </aside>

      {/* ── Main content area ─────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Lesson content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-8 py-8">

            {/* Lesson meta */}
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs text-codex-muted uppercase tracking-wider">
                Lesson {activeIdx + 1} of {lessons.length}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-md font-bold"
                style={{ color: typeColor(lesson.type), background: `${typeColor(lesson.type)}15`, border: `1px solid ${typeColor(lesson.type)}30` }}>
                {typeIcon(lesson.type)} {lesson.type.charAt(0).toUpperCase() + lesson.type.slice(1)}
              </span>
              <span className="cx-xp-badge ml-auto">+{lesson.xp_reward} XP</span>
            </div>

            <h1 className="font-display font-bold text-2xl text-codex-text mb-6">{lesson.title}</h1>

            {/* Video player */}
            {lesson.type === 'video' && (
              <div className="bg-codex-surfaceUp border border-codex-border rounded-2xl mb-8 overflow-hidden"
                style={{ aspectRatio: '16/7' }}>
                <div className="h-full flex flex-col items-center justify-center gap-4 relative">
                  <div className="absolute inset-0"
                    style={{ background: `radial-gradient(ellipse at center, ${course.color}12 0%, transparent 70%)` }} />
                  {lesson.video_url ? (
                    <video controls className="w-full h-full object-cover">
                      <source src={lesson.video_url} type="video/mp4" />
                    </video>
                  ) : (
                    <>
                      <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl cursor-pointer
                                      transition-transform hover:scale-105 relative z-10"
                        style={{ background: `${course.color}20`, border: `2px solid ${course.color}60` }}>
                        ▶
                      </div>
                      <div className="text-sm text-codex-muted relative z-10">{course.title} · {lesson.title}</div>
                      <div className="text-xs text-codex-muted relative z-10 bg-codex-bg/60 px-3 py-1 rounded-full border border-codex-border">
                        Upload video to Supabase Storage → set lesson.video_url
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Reading content */}
            {(lesson.type === 'reading' || lesson.type === 'video') && (
              <div className="lesson-content mb-8"
                dangerouslySetInnerHTML={{ __html: markdownToHtml(MOCK_CONTENT) }} />
            )}

            {/* Project lesson */}
            {lesson.type === 'project' && (
              <div className="space-y-4 mb-8">
                <div className="cx-card-up border-codex-success/30 p-6 rounded-xl border">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">🔨</span>
                    <div>
                      <div className="font-semibold text-codex-text">Hands-on Project</div>
                      <div className="text-xs text-codex-muted">Apply what you've learned</div>
                    </div>
                    <span className="cx-xp-badge ml-auto">+{lesson.xp_reward} XP</span>
                  </div>
                  <p className="text-sm text-codex-muted leading-relaxed mb-4">
                    Build and train your first classification model using scikit-learn. You'll use the Iris dataset to classify flower species based on petal and sepal measurements.
                  </p>
                  <div className="bg-codex-bg rounded-xl p-4 font-mono text-sm text-codex-success border border-codex-border">
                    <div className="text-codex-muted text-xs mb-2"># starter code</div>
                    {`from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier

iris = load_iris()
X_train, X_test, y_train, y_test = train_test_split(
    iris.data, iris.target, test_size=0.2, random_state=42
)

# TODO: Train and evaluate your model`}
                  </div>
                </div>
              </div>
            )}

            {/* Quiz redirect */}
            {lesson.type === 'quiz' && (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">◆</div>
                <h2 className="font-display font-bold text-xl text-codex-text mb-2">Module Challenge</h2>
                <p className="text-codex-muted text-sm mb-6 max-w-sm mx-auto">
                  Test everything you've learned in this module. Score 100% to unlock the 💎 Flawless badge.
                </p>
                <Link href={`/quiz/${course.slug}`}
                  className="inline-block cx-btn-primary w-auto px-8">
                  Start Challenge →
                </Link>
              </div>
            )}

            {/* Complete button */}
            {lesson.type !== 'quiz' && (
              <div className="flex gap-3 mt-6 pb-6">
                <button onClick={() => setActiveIdx(Math.max(0, activeIdx - 1))}
                  disabled={activeIdx === 0}
                  className="cx-btn-ghost w-auto px-5 flex-shrink-0 disabled:opacity-30">
                  ←
                </button>

                {completed.has(lesson.id) ? (
                  <button onClick={() => activeIdx < lessons.length - 1 && setActiveIdx(i => i + 1)}
                    className="cx-btn-primary flex-1">
                    {activeIdx < lessons.length - 1 ? 'Next Lesson →' : '🏆 Course Complete!'}
                  </button>
                ) : (
                  <button onClick={markComplete} disabled={marking}
                    className="cx-btn-primary flex-1 flex items-center justify-center gap-2">
                    {marking
                      ? <><span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Saving...</>
                      : <><span>✓</span> Mark Complete & Earn {lesson.xp_reward} XP</>}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── AI Tutor Panel ─────────────────────── */}
        {showTutor && (
          <div className="w-80 border-l border-codex-border flex flex-col bg-codex-surface flex-shrink-0">
            {/* Header */}
            <div className="px-4 py-3 border-b border-codex-border flex items-center gap-3 flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-codex-accent/20 border border-codex-accent/40
                              flex items-center justify-center text-sm">🤖</div>
              <div>
                <div className="text-xs font-bold text-codex-text">Axiom</div>
                <div className="text-[10px] text-codex-success">● Online</div>
              </div>
              <button onClick={() => setShowTutor(false)}
                className="ml-auto text-codex-muted hover:text-codex-text text-lg leading-none">×</button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {tutorMessages.length === 0 ? (
                <div className="space-y-2">
                  <div className="bg-codex-surfaceUp border border-codex-border rounded-xl rounded-tl-sm p-3 text-xs text-codex-muted leading-relaxed">
                    Hi! I'm Axiom, your AI tutor. I'm trained on this lesson and ready to help you master <strong className="text-codex-text">{lesson.title}</strong>. What would you like to understand better?
                  </div>
                  <div className="flex flex-col gap-1.5 mt-3">
                    {[
                      'Explain this with an analogy',
                      'What should I focus on?',
                      'Give me a harder example',
                    ].map(s => (
                      <button key={s} onClick={() => { setTutorInput(s); }}
                        className="text-left text-xs px-3 py-2 bg-codex-surfaceUp border border-codex-border
                                   rounded-lg hover:border-codex-accent/40 hover:text-codex-text
                                   text-codex-muted transition-all">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                tutorMessages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'flex-row-reverse' : ''} gap-2`}>
                    {m.role === 'assistant' && (
                      <div className="w-6 h-6 rounded-full bg-codex-accent/20 border border-codex-accent/40
                                      flex items-center justify-center text-xs flex-shrink-0 mt-0.5">🤖</div>
                    )}
                    <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed
                      ${m.role === 'user'
                        ? 'bg-codex-gold/15 border border-codex-gold/30 text-codex-text rounded-tr-sm'
                        : 'bg-codex-surfaceUp border border-codex-border text-codex-muted rounded-tl-sm'}`}>
                      {m.content || <span className="inline-block w-3 h-3 border border-codex-muted rounded-full animate-spin border-t-transparent" />}
                    </div>
                  </div>
                ))
              )}
              <div ref={tutorBottomRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-codex-border flex gap-2 flex-shrink-0">
              <input value={tutorInput} onChange={e => setTutorInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendTutor())}
                placeholder="Ask Axiom anything..."
                className="flex-1 bg-codex-surfaceUp border border-codex-border rounded-lg px-3 py-2
                           text-xs text-codex-text placeholder:text-codex-muted/50
                           focus:outline-none focus:border-codex-accent/50 transition-all" />
              <button onClick={sendTutor} disabled={!tutorInput.trim() || tutorLoading}
                className="w-8 h-8 rounded-lg bg-codex-accent flex items-center justify-center
                           text-white text-xs font-bold flex-shrink-0 disabled:opacity-40
                           hover:bg-codex-accentDim transition-all active:scale-95">
                {tutorLoading ? '…' : '↑'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── XP Popup ──────────────────────────────── */}
      {xpPopup && (
        <div className="fixed top-20 right-8 z-50 bg-codex-gold text-black font-display font-bold
                        px-5 py-3 rounded-xl text-sm shadow-lg pointer-events-none
                        animate-[slideUp_0.3s_ease_forwards]">
          +{xpPopup} XP 🔥
        </div>
      )}
    </div>
  )
}

// Minimal markdown → HTML (in production use remark/rehype or MDX)
function markdownToHtml(md: string): string {
  return md
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/```(\w+)?\n([\s\S]+?)```/g, '<pre><code>$2</code></pre>')
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/^\*\*(.+)\*\* — (.+)$/gm, '<p><strong>$1</strong> — $2</p>')
    .replace(/^(.+)$/gm, (line) => {
      if (line.startsWith('<')) return line
      if (!line.trim()) return ''
      return `<p>${line}</p>`
    })
    .replace(/\n\n+/g, '\n')
}

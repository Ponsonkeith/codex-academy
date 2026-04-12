// app/page.tsx  — Landing / Marketing page
import Link from 'next/link'

const STATS = [
  { value: '50+',  label: 'AI Courses' },
  { value: '12k+', label: 'Active Learners' },
  { value: '200+', label: 'Badges to Earn' },
  { value: '4.9★', label: 'Avg Rating' },
]

const FEATURES = [
  {
    icon: '🧠',
    title: 'Structured AI Curriculum',
    desc: 'From neural networks to LLMs — every concept, zero fluff. Built by AI researchers.',
  },
  {
    icon: '👑',
    title: 'Global Leaderboard',
    desc: 'Compete with 12,000+ learners worldwide. Top performers earn legendary badges and XP multipliers.',
  },
  {
    icon: '💎',
    title: 'Challenge & Badge System',
    desc: '200+ badges across 5 rarity tiers. Streak bonuses, perfect quiz rewards, and course completions.',
  },
  {
    icon: '🤖',
    title: 'AI Tutor (Axiom)',
    desc: 'Powered by Claude. Ask anything, get instant explanations, challenge yourself with follow-up questions.',
  },
  {
    icon: '🤝',
    title: 'Elite Community',
    desc: 'Real-time channels for questions, projects, and collaboration with the sharpest AI learners on Earth.',
  },
  {
    icon: '🏆',
    title: 'Verified Certificates',
    desc: 'Complete courses and earn blockchain-verified certificates recognised by top AI companies.',
  },
]

const COURSES = [
  { icon: '🧠', title: 'AI Foundations',       level: 'Beginner',     xp: '1,200 XP', color: '#f5a623' },
  { icon: '⚙️', title: 'Machine Learning Core', level: 'Intermediate', xp: '2,400 XP', color: '#7c3aed' },
  { icon: '🔗', title: 'Neural Networks',       level: 'Advanced',     xp: '3,600 XP', color: '#10b981' },
  { icon: '💬', title: 'LLMs & Prompting',      level: 'Intermediate', xp: '2,000 XP', color: '#3b82f6' },
  { icon: '🛡️', title: 'AI Ethics & Safety',    level: 'Beginner',     xp: '1,000 XP', color: '#ef4444' },
  { icon: '📊', title: 'Data Science for AI',   level: 'Intermediate', xp: '2,200 XP', color: '#f59e0b' },
]

const TESTIMONIALS = [
  { name: 'Zara Chen', role: 'ML Engineer @ DeepMind', avatar: 'ZC', text: 'Codex Academy is the only platform that actually made deep learning click for me. The badge system kept me hooked for 3 months straight.', stars: 5 },
  { name: 'Marcus Obi', role: 'AI Researcher', avatar: 'MO', text: "Went from zero Python to deploying my own transformer model in 8 weeks. The AI tutor answered every stupid question I had at 2am.", stars: 5 },
  { name: 'Lena Kovač', role: 'Founder, AI Startup', avatar: 'LK', text: "The leaderboard is addictive in the best way. I genuinely learned faster because I didn't want to lose my top 3 spot.", stars: 5 },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-codex-bg">

      {/* ── Nav ─────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-codex-border/50 backdrop-blur-md bg-codex-bg/80">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="font-display font-black text-xl tracking-wider">
            <span className="text-codex-gold">CODEX</span>
            <span className="text-codex-text ml-1">ACADEMY</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-sm text-codex-muted hover:text-codex-text transition-colors">
              Sign in
            </Link>
            <Link href="/auth/signup"
              className="text-sm font-bold bg-codex-gold text-black px-4 py-2 rounded-xl hover:bg-codex-goldDim transition-all">
              Start Free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────── */}
      <section className="relative pt-40 pb-24 px-6 overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px]
                        bg-codex-accent/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-20 left-1/4 w-[300px] h-[300px]
                        bg-codex-gold/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-codex-gold/10 border border-codex-gold/30
                          rounded-full px-4 py-1.5 mb-8">
            <span className="w-2 h-2 rounded-full bg-codex-gold animate-pulse" />
            <span className="text-xs font-bold text-codex-gold tracking-wider uppercase">
              12,847 learners online now
            </span>
          </div>

          <h1 className="font-display font-black text-6xl md:text-7xl leading-[1.05] mb-6">
            <span className="text-codex-text">MASTER</span>
            <br />
            <span className="text-codex-gold">ARTIFICIAL</span>
            <br />
            <span className="text-codex-text">INTELLIGENCE</span>
          </h1>

          <p className="text-lg text-codex-muted max-w-xl mx-auto leading-relaxed mb-10">
            The most rigorous AI curriculum on Earth. Earn badges, dominate the leaderboard,
            and get guided by an AI tutor available 24/7.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/auth/signup"
              className="font-bold text-base bg-codex-gold text-black px-8 py-4 rounded-xl
                         hover:bg-codex-goldDim transition-all active:scale-[0.98]">
              Start Learning Free →
            </Link>
            <Link href="#courses"
              className="font-medium text-base text-codex-muted border border-codex-border
                         px-8 py-4 rounded-xl hover:border-codex-gold/40 hover:text-codex-text transition-all">
              Browse Courses
            </Link>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-12 mt-16 flex-wrap">
            {STATS.map(s => (
              <div key={s.label} className="text-center">
                <div className="font-display font-black text-3xl text-codex-gold">{s.value}</div>
                <div className="text-xs text-codex-muted mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="cx-section-title mb-3">Why Codex Academy</div>
            <h2 className="font-display font-bold text-4xl text-codex-text">
              Built Different. Engineered to Last.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(f => (
              <div key={f.title} className="cx-card cx-hover-gold p-6 group">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-semibold text-codex-text mb-2 text-base">{f.title}</h3>
                <p className="text-sm text-codex-muted leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Courses ─────────────────────────────────── */}
      <section id="courses" className="py-24 px-6 bg-codex-surface/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="cx-section-title mb-3">Course Library</div>
            <h2 className="font-display font-bold text-4xl text-codex-text">
              Every AI Concept. Zero Compromise.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {COURSES.map(c => (
              <div key={c.title}
                className="cx-card-up cx-hover-gold p-6 cursor-pointer group"
                style={{ borderColor: `${c.color}18` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                    style={{ background: `${c.color}15`, border: `1px solid ${c.color}30` }}>
                    {c.icon}
                  </div>
                  <span className="cx-xp-badge">{c.xp}</span>
                </div>
                <h3 className="font-semibold text-codex-text mb-1">{c.title}</h3>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-codex-muted">{c.level}</span>
                  <span className="text-xs font-bold transition-all group-hover:translate-x-1 duration-200"
                    style={{ color: c.color }}>
                    View →
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/auth/signup"
              className="inline-flex font-bold text-sm text-codex-gold border border-codex-gold/30
                         px-6 py-3 rounded-xl hover:bg-codex-gold/10 transition-all">
              View All 50+ Courses →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Leaderboard teaser ──────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="cx-card overflow-hidden">
            <div className="bg-codex-gold/5 border-b border-codex-border px-8 py-6 flex items-center justify-between">
              <div>
                <div className="cx-section-title mb-1">Global Leaderboard</div>
                <h2 className="font-display font-bold text-2xl text-codex-text">Where Will You Rank?</h2>
              </div>
              <div className="text-4xl">🏆</div>
            </div>
            <div className="divide-y divide-codex-border/50">
              {[
                { rank: 1, name: 'Zara Chen',  xp: '18,450', badge: '👑', streak: 42, country: '🇸🇬' },
                { rank: 2, name: 'Marcus Obi', xp: '16,200', badge: '⚡', streak: 38, country: '🇳🇬' },
                { rank: 3, name: 'Lena Kovač', xp: '15,100', badge: '💎', streak: 31, country: '🇭🇷' },
                { rank: 4, name: 'You?',       xp: '???',    badge: '🔒', streak: 0,  country: '🌍', isPlaceholder: true },
              ].map(u => (
                <div key={u.rank} className={`px-8 py-4 flex items-center gap-4 ${u.isPlaceholder ? 'opacity-40' : ''}`}>
                  <div className="font-display font-bold w-8 text-center"
                    style={{ color: u.rank === 1 ? '#f5a623' : u.rank === 2 ? '#c0c0c0' : u.rank === 3 ? '#cd7f32' : '#6b7280' }}>
                    {u.rank === 1 ? '🥇' : u.rank === 2 ? '🥈' : u.rank === 3 ? '🥉' : '#4'}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-codex-text text-sm">{u.name} {u.country}</div>
                    <div className="text-xs text-codex-muted">🔥 {u.streak} day streak</div>
                  </div>
                  <div className="text-right">
                    <div className="font-display font-bold text-codex-gold text-sm">{u.xp}</div>
                    <div className="text-xs text-codex-muted">XP</div>
                  </div>
                  <div className="text-xl">{u.badge}</div>
                </div>
              ))}
            </div>
            <div className="p-6 text-center border-t border-codex-border">
              <Link href="/auth/signup"
                className="cx-btn-primary inline-block w-auto px-8">
                Claim Your Spot →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ────────────────────────────── */}
      <section className="py-24 px-6 bg-codex-surface/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="cx-section-title mb-3">Student Stories</div>
            <h2 className="font-display font-bold text-4xl text-codex-text">
              Heard Enough? They Thought So Too.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="cx-card p-6">
                <div className="flex mb-3">
                  {'★'.repeat(t.stars).split('').map((s, i) => (
                    <span key={i} className="text-codex-gold text-sm">{s}</span>
                  ))}
                </div>
                <p className="text-sm text-codex-muted leading-relaxed mb-6 italic">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-codex-accent flex items-center justify-center
                                  text-xs font-bold text-white flex-shrink-0">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-codex-text">{t.name}</div>
                    <div className="text-xs text-codex-muted">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="cx-card p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-codex-gold/5 pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px]
                            bg-codex-gold/10 rounded-full blur-[60px] pointer-events-none" />
            <div className="relative">
              <div className="font-display font-black text-5xl text-codex-text mb-4">
                READY TO<br />
                <span className="text-codex-gold">ASCEND?</span>
              </div>
              <p className="text-codex-muted mb-8 max-w-md mx-auto">
                Join 12,000+ elite AI learners. Start free. Upgrade when you're ready.
              </p>
              <Link href="/auth/signup"
                className="inline-block font-bold text-base bg-codex-gold text-black px-10 py-4
                           rounded-xl hover:bg-codex-goldDim transition-all active:scale-[0.98]">
                Start Your Journey — It&apos;s Free
              </Link>
              <div className="text-xs text-codex-muted mt-4">No credit card required · Cancel anytime</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────── */}
      <footer className="border-t border-codex-border py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="font-display font-black text-lg tracking-wider">
            <span className="text-codex-gold">CODEX</span>
            <span className="text-codex-text ml-1">ACADEMY</span>
          </div>
          <div className="flex gap-8 text-sm text-codex-muted">
            <a href="#" className="hover:text-codex-text transition-colors">Privacy</a>
            <a href="#" className="hover:text-codex-text transition-colors">Terms</a>
            <a href="#" className="hover:text-codex-text transition-colors">Support</a>
            <a href="#" className="hover:text-codex-text transition-colors">Blog</a>
          </div>
          <div className="text-xs text-codex-muted">© 2025 Codex Academy. All rights reserved.</div>
        </div>
      </footer>
    </div>
  )
}

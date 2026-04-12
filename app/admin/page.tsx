'use client'
// app/admin/page.tsx — Full admin panel for Codex Academy

import { useState, useEffect } from 'react'
import { createBrowserSupabase } from '@/lib/supabase'

type Tab = 'overview' | 'courses' | 'lessons' | 'users' | 'badges'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'overview', label: 'Overview',  icon: '◈' },
  { id: 'courses',  label: 'Courses',   icon: '◉' },
  { id: 'lessons',  label: 'Lessons',   icon: '▶' },
  { id: 'users',    label: 'Users',     icon: '◎' },
  { id: 'badges',   label: 'Badges',    icon: '✦' },
]

// Mock analytics data (replace with real Supabase queries)
const MOCK_STATS = {
  totalUsers:      1247,
  activeToday:      312,
  totalRevenue:   24180,
  mrrGrowth:       +18,
  lessonsCompleted: 8934,
  avgStreak:         4.7,
  eliteUsers:        89,
  learnerUsers:      423,
}

const MOCK_COURSES = [
  { id: 'c1', title: 'AI Foundations',       level: 'Beginner',     lessons: 12, enrolled: 987, completion: 68, xp_reward: 1200, published: true,  color: '#f5a623' },
  { id: 'c2', title: 'Machine Learning Core', level: 'Intermediate', lessons: 18, enrolled: 654, completion: 42, xp_reward: 2400, published: true,  color: '#7c3aed' },
  { id: 'c3', title: 'Neural Networks',       level: 'Advanced',     lessons: 24, enrolled: 213, completion: 21, xp_reward: 3600, published: true,  color: '#10b981' },
  { id: 'c4', title: 'LLMs & Prompting',      level: 'Intermediate', lessons: 15, enrolled: 445, completion: 55, xp_reward: 2000, published: true,  color: '#3b82f6' },
  { id: 'c5', title: 'AI Ethics & Safety',    level: 'Beginner',     lessons: 10, enrolled: 789, completion: 81, xp_reward: 1000, published: true,  color: '#ef4444' },
  { id: 'c6', title: 'Computer Vision',       level: 'Advanced',     lessons: 20, enrolled: 0,   completion: 0,  xp_reward: 3000, published: false, color: '#f59e0b' },
]

const MOCK_USERS = [
  { id: 'u1', name: 'Zara Chen',  email: 'z@chen.sg',    plan: 'elite',   xp: 18450, streak: 42, joined: '2024-01-15', status: 'active' },
  { id: 'u2', name: 'Marcus Obi', email: 'm@obi.ng',     plan: 'elite',   xp: 16200, streak: 38, joined: '2024-02-03', status: 'active' },
  { id: 'u3', name: 'Lena Kovač', email: 'l@kovac.hr',   plan: 'learner', xp: 15100, streak: 31, joined: '2024-01-28', status: 'active' },
  { id: 'u4', name: 'Ravi Patel', email: 'r@patel.in',   plan: 'learner', xp: 11900, streak: 21, joined: '2024-03-10', status: 'active' },
  { id: 'u5', name: 'Sofia Torres',email: 's@torres.mx', plan: 'explorer',xp: 10200, streak: 15, joined: '2024-03-22', status: 'active' },
  { id: 'u6', name: 'Jin Park',   email: 'j@park.kr',    plan: 'learner', xp: 9800,  streak: 9,  joined: '2024-02-14', status: 'suspended' },
]

export default function AdminPage() {
  const supabase = createBrowserSupabase()
  const [tab, setTab]           = useState<Tab>('overview')
  const [isAdmin, setIsAdmin]   = useState<boolean | null>(null)
  const [showAddCourse, setShowAddCourse] = useState(false)
  const [newCourse, setNewCourse] = useState({ title: '', subtitle: '', level: 'Beginner', xp_reward: 1000, required_plan: 'explorer', icon: '🧠', color: '#f5a623' })
  const [saving, setSaving]     = useState(false)
  const [userSearch, setUserSearch] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setIsAdmin(false); return }
      const { data } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
      setIsAdmin(!!(data as any)?.is_admin)
    })
  }, [])

  if (isAdmin === null) return (
    <div className="flex h-screen items-center justify-center bg-codex-bg">
      <div className="w-8 h-8 border-2 border-codex-border border-t-codex-gold rounded-full animate-spin" />
    </div>
  )

  if (isAdmin === false) return (
    <div className="flex h-screen items-center justify-center bg-codex-bg text-center">
      <div>
        <div className="text-5xl mb-4">🔒</div>
        <div className="font-display font-bold text-xl text-codex-text mb-2">Access Denied</div>
        <p className="text-codex-muted text-sm">Admin access required.</p>
      </div>
    </div>
  )

  const handleSaveCourse = async () => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 800)) // replace with supabaseAdmin.from('courses').insert(...)
    setShowAddCourse(false)
    setSaving(false)
  }

  const filteredUsers = MOCK_USERS.filter(u =>
    !userSearch || u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.includes(userSearch)
  )

  return (
    <div className="flex h-screen bg-codex-bg overflow-hidden">

      {/* Admin sidebar */}
      <aside className="w-56 bg-codex-surface border-r border-codex-border flex flex-col flex-shrink-0">
        <div className="px-5 py-5 border-b border-codex-border">
          <div className="font-display font-black text-sm text-codex-gold tracking-wider">CODEX</div>
          <div className="text-xs text-codex-muted mt-0.5">Admin Panel</div>
        </div>

        <nav className="flex-1 py-3">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`w-full flex items-center gap-3 px-5 py-3 text-sm font-medium transition-all
                ${tab === t.id
                  ? 'bg-codex-gold/10 text-codex-gold border-r-2 border-r-codex-gold'
                  : 'text-codex-muted hover:text-codex-text hover:bg-codex-surfaceUp'}`}>
              <span className="text-base">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-codex-border">
          <a href="/dashboard" className="text-xs text-codex-muted hover:text-codex-gold transition-colors">
            ← Back to Academy
          </a>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">

          {/* ── OVERVIEW ────────────────────────────── */}
          {tab === 'overview' && (
            <div>
              <h1 className="font-display font-bold text-xl text-codex-text mb-6">Platform Overview</h1>

              {/* Stat cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                  { label: 'Total Users',    value: MOCK_STATS.totalUsers.toLocaleString(),   sub: '+47 this week',        color: 'text-codex-text' },
                  { label: 'Active Today',   value: MOCK_STATS.activeToday.toString(),         sub: '25% of users',         color: 'text-codex-success' },
                  { label: 'Monthly Revenue',value: `$${MOCK_STATS.totalRevenue.toLocaleString()}`, sub: `+${MOCK_STATS.mrrGrowth}% vs last month`, color: 'text-codex-gold' },
                  { label: 'Lessons Done',   value: MOCK_STATS.lessonsCompleted.toLocaleString(), sub: 'all time',          color: 'text-codex-info' },
                ].map(s => (
                  <div key={s.label} className="cx-stat">
                    <div className="text-xs text-codex-muted uppercase tracking-wider mb-2">{s.label}</div>
                    <div className={`font-display font-bold text-2xl ${s.color} mb-0.5`}>{s.value}</div>
                    <div className="text-xs text-codex-muted">{s.sub}</div>
                  </div>
                ))}
              </div>

              {/* Subscription breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="cx-card p-5">
                  <div className="cx-section-title mb-4">Subscription Breakdown</div>
                  <div className="space-y-3">
                    {[
                      { plan: 'Elite',    count: MOCK_STATS.eliteUsers,   color: '#f5a623', pct: Math.round(MOCK_STATS.eliteUsers / MOCK_STATS.totalUsers * 100) },
                      { plan: 'Learner',  count: MOCK_STATS.learnerUsers, color: '#7c3aed', pct: Math.round(MOCK_STATS.learnerUsers / MOCK_STATS.totalUsers * 100) },
                      { plan: 'Explorer', count: MOCK_STATS.totalUsers - MOCK_STATS.eliteUsers - MOCK_STATS.learnerUsers, color: '#6b7280', pct: 100 - Math.round((MOCK_STATS.eliteUsers + MOCK_STATS.learnerUsers) / MOCK_STATS.totalUsers * 100) },
                    ].map(p => (
                      <div key={p.plan}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium text-codex-text">{p.plan}</span>
                          <span className="text-codex-muted">{p.count.toLocaleString()} · {p.pct}%</span>
                        </div>
                        <div className="cx-progress-bar h-2">
                          <div className="cx-progress-fill h-2" style={{ width: `${p.pct}%`, background: p.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="cx-card p-5">
                  <div className="cx-section-title mb-4">Key Metrics</div>
                  <div className="space-y-3">
                    {[
                      { label: 'Avg Streak',       value: `${MOCK_STATS.avgStreak} days` },
                      { label: 'Elite Conversion',  value: `${Math.round(MOCK_STATS.eliteUsers / MOCK_STATS.totalUsers * 100)}%` },
                      { label: 'Paid Conversion',   value: `${Math.round((MOCK_STATS.eliteUsers + MOCK_STATS.learnerUsers) / MOCK_STATS.totalUsers * 100)}%` },
                      { label: 'Avg Revenue/User',  value: `$${Math.round(MOCK_STATS.totalRevenue / (MOCK_STATS.eliteUsers + MOCK_STATS.learnerUsers))}` },
                    ].map(m => (
                      <div key={m.label} className="flex justify-between items-center py-2 border-b border-codex-border/50 last:border-0">
                        <span className="text-sm text-codex-muted">{m.label}</span>
                        <span className="font-display font-bold text-sm text-codex-text">{m.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── COURSES ─────────────────────────────── */}
          {tab === 'courses' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h1 className="font-display font-bold text-xl text-codex-text">Courses</h1>
                <button onClick={() => setShowAddCourse(true)}
                  className="cx-btn-primary w-auto px-5 py-2 text-xs">+ Add Course</button>
              </div>

              {/* Add course modal */}
              {showAddCourse && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                  <div className="cx-card w-full max-w-lg p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="font-display font-bold text-lg text-codex-text">New Course</div>
                      <button onClick={() => setShowAddCourse(false)} className="text-codex-muted hover:text-codex-text text-xl">×</button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs text-codex-muted uppercase tracking-wider mb-1.5">Title *</label>
                        <input value={newCourse.title} onChange={e => setNewCourse(p => ({ ...p, title: e.target.value }))}
                          placeholder="e.g. Reinforcement Learning" className="cx-input" />
                      </div>
                      <div>
                        <label className="block text-xs text-codex-muted uppercase tracking-wider mb-1.5">Subtitle</label>
                        <input value={newCourse.subtitle} onChange={e => setNewCourse(p => ({ ...p, subtitle: e.target.value }))}
                          placeholder="Short description" className="cx-input" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-codex-muted uppercase tracking-wider mb-1.5">Level</label>
                          <select value={newCourse.level} onChange={e => setNewCourse(p => ({ ...p, level: e.target.value }))}
                            className="cx-input">
                            {['Beginner','Intermediate','Advanced','Expert'].map(l => <option key={l}>{l}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-codex-muted uppercase tracking-wider mb-1.5">Required Plan</label>
                          <select value={newCourse.required_plan} onChange={e => setNewCourse(p => ({ ...p, required_plan: e.target.value }))}
                            className="cx-input">
                            {['explorer','learner','elite'].map(l => <option key={l}>{l}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs text-codex-muted uppercase tracking-wider mb-1.5">XP Reward</label>
                          <input type="number" value={newCourse.xp_reward} onChange={e => setNewCourse(p => ({ ...p, xp_reward: +e.target.value }))}
                            className="cx-input" />
                        </div>
                        <div>
                          <label className="block text-xs text-codex-muted uppercase tracking-wider mb-1.5">Icon</label>
                          <input value={newCourse.icon} onChange={e => setNewCourse(p => ({ ...p, icon: e.target.value }))}
                            className="cx-input text-center text-xl" />
                        </div>
                        <div>
                          <label className="block text-xs text-codex-muted uppercase tracking-wider mb-1.5">Color</label>
                          <input type="color" value={newCourse.color} onChange={e => setNewCourse(p => ({ ...p, color: e.target.value }))}
                            className="cx-input h-10 p-1 cursor-pointer" />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                      <button onClick={() => setShowAddCourse(false)} className="cx-btn-ghost flex-shrink-0 w-auto px-5">Cancel</button>
                      <button onClick={handleSaveCourse} disabled={saving || !newCourse.title} className="cx-btn-primary flex-1">
                        {saving ? 'Saving...' : 'Create Course'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {MOCK_COURSES.map(c => (
                  <div key={c.id} className="cx-card-up flex items-center gap-5 p-4 hover:border-codex-border/80 transition-all">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                      style={{ background: `${c.color}15`, border: `1px solid ${c.color}30` }}>
                      📚
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm text-codex-text">{c.title}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded border"
                          style={{ color: c.color, background: `${c.color}10`, borderColor: `${c.color}30` }}>
                          {c.level}
                        </span>
                        {!c.published && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-codex-muted/10 border border-codex-muted/30 text-codex-muted">
                            Draft
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-codex-muted">
                        <span>{c.lessons} lessons</span>
                        <span>{c.enrolled.toLocaleString()} enrolled</span>
                        <span>{c.completion}% avg completion</span>
                        <span className="cx-xp-badge">+{c.xp_reward.toLocaleString()} XP</span>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button className="text-xs px-3 py-1.5 rounded-lg bg-codex-surfaceUp border border-codex-border text-codex-muted hover:text-codex-text transition-all">
                        Edit
                      </button>
                      <button className={`text-xs px-3 py-1.5 rounded-lg border transition-all font-medium
                        ${c.published
                          ? 'bg-codex-success/10 border-codex-success/30 text-codex-success'
                          : 'bg-codex-gold/10 border-codex-gold/30 text-codex-gold'}`}>
                        {c.published ? '● Live' : '○ Publish'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── USERS ───────────────────────────────── */}
          {tab === 'users' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h1 className="font-display font-bold text-xl text-codex-text">Users</h1>
                <input value={userSearch} onChange={e => setUserSearch(e.target.value)}
                  placeholder="Search by name or email..." className="cx-input w-64" />
              </div>

              <div className="cx-card overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-codex-border">
                      {['User','Plan','XP','Streak','Joined','Status','Actions'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs text-codex-muted uppercase tracking-wider font-bold">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-codex-border/50">
                    {filteredUsers.map(u => (
                      <tr key={u.id} className="hover:bg-codex-surfaceUp/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-sm text-codex-text">{u.name}</div>
                          <div className="text-xs text-codex-muted">{u.email}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`cx-plan-badge cx-plan-${u.plan} text-[10px]`}>
                            {u.plan}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-display font-bold text-sm text-codex-gold">
                            {u.xp.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-codex-muted">🔥 {u.streak}d</td>
                        <td className="px-4 py-3 text-xs text-codex-muted">
                          {new Date(u.joined).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full border
                            ${u.status === 'active'
                              ? 'bg-codex-success/10 border-codex-success/30 text-codex-success'
                              : 'bg-codex-danger/10 border-codex-danger/30 text-codex-danger'}`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <button className="text-xs px-2 py-1 rounded bg-codex-surfaceUp border border-codex-border text-codex-muted hover:text-codex-text transition-all">
                              View
                            </button>
                            <button className="text-xs px-2 py-1 rounded bg-codex-danger/10 border border-codex-danger/30 text-codex-danger hover:bg-codex-danger/20 transition-all">
                              {u.status === 'active' ? 'Suspend' : 'Restore'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── BADGES (admin) ───────────────────────── */}
          {tab === 'badges' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h1 className="font-display font-bold text-xl text-codex-text">Badge Management</h1>
                <button className="cx-btn-primary w-auto px-5 py-2 text-xs">+ Custom Badge</button>
              </div>
              <p className="text-codex-muted text-sm mb-6">
                Badges auto-award via the <code>check_badges()</code> stored procedure. Manual badges can be awarded to specific users below.
              </p>
              <div className="cx-card p-5">
                <div className="cx-section-title mb-4">Manual Badge Award</div>
                <div className="flex gap-3">
                  <input placeholder="User email or ID..." className="cx-input flex-1" />
                  <select className="cx-input w-48">
                    <option>Select badge...</option>
                    <option value="social_5">Connector 🤝</option>
                    <option value="course_first">Conqueror 🏅</option>
                    <option value="elite_member">Elite ⭐</option>
                  </select>
                  <button className="cx-btn-primary w-auto px-5 flex-shrink-0">Award</button>
                </div>
              </div>
            </div>
          )}

          {/* ── LESSONS ─────────────────────────────── */}
          {tab === 'lessons' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h1 className="font-display font-bold text-xl text-codex-text">Lessons</h1>
                <div className="flex gap-3">
                  <select className="cx-input w-48">
                    <option>All Courses</option>
                    {MOCK_COURSES.map(c => <option key={c.id}>{c.title}</option>)}
                  </select>
                  <button className="cx-btn-primary w-auto px-5 py-2 text-xs">+ Add Lesson</button>
                </div>
              </div>
              <div className="cx-card p-6 text-center text-codex-muted">
                <p className="text-sm mb-2">Select a course from the dropdown to manage its lessons.</p>
                <p className="text-xs">Lessons support video uploads (Supabase Storage), MDX content, quizzes, and project briefs.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

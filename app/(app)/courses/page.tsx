// app/(app)/courses/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { requireProfile, supabaseAdmin } from '@/lib/supabase'

export const metadata: Metadata = { title: 'Courses' }

const LEVEL_ORDER = { Beginner: 0, Intermediate: 1, Advanced: 2, Expert: 3 }

export default async function CoursesPage() {
  const profile = await requireProfile()

  const [{ data: courses }, { data: myProgress }] = await Promise.all([
    supabaseAdmin.from('courses').select('*').eq('is_published', true).order('sort_order'),
    supabaseAdmin
      .from('course_progress')
      .select('course_id, pct_complete, is_complete, completed_lessons, total_lessons')
      .eq('user_id', profile.id),
  ])

  const progressMap = Object.fromEntries((myProgress || []).map((p: any) => [p.course_id, p]))

  // Group by level
  const byLevel = (courses || []).reduce((acc: any, c: any) => {
    if (!acc[c.level]) acc[c.level] = []
    acc[c.level].push(c)
    return acc
  }, {})

  const levels = Object.keys(byLevel).sort((a, b) =>
    (LEVEL_ORDER as any)[a] - (LEVEL_ORDER as any)[b]
  )

  const levelColors: Record<string, string> = {
    Beginner:     '#10b981',
    Intermediate: '#f5a623',
    Advanced:     '#7c3aed',
    Expert:       '#ef4444',
  }

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl text-codex-text mb-1">Course Library</h1>
        <p className="text-codex-muted text-sm">
          {courses?.length} courses · Complete them all to reach the top of the leaderboard
        </p>
      </div>

      {levels.map(level => (
        <div key={level} className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="cx-section-title">{level}</div>
            <div className="flex-1 h-px bg-codex-border" />
            <span className="text-xs text-codex-muted">{byLevel[level].length} courses</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {byLevel[level].map((course: any) => {
              const p = progressMap[course.id]
              const pct = p?.pct_complete || 0
              const locked = course.required_plan === 'elite' && profile.plan !== 'elite'
                          || course.required_plan === 'learner' && profile.plan === 'explorer'

              return (
                <Link key={course.id}
                  href={locked ? '/subscription' : `/learn/${course.slug}`}
                  className={`cx-card cx-hover-gold flex flex-col p-5 group relative overflow-hidden
                    ${locked ? 'opacity-60 cursor-pointer' : ''}`}
                  style={{ borderColor: pct === 100 ? `${course.color}40` : undefined }}>

                  {/* Glow if complete */}
                  {pct === 100 && (
                    <div className="absolute inset-0 pointer-events-none"
                      style={{ background: `radial-gradient(circle at top right, ${course.color}08, transparent 60%)` }} />
                  )}

                  <div className="flex items-start justify-between mb-4">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{ background: `${course.color}15`, border: `1px solid ${course.color}30` }}>
                      {locked ? '🔒' : course.icon}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="cx-xp-badge">+{course.xp_reward.toLocaleString()} XP</span>
                      {pct === 100 && (
                        <span className="text-[10px] font-bold text-codex-success">✓ Complete</span>
                      )}
                    </div>
                  </div>

                  <h3 className="font-semibold text-codex-text mb-1 text-sm">{course.title}</h3>
                  {course.subtitle && (
                    <p className="text-xs text-codex-muted mb-3 line-clamp-2">{course.subtitle}</p>
                  )}

                  {/* Progress */}
                  {pct > 0 && (
                    <div className="mt-auto">
                      <div className="cx-progress-bar mb-1">
                        <div className="cx-progress-fill" style={{ width: `${pct}%`, background: course.color }} />
                      </div>
                      <div className="flex justify-between text-[10px] text-codex-muted">
                        <span>{p.completed_lessons}/{p.total_lessons} lessons</span>
                        <span>{pct}%</span>
                      </div>
                    </div>
                  )}

                  {/* CTA */}
                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-xs font-bold transition-all group-hover:translate-x-1 duration-200"
                      style={{ color: course.color }}>
                      {locked ? 'Unlock Plan →' : pct === 0 ? 'Start →' : pct === 100 ? 'Review →' : 'Continue →'}
                    </div>
                    {locked && course.required_plan === 'elite' && (
                      <span className={`cx-plan-badge cx-plan-elite text-[9px]`}>Elite</span>
                    )}
                    {locked && course.required_plan === 'learner' && (
                      <span className={`cx-plan-badge cx-plan-learner text-[9px]`}>Learner</span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

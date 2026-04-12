// app/(app)/layout.tsx  — Authenticated app shell
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabase, supabaseAdmin } from '@/lib/supabase'
import AppSidebar from '@/components/AppSidebar'
import AppTopbar from '@/components/AppTopbar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id, username, full_name, avatar_url, xp_total, xp_level, xp_to_next, streak_current, plan')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/auth/login')

  return (
    <div className="flex h-screen bg-codex-bg overflow-hidden">
      {/* Sidebar */}
      <AppSidebar />

      {/* Main area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <AppTopbar profile={profile} />
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}

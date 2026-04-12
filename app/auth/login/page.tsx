'use client'
import { Suspense } from 'react'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserSupabase } from '@/lib/supabase'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/dashboard'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createBrowserSupabase()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    router.push(next)
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-codex-bg flex items-center justify-center px-4">
      <div className="relative w-full max-w-md">
        <div className="text-center mb-10">
          <Link href="/" className="inline-block font-display font-black text-2xl tracking-wider">
            <span className="text-codex-gold">CODEX</span>
            <span className="text-codex-text ml-1">ACADEMY</span>
          </Link>
          <p className="text-codex-muted text-sm mt-2">Welcome back, scholar.</p>
        </div>
        <div className="cx-card p-8">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs text-codex-muted font-medium mb-1.5 uppercase tracking-wider">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required className="cx-input" />
            </div>
            <div>
              <label className="block text-xs text-codex-muted font-medium mb-1.5 uppercase tracking-wider">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required className="cx-input" />
            </div>
            {error && <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-xs text-red-400">{error}</div>}
            <button type="submit" disabled={loading} className="cx-btn-primary mt-2">{loading ? 'Signing in...' : 'Sign In →'}</button>
          </form>
          <p className="text-center text-xs text-codex-muted mt-6">No account? <Link href="/auth/signup" className="text-codex-gold font-semibold">Create one free</Link></p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div/>}>
      <LoginForm />
    </Suspense>
  )
}
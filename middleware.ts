// middleware.ts
// ─────────────────────────────────────────────────────────────
// Route protection + session refresh for Codex Academy
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/dashboard',
  '/courses',
  '/learn',
  '/quiz',
  '/leaderboard',
  '/badges',
  '/community',
  '/subscription',
  '/profile',
  '/api/xp',
  '/api/quiz',
  '/api/ai-tutor',
  '/api/community',
  '/api/leaderboard',
  '/api/stripe/checkout',
]

// Routes only for unauthenticated users (redirect if logged in)
const AUTH_ROUTES = ['/auth/login', '/auth/signup']

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session
  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // Redirect unauthenticated users from protected routes
  const isProtected = PROTECTED_ROUTES.some(route => path.startsWith(route))
  if (isProtected && !user) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('next', path)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect authenticated users away from auth pages
  const isAuthPage = AUTH_ROUTES.some(route => path.startsWith(route))
  if (isAuthPage && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Plan-gate elite content
  if (path.startsWith('/api/ai-tutor') && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single()

    if (!profile || profile.plan === 'explorer') {
      return NextResponse.json(
        { error: 'AI Tutor requires Learner or Elite plan' },
        { status: 403 }
      )
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

// lib/supabase.ts
// ─────────────────────────────────────────────────────────────
// Two Supabase clients:
//   1. Browser client  — for use in Client Components & hooks
//   2. Server client   — for use in Server Components & API routes
//   3. Admin client    — service-role, bypasses RLS (API routes only!)
// ─────────────────────────────────────────────────────────────

import { createBrowserClient } from '@supabase/ssr'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

// ── Browser client (Client Components) ──────────────────────
export function createBrowserSupabase() {
  return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY)
}

// ── Server client (Server Components, Route Handlers) ───────
export async function createServerSupabase() {
  const cookieStore = await cookies()
  return createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() { return cookieStore.getAll() },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {}
      },
    },
  })
}

// ── Admin client (bypasses RLS — server only!) ───────────────
export const supabaseAdmin = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// ── Helper: get current user or throw ───────────────────────
export async function requireUser() {
  const supabase = await createServerSupabase()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Unauthorized')
  return user
}

// ── Helper: get full profile or throw ───────────────────────
export async function requireProfile() {
  const user = await requireUser()
  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  if (error || !profile) throw new Error('Profile not found')
  return profile
}

// app/api/stripe/checkout/route.ts
// ─────────────────────────────────────────────────────────────
// POST /api/stripe/checkout
// Creates a Stripe Checkout session for plan upgrade
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { requireProfile, supabaseAdmin } from '@/lib/supabase'
import {
  stripe,
  PRICE_IDS,
  getOrCreateStripeCustomer,
  createCheckoutSession,
} from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    const profile = await requireProfile()
    const { plan, billing = 'monthly' } = await req.json()

    // Validate plan
    if (!['learner', 'elite'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }
    if (!['monthly', 'annual'].includes(billing)) {
      return NextResponse.json({ error: 'Invalid billing period' }, { status: 400 })
    }

    const priceId = PRICE_IDS[plan]?.[billing]
    if (!priceId) {
      return NextResponse.json({ error: 'Price not configured' }, { status: 500 })
    }

    // Get or create Stripe customer
    let customerId = profile.stripe_customer_id
    if (!customerId) {
      const { data: { user } } = await (await import('@/lib/supabase')).createServerSupabase()
        .then(sb => sb.auth.getUser())

      customerId = await getOrCreateStripeCustomer(
        profile.id,
        user?.email || '',
        profile.full_name || undefined
      )

      // Save Stripe customer ID to profile
      await supabaseAdmin
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', profile.id)
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL!

    const session = await createCheckoutSession({
      customerId,
      priceId,
      userId: profile.id,
      plan,
      billing,
      successUrl: `${baseUrl}/subscription/success`,
      cancelUrl: `${baseUrl}/subscription`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('[Checkout]', err)
    return NextResponse.json(
      { error: err.message || 'Checkout failed' },
      { status: err.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}

// POST /api/stripe/portal — redirect to Stripe billing portal
export async function PUT(req: NextRequest) {
  try {
    const profile = await requireProfile()

    if (!profile.stripe_customer_id) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 400 })
    }

    const { createBillingPortalSession } = await import('@/lib/stripe')
    const session = await createBillingPortalSession(
      profile.stripe_customer_id,
      `${process.env.NEXT_PUBLIC_APP_URL}/subscription`
    )

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

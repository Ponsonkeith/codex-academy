// app/api/stripe/webhook/route.ts
// ─────────────────────────────────────────────────────────────
// POST /api/stripe/webhook
// Handles all Stripe subscription lifecycle events
// Register this URL in Stripe Dashboard → Webhooks
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { stripe, planFromPriceId } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'
import Stripe from 'stripe'

// These are the events we care about
const HANDLED_EVENTS = [
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_failed',
]

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    console.error('[Webhook] Signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (!HANDLED_EVENTS.includes(event.type)) {
    return NextResponse.json({ received: true })
  }

  // Idempotency: skip already-processed events
  const { data: existing } = await supabaseAdmin
    .from('stripe_events')
    .select('id')
    .eq('id', event.id)
    .single()

  if (existing) return NextResponse.json({ received: true })

  try {
    await handleEvent(event)

    // Mark event as processed
    await supabaseAdmin
      .from('stripe_events')
      .insert({ id: event.id, type: event.type })
  } catch (err: any) {
    console.error('[Webhook] Handler error:', err)
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

async function handleEvent(event: Stripe.Event) {
  switch (event.type) {

    // ── Checkout completed → subscription starts ─────────────
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.mode !== 'subscription') break

      const userId = session.metadata?.supabase_user_id
      const plan   = session.metadata?.plan as string

      if (!userId || !plan) break

      await supabaseAdmin.from('profiles').update({
        plan,
        subscription_status: 'active',
        stripe_subscription_id: session.subscription as string,
      }).eq('id', userId)

      // Award Elite badge if on elite plan
      if (plan === 'elite') {
        await awardBadgeIfNotEarned(userId, 'elite_member')
      }

      console.log(`[Webhook] User ${userId} subscribed to ${plan}`)
      break
    }

    // ── Subscription updated (upgrade/downgrade/renewal) ─────
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const userId = sub.metadata?.supabase_user_id
      if (!userId) break

      const priceId = sub.items.data[0]?.price.id
      const plan = planFromPriceId(priceId) || 'explorer'
      const status = sub.status

      await supabaseAdmin.from('profiles').update({
        plan: status === 'active' || status === 'trialing' ? plan : 'explorer',
        subscription_status: status,
        stripe_subscription_id: sub.id,
        subscription_end_at: new Date(sub.current_period_end * 1000).toISOString(),
      }).eq('stripe_customer_id', sub.customer as string)

      console.log(`[Webhook] Subscription updated: ${plan} (${status})`)
      break
    }

    // ── Subscription cancelled ────────────────────────────────
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription

      await supabaseAdmin.from('profiles').update({
        plan: 'explorer',
        subscription_status: 'cancelled',
        stripe_subscription_id: null,
      }).eq('stripe_customer_id', sub.customer as string)

      console.log('[Webhook] Subscription cancelled')
      break
    }

    // ── Payment failed → notify user (email via Supabase Edge Fn) ─
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      // Update status so UI shows warning banner
      await supabaseAdmin.from('profiles').update({
        subscription_status: 'past_due',
      }).eq('stripe_customer_id', invoice.customer as string)

      console.log('[Webhook] Payment failed for', invoice.customer)
      break
    }
  }
}

async function awardBadgeIfNotEarned(userId: string, badgeId: string) {
  const { data: existing } = await supabaseAdmin
    .from('user_badges')
    .select('id')
    .eq('user_id', userId)
    .eq('badge_id', badgeId)
    .single()

  if (existing) return

  const { data: badge } = await supabaseAdmin
    .from('badges')
    .select('xp_reward')
    .eq('id', badgeId)
    .single()

  await supabaseAdmin.from('user_badges').insert({ user_id: userId, badge_id: badgeId })

  if (badge?.xp_reward) {
    await supabaseAdmin.rpc('award_xp', {
      p_user_id: userId,
      p_amount: badge.xp_reward,
      p_reason: 'badge_earned',
      p_meta: { badge_id: badgeId },
    })
  }
}

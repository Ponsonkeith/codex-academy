// lib/stripe.ts
// ─────────────────────────────────────────────────────────────
// Stripe helper functions for Codex Academy subscriptions
// ─────────────────────────────────────────────────────────────

import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
  appInfo: { name: 'Codex Academy', version: '1.0.0' },
})

// Plan → Stripe Price ID mapping
export const PRICE_IDS: Record<string, Record<string, string>> = {
  learner: {
    monthly: process.env.STRIPE_LEARNER_MONTHLY_PRICE_ID!,
    annual:  process.env.STRIPE_LEARNER_ANNUAL_PRICE_ID!,
  },
  elite: {
    monthly: process.env.STRIPE_ELITE_MONTHLY_PRICE_ID!,
    annual:  process.env.STRIPE_ELITE_ANNUAL_PRICE_ID!,
  },
}

// Plan display info
export const PLAN_META = {
  explorer: { name: 'Explorer', color: '#6b7280', price: { monthly: 0,  annual: 0  } },
  learner:  { name: 'Learner',  color: '#7c3aed', price: { monthly: 19, annual: 15 } },
  elite:    { name: 'Elite',    color: '#f5a623', price: { monthly: 49, annual: 39 } },
}

// Create or retrieve a Stripe customer
export async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
  name?: string
): Promise<string> {
  // Check if already exists in our DB (handled by caller via profile.stripe_customer_id)
  const customer = await stripe.customers.create({
    email,
    name: name || email,
    metadata: { supabase_user_id: userId },
  })
  return customer.id
}

// Create a Stripe checkout session for subscription
export async function createCheckoutSession({
  customerId,
  priceId,
  userId,
  plan,
  billing,
  successUrl,
  cancelUrl,
}: {
  customerId: string
  priceId: string
  userId: string
  plan: string
  billing: 'monthly' | 'annual'
  successUrl: string
  cancelUrl: string
}): Promise<Stripe.Checkout.Session> {
  return stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: true,
    subscription_data: {
      trial_period_days: 7,              // 7-day free trial
      metadata: {
        supabase_user_id: userId,
        plan,
        billing,
      },
    },
    success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl,
    metadata: { supabase_user_id: userId, plan, billing },
  })
}

// Create a Billing Portal session (manage/cancel subscription)
export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
}

// Determine plan from Stripe subscription price
export function planFromPriceId(priceId: string): 'learner' | 'elite' | null {
  for (const [plan, billing] of Object.entries(PRICE_IDS)) {
    if (Object.values(billing).includes(priceId)) {
      return plan as 'learner' | 'elite'
    }
  }
  return null
}

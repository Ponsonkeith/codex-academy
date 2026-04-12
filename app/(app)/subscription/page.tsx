'use client'
// app/(app)/subscription/page.tsx
import { useState, useEffect } from 'react'
import { createBrowserSupabase } from '@/lib/supabase'
import type { Profile } from '@/types/database'

const PLANS = [
  {
    id: 'explorer',
    name: 'Explorer',
    prices: { monthly: 0, annual: 0 },
    color: '#6b7280',
    features: [
      { text: '3 starter courses', ok: true },
      { text: 'Community read-only', ok: true },
      { text: 'Basic progress tracking', ok: true },
      { text: 'Leaderboard access', ok: false },
      { text: 'AI Tutor (Axiom)', ok: false },
      { text: 'Badge system', ok: false },
      { text: 'Certificate of completion', ok: false },
    ],
    cta: 'Current Plan',
  },
  {
    id: 'learner',
    name: 'Learner',
    prices: { monthly: 19, annual: 15 },
    color: '#7c3aed',
    popular: false,
    features: [
      { text: 'All 50+ courses', ok: true },
      { text: 'Full community access', ok: true },
      { text: 'All badges & leaderboard', ok: true },
      { text: 'AI Tutor – 50 msgs/month', ok: true },
      { text: 'Certificate of completion', ok: true },
      { text: 'XP multiplier ×2', ok: false },
      { text: 'Elite private channels', ok: false },
    ],
    cta: 'Upgrade to Learner',
  },
  {
    id: 'elite',
    name: 'Elite',
    prices: { monthly: 49, annual: 39 },
    color: '#f5a623',
    popular: true,
    features: [
      { text: 'Everything in Learner', ok: true },
      { text: 'Unlimited AI Tutor', ok: true },
      { text: 'XP multiplier ×2', ok: true },
      { text: 'Elite private channels', ok: true },
      { text: '1-on-1 mentorship sessions', ok: true },
      { text: 'Custom profile frame', ok: true },
      { text: 'Priority badge processing', ok: true },
    ],
    cta: 'Go Elite',
  },
]

export default function SubscriptionPage() {
  const supabase          = createBrowserSupabase()
  const [billing, setBilling]   = useState<'monthly'|'annual'>('monthly')
  const [currentPlan, setCurrent] = useState<string>('explorer')
  const [loading, setLoading]   = useState<string | null>(null)
  const [subStatus, setSubStatus] = useState<string>('')

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data: p } = await supabase
        .from('profiles')
        .select('plan, subscription_status, subscription_end_at')
        .eq('id', user.id)
        .single()
      if (p) {
        setCurrent(p.plan)
        setSubStatus(p.subscription_status)
      }
    })
  }, [])

  const handleUpgrade = async (planId: string) => {
    if (planId === 'explorer' || planId === currentPlan) return
    setLoading(planId)
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: planId, billing }),
    })
    const { url, error } = await res.json()
    if (url) window.location.href = url
    else {
      alert(error || 'Something went wrong')
      setLoading(null)
    }
  }

  const handleManage = async () => {
    setLoading('portal')
    const res = await fetch('/api/stripe/checkout', { method: 'PUT' })
    const { url } = await res.json()
    if (url) window.location.href = url
    setLoading(null)
  }

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="mb-8 text-center">
        <h1 className="font-display font-bold text-3xl text-codex-text mb-2">Level Up Your Access</h1>
        <p className="text-codex-muted text-sm max-w-md mx-auto">
          The more you invest, the faster you ascend. Unlock the full Codex Academy experience.
        </p>
      </div>

      {/* Status banner */}
      {subStatus === 'past_due' && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 text-sm text-red-400 text-center">
          ⚠️ Your payment failed. Please update your payment method to maintain access.
          <button onClick={handleManage} className="ml-3 text-codex-gold underline font-bold">
            Manage Billing →
          </button>
        </div>
      )}

      {/* Billing toggle */}
      <div className="flex justify-center mb-10">
        <div className="flex bg-codex-surfaceUp border border-codex-border rounded-xl p-1 gap-1">
          {(['monthly','annual'] as const).map(b => (
            <button key={b} onClick={() => setBilling(b)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all capitalize flex items-center gap-2
                ${billing === b ? 'bg-codex-gold text-black' : 'text-codex-muted hover:text-codex-text'}`}>
              {b}
              {b === 'annual' && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded
                  ${billing === 'annual' ? 'bg-black/20 text-black' : 'bg-codex-success/20 text-codex-success'}`}>
                  -20%
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {PLANS.map(plan => {
          const price = billing === 'annual' ? plan.prices.annual : plan.prices.monthly
          const isCurrent = plan.id === currentPlan
          const isLoading = loading === plan.id

          return (
            <div key={plan.id}
              className={`cx-card relative overflow-hidden flex flex-col transition-all duration-300
                ${plan.popular ? 'ring-1 ring-codex-gold/40' : ''}
                ${isCurrent ? 'opacity-80' : 'hover:-translate-y-0.5'}`}>

              {plan.popular && (
                <div className="bg-codex-gold text-black text-[10px] font-black text-center py-1.5 tracking-wider uppercase">
                  ⭐ Most Popular
                </div>
              )}

              {plan.popular && (
                <div className="absolute inset-0 bg-codex-gold/3 pointer-events-none" />
              )}

              <div className="p-6 flex flex-col flex-1">
                {/* Header */}
                <div className="mb-5">
                  <div className="font-display font-bold text-lg mb-2" style={{ color: plan.color }}>
                    {plan.name}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-display font-black text-4xl text-codex-text">
                      ${price}
                    </span>
                    {price > 0 && (
                      <span className="text-sm text-codex-muted">/ month</span>
                    )}
                    {price === 0 && (
                      <span className="text-sm text-codex-muted">forever</span>
                    )}
                  </div>
                  {billing === 'annual' && price > 0 && (
                    <div className="text-xs text-codex-success mt-1">
                      Billed ${price * 12}/year · Save ${(plan.prices.monthly - price) * 12}/year
                    </div>
                  )}
                </div>

                {/* Features */}
                <div className="space-y-2.5 mb-6 flex-1">
                  {plan.features.map((f, i) => (
                    <div key={i} className={`flex items-start gap-2.5 text-sm
                      ${f.ok ? 'text-codex-muted' : 'text-codex-muted/40'}`}>
                      <span className={`flex-shrink-0 mt-0.5 font-bold text-xs
                        ${f.ok ? '' : 'opacity-30'}`}
                        style={{ color: f.ok ? plan.color : undefined }}>
                        {f.ok ? '✓' : '✗'}
                      </span>
                      {f.text}
                    </div>
                  ))}
                </div>

                {/* CTA */}
                {isCurrent ? (
                  <div className="text-center py-3 text-sm font-bold text-codex-muted border border-codex-border rounded-xl">
                    ✓ Current Plan
                  </div>
                ) : plan.id === 'explorer' ? (
                  <div className="text-center py-3 text-sm text-codex-muted">Free plan</div>
                ) : (
                  <button onClick={() => handleUpgrade(plan.id)} disabled={!!loading}
                    className={`w-full py-3 rounded-xl font-bold text-sm transition-all
                      active:scale-[0.98] disabled:opacity-50
                      ${plan.popular
                        ? 'bg-codex-gold text-black hover:bg-codex-goldDim'
                        : 'bg-transparent border border-codex-border hover:border-codex-accent text-codex-text hover:text-codex-accent'}`}>
                    {isLoading ? 'Redirecting...' : plan.cta}
                  </button>
                )}

                {plan.id !== 'explorer' && !isCurrent && (
                  <p className="text-[10px] text-codex-muted text-center mt-2">
                    7-day free trial · Cancel anytime
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Manage billing */}
      {currentPlan !== 'explorer' && (
        <div className="text-center mt-10">
          <button onClick={handleManage} disabled={loading === 'portal'}
            className="text-sm text-codex-muted hover:text-codex-gold transition-colors underline">
            {loading === 'portal' ? 'Opening portal...' : 'Manage billing & invoices →'}
          </button>
        </div>
      )}

      {/* FAQ */}
      <div className="max-w-2xl mx-auto mt-16">
        <div className="cx-section-title text-center mb-8">Frequently Asked</div>
        {[
          { q: 'Can I cancel anytime?', a: 'Yes. Cancel before your next billing date and you\'ll keep access until the end of your paid period.' },
          { q: 'What happens to my progress if I downgrade?', a: 'Your XP, badges, and progress are yours forever. You\'ll just lose access to locked courses and the AI Tutor.' },
          { q: 'Is there a student discount?', a: 'Yes! Email us with your student ID for 50% off any plan.' },
          { q: 'What\'s the XP multiplier on Elite?', a: 'Elite members earn 2× XP on every lesson, quiz, and badge — making it significantly faster to climb the leaderboard.' },
        ].map(faq => (
          <details key={faq.q} className="cx-card mb-3 p-5 cursor-pointer group">
            <summary className="font-semibold text-sm text-codex-text flex items-center justify-between">
              {faq.q}
              <span className="text-codex-muted group-open:rotate-180 transition-transform duration-200">▾</span>
            </summary>
            <p className="text-sm text-codex-muted mt-3 leading-relaxed">{faq.a}</p>
          </details>
        ))}
      </div>
    </div>
  )
}

# 🎓 CODEX ACADEMY — Full Stack SaaS Platform

> The world's most elite AI learning platform. Built with Next.js 14, Supabase, Stripe & Claude AI.

---

## 🏗 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS |
| Auth | Supabase Auth (email, Google, GitHub) |
| Database | Supabase PostgreSQL |
| Realtime | Supabase Realtime (community chat) |
| Payments | Stripe (subscriptions + webhooks) |
| AI Tutor | Anthropic Claude API (streaming) |
| Storage | Supabase Storage (avatars, videos) |
| Hosting | Vercel (recommended) |

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/your-org/codex-academy
cd codex-academy
npm install
cp .env.example .env.local
```

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) → Create new project
2. Copy your project URL and anon key into `.env.local`
3. Go to **SQL Editor** in Supabase and run the entire contents of `supabase/schema.sql`
4. Go to **Settings → API** and copy the `service_role` key into `.env.local`

**Enable Auth Providers:**
- Go to Authentication → Providers
- Enable Email (with confirmation)
- Optionally enable Google and GitHub OAuth

### 3. Set Up Stripe

1. Go to [dashboard.stripe.com](https://dashboard.stripe.com)
2. Create 4 products with prices:

| Product | Price | Billing |
|---------|-------|---------|
| Learner | $19/mo | Monthly |
| Learner | $15/mo | Annual |
| Elite | $49/mo | Monthly |
| Elite | $39/mo | Annual |

3. Copy the Price IDs into `.env.local`
4. Install Stripe CLI: `brew install stripe/stripe-cli/stripe`
5. Forward webhooks locally:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```
6. Copy the webhook signing secret into `.env.local`

**Production webhook:** Add `https://yourdomain.com/api/stripe/webhook` in Stripe Dashboard → Webhooks
Events to listen for:
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`

### 4. Set Up Anthropic

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an API key
3. Add to `.env.local` as `ANTHROPIC_API_KEY`

### 5. Run Locally

```bash
npm run dev
# Open http://localhost:3000
```

---

## 📁 Project Structure

```
codex-academy/
├── app/
│   ├── api/
│   │   ├── stripe/
│   │   │   ├── checkout/route.ts    ← Create Stripe checkout sessions
│   │   │   └── webhook/route.ts     ← Handle Stripe events
│   │   ├── xp/route.ts              ← Award XP for lesson completion
│   │   ├── quiz/route.ts            ← Submit & grade quizzes
│   │   ├── ai-tutor/route.ts        ← Streaming AI tutor (Claude)
│   │   ├── leaderboard/route.ts     ← Global rankings + badge checks
│   │   └── community/route.ts       ← Posts, likes, channels
│   ├── auth/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── callback/route.ts        ← OAuth callback handler
│   ├── dashboard/page.tsx
│   ├── courses/[slug]/page.tsx
│   ├── learn/[courseSlug]/[lessonSlug]/page.tsx
│   └── subscription/page.tsx
├── lib/
│   ├── supabase.ts                  ← Browser, server, and admin clients
│   ├── stripe.ts                    ← Stripe helpers + price mapping
│   └── claude.ts                    ← AI tutor + quiz generation
├── types/
│   └── database.ts                  ← Full TypeScript types
├── middleware.ts                     ← Route protection + plan gating
└── supabase/
    └── schema.sql                   ← FULL database schema (run this first!)
```

---

## 🗃 Database Overview

| Table | Purpose |
|-------|---------|
| `profiles` | Extended user data — XP, level, streak, plan |
| `courses` | Course catalog |
| `lessons` | Lesson content per course |
| `quizzes` | Quiz metadata |
| `quiz_questions` | Individual questions (correct answers server-only) |
| `lesson_progress` | Per-user lesson completion |
| `quiz_attempts` | Quiz scores and answers |
| `badges` | Badge definitions and trigger rules |
| `user_badges` | Earned badges per user |
| `xp_transactions` | Full XP audit log |
| `community_posts` | Community messages per channel |
| `post_likes` | Like tracking |
| `ai_conversations` | AI tutor chat history |
| `stripe_events` | Webhook idempotency |

**Views:**
- `leaderboard` — ranked list by XP
- `course_progress` — per-user course completion summary

**Stored Procedures:**
- `award_xp(user_id, amount, reason, meta)` — awards XP with multiplier support
- `update_streak(user_id)` — updates daily streak
- `check_badges(user_id)` — auto-awards newly unlocked badges

---

## 🏆 Badge System

Badges auto-unlock via `check_badges()` after every XP-earning event:

| Badge | Trigger | XP | Rarity |
|-------|---------|-----|--------|
| Ignition 🔥 | 1st lesson | 50 | Common |
| Voltage ⚡ | 7-day streak | 150 | Rare |
| Celestial 🌟 | 30-day streak | 1000 | Legendary |
| Immortal 💫 | 100-day streak | 2000 | Legendary |
| Flawless 💎 | 100% quiz score | 200 | Epic |
| Apex 👑 | Top 10 leaderboard | 500 | Legendary |
| Titan 🏆 | Top 3 leaderboard | 1000 | Legendary |
| Connector 🤝 | 5 community posts | 100 | Rare |
| Conqueror 🏅 | First course done | 300 | Epic |
| Elite ⭐ | Elite subscription | 200 | Rare |

Legendary badges also grant a permanent **XP multiplier** (stored in `badges.xp_multiplier`).

---

## 💳 Subscription Plans

| Feature | Explorer (Free) | Learner ($19/mo) | Elite ($49/mo) |
|---------|----------------|-----------------|----------------|
| Courses | 3 | All 50+ | All 50+ |
| AI Tutor | ❌ | 50 msgs/mo | Unlimited |
| Community | Read-only | Full access | Full access |
| Leaderboard | View only | Full access | Full access |
| Badges | ❌ | All badges | All badges |
| XP Multiplier | 1x | 1x | 2x |
| Mentorship | ❌ | ❌ | ✅ |

---

## 🚀 Deploying to Production

### Vercel (recommended)

```bash
npm i -g vercel
vercel
```

Add all environment variables in Vercel Dashboard → Project → Settings → Environment Variables.

Set the Stripe webhook URL to `https://your-vercel-domain.com/api/stripe/webhook`.

### Environment Variables Checklist

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `STRIPE_SECRET_KEY`
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] `STRIPE_LEARNER_MONTHLY_PRICE_ID`
- [ ] `STRIPE_LEARNER_ANNUAL_PRICE_ID`
- [ ] `STRIPE_ELITE_MONTHLY_PRICE_ID`
- [ ] `STRIPE_ELITE_ANNUAL_PRICE_ID`
- [ ] `ANTHROPIC_API_KEY`
- [ ] `NEXT_PUBLIC_APP_URL`

---

## 📦 What's Next (Build Order)

1. ✅ Database schema + API routes (done — you have this)
2. ⬜ Auth pages (login / signup with Supabase)
3. ⬜ Dashboard UI (connect to real API)
4. ⬜ Course player + lesson viewer
5. ⬜ Quiz engine with timer
6. ⬜ AI Tutor chat widget
7. ⬜ Community realtime (Supabase Realtime subscriptions)
8. ⬜ Admin panel (add courses, publish lessons)
9. ⬜ Email notifications (Supabase Edge Functions → Resend)
10. ⬜ Mobile app (React Native + Expo)

---

Built with ❤️ by Codex Academy

# 🚀 Codex Academy — Production Deployment Guide

## Phase 1: Database Setup (15 min)

### 1.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com) → New project
2. Choose a strong database password (save it!)
3. Select the region closest to your users

### 1.2 Run Schema
1. Open **SQL Editor** in Supabase dashboard
2. Paste the full contents of `supabase/schema.sql`
3. Click **Run** — this creates all 14 tables, views, functions, RLS policies, and seeds 15 badges
4. Then run `supabase/email-triggers.sql` (after deploying the email Edge Function)

### 1.3 Configure Auth
- **Settings → Auth → Email**: Enable "Confirm email"
- **Settings → Auth → Providers**: Enable Google and/or GitHub OAuth
- **Settings → Auth → URL Configuration**:
  - Site URL: `https://your-domain.com`
  - Redirect URLs: `https://your-domain.com/auth/callback`

---

## Phase 2: Stripe Setup (20 min)

### 2.1 Create Products
Go to [dashboard.stripe.com](https://dashboard.stripe.com) → Products → Add product:

| Product Name  | Price    | Billing  | Metadata     |
|--------------|----------|----------|--------------|
| Codex Learner | $19.00  | Monthly  | plan=learner |
| Codex Learner | $15.00  | Annual   | plan=learner |
| Codex Elite   | $49.00  | Monthly  | plan=elite   |
| Codex Elite   | $39.00  | Annual   | plan=elite   |

Copy each **Price ID** (starts with `price_`) into your `.env.local`.

### 2.2 Configure Webhook
1. Stripe Dashboard → Developers → Webhooks → Add endpoint
2. URL: `https://your-domain.com/api/stripe/webhook`
3. Events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Copy the **Signing Secret** → `STRIPE_WEBHOOK_SECRET`

### 2.3 Configure Billing Portal
Stripe Dashboard → Settings → Billing → Customer Portal:
- Enable subscription management (pause, cancel, upgrade)
- Enable invoice history
- Set your return URL: `https://your-domain.com/subscription`

---

## Phase 3: Email Setup (10 min)

### 3.1 Create Resend Account
1. Go to [resend.com](https://resend.com) → Create account
2. Add and verify your domain (add DNS records)
3. Create an API key → copy to `RESEND_API_KEY`

### 3.2 Deploy Edge Function
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Set secrets
supabase secrets set RESEND_API_KEY=re_...
supabase secrets set APP_URL=https://your-domain.com

# Deploy
supabase functions deploy send-email
```

### 3.3 Enable Email Triggers
In Supabase SQL Editor, run:
```sql
-- Set app settings for pg_net
ALTER DATABASE postgres SET app.supabase_url = 'https://your-project.supabase.co';
ALTER DATABASE postgres SET app.service_role_key = 'your-service-role-key';
```
Then run the contents of `supabase/email-triggers.sql`.

---

## Phase 4: Deploy to Vercel (10 min)

### 4.1 Push to GitHub
```bash
git init
git add .
git commit -m "Initial Codex Academy"
git remote add origin https://github.com/your-org/codex-academy
git push -u origin main
```

### 4.2 Deploy
```bash
npm install -g vercel
vercel --prod
```

Or connect GitHub repo in [vercel.com](https://vercel.com) dashboard.

### 4.3 Set Environment Variables
In Vercel Dashboard → Project → Settings → Environment Variables, add all variables from `.env.example`:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_LEARNER_MONTHLY_PRICE_ID
STRIPE_LEARNER_ANNUAL_PRICE_ID
STRIPE_ELITE_MONTHLY_PRICE_ID
STRIPE_ELITE_ANNUAL_PRICE_ID
ANTHROPIC_API_KEY
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 4.4 Custom Domain
Vercel Dashboard → Domains → Add `codexacademy.com` (or your domain)
Update Supabase Auth redirect URLs to your production domain.

---

## Phase 5: Make Yourself Admin (2 min)

After signing up for an account on your live site:
```sql
-- In Supabase SQL Editor
UPDATE public.profiles 
SET is_admin = true 
WHERE username = 'your-username';
```

Then visit `https://your-domain.com/admin` to access the admin panel.

---

## Phase 6: Add Your First Course Content

### Via Admin Panel
1. Go to `/admin` → Courses → Add Course
2. Go to Lessons → Select course → Add lessons
3. Upload videos to Supabase Storage → set `video_url` on each lesson
4. Create quizzes via SQL or admin UI

### Via SQL (faster for bulk)
```sql
-- Insert a course
INSERT INTO public.courses (slug, title, subtitle, icon, color, level, xp_reward, is_published, sort_order)
VALUES ('ai-foundations', 'AI Foundations', 'Start your journey', '🧠', '#f5a623', 'Beginner', 1200, true, 1);

-- Insert lessons
INSERT INTO public.lessons (course_id, title, slug, type, duration_mins, xp_reward, sort_order, is_published, content)
VALUES (
  (SELECT id FROM public.courses WHERE slug = 'ai-foundations'),
  'What is AI?', 'what-is-ai', 'video', 8, 100, 1, true,
  '## What is AI?

Artificial Intelligence is the simulation of human intelligence by machines...'
);
```

---

## Recommended Tools

| Tool | Purpose | Cost |
|------|---------|------|
| [Resend](https://resend.com) | Transactional email | Free to 3k/mo |
| [Cloudflare R2](https://cloudflare.com) | Video/file storage | Free to 10GB |
| [Mux](https://mux.com) | Video hosting + streaming | Pay per use |
| [Lemon Squeezy](https://lemonsqueezy.com) | Alt to Stripe | 5% + $0.50 |
| [PostHog](https://posthog.com) | Analytics | Free to 1M events |
| [Sentry](https://sentry.io) | Error tracking | Free plan |
| [Upstash Redis](https://upstash.com) | Rate limiting/caching | Free plan |

---

## Production Checklist

- [ ] Schema deployed and badges seeded
- [ ] Auth providers configured (email + OAuth)
- [ ] Stripe products and webhook configured
- [ ] Email Edge Function deployed + tested
- [ ] Environment variables set in Vercel
- [ ] Custom domain connected
- [ ] Admin account created
- [ ] First course added and published
- [ ] Stripe test payment completed end-to-end
- [ ] Badge auto-award tested
- [ ] Certificate download tested
- [ ] Community realtime tested
- [ ] AI Tutor tested (Learner/Elite plan)

---

Built with ❤️ — Codex Academy

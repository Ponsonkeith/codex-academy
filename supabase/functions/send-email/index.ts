// supabase/functions/send-email/index.ts
// ─────────────────────────────────────────────────────────────
// Supabase Edge Function — Email Notifications via Resend
// Deploy with: supabase functions deploy send-email
//
// Set secrets:
//   supabase secrets set RESEND_API_KEY=re_...
//   supabase secrets set APP_URL=https://your-domain.com
// ─────────────────────────────────────────────────────────────

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const APP_URL        = Deno.env.get('APP_URL') || 'https://codexacademy.com'
const FROM_EMAIL     = 'Codex Academy <hello@codexacademy.com>'

type EmailType =
  | 'welcome'
  | 'streak_reminder'
  | 'badge_earned'
  | 'course_complete'
  | 'payment_failed'
  | 'subscription_started'

interface EmailPayload {
  type: EmailType
  to: string
  name: string
  data?: Record<string, any>
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const payload: EmailPayload = await req.json()
  const { type, to, name, data = {} } = payload

  const email = buildEmail(type, name, data)
  if (!email) {
    return new Response(JSON.stringify({ error: 'Unknown email type' }), { status: 400 })
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [to],
      subject: email.subject,
      html: wrapEmail(email.body, name),
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    return new Response(JSON.stringify({ error: err }), { status: 500 })
  }

  return new Response(JSON.stringify({ sent: true }), { status: 200 })
})

function buildEmail(type: EmailType, name: string, data: Record<string, any>) {
  switch (type) {

    case 'welcome':
      return {
        subject: `Welcome to Codex Academy, ${name}! 🚀`,
        body: `
          <h2>Your journey starts now.</h2>
          <p>Welcome to Codex Academy — the world's most elite AI learning platform.</p>
          <p>Here's what to do next:</p>
          <ul>
            <li>🧠 Pick your first course from the library</li>
            <li>🔥 Build a daily learning streak</li>
            <li>🏆 Aim for the global leaderboard</li>
            <li>💎 Unlock your first badge</li>
          </ul>
          <a href="${APP_URL}/courses" class="btn">Browse Courses →</a>
          <p>Your AI tutor Axiom is ready to answer any question 24/7. Let's go.</p>
        `,
      }

    case 'streak_reminder':
      return {
        subject: `⚡ Don't break your ${data.streak}-day streak, ${name}`,
        body: `
          <h2>Your streak is on the line.</h2>
          <p>You've built an impressive <strong>${data.streak}-day learning streak</strong> on Codex Academy. Don't let it end today.</p>
          <p>Just 10 minutes is enough to keep it alive.</p>
          <a href="${APP_URL}/learn" class="btn">Continue Learning →</a>
          <p>Your leaderboard rank depends on it. 🔥</p>
        `,
      }

    case 'badge_earned':
      return {
        subject: `${data.badgeIcon} Badge Unlocked: ${data.badgeName}!`,
        body: `
          <h2>New badge earned! ${data.badgeIcon}</h2>
          <p>You just unlocked the <strong>${data.badgeName}</strong> badge — ${data.badgeDescription}.</p>
          <div style="text-align:center; padding: 24px; background: #0d0f1e; border-radius: 16px; margin: 20px 0; border: 1px solid #1e2240;">
            <div style="font-size: 64px; margin-bottom: 8px;">${data.badgeIcon}</div>
            <div style="font-size: 20px; font-weight: 700; color: #e8e8f0;">${data.badgeName}</div>
            <div style="color: #f5a623; font-weight: 700; margin-top: 4px;">+${data.xpReward} XP</div>
            <div style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin-top: 4px;">${data.rarity}</div>
          </div>
          <a href="${APP_URL}/badges" class="btn">View Your Vault →</a>
        `,
      }

    case 'course_complete':
      return {
        subject: `🏅 You completed ${data.courseName}!`,
        body: `
          <h2>Course complete! 🏅</h2>
          <p>You've finished <strong>${data.courseName}</strong> and earned <strong>${data.xpEarned} XP</strong>.</p>
          <p>Your certificate is ready to download.</p>
          <a href="${APP_URL}/api/certificate?course_id=${data.courseId}" class="btn">Download Certificate →</a>
          <p>Ready for the next challenge? The ${data.nextCourse || 'next course'} is waiting.</p>
          <a href="${APP_URL}/courses" style="color: #f5a623;">Browse next courses →</a>
        `,
      }

    case 'payment_failed':
      return {
        subject: `⚠️ Action required: Payment failed`,
        body: `
          <h2>Your payment didn't go through.</h2>
          <p>We couldn't process your Codex Academy subscription payment.</p>
          <p>To keep your <strong>${data.plan}</strong> access and avoid losing your streak, please update your payment method.</p>
          <a href="${APP_URL}/subscription" class="btn">Update Payment →</a>
          <p>If you have any questions, reply to this email — we're here to help.</p>
        `,
      }

    case 'subscription_started':
      return {
        subject: `✅ Welcome to ${data.plan}! Your upgrade is live.`,
        body: `
          <h2>You're now on the ${data.plan} plan! 🎉</h2>
          <p>Your upgrade is live and all ${data.plan} features are unlocked:</p>
          ${data.plan === 'elite' ? `
          <ul>
            <li>⭐ Unlimited AI Tutor access</li>
            <li>⚡ 2× XP on everything you do</li>
            <li>👑 Elite private community channels</li>
            <li>🤝 1-on-1 mentorship sessions</li>
          </ul>` : `
          <ul>
            <li>📚 All 50+ courses unlocked</li>
            <li>🤖 50 AI Tutor messages per month</li>
            <li>🏆 Full leaderboard & badge access</li>
          </ul>`}
          <a href="${APP_URL}/dashboard" class="btn">Go to Dashboard →</a>
        `,
      }

    default:
      return null
  }
}

function wrapEmail(body: string, name: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #05070f; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #e8e8f0; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .header { text-align: center; padding: 32px 0; border-bottom: 1px solid #1e2240; margin-bottom: 32px; }
    .logo { font-size: 20px; font-weight: 900; letter-spacing: 4px; }
    .logo-cx { color: #f5a623; }
    .logo-text { color: #e8e8f0; }
    .content { background: #0d0f1e; border: 1px solid #1e2240; border-radius: 20px; padding: 40px; }
    h2 { font-size: 24px; font-weight: 700; color: #e8e8f0; margin-bottom: 16px; }
    p { color: #9ca3af; line-height: 1.7; margin-bottom: 16px; font-size: 15px; }
    ul { color: #9ca3af; margin: 16px 0 16px 24px; }
    ul li { margin-bottom: 8px; line-height: 1.6; font-size: 15px; }
    strong { color: #e8e8f0; font-weight: 600; }
    .btn {
      display: inline-block;
      background: #f5a623;
      color: #000 !important;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 12px;
      font-weight: 700;
      font-size: 14px;
      margin: 20px 0;
    }
    .footer { text-align: center; padding: 32px 0; color: #4b5563; font-size: 12px; }
    .footer a { color: #f5a623; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">
        <span class="logo-cx">CODEX</span>
        <span class="logo-text"> ACADEMY</span>
      </div>
    </div>
    <div class="content">
      <p>Hi ${name},</p>
      ${body}
    </div>
    <div class="footer">
      <p>© 2025 Codex Academy · <a href="${APP_URL}/subscription">Manage subscription</a> · <a href="${APP_URL}/unsubscribe">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>`
}

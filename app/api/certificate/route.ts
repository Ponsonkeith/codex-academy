// app/api/certificate/route.ts
// ─────────────────────────────────────────────────────────────
// GET /api/certificate?course_id=xxx
// Generates an SVG certificate and returns it as a PNG-ready payload
// In production, pipe through Puppeteer/Playwright or use a PDF lib
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { requireProfile, supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const profile   = await requireProfile()
    const courseId  = req.nextUrl.searchParams.get('course_id')

    if (!courseId) {
      return NextResponse.json({ error: 'course_id required' }, { status: 400 })
    }

    // Verify course completion
    const { data: progress } = await supabaseAdmin
      .from('course_progress')
      .select('is_complete, course_title, completed_lessons, total_lessons')
      .eq('user_id', profile.id)
      .eq('course_id', courseId)
      .single()

    if (!progress?.is_complete) {
      return NextResponse.json({ error: 'Course not completed yet' }, { status: 403 })
    }

    const { data: course } = await supabaseAdmin
      .from('courses')
      .select('title, level, xp_reward')
      .eq('id', courseId)
      .single()

    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

    const completedDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    })
    const studentName = profile.full_name || profile.username
    const certId = `CX-${profile.id.slice(0,6).toUpperCase()}-${courseId.slice(0,4).toUpperCase()}`

    // Generate SVG certificate
    const svg = generateCertificateSVG({
      studentName,
      courseName: course.title,
      courseLevel: course.level,
      completedDate,
      certId,
      xpEarned: course.xp_reward,
    })

    // Return SVG directly (in production, convert to PDF with Puppeteer)
    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Content-Disposition': `attachment; filename="codex-certificate-${certId}.svg"`,
        'Cache-Control': 'no-store',
      },
    })

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: err.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}

function generateCertificateSVG({
  studentName,
  courseName,
  courseLevel,
  completedDate,
  certId,
  xpEarned,
}: {
  studentName: string
  courseName: string
  courseLevel: string
  completedDate: string
  certId: string
  xpEarned: number
}): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="850" viewBox="0 0 1200 850" xmlns="http://www.w3.org/2000/svg"
     font-family="'Space Grotesk', system-ui, sans-serif">
  <defs>
    <!-- Background gradient -->
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="#05070f"/>
      <stop offset="100%" stop-color="#0d0f1e"/>
    </linearGradient>

    <!-- Gold gradient for accent elements -->
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%"   stop-color="#c47d0e"/>
      <stop offset="50%"  stop-color="#f5a623"/>
      <stop offset="100%" stop-color="#c47d0e"/>
    </linearGradient>

    <!-- Radial glow -->
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%"   stop-color="#f5a623" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#f5a623" stop-opacity="0"/>
    </radialGradient>

    <!-- Corner pattern -->
    <pattern id="dots" width="30" height="30" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1" fill="#f5a623" fill-opacity="0.15"/>
    </pattern>
  </defs>

  <!-- Background -->
  <rect width="1200" height="850" fill="url(#bg)"/>

  <!-- Dot pattern corners -->
  <rect x="0"    y="0"   width="200" height="200" fill="url(#dots)" opacity="0.6"/>
  <rect x="1000" y="0"   width="200" height="200" fill="url(#dots)" opacity="0.6"/>
  <rect x="0"    y="650" width="200" height="200" fill="url(#dots)" opacity="0.6"/>
  <rect x="1000" y="650" width="200" height="200" fill="url(#dots)" opacity="0.6"/>

  <!-- Central glow -->
  <ellipse cx="600" cy="425" rx="500" ry="350" fill="url(#glow)"/>

  <!-- Outer border -->
  <rect x="24" y="24" width="1152" height="802" rx="20" ry="20"
        fill="none" stroke="#1e2240" stroke-width="1"/>

  <!-- Inner gold border -->
  <rect x="40" y="40" width="1120" height="770" rx="16" ry="16"
        fill="none" stroke="url(#gold)" stroke-width="1.5" stroke-dasharray="12 6" opacity="0.6"/>

  <!-- Top: Codex Academy logo -->
  <text x="600" y="100" text-anchor="middle" font-size="13" font-weight="700"
        letter-spacing="6" fill="#f5a623" font-family="'Orbitron', monospace">
    CODEX ACADEMY
  </text>
  <line x1="440" y1="110" x2="560" y2="110" stroke="#f5a623" stroke-width="0.5" opacity="0.5"/>
  <line x1="640" y1="110" x2="760" y2="110" stroke="#f5a623" stroke-width="0.5" opacity="0.5"/>

  <!-- Trophy icon -->
  <text x="600" y="210" text-anchor="middle" font-size="72">🏆</text>

  <!-- Certificate title -->
  <text x="600" y="280" text-anchor="middle" font-size="14" font-weight="400"
        letter-spacing="5" fill="#6b7280" text-transform="uppercase">
    CERTIFICATE OF COMPLETION
  </text>

  <!-- Divider -->
  <rect x="500" y="298" width="200" height="1.5" fill="url(#gold)" opacity="0.8"/>

  <!-- "This certifies that" -->
  <text x="600" y="345" text-anchor="middle" font-size="16" fill="#6b7280">
    This certifies that
  </text>

  <!-- Student name -->
  <text x="600" y="415" text-anchor="middle" font-size="52" font-weight="700"
        fill="#e8e8f0" font-family="'Orbitron', monospace" letter-spacing="-1">
    ${escapeXml(studentName)}
  </text>

  <!-- Underline for name -->
  <rect x="200" y="428" width="800" height="1" fill="url(#gold)" opacity="0.4"/>

  <!-- "has successfully completed" -->
  <text x="600" y="472" text-anchor="middle" font-size="16" fill="#6b7280">
    has successfully completed
  </text>

  <!-- Course name -->
  <text x="600" y="530" text-anchor="middle" font-size="32" font-weight="600" fill="#f5a623">
    ${escapeXml(courseName)}
  </text>

  <!-- Level badge -->
  <rect x="525" y="548" width="150" height="28" rx="14" fill="#f5a623" fill-opacity="0.12"
        stroke="#f5a623" stroke-width="0.8" stroke-opacity="0.4"/>
  <text x="600" y="566" text-anchor="middle" font-size="12" font-weight="600" fill="#f5a623"
        letter-spacing="2">
    ${courseLevel.toUpperCase()}
  </text>

  <!-- XP earned -->
  <text x="600" y="620" text-anchor="middle" font-size="14" fill="#6b7280">
    +${xpEarned.toLocaleString()} XP Earned
  </text>

  <!-- Bottom section -->
  <line x1="100" y1="680" x2="400" y2="680" stroke="#1e2240" stroke-width="1"/>
  <line x1="800" y1="680" x2="1100" y2="680" stroke="#1e2240" stroke-width="1"/>

  <text x="250" y="710" text-anchor="middle" font-size="13" fill="#e8e8f0" font-weight="600">
    ${escapeXml(completedDate)}
  </text>
  <text x="250" y="728" text-anchor="middle" font-size="10" fill="#6b7280" letter-spacing="1">
    DATE COMPLETED
  </text>

  <text x="950" y="710" text-anchor="middle" font-size="13" fill="#e8e8f0" font-weight="600"
        font-family="'JetBrains Mono', monospace">
    ${certId}
  </text>
  <text x="950" y="728" text-anchor="middle" font-size="10" fill="#6b7280" letter-spacing="1">
    CERTIFICATE ID
  </text>

  <!-- Verification URL -->
  <text x="600" y="755" text-anchor="middle" font-size="10" fill="#6b7280" letter-spacing="0.5">
    Verify at codexacademy.com/verify/${certId}
  </text>
</svg>`
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

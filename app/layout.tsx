// app/layout.tsx
import type { Metadata } from 'next'
import { Space_Grotesk, Orbitron, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['300', '400', '500', '600', '700'],
})

const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700', '800', '900'],
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500'],
})

export const metadata: Metadata = {
  title: { default: 'Codex Academy', template: '%s | Codex Academy' },
  description: 'The world\'s most elite AI learning platform. Master artificial intelligence, earn badges, and climb the global leaderboard.',
  keywords: ['AI', 'machine learning', 'online learning', 'academy', 'courses'],
  openGraph: {
    title: 'Codex Academy',
    description: 'Master AI from scratch. Earn badges. Dominate the leaderboard.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${orbitron.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-codex-bg text-codex-text font-sans antialiased">
        {children}
      </body>
    </html>
  )
}

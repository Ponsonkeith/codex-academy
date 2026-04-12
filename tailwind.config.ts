// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Space Grotesk', 'system-ui', 'sans-serif'],
        display: ['Orbitron', 'monospace'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        codex: {
          bg:         '#05070f',
          surface:    '#0d0f1e',
          surfaceUp:  '#12152a',
          border:     '#1e2240',
          gold:       '#f5a623',
          goldDim:    '#c47d0e',
          accent:     '#7c3aed',
          accentDim:  '#5b21b6',
          success:    '#10b981',
          danger:     '#ef4444',
          info:       '#3b82f6',
          muted:      '#6b7280',
          text:       '#e8e8f0',
        },
      },
      animation: {
        'fade-in':     'fadeIn 0.4s ease forwards',
        'slide-up':    'slideUp 0.4s ease forwards',
        'pulse-gold':  'pulseGold 2s ease-in-out infinite',
        'count-up':    'countUp 0.6s ease forwards',
        'glow':        'glow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0' },                      to: { opacity: '1' } },
        slideUp:   { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        pulseGold: { '0%,100%': { opacity: '1' },                 '50%': { opacity: '0.5' } },
        glow:      { '0%,100%': { boxShadow: '0 0 8px #f5a62340' }, '50%': { boxShadow: '0 0 24px #f5a62380' } },
      },
      backgroundImage: {
        'codex-radial': 'radial-gradient(ellipse at 50% 0%, #7c3aed18 0%, transparent 60%)',
        'gold-radial':  'radial-gradient(circle at center, #f5a62312 0%, transparent 70%)',
      },
    },
  },
  plugins: [],
}

export default config

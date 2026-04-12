/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'codex-bg': '#05070f',
        'codex-surface': '#0d0f1e',
        'codex-surfaceUp': '#12152a',
        'codex-border': '#1e2240',
        'codex-gold': '#f5a623',
        'codex-goldDim': '#c47d0e',
        'codex-accent': '#7c3aed',
        'codex-success': '#10b981',
        'codex-danger': '#ef4444',
        'codex-info': '#3b82f6',
        'codex-muted': '#6b7280',
        'codex-text': '#e8e8f0',
      },
      fontFamily: {
        sans: ['Space Grotesk', 'system-ui', 'sans-serif'],
        display: ['Orbitron', 'monospace'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
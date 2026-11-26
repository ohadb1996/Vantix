/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  future: {
    hoverOnlyWhenSupported: true,
  },
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        vantix: {
          /* "cyan" = צבע ההדגשה של המיתוג: כתום בלייט מוד, כחול בדארק מוד (נשלט ע"י CSS vars) */
          cyan: {
            DEFAULT: 'rgb(var(--vantix-cyan) / <alpha-value>)',
            400: 'rgb(var(--vantix-cyan-400) / <alpha-value>)',
            500: 'rgb(var(--vantix-cyan-500) / <alpha-value>)',
            600: 'rgb(var(--vantix-cyan-600) / <alpha-value>)',
          },
          orange: {
            DEFAULT: '#f97316',
            400: '#fb923c',
            500: '#f97316',
            600: '#ea580c',
          },
          surface: {
            DEFAULT: 'hsl(var(--vantix-surface) / <alpha-value>)',
            raised: 'hsl(var(--vantix-surface-raised) / <alpha-value>)',
            muted: 'hsl(var(--vantix-surface-muted) / <alpha-value>)',
          },
          fg: {
            DEFAULT: 'hsl(var(--vantix-fg) / <alpha-value>)',
            muted: 'hsl(var(--vantix-fg-muted) / <alpha-value>)',
            subtle: 'hsl(var(--vantix-fg-subtle) / <alpha-value>)',
          },
          overlay: {
            DEFAULT: 'hsl(var(--vantix-overlay) / <alpha-value>)',
          },
          line: {
            DEFAULT: 'hsl(var(--vantix-line) / <alpha-value>)',
          },
        },
        /* aliases לקוד קיים – ממופים ל-Vantix */
        brand: {
          orange: '#f97316',
          orangeSoft: '#fb923c',
          orangeGlow: '#ffedd5',
          cream: '#fafafa',
          sand: '#f5f5f5',
          porcelain: 'hsl(var(--vantix-surface))',
          slate: 'hsl(var(--vantix-fg-muted))',
          midnight: '#0a0a0a',
          charcoal: 'hsl(var(--vantix-fg))',
          graphite: 'hsl(var(--vantix-fg))',
          sky: '#22d3ee',
          skySoft: '#ecfeff',
        },
      },
      fontFamily: {
        display: ['Rubik', 'system-ui', 'sans-serif'],
        body: ['Rubik', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 28px rgb(var(--vantix-cyan) / 0.18), 0 0 56px rgb(var(--vantix-cyan) / 0.10)',
        'glow-orange': '0 0 28px rgba(249, 115, 22, 0.18), 0 0 56px rgba(249, 115, 22, 0.10)',
        vantix: '0 0 24px rgb(var(--vantix-cyan) / 0.12)',
        'card-hover':
          '0 0 24px rgb(var(--vantix-cyan) / 0.18), 0 0 48px rgb(var(--vantix-cyan) / 0.10), 0 0 80px rgb(var(--vantix-cyan) / 0.06)',
        'card-hover-lg':
          '0 0 32px rgb(var(--vantix-cyan) / 0.22), 0 0 64px rgb(var(--vantix-cyan) / 0.12), 0 0 96px rgb(var(--vantix-cyan) / 0.07)',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'vantix-marketing-glow': {
          '0%, 100%': {
            boxShadow:
              '0 0 0 1px rgba(34,211,238,0.35), 0 0 18px rgba(34,211,238,0.25)',
          },
          '50%': {
            boxShadow:
              '0 0 0 1px rgba(249,115,22,0.45), 0 0 22px rgba(249,115,22,0.32)',
          },
        },
        'credit-tick-shake': {
          '0%, 100%': { transform: 'translate3d(0, 0, 0) rotate(0deg)' },
          '30%': { transform: 'translate3d(-3px, 0, 0) rotate(-0.5deg)' },
          '65%': { transform: 'translate3d(3px, 0, 0) rotate(0.5deg)' },
        },
      },
      animation: {
        marquee: 'marquee 45s linear infinite',
        'vantix-glow': 'vantix-marketing-glow 3.6s ease-in-out infinite',
        'credit-tick-shake': 'credit-tick-shake 110ms ease-out both',
      },
    },
  },
  plugins: [],
}

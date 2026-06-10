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
        glow: '0 20px 60px rgb(var(--vantix-cyan) / 0.22)',
        'glow-orange': '0 22px 65px rgba(249, 115, 22, 0.18)',
        vantix: '0 18px 50px rgb(var(--vantix-cyan) / 0.12)',
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
      },
      animation: {
        marquee: 'marquee 45s linear infinite',
        'vantix-glow': 'vantix-marketing-glow 3.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

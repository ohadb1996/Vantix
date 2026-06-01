import { Outlet } from 'react-router-dom'
import { MainNav } from '../../components/navigation/MainNav'
import { FooterCTA } from '../../components/navigation/FooterCTA'
import { Logo, BRAND_ASSETS } from '../../components/branding/Logo'
import { APP_DISPLAY_NAME } from '../../constants/app'
import { useTheme } from '../../context/ThemeContext'

export const AuthLanding = () => {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-vantix-surface text-vantix-fg">
      {isDark ? (
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <img
            src={BRAND_ASSETS.hero}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover object-center select-none"
            draggable={false}
          />
          <div className="absolute inset-0 bg-black/55" />
        </div>
      ) : (
        <div className="pointer-events-none fixed inset-0 z-0 vantix-page-bg" aria-hidden />
      )}

      <div className="relative z-10 sticky top-0 px-3 py-1.5 sm:px-6 sm:py-2 lg:px-10 lg:py-3">
        <MainNav />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-6 pb-16 pt-8 sm:px-10">
        <main className="grid flex-1 gap-10 lg:grid-cols-[1.05fr_1fr] lg:items-center">
          <section className="space-y-6">
            <Logo size="lg" variant="horizontal" onDark={isDark} />
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-vantix-cyan">
              {APP_DISPLAY_NAME} membership
            </p>
            <h1
              className={`font-display text-4xl sm:text-5xl ${isDark ? 'text-white' : 'text-vantix-fg'}`}
            >
              כל הטעמים, כל הפרסונליזציה – בחשבון אחד
            </h1>
            <p className="text-sm text-vantix-fg-muted">
              חשבון {APP_DISPLAY_NAME} מאפשר לכם לסנכרן את taste DNA, לשמור מנות אהובות, לקבל
              עדכוני משלוח בזמן אמת וליהנות מהפתעות שף מותאמות אישית.
            </p>
            <ul className="space-y-3 text-sm text-vantix-fg-muted">
              {[
                'הזמנות מסונכרנות בין האפליקציה, הווב ומסכי השליחים.',
                'התאמה אישית לתזונה, אלרגיות ומצבי רוח קולינריים.',
                'הטבות surprise & delight עם כל taste milestone.',
              ].map((text) => (
                <li key={text} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-vantix-cyan/20 text-xs font-semibold text-vantix-cyan">
                    ✓
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </section>

          <div className="vantix-soft-card p-8 backdrop-blur-sm">
            <Outlet />
          </div>
        </main>
      </div>

      <div className="relative z-10">
        <FooterCTA />
      </div>
    </div>
  )
}

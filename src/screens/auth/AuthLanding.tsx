import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MainNav } from '../../components/navigation/MainNav'
import { ScrollToTop } from '../../components/navigation/ScrollToTop'
import { FooterCTA } from '../../components/navigation/FooterCTA'
import { APP_DISPLAY_NAME } from '../../constants/app'

export const AuthLanding = () => {
  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-vantix-surface text-vantix-fg">
      <ScrollToTop />
      <div className="sticky top-0 z-30 shrink-0 px-3 py-1.5 sm:px-6 sm:py-2 lg:px-10 lg:py-3">
        <MainNav />
      </div>

      <div className="scrollbar-hide relative z-10 mx-auto flex w-full max-w-5xl min-h-0 flex-1 flex-col gap-10 overflow-y-auto overscroll-y-contain px-6 pb-16 pt-8 sm:px-10">
        <main className="grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:items-center">
          <section className="space-y-6">
            <div className="flex" style={{ perspective: '1000px' }}>
              <motion.div
                className="flex rounded-2xl bg-vantix-surface"
                style={{ transformStyle: 'preserve-3d' }}
                animate={{ rotateY: 360 }}
                transition={{ repeat: Infinity, duration: 6, ease: 'linear' }}
              >
                <img
                  src="/assets/logo-white.jpeg"
                  alt={APP_DISPLAY_NAME}
                  className="w-44 rounded-2xl object-contain mix-blend-darken sm:w-56 dark:hidden"
                  draggable={false}
                />
                <img
                  src="/assets/logo-dark.png"
                  alt={APP_DISPLAY_NAME}
                  className="hidden w-44 object-contain sm:w-56 dark:block"
                  draggable={false}
                />
              </motion.div>
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-vantix-cyan">
              {APP_DISPLAY_NAME} membership
            </p>
            <h1 className="font-display text-4xl text-vantix-fg sm:text-5xl">
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

        <FooterCTA />
      </div>
    </div>
  )
}

import { ArrowRight, Smartphone } from 'lucide-react'
import { APP_DISPLAY_NAME } from '../../constants/app'

export const FooterCTA = () => {
  return (
    <footer className="px-3 pb-6 sm:px-6 sm:pb-10 lg:px-10">
      <div className="vantix-soft-card mx-auto flex w-full max-w-6xl flex-col gap-5 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-6">
        <div className="space-y-1.5 sm:space-y-2">
          <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-vantix-cyan sm:text-xs sm:tracking-[0.35em]">
            <Smartphone className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            {APP_DISPLAY_NAME} on the go
          </p>
          <h3 className="font-display text-xl text-vantix-fg sm:text-2xl sm:text-3xl">
            ההזמנה הבאה שלך מרחק לחיצה
          </h3>
          <p className="text-xs text-vantix-fg-muted sm:text-sm">
            הורידו את האפליקציה וקבלו התראות חכמות, מצב משלוח בלייב והפתעות טעם
            בהתאמה אישית.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
          <button type="button" className="vantix-btn-ghost flex min-h-[44px] items-center justify-center gap-2 px-4 py-3 text-sm sm:min-h-0 sm:px-5">
            הורדה ל-iOS
            <ArrowRight className="h-4 w-4" />
          </button>
          <button type="button" className="vantix-btn-primary flex min-h-[44px] items-center justify-center gap-2 px-4 py-3 text-sm sm:min-h-0 sm:px-5">
            הורדה ל-Android
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="mx-auto mt-4 flex w-full max-w-6xl flex-col-reverse gap-3 text-[11px] text-vantix-fg-muted sm:mt-6 sm:flex-row sm:items-center sm:justify-between sm:text-xs">
        <span>© {new Date().getFullYear()} {APP_DISPLAY_NAME}. כל הזכויות שמורות.</span>
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <button type="button" className="transition hover:text-vantix-cyan">
            מדיניות פרטיות
          </button>
          <button type="button" className="transition hover:text-vantix-cyan">
            תנאי שימוש
          </button>
          <button type="button" className="transition hover:text-vantix-cyan">
            צור קשר
          </button>
        </div>
      </div>
    </footer>
  )
}

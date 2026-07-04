import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { User, History, MessageCircle, ChevronLeft, Palette, LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { ROUTES, SUPPORT_LINK } from '../../constants/app'
import { ThemeToggle } from '../../components/ui/ThemeToggle'
import { useTheme } from '../../context/ThemeContext'
import {
  PersonalDetailsSection,
  PaymentsSection,
} from '../../components/profile/SavedProfileSections'

export const ProfilePage = () => {
  const { user, logout } = useAuth()
  const { theme } = useTheme()
  const location = useLocation()
  const displayName = user?.displayName?.trim() || user?.email || 'משתמש'
  const email = user?.email ?? ''
  const phone = user?.phoneNumber ?? ''

  useEffect(() => {
    if (location.hash !== '#payments') return
    const timer = window.setTimeout(() => {
      document.getElementById('payments')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
    return () => window.clearTimeout(timer)
  }, [location.hash])

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-16 px-4" dir="rtl">
        <User className="h-16 w-16 text-vantix-cyan/50" />
        <p className="text-center text-vantix-fg-muted">יש להתחבר כדי לראות את הפרופיל</p>
        <Link
          to={ROUTES.AUTH_LOGIN}
          className="rounded-xl bg-vantix-orange px-6 py-3 font-semibold text-white hover:brightness-110 dark:bg-vantix-cyan dark:text-black"
        >
          התחברות
        </Link>
      </div>
    )
  }

  const cardClass =
    'rounded-2xl border border-vantix-cyan/20 bg-vantix-surface-raised p-5 shadow-sm hover:shadow-md transition'

  return (
    <div className="space-y-6 pb-10" dir="rtl">
      <header className="border-b border-vantix-cyan/20 pb-4">
        <h1 className="flex items-center justify-start gap-2 font-display text-2xl text-vantix-fg">
          <User className="h-6 w-6 text-vantix-cyan" />
          הפרופיל שלי
        </h1>
      </header>

      <section className={cardClass}>
        <h2 className="font-semibold text-vantix-fg mb-3 flex items-center gap-2">
          <Palette className="h-5 w-5 text-vantix-cyan" />
          תצוגה
        </h2>
        <p className="text-sm text-vantix-fg-muted mb-3">
          מצב נוכחי: {theme === 'dark' ? 'כהה' : 'בהיר'}
        </p>
        <ThemeToggle variant="compact" />
      </section>

      <PersonalDetailsSection
        displayName={displayName}
        email={email}
        phone={phone}
      />

      <PaymentsSection />

      {/* ניווט: היסטוריית הזמנות */}
      <Link
        to={ROUTES.ORDERS}
        className={`${cardClass} flex items-center justify-between gap-4 group`}
      >
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-vantix-cyan/10 p-2.5">
            <History className="h-5 w-5 text-vantix-cyan" />
          </div>
          <div className="text-right">
            <p className="font-semibold text-vantix-fg">היסטוריית הזמנות</p>
            <p className="text-sm text-vantix-fg-subtle">צפייה בהזמנות קודמות וסטטוסים</p>
          </div>
        </div>
        <ChevronLeft className="h-5 w-5 text-vantix-fg-subtle group-hover:text-vantix-cyan transition rotate-180" />
      </Link>

      {/* שירות לקוחות + דיווח על תקלות */}
      <a
        href={SUPPORT_LINK}
        target="_blank"
        rel="noopener noreferrer"
        className={`${cardClass} flex items-center justify-between gap-4 group block`}
      >
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-vantix-cyan/10 p-2.5">
            <MessageCircle className="h-5 w-5 text-vantix-cyan" />
          </div>
          <div className="text-right">
            <p className="font-semibold text-vantix-fg">שירות לקוחות ודיווח על תקלות</p>
            <p className="text-sm text-vantix-fg-subtle">צ'אט וואטסאפ – שאלות, בעיות ותקלות</p>
          </div>
        </div>
        <ChevronLeft className="h-5 w-5 rotate-180 text-vantix-fg-subtle transition group-hover:text-vantix-cyan" />
      </a>

      <button
        type="button"
        onClick={() => void logout()}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3.5 font-semibold text-red-500 transition hover:bg-red-500/20 active:scale-[0.99]"
      >
        <LogOut className="h-5 w-5" />
        התנתקות
      </button>
    </div>
  )
}

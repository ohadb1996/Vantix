import { Link, useNavigate } from 'react-router-dom'
import { User, CreditCard, History, MessageCircle, ChevronLeft, Palette } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { ROUTES, SUPPORT_LINK } from '../../constants/app'
import { ThemeToggle } from '../../components/ui/ThemeToggle'
import { useTheme } from '../../context/ThemeContext'

export const ProfilePage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { theme } = useTheme()
  const displayName = user?.displayName?.trim() || user?.email || 'משתמש'
  const email = user?.email ?? ''
  const phone = user?.phoneNumber ?? ''

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-16 px-4" dir="rtl">
        <User className="h-16 w-16 text-vantix-cyan/50" />
        <p className="text-center text-vantix-fg-muted">יש להתחבר כדי לראות את הפרופיל</p>
        <button
          type="button"
          onClick={() => navigate(ROUTES.AUTH_LOGIN)}
          className="rounded-xl bg-gradient-to-l from-vantix-cyan to-vantix-orange px-6 py-3 font-semibold text-white hover:bg-gradient-to-l from-vantix-cyan to-vantix-orange/90"
        >
          התחברות
        </button>
      </div>
    )
  }

  const cardClass =
    'rounded-2xl border border-vantix-cyan/20 bg-vantix-surface-raised p-5 shadow-sm hover:shadow-md transition'

  return (
    <div className="space-y-6 pb-10" dir="rtl">
      <header className="flex items-center justify-between gap-4 border-b border-vantix-cyan/20 pb-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-vantix-fg-muted hover:text-vantix-fg transition"
          aria-label="חזרה"
        >
          <ChevronLeft className="h-5 w-5" />
          חזרה
        </button>
        <h1 className="font-display text-2xl text-vantix-fg flex items-center gap-2">
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

      {/* פרטים אישיים */}
      <section className={cardClass}>
        <h2 className="font-semibold text-vantix-fg mb-3 flex items-center gap-2">
          <User className="h-5 w-5 text-vantix-cyan" />
          פרטים אישיים
        </h2>
        <dl className="space-y-2 text-sm">
          <div>
            <dt className="text-vantix-fg-subtle">שם</dt>
            <dd className="font-medium text-vantix-fg">{displayName || '—'}</dd>
          </div>
          <div>
            <dt className="text-vantix-fg-subtle">אימייל</dt>
            <dd className="font-medium text-vantix-fg">{email || '—'}</dd>
          </div>
          {phone && (
            <div>
              <dt className="text-vantix-fg-subtle">טלפון</dt>
              <dd className="font-medium text-vantix-fg">{phone}</dd>
            </div>
          )}
        </dl>
      </section>

      {/* פרטי תשלום */}
      <section className={cardClass}>
        <h2 className="font-semibold text-vantix-fg mb-3 flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-vantix-cyan" />
          פרטי תשלום
        </h2>
        <p className="text-sm text-vantix-fg-muted">
          פרטי התשלום נשמרים בהזמנה עצמה. בהיסטוריית ההזמנות תוכל לראות את פרטי התשלום של כל הזמנה.
        </p>
      </section>

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
        <ChevronLeft className="h-5 w-5 text-vantix-fg-subtle group-hover:text-vantix-cyan transition rotate-180" />
      </a>
    </div>
  )
}

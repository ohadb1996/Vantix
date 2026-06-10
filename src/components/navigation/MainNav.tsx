import { LogOut, ChevronRight, User, UtensilsCrossed, History } from 'lucide-react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { useScrolled } from '../../hooks/useScrolled'
import { Logo } from '../branding/Logo'
import { ROUTES } from '../../constants/app'
import { ThemeToggle } from '../ui/ThemeToggle'

const NAV_LINKS = [
  { to: ROUTES.RESTAURANTS, label: 'מסעדות', end: false, icon: UtensilsCrossed },
  { to: ROUTES.ORDERS, label: 'ההזמנות שלי', end: false, icon: History },
]

const linkClasses =
  'relative text-sm font-semibold text-vantix-fg-muted transition hover:text-vantix-cyan'

export const MainNav = () => {
  const { user, loading, logout } = useAuth()
  const location = useLocation()
  const scrolled = useScrolled()
  const isRestaurantMenu = /^\/restaurants\/[^/]+$/.test(location.pathname)
  const displayName = user?.displayName?.trim() || user?.email || ''
  const greetingLabel = displayName ? `שלום, ${displayName}` : ''

  const baseBorderBg = isRestaurantMenu
    ? 'border-vantix-cyan/25 bg-vantix-surface-raised/80 backdrop-blur-md'
    : 'vantix-nav-shell'

  const sizeClasses = scrolled
    ? 'rounded-xl px-2.5 py-1.5 sm:rounded-3xl sm:px-6 sm:py-3'
    : 'rounded-lg px-2 py-1 sm:rounded-xl sm:px-4 sm:py-1.5'

  return (
    <nav
      className={`flex min-w-0 items-center justify-between gap-1.5 overflow-x-auto border transition-all duration-300 sm:gap-4 sm:overflow-visible ${sizeClasses} ${baseBorderBg}`}
    >
      <Link
        to={ROUTES.HOME}
        className="flex min-w-0 shrink items-center rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-vantix-fg/20 focus-visible:ring-offset-2"
        aria-label="עמוד הבית"
      >
        <div className="flex shrink-0" style={{ perspective: '1000px' }}>
          <motion.div
            style={{ transformStyle: 'preserve-3d' }}
            animate={{ rotateY: 360 }}
            transition={{ repeat: Infinity, duration: 6, ease: 'linear' }}
          >
            <Logo size={scrolled ? 28 : 22} />
          </motion.div>
        </div>
      </Link>

      <div className="flex shrink-0 items-center gap-2 sm:gap-6 lg:gap-8">
        {NAV_LINKS.map((link) => {
          const Icon = link.icon
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              aria-label={link.label}
              className={({ isActive }) =>
                `flex items-center gap-1.5 sm:gap-2 ${linkClasses} ${
                  isActive
                    ? 'text-vantix-cyan after:absolute after:-bottom-2 after:left-1/2 after:h-1 after:w-1/2 after:-translate-x-1/2 after:rounded-full after:bg-vantix-cyan'
                    : ''
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0 sm:h-4 sm:w-4" aria-hidden />
              <span className="hidden sm:inline">{link.label}</span>
            </NavLink>
          )
        })}
      </div>

      <div className="flex min-w-0 shrink items-center gap-2 sm:gap-3 sm:px-0">
        <ThemeToggle variant="icon" />
        {isRestaurantMenu ? (
          <Link
            to={ROUTES.RESTAURANTS}
            className={`vantix-btn-ghost inline-flex shrink-0 items-center justify-center gap-1 ${
              scrolled
                ? 'min-h-[44px] min-w-[44px] px-3 py-2 text-sm sm:min-h-0 sm:min-w-0 sm:px-4'
                : 'min-h-[32px] min-w-[32px] px-2 py-1 text-xs sm:min-h-0 sm:min-w-0 sm:px-3'
            }`}
            aria-label="חזרה לרשימת המסעדות"
          >
            <ChevronRight className={scrolled ? 'h-4 w-4 shrink-0' : 'h-3.5 w-3.5 shrink-0'} />
            <span className="hidden sm:inline">חזרה</span>
          </Link>
        ) : loading ? null : user ? (
          <>
            {greetingLabel ? (
              <span
                title={displayName}
                className={`hidden max-w-[100px] shrink overflow-hidden text-ellipsis whitespace-nowrap rounded-full border border-vantix-cyan/20 bg-vantix-surface-raised px-2.5 py-1.5 text-xs font-semibold text-vantix-fg-muted sm:block sm:max-w-[140px] md:max-w-[200px] ${
                  scrolled ? 'px-3 py-2 text-sm' : ''
                }`}
              >
                {greetingLabel}
              </span>
            ) : null}
            <Link
              to={ROUTES.PROFILE}
              className={`vantix-btn-ghost inline-flex shrink-0 items-center justify-center gap-2 ${
                scrolled
                  ? 'min-h-[44px] min-w-[44px] px-3 py-2 text-sm sm:min-h-0 sm:min-w-0 sm:px-4'
                  : 'min-h-[32px] min-w-[32px] px-2 py-1 text-xs sm:min-h-0 sm:min-w-0 sm:px-3'
              }`}
              aria-label="הפרופיל שלי"
            >
              <User className={scrolled ? 'h-4 w-4 shrink-0' : 'h-3.5 w-3.5 shrink-0'} />
            </Link>
            <button
              type="button"
              onClick={() => void logout()}
              className={`vantix-btn-ghost inline-flex shrink-0 items-center justify-center gap-2 ${
                scrolled
                  ? 'min-h-[44px] min-w-[44px] px-3 py-2 text-sm sm:min-h-0 sm:min-w-0 sm:px-4'
                  : 'min-h-[32px] min-w-[32px] px-2 py-1 text-xs sm:min-h-0 sm:min-w-0 sm:px-3'
              }`}
              aria-label="התנתקות"
            >
              <LogOut className={scrolled ? 'h-4 w-4 shrink-0' : 'h-3.5 w-3.5 shrink-0'} />
            </button>
          </>
        ) : (
          <>
            <Link
              to={ROUTES.AUTH_LOGIN}
              className={`hidden rounded-full border border-vantix-cyan/25 bg-vantix-surface-raised font-semibold text-vantix-fg transition hover:border-vantix-cyan/50 sm:block ${
                scrolled ? 'px-4 py-2 text-sm' : 'px-3 py-1.5 text-xs'
              }`}
            >
              התחברות
            </Link>
            <Link
              to={ROUTES.AUTH_REGISTER}
              className={`vantix-btn-primary ${scrolled ? 'px-5 py-2 text-sm' : 'px-4 py-1.5 text-xs'}`}
            >
              להתחיל הזמנה
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}

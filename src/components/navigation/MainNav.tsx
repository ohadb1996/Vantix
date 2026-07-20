import { ChevronRight, UtensilsCrossed, History, Search, User } from 'lucide-react'
import { Link, NavLink, useLocation, useMatch } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { useAuthSheet } from '../../context/AuthSheetContext'
import { useMenu } from '../../hooks/useMenu'
import { useScrolled } from '../../hooks/useScrolled'
import { Logo } from '../branding/Logo'
import { ROUTES } from '../../constants/app'
import { ThemeToggle } from '../ui/ThemeToggle'

const NAV_LINKS = [
  { to: ROUTES.RESTAURANTS, label: 'מסעדות', end: false, icon: UtensilsCrossed },
  { to: ROUTES.SEARCH, label: 'חיפוש', end: true, icon: Search },
  { to: ROUTES.ORDERS, label: 'ההזמנות שלי', end: false, icon: History },
]

const linkClasses =
  'relative text-sm font-semibold text-vantix-fg-muted transition hover:text-vantix-cyan'

function formatNavGreetingName(user: { displayName?: string | null; email?: string | null }): string {
  const raw = user.displayName?.trim() || user.email?.trim() || ''
  if (!raw) return ''
  const at = raw.indexOf('@')
  return at > 0 ? raw.slice(0, at) : raw
}

export const MainNav = () => {
  const { user, loading } = useAuth()
  const { openAuthSheet } = useAuthSheet()
  const location = useLocation()
  const scrolled = useScrolled()
  const isRestaurantMenu = /^\/restaurants\/[^/]+$/.test(location.pathname)
  const navExpanded = isRestaurantMenu ? false : scrolled
  const menuMatch = useMatch('/restaurants/:businessId')
  const businessId = isRestaurantMenu ? menuMatch?.params.businessId : undefined
  const { businessName } = useMenu(businessId)
  const displayName = user ? formatNavGreetingName(user) : ''
  const greetingLabel = displayName ? `שלום, ${displayName}` : ''
  const navTitle = isRestaurantMenu ? businessName || 'תפריט' : null

  const desktopNavLinks = user
    ? [...NAV_LINKS, { to: ROUTES.PROFILE, label: 'פרופיל', end: true, icon: User }]
    : NAV_LINKS

  const baseBorderBg = isRestaurantMenu
    ? 'border-vantix-cyan/25 bg-vantix-surface-raised/80 backdrop-blur-md'
    : 'vantix-nav-shell'

  const sizeClasses = navExpanded
    ? 'rounded-xl px-2.5 py-1.5 sm:rounded-3xl sm:px-6 sm:py-3'
    : 'rounded-lg px-2 py-1 sm:rounded-xl sm:px-4 sm:py-1.5'

  return (
    <nav
      className={`relative flex min-w-0 items-center justify-between gap-1.5 overflow-x-auto border sm:gap-4 sm:overflow-visible ${
        isRestaurantMenu ? '' : 'transition-all duration-300'
      } ${sizeClasses} ${baseBorderBg}`}
    >
      {navTitle ? (
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-0 max-w-[calc(100%-7.5rem)] -translate-x-1/2 -translate-y-1/2 sm:max-w-[calc(100%-14rem)]">
          <h1 className="truncate text-center font-display text-sm font-bold tracking-tight text-vantix-fg sm:text-base">
            {navTitle}
          </h1>
        </div>
      ) : null}

      <Link
        to={user ? ROUTES.RESTAURANTS : ROUTES.HOME}
        className="relative z-10 flex min-w-0 shrink items-center rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-vantix-fg/20 focus-visible:ring-offset-2"
        aria-label={user ? 'מסעדות' : 'עמוד הבית'}
      >
        <div className="flex shrink-0" style={{ perspective: '1000px' }}>
          <motion.div
            style={{ transformStyle: 'preserve-3d' }}
            animate={{ rotateY: 360 }}
            transition={{ repeat: Infinity, duration: 6, ease: 'linear' }}
          >
            <Logo size={navExpanded ? 28 : 22} />
          </motion.div>
        </div>
      </Link>

      {!isRestaurantMenu ? (
      <div className="hidden shrink-0 items-center gap-2 sm:flex sm:gap-6 lg:gap-8">
        {desktopNavLinks.map((link) => {
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
      ) : null}

      <div className="relative z-10 flex min-w-0 shrink items-center gap-2 sm:gap-3 sm:px-0">
        <ThemeToggle variant="icon" />
        {isRestaurantMenu ? (
          <Link
            to={ROUTES.RESTAURANTS}
            className={`vantix-btn-ghost inline-flex shrink-0 items-center justify-center gap-1 ${
              navExpanded
                ? 'min-h-[44px] min-w-[44px] px-3 py-2 text-sm sm:min-h-0 sm:min-w-0 sm:px-4'
                : 'min-h-[32px] min-w-[32px] px-2 py-1 text-xs sm:min-h-0 sm:min-w-0 sm:px-3'
            }`}
            aria-label="חזרה לרשימת המסעדות"
          >
            <ChevronRight className={navExpanded ? 'h-4 w-4 shrink-0' : 'h-3.5 w-3.5 shrink-0'} />
            <span className="hidden sm:inline">חזרה</span>
          </Link>
        ) : loading ? null : user ? (
          greetingLabel ? (
            <Link
              to={ROUTES.PROFILE}
              title={user.email ?? displayName}
              className={`hidden max-w-[100px] shrink overflow-hidden text-ellipsis whitespace-nowrap rounded-full border border-vantix-cyan/20 bg-vantix-surface-raised px-2.5 py-1.5 text-xs font-semibold text-vantix-fg-muted transition hover:border-vantix-cyan/35 hover:text-vantix-fg sm:block sm:max-w-[140px] md:max-w-[180px] ${
                navExpanded ? 'px-3 py-2 text-sm' : ''
              }`}
            >
              {greetingLabel}
            </Link>
          ) : (
            <Link
              to={ROUTES.PROFILE}
              className={`vantix-btn-ghost hidden items-center gap-1.5 sm:inline-flex ${
                navExpanded ? 'px-3 py-2 text-sm' : 'px-2.5 py-1.5 text-xs'
              }`}
              aria-label="פרופיל"
            >
              <User className="h-4 w-4 shrink-0" />
              <span>פרופיל</span>
            </Link>
          )
        ) : (
          <button
            type="button"
            onClick={() => openAuthSheet('login', ROUTES.RESTAURANTS)}
            className={`vantix-btn-primary ${navExpanded ? 'px-5 py-2 text-sm' : 'px-4 py-1.5 text-xs'}`}
          >
            להתחיל הזמנה
          </button>
        )}
      </div>
    </nav>
  )
}

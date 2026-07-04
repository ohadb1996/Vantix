import { NavLink, useLocation } from 'react-router-dom'
import { Home, UtensilsCrossed, History, User, Search } from 'lucide-react'
import { ROUTES } from '../../constants/app'
import { haptic } from '../../lib/native'
import { useAuth } from '../../context/AuthContext'

const ALL_TABS = [
  { to: ROUTES.HOME, label: 'בית', icon: Home, end: true, guestOnly: true },
  { to: ROUTES.RESTAURANTS, label: 'מסעדות', icon: UtensilsCrossed, end: false, guestOnly: false },
  { to: ROUTES.SEARCH, label: 'חיפוש', icon: Search, end: true, guestOnly: false },
  { to: ROUTES.ORDERS, label: 'הזמנות', icon: History, end: false, guestOnly: false },
  { to: ROUTES.PROFILE, label: 'פרופיל', icon: User, end: false, guestOnly: false },
]

/**
 * בר ניווט תחתון בסגנון אפליקציה נייטיבית — מוצג רק במובייל (sm ומטה).
 * מוסתר במסך תפריט מסעדה (שם יש בר עגלה תחתון משלו) וכשהמקלדת פתוחה.
 */
export function BottomTabBar() {
  const location = useLocation()
  const { user } = useAuth()
  const isRestaurantMenu = /^\/restaurants\/[^/]+$/.test(location.pathname)
  if (isRestaurantMenu) return null

  const tabs = user ? ALL_TABS.filter((t) => !t.guestOnly) : ALL_TABS

  return (
    <nav
      className="vantix-bottom-tabs fixed inset-x-0 bottom-0 z-40 border-t border-vantix-line/10 bg-vantix-surface-raised/95 backdrop-blur-md sm:hidden"
      style={{ paddingBottom: 'var(--sab)' }}
      aria-label="ניווט ראשי"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <li key={tab.to} className="flex-1">
              <NavLink
                to={tab.to}
                end={tab.end}
                onClick={() => void haptic.light()}
                className={({ isActive }) =>
                  `flex min-h-[56px] flex-col items-center justify-center gap-1 px-1 pt-2 text-[11px] font-semibold transition-colors ${
                    isActive ? 'text-vantix-cyan' : 'text-vantix-fg-subtle hover:text-vantix-fg-muted'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${
                        isActive ? 'bg-vantix-cyan/12' : ''
                      }`}
                    >
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <span>{tab.label}</span>
                  </>
                )}
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

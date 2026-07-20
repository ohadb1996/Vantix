import { Outlet, useLocation } from 'react-router-dom'
import { MainNav } from '../components/navigation/MainNav'
import { BottomTabBar } from '../components/navigation/BottomTabBar'
import { ScrollToTop } from '../components/navigation/ScrollToTop'
import { useScrolled } from '../hooks/useScrolled'

export const AppLayout = () => {
  const location = useLocation()
  const scrolled = useScrolled()
  const isRestaurantMenu = /^\/restaurants\/[^/]+$/.test(location.pathname)
  const navExpanded = isRestaurantMenu ? false : scrolled

  const headerPadding = navExpanded
    ? 'px-3 py-3 sm:px-6 sm:py-4 lg:px-10 lg:py-6'
    : isRestaurantMenu
      ? 'px-3 pt-1 pb-0 sm:px-6 sm:pt-1.5 sm:pb-0 lg:px-10 lg:pt-2 lg:pb-0'
      : 'px-3 py-1.5 sm:px-6 sm:py-2 lg:px-10 lg:py-3'

  return (
    <div className="vantix-page-bg relative flex h-full min-h-0 flex-col overflow-hidden text-vantix-fg">
      <ScrollToTop />
      <header
        className={`sticky top-0 z-50 shrink-0 ${isRestaurantMenu ? '' : 'transition-all duration-300'} ${headerPadding} bg-transparent`}
      >
        <MainNav />
      </header>

      <main
        className={`scrollbar-hide mx-auto flex w-full max-w-6xl min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain px-3 pb-[calc(7rem+var(--sab))] sm:px-6 sm:pb-32 lg:px-10 ${
          isRestaurantMenu ? 'gap-0' : 'gap-8 sm:gap-12'
        }`}
      >
        <Outlet />
      </main>

      <BottomTabBar />
    </div>
  )
}

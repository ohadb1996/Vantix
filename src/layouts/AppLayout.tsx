import { Outlet, useLocation } from 'react-router-dom'
import { MainNav } from '../components/navigation/MainNav'
import { BottomTabBar } from '../components/navigation/BottomTabBar'
import { ScrollToTop } from '../components/navigation/ScrollToTop'
import { useScrolled } from '../hooks/useScrolled'

export const AppLayout = () => {
  const location = useLocation()
  const scrolled = useScrolled()
  const isRestaurantMenu = /^\/restaurants\/[^/]+$/.test(location.pathname)

  const headerPadding = scrolled
    ? isRestaurantMenu
      ? 'px-3 py-1 sm:px-6 sm:py-1.5 lg:px-10 lg:py-2'
      : 'px-3 py-3 sm:px-6 sm:py-4 lg:px-10 lg:py-6'
    : isRestaurantMenu
      ? 'px-3 py-1.5 sm:px-6 sm:py-2 lg:px-10 lg:py-3'
      : 'px-3 py-1.5 sm:px-6 sm:py-2 lg:px-10 lg:py-3'

  return (
    <div className="vantix-page-bg relative flex h-full min-h-0 flex-col overflow-hidden text-vantix-fg">
      <ScrollToTop />
      <header
        className={`sticky top-0 z-50 shrink-0 transition-all duration-300 ${headerPadding} ${
          isRestaurantMenu ? 'bg-transparent backdrop-blur-none' : 'bg-transparent'
        }`}
      >
        <MainNav />
      </header>

      <main className="scrollbar-hide mx-auto flex w-full max-w-6xl min-h-0 flex-1 flex-col gap-8 overflow-y-auto overscroll-y-contain px-3 pb-[calc(7rem+var(--sab))] sm:gap-12 sm:px-6 sm:pb-32 lg:px-10">
        <Outlet />
      </main>

      <BottomTabBar />
    </div>
  )
}

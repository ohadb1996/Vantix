import { Outlet, useLocation } from 'react-router-dom'
import { MainNav } from '../components/navigation/MainNav'
import { useScrolled } from '../hooks/useScrolled'

export const AppLayout = () => {
  const location = useLocation()
  const scrolled = useScrolled()
  const isRestaurantMenu = /^\/restaurants\/[^/]+$/.test(location.pathname)

  const headerPadding = scrolled
    ? 'px-3 py-3 sm:px-6 sm:py-4 lg:px-10 lg:py-6'
    : 'px-3 py-1.5 sm:px-6 sm:py-2 lg:px-10 lg:py-3'

  return (
    <div className="vantix-page-bg relative flex min-h-screen flex-col text-vantix-fg">
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${headerPadding} ${
          isRestaurantMenu ? 'bg-transparent backdrop-blur-none' : 'bg-transparent'
        }`}
      >
        <MainNav />
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-3 pb-24 sm:gap-12 sm:px-6 sm:pb-32 lg:px-10">
        <Outlet />
      </main>
    </div>
  )
}

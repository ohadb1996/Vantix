import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useRestaurants } from '../../hooks/useRestaurants'
import { useAuth } from '../../context/AuthContext'
import { useAuthSheet } from '../../context/AuthSheetContext'
import { ROUTES } from '../../constants/app'
import type { BusinessWithMenu } from '../../services/orderService'

const CARD_WIDTH = 160
const CARD_GAP = 12

const BusinessCard = ({
  business,
  isLoggedIn,
  onRequireAuth,
}: {
  business: BusinessWithMenu
  isLoggedIn: boolean
  onRequireAuth: (menuPath: string) => void
}) => {
  const [logoError, setLogoError] = useState(false)
  const showLogo = business.logoUrl && !logoError

  const menuPath = ROUTES.RESTAURANT_MENU(business.businessId)

  return (
    <Link
      to={menuPath}
      onClick={(event) => {
        if (!isLoggedIn) {
          event.preventDefault()
          onRequireAuth(menuPath)
        }
      }}
      className="flex flex-shrink-0 flex-col rounded-2xl border border-vantix-cyan/20 bg-vantix-surface-raised p-4 shadow-vantix transition hover:border-vantix-cyan/40 hover:shadow-glow focus:outline-none focus:ring-2 focus:ring-vantix-cyan focus:ring-offset-2"
      style={{ width: `${CARD_WIDTH}px`, height: '160px' }}
    >
      <div className="flex min-h-0 flex-1 items-center justify-center rounded-xl bg-vantix-surface-raised p-3">
        {showLogo ? (
          <div className="flex h-full w-full items-center justify-center">
            <img
              src={business.logoUrl}
              alt=""
              className="max-h-full max-w-full object-contain"
              onError={() => setLogoError(true)}
            />
          </div>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center rounded-xl bg-vantix-surface p-2 text-center">
            <span className="font-display text-sm font-semibold text-vantix-fg leading-tight line-clamp-2">
              {business.businessName}
            </span>
            <span className="mt-1 text-[10px] text-vantix-fg-muted">
              {business.itemsCount} פריטים
            </span>
          </div>
        )}
      </div>
      {showLogo && (
        <p className="mt-1.5 truncate text-center text-xs font-medium text-vantix-fg" title={business.businessName}>
          {business.businessName}
        </p>
      )}
    </Link>
  )
}

export const PartnersCarousel = () => {
  const { user } = useAuth()
  const { openAuthSheet } = useAuthSheet()
  const { data: businesses, isLoading } = useRestaurants()
  const list = businesses ?? []
  const isLoggedIn = !!user
  const oneSetWidth = list.length * (CARD_WIDTH + CARD_GAP)
  const allBusinesses = list.length > 0 ? [...list, ...list] : []

  return (
    <>
      <div className="px-6 pb-5 pt-10 text-center relative">
        <h2 className="font-display text-3xl font-bold text-vantix-fg sm:text-4xl lg:text-5xl">
          עובדים איתנו
        </h2>
        <p className="mt-3 text-base text-vantix-fg-muted sm:text-lg lg:text-xl">
          כבר מאות בעלי עסקים כבר בחרו להצטרף אלינו
        </p>
        <div className="mt-6 flex justify-center">
          <div className="animated-underline relative h-1 w-72 overflow-hidden rounded-full">
            <div className="underline-line absolute left-0 top-0 h-full w-full rounded-full bg-gradient-to-r from-transparent via-vantix-orange to-transparent dark:via-vantix-cyan" />
          </div>
        </div>
      </div>

      <section
        className="relative overflow-hidden py-8 w-screen"
        style={{ marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}
      >
        <div className="relative w-full overflow-hidden" style={{ minHeight: '160px' }}>
          <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-vantix-surface via-vantix-surface/80 to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-vantix-surface via-vantix-surface/80 to-transparent" />

          {isLoading ? (
            <div className="flex gap-3 justify-center py-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="flex-shrink-0 rounded-2xl border border-vantix-cyan/20 bg-vantix-surface-raised p-4 animate-pulse"
                  style={{ width: CARD_WIDTH, height: 160 }}
                >
                  <div className="h-full w-full rounded-xl bg-gradient-to-l from-vantix-cyan to-vantix-orange/5" />
                </div>
              ))}
            </div>
          ) : allBusinesses.length === 0 ? (
            <p className="py-8 text-center text-sm text-vantix-fg-subtle">אין עדיין עסקים עם תפריט.</p>
          ) : (
            <div
              className="flex gap-3"
              style={{
                display: 'flex',
                width: 'max-content',
                position: 'absolute',
                left: 0,
                top: 0,
                animation: `scrollInfinite 80s linear infinite`,
                willChange: 'transform',
              }}
            >
              {allBusinesses.map((business, index) => (
                <BusinessCard
                  key={`${business.businessId}-${index}`}
                  business={business}
                  isLoggedIn={isLoggedIn}
                  onRequireAuth={(menuPath) => openAuthSheet('login', menuPath)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <style>{`
        @keyframes scrollInfinite {
          0% { transform: translateX(0); }
          100% { transform: translateX(-${oneSetWidth}px); }
        }
        .animated-underline {
          animation: showUnderline 10s ease-in-out infinite;
        }
        .underline-line {
          animation: drawUnderline 10s ease-in-out infinite;
        }
        @keyframes showUnderline {
          0%, 92% { opacity: 0; }
          3%, 89% { opacity: 1; }
        }
        @keyframes drawUnderline {
          0% { transform: scaleX(0); opacity: 0; }
          3% { opacity: 1; }
          4% { transform: scaleX(0); opacity: 1; }
          6% { transform: scaleX(1); opacity: 1; }
          88% { transform: scaleX(1); opacity: 1; }
          89% { transform: scaleX(1); opacity: 0; }
          90%, 100% { transform: scaleX(0); opacity: 0; }
        }
      `}</style>
    </>
  )
}

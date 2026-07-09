import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, UtensilsCrossed } from 'lucide-react'
import { RestaurantCard } from '../../components/cards/RestaurantCard'
import { WalletBalanceBanner } from '../../components/wallet/WalletBalanceBanner'
import { StoreVerticalShortcuts } from '../../components/discovery/StoreVerticalShortcuts'
import { DeliveryLocationBanner } from '../../components/location/DeliveryLocationBanner'
import { useToast } from '../../components/ui/Toast'
import { haptic } from '../../lib/native'
import { ReelsFeed } from '../../components/reels/ReelsFeed'
import { useReels } from '../../hooks/useReels'
import { useRestaurantCategories } from '../../hooks/useRestaurantCategories'
import { useBusinessLikes } from '../../hooks/useBusinessLikes'
import { useCustomerRestaurantCatalog } from '../../hooks/useCustomerRestaurantCatalog'
import { useAuthSheet } from '../../context/AuthSheetContext'
import { ROUTES } from '../../constants/app'
import {
  FAVORITES_CATEGORY_ID,
  FAVORITES_CATEGORY_NAME,
  RECOMMENDED_CATEGORY_ID,
  RECOMMENDED_CATEGORY_NAME,
} from '../../services/restaurantCategories'
import { filterBusinessesByStoreVertical, type StoreVerticalId } from '../../constants/storeVerticals'
import type { BusinessWithMenu } from '../../services/orderService'

function RestaurantCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-vantix-cyan/20 bg-vantix-surface-raised">
      <div className="h-48 animate-pulse bg-vantix-overlay/5" />
      <div className="space-y-3 p-5">
        <div className="h-6 w-2/3 animate-pulse rounded bg-brand-slate/10" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-brand-slate/10" />
        <div className="flex gap-2">
          <div className="h-6 w-20 animate-pulse rounded-full bg-brand-slate/10" />
          <div className="h-6 w-16 animate-pulse rounded-full bg-brand-slate/10" />
        </div>
      </div>
    </div>
  )
}

type CategorySection = {
  id: string
  title: string
  businesses: BusinessWithMenu[]
  isSystem?: boolean
}

export const RestaurantsPage = () => {
  const [searchParams] = useSearchParams()
  const legacyQuery = searchParams.get('q')?.trim()
  const toast = useToast()
  const { openAuthSheet } = useAuthSheet()
  const [selectedVertical, setSelectedVertical] = useState<StoreVerticalId | null>(null)
  const { data: reels } = useReels()
  const { data: categories } = useRestaurantCategories()
  const { isLiked, likedBusinessIds, toggleLike, togglingId, isLoggedIn } = useBusinessLikes()
  const {
    businesses,
    distanceKmByBusiness,
    deliveryFeeByBusiness,
    minDeliveryTotalByBusiness,
    isLoadingRestaurants,
    isRefreshingRestaurants,
    refetchRestaurants,
    savedAddresses,
    quoteLocationChoice,
    setQuoteLocationChoice,
    isResolvingQuoteLocation,
    quoteGeoUnavailable,
    useLocationFilter,
    catalogLocationKey,
    maxDeliveryKm,
    listError: error,
    discoverError,
  } = useCustomerRestaurantCatalog(isLoggedIn)

  useEffect(() => {
    if (error) toast.error('לא הצלחנו לטעון את המסעדות. בדקו את החיבור לאינטרנט ונסו שוב.')
  }, [error, toast])

  useEffect(() => {
    if (discoverError) toast.error('לא הצלחנו לטעון מסעדות באזור המיקום שנבחר.')
  }, [discoverError, toast])

  const visibleBusinesses = useMemo(
    () => filterBusinessesByStoreVertical(businesses ?? [], selectedVertical),
    [businesses, selectedVertical],
  )

  const businessById = useMemo(() => {
    const map = new Map<string, BusinessWithMenu>()
    for (const b of visibleBusinesses) map.set(b.businessId, b)
    return map
  }, [visibleBusinesses])

  const categorySections = useMemo((): CategorySection[] => {
    if (!visibleBusinesses.length) return []

    const sections: CategorySection[] = []
    const assigned = new Set<string>()

    const recommended = visibleBusinesses.filter((b) => b.isRecommended === true)
    if (recommended.length > 0) {
      sections.push({
        id: RECOMMENDED_CATEGORY_ID,
        title: RECOMMENDED_CATEGORY_NAME,
        businesses: recommended,
        isSystem: true,
      })
    }

    if (isLoggedIn && likedBusinessIds.size > 0) {
      const favorites = [...likedBusinessIds]
        .map((id) => businessById.get(id))
        .filter((b): b is BusinessWithMenu => !!b)
      if (favorites.length > 0) {
        sections.push({
          id: FAVORITES_CATEGORY_ID,
          title: FAVORITES_CATEGORY_NAME,
          businesses: favorites,
          isSystem: true,
        })
      }
    }

    for (const cat of categories ?? []) {
      const catBusinesses = cat.businessIds
        .map((id) => businessById.get(id))
        .filter((b): b is BusinessWithMenu => !!b)
      if (catBusinesses.length === 0) continue
      sections.push({
        id: cat.id,
        title: cat.name,
        businesses: catBusinesses,
      })
      for (const b of catBusinesses) assigned.add(b.businessId)
    }

    const uncategorized = visibleBusinesses.filter((b) => !assigned.has(b.businessId))
    if (uncategorized.length > 0 && (categories?.length ?? 0) > 0) {
      sections.push({
        id: '__other__',
        title: 'עוד מסעדות',
        businesses: uncategorized,
      })
    }

    if (sections.length === 0 && visibleBusinesses.length > 0) {
      sections.push({
        id: '__all__',
        title: 'כל המסעדות',
        businesses: visibleBusinesses,
      })
    }

    return sections
  }, [visibleBusinesses, categories, businessById, isLoggedIn, likedBusinessIds])

  const handleLike = async (businessId: string) => {
    if (!isLoggedIn) {
      toast.info('יש להתחבר כדי לסמן לייק')
      openAuthSheet('login', ROUTES.RESTAURANTS)
      return
    }
    void haptic.light()
    const result = await toggleLike(businessId)
    if (result === 'error') {
      toast.error('לא הצלחנו לעדכן את הלייק. נסו שוב.')
    }
  }

  const renderBusinessCard = (b: BusinessWithMenu, matchedTags?: string[]) => {
    const menuPath = ROUTES.RESTAURANT_MENU(b.businessId)

    return (
    <Link
      key={b.businessId}
      to={menuPath}
      onClick={(event) => {
        if (!isLoggedIn) {
          event.preventDefault()
          openAuthSheet('login', menuPath)
        }
      }}
      className="block h-full w-[min(72vw,315px)] shrink-0 snap-start rounded-2xl px-1 py-2 outline-none focus-visible:ring-2 focus-visible:ring-vantix-cyan focus-visible:ring-offset-2 sm:w-[300px] sm:rounded-3xl"
    >
      <RestaurantCard
        name={b.businessName}
        eta="הזמנה ומשלוח"
        distanceKm={distanceKmByBusiness[b.businessId]}
        deliveryFee={deliveryFeeByBusiness[b.businessId]}
        minDeliveryTotal={minDeliveryTotalByBusiness[b.businessId]}
        address={b.pickupAddress ?? '—'}
        heroImage={b.logoUrl ?? undefined}
        tags={matchedTags ?? []}
        isLiked={isLiked(b.businessId)}
        likeDisabled={togglingId === b.businessId}
        onLikeClick={() => void handleLike(b.businessId)}
        isClosed={b.isOpenNow === false}
      />
    </Link>
    )
  }

  if (legacyQuery) {
    return <Navigate to={`${ROUTES.SEARCH}?q=${encodeURIComponent(legacyQuery)}`} replace />
  }

  return (
    <div className="space-y-6 sm:space-y-10">
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-3 sm:space-y-4"
      >
        <StoreVerticalShortcuts selected={selectedVertical} onChange={setSelectedVertical} />
        <WalletBalanceBanner />
        <DeliveryLocationBanner
          choice={quoteLocationChoice}
          onChoiceChange={setQuoteLocationChoice}
          savedAddresses={savedAddresses}
          isResolving={isResolvingQuoteLocation}
          geoUnavailable={quoteGeoUnavailable}
        />
      </motion.header>

      {reels && reels.length > 0 && <ReelsFeed reels={reels} />}

      {isLoadingRestaurants && (
        <section className="space-y-4">
          {isResolvingQuoteLocation ? (
            <p className="text-center text-sm text-vantix-fg-muted">מאתרים מסעדות באזור המיקום שנבחר...</p>
          ) : null}
          <div className="grid gap-6 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <RestaurantCardSkeleton key={i} />
            ))}
          </div>
        </section>
      )}

      {discoverError && useLocationFilter && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800"
        >
          <p className="font-medium">לא הצלחנו לטעון מסעדות באזור המיקום שנבחר.</p>
          <button
            type="button"
            onClick={() => void refetchRestaurants()}
            disabled={isRefreshingRestaurants}
            className="mt-3 rounded-xl border border-amber-300 bg-vantix-surface-raised px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100 disabled:opacity-50"
          >
            {isRefreshingRestaurants ? 'טוען...' : 'נסה שוב'}
          </button>
        </motion.div>
      )}

      {error && !useLocationFilter && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800"
        >
          <p className="font-medium">לא הצלחנו לטעון את רשימת המסעדות.</p>
          <p className="mt-1 text-sm text-amber-700/90">
            בדקו את החיבור לאינטרנט ונסו שוב. אם הבעיה נמשכת, נסו שוב מאוחר יותר.
          </p>
          <button
            type="button"
            onClick={() => void refetchRestaurants()}
            disabled={isRefreshingRestaurants}
            className="mt-3 rounded-xl border border-amber-300 bg-vantix-surface-raised px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100 disabled:opacity-50"
          >
            {isRefreshingRestaurants ? 'טוען...' : 'נסה שוב'}
          </button>
        </motion.div>
      )}

      {!isLoadingRestaurants && !error && !discoverError && (!businesses || businesses.length === 0) && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-vantix-cyan/25 bg-vantix-surface-raised p-12 text-center"
        >
          <UtensilsCrossed className="h-14 w-14 text-vantix-cyan/50" />
          {useLocationFilter ? (
            <>
              <p className="text-vantix-fg-muted">
                אין מסעדות בטווח משלוח מהמיקום שנבחר
                {maxDeliveryKm ? ` (עד ${maxDeliveryKm} ק"מ)` : ''}.
              </p>
              <p className="text-sm text-vantix-fg-subtle">נסו לבחור מיקום אחר או כתובת שמורה קרובה יותר.</p>
            </>
          ) : (
            <>
              <p className="text-vantix-fg-muted">אין עדיין עסקים עם תפריט.</p>
              <p className="text-sm text-vantix-fg-subtle">
                בעלי עסקים יכולים להוסיף תפריט באפליקציית Vantix Partners בעמוד &quot;תפריט&quot;.
              </p>
            </>
          )}
        </motion.div>
      )}

      {!isLoadingRestaurants && !error && !discoverError && businesses && businesses.length > 0 && visibleBusinesses.length === 0 && selectedVertical && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-vantix-cyan/25 bg-vantix-surface-raised p-10 text-center"
        >
          <p className="text-vantix-fg-muted">אין עסקים מהסוג שנבחר באזור שלך כרגע.</p>
          <button
            type="button"
            onClick={() => setSelectedVertical(null)}
            className="mt-4 text-sm font-semibold text-vantix-cyan hover:underline"
          >
            הצג הכל
          </button>
        </motion.div>
      )}

      {!isLoadingRestaurants && !error && !discoverError && visibleBusinesses.length > 0 && (
        <AnimatePresence mode="wait">
          {categorySections.length > 0 && (
            <motion.div
              key={catalogLocationKey ?? 'guest'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8 sm:space-y-10"
            >
              {categorySections.map((section) => (
                <CategoryCarousel
                  key={section.id}
                  section={section}
                  renderCard={(b) => renderBusinessCard(b)}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  )
}

function CategoryCarousel({
  section,
  renderCard,
}: {
  section: CategorySection
  renderCard: (b: BusinessWithMenu) => React.ReactNode
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scrollByAmount = (direction: 'next' | 'prev') => {
    const el = scrollRef.current
    if (!el) return
    const amount = Math.max(el.clientWidth * 0.8, 240)
    el.scrollBy({ left: direction === 'next' ? -amount : amount, behavior: 'smooth' })
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-3 sm:space-y-4"
      aria-label={section.title}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-xl text-vantix-fg sm:text-2xl">
            {section.title}
          </h2>
        </div>
        <div className="hidden gap-2 sm:flex">
          <button
            type="button"
            onClick={() => scrollByAmount('prev')}
            aria-label="הקודם"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-vantix-cyan/25 bg-vantix-surface-raised text-vantix-fg-muted transition hover:border-vantix-cyan/40 hover:text-vantix-fg"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => scrollByAmount('next')}
            aria-label="הבא"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-vantix-cyan/25 bg-vantix-surface-raised text-vantix-fg-muted transition hover:border-vantix-cyan/40 hover:text-vantix-fg"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex snap-x snap-mandatory items-stretch gap-3 overflow-x-auto py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {section.businesses.map((b) => renderCard(b))}
      </div>
    </motion.section>
  )
}

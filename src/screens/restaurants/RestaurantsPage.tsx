import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Heart, Search, UtensilsCrossed } from 'lucide-react'
import { RestaurantCard } from '../../components/cards/RestaurantCard'
import { WalletBalanceBanner } from '../../components/wallet/WalletBalanceBanner'
import { useToast } from '../../components/ui/Toast'
import { haptic } from '../../lib/native'
import { ReelsFeed } from '../../components/reels/ReelsFeed'
import { useRestaurants } from '../../hooks/useRestaurants'
import { useReels } from '../../hooks/useReels'
import { useRestaurantCategories } from '../../hooks/useRestaurantCategories'
import { useBusinessLikes } from '../../hooks/useBusinessLikes'
import { ROUTES } from '../../constants/app'
import {
  FAVORITES_CATEGORY_ID,
  FAVORITES_CATEGORY_NAME,
  RECOMMENDED_CATEGORY_NAME,
  TOP_LIKED_COUNT,
} from '../../services/restaurantCategories'
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
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') ?? '')
  const toast = useToast()
  const { data: businesses, isLoading, error, refetch, isRefetching } = useRestaurants()
  const { data: reels } = useReels()
  const { data: categories } = useRestaurantCategories()
  const { isLiked, likedBusinessIds, toggleLike, togglingId, isLoggedIn } = useBusinessLikes()

  useEffect(() => {
    if (error) toast.error('לא הצלחנו לטעון את המסעדות. בדקו את החיבור לאינטרנט ונסו שוב.')
  }, [error, toast])

  const q = searchQuery.trim().toLowerCase()
  const isSearching = q.length > 0

  const businessById = useMemo(() => {
    const map = new Map<string, BusinessWithMenu>()
    for (const b of businesses ?? []) map.set(b.businessId, b)
    return map
  }, [businesses])

  const filteredBusinesses = useMemo(() => {
    if (!businesses) return []
    if (!q) return businesses
    return businesses.filter(
      (b) =>
        b.businessName.toLowerCase().includes(q) ||
        b.businessId.toLowerCase().includes(q) ||
        (b.menuItemNames ?? []).some((n) => n.toLowerCase().includes(q))
    )
  }, [businesses, q])

  const matchedDishesByBusiness = useMemo(() => {
    const map: Record<string, string[]> = {}
    if (!q) return map
    for (const b of filteredBusinesses) {
      const dishes = (b.menuItemNames ?? [])
        .filter((n) => n.toLowerCase().includes(q))
        .slice(0, 3)
      if (dishes.length) map[b.businessId] = dishes
    }
    return map
  }, [filteredBusinesses, q])

  const categorySections = useMemo((): CategorySection[] => {
    if (!businesses?.length || isSearching) return []

    const sections: CategorySection[] = []
    const assigned = new Set<string>()

    const topLiked = [...businesses]
      .filter((b) => (b.likeCount ?? 0) > 0)
      .sort((a, b) => (b.likeCount ?? 0) - (a.likeCount ?? 0))
      .slice(0, TOP_LIKED_COUNT)

    if (topLiked.length > 0) {
      sections.push({
        id: '__recommended__',
        title: RECOMMENDED_CATEGORY_NAME,
        businesses: topLiked,
        isSystem: true,
      })
      for (const b of topLiked) assigned.add(b.businessId)
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

    const uncategorized = businesses.filter((b) => !assigned.has(b.businessId))
    if (uncategorized.length > 0 && (categories?.length ?? 0) > 0) {
      sections.push({
        id: '__other__',
        title: 'עוד מסעדות',
        businesses: uncategorized,
      })
    }

    if (sections.length === 0 && businesses.length > 0) {
      sections.push({
        id: '__all__',
        title: 'כל המסעדות',
        businesses,
      })
    }

    return sections
  }, [businesses, categories, businessById, isSearching, isLoggedIn, likedBusinessIds])

  const handleLike = async (businessId: string) => {
    if (!isLoggedIn) {
      toast.info('יש להתחבר כדי לסמן לייק')
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
    const to = isLoggedIn ? menuPath : ROUTES.AUTH_LOGIN
    const linkState = isLoggedIn ? undefined : { from: { pathname: menuPath } }

    return (
    <Link
      key={b.businessId}
      to={to}
      state={linkState}
      className="block h-full w-[min(94vw,420px)] shrink-0 snap-start rounded-2xl px-1 py-2 outline-none focus-visible:ring-2 focus-visible:ring-vantix-cyan focus-visible:ring-offset-2 sm:w-[400px] sm:rounded-3xl"
    >
      <RestaurantCard
        name={b.businessName}
        eta="הזמנה ומשלוח"
        address={b.pickupAddress ?? '—'}
        heroImage={b.logoUrl ?? undefined}
        tags={matchedTags ?? []}
        isLiked={isLiked(b.businessId)}
        likeDisabled={togglingId === b.businessId}
        onLikeClick={() => void handleLike(b.businessId)}
      />
    </Link>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-10">
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-5 sm:space-y-6"
      >
        <WalletBalanceBanner />

        <div className="flex items-center gap-3 rounded-2xl border border-vantix-line/10 bg-vantix-surface-raised px-4 py-3 shadow-sm">
          <Search className="h-5 w-5 shrink-0 text-vantix-fg-subtle" />
          <input
            placeholder="חיפוש מסעדות או מנות..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full min-w-0 bg-transparent text-sm text-vantix-fg placeholder:text-vantix-fg-subtle focus:outline-none"
            aria-label="חיפוש מסעדות או מנות"
          />
        </div>
      </motion.header>

      {!isSearching && reels && reels.length > 0 && <ReelsFeed reels={reels} />}

      {isLoading && (
        <section className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <RestaurantCardSkeleton key={i} />
          ))}
        </section>
      )}

      {error && (
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
            onClick={() => void refetch()}
            disabled={isRefetching}
            className="mt-3 rounded-xl border border-amber-300 bg-vantix-surface-raised px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100 disabled:opacity-50"
          >
            {isRefetching ? 'טוען...' : 'נסה שוב'}
          </button>
        </motion.div>
      )}

      {!isLoading && !error && (!businesses || businesses.length === 0) && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-vantix-cyan/25 bg-vantix-surface-raised p-12 text-center"
        >
          <UtensilsCrossed className="h-14 w-14 text-vantix-cyan/50" />
          <p className="text-vantix-fg-muted">אין עדיין עסקים עם תפריט.</p>
          <p className="text-sm text-vantix-fg-subtle">
            בעלי עסקים יכולים להוסיף תפריט באפליקציית Vantix Partners בעמוד &quot;תפריט&quot;.
          </p>
        </motion.div>
      )}

      {!isLoading && !error && businesses && businesses.length > 0 && filteredBusinesses.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center text-amber-800"
        >
          לא נמצאו מסעדות התואמות את החיפוש &quot;{searchQuery}&quot;
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {!isLoading && !error && !isSearching && categorySections.length > 0 && (
          <motion.div
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

        {!isLoading && !error && isSearching && filteredBusinesses.length > 0 && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="grid gap-4 sm:gap-6 md:grid-cols-2"
          >
            {filteredBusinesses.map((b, index) => {
              const menuPath = ROUTES.RESTAURANT_MENU(b.businessId)
              const to = isLoggedIn ? menuPath : ROUTES.AUTH_LOGIN
              const linkState = isLoggedIn ? undefined : { from: { pathname: menuPath } }

              return (
              <motion.div
                key={b.businessId}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.05 }}
              >
                <Link
                  to={to}
                  state={linkState}
                  className="block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-vantix-cyan focus-visible:ring-offset-2 sm:rounded-3xl"
                >
                  <RestaurantCard
                    name={b.businessName}
                    eta="הזמנה ומשלוח"
                    address={b.pickupAddress ?? '—'}
                    heroImage={b.logoUrl ?? undefined}
                    tags={matchedDishesByBusiness[b.businessId] ?? []}
                    isLiked={isLiked(b.businessId)}
                    likeDisabled={togglingId === b.businessId}
                    onLikeClick={() => void handleLike(b.businessId)}
                  />
                </Link>
              </motion.div>
              )
            })}
          </motion.section>
        )}
      </AnimatePresence>
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
          {section.isSystem ? (
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-400/15 text-red-400">
              <Heart className="h-4 w-4 fill-red-400" />
            </span>
          ) : null}
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

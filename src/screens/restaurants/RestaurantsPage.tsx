import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Search, Star, UtensilsCrossed } from 'lucide-react'
import { RestaurantCard } from '../../components/cards/RestaurantCard'
import { ReelsFeed } from '../../components/reels/ReelsFeed'
import { useRestaurants } from '../../hooks/useRestaurants'
import { useReels } from '../../hooks/useReels'
import { ROUTES } from '../../constants/app'
import type { BusinessWithMenu } from '../../services/orderService'

function RestaurantCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-vantix-cyan/20 bg-vantix-surface-raised">
      <div className="h-48 animate-pulse bg-gradient-to-l from-vantix-cyan to-vantix-orange/5" />
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

export const RestaurantsPage = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const { data: businesses, isLoading, error, refetch, isRefetching } = useRestaurants()
  const { data: reels } = useReels()

  const q = searchQuery.trim().toLowerCase()
  const isSearching = q.length > 0

  // ⭐ מסעדות מומלצות (מסומנות ע"י האדמין) – לקרוסלה בראש העמוד
  const recommended = useMemo(
    () => (businesses ?? []).filter((b) => b.isRecommended),
    [businesses]
  )

  // 🔎 חיפוש כללי: לפי שם המסעדה, מזהה, או שם של מנה כלשהי בתפריט
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

  // מנות שתואמות את החיפוש – מוצגות כתגיות על הכרטיס כדי להבהיר למה המסעדה הופיעה
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

  return (
    <div className="space-y-6 sm:space-y-10">
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-4 rounded-2xl border border-vantix-cyan/30 bg-gradient-to-l from-vantix-cyan to-vantix-orange/12 p-4 shadow-[0_20px_50px_rgba(255,107,53,0.14)] backdrop-blur sm:space-y-6 sm:rounded-3xl sm:p-6 sm:shadow-[0_30px_70px_rgba(255,107,53,0.18)]"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2 sm:space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white sm:text-xs sm:tracking-[0.32em]">
              signature dining
            </p>
            <h1 className="font-display text-2xl text-vantix-fg sm:text-4xl sm:text-5xl">
              תן לי את הטעם המדויק עכשיו
            </h1>
            <p className="max-w-2xl text-xs text-vantix-fg-muted sm:text-sm">
              בחר עסק, עיין בתפריט והזמן – ההזמנה תגיע ישירות לבעל העסק עם התראה.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-3 rounded-xl border border-vantix-cyan/25 bg-vantix-surface-raised px-3 py-2.5 shadow-[0_12px_30px_rgba(0,0,0,0.05)] sm:rounded-2xl sm:px-4 sm:py-3 sm:shadow-[0_18px_40px_rgba(0,0,0,0.05)]">
            <Search className="h-4 w-4 text-vantix-cyan shrink-0 sm:h-5 sm:w-5" />
            <input
              placeholder="חיפוש מסעדות או מנות..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full min-w-0 bg-transparent text-sm text-vantix-fg placeholder:text-vantix-fg-subtle focus:outline-none"
              aria-label="חיפוש מסעדות או מנות"
            />
          </div>
        </div>
      </motion.header>

      {!isSearching && reels && reels.length > 0 && <ReelsFeed reels={reels} />}

      {!isLoading && !error && !isSearching && recommended.length > 0 && (
        <RecommendedCarousel businesses={recommended} />
      )}

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
          <p className="font-medium">לא ניתן לטעון את רשימת העסקים.</p>
          <p className="mt-1 text-sm text-amber-700/90">
            וודא שאתה מחובר לאינטרנט ושה־Firebase מוגדר. אם השגיאה ממשיכה – ייתכן שכללי האבטחה של Realtime Database חוסמים קריאה (נסה לאפשר קריאה ל־BusinessMenus ו־Businesses).
          </p>
          {error instanceof Error && error.message && (
            <p className="mt-2 text-xs font-mono text-amber-600/80 break-all" dir="ltr">
              {error.message}
            </p>
          )}
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
        {!isLoading && !error && filteredBusinesses && filteredBusinesses.length > 0 && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="grid gap-4 sm:gap-6 md:grid-cols-2"
          >
            {filteredBusinesses.map((b, index) => (
              <motion.div
                key={b.businessId}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.05 }}
              >
                <Link to={ROUTES.RESTAURANT_MENU(b.businessId)} className="block focus:outline-none focus:ring-2 focus:ring-vantix-cyan focus:ring-offset-2 rounded-2xl sm:rounded-3xl">
                  <RestaurantCard
                    name={b.businessName}
                    cuisine={`${b.itemsCount} פריטים • ${b.categoriesCount} קטגוריות`}
                    eta="הזמנה ומשלוח"
                    priceLevel="הזמנה מהתפריט"
                    distance="—"
                    heroImage={b.logoUrl ?? undefined}
                    tags={matchedDishesByBusiness[b.businessId] ?? []}
                  />
                </Link>
              </motion.div>
            ))}
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  )
}

function RecommendedCarousel({ businesses }: { businesses: BusinessWithMenu[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scrollByAmount = (direction: 'next' | 'prev') => {
    const el = scrollRef.current
    if (!el) return
    const amount = Math.max(el.clientWidth * 0.8, 240)
    // RTL: גלילה "קדימה" (לפריטים הבאים) היא שמאלה (ערך שלילי)
    el.scrollBy({ left: direction === 'next' ? -amount : amount, behavior: 'smooth' })
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-3 sm:space-y-4"
      aria-label="המסעדות המומלצות שלנו"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-400/15 text-amber-400">
            <Star className="h-4 w-4 fill-amber-400" />
          </span>
          <h2 className="font-display text-xl text-vantix-fg sm:text-2xl">המסעדות המומלצות שלנו</h2>
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
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {businesses.map((b) => (
          <Link
            key={b.businessId}
            to={ROUTES.RESTAURANT_MENU(b.businessId)}
            className="block w-[78%] shrink-0 snap-start rounded-2xl focus:outline-none focus:ring-2 focus:ring-vantix-cyan focus:ring-offset-2 sm:w-[320px] sm:rounded-3xl"
          >
            <RestaurantCard
              name={b.businessName}
              cuisine={`${b.itemsCount} פריטים • ${b.categoriesCount} קטגוריות`}
              eta="מומלץ"
              priceLevel="הזמנה מהתפריט"
              distance="—"
              heroImage={b.logoUrl ?? undefined}
              tags={[]}
            />
          </Link>
        ))}
      </div>
    </motion.section>
  )
}

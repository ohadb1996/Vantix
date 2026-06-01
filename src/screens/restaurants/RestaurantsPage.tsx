import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, UtensilsCrossed } from 'lucide-react'
import { RestaurantCard } from '../../components/cards/RestaurantCard'
import { useRestaurants } from '../../hooks/useRestaurants'
import { ROUTES } from '../../constants/app'

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

  const filteredBusinesses = useMemo(() => {
    if (!businesses) return []
    const q = searchQuery.trim().toLowerCase()
    if (!q) return businesses
    return businesses.filter(
      (b) =>
        b.businessName.toLowerCase().includes(q) ||
        b.businessId.toLowerCase().includes(q)
    )
  }, [businesses, searchQuery])

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
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-vantix-cyan/80 sm:text-xs sm:tracking-[0.32em]">
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
              placeholder="חיפוש מסעדות..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full min-w-0 bg-transparent text-sm text-vantix-fg placeholder:text-vantix-fg-subtle focus:outline-none"
              aria-label="חיפוש מסעדות"
            />
          </div>
        </div>
      </motion.header>

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
                    tags={[]}
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

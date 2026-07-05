import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, UtensilsCrossed } from 'lucide-react'
import { RestaurantCard } from '../../components/cards/RestaurantCard'
import { useToast } from '../../components/ui/Toast'
import { haptic } from '../../lib/native'
import { useRestaurants } from '../../hooks/useRestaurants'
import { useBusinessLikes } from '../../hooks/useBusinessLikes'
import { FOOD_QUICK_SEARCHES } from '../../constants/quickSearch'
import { ROUTES } from '../../constants/app'
import type { BusinessWithMenu } from '../../services/orderService'

export const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') ?? '')
  const inputRef = useRef<HTMLInputElement>(null)
  const toast = useToast()
  const { data: businesses, isLoading, error } = useRestaurants()
  const { isLiked, toggleLike, togglingId, isLoggedIn } = useBusinessLikes()

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (error) toast.error('לא הצלחנו לטעון את המסעדות. בדקו את החיבור לאינטרנט ונסו שוב.')
  }, [error, toast])

  useEffect(() => {
    const q = searchQuery.trim()
    if (q) {
      setSearchParams({ q }, { replace: true })
    } else {
      setSearchParams({}, { replace: true })
    }
  }, [searchQuery, setSearchParams])

  const q = searchQuery.trim().toLowerCase()
  const isSearching = q.length > 0

  const filteredBusinesses = useMemo(() => {
    if (!businesses) return []
    if (!q) return []
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

  const applyQuickSearch = (label: string) => {
    void haptic.light()
    setSearchQuery(label)
    inputRef.current?.focus()
  }

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

  const renderBusinessCard = (b: BusinessWithMenu) => {
    const menuPath = ROUTES.RESTAURANT_MENU(b.businessId)
    const to = isLoggedIn ? menuPath : ROUTES.AUTH_LOGIN
    const linkState = isLoggedIn ? undefined : { from: { pathname: menuPath } }

    return (
      <Link
        key={b.businessId}
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
          isClosed={b.isOpenNow === false}
        />
      </Link>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-4 sm:space-y-5"
      >
        <div className="space-y-1.5">
          <h1 className="font-display text-2xl font-bold text-vantix-fg sm:text-3xl">חיפוש</h1>
          <p className="text-sm text-vantix-fg-muted">מצא מסעדות ומנות לפי שם או סוג אוכל.</p>
        </div>

        <div role="search" className="flex items-center gap-3 rounded-2xl border border-vantix-line/10 bg-vantix-surface-raised px-4 py-3 shadow-sm">
          <Search className="h-5 w-5 shrink-0 text-vantix-fg-subtle" aria-hidden />
          <label htmlFor="vantix-search-input" className="sr-only">
            חיפוש מסעדות או מנות
          </label>
          <input
            id="vantix-search-input"
            ref={inputRef}
            type="search"
            enterKeyHint="search"
            autoComplete="off"
            placeholder="חיפוש מסעדות או מנות..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full min-w-0 bg-transparent text-sm text-vantix-fg placeholder:text-vantix-fg-subtle focus:outline-none"
          />
        </div>
      </motion.header>

      {!isSearching && (
        <section aria-labelledby="quick-search-heading" className="space-y-4">
          <h2 id="quick-search-heading" className="text-sm font-semibold text-vantix-fg">
            חיפושים מהירים
          </h2>

          <div className="flex flex-wrap gap-2">
            {FOOD_QUICK_SEARCHES.map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => applyQuickSearch(label)}
                className="min-h-[44px] rounded-full border border-vantix-cyan/20 bg-vantix-surface-raised px-4 py-2.5 text-sm font-semibold text-vantix-fg-muted transition hover:border-vantix-cyan/40 hover:text-vantix-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vantix-cyan focus-visible:ring-offset-2"
              >
                {label}
              </button>
            ))}
          </div>
        </section>
      )}

      {isSearching && isLoading && (
        <p className="text-sm text-vantix-fg-muted">טוען תוצאות...</p>
      )}

      {isSearching && !isLoading && filteredBusinesses.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-vantix-cyan/20 bg-vantix-surface-raised p-10 text-center">
          <UtensilsCrossed className="h-10 w-10 text-vantix-cyan/40" />
          <p className="text-vantix-fg-muted">
            לא נמצאו תוצאות עבור &quot;{searchQuery.trim()}&quot;
          </p>
          <p className="text-sm text-vantix-fg-subtle">נסו מילה אחרת או בחרו חיפוש מהיר למעלה.</p>
        </div>
      )}

      {isSearching && !isLoading && filteredBusinesses.length > 0 && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          aria-label="תוצאות חיפוש"
          className="grid gap-4 sm:gap-6 md:grid-cols-2"
        >
          {filteredBusinesses.map((b, index) => (
            <motion.div
              key={b.businessId}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: index * 0.05 }}
            >
              {renderBusinessCard(b)}
            </motion.div>
          ))}
        </motion.section>
      )}
    </div>
  )
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, SlidersHorizontal, UtensilsCrossed, X } from 'lucide-react'
import { RestaurantCard } from '../../components/cards/RestaurantCard'
import { useToast } from '../../components/ui/Toast'
import { haptic } from '../../lib/native'
import { useRestaurants } from '../../hooks/useRestaurants'
import { useRestaurantCategories } from '../../hooks/useRestaurantCategories'
import { useBusinessLikes } from '../../hooks/useBusinessLikes'
import { ROUTES } from '../../constants/app'
import type { SearchFilterDef } from '../../constants/searchFilterDefs'
import type { BusinessWithMenu } from '../../services/orderService'
import {
  adminCategoriesToFilters,
  filterBusinesses,
  getAvailableFilters,
  getMatchedDishesForQuery,
  type AdminCategoryFilter,
} from '../../utils/businessSearch'

export const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') ?? '')
  const [selectedFilterIds, setSelectedFilterIds] = useState<Set<string>>(() => {
    const raw = searchParams.get('f')
    return raw ? new Set(raw.split(',').filter(Boolean)) : new Set()
  })
  const [selectedAdminCategoryIds, setSelectedAdminCategoryIds] = useState<Set<string>>(new Set())
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLElement>(null)
  const shouldScrollToResultsRef = useRef(false)
  const toast = useToast()
  const { data: businesses, isLoading, error } = useRestaurants()
  const { data: adminCategoriesRaw } = useRestaurantCategories()
  const { isLiked, toggleLike, togglingId, isLoggedIn } = useBusinessLikes()

  const allBusinesses = businesses ?? []

  const adminCategoryFilters = useMemo(
    () => adminCategoriesToFilters(adminCategoriesRaw ?? []),
    [adminCategoriesRaw]
  )

  const availableFilters = useMemo(() => getAvailableFilters(allBusinesses), [allBusinesses])

  const statusFilters = useMemo(
    () => availableFilters.filter((f) => f.group === 'status' || f.group === 'featured'),
    [availableFilters]
  )
  const kitchenFilters = useMemo(
    () => availableFilters.filter((f) => f.group === 'kitchen'),
    [availableFilters]
  )
  const foodFilters = useMemo(
    () => availableFilters.filter((f) => f.group === 'food'),
    [availableFilters]
  )
  const kashrutFilters = useMemo(
    () => availableFilters.filter((f) => f.group === 'kashrut'),
    [availableFilters]
  )
  const generalFilters = useMemo(
    () => [...statusFilters, ...kashrutFilters, ...adminCategoryFilters],
    [statusFilters, kashrutFilters, adminCategoryFilters]
  )

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (error) toast.error('לא הצלחנו לטעון את המסעדות. בדקו את החיבור לאינטרנט ונסו שוב.')
  }, [error, toast])

  useEffect(() => {
    const q = searchQuery.trim()
    const params: Record<string, string> = {}
    if (q) params.q = q
    if (selectedFilterIds.size > 0) params.f = [...selectedFilterIds].join(',')
    setSearchParams(params, { replace: true })
  }, [searchQuery, selectedFilterIds, setSearchParams])

  const toggleFilter = useCallback((id: string) => {
    void haptic.light()
    shouldScrollToResultsRef.current = true
    setSelectedFilterIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleAdminCategory = useCallback((id: string) => {
    void haptic.light()
    shouldScrollToResultsRef.current = true
    setSelectedAdminCategoryIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const clearAllFilters = useCallback(() => {
    void haptic.light()
    setSearchQuery('')
    setSelectedFilterIds(new Set())
    setSelectedAdminCategoryIds(new Set())
  }, [])

  const filteredBusinesses = useMemo(
    () =>
      filterBusinesses(allBusinesses, {
        nameQuery: searchQuery,
        selectedFilterIds,
        selectedAdminCategoryIds,
        adminCategories: adminCategoryFilters,
      }),
    [
      allBusinesses,
      searchQuery,
      selectedFilterIds,
      selectedAdminCategoryIds,
      adminCategoryFilters,
    ]
  )

  const hasActiveCriteria =
    searchQuery.trim().length > 0 ||
    selectedFilterIds.size > 0 ||
    selectedAdminCategoryIds.size > 0

  const activeFilterCount = selectedFilterIds.size + selectedAdminCategoryIds.size

  const scrollToResults = useCallback(() => {
    requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [])

  useEffect(() => {
    if (!shouldScrollToResultsRef.current) return
    shouldScrollToResultsRef.current = false
    if (!hasActiveCriteria || isLoading || filteredBusinesses.length === 0) return
    const timer = window.setTimeout(scrollToResults, 180)
    return () => window.clearTimeout(timer)
  }, [
    filteredBusinesses.length,
    hasActiveCriteria,
    isLoading,
    selectedFilterIds,
    selectedAdminCategoryIds,
    scrollToResults,
  ])

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
    const matchedDishes = getMatchedDishesForQuery(b, searchQuery)

    return (
      <Link
        key={b.businessId}
        to={to}
        state={linkState}
        className="block w-full min-w-0 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-vantix-cyan focus-visible:ring-offset-2 sm:rounded-3xl"
      >
        <RestaurantCard
          name={b.businessName}
          eta="הזמנה ומשלוח"
          address={b.pickupAddress ?? '—'}
          heroImage={b.logoUrl ?? undefined}
          tags={matchedDishes}
          isLiked={isLiked(b.businessId)}
          likeDisabled={togglingId === b.businessId}
          onLikeClick={() => void handleLike(b.businessId)}
          isClosed={b.isOpenNow === false}
        />
      </Link>
    )
  }

  const renderChipRow = (title: string, chips: Array<SearchFilterDef | AdminCategoryFilter>) => {
    if (chips.length === 0) return null

    return (
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-vantix-fg">{title}</h2>
        <div className="scrollbar-hide -mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1">
          {chips.map((chip) => {
            const isSearchFilter = 'group' in chip
            const isSelected = isSearchFilter
              ? selectedFilterIds.has(chip.id)
              : selectedAdminCategoryIds.has(chip.id)
            const onClick = isSearchFilter
              ? () => toggleFilter(chip.id)
              : () => toggleAdminCategory(chip.id)

            return (
              <button
                key={`${isSearchFilter ? 'search' : 'admin'}-${chip.id}`}
                type="button"
                onClick={onClick}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                  isSelected
                    ? 'border-vantix-cyan/70 bg-vantix-cyan/15 text-vantix-cyan'
                    : 'border-vantix-line/15 bg-vantix-surface-raised text-vantix-fg-muted hover:border-vantix-cyan/35 hover:text-vantix-fg'
                }`}
                aria-pressed={isSelected}
              >
                <span aria-hidden>{chip.emoji}</span>
                <span>{chip.label}</span>
              </button>
            )
          })}
        </div>
      </section>
    )
  }

  return (
    <div className="space-y-6 pb-8 sm:space-y-8">
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-4"
      >
        <div className="space-y-1.5">
          <h1 className="font-display text-2xl font-bold text-vantix-fg sm:text-3xl">חיפוש</h1>
          <p className="text-sm text-vantix-fg-muted">
            חפשו לפי שם, בחרו פילטרים וגלו עסקים חדשים.
          </p>
        </div>

        <div
          role="search"
          className="flex items-center gap-3 rounded-2xl border border-vantix-line/10 bg-vantix-surface-raised px-4 py-3 shadow-sm"
        >
          <Search className="h-5 w-5 shrink-0 text-vantix-fg-subtle" aria-hidden />
          <label htmlFor="vantix-search-input" className="sr-only">
            חיפוש מסעדה לפי שם
          </label>
          <input
            id="vantix-search-input"
            ref={inputRef}
            type="search"
            enterKeyHint="search"
            autoComplete="off"
            placeholder="חיפוש מסעדה לפי שם או מנה..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full min-w-0 bg-transparent text-sm text-vantix-fg placeholder:text-vantix-fg-subtle focus:outline-none"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="rounded-full p-1 text-vantix-fg-muted hover:bg-vantix-cyan/10 hover:text-vantix-cyan"
              aria-label="נקה חיפוש"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <div className="space-y-3">
          {renderChipRow('🍔 סוג אוכל', foodFilters)}
          {renderChipRow('🍽️ סוג מטבח', kitchenFilters)}
          {renderChipRow('✨ כללי', generalFilters)}
        </div>
      </motion.header>

      {activeFilterCount > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-vantix-fg-muted">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            פילטרים פעילים ({activeFilterCount})
          </span>
          <button
            type="button"
            onClick={clearAllFilters}
            className="rounded-full border border-vantix-cyan/25 px-3 py-1 text-xs font-semibold text-vantix-cyan hover:bg-vantix-cyan/10"
          >
            נקה הכל
          </button>
        </div>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-vantix-fg-muted">טוען עסקים...</p>
      ) : null}

      {hasActiveCriteria && !isLoading && filteredBusinesses.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-vantix-cyan/20 bg-vantix-surface-raised p-10 text-center">
          <UtensilsCrossed className="h-10 w-10 text-vantix-cyan/40" />
          <p className="text-vantix-fg-muted">לא נמצאו תוצאות לפי הבחירה שלכם</p>
          <p className="text-sm text-vantix-fg-subtle">נסו פילטר אחר או שינוי בחיפוש.</p>
          <button
            type="button"
            onClick={clearAllFilters}
            className="mt-2 rounded-full border border-vantix-cyan/30 px-4 py-2 text-sm font-semibold text-vantix-cyan hover:bg-vantix-cyan/10"
          >
            נקה פילטרים
          </button>
        </div>
      ) : null}

      {hasActiveCriteria && !isLoading && filteredBusinesses.length > 0 ? (
        <motion.section
          ref={resultsRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          aria-label="תוצאות חיפוש"
          className="scroll-mt-24 space-y-4"
        >
          <p className="text-sm text-vantix-fg-muted">
            {filteredBusinesses.length} תוצאות
          </p>
          <div className="grid w-full min-w-0 gap-4 sm:gap-6 md:grid-cols-2">
            <AnimatePresence mode="sync">
              {filteredBusinesses.map((b, index) => (
                <motion.div
                  key={b.businessId}
                  className="w-full min-w-0"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.3) }}
                >
                  {renderBusinessCard(b)}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.section>
      ) : null}
    </div>
  )
}

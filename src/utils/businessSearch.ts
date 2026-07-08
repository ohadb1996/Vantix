import type { SearchFilterDef } from '../constants/searchFilterDefs'
import { ALL_SEARCH_FILTER_DEFS } from '../constants/searchFilterDefs'
import type { BusinessWithMenu } from '../services/orderService'
import type { RestaurantCategory } from '../services/restaurantCategories'

export interface AdminCategoryFilter {
  id: string
  label: string
  emoji: string
  gradient: string
  businessIds: string[]
}

export function businessMatchesFilter(b: BusinessWithMenu, filter: SearchFilterDef): boolean {
  switch (filter.id) {
    case 'open_now':
      return b.hasConfiguredHours === true && b.isOpenNow === true
    case 'closed_now':
      return b.hasConfiguredHours === true && b.isOpenNow === false
    case 'budget_60':
      return typeof b.minMenuPrice === 'number' && b.minMenuPrice <= 60
    case 'recommended':
      return b.isRecommended === true
    default:
      if (filter.group === 'kitchen') return b.kitchenType === filter.id
      if (filter.group === 'food') return b.foodTypes?.includes(filter.id) ?? false
      if (filter.group === 'kashrut') return b.kashrutType === filter.id
      return false
  }
}

export function businessMatchesAdminCategory(b: BusinessWithMenu, category: AdminCategoryFilter): boolean {
  return category.businessIds.includes(b.businessId)
}

export function businessMatchesNameQuery(b: BusinessWithMenu, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return (
    b.businessName.toLowerCase().includes(q) ||
    b.businessId.toLowerCase().includes(q) ||
    (b.menuItemNames ?? []).some((n) => n.toLowerCase().includes(q))
  )
}

export function countBusinessesForFilter(
  businesses: BusinessWithMenu[],
  filter: SearchFilterDef
): number {
  return businesses.filter((b) => businessMatchesFilter(b, filter)).length
}

/** פילטרים שיש להם לפחות עסק אחד שבחר אותם בפרופיל */
export function getAvailableFilters(businesses: BusinessWithMenu[]): SearchFilterDef[] {
  return ALL_SEARCH_FILTER_DEFS.filter((f) => countBusinessesForFilter(businesses, f) > 0)
}

const CATEGORY_GRADIENTS = [
  'from-vantix-orange/80 to-amber-600/90',
  'from-cyan-500/80 to-teal-600/90',
  'from-violet-500/80 to-purple-700/90',
  'from-rose-500/80 to-pink-600/90',
  'from-emerald-500/80 to-green-700/90',
  'from-blue-500/80 to-indigo-700/90',
]

function extractEmoji(name: string): { emoji: string; label: string } {
  const emojiMatch = name.match(/(\p{Extended_Pictographic})/u)
  if (!emojiMatch) return { emoji: '🏪', label: name.trim() }
  const emoji = emojiMatch[1]
  const label = name.replace(emoji, '').trim() || name.trim()
  return { emoji, label }
}

export function adminCategoriesToFilters(categories: RestaurantCategory[]): AdminCategoryFilter[] {
  return categories
    .filter((c) => c.businessIds.length > 0)
    .map((c, i) => {
      const { emoji, label } = extractEmoji(c.name)
      return {
        id: `admin_cat_${c.id}`,
        label,
        emoji,
        gradient: CATEGORY_GRADIENTS[i % CATEGORY_GRADIENTS.length],
        businessIds: c.businessIds,
      }
    })
}

export interface SearchCriteria {
  nameQuery: string
  selectedFilterIds: Set<string>
  selectedAdminCategoryIds: Set<string>
  adminCategories: AdminCategoryFilter[]
}

export function filterBusinesses(
  businesses: BusinessWithMenu[],
  criteria: SearchCriteria
): BusinessWithMenu[] {
  const {
    nameQuery,
    selectedFilterIds,
    selectedAdminCategoryIds,
    adminCategories,
  } = criteria

  const activeFilters = ALL_SEARCH_FILTER_DEFS.filter((f) => selectedFilterIds.has(f.id))
  const activeAdminCats = adminCategories.filter((c) => selectedAdminCategoryIds.has(c.id))
  const hasNameQuery = nameQuery.trim().length > 0
  const hasTileFilters = activeFilters.length > 0 || activeAdminCats.length > 0

  if (!hasNameQuery && !hasTileFilters) return []

  return businesses.filter((b) => {
    if (hasNameQuery && !businessMatchesNameQuery(b, nameQuery)) return false

    if (hasTileFilters) {
      const matchesSearchFilter = activeFilters.some((f) => businessMatchesFilter(b, f))
      const matchesAdminCategory = activeAdminCats.some((c) => businessMatchesAdminCategory(b, c))
      if (!matchesSearchFilter && !matchesAdminCategory) return false
    }

    return true
  })
}

export function getMatchedDishesForQuery(business: BusinessWithMenu, query: string): string[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return (business.menuItemNames ?? []).filter((n) => n.toLowerCase().includes(q)).slice(0, 3)
}

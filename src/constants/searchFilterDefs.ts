/**
 * פילטרי חיפוש – מבוססים על בחירה מפורשת של בעל העסק (search_profile).
 */
import {
  FOOD_TYPE_OPTIONS,
  KASHRUT_TYPE_OPTIONS,
  KITCHEN_TYPE_OPTIONS,
} from './businessFilters'

export type SearchFilterGroup = 'status' | 'kitchen' | 'food' | 'kashrut' | 'featured'

export interface SearchFilterDef {
  id: string
  label: string
  emoji: string
  gradient: string
  group: SearchFilterGroup
}

const TILE_GRADIENTS = [
  'from-orange-400/90 to-red-500/90',
  'from-red-500/90 to-orange-600/90',
  'from-amber-500/90 to-orange-700/90',
  'from-pink-400/90 to-fuchsia-500/90',
  'from-pink-500/90 to-rose-600/90',
  'from-green-500/90 to-emerald-700/90',
  'from-amber-700/90 to-yellow-900/90',
  'from-teal-500/90 to-cyan-700/90',
  'from-violet-500/90 to-purple-700/90',
  'from-blue-600/90 to-indigo-700/90',
  'from-lime-500/90 to-green-600/90',
  'from-cyan-500/90 to-teal-600/90',
]

function optionsToFilters(
  options: { id: string; label: string }[],
  group: SearchFilterGroup,
  emoji: string
): SearchFilterDef[] {
  return options.map((opt, i) => ({
    id: opt.id,
    label: opt.label,
    emoji,
    gradient: TILE_GRADIENTS[i % TILE_GRADIENTS.length],
    group,
  }))
}

export const STATUS_FILTER_DEFS: SearchFilterDef[] = [
  {
    id: 'open_now',
    label: 'פתוח עכשיו',
    emoji: '🟢',
    gradient: 'from-emerald-500/90 to-teal-600/90',
    group: 'status',
  },
  {
    id: 'closed_now',
    label: 'סגור עכשיו',
    emoji: '🔴',
    gradient: 'from-rose-500/90 to-red-700/90',
    group: 'status',
  },
  {
    id: 'recommended',
    label: 'מומלץ',
    emoji: '⭐',
    gradient: 'from-yellow-400/90 to-amber-500/90',
    group: 'featured',
  },
]

export const KITCHEN_FILTER_DEFS = optionsToFilters(KITCHEN_TYPE_OPTIONS, 'kitchen', '🍽️')
export const FOOD_FILTER_DEFS = optionsToFilters(FOOD_TYPE_OPTIONS, 'food', '🍔')
export const KASHRUT_FILTER_DEFS = optionsToFilters(KASHRUT_TYPE_OPTIONS, 'kashrut', '✡️')

export const ALL_SEARCH_FILTER_DEFS: SearchFilterDef[] = [
  ...STATUS_FILTER_DEFS,
  ...KITCHEN_FILTER_DEFS,
  ...FOOD_FILTER_DEFS,
  ...KASHRUT_FILTER_DEFS,
]

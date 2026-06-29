/**
 * קטגוריות מסעדות – מנוהלות ע"י האדמין (RTDB: VantixContent/restaurantCategories).
 */
import { ref, get } from 'firebase/database'
import { getRealtimeDb } from '../lib/firebase'

const db = () => getRealtimeDb()

export interface RestaurantCategory {
  id: string
  name: string
  emoji?: string
  active: boolean
  sortOrder: number
  businessIds: string[]
}

const parseBusinessIds = (raw: unknown): string[] => {
  if (!raw) return []
  if (Array.isArray(raw)) return raw.filter((id): id is string => typeof id === 'string')
  if (typeof raw === 'object') return Object.keys(raw as Record<string, unknown>)
  return []
}

export async function getRestaurantCategories(): Promise<RestaurantCategory[]> {
  try {
    const snap = await get(ref(db(), 'VantixContent/restaurantCategories'))
    if (!snap.exists()) return []
    const val = snap.val() as Record<
      string,
      Omit<RestaurantCategory, 'id' | 'businessIds'> & { businessIds?: unknown }
    >
    return Object.entries(val)
      .map(([id, c]) => ({
        id,
        name: c.name || '',
        emoji: c.emoji,
        active: c.active !== false,
        sortOrder: c.sortOrder ?? 0,
        businessIds: parseBusinessIds(c.businessIds),
      }))
      .filter((c) => c.active && c.name)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
  } catch {
    return []
  }
}

/** מזהה וירטואלי לקטגוריית "המומלצים שלנו" – לא נשמר ב-RTDB */
export const RECOMMENDED_CATEGORY_ID = '__recommended__'
export const RECOMMENDED_CATEGORY_NAME = 'המומלצים שלנו'
export const TOP_LIKED_COUNT = 10

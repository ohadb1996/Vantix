/**
 * קטגוריות מסעדות – מנוהלות ע"י האדמין (RTDB: VantixContent/restaurantCategories).
 */
import { ref, get } from 'firebase/database'
import { getRealtimeDb } from '../lib/firebase'

const db = () => getRealtimeDb()

export interface RestaurantCategory {
  id: string
  /** שם מלא כולל אימוג'י, למשל: "רוק אנד רול 🍣" */
  name: string
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

const formatCategoryName = (c: { name?: string; emoji?: string }): string => {
  const name = (c.name || '').trim()
  const emoji = (c.emoji || '').trim()
  if (!emoji || name.includes(emoji)) return name
  return `${name} ${emoji}`.trim()
}

export async function getRestaurantCategories(): Promise<RestaurantCategory[]> {
  try {
    const snap = await get(ref(db(), 'VantixContent/restaurantCategories'))
    if (!snap.exists()) return []
    const val = snap.val() as Record<
      string,
      Omit<RestaurantCategory, 'id' | 'businessIds' | 'name'> & {
        name?: string
        emoji?: string
        businessIds?: unknown
      }
    >
    return Object.entries(val)
      .map(([id, c]) => ({
        id,
        name: formatCategoryName(c),
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

/** מזהה וירטואלי לקטגוריית "המועדפים שלי" – לא נשמר ב-RTDB */
export const FAVORITES_CATEGORY_ID = '__favorites__'
export const FAVORITES_CATEGORY_NAME = 'המועדפים שלי ❤️'

/** מזהה וירטואלי לקרוסלת מסעדות שסומנו ע"י אדמין – לא נשמר ב-RTDB */
export const RECOMMENDED_CATEGORY_ID = '__recommended__'
export const RECOMMENDED_CATEGORY_NAME = 'המומלצות שלנו ⭐⭐⭐'

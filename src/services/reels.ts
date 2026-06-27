/**
 * רילסים – סרטונים קצרים שמנוהלים ע"י האדמין (RTDB: VantixContent/reels).
 * מוצגים כפיד גלובלי בעמוד "מסעדות". קריאה בלבד מצד הלקוח.
 */
import { ref, get } from 'firebase/database'
import { getRealtimeDb } from '../lib/firebase'

const db = () => getRealtimeDb()

export interface Reel {
  id: string
  videoUrl: string
  caption?: string
  businessId?: string
  businessName?: string
  active: boolean
  sortOrder: number
  createdAt?: string
}

export async function getReels(): Promise<Reel[]> {
  try {
    const snap = await get(ref(db(), 'VantixContent/reels'))
    if (!snap.exists()) return []
    const val = snap.val() as Record<string, Omit<Reel, 'id'>>
    return Object.entries(val)
      .map(([id, r]) => ({ id, ...r }))
      .filter((r) => r.active && r.videoUrl)
      .sort(
        (a, b) =>
          (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
          (a.createdAt || '').localeCompare(b.createdAt || '')
      )
  } catch {
    // אם הקריאה נחסמה (כללי RTDB) – פשוט לא מציגים פיד
    return []
  }
}

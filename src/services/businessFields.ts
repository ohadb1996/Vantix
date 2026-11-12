import { ref, get } from 'firebase/database'
import { getRealtimeDb } from '../lib/firebase'

const db = () => getRealtimeDb()

/** קורא שדה בודד של עסק (בלי להוריד את כל צומת העסק) */
export async function getBusinessField<T = unknown>(businessId: string, field: string): Promise<T | null> {
  try {
    const snap = await get(ref(db(), `Businesses/${businessId}/${field}`))
    return snap.exists() ? (snap.val() as T) : null
  } catch {
    return null
  }
}

/** האם עסק חסום או מוסתר מ-Vantix – שני שדות בודדים */
export async function isBusinessHiddenFromVantix(businessId: string): Promise<boolean> {
  const [blocked, hidden] = await Promise.all([
    getBusinessField<boolean>(businessId, 'isBlocked'),
    getBusinessField<boolean>(businessId, 'hidden_from_vantix'),
  ])
  return blocked === true || hidden === true
}

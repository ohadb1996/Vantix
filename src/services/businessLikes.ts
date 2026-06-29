/**
 * לייקים למסעדות – לקוחות יכולים לסמן מסעדות מועדפות.
 * נתונים: Customers/{uid}/likedBusinesses/{businessId}, Businesses/{id}/likeCount
 */
import { ref, get, set, remove, runTransaction } from 'firebase/database'
import { getRealtimeDb } from '../lib/firebase'

const db = () => getRealtimeDb()

export async function getUserLikedBusinessIds(uid: string): Promise<Set<string>> {
  try {
    const snap = await get(ref(db(), `Customers/${uid}/likedBusinesses`))
    if (!snap.exists()) return new Set()
    return new Set(Object.keys(snap.val() as Record<string, unknown>))
  } catch {
    return new Set()
  }
}

export async function toggleBusinessLike(
  uid: string,
  businessId: string,
  currentlyLiked: boolean
): Promise<boolean> {
  const likeRef = ref(db(), `Customers/${uid}/likedBusinesses/${businessId}`)
  const countRef = ref(db(), `Businesses/${businessId}/likeCount`)

  if (currentlyLiked) {
    await remove(likeRef)
    await runTransaction(countRef, (current) => {
      const n = typeof current === 'number' ? current : 0
      return Math.max(0, n - 1)
    })
    return false
  }

  await set(likeRef, { likedAt: new Date().toISOString() })
  await runTransaction(countRef, (current) => {
    const n = typeof current === 'number' ? current : 0
    return n + 1
  })
  return true
}

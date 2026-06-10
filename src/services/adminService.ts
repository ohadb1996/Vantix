/**
 * שירות בדיקת שיוך פארטנרס – משמש לחסימת התחברות/הרשמה ב-Jacob
 * כשאימייל כבר רשום כעסק/שליח/אדמין (למניעת דריסת UID).
 *
 * הערה: ניהול האדמין (רשימת לקוחות, הזמנות, אנליטיקות) הועבר לאפליקציית
 * האדמין (maxDelivery-admin) תחת העמוד "Vantix – לקוחות קצה".
 */
import { ref, get } from 'firebase/database'
import { getRealtimeDb } from '../lib/firebase'

/**
 * בודק אם האימייל כבר רשום כעסק/שליח/אדמין (Businesses, Couriers או Admins) בפארטנרס.
 * משמש לחסימת התחברות Google ב-Jacob כשיש כבר חשבון פארטנרס – למניעת דריסת UID.
 */
export async function emailExistsAsPartner(email: string): Promise<boolean> {
  if (!email || !email.trim()) return false
  const rtdb = getRealtimeDb()
  const needle = email.trim().toLowerCase()

  for (const col of ['Businesses', 'Couriers', 'Admins'] as const) {
    const snap = await get(ref(rtdb, col))
    if (!snap.exists()) continue
    const data = snap.val() as Record<string, { email?: string }>
    for (const record of Object.values(data)) {
      if (record && typeof record === 'object') {
        const e = (record.email || '').trim().toLowerCase()
        if (e && e === needle) return true
      }
    }
  }
  return false
}

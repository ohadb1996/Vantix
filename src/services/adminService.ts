/**
 * שירות אדמין – קריאה מ-RTDB (Customers, Businesses, Couriers, Admins).
 * אדמין = קיים ב-Admins/{uid}.
 */
import { ref, get, update, push } from 'firebase/database'
import { getRealtimeDb } from '../lib/firebase'

export type Role = 'customer' | 'business' | 'courier' | 'admin'

export interface AppUser {
  uid: string
  role: Role
  email?: string
  displayName?: string
  createdAt?: unknown
  lastLoginAt?: unknown
}

const COLLECTIONS = ['Customers', 'Businesses', 'Couriers', 'Admins'] as const
const PATH_TO_ROLE: Record<(typeof COLLECTIONS)[number], Role> = {
  Customers: 'customer',
  Businesses: 'business',
  Couriers: 'courier',
  Admins: 'admin',
}

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

/**
 * מחזיר true אם המשתמש אדמין (קיים ב-RTDB Admins/{uid}).
 */
export async function getIsAdmin(uid: string): Promise<boolean> {
  const rtdb = getRealtimeDb()
  const snap = await get(ref(rtdb, `Admins/${uid}`))
  return snap.exists()
}

/**
 * מחזיר true אם המשתמש אדמין מלך (Admins/{uid}/isKing === true).
 * רק אדמין מלך יכול להוסיף/להוריד קרדיטים מעסקים.
 */
export async function getIsAdminKing(uid: string): Promise<boolean> {
  const rtdb = getRealtimeDb()
  const snap = await get(ref(rtdb, `Admins/${uid}`))
  if (!snap.exists()) return false
  const data = snap.val() as { isKing?: boolean }
  return data?.isKing === true
}

/**
 * מעדכן יתרת קרדיטים של עסק – רק אדמין מלך.
 * @param businessId מזהה העסק (uid)
 * @param delta שינוי: חיובי להוספה, שלילי להפחתה
 * @param description תיאור (למשל "תמיכה – תיקון ידני")
 */
export async function adjustBusinessCredits(
  businessId: string,
  delta: number,
  description: string
): Promise<{ success: boolean; error?: string }> {
  if (!businessId || delta === 0) {
    return { success: false, error: 'נתונים לא תקינים' }
  }
  const rtdb = getRealtimeDb()
  const path = `Businesses/${businessId}`
  const bizRef = ref(rtdb, path)
  const txPath = `${path}/billing_transactions`

  const snap = await get(bizRef)
  const data = snap.val()
  const currentBalance = typeof data?.credits_balance === 'number' ? data.credits_balance : 0
  const newBalance = Math.max(0, currentBalance + delta)

  if (delta < 0 && currentBalance + delta < 0) {
    return {
      success: false,
      error: `אין מספיק קרדיטים. יתרה: ${currentBalance}, להפחתה: ${Math.abs(delta)}`,
    }
  }

  const now = Date.now()
  const today = new Date(now).toLocaleDateString('he-IL')

  await update(bizRef, { credits_balance: newBalance })
  await push(ref(rtdb, txPath), {
    date: today,
    createdAt: now,
    description: description || (delta > 0 ? 'הוספת קרדיטים (אדמין)' : 'הפחתת קרדיטים (אדמין)'),
    amount: delta,
    type: 'admin_adjustment',
  })

  return { success: true }
}

/** מחזיר יתרת קרדיטים של עסק */
export async function getBusinessCreditsBalance(businessId: string): Promise<number> {
  const rtdb = getRealtimeDb()
  const snap = await get(ref(rtdb, `Businesses/${businessId}`))
  const data = snap.val()
  return typeof data?.credits_balance === 'number' ? data.credits_balance : 0
}

/**
 * רשימת כל המשתמשים – רק לאדמין. מאגד מ-Customers, Businesses, Couriers, Admins.
 */
export async function getAllUsers(): Promise<AppUser[]> {
  const rtdb = getRealtimeDb()
  const list: AppUser[] = []

  for (const col of COLLECTIONS) {
    const snap = await get(ref(rtdb, col))
    if (!snap.exists()) continue
    const data = snap.val() as Record<string, { email?: string; displayName?: string; createdAt?: unknown; lastLoginAt?: unknown }>
    const role = PATH_TO_ROLE[col]
    for (const [uid, userData] of Object.entries(data)) {
      if (uid && userData && typeof userData === 'object') {
        list.push({
          uid,
          role,
          email: userData.email,
          displayName: userData.displayName,
          createdAt: userData.createdAt,
          lastLoginAt: userData.lastLoginAt,
        })
      }
    }
  }

  return list.sort((a, b) => (b.uid > a.uid ? 1 : -1))
}

/**
 * מחזיר פרופיל משתמש לפי uid – בודק בכל האוספים ב-RTDB.
 */
export async function getUserProfile(
  uid: string,
): Promise<{ role: Role; email?: string; displayName?: string; [k: string]: unknown } | null> {
  const rtdb = getRealtimeDb()
  for (const col of COLLECTIONS) {
    const snap = await get(ref(rtdb, `${col}/${uid}`))
    if (snap.exists()) {
      const data = snap.val() as Record<string, unknown>
      return { role: PATH_TO_ROLE[col], ...data }
    }
  }
  return null
}

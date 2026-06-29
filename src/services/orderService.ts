/**
 * שירות הזמנות ותפריטים – Realtime Database בלבד (אותו DB כמו maxDelivery-partners).
 * רשימת מסעדות: אם קריאה ישירה נחסמת (כללי אבטחה), משתמשים ב-Cloud Function ציבורית.
 */
import { ref, get, push, set, query, orderByChild, equalTo } from 'firebase/database'
import { getRealtimeDb, getFirebaseAuth, getFirebaseApp } from '../lib/firebase'
import { normalizeIsraeliPhone } from '../utils/phone'
import type { Order, OrderCreate } from '../types/order'
import type { BusinessMenu } from '../types/menu'

const db = () => getRealtimeDb()

export interface BusinessWithMenu {
  businessId: string
  businessName: string
  logoUrl?: string
  itemsCount: number
  categoriesCount: number
  /** ⭐ מסומן ע"י האדמין כ"מסעדה מומלצת" (Businesses/{id}/is_recommended) */
  isRecommended?: boolean
  /** מספר לייקים מלקוחות (Businesses/{id}/likeCount) */
  likeCount?: number
  /** שמות המנות בתפריט – לשימוש בחיפוש כללי של מאכלים בין כל המסעדות */
  menuItemNames?: string[]
  /** כתובת העסק – להצגה בעת איסוף עצמי */
  pickupAddress?: string
}

/**
 * רשימת עסקים שיש להם תפריט (קריאה מ-BusinessMenus + Businesses).
 * אם קריאה ישירה חסומה (משתמש לא מחובר + כללי RTDB), משתמשים ב-Cloud Function ציבורית.
 */
export async function getBusinessesWithMenus(): Promise<BusinessWithMenu[]> {
  try {
    const menuSnap = await get(ref(db(), 'BusinessMenus'))
    if (!menuSnap.exists()) return []

    const ids = Object.keys(menuSnap.val())
    const result: BusinessWithMenu[] = []

    for (const businessId of ids) {
      const menu = menuSnap.val()[businessId]
      const items = menu?.items ? Object.keys(menu.items).length : 0
      const categories = menu?.categories ? Object.keys(menu.categories).length : 0
      if (items === 0) continue

      // שמות המנות – לחיפוש כללי של מאכלים בין המסעדות (מסננים מנות לא זמינות)
      const menuItemNames: string[] = menu?.items
        ? Object.values(menu.items as Record<string, { name?: string; available?: boolean }>)
            .filter((it) => it?.available !== false)
            .map((it) => it?.name || '')
            .filter(Boolean)
        : []

      let businessName = ''
      let logoUrl: string | undefined
      let isRecommended = false
      let likeCount = 0
      let pickupAddress: string | undefined
      try {
        const bizSnap = await get(ref(db(), `Businesses/${businessId}`))
        if (bizSnap.exists()) {
          const data = bizSnap.val()
          businessName = data?.business_name || ''
          logoUrl = data?.logo_url || undefined
          isRecommended = data?.is_recommended === true
          likeCount = typeof data?.likeCount === 'number' ? data.likeCount : 0
          const streetLine = [data?.business_street, data?.business_building_number].filter(Boolean).join(' ')
          pickupAddress =
            data?.business_address ||
            [streetLine, data?.business_city].filter(Boolean).join(', ') ||
            undefined
        }
      } catch {
        businessName = `עסק ${businessId.slice(0, 6)}`
      }

      result.push({
        businessId,
        businessName: businessName || `עסק ${businessId.slice(0, 8)}`,
        logoUrl,
        itemsCount: items,
        categoriesCount: categories,
        isRecommended,
        likeCount,
        menuItemNames,
        pickupAddress,
      })
    }

    return result
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string }
    const isPermissionDenied =
      err?.code === 'PERMISSION_DENIED' ||
      err?.message?.includes('PERMISSION_DENIED') ||
      err?.message?.includes('permission_denied')
    if (isPermissionDenied) {
      const app = getFirebaseApp()
      const { getFunctions, httpsCallable } = await import('firebase/functions')
      const functions = getFunctions(app, 'europe-west1')
      const fn = httpsCallable<unknown, { data: BusinessWithMenu[] }>(
        functions,
        'getPublicBusinessesWithMenus'
      )
      const res = await fn()
      return res.data?.data ?? []
    }
    throw e
  }
}

/**
 * תפריט מלא של עסק (קטגוריות + פריטים)
 */
export async function getBusinessMenu(businessId: string): Promise<BusinessMenu | null> {
  const menuRef = ref(db(), `BusinessMenus/${businessId}`)
  const snap = await get(menuRef)
  if (!snap.exists()) return null

  const data = snap.val()
  return {
    categories: data.categories || {},
    items: data.items || {},
  }
}

/**
 * שליחת הזמנה – כתיבה ל-Orders. אחרי זה Cloud Function שולחת Push לבעל העסק.
 */
export async function placeOrder(order: OrderCreate): Promise<string> {
  const auth = getFirebaseAuth()
  const uid = auth.currentUser?.uid
  const payload: Omit<Order, 'orderId'> = {
    ...order,
    customer_phone: normalizeIsraeliPhone(order.customer_phone),
    status: 'new',
    createdAt: new Date().toISOString(),
    ...(uid && { created_by_uid: uid }),
  }

  const ordersRef = ref(db(), 'Orders')
  const newRef = await push(ordersRef)
  const orderId = newRef.key
  if (!orderId) throw new Error('Failed to create order')

  await set(newRef, { ...payload, orderId })
  return orderId
}

/**
 * היסטוריית הזמנות של המשתמש המחובר (created_by_uid).
 * דורש אינדקס ב-Firebase: Orders, orderBy: created_by_uid
 */
export async function getMyOrders(uid: string): Promise<Order[]> {
  const q = query(
    ref(db(), 'Orders'),
    orderByChild('created_by_uid'),
    equalTo(uid)
  )
  const snap = await get(q)
  if (!snap.exists()) return []
  const val = snap.val()
  return Object.entries(val)
    .map(([key, v]) => ({ ...(v as Omit<Order, 'orderId'>), orderId: key } as Order))
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
}

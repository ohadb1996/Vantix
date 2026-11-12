/**
 * שירות הזמנות ותפריטים – Realtime Database בלבד (אותו DB כמו maxDelivery-partners).
 * רשימת מסעדות: אם קריאה ישירה נחסמת (כללי אבטחה), משתמשים ב-Cloud Function ציבורית.
 */
import { ref, get, push, set, query, orderByChild, equalTo, onValue, off } from 'firebase/database'
import { getRealtimeDb, getFirebaseAuth, getFirebaseApp } from '../lib/firebase'
import { normalizeIsraeliPhone } from '../utils/phone'
import type { Order, OrderCreate } from '../types/order'
import type { BusinessMenu } from '../types/menu'
import type { BusinessHours } from '../types/businessHours'
import { getBusinessField, isBusinessHiddenFromVantix } from './businessFields'
import type { BusinessLocationInfo, CourierLocation, TrackedDelivery } from '../types/tracking'

const db = () => getRealtimeDb()

/** RTDB לא מקבל undefined – מסיר רקursively לפני כתיבה */
function cleanForRtdb<T>(value: T): T {
  if (value === undefined) return value
  if (value === null || typeof value !== 'object') return value
  if (Array.isArray(value)) {
    return value.map((item) => cleanForRtdb(item)) as T
  }
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (v === undefined) continue
    out[k] = cleanForRtdb(v)
  }
  return out as T
}

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
  /** שמות המנות בתפריט – לחיפוש לפי שם מנה */
  menuItemNames?: string[]
  /** סוג מטבח שנבחר ע"י העסק (search_profile.kitchen_type) */
  kitchenType?: string | null
  /** סוגי אוכל שנבחרו ע"י העסק (search_profile.food_types) */
  foodTypes?: string[]
  /** סוג כשרות שנבחר ע"י העסק (search_profile.kashrut_type) */
  kashrutType?: string | null
  /** מחיר מנה מינימלי/מקסימלי בתפריט (מנות זמינות בלבד) */
  minMenuPrice?: number
  maxMenuPrice?: number
  /** מינימום לחיוב משלוח ללקוח (אם הוגדר ע"י העסק) */
  minDeliveryTotal?: number
  /** סוג העסק מפרופיל ההרשמה (Businesses/{id}/business_type) */
  businessType?: string
  /** אחוז קאשבק ללקוח (מסכום המנות, לאחר מסירה) */
  cashbackPercent?: number
  /** האם הוגדרו שעות פעילות בפועל */
  hasConfiguredHours?: boolean
  /** כתובת העסק – להצגה בעת איסוף עצמי */
  pickupAddress?: string
  /** שעות פעילות – Businesses/{id}/business_hours */
  businessHours?: BusinessHours | null
  /** האם העסק פתוח כעת לקבלת הזמנות */
  isOpenNow?: boolean
  /** יש מנות צמחוניות או טבעוניות זמינות בתפריט */
  hasVegetarian?: boolean
  /** יש מנות טבעוניות זמינות בתפריט */
  hasVegan?: boolean
}

async function callPublicBusinessesFunction(): Promise<BusinessWithMenu[]> {
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

/**
 * רשימת עסקים לדף הבית – רק מהאינדקס הדק VantixListings (בלי להוריד את כל Businesses/BusinessMenus).
 * סינון חסומים/מוסתרים והמלצה נקראים כשדות בודדים לכל עסק (כמה בתים בלבד).
 * אם האינדקס ריק/חסום – Cloud Function ציבורית שמסננת בשרת.
 */
export async function getBusinessesWithMenus(): Promise<BusinessWithMenu[]> {
  let fromIndex: BusinessWithMenu[] | null = null
  try {
    const { getVantixListings } = await import('./vantixListings')
    fromIndex = await getVantixListings()
  } catch {
    fromIndex = null
  }
  if (fromIndex && fromIndex.length > 0) return fromIndex
  try {
    return await callPublicBusinessesFunction()
  } catch {
    return []
  }
}


/**
 * תפריט מלא של עסק (קטגוריות + פריטים)
 */
export async function getBusinessMenu(businessId: string): Promise<BusinessMenu | null> {
  const [menuSnap, hiddenFromVantix] = await Promise.all([
    get(ref(db(), `BusinessMenus/${businessId}`)),
    isBusinessHiddenFromVantix(businessId),
  ])

  if (hiddenFromVantix) return null

  if (!menuSnap.exists()) return null

  const data = menuSnap.val()
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
  const payload = cleanForRtdb({
    ...order,
    customer_phone: normalizeIsraeliPhone(order.customer_phone),
    status: 'new' as const,
    createdAt: new Date().toISOString(),
    ...(uid ? { created_by_uid: uid } : {}),
  })

  const ordersRef = ref(db(), 'Orders')
  const newRef = push(ordersRef)
  const orderId = newRef.key
  if (!orderId) throw new Error('Failed to create order')

  await set(newRef, { ...payload, orderId })
  return orderId
}

/**
 * היסטוריית הזמנות של המשתמש המחובר (created_by_uid).
 * דורש אינדקס ב-Firebase: Orders, orderBy: created_by_uid
 */
export async function getOrder(orderId: string): Promise<Order | null> {
  const snap = await get(ref(db(), `Orders/${orderId}`))
  if (!snap.exists()) return null
  return { ...(snap.val() as Omit<Order, 'orderId'>), orderId }
}

export function subscribeToOrder(
  orderId: string,
  onData: (order: Order | null) => void,
  onError?: (err: Error) => void
): () => void {
  const orderRef = ref(db(), `Orders/${orderId}`)
  const handler = (snap: { exists: () => boolean; val: () => unknown }) => {
    if (!snap.exists()) {
      onData(null)
      return
    }
    onData({ ...(snap.val() as Omit<Order, 'orderId'>), orderId })
  }
  const errHandler = (e: Error) => onError?.(e)
  onValue(orderRef, handler, errHandler)
  return () => off(orderRef, 'value', handler)
}

export function subscribeToDelivery(
  deliveryId: string,
  onData: (delivery: TrackedDelivery | null) => void,
  onError?: (err: Error) => void
): () => void {
  const deliveryRef = ref(db(), `Deliveries/${deliveryId}`)
  const handler = (snap: { exists: () => boolean; val: () => unknown }) => {
    if (!snap.exists()) {
      onData(null)
      return
    }
    const val = snap.val() as Record<string, unknown>
    onData({ id: deliveryId, ...val } as TrackedDelivery)
  }
  const errHandler = (e: Error) => onError?.(e)
  onValue(deliveryRef, handler, errHandler)
  return () => off(deliveryRef, 'value', handler)
}

export function subscribeToCourierOnDelivery(
  deliveryId: string,
  onData: (location: CourierLocation | null) => void
): () => void {
  const locRef = ref(db(), `Deliveries/${deliveryId}/courier_current_location`)
  const handler = (snap: { exists: () => boolean; val: () => unknown }) => {
    if (!snap.exists()) {
      onData(null)
      return
    }
    const val = snap.val() as { lat?: number; lng?: number; timestamp?: number }
    if (typeof val.lat === 'number' && typeof val.lng === 'number') {
      onData({ lat: val.lat, lng: val.lng, timestamp: val.timestamp })
    } else {
      onData(null)
    }
  }
  onValue(locRef, handler)
  return () => off(locRef, 'value', handler)
}

export async function getBusinessLocation(businessId: string): Promise<BusinessLocationInfo | null> {
  const fields = [
    'business_name',
    'business_address',
    'business_street',
    'business_building_number',
    'business_city',
    'business_coordinates',
    'location',
  ] as const
  const values = await Promise.all(fields.map((f) => getBusinessField(businessId, f)))
  const data = Object.fromEntries(fields.map((f, i) => [f, values[i]])) as Record<string, unknown>
  if (values.every((v) => v == null)) return null
  const streetLine = [data.business_street, data.business_building_number].filter(Boolean).join(' ')
  const address =
    (typeof data.business_address === 'string' && data.business_address) ||
    [streetLine, data.business_city].filter(Boolean).join(', ') ||
    ''
  const coords =
    (data.business_coordinates as { lat?: number; lng?: number } | null) ||
    (data.location as { lat?: number; lng?: number } | null)
  return {
    name: String(data.business_name || ''),
    address,
    coordinates:
      coords && typeof coords.lat === 'number' && typeof coords.lng === 'number'
        ? { lat: coords.lat, lng: coords.lng }
        : null,
  }
}

async function getBusinessNamesByIds(businessIds: string[]): Promise<Record<string, string>> {
  const unique = [...new Set(businessIds.filter(Boolean))]
  if (unique.length === 0) return {}

  const entries = await Promise.all(
    unique.map(async (id) => {
      try {
        const snap = await get(ref(db(), `Businesses/${id}/business_name`))
        const name = snap.val()
        return [id, typeof name === 'string' ? name.trim() : ''] as const
      } catch {
        return [id, ''] as const
      }
    }),
  )
  return Object.fromEntries(entries.filter(([, name]) => name))
}

export async function getMyOrders(uid: string): Promise<Order[]> {
  const q = query(
    ref(db(), 'Orders'),
    orderByChild('created_by_uid'),
    equalTo(uid)
  )
  const snap = await get(q)
  if (!snap.exists()) return []
  const val = snap.val()
  const orders = Object.entries(val)
    .map(([key, v]) => ({ ...(v as Omit<Order, 'orderId'>), orderId: key } as Order))
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))

  const nameMap = await getBusinessNamesByIds(orders.map((o) => o.business_id))
  return orders.map((order) => ({
    ...order,
    business_name: nameMap[order.business_id] || order.business_name,
  }))
}

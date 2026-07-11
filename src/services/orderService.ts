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
import { isBusinessOpenNow, normalizeBusinessHours } from '../utils/businessHours'
import { resolveMinDeliveryTotal } from '../constants/deliveryPricing'
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
}

function isPermissionDeniedError(e: unknown): boolean {
  const err = e as { code?: string; message?: string }
  return (
    err?.code === 'PERMISSION_DENIED' ||
    (err?.message?.includes('PERMISSION_DENIED') ?? false) ||
    (err?.message?.includes('permission_denied') ?? false)
  )
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

async function getRecommendedBusinessIds(): Promise<Set<string>> {
  try {
    const snap = await get(ref(db(), 'Businesses'))
    if (!snap.exists()) return new Set()

    const val = snap.val() as Record<string, { is_recommended?: boolean } | null>
    const ids = new Set<string>()
    for (const [businessId, data] of Object.entries(val)) {
      if (data?.is_recommended === true) ids.add(businessId)
    }
    return ids
  } catch {
    return new Set()
  }
}

function applyRecommendedFlags(
  businesses: BusinessWithMenu[],
  recommendedIds: Set<string>
): BusinessWithMenu[] {
  if (recommendedIds.size === 0) return businesses
  return businesses.map((b) => ({
    ...b,
    isRecommended: recommendedIds.has(b.businessId) || b.isRecommended === true,
  }))
}

/**
 * רשימת עסקים – מנסה אינדקס דק, משלים/נופל לתפריטים מלאים, ואז Cloud Function.
 */
export async function getBusinessesWithMenus(): Promise<BusinessWithMenu[]> {
  let fromIndex: BusinessWithMenu[] | null = null
  try {
    const { getVantixListings } = await import('./vantixListings')
    fromIndex = await getVantixListings()
  } catch {
    // אינדקס אופציונלי – אם אין הרשאה או שהצומת לא קיים, ממשיכים ל-fallback.
    fromIndex = null
  }

  try {
    const legacy = await getBusinessesWithMenusLegacy()
    if (fromIndex && fromIndex.length > 0) {
      if (legacy.length === 0) {
        const recommendedIds = await getRecommendedBusinessIds()
        return applyRecommendedFlags(fromIndex, recommendedIds)
      }
      const legacyById = new Map(legacy.map((b) => [b.businessId, b]))
      const mergedIndexed = fromIndex.map((indexed) => {
        const fresh = legacyById.get(indexed.businessId)
        if (!fresh) return indexed

        const merged: BusinessWithMenu = {
          ...indexed,
          ...(Object.fromEntries(
            Object.entries(fresh).filter(([, v]) => v !== undefined),
          ) as Partial<BusinessWithMenu>),
        }
        return merged
      })

      const indexedIds = new Set(mergedIndexed.map((b) => b.businessId))
      const missing = legacy.filter((b) => !indexedIds.has(b.businessId))
      return missing.length > 0 ? [...mergedIndexed, ...missing] : mergedIndexed
    }
    return legacy
  } catch (e: unknown) {
    if (fromIndex && fromIndex.length > 0) {
      const recommendedIds = await getRecommendedBusinessIds()
      return applyRecommendedFlags(fromIndex, recommendedIds)
    }
    if (isPermissionDeniedError(e)) {
      try {
        return await callPublicBusinessesFunction()
      } catch {
        return []
      }
    }
    throw e
  }
}

async function getBusinessesWithMenusLegacy(): Promise<BusinessWithMenu[]> {
  try {
    const [menuSnap, businessesSnap] = await Promise.all([
      get(ref(db(), 'BusinessMenus')),
      get(ref(db(), 'Businesses')),
    ])
    if (!menuSnap.exists()) return []

    const menus = menuSnap.val() as Record<string, {
      items?: Record<string, { name?: string; available?: boolean; price?: number }>
      categories?: Record<string, { name?: string; available?: boolean }>
    }>
    const businessesById = (businessesSnap.exists() ? businessesSnap.val() : {}) as Record<
      string,
      Record<string, unknown>
    >

    const result: BusinessWithMenu[] = []

    for (const [businessId, menu] of Object.entries(menus)) {
      const items = menu?.items ? Object.keys(menu.items).length : 0
      const categories = menu?.categories ? Object.keys(menu.categories).length : 0
      if (items === 0) continue

      const data = businessesById[businessId]
      if (data?.isBlocked === true) continue

      const menuItemNames: string[] = menu?.items
        ? Object.values(menu.items)
            .filter((it) => it?.available !== false)
            .map((it) => it?.name || '')
            .filter(Boolean)
        : []

      const menuPrices: number[] = menu?.items
        ? Object.values(menu.items)
            .filter((it) => it?.available !== false && typeof it.price === 'number' && it.price > 0)
            .map((it) => it.price as number)
        : []

      let businessName = ''
      let logoUrl: string | undefined
      let isRecommended = false
      let likeCount = 0
      let pickupAddress: string | undefined
      let businessType: string | undefined
      let businessHours: BusinessHours | null = null
      let hasConfiguredHours = false
      let kitchenType: string | null = null
      let foodTypes: string[] = []
      let kashrutType: string | null = null
      let minDeliveryTotal: number | undefined
      let cashbackPercent: number | undefined

      if (data) {
        businessName = (data.business_name as string) || ''
        logoUrl = (data.logo_url as string) || undefined
        isRecommended = data.is_recommended === true
        likeCount = typeof data.likeCount === 'number' ? data.likeCount : 0
        const streetLine = [data.business_street, data.business_building_number].filter(Boolean).join(' ')
        pickupAddress =
          (data.business_address as string) ||
          [streetLine, data.business_city].filter(Boolean).join(', ') ||
          undefined
        businessHours = normalizeBusinessHours(data.business_hours)
        hasConfiguredHours = data.business_hours != null && typeof data.business_hours === 'object'
        businessType = typeof data.business_type === 'string' ? data.business_type : undefined
        const profile = data.search_profile as Record<string, unknown> | undefined
        if (profile && typeof profile === 'object') {
          if (typeof profile.kitchen_type === 'string') {
            kitchenType = profile.kitchen_type
          } else if (Array.isArray(profile.kitchen_types)) {
            const first = profile.kitchen_types.find((v): v is string => typeof v === 'string')
            kitchenType = first ?? null
          }
          if (Array.isArray(profile.food_types)) {
            foodTypes = profile.food_types.filter((v): v is string => typeof v === 'string')
          }
          if (typeof profile.kashrut_type === 'string') kashrutType = profile.kashrut_type
        }
        const customerPricing = data.customer_pricing as Record<string, unknown> | undefined
        if (customerPricing && typeof customerPricing === 'object') {
          const v = Number(customerPricing.min_delivery_total)
          minDeliveryTotal = resolveMinDeliveryTotal(Number.isFinite(v) ? v : undefined)
        } else {
          minDeliveryTotal = resolveMinDeliveryTotal(undefined)
        }
        if (typeof data.cashback_percent === 'number' && data.cashback_percent > 0) {
          cashbackPercent = data.cashback_percent
        }
      } else {
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
        kitchenType,
        foodTypes,
        kashrutType,
        minMenuPrice: menuPrices.length ? Math.min(...menuPrices) : undefined,
        maxMenuPrice: menuPrices.length ? Math.max(...menuPrices) : undefined,
        minDeliveryTotal,
        businessType,
        hasConfiguredHours,
        pickupAddress,
        businessHours,
        isOpenNow: isBusinessOpenNow(businessHours),
        cashbackPercent,
      })
    }

    return result
  } catch (e: unknown) {
    throw e
  }
}

/**
 * תפריט מלא של עסק (קטגוריות + פריטים)
 */
export async function getBusinessMenu(businessId: string): Promise<BusinessMenu | null> {
  const [menuSnap, bizSnap] = await Promise.all([
    get(ref(db(), `BusinessMenus/${businessId}`)),
    get(ref(db(), `Businesses/${businessId}`)),
  ])

  if (bizSnap.exists() && bizSnap.val()?.isBlocked === true) {
    return null
  }

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
  const snap = await get(ref(db(), `Businesses/${businessId}`))
  if (!snap.exists()) return null
  const data = snap.val() as Record<string, unknown>
  const streetLine = [data.business_street, data.business_building_number].filter(Boolean).join(' ')
  const address =
    (typeof data.business_address === 'string' && data.business_address) ||
    [streetLine, data.business_city].filter(Boolean).join(', ') ||
    ''
  const coords =
    (data.business_coordinates as { lat?: number; lng?: number } | undefined) ||
    (data.location as { lat?: number; lng?: number } | undefined)
  return {
    name: String(data.business_name || ''),
    address,
    coordinates:
      coords && typeof coords.lat === 'number' && typeof coords.lng === 'number'
        ? { lat: coords.lat, lng: coords.lng }
        : null,
  }
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
  return Object.entries(val)
    .map(([key, v]) => ({ ...(v as Omit<Order, 'orderId'>), orderId: key } as Order))
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
}

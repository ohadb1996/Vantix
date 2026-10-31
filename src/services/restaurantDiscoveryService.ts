import { resolveMinDeliveryTotal } from '../constants/deliveryPricing'
import { getFirebaseAuth, getRealtimeDb } from '../lib/firebase'
import { ref, get } from 'firebase/database'
import type { BusinessWithMenu } from './orderService'
import { isBusinessOpenNow, normalizeBusinessHours } from '../utils/businessHours'
import type { BusinessHours } from '../types/businessHours'

export type DiscoveredRestaurant = BusinessWithMenu & {
  distance_km: number
  delivery_fee: number
  minDeliveryTotal?: number
  max_delivery_km: number
  within_range: true
}

export type DiscoverRestaurantsResult = {
  businesses: DiscoveredRestaurant[]
  max_delivery_km: number
}

function getDiscoverUrl(): string {
  const explicit = import.meta.env.VITE_DISCOVER_VANTIX_RESTAURANTS_URL as string | undefined
  if (explicit) return explicit
  return 'https://us-central1-maxdeliveries.cloudfunctions.net/discoverVantixRestaurants'
}

function mapDiscoveredRestaurant(raw: Record<string, unknown>): DiscoveredRestaurant {
  const businessHours = normalizeBusinessHours(raw.businessHours as BusinessHours | null | undefined)
  const hasConfiguredHours = raw.hasConfiguredHours === true

  return {
    businessId: String(raw.businessId),
    businessName: String(raw.businessName || 'מסעדה'),
    logoUrl: typeof raw.logoUrl === 'string' ? raw.logoUrl : undefined,
    itemsCount: Number(raw.itemsCount) || 0,
    categoriesCount: Number(raw.categoriesCount) || 0,
    isRecommended: raw.isRecommended === true,
    likeCount: typeof raw.likeCount === 'number' ? raw.likeCount : 0,
    menuItemNames: Array.isArray(raw.menuItemNames) ? raw.menuItemNames.map(String) : [],
    kitchenType: typeof raw.kitchenType === 'string' ? raw.kitchenType : null,
    foodTypes: Array.isArray(raw.foodTypes) ? raw.foodTypes.map(String) : [],
    kashrutType: typeof raw.kashrutType === 'string' ? raw.kashrutType : null,
    minMenuPrice: typeof raw.minMenuPrice === 'number' ? raw.minMenuPrice : undefined,
    maxMenuPrice: typeof raw.maxMenuPrice === 'number' ? raw.maxMenuPrice : undefined,
    businessType: typeof raw.businessType === 'string' ? raw.businessType : undefined,
    hasConfiguredHours,
    pickupAddress: typeof raw.pickupAddress === 'string' ? raw.pickupAddress : undefined,
    businessHours,
    isOpenNow: isBusinessOpenNow(businessHours),
    cashbackPercent:
      typeof raw.cashbackPercent === 'number' && raw.cashbackPercent > 0
        ? raw.cashbackPercent
        : typeof raw.cashback_percent === 'number' && raw.cashback_percent > 0
          ? raw.cashback_percent
          : undefined,
    hasVegetarian: raw.hasVegetarian === true || raw.has_vegetarian === true,
    hasVegan: raw.hasVegan === true || raw.has_vegan === true,
    distance_km: Number(raw.distance_km) || 0,
    delivery_fee: Number(raw.delivery_fee) || 0,
    minDeliveryTotal: resolveMinDeliveryTotal(
      typeof raw.min_delivery_total === 'number' ? raw.min_delivery_total : undefined,
    ),
    max_delivery_km: Number(raw.max_delivery_km) || 5,
    within_range: true,
  }
}

export async function discoverRestaurantsNearDestination(
  destinationAddress: string,
  searchQuery?: string,
): Promise<DiscoverRestaurantsResult> {
  const auth = getFirebaseAuth()
  const user = auth.currentUser
  if (!user) throw new Error('יש להתחבר')

  const idToken = await user.getIdToken()
  const requestPayload = {
    destinationAddress,
    ...(searchQuery?.trim() ? { q: searchQuery.trim() } : {}),
  }

  console.log('[Discovery] Request:', requestPayload)

  const res = await fetch(getDiscoverUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(requestPayload),
  })

  const data = (await res.json()) as DiscoverRestaurantsResult & { error?: string }
  if (!res.ok) {
    const errorMessage = data.error || 'לא ניתן לטעון עסקים באזור'
    console.error('[Discovery] Error:', {
      status: res.status,
      statusText: res.statusText,
      error: data.error,
      data,
    })
    throw new Error(errorMessage)
  }

  console.log('[Discovery] Success:', {
    businessCount: data.businesses?.length ?? 0,
    maxDeliveryKm: data.max_delivery_km,
  })

  const mapped = (data.businesses ?? []).map((b) =>
    mapDiscoveredRestaurant(b as unknown as Record<string, unknown>),
  )

  console.log('[Discovery] Business types:', mapped.map((b) => ({ name: b.businessName, type: b.businessType })))

  // חגורת בטיחות מול CF ישן / stub באינדקס: מסננים עסקים מוסתרים/חסומים מה-RTDB
  let businesses = mapped
  try {
    const bizSnap = await get(ref(getRealtimeDb(), 'Businesses'))
    if (bizSnap.exists()) {
      const byId = bizSnap.val() as Record<
        string,
        { isBlocked?: boolean; hidden_from_vantix?: boolean } | undefined
      >
      businesses = mapped.filter((b) => {
        const biz = byId[b.businessId]
        return !(biz?.isBlocked === true || biz?.hidden_from_vantix === true)
      })
    }
  } catch {
    // אם אין הרשאה לקרוא Businesses — משאירים את תוצאת ה-CF כמו שהיא
  }

  return {
    max_delivery_km: data.max_delivery_km,
    businesses,
  }
}

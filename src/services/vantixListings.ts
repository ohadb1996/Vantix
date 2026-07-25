import { ref, get } from 'firebase/database'
import { getRealtimeDb } from '../lib/firebase'
import type { BusinessWithMenu } from './orderService'
import type { VantixListing } from '../types/vantixListing'
import { isBusinessOpenNow, normalizeBusinessHours } from '../utils/businessHours'
import { resolveMinDeliveryTotal } from '../constants/deliveryPricing'

const db = () => getRealtimeDb()

function listingToBusinessWithMenu(raw: VantixListing): BusinessWithMenu {
  const businessHours = normalizeBusinessHours(raw.business_hours)
  const hasConfiguredHours = raw.hasConfiguredHours === true

  return {
    businessId: raw.businessId,
    businessName: raw.businessName,
    logoUrl: raw.logoUrl,
    itemsCount: raw.itemsCount ?? 0,
    categoriesCount: raw.categoriesCount ?? 0,
    isRecommended: raw.isRecommended,
    likeCount: raw.likeCount,
    menuItemNames: raw.menuItemNames ?? [],
    kitchenType: raw.kitchen_type ?? null,
    foodTypes: raw.food_types ?? [],
    kashrutType: raw.kashrut_type ?? null,
    minMenuPrice: raw.minMenuPrice,
    maxMenuPrice: raw.maxMenuPrice,
    minDeliveryTotal: resolveMinDeliveryTotal(raw.min_delivery_total),
    businessType: raw.businessType,
    hasConfiguredHours,
    pickupAddress: raw.pickupAddress,
    businessHours,
    isOpenNow: isBusinessOpenNow(businessHours),
    cashbackPercent:
      typeof raw.cashback_percent === 'number' && raw.cashback_percent > 0
        ? raw.cashback_percent
        : undefined,
    hasVegetarian: raw.has_vegetarian === true,
    hasVegan: raw.has_vegan === true,
  }
}

/** קריאה מהירה – אינדקס מנורמל לחיפוש ורשימת מסעדות */
export async function getVantixListings(): Promise<BusinessWithMenu[] | null> {
  const [listingsSnap, businessesSnap] = await Promise.all([
    get(ref(db(), 'VantixListings')),
    get(ref(db(), 'Businesses')).catch(() => null),
  ])
  if (!listingsSnap.exists()) return null

  const businessesById = (
    businessesSnap && businessesSnap.exists() ? businessesSnap.val() : {}
  ) as Record<string, { isBlocked?: boolean; hidden_from_vantix?: boolean } | undefined>

  const val = listingsSnap.val() as Record<string, VantixListing | null>
  return Object.entries(val)
    .filter((entry): entry is [string, VantixListing] => {
      const [id, listing] = entry
      if (listing == null || typeof listing !== 'object') return false
      const biz = businessesById[id]
      // אם יש נתוני עסק — מסננים חסומים/מוסתרים גם אם האינדקס עדיין לא נמחק
      if (biz && (biz.isBlocked === true || biz.hidden_from_vantix === true)) return false
      return true
    })
    .map(([id, l]) => listingToBusinessWithMenu({ ...l, businessId: l.businessId || id }))
    .filter((b) => b.itemsCount > 0)
}

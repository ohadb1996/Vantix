import { ref, get } from 'firebase/database'
import { getRealtimeDb } from '../lib/firebase'
import type { BusinessWithMenu } from './orderService'
import { isBusinessHiddenFromVantix } from './businessFields'
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

/** קריאה מהירה – אינדקס מנורמל לחיפוש ורשימת מסעדות (בלי להוריד את כל Businesses) */
export async function getVantixListings(): Promise<BusinessWithMenu[] | null> {
  const listingsSnap = await get(ref(db(), 'VantixListings'))
  if (!listingsSnap.exists()) return null

  const val = listingsSnap.val() as Record<string, VantixListing | null>
  const entries = Object.entries(val).filter(
    (entry): entry is [string, VantixListing] =>
      entry[1] != null && typeof entry[1] === 'object' && (entry[1].itemsCount ?? 0) > 0,
  )

  // סינון חסומים/מוסתרים – שדות בודדים לכל עסק, למקרה שהאינדקס עוד לא עודכן
  const hiddenFlags = await Promise.all(entries.map(([id]) => isBusinessHiddenFromVantix(id)))

  return entries
    .filter((_, i) => !hiddenFlags[i])
    .map(([id, l]) => listingToBusinessWithMenu({ ...l, businessId: l.businessId || id }))
}

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
  }
}

/** קריאה מהירה – אינדקס מנורמל לחיפוש ורשימת מסעדות */
export async function getVantixListings(): Promise<BusinessWithMenu[] | null> {
  const snap = await get(ref(db(), 'VantixListings'))
  if (!snap.exists()) return null

  const val = snap.val() as Record<string, VantixListing | null>
  return Object.entries(val)
    .filter((entry): entry is [string, VantixListing] => {
      const [, listing] = entry
      return listing != null && typeof listing === 'object'
    })
    .map(([id, l]) => listingToBusinessWithMenu({ ...l, businessId: l.businessId || id }))
    .filter((b) => b.itemsCount > 0)
}

import type { LucideIcon } from 'lucide-react'
import { Flower2, Leaf, ShoppingBasket, UtensilsCrossed } from 'lucide-react'
import type { BusinessWithMenu } from '../services/orderService'

export type StoreVerticalId = 'restaurants' | 'greengrocer' | 'supermarket' | 'flowers'

export type StoreVertical = {
  id: StoreVerticalId
  label: string
  icon: LucideIcon
}

export const STORE_VERTICALS: StoreVertical[] = [
  { id: 'restaurants', label: 'מסעדות', icon: UtensilsCrossed },
  { id: 'greengrocer', label: 'ירקניות', icon: Leaf },
  { id: 'supermarket', label: 'סופרים', icon: ShoppingBasket },
  { id: 'flowers', label: 'פרחים', icon: Flower2 },
]

function normalizeType(value?: string | null): string {
  return (value ?? '').trim().toLowerCase()
}

function normalizeName(value?: string | null): string {
  return (value ?? '').trim().toLowerCase()
}

/** התאמה לפי business_type (ועזר קל בשם העסק) */
export function businessMatchesStoreVertical(
  business: Pick<BusinessWithMenu, 'businessType' | 'businessName'>,
  vertical: StoreVerticalId,
): boolean {
  const type = normalizeType(business.businessType)
  const name = normalizeName(business.businessName)

  switch (vertical) {
    case 'supermarket':
      return type.includes('סופר') || type.includes('מכולת') || name.includes('סופר') || name.includes('מכולת')
    case 'greengrocer':
      return (
        type.includes('ירק') ||
        type.includes('פירות') ||
        type.includes('ירקנ') ||
        name.includes('ירק') ||
        name.includes('פירות') ||
        name.includes('ירקנ')
      )
    case 'flowers':
      return type.includes('פרח') || name.includes('פרח') || name.includes('זר ')
    case 'restaurants':
    default:
      if (
        businessMatchesStoreVertical(business, 'supermarket') ||
        businessMatchesStoreVertical(business, 'greengrocer') ||
        businessMatchesStoreVertical(business, 'flowers')
      ) {
        return false
      }
      return (
        !type ||
        type.includes('מסעד') ||
        type.includes('מזון') ||
        type.includes('אוכל') ||
        type.includes('מאפ') ||
        type.includes('קפה')
      )
  }
}

export function filterBusinessesByStoreVertical<T extends Pick<BusinessWithMenu, 'businessType' | 'businessName'>>(
  businesses: T[],
  vertical: StoreVerticalId | null,
): T[] {
  if (!vertical) return businesses
  return businesses.filter((b) => businessMatchesStoreVertical(b, vertical))
}

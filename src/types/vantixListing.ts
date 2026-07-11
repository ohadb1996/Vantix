import type { BusinessHours } from './businessHours'

export interface VantixListing {
  businessId: string
  businessName: string
  logoUrl?: string
  pickupAddress?: string
  businessType?: string
  isRecommended?: boolean
  likeCount?: number
  kitchen_type?: string | null
  food_types?: string[]
  kashrut_type?: string | null
  business_hours?: BusinessHours | null
  hasConfiguredHours?: boolean
  menuItemNames?: string[]
  minMenuPrice?: number
  maxMenuPrice?: number
  min_delivery_total?: number
  itemsCount: number
  categoriesCount: number
  updated_at?: string
  pickup_lat?: number
  pickup_lng?: number
  cashback_percent?: number
}

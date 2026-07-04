export interface MapCoords {
  lat: number
  lng: number
}

export interface TrackedDelivery {
  id: string
  status?: string
  assigned_courier?: string
  pickup_address?: string
  pickup_coordinates?: MapCoords | null
  delivery_coordinates?: MapCoords | null
  delivery_city?: string
  delivery_street?: string
  delivery_building_number?: string
  business_name?: string
}

export interface CourierLocation {
  lat: number
  lng: number
  timestamp?: number
}

export interface BusinessLocationInfo {
  name: string
  address: string
  coordinates?: MapCoords | null
}

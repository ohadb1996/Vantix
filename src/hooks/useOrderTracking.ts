import { useEffect, useMemo, useState } from 'react'
import type { Order } from '../types/order'
import type { BusinessLocationInfo, CourierLocation, MapCoords, TrackedDelivery } from '../types/tracking'
import {
  getBusinessLocation,
  subscribeToCourierOnDelivery,
  subscribeToDelivery,
  subscribeToOrder,
} from '../services/orderService'
import { geocodeAddress } from '../utils/loadGoogleMaps'
import { resolveTrackingStepIndex } from '../constants/orderTracking'

function readCoords(raw: unknown): MapCoords | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as { lat?: unknown; lng?: unknown }
  const lat = typeof o.lat === 'number' ? o.lat : parseFloat(String(o.lat ?? ''))
  const lng = typeof o.lng === 'number' ? o.lng : parseFloat(String(o.lng ?? ''))
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return { lat, lng }
}

function formatCustomerAddress(order: Order): string {
  const parts = [
    order.delivery_street,
    order.delivery_building_number,
    order.delivery_city,
  ].filter(Boolean)
  return parts.join(', ')
}

export interface OrderTrackingMapMarker {
  id: string
  label: string
  title: string
  coords: MapCoords
  kind: 'home' | 'business' | 'courier'
}

export function useOrderTracking(orderId: string | undefined) {
  const [order, setOrder] = useState<Order | null>(null)
  const [delivery, setDelivery] = useState<TrackedDelivery | null>(null)
  const [courierLocation, setCourierLocation] = useState<CourierLocation | null>(null)
  const [business, setBusiness] = useState<BusinessLocationInfo | null>(null)
  const [customerCoords, setCustomerCoords] = useState<MapCoords | null>(null)
  const [businessCoords, setBusinessCoords] = useState<MapCoords | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!orderId) return
    setLoading(true)
    const unsub = subscribeToOrder(
      orderId,
      (o) => {
        setOrder(o)
        setLoading(false)
        if (!o) setError('ההזמנה לא נמצאה')
      },
      () => setError('לא ניתן לטעון את ההזמנה')
    )
    return unsub
  }, [orderId])

  const deliveryId = order?.delivery_id

  useEffect(() => {
    if (!deliveryId) {
      setDelivery(null)
      setCourierLocation(null)
      return
    }
    const unsubDelivery = subscribeToDelivery(deliveryId, setDelivery)
    const unsubCourier = subscribeToCourierOnDelivery(deliveryId, setCourierLocation)
    return () => {
      unsubDelivery()
      unsubCourier()
    }
  }, [deliveryId])

  useEffect(() => {
    if (!order?.business_id) return
    let cancelled = false
    getBusinessLocation(order.business_id).then((b) => {
      if (!cancelled) setBusiness(b)
    })
    return () => {
      cancelled = true
    }
  }, [order?.business_id])

  useEffect(() => {
    if (!order || order.fulfillment_type === 'pickup') {
      setCustomerCoords(null)
      return
    }
    const addr = formatCustomerAddress(order)
    if (!addr) return
    let cancelled = false
    if (delivery?.delivery_coordinates) {
      const c = readCoords(delivery.delivery_coordinates)
      if (c) {
        setCustomerCoords(c)
        return
      }
    }
    geocodeAddress(addr).then((c) => {
      if (!cancelled) setCustomerCoords(c)
    })
    return () => {
      cancelled = true
    }
  }, [order, delivery?.delivery_coordinates])

  useEffect(() => {
    if (!business && !delivery) return
    let cancelled = false
    const fromDelivery = delivery?.pickup_coordinates
      ? readCoords(delivery.pickup_coordinates)
      : null
    if (fromDelivery) {
      setBusinessCoords(fromDelivery)
      return
    }
    if (business?.coordinates) {
      setBusinessCoords(business.coordinates)
      return
    }
    const addr = delivery?.pickup_address || business?.address
    if (!addr) return
    geocodeAddress(addr).then((c) => {
      if (!cancelled) setBusinessCoords(c)
    })
    return () => {
      cancelled = true
    }
  }, [business, delivery])

  const stepIndex = useMemo(
    () => resolveTrackingStepIndex(order, delivery),
    [order, delivery]
  )

  const markers = useMemo((): OrderTrackingMapMarker[] => {
    const list: OrderTrackingMapMarker[] = []
    if (customerCoords && order && order.fulfillment_type !== 'pickup') {
      list.push({
        id: 'home',
        label: order.customer_name || 'הבית שלך',
        title: formatCustomerAddress(order) || 'כתובת המשלוח',
        coords: customerCoords,
        kind: 'home',
      })
    }
    if (businessCoords) {
      list.push({
        id: 'business',
        label: business?.name || delivery?.business_name || 'בית העסק',
        title: delivery?.pickup_address || business?.address || 'בית העסק',
        coords: businessCoords,
        kind: 'business',
      })
    }
    if (courierLocation && delivery?.assigned_courier) {
      list.push({
        id: 'courier',
        label: 'השליח',
        title: 'מיקום השליח',
        coords: { lat: courierLocation.lat, lng: courierLocation.lng },
        kind: 'courier',
      })
    }
    return list
  }, [customerCoords, businessCoords, courierLocation, order, business, delivery])

  return {
    order,
    delivery,
    courierLocation,
    business,
    markers,
    stepIndex,
    loading,
    error,
  }
}

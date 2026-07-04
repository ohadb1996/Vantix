import { DELIVERY_STATUS, toCanonicalDeliveryStatus } from './deliveryStatus'
import type { Order } from '../types/order'
import type { TrackedDelivery } from '../types/tracking'

export interface TrackingStep {
  id: string
  label: string
}

/** שלבי מעקב ללקוח – מתחילים ב"הועבר לטיפול בית העסק" */
export const CUSTOMER_TRACKING_STEPS: TrackingStep[] = [
  { id: 'submitted', label: 'הועבר לטיפול בית העסק' },
  { id: 'awaiting_business', label: 'ממתין לטיפול העסק' },
  { id: DELIVERY_STATUS.PENDING_ASSIGNMENT, label: 'ממתין לשיבוץ שליח' },
  { id: DELIVERY_STATUS.PREPARING, label: 'בהכנה לאיסוף' },
  { id: DELIVERY_STATUS.AT_PICKUP, label: 'בנקודת איסוף' },
  { id: DELIVERY_STATUS.AWAITING_PICKUP, label: 'ממתין לאישור איסוף' },
  { id: DELIVERY_STATUS.PICKED_UP, label: 'נאסף – בדרך אליך' },
  { id: DELIVERY_STATUS.AT_DESTINATION, label: 'הגיע ליעד' },
  { id: DELIVERY_STATUS.DELIVERED, label: 'נמסר' },
]

const STEP_INDEX: Record<string, number> = Object.fromEntries(
  CUSTOMER_TRACKING_STEPS.map((s, i) => [s.id, i])
)

export function resolveTrackingStepIndex(
  order: Order | null,
  delivery: TrackedDelivery | null
): number {
  if (!order) return 0
  if (order.status === 'cancelled') return -1
  if (delivery?.status) {
    const canonical = toCanonicalDeliveryStatus(delivery.status)
    if (canonical === DELIVERY_STATUS.CANCELLED) return -1
    if (canonical === DELIVERY_STATUS.DELIVERED) {
      return STEP_INDEX[DELIVERY_STATUS.DELIVERED] ?? CUSTOMER_TRACKING_STEPS.length - 1
    }
    const idx = STEP_INDEX[canonical]
    if (idx != null) return idx
  }
  if (order.status === 'delivery_created') {
    return STEP_INDEX[DELIVERY_STATUS.PENDING_ASSIGNMENT] ?? 2
  }
  if (order.status === 'accepted') {
    return STEP_INDEX.awaiting_business ?? 1
  }
  // new – שלב 0 הושלם, ממתינים לעסק
  return STEP_INDEX.awaiting_business ?? 1
}

export function isOrderActive(order: Order | null, delivery: TrackedDelivery | null): boolean {
  if (!order) return true
  if (order.status === 'cancelled') return false
  const canonical = delivery?.status ? toCanonicalDeliveryStatus(delivery.status) : ''
  if (canonical === DELIVERY_STATUS.DELIVERED || canonical === DELIVERY_STATUS.CANCELLED) {
    return false
  }
  return true
}

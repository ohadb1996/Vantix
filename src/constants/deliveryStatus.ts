/** סטטוסי משלוח canonical – תואם ל-maxDelivery-partners */
export const DELIVERY_STATUS = {
  PENDING_ASSIGNMENT: 'pending_assignment',
  PREPARING: 'preparing',
  AT_PICKUP: 'at_pickup',
  AWAITING_PICKUP: 'awaiting_pickup',
  PICKED_UP: 'picked_up',
  AT_DESTINATION: 'at_destination',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  AWAITING_CANCELLATION: 'awaiting_cancellation',
} as const

export type DeliveryStatusCanonical =
  (typeof DELIVERY_STATUS)[keyof typeof DELIVERY_STATUS]

const LEGACY_TO_CANONICAL: Record<string, DeliveryStatusCanonical> = {
  ממתין: DELIVERY_STATUS.PENDING_ASSIGNMENT,
  'ממתין לשיבוץ': DELIVERY_STATUS.PENDING_ASSIGNMENT,
  'מוכן לאיסוף': DELIVERY_STATUS.PENDING_ASSIGNMENT,
  מוכן: DELIVERY_STATUS.PENDING_ASSIGNMENT,
  'בהכנה לאיסוף': DELIVERY_STATUS.PREPARING,
  מקבל: DELIVERY_STATUS.PREPARING,
  'ממתין לאישור איסוף': DELIVERY_STATUS.AWAITING_PICKUP,
  'בנקודת איסוף': DELIVERY_STATUS.AT_PICKUP,
  'הגיע לנקודת איסוף': DELIVERY_STATUS.AT_PICKUP,
  נאסף: DELIVERY_STATUS.PICKED_UP,
  'הגיע ליעד': DELIVERY_STATUS.AT_DESTINATION,
  הושלם: DELIVERY_STATUS.DELIVERED,
  נמסר: DELIVERY_STATUS.DELIVERED,
  בוטל: DELIVERY_STATUS.CANCELLED,
  'ממתין לאישור ביטול': DELIVERY_STATUS.AWAITING_CANCELLATION,
  awaiting_assignment: DELIVERY_STATUS.PENDING_ASSIGNMENT,
  preparing_for_pickup: DELIVERY_STATUS.PREPARING,
  accepted: DELIVERY_STATUS.PREPARING,
  arrived_pickup: DELIVERY_STATUS.AT_PICKUP,
  awaiting_pickup_confirmation: DELIVERY_STATUS.AWAITING_PICKUP,
  arrived_delivery: DELIVERY_STATUS.AT_DESTINATION,
  completed: DELIVERY_STATUS.DELIVERED,
  in_transit: DELIVERY_STATUS.PICKED_UP,
  in_progress: DELIVERY_STATUS.PICKED_UP,
  בדרך: DELIVERY_STATUS.PICKED_UP,
}

export function toCanonicalDeliveryStatus(status: unknown): string {
  const raw = String(status ?? '').trim()
  if (!raw) return ''
  return LEGACY_TO_CANONICAL[raw] ?? raw
}

export const DELIVERY_STATUS_HEBREW: Record<string, string> = {
  [DELIVERY_STATUS.PENDING_ASSIGNMENT]: 'ממתין לשיבוץ',
  [DELIVERY_STATUS.PREPARING]: 'בהכנה לאיסוף',
  [DELIVERY_STATUS.AT_PICKUP]: 'בנקודת איסוף',
  [DELIVERY_STATUS.AWAITING_PICKUP]: 'ממתין לאישור איסוף',
  [DELIVERY_STATUS.PICKED_UP]: 'נאסף – בדרך אליך',
  [DELIVERY_STATUS.AT_DESTINATION]: 'הגיע ליעד',
  [DELIVERY_STATUS.DELIVERED]: 'נמסר',
  [DELIVERY_STATUS.CANCELLED]: 'בוטל',
  [DELIVERY_STATUS.AWAITING_CANCELLATION]: 'ממתין לאישור ביטול',
}

export function mapDeliveryStatusToHebrew(status: unknown): string {
  const canonical = toCanonicalDeliveryStatus(status)
  return DELIVERY_STATUS_HEBREW[canonical] || String(status ?? '')
}

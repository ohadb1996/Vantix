import {
  PAYMENT_METHOD_LABELS,
  type SavedAddress,
  type SavedContact,
  type SavedPayment,
} from '../../types/customerProfile'
import { formatMaskedCardNumber } from '../../utils/cardNumber'

export function addressTitle(a: SavedAddress): string {
  if (a.label) return a.label
  return `${a.delivery_street} ${a.delivery_building_number}`.trim() || a.delivery_city
}

export function addressSummary(a: SavedAddress): string {
  const line = [a.delivery_street, a.delivery_building_number].filter(Boolean).join(' ')
  const extra = [
    a.delivery_apartment ? `דירה ${a.delivery_apartment}` : '',
    a.delivery_floor ? `קומה ${a.delivery_floor}` : '',
  ]
    .filter(Boolean)
    .join(', ')
  return [line, a.delivery_city, extra].filter(Boolean).join(' · ')
}

/** שורת כתובת מלאה לשדה עריכה / אוטוקומפליט */
export function formatFullAddress(
  parts: Pick<SavedAddress, 'delivery_street' | 'delivery_building_number' | 'delivery_city'>
): string {
  const line = [parts.delivery_street, parts.delivery_building_number].filter(Boolean).join(' ')
  return [line, parts.delivery_city].filter(Boolean).join(', ')
}

export function contactTitle(c: SavedContact): string {
  return c.fullName || c.phone
}

export function contactSummary(c: SavedContact): string {
  return [c.phone, c.phoneSecondary].filter(Boolean).join(' · ')
}

export function paymentTitle(p: SavedPayment): string {
  return p.label || PAYMENT_METHOD_LABELS[p.type]
}

export function paymentSummary(p: SavedPayment): string {
  const parts: string[] = []
  if (p.last4) parts.push(formatMaskedCardNumber(p.last4))
  if (p.expiryMonth && p.expiryYear) parts.push(`תוקף ${p.expiryMonth}/${p.expiryYear}`)
  if (parts.length === 0) parts.push(PAYMENT_METHOD_LABELS[p.type])
  return parts.join(' · ')
}

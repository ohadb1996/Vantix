import {
  PAYMENT_METHOD_LABELS,
  type SavedAddress,
  type SavedContact,
  type SavedPayment,
} from '../../types/customerProfile'

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
  const parts: string[] = [PAYMENT_METHOD_LABELS[p.type]]
  if (p.last4) parts.push(`•••• ${p.last4}`)
  return parts.join(' · ')
}

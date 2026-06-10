/**
 * נתונים שמורים של לקוח קצה (Vantix) – נשמרים תחת Customers/{uid}.
 * כתובות, פרטי קשר ואמצעי תשלום שמורים לבחירה מהירה בצ'קאאוט.
 */

/** סוג הצומת ב-RTDB לכל רשימה */
export type SavedEntityKind = 'savedAddresses' | 'savedContacts' | 'savedPayments'

export interface SavedAddress {
  id: string
  /** כינוי ידידותי – "בית", "עבודה" וכו' */
  label?: string
  delivery_city: string
  delivery_street: string
  delivery_building_number: string
  delivery_floor?: string
  delivery_apartment?: string
  delivery_building_code?: string
  delivery_notes?: string
  isDefault?: boolean
  createdAt?: string
}
export type SavedAddressInput = Omit<SavedAddress, 'id' | 'createdAt'>

export interface SavedContact {
  id: string
  fullName: string
  phone: string
  phoneSecondary?: string
  isDefault?: boolean
  createdAt?: string
}
export type SavedContactInput = Omit<SavedContact, 'id' | 'createdAt'>

export type PaymentMethodType = 'cash' | 'credit' | 'bit' | 'gpay' | 'apay'

export interface SavedPayment {
  id: string
  type: PaymentMethodType
  /** כינוי ידידותי – "ויזה אישית" וכו' (לא נשמרים פרטי כרטיס רגישים) */
  label?: string
  /** 4 ספרות אחרונות לתצוגה בלבד (אופציונלי) */
  last4?: string
  isDefault?: boolean
  createdAt?: string
}
export type SavedPaymentInput = Omit<SavedPayment, 'id' | 'createdAt'>

export const PAYMENT_METHOD_LABELS: Record<PaymentMethodType, string> = {
  cash: 'מזומן',
  credit: 'כרטיס אשראי',
  bit: 'ביט',
  gpay: 'Google Pay',
  apay: 'Apple Pay',
}

export const PAYMENT_METHOD_OPTIONS: { type: PaymentMethodType; label: string }[] = (
  Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethodType[]
).map((type) => ({ type, label: PAYMENT_METHOD_LABELS[type] }))

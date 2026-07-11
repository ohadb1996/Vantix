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

export type PaymentMethodType = 'cash' | 'credit' | 'bit' | 'gpay' | 'apay' | 'wallet_balance'

export interface SavedPayment {
  id: string
  type: PaymentMethodType
  /** כינוי ידידותי – "ויזה אישית" וכו' */
  label?: string
  /** 4 ספרות אחרונות לתצוגה בלבד */
  last4?: string
  /** ת.ז של בעל הכרטיס (לצורך הזמנה) */
  holderId?: string
  expiryMonth?: string
  expiryYear?: string
  /** נקבע בשרת לאחר חיוב/טוקניזציה מוצלחת */
  hasPayplusToken?: boolean
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
  wallet_balance: 'יתרה בארנק',
}

export const PAYMENT_METHOD_OPTIONS: { type: PaymentMethodType; label: string }[] = (
  Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethodType[]
).map((type) => ({ type, label: PAYMENT_METHOD_LABELS[type] }))

/** אפשרויות בחירה בצ'קאאוט – לפי סדר התצוגה */
export const CHECKOUT_PAYMENT_OPTIONS: { type: PaymentMethodType; label: string }[] = [
  { type: 'wallet_balance', label: PAYMENT_METHOD_LABELS.wallet_balance },
  { type: 'gpay', label: PAYMENT_METHOD_LABELS.gpay },
  { type: 'apay', label: PAYMENT_METHOD_LABELS.apay },
  { type: 'cash', label: PAYMENT_METHOD_LABELS.cash },
  { type: 'credit', label: PAYMENT_METHOD_LABELS.credit },
]

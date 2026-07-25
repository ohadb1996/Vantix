/** בחירה של הלקוח בסקשן (נשלח לבעל העסק) */
export interface OrderItemSelectedOption {
  sectionTitle: string
  optionLabel: string
  priceCents?: number
}

/**
 * הזמנה ל־RTDB – תואם ל־maxDelivery-partners (Orders/{orderId})
 */
export interface OrderItem {
  menuItemId?: string
  name: string
  price: number
  quantity: number
  /** תמונת המנה (אם קיימת בתפריט) */
  imageUrl?: string
  /** מה הלקוח בחר בסקשנים של המנה (גודל, תוספות וכו') */
  selectedOptions?: OrderItemSelectedOption[]
}

export interface Order {
  orderId?: string
  business_id: string
  /** שם העסק (נטען מה-RTDB לתצוגה) */
  business_name?: string
  customer_name: string
  customer_phone: string
  customer_phone_secondary?: string
  /** אופן מימוש ההזמנה: משלוח עד הבית או איסוף עצמי מהעסק */
  fulfillment_type?: 'delivery' | 'pickup'
  /** שדות כתובת – נדרשים למשלוח, ריקים/חסרים באיסוף עצמי */
  delivery_city?: string
  delivery_street?: string
  delivery_building_number?: string
  delivery_floor?: string
  delivery_apartment?: string
  delivery_building_code?: string
  delivery_notes?: string
  items: OrderItem[]
  status: 'new' | 'accepted' | 'delivery_created' | 'cancelled' | 'completed'
  createdAt: string
  created_by_uid?: string
  /** מזהה משלוח ב-RTDB – נכתב כשבעל העסק יוצר משלוח מההזמנה */
  delivery_id?: string
  /** אמצעי תשלום שבחר הלקוח */
  payment_method?: string
  /** סוג תשלום לעיבוד */
  payment_type?: 'cash' | 'credit' | 'gpay' | 'apay' | 'bit' | 'wallet_balance' | 'crypto'
  /** סטטוס תשלום */
  payment_status?:
    | 'paid'
    | 'cash_on_delivery'
    | 'pending'
    | 'pending_crypto'
    | 'pending_wallet'
    | 'crypto_partially_paid'
    | 'crypto_expired'
    | 'crypto_failed'
  /** סכום משנה (מנות בלבד) */
  items_subtotal?: number
  /** מינימום לחיוב במשלוח כפי שהוגדר לעסק (על סכום המנות בלבד, לפני דמי משלוח) */
  min_delivery_total?: number
  /** סכום ביניים לפני טיפ (מנות אחרי מינימום משלוח + דמי משלוח) */
  subtotal_before_tip?: number
  /** טיפ לשליח (₪) */
  courier_tip?: number
  /** סה״כ שחויב / לגבייה */
  total_charged?: number
  payplus_transaction_uid?: string
  payplus_approval_number?: string
  wallet_amount_used?: number
  cashback_credited?: boolean
  cashback_amount?: number
  /** פרטי תשלום קריפטו (NOWPayments direct) */
  nowpayments_payment_id?: string | number
  nowpayments_pay_address?: string
  nowpayments_pay_amount?: number
  nowpayments_pay_currency?: string
  nowpayments_payment_status?: string
  nowpayments_expiration_estimate_date?: string
  nowpayments_network?: string
  nowpayments_payin_extra_id?: string
  nowpayments_actually_paid?: number
  nowpayments_remaining_amount?: number
  crypto_transfer_fee_usdt?: number
  crypto_transfer_fee_ils?: number
  crypto_usdt_ils_rate?: number
  crypto_pay_currency?: string
}

/** נתונים לשליחה בצ'קאאוט (בלי orderId) */
export type OrderCreate = Omit<Order, 'orderId' | 'createdAt' | 'status'> & {
  status?: 'new'
}

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
  /** מה הלקוח בחר בסקשנים של המנה (גודל, תוספות וכו') */
  selectedOptions?: OrderItemSelectedOption[]
}

export interface Order {
  orderId?: string
  business_id: string
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
  status: 'new' | 'accepted' | 'delivery_created' | 'cancelled'
  createdAt: string
  created_by_uid?: string
  /** מזהה משלוח ב-RTDB – נכתב כשבעל העסק יוצר משלוח מההזמנה */
  delivery_id?: string
  /** אמצעי תשלום שבחר הלקוח */
  payment_method?: string
  /** סוג תשלום לעיבוד */
  payment_type?: 'cash' | 'credit' | 'gpay' | 'apay' | 'bit'
  /** סטטוס תשלום */
  payment_status?: 'paid' | 'cash_on_delivery' | 'pending'
  /** סכום משנה (מנות בלבד) */
  items_subtotal?: number
  /** טיפ לשליח (₪) */
  courier_tip?: number
  /** סה״כ שחויב / לגבייה */
  total_charged?: number
  payplus_transaction_uid?: string
  payplus_approval_number?: string
}

/** נתונים לשליחה בצ'קאאוט (בלי orderId) */
export type OrderCreate = Omit<Order, 'orderId' | 'createdAt' | 'status'> & {
  status?: 'new'
}

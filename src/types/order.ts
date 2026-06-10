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
  delivery_city: string
  delivery_street: string
  delivery_building_number: string
  delivery_floor?: string
  delivery_apartment?: string
  delivery_building_code?: string
  delivery_notes?: string
  items: OrderItem[]
  status: 'new' | 'accepted' | 'delivery_created' | 'cancelled'
  createdAt: string
  created_by_uid?: string
  /** אמצעי תשלום שבחר הלקוח (תצוגה בלבד – אין עיבוד תשלום באפליקציה) */
  payment_method?: string
}

/** נתונים לשליחה בצ'קאאוט (בלי orderId) */
export type OrderCreate = Omit<Order, 'orderId' | 'createdAt' | 'status'> & {
  status?: 'new'
}

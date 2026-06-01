/**
 * תפריט עסק – תואם ל־maxDelivery-partners (BusinessMenus/{businessId})
 */
export interface MenuCategory {
  id: string
  name: string
  sortOrder: number
}

/** אפשרות אחת בתוך סקשן (למשל "גדול", "תוספת גבינה") */
export interface MenuItemOption {
  id: string
  label: string
  /** תוספת מחיר באגורות (אופציונלי) */
  priceCents?: number
}

/** סקשן אופציונלי לפריט – כותרת ייחודית ובחירה יחידה או מרובה */
export interface MenuItemSection {
  id: string
  title: string
  choiceType: 'single' | 'multiple'
  options: MenuItemOption[]
}

export interface MenuItem {
  id: string
  name: string
  price: number
  categoryId: string
  description?: string
  imageUrl?: string
  available?: boolean
  sortOrder?: number
  /** סקשנים לפירוט ההזמנה – כמו ב־maxDelivery-partners */
  sections?: MenuItemSection[]
}

export interface BusinessMenu {
  categories: Record<string, MenuCategory>
  items: Record<string, MenuItem>
}

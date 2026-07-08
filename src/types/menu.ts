/**
 * תפריט עסק – תואם ל־maxDelivery-partners (BusinessMenus/{businessId})
 */
export interface MenuCategory {
  id: string
  name: string
  sortOrder: number
  /** false = מוסתר מאפליקציית הלקוחות */
  available?: boolean
}

/** אפשרות אחת בתוך סקשן (למשל "גדול", "תוספת גבינה") */
export interface MenuItemOption {
  id: string
  label: string
  /** תוספת מחיר באגורות (אופציונלי) */
  priceCents?: number
  /** מקסימום יחידות מאותה אפשרות (ברירת מחדל 1) */
  maxQuantity?: number
}

/** סקשן אופציונלי לפריט – כותרת ייחודית ובחירה יחידה או מרובה */
export interface MenuItemSection {
  id: string
  title: string
  choiceType: 'single' | 'multiple'
  options: MenuItemOption[]
  /** האם הלקוח חייב לבחור לפחות אפשרות אחת בסקשן */
  required?: boolean
  /** בבחירה מרובה + חובה – מינימום בחירות (ברירת מחדל 1) */
  minSelections?: number
  /** בבחירה מרובה – כמה יחידות ראשונות בחינם (למשל 2 רטבים ראשונים) */
  freeQuantity?: number
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

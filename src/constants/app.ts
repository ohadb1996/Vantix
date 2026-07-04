/**
 * קבועים גלובליים – שם האפליקציה, נתיבים, טקסטים, SEO
 */
export const APP_NAME = 'vantix'
export const APP_DISPLAY_NAME = 'Vantix'
export const PUBLIC_APP_URL = 'https://vantix.web.app'
export const PARTNERS_APP_URL = 'https://vantix-partners.web.app'

/** תיאור קצר לאפליקציה — meta, Open Graph, App Store */
export const APP_DESCRIPTION =
  'Vantix – הזמנת אוכל ומשלוחים. תן לי את הטעם המדויק עכשיו.'

/** אייקון מותג (מקור) — favicon, SEO, הפניות בקוד */
export const APP_ICON_PATH = '/assets/whitevantixicon.png'
export const APP_ICON_SQUARE_PATH = '/assets/whitevantixicon-square.png'
export const APP_ICON_OG_URL = `${PUBLIC_APP_URL}/icon-512.png`
export const APP_APPLE_TOUCH_ICON = '/apple-touch-icon.png'
export const APP_FAVICON_32 = '/favicon-32x32.png'

export const ROUTES = {
  HOME: '/',
  RESTAURANTS: '/restaurants',
  RESTAURANT_MENU: (id: string) => `/restaurants/${id}`,
  ORDERS: '/orders',
  ORDER_TRACKING: (orderId: string) => `/orders/${orderId}`,
  PROFILE: '/profile',
  AUTH_LOGIN: '/auth/login',
  AUTH_REGISTER: '/auth/register',
} as const

export const CART_STORAGE_KEY = 'vantix_cart'

/** קישור לשירות לקוחות / דיווח תקלות (וואטסאפ או דוא"ל) */
export const SUPPORT_LINK = 'https://wa.me/972797293919'

/**
 * קבועים גלובליים – שם האפליקציה, נתיבים, טקסטים
 */
export const APP_NAME = 'vantix'
export const APP_DISPLAY_NAME = 'Vantix'
export const PUBLIC_APP_URL = 'https://vantix.web.app'
export const PARTNERS_APP_URL = 'https://vantix-partners.web.app'

export const ROUTES = {
  HOME: '/',
  RESTAURANTS: '/restaurants',
  RESTAURANT_MENU: (id: string) => `/restaurants/${id}`,
  ORDERS: '/orders',
  PROFILE: '/profile',
  AUTH_LOGIN: '/auth/login',
  AUTH_REGISTER: '/auth/register',
} as const

export const CART_STORAGE_KEY = 'vantix_cart'

/** קישור לשירות לקוחות / דיווח תקלות (וואטסאפ או דוא"ל) */
export const SUPPORT_LINK = 'https://wa.me/972500000000'

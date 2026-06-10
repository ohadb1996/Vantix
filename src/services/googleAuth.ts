/**
 * התחברות / הרשמה עם Google – מודעת-פלטפורמה.
 * • Native (iOS/Android): שימוש בפלאגין המקומי @capacitor-firebase/authentication.
 *   ב-WebView ה-popup/redirect של firebase-js נשבר (unauthorized-domain / חלון נתקע),
 *   לכן פותחים את חלון ה-Google של מערכת ההפעלה ואז מסנכרנים את שכבת ה-JS SDK.
 * • Web: signInWithPopup, עם נפילה ל-redirect כאשר הדפדפן חוסם popups.
 */
import {
  GoogleAuthProvider,
  getRedirectResult,
  signInWithCredential,
  signInWithPopup,
  signInWithRedirect,
  type User,
} from 'firebase/auth'
import { getFirebaseAuth } from '../lib/firebase'

export type GooglePlatform = 'ios' | 'android' | 'web'

/** זיהוי קשיח של ריצה ב-Capacitor native (לא לפי userAgent — Safari נייד אינו native). */
export const getCapacitorPlatform = (): GooglePlatform => {
  if (typeof window === 'undefined') return 'web'
  const cap = (
    window as unknown as {
      Capacitor?: { isNativePlatform?: () => boolean; getPlatform?: () => string }
    }
  ).Capacitor
  if (!cap || typeof cap.isNativePlatform !== 'function' || cap.isNativePlatform() !== true) {
    return 'web'
  }
  const platform = typeof cap.getPlatform === 'function' ? cap.getPlatform() : 'web'
  return platform === 'ios' || platform === 'android' ? platform : 'web'
}

export const isNativePlatform = (): boolean => getCapacitorPlatform() !== 'web'

const buildGoogleProvider = () => {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  return provider
}

const GOOGLE_CREDENTIAL_TIMEOUT_MS = 10_000

const withTimeout = <T>(promise: Promise<T>, ms: number, message: string): Promise<T> =>
  Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms)
    }),
  ])

/** בונה pseudo-user תואם ל-User של firebase מתוך נתוני הפלאגין (גיבוי ל-iOS אם ה-JS SDK לא הספיק לסנכרן). */
const buildGooglePseudoUser = (
  nativeUser: { uid: string; email: string | null; displayName: string | null; photoUrl?: string | null },
  firebaseIdToken: string,
): User => {
  const now = new Date().toISOString()
  return {
    uid: nativeUser.uid,
    email: nativeUser.email,
    emailVerified: true,
    displayName: nativeUser.displayName,
    photoURL: nativeUser.photoUrl ?? null,
    phoneNumber: null,
    isAnonymous: false,
    providerId: 'google.com',
    providerData: [],
    tenantId: null,
    refreshToken: '',
    metadata: { creationTime: now, lastSignInTime: now },
    getIdToken: async () => firebaseIdToken,
    getIdTokenResult: async () => ({ token: firebaseIdToken }) as never,
    reload: async () => {},
    delete: async () => {},
    toJSON: () => ({ uid: nativeUser.uid, email: nativeUser.email }),
  } as unknown as User
}

/** Native Google Sign-In (iOS/Android) דרך הפלאגין המקומי. */
const signInWithGoogleNative = async (platform: 'ios' | 'android'): Promise<User> => {
  const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication')

  const result = await FirebaseAuthentication.signInWithGoogle()
  if (!result.user) {
    throw new Error('ההתחברות עם Google בוטלה.')
  }

  const auth = getFirebaseAuth()
  const googleIdToken = result.credential?.idToken

  // סנכרון שכבת ה-JS SDK — חיוני כדי שקריאות RTDB יעבדו עם המשתמש המחובר.
  if (googleIdToken) {
    const credential = GoogleAuthProvider.credential(
      googleIdToken,
      result.credential?.accessToken ?? undefined,
    )
    if (platform === 'android') {
      const userCredential = await signInWithCredential(auth, credential)
      return userCredential.user
    }
    // iOS: ב-WebView signInWithCredential עלול להיתקע — מנסים עם timeout ונופלים ל-pseudo-user.
    try {
      const userCredential = await withTimeout(
        signInWithCredential(auth, credential),
        GOOGLE_CREDENTIAL_TIMEOUT_MS,
        'credential-timeout',
      )
      return userCredential.user
    } catch {
      /* נופלים לגיבוי למטה */
    }
  }

  if (auth.currentUser) return auth.currentUser

  // גיבוי ל-iOS: בונים pseudo-user מתוך ה-Firebase ID token של הפלאגין.
  const tokenResult = await FirebaseAuthentication.getIdToken()
  const firebaseIdToken = tokenResult.token
  if (!firebaseIdToken) {
    throw new Error('לא התקבל token מ-Firebase. ודא ש-Google Sign-In מופעל ב-Firebase Console.')
  }
  return buildGooglePseudoUser(result.user, firebaseIdToken)
}

/** האם כדאי ליפול ל-redirect במקום popup (חסימת popup / שבירת COOP). */
const shouldUseGoogleRedirectFallback = (error: unknown): boolean => {
  const code = (error as { code?: string })?.code
  const message = ((error as { message?: string })?.message ?? '').toLowerCase()
  return (
    code === 'auth/popup-blocked' ||
    code === 'auth/operation-not-supported-in-this-environment' ||
    message.includes('cross-origin-opener-policy') ||
    message.includes('window.closed')
  )
}

/**
 * התחברות/הרשמה עם Google.
 * מחזיר User אם הצליח, או null אם בוצע redirect (Web בלבד) — התוצאה תיקלט ב-getRedirectResult.
 */
export const signInWithGoogle = async (): Promise<User | null> => {
  const platform = getCapacitorPlatform()
  if (platform === 'ios' || platform === 'android') {
    return signInWithGoogleNative(platform)
  }

  const auth = getFirebaseAuth()
  const provider = buildGoogleProvider()
  try {
    const result = await signInWithPopup(auth, provider)
    return result.user
  } catch (error: unknown) {
    if (shouldUseGoogleRedirectFallback(error)) {
      await signInWithRedirect(auth, provider)
      return null
    }
    if ((error as { code?: string })?.code === 'auth/popup-closed-by-user') {
      const e = new Error('חלון ההתחברות נסגר לפני סיום. נסה שוב.') as Error & { code?: string }
      e.code = 'auth/popup-closed-by-user'
      throw e
    }
    throw error
  }
}

/** קולט תוצאת redirect של Google (אם הייתה). מחזיר User או null. */
export const getGoogleRedirectResult = async (): Promise<User | null> => {
  try {
    const result = await getRedirectResult(getFirebaseAuth())
    return result?.user ?? null
  } catch (error) {
    console.warn('[googleAuth] getGoogleRedirectResult failed:', error)
    return null
  }
}

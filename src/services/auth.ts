import {
  createUserWithEmailAndPassword,
  linkWithPhoneNumber,
  signInWithPhoneNumber,
  type ConfirmationResult,
  type RecaptchaVerifier,
  type User,
  type UserCredential,
} from 'firebase/auth'
import { ref, set } from 'firebase/database'
import { getFirebaseAuth, getRealtimeDb } from '../lib/firebase'
import { normalizeIsraeliPhone } from '../utils/phone'

/** המרה ל-E.164 ל-Firebase (ישראל: 05x -> +9725x). */
export function toE164(phone: string): string {
  const normalized = normalizeIsraeliPhone(phone).replace(/\D/g, '')
  if (normalized.startsWith('0') && normalized.length === 10) {
    return '+972' + normalized.slice(1)
  }
  if (normalized.startsWith('972') && normalized.length >= 11) {
    return '+' + normalized.slice(0, 12)
  }
  return normalized ? '+' + normalized : phone
}

type SignUpPayload = {
  fullName: string
  email: string
  password: string
  marketingOptIn: boolean
}

export type SignUpResult = {
  credential: UserCredential
}

/** נתוני לקוח ב-RTDB – נתיב Customers/{uid} (כמו Businesses, Couriers). כולל טלפון מאומת. */
function customerRTDBPayload(
  user: User,
  extra: { fullName?: string; marketingOptIn?: boolean; phone?: string } = {},
) {
  const now = new Date().toISOString()
  const phone = user.phoneNumber ?? extra.phone ?? ''
  return {
    email: user.email ?? '',
    displayName: user.displayName ?? extra.fullName ?? '',
    ...(phone && { phone }),
    createdAt: now,
    lastLoginAt: now,
    ...(extra.marketingOptIn !== undefined && { marketingOptIn: extra.marketingOptIn }),
  }
}

/**
 * מוודא ש-Customers/{uid} קיים ב-RTDB (יצירה או עדכון lastLoginAt).
 * נקרא אחרי התחברות (אימייל או Google) כדי שלא יאבד ה-flow.
 */
export async function ensureCustomerInRTDB(
  user: User,
  extra: { fullName?: string; marketingOptIn?: boolean; phone?: string } = {},
): Promise<void> {
  const rtdb = getRealtimeDb()
  const payload = customerRTDBPayload(user, extra)
  await set(ref(rtdb, `Customers/${user.uid}`), { ...payload, lastLoginAt: new Date().toISOString() })
}

/**
 * אחרי התחברות (אימייל או Google): מוודא ש-Customers/{uid} קיים ב-RTDB.
 * כרגע עובדים עם RTDB בלבד – אין כתיבה ל-Firestore.
 */
export async function ensureCustomerProfileOnSignIn(user: User): Promise<void> {
  const rtdb = getRealtimeDb()
  const uid = user.uid
  const now = new Date().toISOString()
  const customerPayload = customerRTDBPayload(user)
  await set(ref(rtdb, `Customers/${uid}`), { ...customerPayload, lastLoginAt: now })
}

/** רישום לקוח – RTDB בלבד (Customers/{uid}). */
export const signUpCustomer = async ({
  fullName,
  email,
  password,
  marketingOptIn,
}: SignUpPayload): Promise<SignUpResult> => {
  const auth = getFirebaseAuth()
  const rtdb = getRealtimeDb()
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  const uid = credential.user.uid
  const user = credential.user

  const customerRtdb = customerRTDBPayload(user, { fullName, marketingOptIn })
  await set(ref(rtdb, `Customers/${uid}`), customerRtdb)

  return { credential }
}

/**
 * שליחת קוד SMS לאימות טלפון – התחברות עם טלפון בלבד.
 * המספר בפורמט E.164 (למשל +972501234567). השתמש ב-toE164() מטלפון ישראלי.
 * מחזיר ConfirmationResult – להזין את הקוד ב-confirmPhoneSignIn.
 */
export async function sendPhoneVerificationCode(
  phoneNumberE164: string,
  appVerifier: RecaptchaVerifier,
): Promise<ConfirmationResult> {
  const auth = getFirebaseAuth()
  return signInWithPhoneNumber(auth, phoneNumberE164, appVerifier)
}

/**
 * השלמת התחברות עם טלפון – אחרי שהמשתמש הזין את הקוד שנשלח ב-SMS.
 */
export async function confirmPhoneSignIn(
  confirmationResult: ConfirmationResult,
  code: string,
): Promise<UserCredential> {
  return confirmationResult.confirm(code)
}

/**
 * קישור טלפון מאומת לחשבון קיים (למשתמש שכבר מחובר עם אימייל/Google).
 * אחרי confirm – user.phoneNumber מתעדכן; עדכן גם Customers ב-RTDB.
 */
export async function linkPhoneToCurrentUser(
  phoneNumberE164: string,
  appVerifier: RecaptchaVerifier,
): Promise<ConfirmationResult> {
  const auth = getFirebaseAuth()
  const user = auth.currentUser
  if (!user) throw new Error('לא מחובר – יש להתחבר לפני קישור טלפון')
  return linkWithPhoneNumber(user, phoneNumberE164, appVerifier)
}


/** הודעות שגיאת Firebase Auth ידידותיות למשתמש (עברית) */

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'auth/invalid-credential': 'מייל או סיסמה לא תקינים. בדוק/י ונסה/י שוב.',
  'auth/wrong-password': 'מייל או סיסמה לא תקינים. בדוק/י ונסה/י שוב.',
  'auth/user-not-found': 'מייל או סיסמה לא תקינים. בדוק/י ונסה/י שוב.',
  'auth/invalid-email': 'כתובת האימייל לא תקינה.',
  'auth/missing-password': 'נא להזין סיסמה.',
  'auth/weak-password': 'הסיסמה חלשה מדי. בחר/י לפחות 6 תווים.',
  'auth/email-already-in-use': 'כתובת האימייל כבר רשומה. נסה/י להתחבר.',
  'auth/too-many-requests': 'יותר מדי ניסיונות. נסה/י שוב מאוחר יותר.',
  'auth/user-disabled': 'החשבון הושבת. פנה/י לתמיכה.',
  'auth/network-request-failed': 'בעיית חיבור. בדוק/י את האינטרנט ונסה/י שוב.',
  'auth/popup-closed-by-user': 'חלון ההתחברות נסגר לפני סיום. נסה/י שוב.',
  'auth/popup-blocked': 'הדפדפן חסם את חלון ההתחברות. אפשר/י חלונות קופצים ונסה/י שוב.',
  'auth/cancelled-popup-request': 'התחברות בוטלה. נסה/י שוב.',
  'auth/account-exists-with-different-credential':
    'לאימייל הזה כבר קיים חשבון עם אימייל וסיסמה. התחבר/י עם אותו אימייל וסיסמה.',
  'auth/credential-already-in-use': 'פרטי ההתחברות כבר בשימוש בחשבון אחר.',
  'auth/invalid-verification-code': 'הקוד שהוזן לא תקין. נסה/י שוב.',
  'auth/code-expired': 'פג תוקף הקוד. שלח/י קוד חדש.',
  'auth/invalid-phone-number': 'מספר הטלפון לא תקין.',
  'auth/missing-verification-code': 'נא להזין את הקוד שנשלח ב-SMS.',
  'auth/quota-exceeded': 'שירות האימות עמוס כרגע. נסה/י שוב מאוחר יותר.',
  'auth/operation-not-allowed': 'שיטת ההתחברות הזו לא זמינה כרגע.',
  'auth/requires-recent-login': 'מטעמי אבטחה, יש להתחבר מחדש ולנסות שוב.',
}

export type AuthErrorContext = 'login' | 'signup' | 'google' | 'phone-send' | 'phone-code'

const FALLBACK: Record<AuthErrorContext, string> = {
  login: 'לא הצלחנו להיכנס. בדוק/י את הפרטים ונסה/י שוב.',
  signup: 'לא הצלחנו להירשם. נסה/י שוב או פנה/י לתמיכה.',
  google: 'התחברות עם Google נכשלה. נסה/י שוב.',
  'phone-send': 'שליחת הקוד נכשלה. נסה/י שוב.',
  'phone-code': 'הקוד לא תקין. נסה/י שוב.',
}

function extractFirebaseCode(err: unknown): string | null {
  if (err && typeof err === 'object' && 'code' in err) {
    const code = (err as { code?: string }).code
    if (typeof code === 'string' && code.startsWith('auth/')) return code
  }
  if (err instanceof Error) {
    const match = err.message.match(/auth\/[\w-]+/)
    if (match) return match[0]
  }
  return null
}

function isRawFirebaseMessage(message: string): boolean {
  return /Firebase:\s*Error/i.test(message) || /auth\/[\w-]+/.test(message)
}

/** מחזיר הודעה ידידותית לשגיאת Firebase Auth */
export function getAuthErrorMessage(
  err: unknown,
  context: AuthErrorContext = 'login'
): string {
  const code = extractFirebaseCode(err)
  if (code && AUTH_ERROR_MESSAGES[code]) {
    return AUTH_ERROR_MESSAGES[code]
  }

  if (err instanceof Error && err.message.trim()) {
    if (!isRawFirebaseMessage(err.message)) {
      return err.message
    }
  }

  return FALLBACK[context]
}

/** זורק Error עם הודעה ידידותית (שומר code מקורי אם קיים) */
export function throwFriendlyAuthError(err: unknown, context: AuthErrorContext): never {
  const code = extractFirebaseCode(err)
  const message = getAuthErrorMessage(err, context)
  const e = new Error(message) as Error & { code?: string }
  if (code) e.code = code
  throw e
}

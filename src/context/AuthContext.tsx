import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'
import type { ConfirmationResult, RecaptchaVerifier } from 'firebase/auth'
import {
  getRedirectResult,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth'
import { getFirebaseAuth } from '../lib/firebase'
import {
  confirmPhoneSignIn as authConfirmPhoneSignIn,
  ensureCustomerProfileOnSignIn,
  linkPhoneToCurrentUser,
  sendPhoneVerificationCode,
} from '../services/auth'
import { signInWithGoogle } from '../services/googleAuth'

const ACCOUNT_EXISTS_MSG =
  'לאימייל הזה כבר קיים חשבון עם אימייל וסיסמה. התחבר עם אותו אימייל וסיסמה.'

type AuthContextValue = {
  user: User | null
  loading: boolean
  /** שגיאה מהתחברות (למשל redirect מ-Google) – נמחקת אחרי קריאה */
  authError: string | null
  clearAuthError: () => void
  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  /** התחברות עם טלפון – שולח SMS, מחזיר ConfirmationResult להזנת קוד. */
  loginWithPhone: (phoneE164: string, appVerifier: RecaptchaVerifier) => Promise<ConfirmationResult>
  /** השלמת התחברות טלפון אחרי הזנת קוד. */
  confirmPhoneSignIn: (confirmationResult: ConfirmationResult, code: string) => Promise<void>
  /** קישור טלפון מאומת לחשבון מחובר (אימייל/Google). */
  linkPhone: (phoneE164: string, appVerifier: RecaptchaVerifier) => Promise<ConfirmationResult>
  confirmLinkPhone: (confirmationResult: ConfirmationResult, code: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    const auth = getFirebaseAuth()

    const handleUser = (currentUser: User | null) => {
      setUser(currentUser)
      setLoading(false)
      if (currentUser) {
        void ensureCustomerProfileOnSignIn(currentUser).catch((err) => {
          console.warn('[Auth] ensureCustomerProfileOnSignIn failed:', err)
        })
      }
    }

    // Listen to auth state immediately so redirect sign-in is reflected without waiting
    const unsubscribe = onAuthStateChanged(auth, handleUser)

    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          void ensureCustomerProfileOnSignIn(result.user).catch((err) => {
            console.warn('[Auth] ensureCustomerProfileOnSignIn after redirect failed:', err)
          })
        }
      })
      .catch((err: unknown) => {
        const code = err && typeof err === 'object' && 'code' in err ? (err as { code?: string }).code : ''
        if (code === 'auth/account-exists-with-different-credential') {
          setAuthError(ACCOUNT_EXISTS_MSG)
        } else {
          console.warn('[Auth] getRedirectResult failed:', err)
        }
      })

    return () => unsubscribe()
  }, [])

  const login = async (email: string, password: string) => {
    const auth = getFirebaseAuth()
    await signInWithEmailAndPassword(auth, email, password)
    const currentUser = auth.currentUser
    if (currentUser) {
      await ensureCustomerProfileOnSignIn(currentUser)
    }
  }

  const loginWithGoogle = async () => {
    try {
      // signInWithGoogle מטפל אוטומטית בנייטיב (iOS/Android דרך הפלאגין המקומי) ובווב (popup + נפילה ל-redirect).
      const googleUser = await signInWithGoogle()
      // null => בוצע redirect (ווב); המשתמש ייקלט ב-getRedirectResult / onAuthStateChanged.
      if (!googleUser) return
      await ensureCustomerProfileOnSignIn(googleUser)
    } catch (err: unknown) {
      const code = err && typeof err === 'object' && 'code' in err ? (err as { code?: string }).code : ''
      if (code === 'auth/account-exists-with-different-credential') {
        throw new Error(ACCOUNT_EXISTS_MSG)
      }
      throw err
    }
  }

  const loginWithPhone = async (phoneE164: string, appVerifier: RecaptchaVerifier) => {
    return sendPhoneVerificationCode(phoneE164, appVerifier)
  }

  const confirmPhoneSignIn = async (
    confirmationResult: ConfirmationResult,
    code: string,
  ) => {
    const credential = await authConfirmPhoneSignIn(confirmationResult, code)
    await ensureCustomerProfileOnSignIn(credential.user)
  }

  const linkPhone = async (phoneE164: string, appVerifier: RecaptchaVerifier) => {
    return linkPhoneToCurrentUser(phoneE164, appVerifier)
  }

  const confirmLinkPhone = async (
    confirmationResult: ConfirmationResult,
    code: string,
  ) => {
    await authConfirmPhoneSignIn(confirmationResult, code)
    const auth = getFirebaseAuth()
    const currentUser = auth.currentUser
    if (currentUser) await ensureCustomerProfileOnSignIn(currentUser)
  }

  const logout = async () => {
    const auth = getFirebaseAuth()
    await signOut(auth)
  }

  const clearAuthError = useCallback(() => setAuthError(null), [])

  const value = useMemo(
    () => ({
      user,
      loading,
      authError,
      clearAuthError,
      login,
      loginWithGoogle,
      loginWithPhone,
      confirmPhoneSignIn,
      linkPhone,
      confirmLinkPhone,
      logout,
    }),
    [user, loading, authError, clearAuthError],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}


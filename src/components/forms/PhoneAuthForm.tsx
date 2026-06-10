/**
 * התחברות / אימות טלפון עם Firebase Phone Auth (SMS).
 * דורש ב-Firebase Console: Authentication → Sign-in method → Phone מופעל.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2, Smartphone } from 'lucide-react'
import { RecaptchaVerifier } from 'firebase/auth'
import { getFirebaseAuth } from '../../lib/firebase'
import { toE164 } from '../../services/auth'
import { useAuth } from '../../context/AuthContext'
import type { ConfirmationResult } from 'firebase/auth'

const PHONE_SEND_BUTTON_ID = 'phone-send-code-btn'

export const PhoneAuthForm = ({
  onSuccess,
  mode = 'sign-in',
}: {
  onSuccess?: () => void
  mode?: 'sign-in' | 'link'
}) => {
  const {
    loginWithPhone,
    confirmPhoneSignIn,
    linkPhone,
    confirmLinkPhone,
  } = useAuth()
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const phoneRef = useRef('')
  const verifierRef = useRef<RecaptchaVerifier | null>(null)

  phoneRef.current = phone

  const sendCodeRef = useRef<() => Promise<void>>(async () => {})
  const sendCode = useCallback(async () => {
    const raw = phoneRef.current.trim()
    if (!raw) {
      setError('הזן מספר טלפון')
      return
    }
    const phoneE164 = toE164(raw)
    const verifier = verifierRef.current
    if (!verifier) {
      setError('אימות לא מוכן. רענן את הדף ונסה שוב.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const result =
        mode === 'link' ? await linkPhone(phoneE164, verifier) : await loginWithPhone(phoneE164, verifier)
      setConfirmationResult(result)
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'שליחת הקוד נכשלה. נסה שוב.'
      setError(msg)
      try {
        ;(verifier as { reset?: () => void }).reset?.()
      } catch {
        // ignore
      }
    } finally {
      setLoading(false)
    }
  }, [mode, loginWithPhone, linkPhone])
  sendCodeRef.current = sendCode

  useEffect(() => {
    const auth = getFirebaseAuth()
    auth.languageCode = 'he'
    const el = document.getElementById(PHONE_SEND_BUTTON_ID)
    if (!el) return
    const verifier = new RecaptchaVerifier(auth, PHONE_SEND_BUTTON_ID, {
      size: 'invisible',
      callback: () => {
        void sendCodeRef.current()
      },
    })
    verifierRef.current = verifier
    return () => {
      try {
        verifier.clear?.()
      } catch {
        // ignore
      }
      verifierRef.current = null
    }
  }, [])

  const handleConfirm = async () => {
    if (!confirmationResult || !code.trim()) return
    setError(null)
    setLoading(true)
    try {
      if (mode === 'link') {
        await confirmLinkPhone(confirmationResult, code.trim())
      } else {
        await confirmPhoneSignIn(confirmationResult, code.trim())
      }
      setConfirmationResult(null)
      setCode('')
      onSuccess?.()
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'קוד לא תקין. נסה שוב.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  if (confirmationResult) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-vantix-fg-muted">
          נשלח קוד ל־{phone}. הזן את הקוד מההודעה:
        </p>
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          placeholder="123456"
          className="w-full rounded-2xl border border-vantix-cyan/20 bg-vantix-surface-raised px-4 py-3 text-center text-lg tracking-widest text-vantix-fg outline-none transition focus:border-vantix-cyan/40 focus:ring-2 focus:ring-vantix-cyan/10"
        />
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        <button
          type="button"
          onClick={handleConfirm}
          disabled={loading || code.length < 4}
          className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-vantix-orange dark:bg-vantix-cyan px-5 py-3 text-sm font-semibold text-white dark:text-black shadow-vantix transition hover:brightness-110 disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'אימות'}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-vantix-fg-muted">
        יישלח קוד SMS לאימות. עלויות SMS לפי תעריף הספק.
      </p>
      <input
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="050-1234567"
        className="w-full rounded-2xl border border-vantix-cyan/20 bg-vantix-surface-raised px-4 py-3 text-sm text-vantix-fg outline-none transition focus:border-vantix-cyan/40 focus:ring-2 focus:ring-vantix-cyan/10"
      />
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      <button
        id={PHONE_SEND_BUTTON_ID}
        type="button"
        disabled={loading}
        className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-vantix-cyan/25 bg-vantix-surface-raised px-5 py-3 text-sm font-semibold text-vantix-fg transition hover:bg-gradient-to-l from-vantix-cyan to-vantix-orange/5 disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-vantix-cyan" />
        ) : (
          <>
            <Smartphone className="h-4 w-4" />
            שלח קוד
          </>
        )}
      </button>
    </div>
  )
}

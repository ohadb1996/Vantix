import { type FormEvent, useState } from 'react'
import { Eye, EyeOff, Loader2, LogIn } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getAuthErrorMessage } from '../../utils/authErrors'

const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
)

type FormState = {
  email: string
  password: string
}

const INITIAL_STATE: FormState = {
  email: '',
  password: '',
}

type LoginFormProps = { redirectTo?: string }

export const LoginForm = ({ redirectTo }: LoginFormProps) => {
  const { login, loginWithGoogle, authError, clearAuthError } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState>(INITIAL_STATE)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const to = redirectTo || '/'
  const displayError = error ?? authError

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    clearAuthError()
    setIsSubmitting(true)

    try {
      await login(form.email, form.password)
      setForm(INITIAL_STATE)
      navigate(to)
    } catch (err) {
      setError(getAuthErrorMessage(err, 'login'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError(null)
    clearAuthError()
    setIsGoogleLoading(true)
    try {
      await loginWithGoogle()
      navigate(to)
    } catch (err) {
      setError(getAuthErrorMessage(err, 'google'))
    } finally {
      setIsGoogleLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-3xl border border-vantix-cyan/20 bg-vantix-surface-raised p-8 shadow-[0_18px_65px_rgba(0,0,0,0.05)]"
    >
      <div className="space-y-2">
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.32em] text-vantix-cyan">
          <LogIn className="h-4 w-4" />
          welcome back
        </p>
        <h2 className="font-display text-2xl text-vantix-fg sm:text-3xl">
          חוזרים למסע הטעמים
        </h2>
        <p className="text-sm text-vantix-fg-muted">
          התחברו לחשבון Vantix שלכם כדי לראות הזמנות, המלצות ומועדון ההפתעות.
        </p>
      </div>

      <label className="space-y-1">
        <span className="text-xs font-semibold uppercase tracking-[0.24em] text-vantix-fg-muted">
          אימייל
        </span>
        <input
          type="email"
          required
          value={form.email}
          onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
          className="w-full rounded-2xl border border-vantix-cyan/20 bg-vantix-surface-raised px-4 py-3 text-sm text-vantix-fg outline-none transition focus:border-vantix-cyan/40 focus:ring-2 focus:ring-vantix-cyan/10"
          placeholder="name@email.com"
        />
      </label>

      <label className="space-y-1">
        <span className="text-xs font-semibold uppercase tracking-[0.24em] text-vantix-fg-muted">
          סיסמה
        </span>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            required
            value={form.password}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, password: event.target.value }))
            }
            className="w-full rounded-2xl border border-vantix-cyan/20 bg-vantix-surface-raised py-3 pl-4 pr-12 text-sm text-vantix-fg outline-none transition focus:border-vantix-cyan/40 focus:ring-2 focus:ring-vantix-cyan/10"
            placeholder="הסיסמה שלך"
          />
          <button
            type="button"
            onClick={() => setShowPassword((p) => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-vantix-fg-subtle transition hover:bg-vantix-cyan/10 hover:text-vantix-cyan"
            aria-label={showPassword ? 'הסתר סיסמה' : 'הצג סיסמה'}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </label>

      {displayError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {displayError}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting || isGoogleLoading}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-vantix-orange dark:bg-vantix-cyan px-5 py-3 text-sm font-semibold text-white dark:text-black shadow-vantix transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            מתחבר...
          </>
        ) : (
          'כניסה'
        )}
      </button>

      <div className="relative my-2 text-center text-xs text-vantix-fg-subtle">
        <span className="bg-vantix-surface-raised px-2">או</span>
      </div>

      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={isSubmitting || isGoogleLoading}
        className="inline-flex items-center justify-center gap-2 rounded-full border border-vantix-cyan/25 bg-vantix-surface-raised px-5 py-3 text-sm font-semibold text-vantix-fg transition hover:bg-gradient-to-l from-vantix-cyan to-vantix-orange/5 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isGoogleLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-vantix-cyan" />
        ) : (
          <>
            <GoogleIcon />
            התחבר עם Google
          </>
        )}
      </button>
    </form>
  )
}


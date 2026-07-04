import { type FormEvent, useState } from 'react'
import { Eye, EyeOff, Loader2, LogIn } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { GoogleAuthButton } from '../auth/GoogleAuthButton'
import { getAuthErrorMessage } from '../../utils/authErrors'

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

      <GoogleAuthButton
        label="התחבר עם Google"
        loading={isGoogleLoading}
        disabled={isSubmitting}
        onClick={handleGoogleLogin}
      />
    </form>
  )
}


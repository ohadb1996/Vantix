import { type FormEvent, useState } from 'react'
import { CheckCircle, Eye, EyeOff, Loader2 } from 'lucide-react'
import { signUpCustomer } from '../../services/auth'

type FormState = {
  fullName: string
  email: string
  password: string
  marketingOptIn: boolean
}

const INITIAL_STATE: FormState = {
  fullName: '',
  email: '',
  password: '',
  marketingOptIn: true,
}

type SignUpFormProps = {
  onSuccess?: () => void
}

export const SignUpForm = ({ onSuccess }: SignUpFormProps = {}) => {
  const [form, setForm] = useState<FormState>(INITIAL_STATE)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      await signUpCustomer(form)
      setForm(INITIAL_STATE)
      if (onSuccess) {
        onSuccess()
      } else {
        setSuccess(true)
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'משהו השתבש. נסה שוב או פנה לתמיכת Vantix.'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-vantix-cyan/20 bg-vantix-surface-raised p-8 text-center shadow-[0_20px_70px_rgba(0,0,0,0.05)]">
        <CheckCircle className="h-10 w-10 text-vantix-cyan" />
        <h3 className="font-display text-2xl text-vantix-fg">
          ברוך הבא ל-Vantix!
        </h3>
        <p className="max-w-sm text-sm text-vantix-fg-muted">
          החוויה הפרסונלית בדרך אליך. חפש במסעדות, שמור טעמים וסנכרן את ההעדפות שלך
          בין המכשירים.
        </p>
        <button
          type="button"
          className="rounded-full border border-vantix-cyan/25 bg-vantix-surface-raised px-4 py-2 text-sm font-semibold text-vantix-fg transition hover:bg-vantix-cyan/10"
          onClick={() => setSuccess(false)}
        >
          להירשם למשתמש נוסף
        </button>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-3xl border border-vantix-cyan/20 bg-vantix-surface-raised p-8 shadow-[0_20px_70px_rgba(0,0,0,0.05)]"
    >
      <div className="space-y-2">
        <h3 className="font-display text-2xl text-vantix-fg">
          יוצאים לדרך עם Vantix
        </h3>
        <p className="text-sm text-vantix-fg-muted">
          מלאו את הפרטים ונתאים לכם חוויות, מסעדות ומנות לפי ה-Taste DNA שלכם.
        </p>
      </div>

      <label className="space-y-1">
        <span className="text-xs font-semibold uppercase tracking-[0.24em] text-vantix-fg-muted">
          שם מלא
        </span>
        <input
          required
          value={form.fullName}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, fullName: event.target.value }))
          }
          placeholder="איך נקרא לך?"
          className="w-full rounded-2xl border border-vantix-cyan/20 bg-vantix-surface-raised px-4 py-3 text-sm text-vantix-fg outline-none transition focus:border-vantix-cyan/40 focus:ring-2 focus:ring-vantix-cyan/10"
        />
      </label>

      <label className="space-y-1">
        <span className="text-xs font-semibold uppercase tracking-[0.24em] text-vantix-fg-muted">
          אימייל
        </span>
        <input
          type="email"
          required
          value={form.email}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, email: event.target.value }))
          }
          placeholder="name@email.com"
          className="w-full rounded-2xl border border-vantix-cyan/20 bg-vantix-surface-raised px-4 py-3 text-sm text-vantix-fg outline-none transition focus:border-vantix-cyan/40 focus:ring-2 focus:ring-vantix-cyan/10"
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
            minLength={6}
            value={form.password}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, password: event.target.value }))
            }
            placeholder="לפחות 6 תווים"
            className="w-full rounded-2xl border border-vantix-cyan/20 bg-vantix-surface-raised py-3 pl-4 pr-12 text-sm text-vantix-fg outline-none transition focus:border-vantix-cyan/40 focus:ring-2 focus:ring-vantix-cyan/10"
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

      <label className="flex items-center gap-3 rounded-2xl border border-vantix-cyan/20 bg-vantix-cyan/10/60 px-4 py-3 text-sm text-vantix-fg-muted">
        <input
          type="checkbox"
          checked={form.marketingOptIn}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, marketingOptIn: event.target.checked }))
          }
          className="h-4 w-4 rounded border-vantix-cyan/40 text-vantix-cyan focus:ring-vantix-cyan/20"
        />
        קחו אותי למסע הטעמים של Vantix – עדכוני בונוסים, מנות חדשות והטבות מיוחדות.
      </label>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-vantix-orange dark:bg-vantix-cyan px-5 py-3 text-sm font-semibold text-white dark:text-black shadow-vantix transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            נרשם...
          </>
        ) : (
          'הצטרפות חינמית'
        )}
      </button>
    </form>
  )
}


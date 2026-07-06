import { ShieldCheck } from 'lucide-react'
import { formatCardNumberInput, stripCardNumber } from '../../utils/cardNumber'

type CheckoutCreditSecurityFieldsProps = {
  cvv: string
  onCvvChange: (value: string) => void
  cardNumber: string
  onCardNumberChange: (value: string) => void
  requireFullCard: boolean
  errors?: { cvv?: string; cardNumber?: string }
  /** במודל – בלי כותרת כפולה */
  compact?: boolean
}

/** CVV (ותמיד) + מספר כרטיס מלא בחיוב ראשון — לא נשמרים, רק נשלחים לשרת לחיוב PayPlus */
export function CheckoutCreditSecurityFields({
  cvv,
  onCvvChange,
  cardNumber,
  onCardNumberChange,
  requireFullCard,
  errors,
  compact = false,
}: CheckoutCreditSecurityFieldsProps) {
  const inputClass =
    'min-h-[48px] w-full rounded-xl border border-vantix-line/10 bg-vantix-surface-raised px-3 py-2.5 text-base text-vantix-fg focus:outline-none focus:ring-2 focus:ring-vantix-cyan/40'

  return (
    <div
      className={
        compact
          ? 'space-y-4'
          : 'space-y-4 rounded-2xl border border-vantix-cyan/20 bg-vantix-surface p-4'
      }
    >
      {!compact && (
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-vantix-cyan/12 text-vantix-cyan">
            <ShieldCheck className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-semibold text-vantix-fg">אימות תשלום מאובטח</p>
            <p className="text-xs leading-relaxed text-vantix-fg-muted">
              {requireFullCard
                ? 'בפעם הראשונה עם הכרטיס הזה — מזינים מספר ו-CVV. מההזמנה הבאה יספיק CVV בלבד.'
                : 'הזינו את שלוש הספרות מאחורי הכרטיס (CVV).'}
            </p>
          </div>
        </div>
      )}

      <div className={`grid gap-3 ${requireFullCard ? 'sm:grid-cols-[minmax(0,1fr)_7.5rem]' : ''}`}>
        {requireFullCard && (
          <div>
            <label htmlFor="checkout-card-number" className="mb-1.5 block text-sm font-medium text-vantix-fg">
              מספר כרטיס
            </label>
            <input
              id="checkout-card-number"
              type="text"
              inputMode="numeric"
              autoComplete="cc-number"
              value={cardNumber}
              onChange={(e) => onCardNumberChange(formatCardNumberInput(e.target.value))}
              placeholder="1234 5678 9012 3456"
              className={inputClass}
            />
            {errors?.cardNumber ? (
              <p className="mt-1 text-xs text-red-500">{errors.cardNumber}</p>
            ) : null}
          </div>
        )}

        <div>
          <label htmlFor="checkout-cvv" className="mb-1.5 block text-sm font-medium text-vantix-fg">
            CVV
          </label>
          <input
            id="checkout-cvv"
            type="tel"
            inputMode="numeric"
            autoComplete="cc-csc"
            maxLength={4}
            value={cvv}
            onChange={(e) => onCvvChange(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="•••"
            className={`${inputClass} tracking-[0.35em] ${requireFullCard ? '' : 'max-w-[10rem]'}`}
          />
          {errors?.cvv ? <p className="mt-1 text-xs text-red-500">{errors.cvv}</p> : null}
        </div>
      </div>
    </div>
  )
}

export function validateCheckoutCreditSecurity(
  cvv: string,
  cardNumber: string,
  requireFullCard: boolean,
): { cvv?: string; cardNumber?: string } {
  const errors: { cvv?: string; cardNumber?: string } = {}
  if (!/^\d{3,4}$/.test(cvv)) errors.cvv = 'נא להזין CVV תקין'
  if (requireFullCard && stripCardNumber(cardNumber).length !== 16) {
    errors.cardNumber = 'נא להזין מספר כרטיס בן 16 ספרות'
  }
  return errors
}

/** שדה CVV בודד לכרטיס שכבר מאומת ב-PayPlus */
export function CheckoutCvvOnlyField({
  cvv,
  onCvvChange,
  error,
}: {
  cvv: string
  onCvvChange: (value: string) => void
  error?: string
}) {
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-vantix-cyan/20 bg-vantix-surface p-4">
      <div className="min-w-[8rem] flex-1">
        <label htmlFor="checkout-cvv-only" className="mb-1.5 block text-sm font-medium text-vantix-fg">
          CVV
        </label>
        <input
          id="checkout-cvv-only"
          type="tel"
          inputMode="numeric"
          autoComplete="cc-csc"
          maxLength={4}
          value={cvv}
          onChange={(e) => onCvvChange(e.target.value.replace(/\D/g, '').slice(0, 4))}
          placeholder="•••"
          className="min-h-[48px] w-full max-w-[10rem] rounded-xl border border-vantix-line/10 bg-vantix-surface-raised px-3 py-2.5 text-base tracking-[0.35em] text-vantix-fg focus:outline-none focus:ring-2 focus:ring-vantix-cyan/40"
        />
        {error ? <p className="mt-1 text-xs text-red-500">{error}</p> : null}
      </div>
      <p className="pb-2.5 text-xs text-vantix-fg-muted">שלוש הספרות מאחורי הכרטיס</p>
    </div>
  )
}

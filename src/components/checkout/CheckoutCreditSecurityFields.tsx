import { formatCardNumberInput, stripCardNumber } from '../../utils/cardNumber'

type CheckoutCreditSecurityFieldsProps = {
  cvv: string
  onCvvChange: (value: string) => void
  cardNumber: string
  onCardNumberChange: (value: string) => void
  requireFullCard: boolean
  errors?: { cvv?: string; cardNumber?: string }
}

/** CVV (ותמיד) + מספר כרטיס מלא בחיוב ראשון — לא נשמרים, רק נשלחים לשרת לחיוב PayPlus */
export function CheckoutCreditSecurityFields({
  cvv,
  onCvvChange,
  cardNumber,
  onCardNumberChange,
  requireFullCard,
  errors,
}: CheckoutCreditSecurityFieldsProps) {
  return (
    <div className="space-y-3 rounded-2xl border border-vantix-cyan/20 bg-vantix-surface p-4">
      <p className="text-xs text-vantix-fg-subtle">
        {requireFullCard
          ? 'לכרטיס זה נדרשת הזנה חד-פעמית של מספר מלא + CVV. לאחר מכן יספיק CVV בלבד.'
          : 'הכרטיס מאומת במערכת. הזינו CVV בלבד — לא נשמר אצלנו.'}
      </p>

      {requireFullCard && (
        <div>
          <label htmlFor="checkout-card-number" className="mb-1 block text-sm font-medium text-vantix-fg">
            מספר כרטיס מלא *
          </label>
          <input
            id="checkout-card-number"
            type="text"
            inputMode="numeric"
            autoComplete="cc-number"
            value={cardNumber}
            onChange={(e) => onCardNumberChange(formatCardNumberInput(e.target.value))}
            placeholder="1234 5678 9012 3456"
            className="w-full rounded-xl border border-vantix-line/10 bg-vantix-surface-raised px-3 py-2.5 text-sm text-vantix-fg focus:outline-none focus:ring-2 focus:ring-vantix-cyan/40"
          />
          {errors?.cardNumber ? (
            <p className="mt-1 text-xs text-red-500">{errors.cardNumber}</p>
          ) : null}
        </div>
      )}

      <div>
        <label htmlFor="checkout-cvv" className="mb-1 block text-sm font-medium text-vantix-fg">
          CVV *
        </label>
        <input
          id="checkout-cvv"
          type="password"
          inputMode="numeric"
          autoComplete="cc-csc"
          maxLength={4}
          value={cvv}
          onChange={(e) => onCvvChange(e.target.value.replace(/\D/g, '').slice(0, 4))}
          placeholder="123"
          className="w-full max-w-[140px] rounded-xl border border-vantix-line/10 bg-vantix-surface-raised px-3 py-2.5 text-sm text-vantix-fg focus:outline-none focus:ring-2 focus:ring-vantix-cyan/40"
        />
        {errors?.cvv ? <p className="mt-1 text-xs text-red-500">{errors.cvv}</p> : null}
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

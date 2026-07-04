import { useState } from 'react'
import { CreditCard } from 'lucide-react'
import { ProfileFormModal, Field, ModalActions } from './ProfileFormModal'
import { CARD_NUMBER_DIGITS, formatCardNumberInput, formatMaskedCardNumber, stripCardNumber } from '../../utils/cardNumber'
import { tokenizeSavedCard } from '../../services/paymentService'
import type { SavedPayment, SavedPaymentInput } from '../../types/customerProfile'

function formatExpiryInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

function parseExpiry(value: string): { month: string; year: string } | null {
  const match = value.match(/^(\d{2})\/(\d{2})$/)
  if (!match) return null
  const month = match[1]
  const year = match[2]
  const monthNum = Number(month)
  if (monthNum < 1 || monthNum > 12) return null
  return { month, year }
}

function isValidIsraeliId(value: string): boolean {
  const digits = value.replace(/\D/g, '')
  return digits.length >= 8 && digits.length <= 9
}

export function SavedPaymentFormModal({
  initial,
  saving,
  onSubmit,
  onClose,
  zIndexClass,
}: {
  initial?: SavedPayment | null
  saving?: boolean
  onSubmit: (data: SavedPaymentInput) => void | Promise<void | string>
  onClose: () => void
  zIndexClass?: string
}) {
  const isEdit = !!initial
  const [label, setLabel] = useState(initial?.label ?? '')
  const [cardNumber, setCardNumber] = useState('')
  const [holderId, setHolderId] = useState(initial?.holderId ?? '')
  const [cvv, setCvv] = useState('')
  const [expiry, setExpiry] = useState(
    initial?.expiryMonth && initial?.expiryYear
      ? `${initial.expiryMonth}/${initial.expiryYear}`
      : ''
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [tokenizing, setTokenizing] = useState(false)

  const submit = async () => {
    const err: Record<string, string> = {}
    const digits = stripCardNumber(cardNumber)
    const parsedExpiry = parseExpiry(expiry)

    if (!isEdit) {
      if (digits.length !== CARD_NUMBER_DIGITS) {
        err.cardNumber = `נא להזין מספר כרטיס בן ${CARD_NUMBER_DIGITS} ספרות`
      }
      if (!cvv.trim() || !/^\d{3,4}$/.test(cvv.trim())) err.cvv = 'נא להזין CVV תקין'
    }
    if (!holderId.trim() || !isValidIsraeliId(holderId)) err.holderId = 'נא להזין ת.ז תקינה'
    if (!parsedExpiry) err.expiry = 'נא להזין תוקף בפורמט MM/YY'

    setErrors(err)
    if (Object.keys(err).length > 0) return

    const last4 = isEdit ? initial?.last4 : digits.slice(-4)
    const paymentInput: SavedPaymentInput = {
      type: 'credit',
      label: label.trim() || undefined,
      last4,
      holderId: holderId.replace(/\D/g, ''),
      expiryMonth: parsedExpiry!.month,
      expiryYear: parsedExpiry!.year,
      isDefault: initial?.isDefault,
    }

    const savedId = await onSubmit(paymentInput)

    if (!isEdit && typeof savedId === 'string' && digits && cvv) {
      setTokenizing(true)
      try {
        await tokenizeSavedCard({
          paymentId: savedId,
          cardNumber: digits,
          cvv: cvv.trim(),
          expiryMonth: parsedExpiry!.month,
          expiryYear: parsedExpiry!.year,
          holderId: holderId.replace(/\D/g, ''),
        })
      } finally {
        setTokenizing(false)
      }
    }
  }

  return (
    <ProfileFormModal
      title={isEdit ? 'עריכת כרטיס אשראי' : 'כרטיס אשראי חדש'}
      icon={<CreditCard className="h-5 w-5 text-vantix-cyan" />}
      onClose={onClose}
      zIndexClass={zIndexClass}
      footer={<ModalActions onCancel={onClose} onSubmit={() => void submit()} saving={saving || tokenizing} />}
    >
      <p className="text-xs text-vantix-fg-subtle">
        נשמרים 4 ספרות אחרונות, ת.ז ותוקף. מספר כרטיס מלא ו-CVV לא נשמרים — נוצר טוקן מאובטח
        ב-PayPlus, ובהזמנה הבאה יספיק להזין CVV בלבד.
      </p>
      <Field label="כינוי" placeholder="לדוגמה: ויזה אישית" value={label} onChange={setLabel} optional />

      {isEdit ? (
        <Field
          label="4 ספרות אחרונות"
          value={initial?.last4 ? formatMaskedCardNumber(initial.last4) : ''}
          onChange={() => {}}
          disabled
        />
      ) : (
        <Field
          label="מספר כרטיס"
          placeholder="1234 5678 9012 3456"
          inputMode="numeric"
          value={cardNumber}
          onChange={(v) => setCardNumber(formatCardNumberInput(v))}
          error={errors.cardNumber}
        />
      )}

      <Field
        label="ת.ז"
        placeholder="123456789"
        inputMode="numeric"
        value={holderId}
        onChange={(v) => setHolderId(v.replace(/\D/g, '').slice(0, 9))}
        error={errors.holderId}
      />

      {!isEdit && (
        <Field
          label="CVV"
          placeholder="123"
          inputMode="numeric"
          type="password"
          value={cvv}
          onChange={(v) => setCvv(v.replace(/\D/g, '').slice(0, 4))}
          error={errors.cvv}
        />
      )}

      <Field
        label="תוקף"
        placeholder="MM/YY"
        inputMode="numeric"
        value={expiry}
        onChange={(v) => setExpiry(formatExpiryInput(v))}
        error={errors.expiry}
      />
    </ProfileFormModal>
  )
}

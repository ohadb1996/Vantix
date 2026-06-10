import { useState } from 'react'
import { CreditCard } from 'lucide-react'
import { ProfileFormModal, Field, ModalActions } from './ProfileFormModal'
import {
  PAYMENT_METHOD_OPTIONS,
  type PaymentMethodType,
  type SavedPayment,
  type SavedPaymentInput,
} from '../../types/customerProfile'

export function SavedPaymentFormModal({
  initial,
  saving,
  onSubmit,
  onClose,
}: {
  initial?: SavedPayment | null
  saving?: boolean
  onSubmit: (data: SavedPaymentInput) => void
  onClose: () => void
}) {
  const [type, setType] = useState<PaymentMethodType>(initial?.type ?? 'cash')
  const [label, setLabel] = useState(initial?.label ?? '')
  const [last4, setLast4] = useState(initial?.last4 ?? '')
  const [error, setError] = useState<string | undefined>()

  const showLast4 = type === 'credit'

  const submit = () => {
    if (showLast4 && last4.trim() && !/^\d{4}$/.test(last4.trim())) {
      setError('יש להזין 4 ספרות')
      return
    }
    onSubmit({
      type,
      label: label.trim() || undefined,
      last4: showLast4 ? last4.trim() || undefined : undefined,
      isDefault: initial?.isDefault,
    })
  }

  return (
    <ProfileFormModal
      title={initial ? 'עריכת אמצעי תשלום' : 'אמצעי תשלום חדש'}
      icon={<CreditCard className="h-5 w-5 text-vantix-cyan" />}
      onClose={onClose}
      footer={<ModalActions onCancel={onClose} onSubmit={submit} saving={saving} />}
    >
      <div>
        <label className="mb-2 block text-sm font-medium text-vantix-fg">סוג אמצעי תשלום *</label>
        <div className="grid grid-cols-2 gap-2">
          {PAYMENT_METHOD_OPTIONS.map((opt) => (
            <button
              key={opt.type}
              type="button"
              onClick={() => setType(opt.type)}
              className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                type === opt.type
                  ? 'border-vantix-cyan bg-vantix-cyan/10 text-vantix-cyan'
                  : 'border-vantix-cyan/20 text-vantix-fg-muted hover:border-vantix-cyan/40'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <Field label="כינוי" placeholder="לדוגמה: ויזה אישית" value={label} onChange={setLabel} optional />
      {showLast4 && (
        <Field
          label="4 ספרות אחרונות"
          placeholder="1234"
          inputMode="numeric"
          value={last4}
          onChange={(v) => setLast4(v.replace(/\D/g, '').slice(0, 4))}
          error={error}
          optional
        />
      )}
    </ProfileFormModal>
  )
}

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { CreditCard, Plus, Trash2, X } from 'lucide-react'
import {
  CHECKOUT_PAYMENT_OPTIONS,
  PAYMENT_METHOD_LABELS,
  type PaymentMethodType,
  type SavedPayment,
} from '../../types/customerProfile'
import { paymentSummary } from '../profile/savedDisplay'
import { SavedPaymentFormModal } from '../profile/SavedPaymentFormModal'
import type { SavedPaymentInput } from '../../types/customerProfile'

type Step = 'methods' | 'cards'

export function PaymentMethodPickerModal({
  cards,
  selectedType,
  selectedCardId,
  saving,
  onClose,
  onSelectMethod,
  onAddCard,
  onUpdateCard,
  onDeleteCard,
  onCardCaptured,
}: {
  cards: SavedPayment[]
  selectedType?: PaymentMethodType
  selectedCardId?: string
  saving?: boolean
  onClose: () => void
  onSelectMethod: (type: PaymentMethodType, card?: SavedPayment) => void
  onAddCard: (data: SavedPaymentInput) => Promise<SavedPayment>
  onUpdateCard: (id: string, data: SavedPaymentInput) => Promise<void>
  onDeleteCard: (id: string) => Promise<void>
  onCardCaptured?: (paymentId: string, secrets: { cardNumber: string; cvv: string }) => void
}) {
  const [step, setStep] = useState<Step>(selectedType === 'credit' ? 'cards' : 'methods')
  const [cardModal, setCardModal] = useState<SavedPayment | null | undefined>(undefined)

  const selectNonCredit = (type: PaymentMethodType) => {
    onSelectMethod(type)
    onClose()
  }

  return (
    <>
      {cardModal === undefined && (
      <div
        className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
        role="dialog"
        aria-modal="true"
        onClick={onClose}
      >
        <div
          className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-vantix-surface-raised shadow-2xl sm:max-w-md sm:rounded-3xl"
          onClick={(e) => e.stopPropagation()}
          dir="rtl"
        >
          <div className="flex items-center justify-between gap-4 border-b border-vantix-cyan/20 px-5 py-4">
            <h3 className="flex items-center gap-2 text-lg font-bold text-vantix-fg">
              <CreditCard className="h-5 w-5 text-vantix-cyan" />
              {step === 'methods' ? 'בחר אמצעי תשלום' : 'בחר כרטיס אשראי'}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-vantix-fg-muted transition hover:bg-vantix-cyan/10 hover:text-vantix-cyan"
              aria-label="סגור"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto px-5 py-5">
            {step === 'methods' ? (
              CHECKOUT_PAYMENT_OPTIONS.map((opt) => (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => {
                    if (opt.type === 'credit') setStep('cards')
                    else selectNonCredit(opt.type)
                  }}
                  className={`flex w-full items-center justify-between rounded-xl border px-4 py-3.5 text-sm font-semibold transition ${
                    selectedType === opt.type
                      ? 'border-vantix-cyan bg-vantix-cyan/10 text-vantix-cyan'
                      : 'border-vantix-cyan/20 text-vantix-fg hover:border-vantix-cyan/40'
                  }`}
                >
                  <span>{opt.label}</span>
                  {opt.type === 'credit' && cards.length > 0 && (
                    <span className="text-xs font-normal text-vantix-fg-muted">{cards.length} שמורים</span>
                  )}
                </button>
              ))
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setStep('methods')}
                  className="mb-2 text-xs font-medium text-vantix-cyan hover:underline"
                >
                  ← חזרה לאמצעי תשלום
                </button>

                {cards.length === 0 ? (
                  <p className="text-sm text-vantix-fg-muted">אין כרטיסים שמורים. הוסף כרטיס חדש.</p>
                ) : (
                  cards.map((card) => (
                    <div
                      key={card.id}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-3 transition ${
                        selectedCardId === card.id
                          ? 'border-vantix-cyan bg-vantix-cyan/10'
                          : 'border-vantix-cyan/20 bg-vantix-surface'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          onSelectMethod('credit', card)
                          onClose()
                        }}
                        className="min-w-0 flex-1 text-right"
                      >
                        <p className="text-sm font-semibold text-vantix-fg">
                          {card.label || PAYMENT_METHOD_LABELS.credit}
                        </p>
                        <p className="text-xs text-vantix-fg-muted">{paymentSummary(card)}</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('למחוק את הכרטיס מהרשימה?')) void onDeleteCard(card.id)
                        }}
                        className="rounded-lg p-2 text-vantix-fg-muted transition hover:bg-red-500/10 hover:text-red-400"
                        aria-label="מחק כרטיס"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                )}

                <button
                  type="button"
                  onClick={() => setCardModal(null)}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-vantix-cyan/30 py-3 text-sm font-semibold text-vantix-cyan transition hover:bg-vantix-cyan/5"
                >
                  <Plus className="h-4 w-4" />
                  כרטיס חדש
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      )}

      {cardModal !== undefined &&
        createPortal(
        <SavedPaymentFormModal
          initial={cardModal}
          saving={saving}
          zIndexClass="z-[80]"
          onClose={() => setCardModal(undefined)}
          onSubmit={async (data, capturedSecrets) => {
            try {
              if (cardModal) {
                await onUpdateCard(cardModal.id, data)
                onSelectMethod('credit', { ...cardModal, ...data })
                setCardModal(undefined)
                onClose()
                return
              }
              const created = await onAddCard(data)
              onSelectMethod('credit', created)
              if (capturedSecrets) onCardCaptured?.(created.id, capturedSecrets)
              setCardModal(undefined)
              onClose()
              return created.id
            } catch {
              // השגיאה מוצגת דרך מצב saving / נשארים במודל לתיקון
            }
          }}
        />,
        document.body
      )}
    </>
  )
}

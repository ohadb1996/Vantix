import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ShieldCheck } from 'lucide-react'
import {
  CheckoutCreditSecurityFields,
  validateCheckoutCreditSecurity,
} from './CheckoutCreditSecurityFields'

type CheckoutCardAuthModalProps = {
  open: boolean
  onClose: () => void
  cvv: string
  onCvvChange: (value: string) => void
  cardNumber: string
  onCardNumberChange: (value: string) => void
  requireFullCard: boolean
  errors?: { cvv?: string; cardNumber?: string }
  placing?: boolean
  onConfirm: () => void
}

/** אימות כרטיס חד-פעמי — נפתח רק כשצריך, לא לפני שליחת ההזמנה */
export function CheckoutCardAuthModal({
  open,
  onClose,
  cvv,
  onCvvChange,
  cardNumber,
  onCardNumberChange,
  requireFullCard,
  errors,
  placing = false,
  onConfirm,
}: CheckoutCardAuthModalProps) {
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="card-auth-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="card-auth-title"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            className="w-full max-h-[90vh] overflow-y-auto rounded-t-3xl bg-vantix-surface-raised p-6 shadow-xl sm:max-w-md sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-vantix-cyan/12 text-vantix-cyan">
                  <ShieldCheck className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <h3 id="card-auth-title" className="text-lg font-bold text-vantix-fg">
                    אימות חד-פעמי לכרטיס
                  </h3>
                  <p className="mt-1 text-sm text-vantix-fg-muted">
                    פעם אחת בלבד — ואז ההזמנות הבאות יעברו בלחיצה, בלי להקליד שוב את המספר.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-2 text-vantix-fg-muted hover:bg-vantix-cyan/10 hover:text-vantix-cyan"
                aria-label="סגור"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <CheckoutCreditSecurityFields
              cvv={cvv}
              onCvvChange={onCvvChange}
              cardNumber={cardNumber}
              onCardNumberChange={onCardNumberChange}
              requireFullCard={requireFullCard}
              errors={errors}
              compact
            />

            <button
              type="button"
              onClick={onConfirm}
              disabled={placing}
              className="mt-5 w-full rounded-xl bg-vantix-orange py-3.5 font-semibold text-white hover:brightness-110 disabled:opacity-60 dark:bg-vantix-cyan dark:text-black"
            >
              {placing ? 'מעבד תשלום...' : 'אשר ושלח הזמנה'}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

export { validateCheckoutCreditSecurity }

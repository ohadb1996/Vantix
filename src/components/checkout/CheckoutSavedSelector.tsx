import { useEffect, useRef, useState } from 'react'
import { MapPin, User, CreditCard, Plus, Pencil, Check } from 'lucide-react'
import {
  useSavedAddresses,
  useSavedContacts,
  useSavedPayments,
} from '../../hooks/useCustomerProfile'
import { SavedAddressFormModal } from '../profile/SavedAddressFormModal'
import { SavedContactFormModal } from '../profile/SavedContactFormModal'
import { SavedPaymentFormModal } from '../profile/SavedPaymentFormModal'
import {
  addressTitle,
  addressSummary,
  contactTitle,
  contactSummary,
  paymentTitle,
  paymentSummary,
} from '../profile/savedDisplay'
import type {
  SavedAddress,
  SavedContact,
  SavedPayment,
} from '../../types/customerProfile'

type SelectorProps = {
  selectedContactId?: string
  selectedAddressId?: string
  selectedPaymentId?: string
  onSelectContact: (c: SavedContact) => void
  onSelectAddress: (a: SavedAddress) => void
  onSelectPayment: (p: SavedPayment) => void
  /** הסתרת בלוק הכתובות (באיסוף עצמי אין צורך בכתובת) */
  hideAddress?: boolean
}

function PickerCard({
  title,
  summary,
  selected,
  onSelect,
  onEdit,
}: {
  title: string
  summary: string
  selected: boolean
  onSelect: () => void
  onEdit: () => void
}) {
  return (
    <div
      className={`relative w-44 shrink-0 cursor-pointer rounded-2xl border p-3 text-right transition ${
        selected
          ? 'border-vantix-cyan bg-vantix-cyan/10 shadow-[0_0_0_1px_rgb(var(--vantix-cyan)/0.4)]'
          : 'border-vantix-cyan/20 bg-vantix-surface hover:border-vantix-cyan/40'
      }`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect()
        }
      }}
    >
      {selected && (
        <span className="absolute left-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-vantix-cyan text-black">
          <Check className="h-3.5 w-3.5" />
        </span>
      )}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onEdit()
        }}
        className="absolute right-2 top-2 rounded-lg p-1 text-vantix-fg-muted transition hover:bg-vantix-cyan/10 hover:text-vantix-cyan"
        aria-label="עריכה"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
      <p className="mt-5 truncate text-sm font-semibold text-vantix-fg">{title}</p>
      <p className="mt-0.5 line-clamp-2 text-xs text-vantix-fg-muted">{summary}</p>
    </div>
  )
}

function BlockHeader({
  icon,
  label,
  onAdd,
}: {
  icon: React.ReactNode
  label: string
  onAdd: () => void
}) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <span className="flex items-center gap-1.5 text-sm font-semibold text-vantix-fg">
        {icon}
        {label}
      </span>
      <button
        type="button"
        onClick={onAdd}
        className="flex items-center gap-1 rounded-full border border-vantix-cyan/30 bg-vantix-cyan/5 px-2.5 py-1 text-xs font-semibold text-vantix-cyan transition hover:bg-vantix-cyan/10"
      >
        <Plus className="h-3.5 w-3.5" />
        חדש
      </button>
    </div>
  )
}

const scrollRow = 'flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]'

export function CheckoutSavedSelector({
  selectedContactId,
  selectedAddressId,
  selectedPaymentId,
  onSelectContact,
  onSelectAddress,
  onSelectPayment,
  hideAddress = false,
}: SelectorProps) {
  const contacts = useSavedContacts()
  const addresses = useSavedAddresses()
  const payments = useSavedPayments()

  const [contactModal, setContactModal] = useState<SavedContact | null | undefined>(undefined)
  const [addressModal, setAddressModal] = useState<SavedAddress | null | undefined>(undefined)
  const [paymentModal, setPaymentModal] = useState<SavedPayment | null | undefined>(undefined)

  // החלת ברירות מחדל פעם אחת כשהרשימות נטענות (צ'קאאוט מהיר)
  const applied = useRef({ c: false, a: false, p: false })
  useEffect(() => {
    if (!applied.current.c && !selectedContactId && contacts.items.length) {
      applied.current.c = true
      onSelectContact(contacts.items.find((i) => i.isDefault) ?? contacts.items[0])
    }
    if (!hideAddress && !applied.current.a && !selectedAddressId && addresses.items.length) {
      applied.current.a = true
      onSelectAddress(addresses.items.find((i) => i.isDefault) ?? addresses.items[0])
    }
    if (!applied.current.p && !selectedPaymentId && payments.items.length) {
      applied.current.p = true
      onSelectPayment(payments.items.find((i) => i.isDefault) ?? payments.items[0])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contacts.items, addresses.items, payments.items])

  const hasAny = contacts.items.length || addresses.items.length || payments.items.length

  if (!contacts.canSave) return null

  return (
    <div className="mb-5 space-y-4 rounded-2xl border border-vantix-cyan/20 bg-vantix-surface p-4">
      <p className="text-sm font-semibold text-vantix-fg">
        {hasAny ? 'בחר מהפרטים השמורים שלך' : 'שמור פרטים לבחירה מהירה בפעם הבאה'}
      </p>

      {/* פרטים אישיים */}
      <div>
        <BlockHeader
          icon={<User className="h-4 w-4 text-vantix-cyan" />}
          label="פרטים אישיים"
          onAdd={() => setContactModal(null)}
        />
        {contacts.items.length === 0 ? (
          <p className="text-xs text-vantix-fg-subtle">אין פרטים שמורים</p>
        ) : (
          <div className={scrollRow}>
            {contacts.items.map((c) => (
              <PickerCard
                key={c.id}
                title={contactTitle(c)}
                summary={contactSummary(c)}
                selected={selectedContactId === c.id}
                onSelect={() => onSelectContact(c)}
                onEdit={() => setContactModal(c)}
              />
            ))}
          </div>
        )}
      </div>

      {/* כתובות – מוסתר באיסוף עצמי */}
      {!hideAddress && (
        <div>
          <BlockHeader
            icon={<MapPin className="h-4 w-4 text-vantix-cyan" />}
            label="כתובות"
            onAdd={() => setAddressModal(null)}
          />
          {addresses.items.length === 0 ? (
            <p className="text-xs text-vantix-fg-subtle">אין כתובות שמורות</p>
          ) : (
            <div className={scrollRow}>
              {addresses.items.map((a) => (
                <PickerCard
                  key={a.id}
                  title={addressTitle(a)}
                  summary={addressSummary(a)}
                  selected={selectedAddressId === a.id}
                  onSelect={() => onSelectAddress(a)}
                  onEdit={() => setAddressModal(a)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* אמצעי תשלום */}
      <div>
        <BlockHeader
          icon={<CreditCard className="h-4 w-4 text-vantix-cyan" />}
          label="אמצעי תשלום"
          onAdd={() => setPaymentModal(null)}
        />
        {payments.items.length === 0 ? (
          <p className="text-xs text-vantix-fg-subtle">אין אמצעי תשלום שמורים</p>
        ) : (
          <div className={scrollRow}>
            {payments.items.map((p) => (
              <PickerCard
                key={p.id}
                title={paymentTitle(p)}
                summary={paymentSummary(p)}
                selected={selectedPaymentId === p.id}
                onSelect={() => onSelectPayment(p)}
                onEdit={() => setPaymentModal(p)}
              />
            ))}
          </div>
        )}
      </div>

      {contactModal !== undefined && (
        <SavedContactFormModal
          initial={contactModal}
          saving={contacts.isSaving}
          onClose={() => setContactModal(undefined)}
          onSubmit={async (data) => {
            if (contactModal) {
              await contacts.update(contactModal.id, data)
              onSelectContact({ ...contactModal, ...data })
            } else {
              const id = await contacts.add(data)
              onSelectContact({ id, ...data })
            }
            setContactModal(undefined)
          }}
        />
      )}

      {addressModal !== undefined && (
        <SavedAddressFormModal
          initial={addressModal}
          saving={addresses.isSaving}
          onClose={() => setAddressModal(undefined)}
          onSubmit={async (data) => {
            if (addressModal) {
              await addresses.update(addressModal.id, data)
              onSelectAddress({ ...addressModal, ...data })
            } else {
              const id = await addresses.add(data)
              onSelectAddress({ id, ...data })
            }
            setAddressModal(undefined)
          }}
        />
      )}

      {paymentModal !== undefined && (
        <SavedPaymentFormModal
          initial={paymentModal}
          saving={payments.isSaving}
          onClose={() => setPaymentModal(undefined)}
          onSubmit={async (data) => {
            if (paymentModal) {
              await payments.update(paymentModal.id, data)
              onSelectPayment({ ...paymentModal, ...data })
            } else {
              const id = await payments.add(data)
              onSelectPayment({ id, ...data })
            }
            setPaymentModal(undefined)
          }}
        />
      )}
    </div>
  )
}

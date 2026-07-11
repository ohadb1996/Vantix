import { useState, type ReactNode } from 'react'
import { MapPin, User, CreditCard, Plus, Pencil, Trash2, Star, Loader2, ChevronDown } from 'lucide-react'
import {
  useSavedAddresses,
  useSavedContacts,
  useSavedPayments,
} from '../../hooks/useCustomerProfile'
import { SavedAddressFormModal } from './SavedAddressFormModal'
import { SavedContactFormModal } from './SavedContactFormModal'
import { SavedPaymentFormModal } from './SavedPaymentFormModal'
import { WalletBalanceRow } from '../wallet/WalletBalanceRow'
import {
  addressTitle,
  addressSummary,
  contactTitle,
  contactSummary,
  paymentTitle,
  paymentSummary,
} from './savedDisplay'
import type { SavedAddress, SavedContact, SavedPayment } from '../../types/customerProfile'
import { haptic } from '../../lib/native'

const cardClass =
  'rounded-2xl border border-vantix-cyan/20 bg-vantix-surface-raised p-5 shadow-sm'

function SubsectionHeader({
  title,
  icon,
  onAdd,
  addLabel,
}: {
  title: string
  icon: ReactNode
  onAdd: () => void
  addLabel: string
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-vantix-fg">
        {icon}
        {title}
      </h3>
      <button
        type="button"
        onClick={onAdd}
        className="flex items-center gap-1 rounded-full border border-vantix-cyan/30 bg-vantix-cyan/5 px-3 py-1.5 text-sm font-semibold text-vantix-cyan transition hover:bg-vantix-cyan/10"
      >
        <Plus className="h-4 w-4" />
        {addLabel}
      </button>
    </div>
  )
}

function SectionShell({
  title,
  icon,
  onAdd,
  addLabel,
  children,
}: {
  title: string
  icon: ReactNode
  onAdd: () => void
  addLabel: string
  children: ReactNode
}) {
  return (
    <section className={cardClass}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-semibold text-vantix-fg">
          {icon}
          {title}
        </h2>
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center gap-1 rounded-full border border-vantix-cyan/30 bg-vantix-cyan/5 px-3 py-1.5 text-sm font-semibold text-vantix-cyan transition hover:bg-vantix-cyan/10"
        >
          <Plus className="h-4 w-4" />
          {addLabel}
        </button>
      </div>
      {children}
    </section>
  )
}

function SavedCard({
  title,
  summary,
  isDefault,
  onEdit,
  onDelete,
  onSetDefault,
}: {
  title: string
  summary: string
  isDefault?: boolean
  onEdit: () => void
  onDelete: () => void
  onSetDefault: () => void
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-vantix-cyan/15 bg-vantix-surface p-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-semibold text-vantix-fg">{title}</p>
          {isDefault && (
            <span className="flex items-center gap-1 rounded-full bg-vantix-cyan/10 px-2 py-0.5 text-[10px] font-bold text-vantix-cyan">
              <Star className="h-3 w-3 fill-vantix-cyan" />
              ברירת מחדל
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-sm text-vantix-fg-muted">{summary}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {!isDefault && (
          <button
            type="button"
            onClick={onSetDefault}
            className="rounded-lg p-2 text-vantix-fg-muted transition hover:bg-vantix-cyan/10 hover:text-vantix-cyan"
            aria-label="הגדר כברירת מחדל"
            title="הגדר כברירת מחדל"
          >
            <Star className="h-4 w-4" />
          </button>
        )}
        <button
          type="button"
          onClick={onEdit}
          className="rounded-lg p-2 text-vantix-fg-muted transition hover:bg-vantix-cyan/10 hover:text-vantix-cyan"
          aria-label="עריכה"
          title="עריכה"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-lg p-2 text-vantix-fg-muted transition hover:bg-red-500/10 hover:text-red-500"
          aria-label="מחיקה"
          title="מחיקה"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return <p className="py-4 text-center text-sm text-vantix-fg-subtle">{text}</p>
}

function Loading() {
  return (
    <div className="flex items-center justify-center gap-2 py-4 text-vantix-fg-muted">
      <Loader2 className="h-5 w-5 animate-spin" /> טוען...
    </div>
  )
}

export function AddressesSection({ embedded = false }: { embedded?: boolean }) {
  const { items, isLoading, add, update, remove, setDefault, isSaving } = useSavedAddresses()
  const [editing, setEditing] = useState<SavedAddress | null | undefined>(undefined)

  const content = (
    <>
      {embedded ? (
        <SubsectionHeader
          title="הכתובות שלי"
          icon={<MapPin className="h-4 w-4 text-vantix-cyan" />}
          addLabel="הוסף"
          onAdd={() => setEditing(null)}
        />
      ) : null}
      {isLoading ? (
        <Loading />
      ) : items.length === 0 ? (
        <EmptyState text="אין כתובות שמורות. הוסף כתובת לבחירה מהירה בהזמנה." />
      ) : (
        <div className="space-y-2">
          {items.map((a) => (
            <SavedCard
              key={a.id}
              title={addressTitle(a)}
              summary={addressSummary(a)}
              isDefault={a.isDefault}
              onEdit={() => setEditing(a)}
              onDelete={() => {
                if (confirm('למחוק את הכתובת?')) void remove(a.id)
              }}
              onSetDefault={() => void setDefault(a.id)}
            />
          ))}
        </div>
      )}

      {editing !== undefined && (
        <SavedAddressFormModal
          key={editing?.id ?? 'new'}
          initial={editing}
          saving={isSaving}
          onClose={() => setEditing(undefined)}
          onSubmit={async (data) => {
            if (editing) await update(editing.id, data)
            else await add(data)
            void haptic.success()
            setEditing(undefined)
          }}
        />
      )}
    </>
  )

  if (embedded) {
    return <div className="space-y-3">{content}</div>
  }

  return (
    <SectionShell
      title="הכתובות שלי"
      icon={<MapPin className="h-5 w-5 text-vantix-cyan" />}
      addLabel="הוסף"
      onAdd={() => setEditing(null)}
    >
      {content}
    </SectionShell>
  )
}

export function ContactsSection({ embedded = false }: { embedded?: boolean }) {
  const { items, isLoading, add, update, remove, setDefault, isSaving } = useSavedContacts()
  const [editing, setEditing] = useState<SavedContact | null | undefined>(undefined)

  const content = (
    <>
      {embedded ? (
        <SubsectionHeader
          title="פרטי קשר"
          icon={<User className="h-4 w-4 text-vantix-cyan" />}
          addLabel="הוסף"
          onAdd={() => setEditing(null)}
        />
      ) : null}
      {isLoading ? (
        <Loading />
      ) : items.length === 0 ? (
        <EmptyState text="אין פרטי קשר שמורים. הוסף שם וטלפון לבחירה מהירה בהזמנה." />
      ) : (
        <div className="space-y-2">
          {items.map((c) => (
            <SavedCard
              key={c.id}
              title={contactTitle(c)}
              summary={contactSummary(c)}
              isDefault={c.isDefault}
              onEdit={() => setEditing(c)}
              onDelete={() => {
                if (confirm('למחוק את פרטי הקשר?')) void remove(c.id)
              }}
              onSetDefault={() => void setDefault(c.id)}
            />
          ))}
        </div>
      )}

      {editing !== undefined && (
        <SavedContactFormModal
          initial={editing}
          saving={isSaving}
          onClose={() => setEditing(undefined)}
          onSubmit={async (data) => {
            if (editing) await update(editing.id, data)
            else await add(data)
            void haptic.success()
            setEditing(undefined)
          }}
        />
      )}
    </>
  )

  if (embedded) {
    return <div className="space-y-3">{content}</div>
  }

  return (
    <SectionShell
      title="פרטים אישיים"
      icon={<User className="h-5 w-5 text-vantix-cyan" />}
      addLabel="הוסף"
      onAdd={() => setEditing(null)}
    >
      {content}
    </SectionShell>
  )
}

export function PaymentsSection() {
  const { items, isLoading, add, update, remove, setDefault, isSaving } = useSavedPayments()
  const [editing, setEditing] = useState<SavedPayment | null | undefined>(undefined)

  return (
    <section id="payments" className={cardClass}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-semibold text-vantix-fg">
          <CreditCard className="h-5 w-5 text-vantix-cyan" />
          אמצעי תשלום
        </h2>
        <button
          type="button"
          onClick={() => setEditing(null)}
          className="flex items-center gap-1 rounded-full border border-vantix-cyan/30 bg-vantix-cyan/5 px-3 py-1.5 text-sm font-semibold text-vantix-cyan transition hover:bg-vantix-cyan/10"
        >
          <Plus className="h-4 w-4" />
          הוסף
        </button>
      </div>

      <WalletBalanceRow />

      {isLoading ? (
        <Loading />
      ) : items.length === 0 ? (
        <EmptyState text="אין אמצעי תשלום שמורים. הוסף אמצעי תשלום לבחירה מהירה בהזמנה." />
      ) : (
        <div className="space-y-2">
          {items.map((p) => (
            <SavedCard
              key={p.id}
              title={paymentTitle(p)}
              summary={paymentSummary(p)}
              isDefault={p.isDefault}
              onEdit={() => setEditing(p)}
              onDelete={() => {
                if (confirm('למחוק את כרטיס האשראי?')) void remove(p.id)
              }}
              onSetDefault={() => void setDefault(p.id)}
            />
          ))}
        </div>
      )}

      {editing !== undefined && (
        <SavedPaymentFormModal
          initial={editing}
          saving={isSaving}
          onClose={() => setEditing(undefined)}
          onSubmit={async (data) => {
            if (editing) {
              await update(editing.id, data)
              void haptic.success()
              setEditing(undefined)
              return
            }
            const id = await add(data)
            void haptic.success()
            setEditing(undefined)
            return id
          }}
        />
      )}
    </section>
  )
}

export function PersonalDetailsSection({
  displayName,
  email,
  phone,
}: {
  displayName: string
  email: string
  phone: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <section className={cardClass}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 text-right"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 font-semibold text-vantix-fg">
          <User className="h-5 w-5 text-vantix-cyan" />
          עריכת פרטים אישיים
        </span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-vantix-fg-muted transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open ? (
        <div className="mt-4 space-y-5 border-t border-vantix-cyan/15 pt-4">
          <div>
            <h3 className="mb-3 text-sm font-semibold text-vantix-fg">החשבון שלי</h3>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-vantix-fg-subtle">שם</dt>
                <dd className="font-medium text-vantix-fg">{displayName || '—'}</dd>
              </div>
              <div>
                <dt className="text-vantix-fg-subtle">אימייל</dt>
                <dd className="font-medium text-vantix-fg">{email || '—'}</dd>
              </div>
              {phone ? (
                <div>
                  <dt className="text-vantix-fg-subtle">טלפון</dt>
                  <dd className="font-medium text-vantix-fg">{phone}</dd>
                </div>
              ) : null}
            </dl>
          </div>

          <ContactsSection embedded />
          <AddressesSection embedded />
        </div>
      ) : null}
    </section>
  )
}

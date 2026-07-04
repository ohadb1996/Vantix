import type { ReactNode } from 'react'
import { X } from 'lucide-react'

export function ProfileFormModal({
  title,
  icon,
  onClose,
  children,
  footer,
  zIndexClass = 'z-[60]',
}: {
  title: string
  icon?: ReactNode
  onClose: () => void
  children: ReactNode
  footer: ReactNode
  zIndexClass?: string
}) {
  return (
    <div
      className={`fixed inset-0 ${zIndexClass} flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4`}
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
            {icon}
            {title}
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
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">{children}</div>
        <div className="flex gap-3 border-t border-vantix-cyan/20 px-5 py-4">{footer}</div>
      </div>
    </div>
  )
}

export function Field({
  label,
  value,
  onChange,
  error,
  placeholder,
  type = 'text',
  inputMode,
  optional,
  disabled,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  error?: string
  placeholder?: string
  type?: string
  inputMode?: 'text' | 'numeric' | 'tel'
  optional?: boolean
  disabled?: boolean
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-vantix-fg">
        {label}
        {optional ? <span className="text-vantix-fg-subtle"> (אופציונלי)</span> : ' *'}
      </label>
      <input
        type={type}
        inputMode={inputMode}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full rounded-xl border bg-vantix-surface px-3 py-2.5 text-vantix-fg outline-none transition placeholder:text-vantix-fg-subtle focus:ring-2 focus:ring-vantix-cyan/20 disabled:opacity-60 ${
          error ? 'border-red-400' : 'border-vantix-cyan/25 focus:border-vantix-cyan/50'
        }`}
        aria-invalid={!!error}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  )
}

/** כפתורי פעולה אחידים למודלים */
export function ModalActions({
  onCancel,
  onSubmit,
  saving,
  submitLabel = 'שמירה',
}: {
  onCancel: () => void
  onSubmit: () => void
  saving?: boolean
  submitLabel?: string
}) {
  return (
    <>
      <button
        type="button"
        onClick={onCancel}
        disabled={saving}
        className="flex-1 rounded-xl border border-vantix-cyan/25 py-3 font-medium text-vantix-fg transition hover:bg-vantix-cyan/5 disabled:opacity-50"
      >
        ביטול
      </button>
      <button
        type="button"
        onClick={onSubmit}
        disabled={saving}
        className="flex-1 rounded-xl bg-vantix-cyan py-3 font-semibold text-black transition hover:brightness-110 disabled:opacity-60"
      >
        {saving ? 'שומר...' : submitLabel}
      </button>
    </>
  )
}

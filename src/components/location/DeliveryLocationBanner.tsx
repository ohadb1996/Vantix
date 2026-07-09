import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Loader2, MapPin } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useAuthSheet } from '../../context/AuthSheetContext'
import { ROUTES } from '../../constants/app'
import { buildDestinationAddress } from '../../services/deliveryQuoteService'
import { getQuoteLocationLabel, type QuoteLocationChoice } from '../../hooks/useQuoteLocation'
import type { SavedAddress } from '../../types/customerProfile'

function LocationOption({
  selected,
  title,
  subtitle,
  onSelect,
}: {
  selected: boolean
  title: string
  subtitle?: string
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-right transition ${
        selected
          ? 'border-vantix-cyan/50 bg-vantix-cyan/10'
          : 'border-transparent bg-vantix-overlay/5 hover:border-vantix-cyan/20 hover:bg-vantix-overlay/10'
      }`}
    >
      <span
        className={`mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
          selected ? 'border-vantix-cyan bg-vantix-cyan' : 'border-vantix-fg-subtle'
        }`}
        aria-hidden
      >
        {selected ? <span className="h-1.5 w-1.5 rounded-full bg-black" /> : null}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-vantix-fg">{title}</span>
        {subtitle ? (
          <span className="mt-0.5 block truncate text-xs text-vantix-fg-muted">{subtitle}</span>
        ) : null}
      </span>
    </button>
  )
}

export function DeliveryLocationBanner({
  choice,
  onChoiceChange,
  savedAddresses,
  isResolving,
  geoUnavailable,
}: {
  choice: QuoteLocationChoice | null
  onChoiceChange: (choice: QuoteLocationChoice) => void
  savedAddresses: SavedAddress[]
  isResolving: boolean
  geoUnavailable: boolean
}) {
  const { user, loading: authLoading } = useAuth()
  const { openAuthSheet } = useAuthSheet()
  const [open, setOpen] = useState(false)

  if (authLoading) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-vantix-cyan/20 bg-vantix-surface-raised px-4 py-4 shadow-sm">
        <Loader2 className="h-5 w-5 animate-spin text-vantix-cyan" />
        <span className="text-sm text-vantix-fg-muted">טוען מיקום...</span>
      </div>
    )
  }

  if (!user) {
    return (
      <button
        type="button"
        onClick={() => openAuthSheet('login', ROUTES.RESTAURANTS)}
        className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-vantix-cyan/20 bg-vantix-surface-raised px-4 py-4 text-right shadow-sm transition hover:border-vantix-cyan/40 hover:shadow-md"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-vantix-cyan/10">
            <MapPin className="h-5 w-5 text-vantix-cyan" />
          </span>
          <div className="text-right">
            <p className="text-sm text-vantix-fg-muted">המיקום שלי</p>
            <p className="font-semibold text-vantix-fg">התחברו לבחירת מיקום משלוח</p>
          </div>
        </div>
      </button>
    )
  }

  const currentSubtitle = isResolving
    ? 'מאתר מיקום נוכחי...'
    : geoUnavailable
      ? 'לא זמין – בדקו הרשאת מיקום או בחרו כתובת שמורה'
      : 'לפי GPS במכשיר'

  const selectedLabel = getQuoteLocationLabel(choice, savedAddresses, {
    isResolving,
    geoUnavailable,
  })

  const handleSelect = (next: QuoteLocationChoice) => {
    onChoiceChange(next)
    setOpen(false)
  }

  return (
    <div className="rounded-2xl border border-vantix-cyan/20 bg-vantix-surface-raised px-4 py-4 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 text-right"
        aria-expanded={open}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-vantix-cyan/10">
            <MapPin className="h-5 w-5 text-vantix-cyan" />
          </span>
          <div className="min-w-0 text-right">
            <p className="text-sm text-vantix-fg-muted">המיקום שלי</p>
            <p className="truncate text-sm font-semibold text-vantix-fg">{selectedLabel}</p>
          </div>
        </div>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-vantix-fg-subtle transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-1.5 border-t border-vantix-line/10 pt-3">
              <LocationOption
                selected={choice?.kind === 'current'}
                title="מיקום נוכחי"
                subtitle={currentSubtitle}
                onSelect={() => handleSelect({ kind: 'current' })}
              />

              {savedAddresses.map((address) => (
                <LocationOption
                  key={address.id}
                  selected={choice?.kind === 'saved' && choice.addressId === address.id}
                  title={address.label?.trim() || 'כתובת שמורה'}
                  subtitle={buildDestinationAddress(address)}
                  onSelect={() => handleSelect({ kind: 'saved', addressId: address.id })}
                />
              ))}

              {geoUnavailable ? (
                <p className="px-1 pt-1 text-xs text-vantix-fg-muted">
                  לא הצלחנו לאתר מיקום. אפשרו גישה למיקום בהגדרות המכשיר ולחצו שוב על &quot;מיקום נוכחי&quot;.
                </p>
              ) : null}

              {savedAddresses.length === 0 ? (
                <p className="px-1 pt-1 text-xs text-vantix-fg-muted">
                  אין כתובות שמורות.{' '}
                  <Link to={ROUTES.PROFILE} className="font-medium text-vantix-cyan hover:underline">
                    הוסיפו כתובת בפרופיל
                  </Link>
                </p>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

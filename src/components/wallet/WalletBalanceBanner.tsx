import { Link } from 'react-router-dom'
import { ChevronLeft, Loader2, Wallet } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useAuthSheet } from '../../context/AuthSheetContext'
import { useWalletBalance } from '../../hooks/useWalletBalance'
import { ROUTES } from '../../constants/app'
import { formatShekel } from '../../utils/currency'

export function WalletBalanceBanner() {
  const { user, loading: authLoading } = useAuth()
  const { openAuthSheet } = useAuthSheet()
  const { data: balance, isLoading: balanceLoading } = useWalletBalance()

  if (authLoading) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-vantix-cyan/20 bg-vantix-surface-raised px-4 py-4 shadow-sm">
        <Loader2 className="h-5 w-5 animate-spin text-vantix-cyan" />
        <span className="text-sm text-vantix-fg-muted">טוען ארנק...</span>
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
            <Wallet className="h-5 w-5 text-vantix-cyan" />
          </span>
          <div className="text-right">
            <p className="text-sm text-vantix-fg-muted">הארנק שלי</p>
            <p className="font-semibold text-vantix-fg">התחברו לצפייה ביתרה</p>
          </div>
        </div>
        <ChevronLeft className="h-5 w-5 rotate-180 text-vantix-fg-subtle transition group-hover:text-vantix-cyan" />
      </button>
    )
  }

  const displayBalance = balanceLoading ? null : formatShekel(balance ?? 0)

  return (
    <Link
      to={`${ROUTES.PROFILE}#payments`}
      className="group flex items-center justify-between gap-3 rounded-2xl border border-vantix-cyan/20 bg-vantix-surface-raised px-4 py-4 shadow-sm transition hover:border-vantix-cyan/40 hover:shadow-md"
      aria-label="מעבר לארנק ואמצעי תשלום בפרופיל"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-vantix-cyan/10">
          <Wallet className="h-5 w-5 text-vantix-cyan" />
        </span>
        <div className="text-right">
          <p className="text-sm text-vantix-fg-muted">יתרה בארנק</p>
          {displayBalance ? (
            <p className="font-display text-2xl font-bold text-vantix-fg sm:text-3xl">{displayBalance}</p>
          ) : (
            <div className="flex items-center gap-2 pt-1">
              <Loader2 className="h-4 w-4 animate-spin text-vantix-cyan" />
              <span className="text-sm text-vantix-fg-muted">טוען יתרה...</span>
            </div>
          )}
        </div>
      </div>
      <ChevronLeft className="h-5 w-5 rotate-180 text-vantix-fg-subtle transition group-hover:text-vantix-cyan" />
    </Link>
  )
}

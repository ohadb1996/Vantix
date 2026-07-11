import { Loader2, Wallet } from 'lucide-react'
import { useWalletSummary } from '../../hooks/useWalletBalance'
import { AnimatedWalletBalance } from './AnimatedWalletBalance'
import { formatShekel } from '../../utils/currency'
import { formatWalletExpiryLabel } from '../../services/walletService'

export function WalletBalanceRow() {
  const { data: summary, isLoading } = useWalletSummary()
  const expiryLabel = formatWalletExpiryLabel(summary?.nearestExpiryAt)

  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-vantix-cyan/15 bg-vantix-surface p-3.5">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-vantix-cyan/10">
          <Wallet className="h-5 w-5 text-vantix-cyan" />
        </span>
        <div className="text-right">
          <p className="text-sm text-vantix-fg-muted">יתרה בארנק</p>
          {isLoading ? (
            <div className="flex items-center gap-2 pt-0.5">
              <Loader2 className="h-4 w-4 animate-spin text-vantix-cyan" />
              <span className="text-sm text-vantix-fg-muted">טוען...</span>
            </div>
          ) : (
            <>
              <p className="font-display text-xl font-bold text-vantix-fg">
                <AnimatedWalletBalance balance={summary?.balance ?? 0} isReady={!isLoading} />
              </p>
              {expiryLabel && (summary?.nearestExpiryAmount ?? 0) > 0 ? (
                <p className="text-[11px] text-vantix-fg-subtle">
                  {formatShekel(summary!.nearestExpiryAmount!)} {expiryLabel}
                </p>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

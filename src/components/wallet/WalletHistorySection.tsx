import { Loader2, Wallet, ArrowDownLeft, ArrowUpRight, Clock } from 'lucide-react'
import { useWalletSummary, useWalletTransactions } from '../../hooks/useWalletBalance'
import { AnimatedWalletBalance } from './AnimatedWalletBalance'
import { formatShekel } from '../../utils/currency'
import {
  formatWalletExpiryLabel,
  walletTransactionTypeLabel,
} from '../../services/walletService'
import { WALLET_EXPIRY_DAYS } from '../../constants/wallet'

const cardClass =
  'rounded-2xl border border-vantix-cyan/20 bg-vantix-surface-raised p-5 shadow-sm'

function formatTxDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('he-IL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export function WalletHistorySection() {
  const { data: summary, isLoading: summaryLoading } = useWalletSummary()
  const { data: transactions = [], isLoading: txLoading } = useWalletTransactions(50)

  const nearestExpiryLabel = formatWalletExpiryLabel(summary?.nearestExpiryAt)

  return (
    <section id="wallet" className={cardClass}>
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-xl bg-vantix-cyan/10 p-2.5">
          <Wallet className="h-5 w-5 text-vantix-cyan" />
        </div>
        <div>
          <h2 className="font-semibold text-vantix-fg">הארנק שלי</h2>
          <p className="text-sm text-vantix-fg-muted">
            קאשבק וזיכויים לשימוש בהזמנות הבאות · תוקף {WALLET_EXPIRY_DAYS} יום
          </p>
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-vantix-cyan/20 bg-vantix-cyan/5 p-4">
        <p className="text-sm text-vantix-fg-muted">יתרה זמינה</p>
        {summaryLoading ? (
          <div className="mt-1 flex items-center gap-2 text-sm text-vantix-fg-muted">
            <Loader2 className="h-4 w-4 animate-spin text-vantix-cyan" />
            טוען...
          </div>
        ) : (
          <p className="mt-1 font-display text-3xl font-bold text-vantix-fg">
            <AnimatedWalletBalance balance={summary?.balance ?? 0} isReady={!summaryLoading} />
          </p>
        )}
        {nearestExpiryLabel && (summary?.nearestExpiryAmount ?? 0) > 0 ? (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-300">
            <Clock className="h-3.5 w-3.5" />
            {formatShekel(summary!.nearestExpiryAmount!)} {nearestExpiryLabel}
          </p>
        ) : null}
      </div>

      <h3 className="mb-2 text-sm font-semibold text-vantix-fg">היסטוריית תנועות</h3>

      {txLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-vantix-cyan" />
        </div>
      ) : transactions.length === 0 ? (
        <p className="rounded-xl border border-dashed border-vantix-cyan/20 px-4 py-6 text-center text-sm text-vantix-fg-muted">
          עדיין אין תנועות בארנק. קאשבק ממסעדות והזמנות שסופקו יופיע כאן.
        </p>
      ) : (
        <ul className="max-h-80 space-y-2 overflow-y-auto pr-1">
          {transactions.map((tx) => {
            const isCredit = tx.amount > 0
            return (
              <li
                key={tx.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-vantix-cyan/10 bg-vantix-surface px-3 py-2.5"
              >
                <div className="min-w-0 text-right">
                  <div className="flex items-center gap-2">
                    {isCredit ? (
                      <ArrowDownLeft className="h-4 w-4 shrink-0 text-emerald-500" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4 shrink-0 text-red-400" />
                    )}
                    <p className="truncate text-sm font-medium text-vantix-fg">
                      {tx.reason || walletTransactionTypeLabel(tx.type)}
                    </p>
                  </div>
                  <p className="mt-0.5 text-xs text-vantix-fg-muted">
                    {walletTransactionTypeLabel(tx.type)} · {formatTxDate(tx.createdAt)}
                  </p>
                  {tx.expiresAt && isCredit ? (
                    <p className="mt-0.5 text-[11px] text-vantix-fg-subtle">
                      {formatWalletExpiryLabel(tx.expiresAt)}
                    </p>
                  ) : null}
                </div>
                <p
                  className={`shrink-0 text-sm font-bold ${isCredit ? 'text-emerald-600 dark:text-emerald-300' : 'text-red-400'}`}
                  dir="ltr"
                >
                  {isCredit ? '+' : ''}
                  {formatShekel(tx.amount)}
                </p>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

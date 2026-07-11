import { Coins } from 'lucide-react'

type CashbackBadgeProps = {
  percent: number
  className?: string
  size?: 'sm' | 'md'
}

export function CashbackBadge({ percent, className = '', size = 'md' }: CashbackBadgeProps) {
  if (!Number.isFinite(percent) || percent <= 0) return null

  const display =
    Number.isInteger(percent) ? `${percent}%` : `${percent.toFixed(1).replace(/\.0$/, '')}%`

  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-[10px] gap-1'
      : 'px-3 py-1 text-xs gap-1.5'

  return (
    <span
      className={`inline-flex items-center rounded-full border border-emerald-400/40 bg-emerald-500/15 font-semibold text-emerald-700 dark:text-emerald-300 ${sizeClasses} ${className}`}
    >
      <Coins className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} aria-hidden />
      {display} קאשבק לארנק
    </span>
  )
}

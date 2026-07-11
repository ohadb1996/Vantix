import { useWalletBalanceReveal } from '../../hooks/useWalletBalanceReveal'
import { formatShekel } from '../../utils/currency'
import { WalletBalanceShakeSpan } from './WalletBalanceShakeSpan'

export function AnimatedWalletBalance({
  balance,
  isReady,
  className,
}: {
  balance: number
  isReady: boolean
  className?: string
}) {
  const { displayValue, shakeKey } = useWalletBalanceReveal(balance, isReady)
  const formatted = formatShekel(isReady ? displayValue : 0)

  return (
    <WalletBalanceShakeSpan
      value={formatted}
      shakeTick={shakeKey}
      className={className}
    />
  )
}

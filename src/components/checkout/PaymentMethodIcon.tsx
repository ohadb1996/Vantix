import { Banknote, CreditCard } from 'lucide-react'
import type { PaymentMethodType } from '../../types/customerProfile'
import { GoogleIcon } from '../branding/GoogleIcon'

/** @deprecated use GoogleIcon — kept for hot-reload / cached bundles */
function GooglePayMark({ className }: { className?: string }) {
  return <GoogleIcon className={className} />
}

function ApplePayMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="currentColor"
        d="M16.7 12.4c.02 2.2 1.9 2.9 1.93 2.91-.02.06-.3 1.03-1 2.04-.6.87-1.22 1.74-2.2 1.76-.96.02-1.27-.57-2.37-.57-1.1 0-1.44.55-2.35.59-.95.04-1.67-.95-2.28-1.82-1.24-1.79-2.19-5.06-.91-7.27.64-1.1 1.78-1.8 3.02-1.82.94-.02 1.83.63 2.37.63.54 0 1.55-.78 2.62-.67.45.02 1.72.18 2.53 1.36-.07.04-1.51.88-1.49 2.63ZM14.2 4.2c.52-.63 1.38-1.05 2.1-1.08.1.82-.24 1.64-.73 2.18-.48.56-1.28.99-2.06 1.04-.08-.76.21-1.52.69-2.14Z"
      />
    </svg>
  )
}

export function PaymentMethodIcon({
  type,
  className = 'h-5 w-5',
  boxed = true,
}: {
  type: PaymentMethodType
  className?: string
  /** מסגרת עגולה מאחורי האייקון */
  boxed?: boolean
}) {
  const icon = (() => {
    switch (type) {
      case 'gpay':
        return <GooglePayMark className={className} />
      case 'apay':
        return <ApplePayMark className={className} />
      case 'cash':
        return <Banknote className={className} />
      case 'credit':
        return <CreditCard className={className} />
      case 'bit':
        return <span className={`${className} flex items-center justify-center text-[10px] font-bold`}>bit</span>
      default:
        return <CreditCard className={className} />
    }
  })()

  if (!boxed) return icon

  return (
    <span
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-vantix-cyan/15 bg-vantix-surface ${
        type === 'apay' ? 'text-vantix-fg' : ''
      }`}
    >
      {icon}
    </span>
  )
}

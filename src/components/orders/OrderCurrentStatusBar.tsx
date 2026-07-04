import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { CUSTOMER_TRACKING_STEPS } from '../../constants/orderTracking'

interface OrderCurrentStatusBarProps {
  activeIndex: number
  cancelled?: boolean
  loading?: boolean
}

export function getCurrentStatusLabel(activeIndex: number, cancelled?: boolean): string {
  if (cancelled) return 'ההזמנה בוטלה'
  const idx = Math.max(0, Math.min(activeIndex, CUSTOMER_TRACKING_STEPS.length - 1))
  return CUSTOMER_TRACKING_STEPS[idx]?.label ?? 'מעקב הזמנה'
}

export function OrderCurrentStatusBar({ activeIndex, cancelled, loading }: OrderCurrentStatusBarProps) {
  const label = getCurrentStatusLabel(activeIndex, cancelled)

  return (
    <div className="pointer-events-auto fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-20 px-4 sm:bottom-[calc(5rem+env(safe-area-inset-bottom))] sm:px-6">
      <motion.div
        layout
        className={`mx-auto flex max-w-lg items-center gap-3 rounded-2xl border px-4 py-3 shadow-lg backdrop-blur-md ${
          cancelled
            ? 'border-red-500/30 bg-red-950/85'
            : 'border-vantix-cyan/30 bg-vantix-surface-raised/92'
        }`}
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 shrink-0 animate-spin text-vantix-cyan" />
            <span className="text-sm text-vantix-fg-muted">טוען סטטוס...</span>
          </>
        ) : (
          <>
            {!cancelled && (
              <span className="relative flex h-3 w-3 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-vantix-cyan opacity-60" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-vantix-cyan" />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium text-vantix-fg-subtle">סטטוס נוכחי</p>
              <p
                className={`truncate text-sm font-semibold leading-snug ${
                  cancelled ? 'text-red-300' : 'text-vantix-fg'
                }`}
              >
                {label}
              </p>
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}

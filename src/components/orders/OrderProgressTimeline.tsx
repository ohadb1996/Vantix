import { motion } from 'framer-motion'
import { Check, Circle } from 'lucide-react'
import { CUSTOMER_TRACKING_STEPS } from '../../constants/orderTracking'

interface OrderProgressTimelineProps {
  activeIndex: number
  cancelled?: boolean
}

export function OrderProgressTimeline({ activeIndex, cancelled }: OrderProgressTimelineProps) {
  return (
    <div className="space-y-0">
      {CUSTOMER_TRACKING_STEPS.map((step, index) => {
        const done = !cancelled && index < activeIndex
        const current = !cancelled && index === activeIndex
        const pending = cancelled ? index > 0 : index > activeIndex
        const showSubmittedDone = index === 0 && activeIndex >= 1 && !cancelled

        return (
          <div key={step.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <motion.div
                initial={false}
                animate={{
                  scale: current ? [1, 1.15, 1] : 1,
                }}
                transition={current ? { repeat: Infinity, duration: 2 } : undefined}
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                  done || showSubmittedDone
                    ? 'border-vantix-cyan bg-vantix-cyan text-black'
                    : current
                      ? 'border-vantix-cyan bg-vantix-cyan/20 text-vantix-cyan'
                      : 'border-vantix-line/40 bg-vantix-overlay/10 text-vantix-fg-subtle'
                }`}
              >
                {done || showSubmittedDone ? (
                  <Check className="h-4 w-4" strokeWidth={3} />
                ) : (
                  <Circle className={`h-3 w-3 ${current ? 'fill-vantix-cyan' : ''}`} />
                )}
              </motion.div>
              {index < CUSTOMER_TRACKING_STEPS.length - 1 && (
                <div
                  className={`my-1 w-0.5 flex-1 min-h-[1.25rem] rounded-full transition-colors ${
                    done || showSubmittedDone ? 'bg-vantix-cyan/70' : 'bg-vantix-line/25'
                  }`}
                />
              )}
            </div>
            <div className={`pb-5 pt-1 ${pending ? 'opacity-45' : ''}`}>
              <p
                className={`text-sm font-medium leading-snug ${
                  current ? 'text-vantix-cyan' : done || showSubmittedDone ? 'text-vantix-fg' : 'text-vantix-fg-muted'
                }`}
              >
                {step.label}
              </p>
              {current && (
                <motion.p
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1 text-xs text-vantix-fg-subtle"
                >
                  בשלב זה...
                </motion.p>
              )}
            </div>
          </div>
        )
      })}
      {cancelled && (
        <p className="mt-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-300">
          ההזמנה בוטלה
        </p>
      )}
    </div>
  )
}

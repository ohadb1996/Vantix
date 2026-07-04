import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles } from 'lucide-react'

const HERO_MESSAGE =
  'איזה יופי! בודקים עם המסעדה שהיא יכולה לקבל את ההזמנה ומיד מעבירים את זה לטיפול!'

interface OrderTrackingHeroProps {
  compact?: boolean
}

export function OrderTrackingHero({ compact = false }: OrderTrackingHeroProps) {
  const [celebrate, setCelebrate] = useState(!compact)

  useEffect(() => {
    if (compact) return
    const t = window.setTimeout(() => setCelebrate(false), 5500)
    return () => window.clearTimeout(t)
  }, [compact])

  if (compact) {
    return (
      <div className="flex items-start gap-2 rounded-xl border border-vantix-cyan/25 bg-vantix-surface-raised/90 px-3 py-2.5 backdrop-blur-md">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-vantix-cyan" />
        <p className="text-[11px] font-medium leading-snug text-vantix-fg sm:text-xs">{HERO_MESSAGE}</p>
      </div>
    )
  }

  return (
    <AnimatePresence mode="wait">
      {celebrate ? (
        <motion.div
          key="hero-full"
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.98 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-2xl border border-vantix-cyan/30 bg-gradient-to-br from-vantix-cyan/15 via-vantix-surface-raised/95 to-vantix-orange/10 px-5 py-6 shadow-[0_0_60px_rgba(34,211,238,0.15)] backdrop-blur-xl"
        >
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <motion.span
                key={i}
                className="absolute h-2 w-2 rounded-full bg-vantix-cyan/60"
                initial={{
                  left: `${15 + i * 14}%`,
                  top: '100%',
                  opacity: 0,
                }}
                animate={{
                  top: ['100%', '-10%'],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 2.2 + i * 0.2,
                  repeat: Infinity,
                  delay: i * 0.35,
                  ease: 'easeOut',
                }}
              />
            ))}
          </div>
          <motion.div
            animate={{ rotate: [0, 8, -8, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            className="mb-3 inline-flex rounded-full bg-vantix-cyan/20 p-2"
          >
            <Sparkles className="h-6 w-6 text-vantix-cyan" />
          </motion.div>
          <motion.p
            className="relative text-lg sm:text-xl font-bold text-vantix-fg leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {HERO_MESSAGE.split(' ').map((word, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.04 }}
                className="inline-block ml-1"
              >
                {word}
              </motion.span>
            ))}
          </motion.p>
          <motion.div
            className="mt-4 h-1 overflow-hidden rounded-full bg-vantix-line/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-vantix-cyan to-vantix-orange"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 4.5, ease: 'easeInOut' }}
            />
          </motion.div>
        </motion.div>
      ) : (
        <motion.div
          key="hero-compact"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <OrderTrackingHero compact />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

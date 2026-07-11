import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Minus } from 'lucide-react'
import type { MenuItem } from '../../types/menu'
import type { CartLine } from '../../hooks/useCart'
import { haptic } from '../../lib/native'

type ControlMode = 'plus' | 'stepper' | 'compact'

export interface PopularDishEntry {
  item: MenuItem
  orderCount: number
}

const controlMotion = {
  initial: { opacity: 0, scale: 0.72 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.72 },
}

const controlTransition = { duration: 0.18, ease: [0.22, 1, 0.36, 1] as const }

function getCartQtyForItem(cart: CartLine[], itemId: string): number {
  return cart.filter((l) => l.item.id === itemId).reduce((sum, l) => sum + l.quantity, 0)
}

function PopularDishTile({
  item,
  cartQty,
  orderingClosed,
  onOpen,
  onAdd,
  onRemove,
}: {
  item: MenuItem
  cartQty: number
  orderingClosed: boolean
  onOpen: () => void
  onAdd: () => void
  onRemove: () => void
}) {
  const [mode, setMode] = useState<ControlMode>(() => (cartQty > 0 ? 'compact' : 'plus'))
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevCartQtyRef = useRef(0)

  const clearIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current)
      idleTimerRef.current = null
    }
  }, [])

  const setModeQuiet = useCallback((next: ControlMode) => {
    setMode(next)
  }, [])

  const setModeWithHaptic = useCallback((next: ControlMode) => {
    setMode(next)
    void haptic.light()
  }, [])

  const scheduleCompactMode = useCallback(() => {
    if (cartQty <= 0) return
    clearIdleTimer()
    idleTimerRef.current = setTimeout(() => {
      setModeQuiet('compact')
    }, 2000)
  }, [clearIdleTimer, cartQty, setModeQuiet])

  useEffect(() => {
    const prevQty = prevCartQtyRef.current
    if (cartQty > 0 && prevQty === 0) {
      setModeQuiet('stepper')
      scheduleCompactMode()
    } else if (cartQty === 0 && (mode === 'stepper' || mode === 'compact')) {
      setModeQuiet('plus')
    }
    prevCartQtyRef.current = cartQty
  }, [cartQty, mode, scheduleCompactMode, setModeQuiet])

  useEffect(() => () => clearIdleTimer(), [clearIdleTimer])

  const handlePlus = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (orderingClosed) return
    void haptic.light()
    onAdd()
    if (mode === 'stepper') {
      scheduleCompactMode()
    }
  }

  const handleMinus = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (orderingClosed || cartQty <= 0) return
    void haptic.light()
    onRemove()
    scheduleCompactMode()
  }

  const handleExpandCompact = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (orderingClosed || mode !== 'compact') return
    setModeWithHaptic('stepper')
    scheduleCompactMode()
  }

  return (
    <article
      className="w-[9.5rem] shrink-0 snap-start"
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen()
        }
      }}
    >
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-vantix-cyan/20 bg-vantix-surface-raised shadow-sm">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-vantix-cyan/15 to-vantix-orange/10 text-3xl">
            🍽️
          </div>
        )}

        <div className="absolute top-2 right-2 flex min-h-[2rem] min-w-[2rem] items-center justify-center">
          <AnimatePresence mode="wait" initial={false}>
            {mode === 'plus' && (
              <motion.button
                key="plus"
                type="button"
                variants={controlMotion}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={controlTransition}
                onClick={handlePlus}
                disabled={orderingClosed}
                className="rounded-full bg-vantix-orange p-2 text-white shadow-md hover:brightness-110 disabled:opacity-40 dark:bg-vantix-cyan dark:text-black dark:shadow-vantix-cyan/30"
                aria-label={`הוסף ${item.name}`}
              >
                <Plus className="h-4 w-4" />
              </motion.button>
            )}

            {mode === 'stepper' && (
              <motion.div
                key="stepper"
                variants={controlMotion}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={controlTransition}
                className="flex items-center gap-1.5 rounded-full border border-vantix-line/10 bg-vantix-surface-raised/95 px-2 py-1 shadow-md backdrop-blur-sm dark:border-vantix-cyan/20 dark:bg-vantix-surface-muted/95 dark:shadow-black/50"
              >
                <button
                  type="button"
                  onClick={handleMinus}
                  disabled={orderingClosed || cartQty <= 0}
                  className="p-0.5 text-vantix-fg hover:text-vantix-cyan disabled:opacity-40"
                  aria-label={`הפחת ${item.name}`}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="min-w-[1.25rem] text-center text-sm font-bold text-vantix-fg">{cartQty}</span>
                <button
                  type="button"
                  onClick={handlePlus}
                  disabled={orderingClosed}
                  className="p-0.5 text-vantix-fg hover:text-vantix-cyan disabled:opacity-40"
                  aria-label={`הוסף ${item.name}`}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </motion.div>
            )}

            {mode === 'compact' && (
              <motion.button
                key="compact"
                type="button"
                variants={controlMotion}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={controlTransition}
                onClick={handleExpandCompact}
                className="min-w-[2rem] rounded-full bg-vantix-orange px-2.5 py-1 text-sm font-bold text-white shadow-md hover:brightness-110 dark:bg-vantix-cyan dark:text-black dark:shadow-vantix-cyan/30"
                aria-label={`${cartQty} פריטים של ${item.name} בעגלה`}
              >
                {cartQty}
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-2 space-y-0.5 px-0.5">
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-vantix-fg" title={item.name}>
          {item.name}
        </p>
        <p className="text-sm font-bold text-vantix-cyan">₪{item.price.toFixed(2)}</p>
      </div>
    </article>
  )
}

export function PopularDishesRow({
  dishes,
  cart,
  orderingClosed,
  onOpenItem,
  onAddItem,
  onRemoveItem,
}: {
  dishes: PopularDishEntry[]
  cart: CartLine[]
  orderingClosed: boolean
  onOpenItem: (item: MenuItem) => void
  onAddItem: (item: MenuItem) => void
  onRemoveItem: (item: MenuItem) => void
}) {
  if (dishes.length === 0) return null

  return (
    <section className="space-y-3" aria-labelledby="popular-dishes-title">
      <h2 id="popular-dishes-title" className="text-base font-bold text-vantix-fg">
        המנות הפופולריות
      </h2>
      <div
        className="-mx-3 flex gap-3 overflow-x-auto px-3 pb-1 snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        dir="rtl"
      >
        {dishes.map(({ item }) => (
          <PopularDishTile
            key={item.id}
            item={item}
            cartQty={getCartQtyForItem(cart, item.id)}
            orderingClosed={orderingClosed}
            onOpen={() => onOpenItem(item)}
            onAdd={() => onAddItem(item)}
            onRemove={() => onRemoveItem(item)}
          />
        ))}
      </div>
    </section>
  )
}

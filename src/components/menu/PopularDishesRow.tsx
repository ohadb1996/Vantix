import { useCallback, useEffect, useRef, useState } from 'react'
import { Plus, Minus } from 'lucide-react'
import { PopularBadge } from './PopularBadge'
import type { MenuItem } from '../../types/menu'
import type { CartLine } from '../../hooks/useCart'

type ControlMode = 'plus' | 'stepper' | 'popularity'

export interface PopularDishEntry {
  item: MenuItem
  orderCount: number
}

function getCartQtyForItem(cart: CartLine[], itemId: string): number {
  return cart.filter((l) => l.item.id === itemId).reduce((sum, l) => sum + l.quantity, 0)
}

function PopularDishTile({
  item,
  orderCount,
  cartQty,
  orderingClosed,
  onOpen,
  onAdd,
  onRemove,
}: {
  item: MenuItem
  orderCount: number
  cartQty: number
  orderingClosed: boolean
  onOpen: () => void
  onAdd: () => void
  onRemove: () => void
}) {
  const [mode, setMode] = useState<ControlMode>('plus')
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current)
      idleTimerRef.current = null
    }
  }, [])

  const schedulePopularityMode = useCallback(() => {
    clearIdleTimer()
    idleTimerRef.current = setTimeout(() => {
      setMode(orderCount > 0 ? 'popularity' : cartQty > 0 ? 'stepper' : 'plus')
    }, 2000)
  }, [clearIdleTimer, orderCount, cartQty])

  useEffect(() => {
    if (cartQty === 0 && mode === 'stepper') {
      setMode(orderCount > 0 ? 'popularity' : 'plus')
    }
  }, [cartQty, mode, orderCount])

  useEffect(() => () => clearIdleTimer(), [clearIdleTimer])

  const handlePlus = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (orderingClosed) return
    if (mode === 'plus' || mode === 'popularity') {
      onAdd()
      setMode('stepper')
      schedulePopularityMode()
      return
    }
    onAdd()
    schedulePopularityMode()
  }

  const handleMinus = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (orderingClosed || cartQty <= 0) return
    onRemove()
    schedulePopularityMode()
  }

  const handleControlAreaClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (orderingClosed) return
    if (mode === 'popularity') {
      setMode('stepper')
      schedulePopularityMode()
    }
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

        <div
          className="absolute top-2 right-2"
          onClick={handleControlAreaClick}
        >
          {mode === 'plus' && (
            <button
              type="button"
              onClick={handlePlus}
              disabled={orderingClosed}
              className="rounded-full bg-vantix-orange p-2 text-white shadow-md hover:brightness-110 disabled:opacity-40 dark:bg-vantix-cyan dark:text-black dark:shadow-vantix-cyan/30"
              aria-label={`הוסף ${item.name}`}
            >
              <Plus className="h-4 w-4" />
            </button>
          )}

          {mode === 'stepper' && (
            <div className="flex items-center gap-1.5 rounded-full border border-vantix-line/10 bg-vantix-surface-raised/95 px-2 py-1 shadow-md backdrop-blur-sm dark:border-vantix-cyan/20 dark:bg-vantix-surface-muted/95 dark:shadow-black/50">
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
            </div>
          )}

          {mode === 'popularity' && (
            <button
              type="button"
              onClick={handleControlAreaClick}
              className="min-w-[2rem] rounded-full border border-vantix-line/10 bg-vantix-surface-raised/95 px-2.5 py-1 text-sm font-bold text-vantix-fg shadow-md backdrop-blur-sm dark:border-vantix-cyan/20 dark:bg-vantix-surface-muted/95 dark:shadow-black/50"
              aria-label={`${orderCount} הזמנות של ${item.name}`}
            >
              {orderCount}
            </button>
          )}
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
        {dishes.map(({ item, orderCount }) => (
          <PopularDishTile
            key={item.id}
            item={item}
            orderCount={orderCount}
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

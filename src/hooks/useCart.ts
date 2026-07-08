import { useState, useCallback, useEffect } from 'react'
import type { MenuItem } from '../types/menu'
import { CART_STORAGE_KEY } from '../constants/app'
import { calculateLineOptionsTotalShekels } from '../utils/menuSectionPricing'

/** בחירה של הלקוח באופציה אחת מתוך סקשן */
export interface CartSelectedOption {
  sectionId: string
  sectionTitle: string
  optionId: string
  optionLabel: string
  priceCents?: number
  /** כמות מאותה אפשרות (ברירת מחדל 1) */
  quantity?: number
}

export interface CartLine {
  item: MenuItem
  quantity: number
  /** מה הלקוח בחר בסקשנים (גודל, תוספות וכו') */
  selectedOptions?: CartSelectedOption[]
}

const getStorageKey = (businessId: string) => `${CART_STORAGE_KEY}_${businessId}`

/** Persisted shape in localStorage */
interface StoredCartItem {
  itemId: string
  quantity: number
  selectedOptions?: CartSelectedOption[]
}

function loadStoredCart(businessId: string): StoredCartItem[] {
  try {
    const raw = localStorage.getItem(getStorageKey(businessId))
    if (!raw) return []
    const parsed = JSON.parse(raw) as StoredCartItem[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveStoredCart(businessId: string, lines: CartLine[]) {
  try {
    const toStore: StoredCartItem[] = lines.map((l) => ({
      itemId: l.item.id,
      quantity: l.quantity,
      selectedOptions: l.selectedOptions,
    }))
    localStorage.setItem(getStorageKey(businessId), JSON.stringify(toStore))
  } catch (_) {}
}

function optionsFingerprint(opts: CartSelectedOption[] | undefined): string {
  if (!opts?.length) return ''
  return opts
    .slice()
    .sort((a, b) => a.sectionId.localeCompare(b.sectionId) || a.optionId.localeCompare(b.optionId))
    .map((o) => `${o.sectionId}:${o.optionId}:${o.quantity ?? 1}`)
    .join(',')
}

/**
 * Cart state with localStorage persistence per business.
 * Hydrates from storage when menu items become available.
 */
export function useCart(businessId: string | undefined, menuItems: Record<string, MenuItem> | null) {
  const [cart, setCart] = useState<CartLine[]>([])

  useEffect(() => {
    if (!businessId || !menuItems || Object.keys(menuItems).length === 0) return
    const stored = loadStoredCart(businessId)
    const lines: CartLine[] = []
    for (const { itemId, quantity, selectedOptions } of stored) {
      const item = menuItems[itemId]
      if (item && quantity > 0) lines.push({ item, quantity, selectedOptions })
    }
    setCart(lines)
  }, [businessId, menuItems])

  useEffect(() => {
    if (!businessId) return
    saveStoredCart(businessId, cart)
  }, [businessId, cart])

  const addToCart = useCallback((item: MenuItem, selectedOptions?: CartSelectedOption[]) => {
    setCart((prev) => {
      const fp = optionsFingerprint(selectedOptions)
      const i = prev.findIndex(
        (l) => l.item.id === item.id && optionsFingerprint(l.selectedOptions) === fp
      )
      if (i >= 0) {
        const next = [...prev]
        next[i] = { ...next[i], quantity: next[i].quantity + 1 }
        return next
      }
      return [...prev, { item, quantity: 1, selectedOptions }]
    })
  }, [])

  const removeFromCart = useCallback((itemId: string, selectedOptions?: CartSelectedOption[]) => {
    setCart((prev) => {
      const fp = optionsFingerprint(selectedOptions)
      const i = prev.findIndex(
        (l) => l.item.id === itemId && optionsFingerprint(l.selectedOptions) === fp
      )
      if (i < 0) return prev
      const next = [...prev]
      if (next[i].quantity <= 1) return next.filter((_, j) => j !== i)
      next[i] = { ...next[i], quantity: next[i].quantity - 1 }
      return next
    })
  }, [])

  /**
   * עריכת תתי-הפריטים (האופציות) של שורה קיימת בעגלה.
   * ברירת מחדל: עורכים יחידה אחת בלבד (כדי לאפשר פיצול, למשל 2 המבורגרים
   * כשאחד עם גבינה והשני בלי).
   * אם הבחירה החדשה זהה לשורה אחרת קיימת – ממזגים אליה את היחידה שנערכה.
   */
  const updateLineOptions = useCallback(
    (
      itemId: string,
      oldOptions: CartSelectedOption[] | undefined,
      newOptions: CartSelectedOption[] | undefined,
      quantityToUpdate = 1
    ) => {
      setCart((prev) => {
        const oldFp = optionsFingerprint(oldOptions)
        const idx = prev.findIndex(
          (l) => l.item.id === itemId && optionsFingerprint(l.selectedOptions) === oldFp
        )
        if (idx < 0) return prev
        const line = prev[idx]
        const amount = Math.max(1, Math.min(quantityToUpdate, line.quantity))
        const newFp = optionsFingerprint(newOptions)
        if (newFp === oldFp) {
          const next = [...prev]
          next[idx] = { ...line, selectedOptions: newOptions }
          return next
        }
        const mergeIdx = prev.findIndex(
          (l, j) => j !== idx && l.item.id === itemId && optionsFingerprint(l.selectedOptions) === newFp
        )
        // לא מעדכנים את כל השורה כשיש כמות > 1: מפצלים רק את הכמות שנערכה.
        if (line.quantity > amount) {
          const next = [...prev]
          next[idx] = { ...line, quantity: line.quantity - amount }
          if (mergeIdx >= 0) {
            next[mergeIdx] = { ...next[mergeIdx], quantity: next[mergeIdx].quantity + amount }
          } else {
            next.push({ item: line.item, quantity: amount, selectedOptions: newOptions })
          }
          return next
        }
        if (mergeIdx >= 0 && line.quantity <= amount) {
          return prev
            .map((l, j) => (j === mergeIdx ? { ...l, quantity: l.quantity + amount } : l))
            .filter((_, j) => j !== idx)
        }
        const next = [...prev]
        next[idx] = { ...line, selectedOptions: newOptions }
        return next
      })
    },
    []
  )

  const clearCart = useCallback(() => setCart([]), [])

  const totalItems = cart.reduce((s, l) => s + l.quantity, 0)
  const totalPrice = cart.reduce((s, l) => {
    const lineTotal = l.item.price * l.quantity
    const optionsTotal = calculateLineOptionsTotalShekels(
      l.item.sections,
      l.selectedOptions,
      l.quantity,
    )
    return s + lineTotal + optionsTotal
  }, 0)

  return {
    cart,
    addToCart,
    removeFromCart,
    updateLineOptions,
    clearCart,
    totalItems,
    totalPrice,
  }
}

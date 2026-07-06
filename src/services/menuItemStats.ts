import { ref, get, runTransaction } from 'firebase/database'
import { getRealtimeDb } from '../lib/firebase'

const db = () => getRealtimeDb()

export type MenuItemOrderCounts = Record<string, number>

/** כמות הזמנות מצטברת לכל מנה – BusinessMenus/{businessId}/item_stats/{itemId}/orderCount */
export async function getMenuItemOrderCounts(businessId: string): Promise<MenuItemOrderCounts> {
  try {
    const snap = await get(ref(db(), `BusinessMenus/${businessId}/item_stats`))
    if (!snap.exists()) return {}

    const val = snap.val() as Record<string, { orderCount?: number } | number>
    const out: MenuItemOrderCounts = {}
    for (const [itemId, raw] of Object.entries(val)) {
      if (typeof raw === 'number') {
        out[itemId] = raw
        continue
      }
      if (typeof raw?.orderCount === 'number' && raw.orderCount > 0) {
        out[itemId] = raw.orderCount
      }
    }
    return out
  } catch {
    return {}
  }
}

export async function incrementMenuItemOrderCounts(
  businessId: string,
  lines: { menuItemId: string; quantity: number }[]
): Promise<void> {
  const totals = new Map<string, number>()
  for (const { menuItemId, quantity } of lines) {
    if (!menuItemId || quantity <= 0) continue
    totals.set(menuItemId, (totals.get(menuItemId) ?? 0) + quantity)
  }
  if (totals.size === 0) return

  await Promise.all(
    [...totals.entries()].map(([itemId, qty]) =>
      runTransaction(ref(db(), `BusinessMenus/${businessId}/item_stats/${itemId}/orderCount`), (current) => {
        const prev = typeof current === 'number' ? current : 0
        return prev + qty
      })
    )
  )
}

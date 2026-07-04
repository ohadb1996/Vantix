import { ref, get } from 'firebase/database'
import { getRealtimeDb } from '../lib/firebase'

function parseWalletBalance(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, value)
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    if (Number.isFinite(parsed)) return Math.max(0, parsed)
  }
  if (value && typeof value === 'object' && 'balance' in value) {
    return parseWalletBalance((value as { balance: unknown }).balance)
  }
  return 0
}

/** יתרת ארנק הלקוח – נשמרת ב-Customers/{uid}/walletBalance */
export async function getWalletBalance(uid: string): Promise<number> {
  const snap = await get(ref(getRealtimeDb(), `Customers/${uid}/walletBalance`))
  if (!snap.exists()) return 0
  return parseWalletBalance(snap.val())
}

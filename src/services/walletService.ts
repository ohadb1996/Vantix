import { ref, get, query, orderByChild, limitToLast } from 'firebase/database'
import { getRealtimeDb } from '../lib/firebase'
import { WALLET_EXPIRY_DAYS } from '../constants/wallet'

export type WalletTransaction = {
  id: string
  amount: number
  type: string
  reason: string
  createdAt: string
  orderId?: string
  deliveryId?: string
  businessId?: string
  cashbackPercent?: number
  itemsSubtotal?: number
  lotId?: string
  expiresAt?: string
}

export type WalletSummary = {
  balance: number
  nearestExpiryAt?: string
  nearestExpiryAmount?: number
}

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

function parseTransaction(id: string, raw: Record<string, unknown>): WalletTransaction | null {
  const amount = Number(raw.amount)
  if (!Number.isFinite(amount)) return null
  const createdAt = typeof raw.createdAt === 'string' ? raw.createdAt : ''
  if (!createdAt) return null
  return {
    id,
    amount,
    type: typeof raw.type === 'string' ? raw.type : 'unknown',
    reason: typeof raw.reason === 'string' ? raw.reason : '',
    createdAt,
    orderId: typeof raw.orderId === 'string' ? raw.orderId : undefined,
    deliveryId: typeof raw.deliveryId === 'string' ? raw.deliveryId : undefined,
    businessId: typeof raw.businessId === 'string' ? raw.businessId : undefined,
    cashbackPercent: typeof raw.cashbackPercent === 'number' ? raw.cashbackPercent : undefined,
    itemsSubtotal: typeof raw.itemsSubtotal === 'number' ? raw.itemsSubtotal : undefined,
    lotId: typeof raw.lotId === 'string' ? raw.lotId : undefined,
    expiresAt: typeof raw.expiresAt === 'string' ? raw.expiresAt : undefined,
  }
}

/** יתרת ארנק הלקוח — נשמרת ב-Customers/{uid}/walletBalance */
export async function getWalletBalance(uid: string): Promise<number> {
  const snap = await get(ref(getRealtimeDb(), `Customers/${uid}/walletBalance`))
  if (!snap.exists()) return 0
  return parseWalletBalance(snap.val())
}

export async function getWalletLotsSummary(uid: string): Promise<Pick<WalletSummary, 'nearestExpiryAt' | 'nearestExpiryAmount'>> {
  const snap = await get(ref(getRealtimeDb(), `Customers/${uid}/walletLots`))
  if (!snap.exists()) return {}

  const now = Date.now()
  let nearestExpiryAt: string | undefined
  let nearestExpiryAmount = 0

  for (const raw of Object.values(snap.val() as Record<string, Record<string, unknown>>)) {
    const remaining = Number(raw.amountRemaining)
    const expiresAt = typeof raw.expiresAt === 'string' ? raw.expiresAt : ''
    if (!Number.isFinite(remaining) || remaining <= 0 || !expiresAt) continue
    const expMs = new Date(expiresAt).getTime()
    if (!Number.isFinite(expMs) || expMs <= now) continue
    if (!nearestExpiryAt || expMs < new Date(nearestExpiryAt).getTime()) {
      nearestExpiryAt = expiresAt
      nearestExpiryAmount = remaining
    } else if (expiresAt === nearestExpiryAt) {
      nearestExpiryAmount += remaining
    }
  }

  return {
    nearestExpiryAt,
    nearestExpiryAmount: nearestExpiryAmount > 0 ? Math.round(nearestExpiryAmount * 100) / 100 : undefined,
  }
}

export async function getWalletSummary(uid: string): Promise<WalletSummary> {
  const [balance, lots] = await Promise.all([getWalletBalance(uid), getWalletLotsSummary(uid)])
  return { balance, ...lots }
}

export async function getWalletTransactions(uid: string, max = 40): Promise<WalletTransaction[]> {
  const txRef = query(
    ref(getRealtimeDb(), `Customers/${uid}/walletTransactions`),
    orderByChild('createdAt'),
    limitToLast(max),
  )
  const snap = await get(txRef)
  if (!snap.exists()) return []

  const list: WalletTransaction[] = []
  for (const [id, raw] of Object.entries(snap.val() as Record<string, Record<string, unknown>>)) {
    const tx = parseTransaction(id, raw)
    if (tx) list.push(tx)
  }

  return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function formatWalletExpiryLabel(expiresAt?: string): string | null {
  if (!expiresAt) return null
  const exp = new Date(expiresAt)
  if (Number.isNaN(exp.getTime())) return null
  const daysLeft = Math.ceil((exp.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  if (daysLeft <= 0) return 'פג תוקף'
  if (daysLeft === 1) return 'תוקף עד מחר'
  if (daysLeft <= 7) return `תוקף בעוד ${daysLeft} ימים`
  return `תוקף ${exp.toLocaleDateString('he-IL')} (${WALLET_EXPIRY_DAYS} יום מזיכוי)`
}

export function walletTransactionTypeLabel(type: string): string {
  switch (type) {
    case 'cashback':
      return 'קאשבק'
    case 'credit':
      return 'זיכוי'
    case 'order_payment':
      return 'תשלום מהארנק'
    case 'expiry':
      return 'פג תוקף'
    default:
      return type
  }
}

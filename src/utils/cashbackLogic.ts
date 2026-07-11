/** Pure cashback helpers — kept in sync with maxDelivery-partners/functions/src/vantixCashbackLogic.ts */

export const CASHBACK_ELIGIBLE_PAYMENT_STATUSES = new Set(['paid', 'cash_on_delivery'])

export function isCashbackEligiblePaymentStatus(paymentStatus: unknown): boolean {
  return CASHBACK_ELIGIBLE_PAYMENT_STATUSES.has(String(paymentStatus || '').trim())
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100
}

export function computeCashbackCreditAmount(itemsSubtotal: number, cashbackPercent: number): number {
  const subtotal = roundMoney(itemsSubtotal)
  const percent = Number(cashbackPercent)
  if (subtotal <= 0 || !Number.isFinite(percent) || percent <= 0) return 0
  return roundMoney((subtotal * percent) / 100)
}

export function currentCashbackMonthKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function parseCashbackPaidThisMonth(stats: unknown, refDate = new Date()): number {
  if (!stats || typeof stats !== 'object') return 0
  const row = stats as { month_key?: string; month_total?: number }
  if (row.month_key !== currentCashbackMonthKey(refDate)) return 0
  return typeof row.month_total === 'number' && Number.isFinite(row.month_total)
    ? Math.max(0, roundMoney(row.month_total))
    : 0
}

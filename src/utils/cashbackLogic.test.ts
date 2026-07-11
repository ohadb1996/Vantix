import { describe, expect, it } from 'vitest'
import {
  computeCashbackCreditAmount,
  isCashbackEligiblePaymentStatus,
  parseCashbackPaidThisMonth,
} from './cashbackLogic'

describe('cashbackLogic (client mirror)', () => {
  it('treats cash on delivery as cashback-eligible', () => {
    expect(isCashbackEligiblePaymentStatus('cash_on_delivery')).toBe(true)
    expect(isCashbackEligiblePaymentStatus('paid')).toBe(true)
    expect(isCashbackEligiblePaymentStatus('pending_wallet')).toBe(false)
  })

  it('computes cashback from food subtotal', () => {
    expect(computeCashbackCreditAmount(100, 5)).toBe(5)
  })

  it('parses paid-this-month stats', () => {
    const ref = new Date('2026-07-10T12:00:00.000Z')
    expect(parseCashbackPaidThisMonth({ month_key: '2026-07', month_total: 18 }, ref)).toBe(18)
    expect(parseCashbackPaidThisMonth({ month_key: '2026-06', month_total: 18 }, ref)).toBe(0)
  })
})

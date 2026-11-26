export const DEFAULT_MIN_DELIVERY_TOTAL = 60

/** מינימום לחיוב במשלוח — 60 כשלא הוגדר או כשהערך 0 (לא מוגדר בפועל). */
export function resolveMinDeliveryTotal(value?: number | null): number {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return value
  }
  return DEFAULT_MIN_DELIVERY_TOTAL
}

/** אורך סטנדרטי של כרטיס אשראי (Visa / Mastercard / ישראכרט) */
export const CARD_NUMBER_DIGITS = 16

/** מספר כרטיס מעוצב עם רווח כל 4 ספרות (לתצוגה/קלט) */
export function formatCardNumberInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, CARD_NUMBER_DIGITS)
  const groups: string[] = []
  for (let i = 0; i < digits.length; i += 4) {
    groups.push(digits.slice(i, i + 4))
  }
  return groups.join(' ')
}

/** מספר כרטיס ללא רווחים – לשליחה/ולידציה */
export function stripCardNumber(raw: string): string {
  return raw.replace(/\D/g, '')
}

/** תצוגת כרטיס מוסווית – קבוצות של 4 עם ספרות אחרונות גלויות */
export function formatMaskedCardNumber(last4: string): string {
  const digits = last4.replace(/\D/g, '').slice(-4)
  if (!digits) return '•••• •••• •••• ••••'
  const visible = formatCardNumberInput(digits)
  const hiddenGroups = Math.max(0, 4 - Math.ceil(digits.length / 4))
  const prefix = Array.from({ length: hiddenGroups }, () => '••••').join(' ')
  return prefix ? `${prefix} ${visible}` : visible
}

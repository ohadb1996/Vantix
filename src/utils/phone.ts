/**
 * נרמול טלפון ישראלי ל־מסד (ספרות בלבד, 05x או +972)
 */
export function normalizeIsraeliPhone(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (digits.length === 9 && digits.startsWith('5')) return `0${digits}`
  if (digits.length === 10 && digits.startsWith('05')) return digits
  if (digits.length === 11 && digits.startsWith('972')) return `0${digits.slice(3)}`
  if (digits.length === 12 && digits.startsWith('972')) return `0${digits.slice(3)}`
  return digits ? `0${digits.replace(/^0+/, '')}` : value.trim()
}

export function isValidIsraeliPhone(value: string): boolean {
  const normalized = normalizeIsraeliPhone(value)
  return /^05\d{8}$/.test(normalized)
}

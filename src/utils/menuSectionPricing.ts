import type { MenuItemSection } from '../types/menu'

/** בחירה של הלקוח – תואם ל-CartSelectedOption */
export interface OptionSelection {
  sectionId: string
  optionId: string
  priceCents?: number
  quantity?: number
}

export function getOptionMaxQuantity(maxQuantity?: number): number {
  if (maxQuantity == null || !Number.isFinite(maxQuantity) || maxQuantity < 1) return 1
  return Math.floor(maxQuantity)
}

export function getSectionSelectionsTotal(qtyMap: Record<string, number> | undefined): number {
  if (!qtyMap) return 0
  return Object.values(qtyMap).reduce((sum, n) => sum + (n > 0 ? n : 0), 0)
}

/**
 * מחשב את עלות האפשרויות ליחידה אחת של מנה, כולל "X הראשונים בחינם" לפי סדר האפשרויות בסקשן.
 */
export function chargeableCentsForSection(
  section: MenuItemSection,
  selections: OptionSelection[],
): number {
  const sectionSelections = selections.filter((s) => s.sectionId === section.id)

  if (section.choiceType === 'single') {
    const sel = sectionSelections[0]
    if (!sel) return 0
    const price =
      sel.priceCents ??
      section.options.find((o) => o.id === sel.optionId)?.priceCents ??
      0
    const freeQty = section.freeQuantity ?? 0
    return freeQty >= 1 ? 0 : price
  }

  const freeQty = section.freeQuantity ?? 0
  let freeLeft = freeQty
  let total = 0

  for (const option of section.options) {
    const sel = sectionSelections.find((s) => s.optionId === option.id)
    const qty = Math.max(0, sel?.quantity ?? 0)
    const price = option.priceCents ?? sel?.priceCents ?? 0
    for (let i = 0; i < qty; i++) {
      if (freeLeft > 0) {
        freeLeft--
      } else {
        total += price
      }
    }
  }

  return total
}

export function calculateLineOptionsTotalCents(
  sections: MenuItemSection[] | undefined,
  selectedOptions: OptionSelection[] | undefined,
  lineQuantity = 1,
): number {
  if (!sections?.length || !selectedOptions?.length) return 0
  let perUnit = 0
  for (const sec of sections) {
    perUnit += chargeableCentsForSection(sec, selectedOptions)
  }
  return perUnit * Math.max(1, lineQuantity)
}

export function calculateLineOptionsTotalShekels(
  sections: MenuItemSection[] | undefined,
  selectedOptions: OptionSelection[] | undefined,
  lineQuantity = 1,
): number {
  return calculateLineOptionsTotalCents(sections, selectedOptions, lineQuantity) / 100
}

export function formatOptionLabelWithQty(label: string, quantity?: number): string {
  const qty = quantity ?? 1
  return qty > 1 ? `${label} ×${qty}` : label
}

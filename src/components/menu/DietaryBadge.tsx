import { Leaf, Vegan } from 'lucide-react'
import type { MenuItemDietaryType } from '../../types/menu'

export function DietaryBadge({
  dietaryType,
  className = '',
}: {
  dietaryType?: MenuItemDietaryType | null
  className?: string
}) {
  if (dietaryType === 'vegetarian') {
    return (
      <span
        className={`inline-flex shrink-0 items-center gap-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 ${className}`}
      >
        <Leaf className="h-3 w-3" aria-hidden />
        צמחוני
      </span>
    )
  }
  if (dietaryType === 'vegan') {
    return (
      <span
        className={`inline-flex shrink-0 items-center gap-0.5 text-xs font-semibold text-lime-600 dark:text-lime-400 ${className}`}
      >
        <Vegan className="h-3 w-3" aria-hidden />
        טבעוני
      </span>
    )
  }
  return null
}

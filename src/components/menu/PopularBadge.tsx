import { Star } from 'lucide-react'

export function PopularBadge({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-0.5 text-xs font-semibold text-vantix-orange dark:text-vantix-cyan ${className}`}
    >
      <Star className="h-3 w-3 fill-vantix-orange dark:fill-vantix-cyan" aria-hidden />
      פופולרי
    </span>
  )
}

import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

type ThemeToggleProps = {
  variant?: 'icon' | 'compact'
  className?: string
}

const LABEL_BY_NEXT: Record<'light' | 'dark', string> = {
  light: 'מצב כהה',
  dark: 'מצב בהיר',
}

export const ThemeToggle = ({ variant = 'icon', className = '' }: ThemeToggleProps) => {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  const Icon = isDark ? Sun : Moon
  const nextLabel = LABEL_BY_NEXT[isDark ? 'light' : 'dark']

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-vantix-line/15 bg-vantix-overlay/5 text-vantix-fg-muted transition-colors hover:bg-vantix-overlay/10 hover:text-vantix-fg ${className}`}
        aria-label={`עבור ל${nextLabel}`}
        title={nextLabel}
      >
        <Icon className="h-4 w-4" aria-hidden />
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`flex w-full items-center justify-between gap-3 rounded-xl border border-vantix-line/10 bg-vantix-overlay/[0.04] px-3 py-2.5 text-vantix-fg-muted transition-colors hover:bg-vantix-overlay/10 hover:text-vantix-fg ${className}`}
      aria-label={`עבור ל${nextLabel}`}
    >
      <span className="flex items-center gap-2">
        <Icon className="h-4 w-4 shrink-0" aria-hidden />
        <span className="text-sm font-medium">{nextLabel}</span>
      </span>
      <span
        dir="ltr"
        className={`relative inline-block h-5 w-9 shrink-0 rounded-full transition-colors ${
          isDark ? 'bg-vantix-cyan/30' : 'bg-vantix-orange/30'
        }`}
        aria-hidden
      >
        <span
          className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-vantix-fg shadow-sm transition-all ${
            isDark ? 'left-0.5' : 'left-[18px]'
          }`}
        />
      </span>
    </button>
  )
}

import { STORE_VERTICALS, type StoreVerticalId } from '../../constants/storeVerticals'

type StoreVerticalShortcutsProps = {
  selected: StoreVerticalId | null
  onChange: (vertical: StoreVerticalId | null) => void
}

export function StoreVerticalShortcuts({ selected, onChange }: StoreVerticalShortcutsProps) {
  return (
    <div className="flex items-center gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <button
        type="button"
        onClick={() => onChange(null)}
        className={`flex h-16 w-16 shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border-2 transition-all ${
          selected === null
            ? 'border-vantix-cyan bg-vantix-cyan/10 text-vantix-cyan'
            : 'border-vantix-cyan/20 bg-vantix-surface-raised text-vantix-fg-muted hover:border-vantix-cyan/40'
        }`}
        aria-label="הכל"
      >
        <span className="text-xl">🔥</span>
        <span className="text-xs font-medium">הכל</span>
      </button>
      {STORE_VERTICALS.map((vertical) => {
        const Icon = vertical.icon
        const isSelected = selected === vertical.id
        return (
          <button
            key={vertical.id}
            type="button"
            onClick={() => onChange(vertical.id)}
            className={`flex h-16 w-16 shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border-2 transition-all ${
              isSelected
                ? 'border-vantix-cyan bg-vantix-cyan/10 text-vantix-cyan'
                : 'border-vantix-cyan/20 bg-vantix-surface-raised text-vantix-fg-muted hover:border-vantix-cyan/40'
            }`}
            aria-label={vertical.label}
          >
            <Icon className="h-6 w-6" />
            <span className="text-xs font-medium">{vertical.label}</span>
          </button>
        )
      })}
    </div>
  )
}

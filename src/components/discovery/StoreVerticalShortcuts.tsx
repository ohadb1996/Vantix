import { STORE_VERTICALS, type StoreVerticalId } from '../../constants/storeVerticals'
import { haptic } from '../../lib/native'

type StoreVerticalShortcutsProps = {
  selected: StoreVerticalId | null
  onChange: (vertical: StoreVerticalId | null) => void
}

export function StoreVerticalShortcuts({ selected, onChange }: StoreVerticalShortcutsProps) {
  const handleSelect = (id: StoreVerticalId) => {
    void haptic.light()
    onChange(selected === id ? null : id)
  }

  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-3">
      {STORE_VERTICALS.map(({ id, label, icon: Icon }) => {
        const isActive = selected === id
        return (
          <button
            key={id}
            type="button"
            onClick={() => handleSelect(id)}
            aria-pressed={isActive}
            className="group flex flex-col items-center gap-2 rounded-2xl p-1 transition active:scale-[0.97]"
          >
            <span
              className={`flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-full border-2 bg-vantix-surface-raised shadow-sm transition sm:h-[4.75rem] sm:w-[4.75rem] ${
                isActive
                  ? 'border-vantix-cyan bg-vantix-cyan/10 shadow-vantix-cyan/20'
                  : 'border-vantix-cyan/20 group-hover:border-vantix-cyan/45 group-hover:bg-vantix-cyan/5'
              }`}
            >
              <Icon
                className={`h-7 w-7 sm:h-8 sm:w-8 ${isActive ? 'text-vantix-cyan' : 'text-vantix-fg-muted group-hover:text-vantix-cyan'}`}
                strokeWidth={1.75}
                aria-hidden
              />
            </span>
            <span
              className={`text-center text-[11px] font-semibold leading-tight sm:text-xs ${
                isActive ? 'text-vantix-cyan' : 'text-vantix-fg-muted'
              }`}
            >
              {label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

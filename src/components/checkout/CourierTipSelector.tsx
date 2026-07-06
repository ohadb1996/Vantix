import { useEffect, useRef, useState } from 'react'

export const COURIER_TIP_PRESETS = [0, 5, 10, 15, 20] as const
export const COURIER_TIP_MAX = 20

type PresetValue = (typeof COURIER_TIP_PRESETS)[number]

type CourierTipSelectorProps = {
  value: number
  onChange: (tip: number) => void
}

export function CourierTipSelector({ value, onChange }: CourierTipSelectorProps) {
  const [mode, setMode] = useState<'preset' | 'custom'>(() =>
    value > 0 && !COURIER_TIP_PRESETS.includes(value as PresetValue) ? 'custom' : 'preset',
  )
  const [customInput, setCustomInput] = useState(() =>
    value > 0 && !COURIER_TIP_PRESETS.includes(value as PresetValue) ? String(value) : '',
  )
  const [dragTip, setDragTip] = useState<number | null>(null)
  const isDraggingRef = useRef(false)

  useEffect(() => {
    if (COURIER_TIP_PRESETS.includes(value as PresetValue)) {
      setMode('preset')
    }
  }, [value])

  const shownTip = dragTip ?? value
  const tipRatio = Math.min(1, Math.max(0, shownTip / COURIER_TIP_MAX))
  const thumbSizeRatio = Math.min(1, Math.max(0, value / COURIER_TIP_MAX))

  const selectPreset = (amount: PresetValue) => {
    setMode('preset')
    setCustomInput('')
    setDragTip(null)
    onChange(amount)
  }

  const selectCustomMode = () => {
    setMode('custom')
    if (customInput) {
      const n = parseInt(customInput, 10)
      if (Number.isInteger(n) && n > 0 && n <= COURIER_TIP_MAX) onChange(n)
    }
  }

  const handleCustomInput = (raw: string) => {
    const digits = raw.replace(/\D/g, '')
    setCustomInput(digits)
    if (!digits) return
    const n = parseInt(digits, 10)
    if (Number.isInteger(n) && n > 0 && n <= COURIER_TIP_MAX) onChange(n)
  }

  const commitSlider = (raw: number) => {
    const n = Math.max(0, Math.min(COURIER_TIP_MAX, Math.round(raw)))
    setDragTip(null)
    setMode('preset')
    setCustomInput('')
    onChange(n)
  }

  return (
    <section
      className="space-y-4 rounded-2xl border border-vantix-cyan/20 bg-vantix-surface p-4"
      aria-labelledby="courier-tip-heading"
    >
      <div className="flex items-center justify-between gap-2">
        <h3 id="courier-tip-heading" className="text-sm font-semibold text-vantix-fg">
          טיפ לשליח
        </h3>
        <span className="text-sm font-semibold text-vantix-cyan transition-all duration-150">
          ₪{Math.round(shownTip)}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {COURIER_TIP_PRESETS.map((amount) => (
          <button
            key={amount}
            type="button"
            onClick={() => selectPreset(amount)}
            className={`min-h-[44px] rounded-full border px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vantix-cyan focus-visible:ring-offset-2 ${
              mode === 'preset' && value === amount
                ? 'border-vantix-cyan bg-vantix-cyan/15 text-vantix-cyan'
                : 'border-vantix-cyan/20 bg-vantix-surface-raised text-vantix-fg-muted hover:border-vantix-cyan/40'
            }`}
          >
            {amount === 0 ? 'ללא' : `₪${amount}`}
          </button>
        ))}
        <button
          type="button"
          onClick={selectCustomMode}
          className={`min-h-[44px] rounded-full border px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vantix-cyan focus-visible:ring-offset-2 ${
            mode === 'custom'
              ? 'border-vantix-cyan bg-vantix-cyan/15 text-vantix-cyan'
              : 'border-vantix-cyan/20 bg-vantix-surface-raised text-vantix-fg-muted hover:border-vantix-cyan/40'
          }`}
        >
          אחר
        </button>
      </div>

      {mode === 'custom' && (
        <div>
          <label htmlFor="courier-tip-custom" className="mb-1 block text-xs text-vantix-fg-muted">
            סכום אחר (₪1–₪{COURIER_TIP_MAX}, מספר שלם)
          </label>
          <input
            id="courier-tip-custom"
            type="number"
            inputMode="numeric"
            min={1}
            max={COURIER_TIP_MAX}
            step={1}
            value={customInput}
            onChange={(e) => handleCustomInput(e.target.value)}
            className="w-full rounded-xl border border-vantix-line/10 bg-vantix-surface-raised px-3 py-2.5 text-sm text-vantix-fg focus:outline-none focus:ring-2 focus:ring-vantix-cyan/40"
            placeholder="לדוגמה: 7"
          />
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="courier-tip-slider" className="text-xs text-vantix-fg-muted">
          גרור לבחירת סכום (עד ₪{COURIER_TIP_MAX})
        </label>
        <input
          id="courier-tip-slider"
          type="range"
          min={0}
          max={COURIER_TIP_MAX}
          step="any"
          value={shownTip}
          onPointerDown={() => {
            isDraggingRef.current = true
          }}
          onInput={(e) => setDragTip(parseFloat(e.currentTarget.value))}
          onChange={(e) => {
            if (!isDraggingRef.current) commitSlider(parseFloat(e.target.value))
          }}
          onPointerUp={(e) => {
            commitSlider(parseFloat(e.currentTarget.value))
            isDraggingRef.current = false
          }}
          onBlur={(e) => {
            if (dragTip !== null) commitSlider(parseFloat(e.currentTarget.value))
            isDraggingRef.current = false
          }}
          className="courier-tip-slider w-full cursor-pointer"
          style={
            {
              '--tip-ratio': tipRatio,
              '--thumb-size-ratio': thumbSizeRatio,
            } as React.CSSProperties
          }
        />
        <div className="flex justify-between text-[11px] text-vantix-fg-subtle">
          <span>₪0</span>
          <span>₪{COURIER_TIP_MAX}</span>
        </div>
      </div>
    </section>
  )
}

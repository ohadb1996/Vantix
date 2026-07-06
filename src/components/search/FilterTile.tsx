import { motion } from 'framer-motion'

type FilterTileProps = {
  label: string
  emoji: string
  gradient: string
  selected?: boolean
  onClick: () => void
}

export function FilterTile({ label, emoji, gradient, selected = false, onClick }: FilterTileProps) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      aria-pressed={selected}
      className={`group relative aspect-[4/3] w-full overflow-hidden rounded-xl text-right shadow-[0_4px_14px_rgba(0,0,0,0.18)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vantix-cyan focus-visible:ring-offset-2 sm:aspect-[3/2] sm:rounded-lg sm:shadow-[0_3px_12px_rgba(0,0,0,0.15)] ${
        selected ? 'ring-2 ring-vantix-cyan ring-offset-2 shadow-[0_6px_18px_rgba(0,0,0,0.22)]' : 'hover:shadow-[0_6px_16px_rgba(0,0,0,0.2)]'
      }`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_55%)]" />
      <span
        className="pointer-events-none absolute left-1/2 top-[34%] -translate-x-1/2 -translate-y-1/2 text-4xl drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)] transition-transform group-hover:scale-110 sm:text-5xl"
        aria-hidden
      >
        {emoji}
      </span>
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-2 sm:p-2">
        <p className="text-sm font-bold leading-snug text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] sm:text-base">
          {label}
        </p>
      </div>
      {selected ? (
        <span className="absolute left-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold text-vantix-cyan shadow">
          ✓
        </span>
      ) : null}
    </motion.button>
  )
}

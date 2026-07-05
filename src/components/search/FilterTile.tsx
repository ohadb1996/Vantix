import { motion } from 'framer-motion'

type FilterTileProps = {
  label: string
  emoji: string
  gradient: string
  selected?: boolean
  count?: number
  onClick: () => void
}

export function FilterTile({ label, emoji, gradient, selected = false, count, onClick }: FilterTileProps) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      aria-pressed={selected}
      className={`group relative aspect-[4/3] w-full overflow-hidden rounded-2xl text-right shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vantix-cyan focus-visible:ring-offset-2 ${
        selected ? 'ring-2 ring-vantix-cyan ring-offset-2' : 'hover:shadow-md'
      }`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_55%)]" />
      <span
        className="pointer-events-none absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2 text-4xl drop-shadow-md transition-transform group-hover:scale-110 sm:text-5xl"
        aria-hidden
      >
        {emoji}
      </span>
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-2.5 sm:p-3">
        <p className="text-sm font-bold leading-tight text-white drop-shadow-sm sm:text-base">{label}</p>
        {typeof count === 'number' && count > 0 ? (
          <p className="mt-0.5 text-[11px] font-medium text-white/80">{count} עסקים</p>
        ) : null}
      </div>
      {selected ? (
        <span className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold text-vantix-cyan shadow">
          ✓
        </span>
      ) : null}
    </motion.button>
  )
}

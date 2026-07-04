import type { OrderTrackingMapMarker } from '../../hooks/useOrderTracking'

const STORE_ICON = (
  <svg className="h-3 w-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
    />
  </svg>
)

/** פופאפ מותג – תואם לעיצוב MapView ב-maxDelivery-partners */
export function OrderTrackingMapPopup({ marker }: { marker: OrderTrackingMapMarker }) {
  if (marker.kind === 'courier') {
    return (
      <div
        dir="rtl"
        className="inline-flex w-fit items-center gap-2 rounded-full border border-vantix-cyan/40 bg-vantix-surface-raised/95 px-3 py-1.5 shadow-[0_8px_24px_-6px_rgba(0,0,0,0.5)] ring-1 ring-vantix-cyan/15 backdrop-blur-xl"
      >
        <span className="text-base leading-none">🚴</span>
        <span className="whitespace-nowrap text-sm font-semibold text-vantix-fg">{marker.label}</span>
      </div>
    )
  }

  if (marker.kind === 'business') {
    return (
      <div className="relative inline-block w-fit max-w-[200px] overflow-hidden rounded-xl border border-vantix-cyan/30 bg-vantix-surface-raised/95 px-3 py-2 text-right shadow-[0_14px_36px_-10px_rgba(0,0,0,0.55)] ring-1 ring-vantix-cyan/10 backdrop-blur-xl">
        <span className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-l from-vantix-cyan via-vantix-cyan/50 to-transparent" />
        <div className="mb-1.5 flex items-center gap-1.5 border-b border-vantix-line/10 pb-1.5">
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-vantix-cyan to-vantix-cyan/70 shadow-[0_0_10px_rgba(34,211,238,0.45)]">
            {STORE_ICON}
          </div>
          <h3 className="text-[11px] font-semibold tracking-tight text-vantix-fg">נקודת איסוף</h3>
        </div>
        <p className="text-[11px] font-semibold leading-snug text-vantix-fg">{marker.label}</p>
        <p className="mt-0.5 text-[10px] leading-snug text-vantix-fg-muted">{marker.title}</p>
      </div>
    )
  }

  return (
    <div
      dir="rtl"
      className="relative inline-flex w-fit max-w-[200px] flex-col gap-1 overflow-hidden rounded-xl border border-vantix-orange/35 bg-vantix-surface-raised/95 px-3 py-2 shadow-[0_14px_36px_-10px_rgba(0,0,0,0.55)] ring-1 ring-vantix-orange/10 backdrop-blur-xl"
    >
      <span className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-l from-vantix-orange via-vantix-orange/50 to-transparent" />
      <div className="flex items-center gap-1.5">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-vantix-orange to-vantix-orange/70 text-[11px] shadow-[0_0_10px_rgba(249,115,22,0.45)]">
          📦
        </span>
        <span className="whitespace-nowrap text-[11px] font-semibold text-vantix-fg">יעד המשלוח</span>
      </div>
      <p className="text-right text-[11px] font-semibold leading-snug text-vantix-fg">{marker.label}</p>
      <p className="text-right text-[10px] leading-snug text-vantix-fg-muted">{marker.title}</p>
    </div>
  )
}

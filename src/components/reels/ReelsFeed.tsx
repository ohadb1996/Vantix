import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clapperboard, Play, UtensilsCrossed, Volume2, VolumeX, X } from 'lucide-react'
import type { Reel } from '../../services/reels'
import { ROUTES } from '../../constants/app'

/**
 * פיד רילסים גלובלי: גלילה אופקית של סרטונים אנכיים (9:16) שמתנגנים מושתקים
 * בלולאה. לחיצה פותחת נגן מסך-מלא עם סאונד וקריאה לפעולה למסעדה המקושרת.
 */
export function ReelsFeed({ reels }: { reels: Reel[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  if (!reels.length) return null

  return (
    <section className="space-y-3" aria-label="רילסים">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-vantix-cyan/15 text-vantix-cyan">
          <Clapperboard className="h-4 w-4" />
        </span>
        <h2 className="font-display text-xl text-vantix-fg sm:text-2xl">רילסים</h2>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {reels.map((reel, index) => (
          <ReelThumb key={reel.id} reel={reel} onOpen={() => setActiveIndex(index)} />
        ))}
      </div>

      {activeIndex !== null && (
        <ReelPlayer
          reels={reels}
          startIndex={activeIndex}
          onClose={() => setActiveIndex(null)}
        />
      )}
    </section>
  )
}

function ReelThumb({ reel, onOpen }: { reel: Reel; onOpen: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    // ניסיון נגינה מושתקת אוטומטית (מותר במובייל כשמושתק)
    const v = videoRef.current
    if (!v) return
    v.muted = true
    const tryPlay = () => v.play().catch(() => {})
    tryPlay()
  }, [])

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative aspect-[9/16] w-36 shrink-0 overflow-hidden rounded-2xl border border-vantix-cyan/20 bg-black focus:outline-none focus:ring-2 focus:ring-vantix-cyan sm:w-40"
      aria-label={reel.caption || 'צפייה בריל'}
    >
      <video
        ref={videoRef}
        src={reel.videoUrl}
        muted
        loop
        playsInline
        preload="metadata"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10" />
      <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur">
        <Play className="h-3.5 w-3.5 fill-white" />
      </span>
      <div className="absolute inset-x-0 bottom-0 p-2 text-right">
        {reel.caption && (
          <p className="line-clamp-2 text-xs font-medium text-white drop-shadow">{reel.caption}</p>
        )}
        {reel.businessName && (
          <p className="mt-0.5 flex items-center justify-end gap-1 text-[10px] text-white/80">
            <UtensilsCrossed className="h-3 w-3" />
            {reel.businessName}
          </p>
        )}
      </div>
    </button>
  )
}

function ReelPlayer({
  reels,
  startIndex,
  onClose,
}: {
  reels: Reel[]
  startIndex: number
  onClose: () => void
}) {
  const navigate = useNavigate()
  const [index, setIndex] = useState(startIndex)
  const [muted, setMuted] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const reel = reels[index]

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    v.muted = muted
    v.play().catch(() => {})
  }, [index, muted])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const goToMenu = () => {
    if (reel.businessId) {
      onClose()
      navigate(ROUTES.RESTAURANT_MENU(reel.businessId))
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-3"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative flex h-full max-h-[92vh] w-full max-w-[420px] flex-col overflow-hidden rounded-2xl bg-black"
        onClick={(e) => e.stopPropagation()}
      >
        <video
          ref={videoRef}
          src={reel.videoUrl}
          autoPlay
          loop
          playsInline
          onEnded={() => setIndex((i) => (i + 1 < reels.length ? i + 1 : i))}
          className="h-full w-full object-contain"
        />

        <button
          type="button"
          onClick={onClose}
          aria-label="סגור"
          className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur hover:bg-black/70"
        >
          <X className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={() => setMuted((m) => !m)}
          aria-label={muted ? 'הפעל סאונד' : 'השתק'}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur hover:bg-black/70"
        >
          {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-right">
          {reel.caption && <p className="text-sm font-medium text-white drop-shadow">{reel.caption}</p>}
          {reel.businessId && (
            <button
              type="button"
              onClick={goToMenu}
              className="pointer-events-auto mt-3 inline-flex items-center gap-2 rounded-full bg-vantix-cyan px-5 py-2.5 text-sm font-semibold text-black"
            >
              <UtensilsCrossed className="h-4 w-4" />
              {reel.businessName ? `לתפריט של ${reel.businessName}` : 'לתפריט'}
            </button>
          )}
        </div>

        {reels.length > 1 && (
          <div className="absolute inset-x-0 top-0 flex gap-1 p-2">
            {reels.map((_, i) => (
              <span
                key={i}
                className={`h-1 flex-1 rounded-full ${i === index ? 'bg-white' : 'bg-white/30'}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

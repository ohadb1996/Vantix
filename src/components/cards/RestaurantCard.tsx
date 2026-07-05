import { Heart, MapPin, Star, UtensilsCrossed } from 'lucide-react'

type RestaurantCardProps = {
  name: string
  eta: string
  rating?: number | null
  address: string
  heroImage?: string | null
  tags?: string[]
  isLiked?: boolean
  likeDisabled?: boolean
  onLikeClick?: () => void
  /** העסק סגור כעת לפי שעות הפעילות */
  isClosed?: boolean
}

export const RestaurantCard = ({
  name,
  eta,
  rating,
  address,
  heroImage,
  tags = [],
  isLiked = false,
  likeDisabled = false,
  onLikeClick,
  isClosed = false,
}: RestaurantCardProps) => {
  return (
    <div className={`group relative h-full rounded-2xl transition-shadow duration-300 hover:shadow-card-hover sm:rounded-3xl sm:hover:shadow-card-hover-lg ${isClosed ? 'opacity-95' : ''}`}>
      <article className={`flex h-full flex-col overflow-hidden rounded-[inherit] border bg-vantix-surface-raised transition-colors ${isClosed ? 'border-vantix-fg-muted/25' : 'border-vantix-cyan/20 group-hover:border-vantix-cyan/40'}`}>
      <div className="relative aspect-[5/2] w-full shrink-0 overflow-hidden lg:aspect-[2/1]">
        {heroImage ? (
          <img
            src={heroImage}
            alt=""
            className={`h-full w-full object-cover transition duration-700 group-hover:scale-105 ${isClosed ? 'grayscale-[0.35] brightness-75' : ''}`}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-vantix-cyan/8 via-brand-skySoft to-vantix-orange/5">
            <UtensilsCrossed className="h-10 w-10 text-vantix-cyan/40 sm:h-12 sm:w-12" />
            <span className="text-[10px] font-medium text-vantix-fg-subtle sm:text-xs">לוגו העסק</span>
          </div>
        )}
        {isClosed && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/45 backdrop-blur-[1px]">
            <span className="rounded-full border border-white/25 bg-black/55 px-4 py-2 text-sm font-bold text-white shadow-lg">
              סגור כעת להזמנות
            </span>
          </div>
        )}
        {onLikeClick && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (!likeDisabled) onLikeClick()
            }}
            disabled={likeDisabled}
            aria-label={isLiked ? 'הסר לייק' : 'הוסף לייק'}
            className="absolute left-3 top-3 z-10 flex items-center justify-center rounded-full border border-white/20 bg-vantix-surface-raised/90 p-2 backdrop-blur transition hover:scale-105 disabled:opacity-50 sm:left-4 sm:top-4"
          >
            <Heart
              className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : 'text-vantix-fg-muted'}`}
            />
          </button>
        )}
        {rating != null && !Number.isNaN(rating) && (
          <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full border border-vantix-cyan/25 bg-vantix-surface-raised/90 px-2.5 py-1 text-[11px] font-semibold text-vantix-cyan backdrop-blur sm:right-4 sm:top-4 sm:gap-2 sm:px-3 sm:py-1 sm:text-xs">
            <Star className="h-3.5 w-3.5 text-vantix-cyan sm:h-4 sm:w-4" />
            {rating.toFixed(1)}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between gap-2 p-3 lg:min-h-[6rem] lg:gap-3 lg:p-4">
        <header className="flex min-h-0 items-start justify-between gap-2 lg:gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-display text-base text-vantix-fg lg:text-lg">{name}</h3>
          </div>
          <div className={`max-w-[42%] shrink-0 truncate rounded-full border px-2.5 py-1 text-[11px] font-semibold lg:px-3 lg:py-1 lg:text-xs ${
            isClosed
              ? 'border-red-400/35 bg-red-500/10 text-red-600 dark:text-red-300'
              : 'border-vantix-cyan/25 bg-vantix-cyan/10 text-vantix-cyan'
          }`}>
            {isClosed ? 'סגור כעת' : eta}
          </div>
        </header>

        <div className="flex min-h-0 items-center gap-2 overflow-hidden text-[11px] text-vantix-fg-muted lg:gap-3 lg:text-xs">
          <span className="flex min-w-0 items-center gap-1">
            <MapPin className="h-3 w-3 shrink-0 text-vantix-cyan" />
            <span className="truncate">{address}</span>
          </span>
        </div>

        {tags.length > 0 ? (
          <div className="flex gap-2 overflow-hidden">
            {tags.map((tag) => (
              <span
                key={tag}
                className="truncate rounded-full bg-vantix-cyan/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-vantix-fg-muted"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      </article>
    </div>
  )
}

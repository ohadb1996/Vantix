import { Heart, MapPin, Star, UtensilsCrossed } from 'lucide-react'

type RestaurantCardProps = {
  name: string
  cuisine: string
  eta: string
  rating?: number | null
  priceLevel: string
  distance: string
  heroImage?: string | null
  tags?: string[]
  likeCount?: number
  isLiked?: boolean
  likeDisabled?: boolean
  onLikeClick?: () => void
}

export const RestaurantCard = ({
  name,
  cuisine,
  eta,
  rating,
  priceLevel,
  distance,
  heroImage,
  tags = [],
  likeCount = 0,
  isLiked = false,
  likeDisabled = false,
  onLikeClick,
}: RestaurantCardProps) => {
  return (
    <article className="group overflow-hidden rounded-2xl border border-vantix-cyan/20 bg-vantix-surface-raised transition hover:border-vantix-cyan/40 hover:shadow-[0_20px_50px_rgba(255,107,53,0.12)] sm:rounded-3xl sm:hover:shadow-[0_26px_70px_rgba(255,107,53,0.15)]">
      <div className="relative h-40 overflow-hidden sm:h-48">
        {heroImage ? (
          <img
            src={heroImage}
            alt=""
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-vantix-cyan/8 via-brand-skySoft to-vantix-orange/5">
            <UtensilsCrossed className="h-10 w-10 text-vantix-cyan/40 sm:h-12 sm:w-12" />
            <span className="text-[10px] font-medium text-vantix-fg-subtle sm:text-xs">לוגו העסק</span>
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
            className="absolute left-3 top-3 z-10 flex items-center gap-1 rounded-full border border-white/20 bg-vantix-surface-raised/90 px-2.5 py-1.5 text-[11px] font-semibold backdrop-blur transition hover:scale-105 disabled:opacity-50 sm:left-4 sm:top-4"
          >
            <Heart
              className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : 'text-vantix-fg-muted'}`}
            />
            {likeCount > 0 && <span className="text-vantix-fg">{likeCount}</span>}
          </button>
        )}
        {rating != null && !Number.isNaN(rating) && (
          <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full border border-vantix-cyan/25 bg-vantix-surface-raised/90 px-2.5 py-1 text-[11px] font-semibold text-vantix-cyan backdrop-blur sm:right-4 sm:top-4 sm:gap-2 sm:px-3 sm:py-1 sm:text-xs">
            <Star className="h-3.5 w-3.5 text-vantix-cyan sm:h-4 sm:w-4" />
            {rating.toFixed(1)}
          </div>
        )}
      </div>

      <div className="space-y-2 p-4 sm:space-y-3 sm:p-5">
        <header className="flex items-start justify-between gap-2 sm:gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-lg text-vantix-fg sm:text-xl">{name}</h3>
            <p className="truncate text-xs text-vantix-fg-muted sm:text-sm">{cuisine}</p>
          </div>
          <div className="shrink-0 rounded-full border border-vantix-cyan/25 bg-vantix-cyan/10 px-2.5 py-1 text-[11px] font-semibold text-vantix-cyan sm:px-3 sm:py-1 sm:text-xs">
            {eta}
          </div>
        </header>

        <div className="flex flex-wrap items-center gap-2 text-[11px] text-vantix-fg-muted sm:gap-3 sm:text-xs">
          <span className="rounded-full border border-vantix-cyan/20 px-3 py-1">
            {priceLevel}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3 text-vantix-cyan" />
            {distance}
          </span>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-vantix-cyan/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-vantix-fg-muted"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  )
}

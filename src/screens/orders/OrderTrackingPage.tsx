import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, MapPin, Package } from 'lucide-react'
import { useOrderTracking } from '../../hooks/useOrderTracking'
import { OrderTrackingMap } from '../../components/orders/OrderTrackingMap'
import { OrderCurrentStatusBar } from '../../components/orders/OrderCurrentStatusBar'
import { OrderTrackingHero } from '../../components/orders/OrderTrackingHero'
import { ROUTES } from '../../constants/app'
import { useAuth } from '../../context/AuthContext'

/** האם עדיין ממתינים לאישור/טיפול ראשוני של העסק */
function isAwaitingBusinessConfirmation(
  order: { status?: string } | null,
  delivery: unknown
): boolean {
  if (!order) return false
  return order.status === 'new' && !delivery
}

export function OrderTrackingPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { order, delivery, business, markers, stepIndex, loading, error } = useOrderTracking(orderId)

  const cancelled = order?.status === 'cancelled' || stepIndex < 0
  const showHero = isAwaitingBusinessConfirmation(order, delivery)

  if (!user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4" dir="rtl">
        <Package className="h-14 w-14 text-vantix-cyan/50" />
        <p className="text-vantix-fg-muted">יש להתחבר כדי לעקוב אחרי ההזמנה</p>
        <button
          type="button"
          onClick={() => navigate('/auth/login')}
          className="rounded-xl bg-vantix-cyan px-6 py-3 font-semibold text-black"
        >
          התחברות
        </button>
      </div>
    )
  }

  const addressLine =
    order?.fulfillment_type === 'pickup'
      ? 'איסוף עצמי'
      : [order?.delivery_street, order?.delivery_city].filter(Boolean).join(', ') || 'כתובת משלוח'

  return (
    <div className="relative -mx-3 -mt-4 min-h-[calc(100dvh-3.5rem)] sm:-mx-6" dir="rtl">
      <OrderTrackingMap markers={markers} />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-vantix-surface/40 via-transparent to-vantix-surface/70" />

      <div className="relative z-10 flex min-h-[calc(100dvh-3.5rem)] flex-col">
        {/* כותרת + פרטי הזמנה קטנים בימין למעלה */}
        <header className="pointer-events-auto flex flex-wrap items-start gap-2 px-4 pt-4 sm:px-6">
          <button
            type="button"
            onClick={() => navigate(ROUTES.ORDERS)}
            className="flex shrink-0 items-center gap-1 rounded-full border border-vantix-line/30 bg-vantix-surface-raised/90 px-3 py-2 text-sm text-vantix-fg-muted backdrop-blur-md hover:text-vantix-fg"
          >
            <ChevronLeft className="h-4 w-4" />
            ההזמנות שלי
          </button>

          {order && !loading && (
            <>
              <div className="w-fit max-w-[10.5rem] shrink-0 rounded-xl border border-vantix-line/20 bg-vantix-surface-raised/85 px-2.5 py-2 backdrop-blur-md sm:max-w-[12rem]">
                <p className="truncate text-xs font-semibold text-vantix-fg">{order.customer_name}</p>
                <p className="mt-0.5 flex items-start gap-1 text-[11px] leading-snug text-vantix-fg-muted">
                  <MapPin className="mt-px h-3 w-3 shrink-0 text-vantix-cyan" />
                  <span className="line-clamp-2">{addressLine}</span>
                </p>
                {business?.name && (
                  <p className="mt-1 truncate text-[10px] text-vantix-fg-subtle">{business.name}</p>
                )}
              </div>
              {showHero && (
                <div className="max-w-[10rem] shrink sm:max-w-[11rem]">
                  <OrderTrackingHero compact />
                </div>
              )}
            </>
          )}
        </header>

        {error && (
          <div className="pointer-events-auto mx-4 mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200 sm:mx-6">
            {error}
          </div>
        )}

        <div className="flex-1" />
      </div>

      <OrderCurrentStatusBar
        activeIndex={Math.max(0, stepIndex)}
        cancelled={cancelled}
        loading={loading}
      />
    </div>
  )
}

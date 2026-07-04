import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { getMyOrders, getBusinessesWithMenus } from '../../services/orderService'
import { useAuth } from '../../context/AuthContext'
import { History, Loader2, Package, ChevronLeft, UtensilsCrossed } from 'lucide-react'
import { ROUTES } from '../../constants/app'

const statusLabels: Record<string, string> = {
  new: 'הזמנה חדשה',
  accepted: 'אושרה על ידי העסק',
  delivery_created: 'משלוח נוצר',
  cancelled: 'בוטלה',
}

export const OrderHistoryPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: businesses = [] } = useQuery({
    queryKey: ['businessesWithMenus'],
    queryFn: getBusinessesWithMenus,
  })
  const businessNameMap = Object.fromEntries(businesses.map((b) => [b.businessId, b.businessName]))

  const { data: orders, isLoading, error } = useQuery({
    queryKey: ['myOrders', user?.uid],
    queryFn: () => (user?.uid ? getMyOrders(user.uid) : Promise.resolve([])),
    enabled: !!user?.uid,
  })

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-16 px-4" dir="rtl">
        <Package className="h-16 w-16 text-vantix-cyan/50" />
        <p className="text-center text-vantix-fg-muted">יש להתחבר כדי לראות היסטוריית הזמנות</p>
        <button
          type="button"
          onClick={() => navigate('/auth/login' as any)}
          className="rounded-xl bg-vantix-orange dark:bg-vantix-cyan px-6 py-3 font-semibold text-white dark:text-black hover:brightness-110"
        >
          התחברות
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-10" dir="rtl">
      <header className="flex items-center justify-between gap-4 border-b border-vantix-cyan/20 pb-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-vantix-fg-muted hover:text-vantix-fg transition"
          aria-label="חזרה"
        >
          <ChevronLeft className="h-5 w-5" />
          חזרה
        </button>
        <h1 className="font-display text-2xl text-vantix-fg flex items-center gap-2">
          <History className="h-6 w-6 text-vantix-cyan" />
          היסטוריית הזמנות
        </h1>
      </header>

      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-12 text-vantix-fg-muted">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>טוען הזמנות...</span>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
          לא ניתן לטעון את ההזמנות. ייתכן שנדרש אינדקס ב-Firebase (Orders, created_by_uid).
        </div>
      )}

      {!isLoading && !error && (!orders || orders.length === 0) && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-vantix-cyan/25 bg-vantix-surface-raised p-12 text-center">
          <UtensilsCrossed className="h-14 w-14 text-vantix-cyan/50" />
          <p className="text-vantix-fg-muted">עדיין אין הזמנות</p>
          <p className="text-sm text-vantix-fg-subtle">ההזמנות שתבצע יופיעו כאן</p>
          <Link
            to={ROUTES.RESTAURANTS}
            className="rounded-xl bg-vantix-orange dark:bg-vantix-cyan px-6 py-3 font-semibold text-white dark:text-black hover:brightness-110"
          >
            לגלות מסעדות
          </Link>
        </div>
      )}

      {!isLoading && !error && orders && orders.length > 0 && (
        <ul className="space-y-4">
          {orders.map((order) => {
            const total = order.items?.reduce((s, i) => s + i.price * i.quantity, 0) ?? 0
            const name = order.orderId && businessNameMap[order.business_id]
              ? businessNameMap[order.business_id]
              : `עסק ${(order.business_id || '').slice(0, 8)}`
            const date = order.createdAt
              ? new Date(order.createdAt).toLocaleDateString('he-IL', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '—'
            return (
              <li
                key={order.orderId || order.createdAt || Math.random()}
                className="rounded-2xl border border-vantix-cyan/20 bg-vantix-surface-raised p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-vantix-fg">{name}</p>
                    <p className="text-sm text-vantix-fg-subtle">{date}</p>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-vantix-cyan">₪{total.toFixed(2)}</p>
                    <p className="text-xs text-vantix-fg-subtle">
                      {statusLabels[order.status] || order.status}
                    </p>
                  </div>
                </div>
                {order.items?.length ? (
                  <p className="mt-2 text-sm text-vantix-fg-muted truncate">
                    {order.items.map((i) => `${i.name} × ${i.quantity}`).join(' • ')}
                  </p>
                ) : null}
                <Link
                  to={order.orderId ? ROUTES.ORDER_TRACKING(order.orderId) : ROUTES.ORDERS}
                  className="mt-3 inline-block text-sm font-medium text-vantix-cyan hover:underline"
                >
                  מעקב אחרי ההזמנה
                </Link>
                <Link
                  to={ROUTES.RESTAURANT_MENU(order.business_id)}
                  className="mt-1 mr-4 inline-block text-sm text-vantix-fg-subtle hover:text-vantix-cyan hover:underline"
                >
                  להזמין שוב
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

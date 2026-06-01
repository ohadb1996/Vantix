import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getUserProfile,
  getBusinessCreditsBalance,
  adjustBusinessCredits,
} from '../../services/adminService'
import { getMyOrders } from '../../services/orderService'
import { ROUTES } from '../../constants/app'
import { ArrowRight, Loader2, Receipt, UserCircle, Plus, Minus, Wallet } from 'lucide-react'
import { useAdminKing } from '../../hooks/useCurrentUserKind'
import type { Order } from '../../types/order'

const roleLabels: Record<string, string> = {
  customer: 'לקוח',
  business: 'עסק',
  courier: 'שליח',
  admin: 'אדמין',
}

function orderTotal(order: Order): number {
  if (!order.items?.length) return 0
  return order.items.reduce((sum, line) => sum + (line.price ?? 0) * (line.quantity ?? 0), 0)
}

export function AdminUserProfilePage() {
  const { uid } = useParams<{ uid: string }>()
  const queryClient = useQueryClient()
  const { isAdminKing, isLoading: loadingKing } = useAdminKing()
  const [creditsAmount, setCreditsAmount] = useState('')
  const [creditsLoading, setCreditsLoading] = useState(false)
  const [creditsError, setCreditsError] = useState<string | null>(null)

  const { data: userDoc, isLoading: loadingUser } = useQuery({
    queryKey: ['adminUser', uid],
    queryFn: () => (uid ? getUserProfile(uid) : Promise.resolve(null)),
    enabled: !!uid,
  })

  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ['adminUserOrders', uid],
    queryFn: () => (uid ? getMyOrders(uid) : Promise.resolve([])),
    enabled: !!uid,
  })

  const { data: creditsBalance = 0, refetch: refetchCredits } = useQuery({
    queryKey: ['adminBusinessCredits', uid],
    queryFn: () => (uid ? getBusinessCreditsBalance(uid) : Promise.resolve(0)),
    enabled: !!uid && userDoc?.role === 'business',
  })

  const totalPaid = orders.reduce((sum, o) => sum + orderTotal(o), 0)
  const isLoading = loadingUser || loadingOrders
  const showCreditsSection = isAdminKing && !loadingKing && userDoc?.role === 'business' && !!uid

  const handleAdjustCredits = async (delta: number) => {
    if (!uid || !creditsAmount) return
    const num = parseInt(creditsAmount, 10)
    if (isNaN(num) || num <= 0) {
      setCreditsError('הזן מספר חיובי')
      return
    }
    const actualDelta = delta > 0 ? num : -num
    setCreditsLoading(true)
    setCreditsError(null)
    try {
      const res = await adjustBusinessCredits(
        uid,
        actualDelta,
        `תמיכה – ${actualDelta > 0 ? 'הוספה' : 'הפחתה'} על ידי אדמין`
      )
      if (res.success) {
        setCreditsAmount('')
        await refetchCredits()
        queryClient.invalidateQueries({ queryKey: ['adminBusinessCredits', uid] })
      } else {
        setCreditsError(res.error ?? 'שגיאה')
      }
    } catch (e) {
      setCreditsError(e instanceof Error ? e.message : 'שגיאה')
    } finally {
      setCreditsLoading(false)
    }
  }

  if (!uid) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
        חסר מזהה משתמש.
      </div>
    )
  }

  if (isLoading && !userDoc && orders.length === 0) {
    return (
      <div className="flex min-h-[300px] items-center justify-center gap-2 text-vantix-fg-muted">
        <Loader2 className="h-6 w-6 animate-spin" />
        טוען פרופיל...
      </div>
    )
  }

  const role = userDoc?.role ?? '—'
  const displayName = userDoc?.displayName || userDoc?.email || uid.slice(0, 8)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-vantix-fg-muted">
        <Link to={ROUTES.ADMIN_USERS} className="hover:text-vantix-cyan">
          כל המשתמשים
        </Link>
        <ArrowRight className="h-4 w-4" />
        <span className="text-vantix-fg">{displayName}</span>
      </div>

      <header className="flex flex-wrap items-start gap-4 rounded-2xl border border-vantix-cyan/20 bg-vantix-surface-raised p-4 sm:p-6">
        <UserCircle className="h-14 w-14 text-brand-slate/40 shrink-0" />
        <div>
          <h1 className="font-display text-xl text-vantix-fg">{displayName}</h1>
          <p className="text-sm text-vantix-fg-muted">{userDoc?.email ?? '—'}</p>
          <p className="mt-1 text-xs font-semibold text-vantix-cyan">
            {roleLabels[role] ?? role}
          </p>
        </div>
      </header>

      {showCreditsSection && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 sm:p-6">
          <h2 className="font-display text-lg text-vantix-fg flex items-center gap-2 mb-4">
            <Wallet className="h-5 w-5 text-amber-600" />
            ניהול קרדיטים (אדמין מלך בלבד)
          </h2>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <p className="text-sm text-vantix-fg-muted mb-1">יתרה נוכחית</p>
              <p className="text-2xl font-bold text-vantix-fg">{Number(creditsBalance).toFixed(2)} קרדיטים</p>
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="block text-xs text-vantix-fg-muted mb-1">כמות להוספה/הפחתה</label>
              <input
                type="number"
                min="1"
                value={creditsAmount}
                onChange={(e) => setCreditsAmount(e.target.value.replace(/\D/g, ''))}
                placeholder="לדוגמה 100"
                className="w-full rounded-lg border border-amber-200 bg-vantix-surface-raised px-3 py-2 text-vantix-fg focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                disabled={creditsLoading}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleAdjustCredits(1)}
                disabled={creditsLoading || !creditsAmount}
                className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creditsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                הוסף
              </button>
              <button
                type="button"
                onClick={() => handleAdjustCredits(-1)}
                disabled={creditsLoading || !creditsAmount}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creditsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Minus className="h-4 w-4" />}
                הפחת
              </button>
            </div>
          </div>
          {creditsError && (
            <p className="mt-2 text-sm text-red-600">{creditsError}</p>
          )}
        </section>
      )}

      <section className="rounded-2xl border border-vantix-cyan/20 bg-vantix-surface-raised p-4 sm:p-6">
        <h2 className="font-display text-lg text-vantix-fg flex items-center gap-2">
          <Receipt className="h-5 w-5 text-vantix-cyan" />
          הזמנות והתשלומים
        </h2>
        <p className="text-sm text-vantix-fg-muted mt-1">
          סה״כ {orders.length} הזמנות, סכום ששולם (מחיר פריטים): ₪{totalPaid.toFixed(2)}
        </p>
        <ul className="mt-4 space-y-3 divide-y divide-vantix-cyan/15">
          {orders.map((order) => (
            <li key={order.orderId ?? order.createdAt} className="pt-3 first:pt-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-medium text-vantix-fg">
                  הזמנה {order.orderId?.slice(0, 8) ?? order.createdAt?.slice(0, 10)}
                </span>
                <span className="text-sm font-semibold text-vantix-cyan">
                  ₪{orderTotal(order).toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-vantix-fg-subtle mt-0.5">
                עסק: {order.business_id?.slice(0, 8)} · {order.createdAt ?? '—'}
              </p>
              {order.status && (
                <span className="inline-block mt-1 rounded-full bg-vantix-cyan/10 px-2 py-0.5 text-[11px] font-semibold text-vantix-fg-muted">
                  {order.status}
                </span>
              )}
            </li>
          ))}
        </ul>
        {orders.length === 0 && !loadingOrders && (
          <p className="py-4 text-center text-vantix-fg-subtle">אין הזמנות למשתמש זה.</p>
        )}
      </section>
    </div>
  )
}

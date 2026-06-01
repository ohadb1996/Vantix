import { useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { placeOrder } from '../../services/orderService'
import type { OrderCreate, OrderItem } from '../../types/order'
import type { MenuItem } from '../../types/menu'
import { isValidIsraeliPhone } from '../../utils/phone'
import { ShoppingCart, Plus, Minus, Loader2, Check, ArrowRight, X } from 'lucide-react'
import { useMenu } from '../../hooks/useMenu'
import { useCart, type CartSelectedOption } from '../../hooks/useCart'
import { ROUTES } from '../../constants/app'

const REQUIRED_MSG = 'שדה חובה'

export const RestaurantMenuPage = () => {
  const { businessId } = useParams<{ businessId: string }>()
  const navigate = useNavigate()
  const { menu, businessName, businessLogoUrl, isLoading: loading } = useMenu(businessId)
  const { cart, addToCart, removeFromCart, clearCart, totalItems, totalPrice } = useCart(businessId, menu?.items ?? null)

  const [placing, setPlacing] = useState(false)
  const [orderDone, setOrderDone] = useState<string | null>(null)
  const [showCheckout, setShowCheckout] = useState(false)
  const [showCartPanel, setShowCartPanel] = useState(false)
  const [addItemModal, setAddItemModal] = useState<MenuItem | null>(null)
  const [sectionSelections, setSectionSelections] = useState<Record<string, string | string[]>>({})
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({
    customer_name: '',
    customer_phone: '',
    customer_phone_secondary: '',
    delivery_city: '',
    delivery_street: '',
    delivery_building_number: '',
    delivery_floor: '',
    delivery_apartment: '',
    delivery_notes: '',
  })

  const validate = useCallback((): boolean => {
    const err: Record<string, string> = {}
    const name = form.customer_name.trim()
    const phone = form.customer_phone.trim()
    const city = form.delivery_city.trim()
    const street = form.delivery_street.trim()
    const building = form.delivery_building_number.trim()
    if (!name) err.customer_name = REQUIRED_MSG
    if (!phone) err.customer_phone = REQUIRED_MSG
    else if (!isValidIsraeliPhone(phone)) err.customer_phone = 'נא להזין מספר טלפון ישראלי תקין (05x-xxx-xxxx)'
    const phoneSecondary = form.customer_phone_secondary?.trim()
    if (phoneSecondary && !isValidIsraeliPhone(phoneSecondary)) err.customer_phone_secondary = 'נא להזין מספר טלפון ישראלי תקין (05x-xxx-xxxx)'
    if (!city) err.delivery_city = REQUIRED_MSG
    if (!street) err.delivery_street = REQUIRED_MSG
    if (!building) err.delivery_building_number = REQUIRED_MSG
    setFormErrors(err)
    return Object.keys(err).length === 0
  }, [form])

  const handlePlaceOrder = async () => {
    if (!businessId || cart.length === 0) return
    if (!validate()) return
    setPlacing(true)
    setFormErrors({})
    try {
      const items: OrderItem[] = cart.map((l) => ({
        menuItemId: l.item.id,
        name: l.item.name,
        price: l.item.price,
        quantity: l.quantity,
        selectedOptions: l.selectedOptions?.map((o) => ({
          sectionTitle: o.sectionTitle,
          optionLabel: o.optionLabel,
          priceCents: o.priceCents,
        })),
      }))
      const order: OrderCreate = {
        business_id: businessId,
        customer_name: form.customer_name.trim(),
        customer_phone: form.customer_phone.trim(),
        ...(form.customer_phone_secondary?.trim() && { customer_phone_secondary: form.customer_phone_secondary.trim() }),
        delivery_city: form.delivery_city.trim(),
        delivery_street: form.delivery_street.trim(),
        delivery_building_number: form.delivery_building_number.trim(),
        delivery_floor: form.delivery_floor?.trim() || undefined,
        delivery_apartment: form.delivery_apartment?.trim() || undefined,
        delivery_notes: form.delivery_notes?.trim() || undefined,
        items,
        status: 'new',
      }
      await placeOrder(order)
      setOrderDone('ok')
      clearCart()
      setShowCheckout(false)
    } catch {
      setFormErrors({ _submit: 'שגיאה בשליחת ההזמנה. נסה שוב.' })
    } finally {
      setPlacing(false)
    }
  }

  if (!businessId) return null
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24" aria-busy="true">
        <Loader2 className="h-10 w-10 animate-spin text-vantix-cyan" aria-hidden />
        <p className="text-vantix-fg-muted">טוען תפריט...</p>
      </div>
    )
  }
  if (!menu) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-800 text-center">
        <p className="mb-4">התפריט לא נמצא.</p>
        <button
          type="button"
          className="rounded-xl bg-amber-100 px-4 py-2 font-medium hover:bg-amber-200"
          onClick={() => navigate(ROUTES.RESTAURANTS)}
        >
          חזרה לרשימת העסקים
        </button>
      </div>
    )
  }

  const categoriesList = Object.values(menu.categories).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
  const itemsList = Object.values(menu.items).filter((i) => i.available !== false).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))

  const handleAddItem = (item: MenuItem) => {
    if (item.sections && item.sections.length > 0) {
      setAddItemModal(item)
      setSectionSelections({})
    } else {
      addToCart(item)
    }
  }

  const handleAddItemConfirm = () => {
    if (!addItemModal?.sections?.length) return
    const selectedOptions: CartSelectedOption[] = []
    for (const sec of addItemModal.sections) {
      const val = sectionSelections[sec.id]
      if (sec.choiceType === 'single' && typeof val === 'string') {
        const opt = sec.options.find((o) => o.id === val)
        if (opt) selectedOptions.push({ sectionId: sec.id, sectionTitle: sec.title, optionId: opt.id, optionLabel: opt.label, priceCents: opt.priceCents })
      }
      if (sec.choiceType === 'multiple' && Array.isArray(val)) {
        for (const optionId of val) {
          const opt = sec.options.find((o) => o.id === optionId)
          if (opt) selectedOptions.push({ sectionId: sec.id, sectionTitle: sec.title, optionId: opt.id, optionLabel: opt.label, priceCents: opt.priceCents })
        }
      }
    }
    addToCart(addItemModal, selectedOptions)
    setAddItemModal(null)
  }

  return (
    <div className="space-y-8 pb-28" dir="rtl">
      {/* Floating cart badge – מופיע רק כשיש פריטים */}
      {totalItems > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-20 left-4 right-4 z-40 flex justify-center md:left-auto md:right-8 md:bottom-8 md:w-auto"
        >
          <button
            type="button"
            onClick={() => setShowCartPanel(true)}
            className="flex items-center gap-2 rounded-2xl border-2 border-vantix-cyan/30 bg-vantix-surface-raised px-5 py-3 shadow-vantix font-semibold text-vantix-fg hover:border-vantix-cyan/40 hover:bg-vantix-surface-raised focus:outline-none focus:ring-2 focus:ring-vantix-cyan"
            aria-label="פתח עגלה"
          >
            <ShoppingCart className="h-5 w-5 text-vantix-cyan" />
            <span>{totalItems} פריטים</span>
            <span className="text-vantix-cyan">₪{totalPrice.toFixed(2)}</span>
          </button>
        </motion.div>
      )}

      {showCartPanel && totalItems > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cart-panel-title"
          onClick={() => setShowCartPanel(false)}
        >
          <div
            className="w-full max-w-md max-h-[85vh] rounded-t-2xl sm:rounded-2xl bg-vantix-surface-raised shadow-xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-vantix-cyan/20">
              <h2 id="cart-panel-title" className="font-bold text-lg text-vantix-fg flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-vantix-cyan" />
                העגלה שלי
              </h2>
              <button
                type="button"
                onClick={() => setShowCartPanel(false)}
                className="p-2 rounded-full text-vantix-fg-muted hover:bg-vantix-cyan/10 hover:text-vantix-cyan"
                aria-label="סגור"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <ul className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0">
              {cart.map((l, idx) => {
                const lineTotal = l.item.price * l.quantity + (l.selectedOptions ?? []).reduce((s, o) => s + ((o.priceCents ?? 0) / 100) * l.quantity, 0)
                return (
                  <li key={`${l.item.id}-${idx}-${(l.selectedOptions ?? []).map((o) => o.optionId).join(',')}`} className="flex flex-col gap-0.5 text-sm py-2.5 border-b border-vantix-cyan/20 last:border-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate flex-1 font-medium">{l.item.name} × {l.quantity}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => removeFromCart(l.item.id, l.selectedOptions)}
                          className="p-1.5 rounded-lg text-vantix-fg-muted hover:bg-vantix-cyan/10 hover:text-vantix-cyan"
                          aria-label={`הפחת כמות ${l.item.name}`}
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-6 text-center font-medium">{l.quantity}</span>
                        <button
                          type="button"
                          onClick={() => addToCart(l.item, l.selectedOptions)}
                          className="p-1.5 rounded-lg text-vantix-fg-muted hover:bg-vantix-cyan/10 hover:text-vantix-cyan"
                          aria-label={`הוסף כמות ${l.item.name}`}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    {l.selectedOptions && l.selectedOptions.length > 0 && (
                      <p className="text-xs text-vantix-fg-muted truncate pr-2">{l.selectedOptions.map((o) => o.optionLabel).join(' • ')}</p>
                    )}
                    <span className="font-semibold text-vantix-cyan">₪{lineTotal.toFixed(2)}</span>
                  </li>
                )
              })}
            </ul>
            <div className="p-4 border-t border-vantix-cyan/20 bg-vantix-surface-raised">
              <p className="font-bold text-vantix-fg text-lg mb-3">
                סה״כ: ₪{totalPrice.toFixed(2)}
              </p>
              <button
                type="button"
                onClick={() => { setShowCartPanel(false); setShowCheckout(true) }}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-vantix-cyan to-vantix-orange text-white py-3.5 font-semibold hover:bg-gradient-to-l from-vantix-cyan to-vantix-orange/90 focus:outline-none focus:ring-2 focus:ring-vantix-cyan focus:ring-offset-2"
              >
                להזמנה
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* תמונת נושא – רוחב מלא של האזור, מתחילה מאחורי הסרגל */}
      <header className="relative -mx-3 -mt-[5.5rem] sm:-mx-6 sm:-mt-[6rem] lg:-mx-10 lg:-mt-[7.5rem] rounded-b-lg overflow-hidden shadow-[0_18px_50px_rgba(0,0,0,0.08)]">
        <div className="relative w-full aspect-[16/9] min-h-[10rem] bg-gradient-to-br from-vantix-cyan/20 via-white to-vantix-orange/10">
          {businessLogoUrl ? (
            <img
              src={businessLogoUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
        </div>
      </header>

      {/* שם העסק מתחת לתמונה – כרטיס פרימיום */}
      <div className="flex justify-center -mt-3 sm:-mt-4 px-2">
        <div className="relative rounded-2xl bg-vantix-surface-raised/95 px-8 py-5 sm:px-10 sm:py-6 shadow-[0_12px_40px_rgba(0,0,0,0.07),0_0_0_1px_rgba(0,0,0,0.04)] backdrop-blur-sm overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-vantix-orange/60 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-vantix-orange/25 to-transparent" />
          <h1 className="relative font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-vantix-fg text-center tracking-tight">
            {businessName || 'תפריט'}
          </h1>
        </div>
      </div>

      {orderDone && (
        <div
          className="rounded-2xl border border-green-200 bg-green-50 p-5 text-green-800 flex flex-col gap-4"
          role="status"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-green-200">
              <Check className="h-6 w-6 text-green-700" />
            </span>
            <div>
              <p className="font-semibold">ההזמנה נשלחה</p>
              <p className="text-sm text-green-700/90">בעל העסק קיבל התראה ויוכל ליצור משלוח מהאפליקציה.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setOrderDone(null)}
              className="flex-1 rounded-xl border-2 border-green-300 bg-vantix-surface-raised py-2.5 font-medium text-green-800 hover:bg-green-50"
            >
              הזמנה נוספת
            </button>
            <button
              type="button"
              onClick={() => navigate(ROUTES.RESTAURANTS)}
              className="flex-1 rounded-xl bg-green-600 py-2.5 font-medium text-white hover:bg-green-700"
            >
              חזרה למסעדות
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {categoriesList.length > 0
            ? categoriesList.map((cat) => {
                const catItems = itemsList.filter((i) => i.categoryId === cat.id)
                if (catItems.length === 0) return null
                return (
                  <section key={cat.id} aria-labelledby={`cat-${cat.id}`}>
                    <h2 id={`cat-${cat.id}`} className="text-lg font-bold text-vantix-fg border-b-2 border-vantix-cyan/25 pb-2 mb-3">
                      {cat.name}
                    </h2>
                    <ul className="space-y-2">
                      {catItems.map((item) => (
                        <li
                          key={item.id}
                          className="flex items-center justify-between gap-4 rounded-xl border border-vantix-cyan/20 bg-vantix-surface-raised p-4 shadow-sm hover:border-vantix-cyan/25 transition"
                        >
                          {item.imageUrl && (
                            <img
                              src={item.imageUrl}
                              alt=""
                              className="h-16 w-16 rounded-lg object-cover border border-vantix-cyan/20 shrink-0"
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-vantix-fg">{item.name}</p>
                            {item.description && <p className="text-sm text-vantix-fg-muted mt-0.5">{item.description}</p>}
                            {item.sections && item.sections.length > 0 && (
                              <p className="text-xs text-vantix-cyan/80 mt-1">יש אפשרויות לבחירה</p>
                            )}
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-vantix-cyan font-semibold whitespace-nowrap">₪{item.price.toFixed(2)}</span>
                            <button
                              type="button"
                              onClick={() => handleAddItem(item)}
                              className="rounded-full bg-gradient-to-l from-vantix-cyan to-vantix-orange/20 p-2.5 text-vantix-cyan hover:bg-gradient-to-l from-vantix-cyan to-vantix-orange/30 focus:outline-none focus:ring-2 focus:ring-vantix-cyan/50"
                              aria-label={`הוסף ${item.name} לעגלה`}
                            >
                              <Plus className="h-5 w-5" />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </section>
                )
              })
            : (
              <ul className="space-y-2">
                {itemsList.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-vantix-cyan/20 bg-vantix-surface-raised p-4 shadow-sm"
                  >
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt=""
                        className="h-16 w-16 rounded-lg object-cover border border-vantix-cyan/20 shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-vantix-fg">{item.name}</p>
                      {item.description && <p className="text-sm text-vantix-fg-muted">{item.description}</p>}
                      {item.sections && item.sections.length > 0 && (
                        <p className="text-xs text-vantix-cyan/80 mt-1">יש אפשרויות לבחירה</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-vantix-cyan font-semibold">₪{item.price.toFixed(2)}</span>
                      <button
                        type="button"
                        onClick={() => handleAddItem(item)}
                        className="rounded-full bg-gradient-to-l from-vantix-cyan to-vantix-orange/20 p-2.5 text-vantix-cyan hover:bg-gradient-to-l from-vantix-cyan to-vantix-orange/30"
                        aria-label={`הוסף ${item.name} לעגלה`}
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-4 rounded-2xl border-2 border-vantix-cyan/25 bg-vantix-surface-raised p-4 shadow-lg">
            <h3 className="font-bold text-vantix-fg flex items-center gap-2 mb-2">
              <ShoppingCart className="h-5 w-5 text-vantix-cyan" />
              העגלה
              {totalItems > 0 && <span className="text-vantix-cyan">({totalItems})</span>}
            </h3>
            {cart.length === 0 ? (
              <p className="text-sm text-vantix-fg-subtle py-6 text-center">הוסף פריטים מהתפריט</p>
            ) : (
              <>
                <ul className="mt-3 space-y-2 max-h-52 overflow-y-auto">
                  {cart.map((l, idx) => {
                    const lineTotal = l.item.price * l.quantity + (l.selectedOptions ?? []).reduce((s, o) => s + ((o.priceCents ?? 0) / 100) * l.quantity, 0)
                    return (
                      <li key={`${l.item.id}-${idx}-${(l.selectedOptions ?? []).map((o) => o.optionId).join(',')}`} className="flex flex-col gap-0.5 text-sm py-1.5 border-b border-vantix-cyan/20 last:border-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate flex-1 font-medium">{l.item.name} × {l.quantity}</span>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => removeFromCart(l.item.id, l.selectedOptions)}
                              className="p-1.5 rounded-lg text-vantix-fg-muted hover:bg-vantix-cyan/10 hover:text-vantix-cyan"
                              aria-label={`הפחת כמות ${l.item.name}`}
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="w-6 text-center font-medium">{l.quantity}</span>
                            <button
                              type="button"
                              onClick={() => addToCart(l.item, l.selectedOptions)}
                              className="p-1.5 rounded-lg text-vantix-fg-muted hover:bg-vantix-cyan/10 hover:text-vantix-cyan"
                              aria-label={`הוסף כמות ${l.item.name}`}
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        {l.selectedOptions && l.selectedOptions.length > 0 && (
                          <p className="text-xs text-vantix-fg-muted truncate pr-2">{l.selectedOptions.map((o) => o.optionLabel).join(' • ')}</p>
                        )}
                        <span className="font-semibold text-vantix-cyan">₪{lineTotal.toFixed(2)}</span>
                      </li>
                    )
                  })}
                </ul>
                <p className="mt-3 pt-3 border-t border-vantix-cyan/20 font-bold text-vantix-fg text-lg">
                  סה״כ: ₪{totalPrice.toFixed(2)}
                </p>
                <button
                  type="button"
                  onClick={() => setShowCheckout(true)}
                  className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-vantix-cyan to-vantix-orange text-white py-3.5 font-semibold hover:bg-gradient-to-l from-vantix-cyan to-vantix-orange/90 focus:outline-none focus:ring-2 focus:ring-vantix-cyan focus:ring-offset-2"
                >
                  להזמנה
                  <ArrowRight className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {showCheckout && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="checkout-title"
          onClick={() => { setShowCheckout(false); setFormErrors({}) }}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-vantix-surface-raised p-6 shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="checkout-title" className="text-xl font-bold text-vantix-fg mb-4">
              פרטי משלוח
            </h3>
            {formErrors._submit && (
              <p className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">
                {formErrors._submit}
              </p>
            )}
            <div className="space-y-4">
              <div>
                <label htmlFor="customer_name" className="block text-sm font-medium text-vantix-fg mb-1">שם מלא *</label>
                <input
                  id="customer_name"
                  placeholder="שם מלא"
                  value={form.customer_name}
                  onChange={(e) => setForm((f) => ({ ...f, customer_name: e.target.value }))}
                  className={`w-full rounded-xl border px-3 py-2.5 ${formErrors.customer_name ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                  aria-invalid={!!formErrors.customer_name}
                  aria-describedby={formErrors.customer_name ? 'err-name' : undefined}
                />
                {formErrors.customer_name && <p id="err-name" className="text-red-600 text-sm mt-1">{formErrors.customer_name}</p>}
              </div>
              <div>
                <label htmlFor="customer_phone" className="block text-sm font-medium text-vantix-fg mb-1">טלפון *</label>
                <input
                  id="customer_phone"
                  placeholder="05x-xxx-xxxx"
                  type="tel"
                  inputMode="numeric"
                  value={form.customer_phone}
                  onChange={(e) => setForm((f) => ({ ...f, customer_phone: e.target.value }))}
                  className={`w-full rounded-xl border px-3 py-2.5 ${formErrors.customer_phone ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                  aria-invalid={!!formErrors.customer_phone}
                  aria-describedby={formErrors.customer_phone ? 'err-phone' : undefined}
                />
                {formErrors.customer_phone && <p id="err-phone" className="text-red-600 text-sm mt-1">{formErrors.customer_phone}</p>}
              </div>
              <div>
                <label htmlFor="customer_phone_secondary" className="block text-sm font-medium text-vantix-fg-muted mb-1">טלפון משני (אופציונלי)</label>
                <input
                  id="customer_phone_secondary"
                  placeholder="05x-xxx-xxxx"
                  type="tel"
                  inputMode="numeric"
                  value={form.customer_phone_secondary}
                  onChange={(e) => setForm((f) => ({ ...f, customer_phone_secondary: e.target.value }))}
                  className={`w-full rounded-xl border px-3 py-2.5 ${formErrors.customer_phone_secondary ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                  aria-invalid={!!formErrors.customer_phone_secondary}
                  aria-describedby={formErrors.customer_phone_secondary ? 'err-phone-secondary' : undefined}
                />
                {formErrors.customer_phone_secondary && <p id="err-phone-secondary" className="text-red-600 text-sm mt-1">{formErrors.customer_phone_secondary}</p>}
              </div>
              <div>
                <label htmlFor="delivery_city" className="block text-sm font-medium text-vantix-fg mb-1">עיר *</label>
                <input
                  id="delivery_city"
                  placeholder="עיר"
                  value={form.delivery_city}
                  onChange={(e) => setForm((f) => ({ ...f, delivery_city: e.target.value }))}
                  className={`w-full rounded-xl border px-3 py-2.5 ${formErrors.delivery_city ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                  aria-invalid={!!formErrors.delivery_city}
                />
                {formErrors.delivery_city && <p className="text-red-600 text-sm mt-1">{formErrors.delivery_city}</p>}
              </div>
              <div>
                <label htmlFor="delivery_street" className="block text-sm font-medium text-vantix-fg mb-1">רחוב *</label>
                <input
                  id="delivery_street"
                  placeholder="רחוב"
                  value={form.delivery_street}
                  onChange={(e) => setForm((f) => ({ ...f, delivery_street: e.target.value }))}
                  className={`w-full rounded-xl border px-3 py-2.5 ${formErrors.delivery_street ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                  aria-invalid={!!formErrors.delivery_street}
                />
                {formErrors.delivery_street && <p className="text-red-600 text-sm mt-1">{formErrors.delivery_street}</p>}
              </div>
              <div>
                <label htmlFor="delivery_building_number" className="block text-sm font-medium text-vantix-fg mb-1">מספר בית *</label>
                <input
                  id="delivery_building_number"
                  placeholder="מספר בית"
                  value={form.delivery_building_number}
                  onChange={(e) => setForm((f) => ({ ...f, delivery_building_number: e.target.value }))}
                  className={`w-full rounded-xl border px-3 py-2.5 ${formErrors.delivery_building_number ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                  aria-invalid={!!formErrors.delivery_building_number}
                />
                {formErrors.delivery_building_number && <p className="text-red-600 text-sm mt-1">{formErrors.delivery_building_number}</p>}
              </div>
              <div>
                <label htmlFor="delivery_floor" className="block text-sm font-medium text-vantix-fg-muted mb-1">קומה (אופציונלי)</label>
                <input
                  id="delivery_floor"
                  placeholder="קומה"
                  value={form.delivery_floor}
                  onChange={(e) => setForm((f) => ({ ...f, delivery_floor: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2.5"
                />
              </div>
              <div>
                <label htmlFor="delivery_apartment" className="block text-sm font-medium text-vantix-fg-muted mb-1">דירה (אופציונלי)</label>
                <input
                  id="delivery_apartment"
                  placeholder="דירה"
                  value={form.delivery_apartment}
                  onChange={(e) => setForm((f) => ({ ...f, delivery_apartment: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2.5"
                />
              </div>
              <div>
                <label htmlFor="delivery_notes" className="block text-sm font-medium text-vantix-fg-muted mb-1">הערות למשלוח</label>
                <textarea
                  id="delivery_notes"
                  placeholder="הערות לבעל העסק או לשליח"
                  value={form.delivery_notes}
                  onChange={(e) => setForm((f) => ({ ...f, delivery_notes: e.target.value }))}
                  rows={2}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2.5 resize-none"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => { setShowCheckout(false); setFormErrors({}) }}
                disabled={placing}
                className="flex-1 rounded-xl border-2 border-gray-300 py-3 font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                ביטול
              </button>
              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={placing}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-vantix-cyan to-vantix-orange text-white py-3 font-semibold hover:bg-gradient-to-l from-vantix-cyan to-vantix-orange/90 disabled:opacity-70"
              >
                {placing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
                שליחת הזמנה
              </button>
            </div>
          </div>
        </div>
      )}

      {addItemModal && addItemModal.sections && addItemModal.sections.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-item-title"
          onClick={() => setAddItemModal(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-vantix-surface-raised shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {addItemModal.imageUrl && (
              <div className="relative w-full aspect-[16/10] overflow-hidden rounded-t-2xl bg-vantix-surface">
                <img
                  src={addItemModal.imageUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover object-center"
                />
              </div>
            )}
            <div className="p-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h3 id="add-item-title" className="text-xl font-bold text-vantix-fg">
                {addItemModal.name}
              </h3>
              <button
                type="button"
                onClick={() => setAddItemModal(null)}
                className="p-2 rounded-full text-vantix-fg-muted hover:bg-vantix-cyan/10 hover:text-vantix-cyan"
                aria-label="סגור"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-vantix-cyan font-semibold mb-4">₪{addItemModal.price.toFixed(2)}</p>
            <div className="space-y-4 mb-6">
              {addItemModal.sections.map((sec) => (
                <div key={sec.id} className="rounded-xl border border-vantix-cyan/20 bg-vantix-surface-raised p-4">
                  <p className="font-medium text-vantix-fg mb-2">{sec.title}</p>
                  {sec.choiceType === 'single' ? (
                    <div className="space-y-2">
                      {sec.options.map((opt) => (
                        <label key={opt.id} className="flex items-center gap-3 rounded-lg border border-vantix-cyan/20 px-3 py-2 cursor-pointer hover:bg-gradient-to-l from-vantix-cyan to-vantix-orange/5">
                          <input
                            type="radio"
                            name={`sec-${sec.id}`}
                            checked={(sectionSelections[sec.id] as string) === opt.id}
                            onChange={() => setSectionSelections((prev) => ({ ...prev, [sec.id]: opt.id }))}
                            className="text-vantix-cyan focus:ring-vantix-cyan"
                          />
                          <span className="flex-1">{opt.label}</span>
                          {opt.priceCents != null && opt.priceCents > 0 && (
                            <span className="text-sm font-medium text-vantix-cyan">+₪{(opt.priceCents / 100).toFixed(2)}</span>
                          )}
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {sec.options.map((opt) => {
                        const multi = (sectionSelections[sec.id] as string[] | undefined) ?? []
                        const checked = multi.includes(opt.id)
                        return (
                          <label key={opt.id} className="flex items-center gap-3 rounded-lg border border-vantix-cyan/20 px-3 py-2 cursor-pointer hover:bg-gradient-to-l from-vantix-cyan to-vantix-orange/5">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                setSectionSelections((prev) => {
                                  const current = (prev[sec.id] as string[] | undefined) ?? []
                                  const next = checked ? current.filter((id) => id !== opt.id) : [...current, opt.id]
                                  return { ...prev, [sec.id]: next }
                                })
                              }}
                              className="rounded border-vantix-cyan/40 text-vantix-cyan focus:ring-vantix-cyan"
                            />
                            <span className="flex-1">{opt.label}</span>
                            {opt.priceCents != null && opt.priceCents > 0 && (
                              <span className="text-sm font-medium text-vantix-cyan">+₪{(opt.priceCents / 100).toFixed(2)}</span>
                            )}
                          </label>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={handleAddItemConfirm}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-vantix-cyan to-vantix-orange text-white py-3.5 font-semibold hover:bg-gradient-to-l from-vantix-cyan to-vantix-orange/90 focus:outline-none focus:ring-2 focus:ring-vantix-cyan"
            >
              <Plus className="h-5 w-5" />
              הוסף לעגלה
            </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

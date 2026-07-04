import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { placeOrder } from '../../services/orderService'
import type { OrderCreate, OrderItem } from '../../types/order'
import type { MenuItem } from '../../types/menu'
import { isValidIsraeliPhone } from '../../utils/phone'
import { ShoppingCart, Plus, Minus, Loader2, Check, ArrowRight, X, User, MapPin, CreditCard, Pencil, Search, Truck, Store } from 'lucide-react'
import { useMenu } from '../../hooks/useMenu'
import { useCart, type CartLine, type CartSelectedOption } from '../../hooks/useCart'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/ui/Toast'
import { haptic } from '../../lib/native'
import { ROUTES } from '../../constants/app'
import { CheckoutSavedSelector } from '../../components/checkout/CheckoutSavedSelector'
import { PAYMENT_METHOD_LABELS, type SavedAddress, type SavedContact, type SavedPayment, type PaymentMethodType } from '../../types/customerProfile'
import { paymentSummary } from '../../components/profile/savedDisplay'

export const RestaurantMenuPage = () => {
  const { businessId } = useParams<{ businessId: string }>()
  const navigate = useNavigate()
  const { menu, businessName, businessLogoUrl, businessPickupAddress, isLoading: loading } = useMenu(businessId)
  const { cart, addToCart, removeFromCart, updateLineOptions, clearCart, totalItems, totalPrice } = useCart(businessId, menu?.items ?? null)
  const { user } = useAuth()
  const toast = useToast()

  /** הוספה לעגלה עם משוב מישושי (רטט) במובייל. */
  const addLine = useCallback(
    (item: MenuItem, opts?: CartSelectedOption[]) => {
      void haptic.light()
      addToCart(item, opts)
    },
    [addToCart],
  )

  /** פתיחת מסך התשלום — דורש התחברות; אחרת מפנה להתחברות ומחזיר לכאן. */
  const openCheckout = useCallback(() => {
    if (!businessId) return
    if (!user) {
      toast.info('כדי להשלים הזמנה צריך להתחבר')
      navigate(ROUTES.AUTH_LOGIN, {
        state: { from: { pathname: ROUTES.RESTAURANT_MENU(businessId) } },
      })
      return
    }
    void haptic.medium()
    setShowCheckout(true)
  }, [businessId, user, toast, navigate])

  const [placing, setPlacing] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [showCartPanel, setShowCartPanel] = useState(false)
  // אופן מימוש ההזמנה: משלוח או איסוף עצמי
  const [fulfillment, setFulfillment] = useState<'delivery' | 'pickup'>('delivery')
  const [menuSearch, setMenuSearch] = useState('')
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null)
  const categorySectionRefs = useRef<Map<string, HTMLElement>>(new Map())
  const categoryTabsRef = useRef<HTMLDivElement>(null)
  const isTabClickScrolling = useRef(false)
  const submitErrorRef = useRef<HTMLParagraphElement>(null)
  const [addItemModal, setAddItemModal] = useState<MenuItem | null>(null)
  const [sectionSelections, setSectionSelections] = useState<Record<string, string | string[]>>({})
  // כשעורכים שורה קיימת בעגלה – שומרים את האופציות הישנות כדי לזהות את השורה
  const [editingOldOptions, setEditingOldOptions] = useState<CartSelectedOption[] | null>(null)
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
    delivery_building_code: '',
    delivery_notes: '',
  })
  const [selectedContactId, setSelectedContactId] = useState<string>()
  const [selectedAddressId, setSelectedAddressId] = useState<string>()
  const [selectedPaymentId, setSelectedPaymentId] = useState<string>()
  const [selectedPaymentType, setSelectedPaymentType] = useState<PaymentMethodType>()
  const [paymentMethod, setPaymentMethod] = useState<string>('')

  const applyContact = useCallback((c: SavedContact) => {
    setSelectedContactId(c.id)
    setForm((f) => ({
      ...f,
      customer_name: c.fullName,
      customer_phone: c.phone,
      customer_phone_secondary: c.phoneSecondary ?? '',
    }))
  }, [])

  const applyAddress = useCallback((a: SavedAddress) => {
    setSelectedAddressId(a.id)
    setForm((f) => ({
      ...f,
      delivery_city: a.delivery_city,
      delivery_street: a.delivery_street,
      delivery_building_number: a.delivery_building_number,
      delivery_floor: a.delivery_floor ?? '',
      delivery_apartment: a.delivery_apartment ?? '',
      delivery_building_code: a.delivery_building_code ?? '',
      delivery_notes: a.delivery_notes ?? f.delivery_notes,
    }))
  }, [])

  const applyPaymentMethod = useCallback((type: PaymentMethodType, card?: SavedPayment) => {
    setSelectedPaymentType(type)
    if (type === 'credit' && card) {
      setSelectedPaymentId(card.id)
      const label = card.label ? `${card.label} · ` : ''
      setPaymentMethod(`${label}${paymentSummary(card)}`)
    } else {
      setSelectedPaymentId(undefined)
      setPaymentMethod(PAYMENT_METHOD_LABELS[type])
    }
  }, [])

  const validate = useCallback((): boolean => {
    const err: Record<string, string> = {}
    const name = form.customer_name.trim()
    const phone = form.customer_phone.trim()
    const city = form.delivery_city.trim()
    const street = form.delivery_street.trim()
    if (!name || !phone) {
      err._submit = 'נא לבחור או להוסיף פרטים אישיים (שם וטלפון) למעלה'
    } else if (!isValidIsraeliPhone(phone)) {
      err._submit = 'מספר הטלפון בפרטים שנבחרו אינו תקין – ערוך אותו למעלה'
    } else if (fulfillment === 'delivery' && (!city || !street)) {
      err._submit = 'נא לבחור או להוסיף כתובת מלאה למשלוח למעלה'
    } else if (!selectedPaymentType) {
      err._submit = 'נא לבחור אמצעי תשלום'
    } else if (selectedPaymentType === 'credit' && !selectedPaymentId) {
      err._submit = 'נא לבחור כרטיס אשראי'
    }
    setFormErrors(err)
    return Object.keys(err).length === 0
  }, [form, fulfillment, selectedPaymentType, selectedPaymentId])

  const categoriesList = useMemo(() => {
    if (!menu?.categories) return []
    return Object.values(menu.categories).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
  }, [menu])

  const itemsList = useMemo(() => {
    if (!menu?.items) return []
    return Object.values(menu.items)
      .filter((i) => i.available !== false)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
  }, [menu])

  const menuQuery = menuSearch.trim().toLowerCase()
  const isMenuSearching = menuQuery.length > 0

  const filteredItemsList = useMemo(() => {
    if (!menuQuery) return itemsList
    return itemsList.filter((item) => {
      const catName = (menu?.categories?.[item.categoryId]?.name ?? '').toLowerCase()
      return (
        item.name.toLowerCase().includes(menuQuery) ||
        (item.description ?? '').toLowerCase().includes(menuQuery) ||
        catName.includes(menuQuery)
      )
    })
  }, [itemsList, menuQuery, menu?.categories])

  const visibleCategoriesForNav = useMemo(() => {
    const sourceItems = isMenuSearching ? filteredItemsList : itemsList
    return categoriesList.filter((cat) => sourceItems.some((i) => i.categoryId === cat.id))
  }, [categoriesList, itemsList, filteredItemsList, isMenuSearching])

  const scrollToCategory = useCallback((catId: string) => {
    setActiveCategoryId(catId)
    isTabClickScrolling.current = true
    const el = categorySectionRefs.current.get(catId)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      window.setTimeout(() => {
        isTabClickScrolling.current = false
      }, 900)
    } else {
      isTabClickScrolling.current = false
    }
  }, [])

  useEffect(() => {
    if (visibleCategoriesForNav.length === 0) {
      setActiveCategoryId(null)
      return
    }
    if (!activeCategoryId || !visibleCategoriesForNav.some((c) => c.id === activeCategoryId)) {
      setActiveCategoryId(visibleCategoriesForNav[0].id)
    }
  }, [visibleCategoriesForNav, activeCategoryId])

  useEffect(() => {
    if (isMenuSearching || visibleCategoriesForNav.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (isTabClickScrolling.current) return
        const intersecting = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        const top = intersecting[0]
        const id = top?.target.getAttribute('data-category-id')
        if (id) setActiveCategoryId(id)
      },
      { rootMargin: '-148px 0px -55% 0px', threshold: [0, 0.15, 0.35, 0.6] }
    )

    visibleCategoriesForNav.forEach((cat) => {
      const el = categorySectionRefs.current.get(cat.id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [visibleCategoriesForNav, isMenuSearching])

  useEffect(() => {
    if (!activeCategoryId || !categoryTabsRef.current) return
    const tab = categoryTabsRef.current.querySelector(`[data-cat-tab="${activeCategoryId}"]`)
    tab?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [activeCategoryId])

  const handlePlaceOrder = async () => {
    if (!businessId || cart.length === 0) return
    if (!validate()) {
      requestAnimationFrame(() => {
        submitErrorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      })
      return
    }
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
          ...(o.priceCents != null ? { priceCents: o.priceCents } : {}),
        })),
      }))
      const order: OrderCreate = {
        business_id: businessId,
        customer_name: form.customer_name.trim(),
        customer_phone: form.customer_phone.trim(),
        ...(form.customer_phone_secondary?.trim() && { customer_phone_secondary: form.customer_phone_secondary.trim() }),
        fulfillment_type: fulfillment,
        // שדות כתובת נשלחים רק במשלוח עד הבית
        ...(fulfillment === 'delivery'
          ? {
              delivery_city: form.delivery_city.trim(),
              delivery_street: form.delivery_street.trim(),
              ...(form.delivery_building_number.trim() && {
                delivery_building_number: form.delivery_building_number.trim(),
              }),
              ...(form.delivery_floor?.trim() && { delivery_floor: form.delivery_floor.trim() }),
              ...(form.delivery_apartment?.trim() && { delivery_apartment: form.delivery_apartment.trim() }),
              ...(form.delivery_building_code?.trim() && {
                delivery_building_code: form.delivery_building_code.trim(),
              }),
            }
          : {}),
        ...(form.delivery_notes?.trim() && { delivery_notes: form.delivery_notes.trim() }),
        ...(paymentMethod.trim() && { payment_method: paymentMethod.trim() }),
        items,
        status: 'new',
      }
      const orderId = await placeOrder(order)
      clearCart()
      setShowCheckout(false)
      toast.success('ההזמנה נשלחה! אפשר לעקוב אחריה כאן.')
      navigate(ROUTES.ORDER_TRACKING(orderId))
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string }
      const isPermissionDenied =
        err?.code === 'PERMISSION_DENIED' ||
        err?.message?.includes('PERMISSION_DENIED') ||
        err?.message?.includes('permission_denied')
      const message = isPermissionDenied
        ? 'אין הרשאה לשלוח הזמנה. ודאו שהתחברתם לחשבון ונסו שוב.'
        : 'שגיאה בשליחת ההזמנה. נסו שוב.'
      setFormErrors({ _submit: message })
      toast.error(message)
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

  const closeItemModal = () => {
    setAddItemModal(null)
    setSectionSelections({})
    setEditingOldOptions(null)
  }

  const optionsToSelections = (item: MenuItem, opts: CartSelectedOption[] | undefined): Record<string, string | string[]> => {
    const sel: Record<string, string | string[]> = {}
    for (const sec of item.sections ?? []) {
      const forSec = (opts ?? []).filter((o) => o.sectionId === sec.id)
      if (sec.choiceType === 'single') {
        if (forSec[0]) sel[sec.id] = forSec[0].optionId
      } else {
        sel[sec.id] = forSec.map((o) => o.optionId)
      }
    }
    return sel
  }

  const handleAddItem = (item: MenuItem) => {
    if (item.sections && item.sections.length > 0) {
      setEditingOldOptions(null)
      setAddItemModal(item)
      setSectionSelections({})
    } else {
      addLine(item)
    }
  }

  // פתיחת כרטיסיית המנה (לחיצה על כל הכרטיס בתפריט) – מציג פרטים ותמונה לכל מנה
  const openItemDetails = (item: MenuItem) => {
    setEditingOldOptions(null)
    setSectionSelections({})
    setAddItemModal(item)
  }

  // ✏️ עריכת תתי-הפריטים של שורה קיימת בעגלה (פתיחת המודל עם הבחירות הנוכחיות)
  const handleEditLine = (line: CartLine) => {
    if (!line.item.sections?.length) return
    setEditingOldOptions(line.selectedOptions ?? [])
    setSectionSelections(optionsToSelections(line.item, line.selectedOptions))
    setAddItemModal(line.item)
    setShowCartPanel(false)
  }

  const buildSelectedOptions = (item: MenuItem): CartSelectedOption[] => {
    const selectedOptions: CartSelectedOption[] = []
    for (const sec of item.sections ?? []) {
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
    return selectedOptions
  }

  const handleAddItemConfirm = () => {
    if (!addItemModal) return
    const selectedOptions = buildSelectedOptions(addItemModal)
    if (editingOldOptions !== null) {
      updateLineOptions(addItemModal.id, editingOldOptions, selectedOptions)
    } else {
      addLine(addItemModal, selectedOptions.length ? selectedOptions : undefined)
    }
    closeItemModal()
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

      {createPortal(
        <AnimatePresence>
        {showCartPanel && totalItems > 0 && (
        <motion.div
          key="cart-panel-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cart-panel-title"
          onClick={() => setShowCartPanel(false)}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            className="w-full sm:max-w-md max-h-[85vh] rounded-t-3xl sm:rounded-2xl bg-vantix-surface-raised shadow-xl overflow-hidden flex flex-col"
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
                        {l.item.sections && l.item.sections.length > 0 && (
                          <button
                            type="button"
                            onClick={() => handleEditLine(l)}
                            className="p-1.5 rounded-lg text-vantix-fg-muted hover:bg-vantix-cyan/10 hover:text-vantix-cyan"
                            aria-label={`ערוך תוספות ${l.item.name}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        )}
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
                          onClick={() => addLine(l.item, l.selectedOptions)}
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
                onClick={() => { setShowCartPanel(false); openCheckout() }}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-vantix-orange dark:bg-vantix-cyan text-white dark:text-black py-3.5 font-semibold hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-vantix-cyan focus:ring-offset-2"
              >
                להזמנה
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        </motion.div>
        )}
        </AnimatePresence>,
        document.body
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
        <div className="relative rounded-2xl bg-vantix-surface-raised/95 dark:bg-vantix-surface-raised/95 px-8 py-5 sm:px-10 sm:py-6 shadow-[0_12px_40px_rgba(0,0,0,0.07),0_0_0_1px_rgba(0,0,0,0.04)] backdrop-blur-sm overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-vantix-orange/60 to-transparent dark:via-vantix-cyan/60" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-vantix-orange/25 to-transparent dark:via-vantix-cyan/25" />
          <h1 className="relative font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-vantix-fg text-center tracking-tight">
            {businessName || 'תפריט'}
          </h1>
        </div>
      </div>


      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* שורת חיפוש – נדבקת לראש המסך מתחת לסרגל העליון בזמן גלילה */}
          <div className="sticky top-[52px] z-30 -mx-3 px-3 pt-2 pb-2 bg-vantix-surface/85 backdrop-blur-md sm:top-[68px] sm:-mx-6 sm:px-6">
            <div className="flex items-center gap-3 rounded-xl border border-vantix-cyan/25 bg-vantix-surface-raised px-3 py-2.5 shadow-sm">
              <Search className="h-4 w-4 shrink-0 text-vantix-cyan" />
              <input
                value={menuSearch}
                onChange={(e) => setMenuSearch(e.target.value)}
                placeholder="חיפוש מנה בתפריט (שם או קטגוריה, למשל 'עיקריות')..."
                className="w-full min-w-0 bg-transparent text-sm text-vantix-fg placeholder:text-vantix-fg-subtle focus:outline-none"
                aria-label="חיפוש מנה בתפריט"
              />
              {menuSearch && (
                <button
                  type="button"
                  onClick={() => setMenuSearch('')}
                  className="p-1 rounded-full text-vantix-fg-muted hover:bg-vantix-cyan/10 hover:text-vantix-cyan"
                  aria-label="נקה חיפוש"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* ניווט מהיר לקטגוריות – כמו Wolt / משלוחה */}
            {!isMenuSearching && visibleCategoriesForNav.length > 1 && (
              <div
                ref={categoryTabsRef}
                className="mt-2 overflow-x-auto -mx-1 px-1 border-b border-vantix-cyan/15 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                role="tablist"
                aria-label="קטגוריות בתפריט"
              >
                <div className="flex min-w-0 gap-0 whitespace-nowrap">
                  {visibleCategoriesForNav.map((cat) => {
                    const isActive = activeCategoryId === cat.id
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        role="tab"
                        data-cat-tab={cat.id}
                        aria-selected={isActive}
                        onClick={() => scrollToCategory(cat.id)}
                        className={`relative shrink-0 px-4 py-3 text-sm transition-colors ${
                          isActive
                            ? 'font-bold text-vantix-fg'
                            : 'font-medium text-vantix-fg-muted hover:text-vantix-fg'
                        }`}
                      >
                        {cat.name}
                        {isActive && (
                          <motion.span
                            layoutId="menu-category-tab-underline"
                            className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-vantix-cyan"
                            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                          />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {isMenuSearching && filteredItemsList.length === 0 && (
            <p className="rounded-xl border border-vantix-cyan/20 bg-vantix-surface-raised p-6 text-center text-sm text-vantix-fg-muted">
              לא נמצאו מנות התואמות את החיפוש &quot;{menuSearch}&quot;
            </p>
          )}

          {categoriesList.length > 0
            ? categoriesList.map((cat) => {
                const catItems = filteredItemsList.filter((i) => i.categoryId === cat.id)
                if (catItems.length === 0) return null
                return (
                  <section
                    key={cat.id}
                    ref={(el) => {
                      if (el) categorySectionRefs.current.set(cat.id, el)
                      else categorySectionRefs.current.delete(cat.id)
                    }}
                    data-category-id={cat.id}
                    className="scroll-mt-[9.5rem] sm:scroll-mt-[10.5rem]"
                    aria-labelledby={`cat-${cat.id}`}
                  >
                    <h2 id={`cat-${cat.id}`} className="text-lg font-bold text-vantix-fg border-b-2 border-vantix-cyan/25 pb-2 mb-3">
                      {cat.name}
                    </h2>
                    <ul className="space-y-2">
                      {catItems.map((item) => (
                        <li
                          key={item.id}
                          onClick={() => openItemDetails(item)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              openItemDetails(item)
                            }
                          }}
                          className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-vantix-cyan/20 bg-vantix-surface-raised p-4 shadow-sm transition hover:border-vantix-cyan/40 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-vantix-cyan/40 active:scale-[0.99]"
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
                              onClick={(e) => { e.stopPropagation(); handleAddItem(item) }}
                              className="rounded-full bg-vantix-cyan p-2.5 text-white hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-vantix-cyan/50"
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
                {filteredItemsList.map((item) => (
                  <li
                    key={item.id}
                    onClick={() => openItemDetails(item)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        openItemDetails(item)
                      }
                    }}
                    className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-vantix-cyan/20 bg-vantix-surface-raised p-4 shadow-sm transition hover:border-vantix-cyan/40 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-vantix-cyan/40 active:scale-[0.99]"
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
                        onClick={(e) => { e.stopPropagation(); handleAddItem(item) }}
                        className="rounded-full bg-vantix-cyan p-2.5 text-white hover:brightness-110"
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
                            {l.item.sections && l.item.sections.length > 0 && (
                              <button
                                type="button"
                                onClick={() => handleEditLine(l)}
                                className="p-1.5 rounded-lg text-vantix-fg-muted hover:bg-vantix-cyan/10 hover:text-vantix-cyan"
                                aria-label={`ערוך תוספות ${l.item.name}`}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                            )}
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
                              onClick={() => addLine(l.item, l.selectedOptions)}
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
                  onClick={openCheckout}
                  className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl bg-vantix-orange dark:bg-vantix-cyan text-white dark:text-black py-3.5 font-semibold hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-vantix-cyan focus:ring-offset-2"
                >
                  להזמנה
                  <ArrowRight className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {createPortal(
        <AnimatePresence>
        {showCheckout && (
        <motion.div
          key="checkout-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-stretch justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="checkout-title"
          onClick={() => { setShowCheckout(false); setFormErrors({}) }}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            className="flex h-full w-full flex-col bg-vantix-surface-raised shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto flex h-full w-full max-w-2xl flex-col overflow-y-auto p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h3 id="checkout-title" className="text-xl font-bold text-vantix-fg">
                פרטי הזמנה
              </h3>
              <button
                type="button"
                onClick={() => { setShowCheckout(false); setFormErrors({}) }}
                className="p-2 rounded-full text-vantix-fg-muted hover:bg-vantix-cyan/10 hover:text-vantix-cyan"
                aria-label="סגור"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* בחירת אופן מימוש ההזמנה */}
            <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl border border-vantix-cyan/20 bg-vantix-surface p-1">
              <button
                type="button"
                onClick={() => setFulfillment('delivery')}
                className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition ${
                  fulfillment === 'delivery'
                    ? 'bg-vantix-cyan text-black'
                    : 'text-vantix-fg-muted hover:bg-vantix-cyan/10'
                }`}
                aria-pressed={fulfillment === 'delivery'}
              >
                <Truck className="h-4 w-4" />
                משלוח
              </button>
              <button
                type="button"
                onClick={() => setFulfillment('pickup')}
                className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition ${
                  fulfillment === 'pickup'
                    ? 'bg-vantix-cyan text-black'
                    : 'text-vantix-fg-muted hover:bg-vantix-cyan/10'
                }`}
                aria-pressed={fulfillment === 'pickup'}
              >
                <Store className="h-4 w-4" />
                איסוף עצמי
              </button>
            </div>

            {fulfillment === 'pickup' && (
              <div className="mb-4 flex items-start gap-2 rounded-2xl border border-vantix-cyan/20 bg-vantix-surface p-4 text-sm">
                <Store className="mt-0.5 h-4 w-4 shrink-0 text-vantix-cyan" />
                <div>
                  <p className="font-medium text-vantix-fg">איסוף מהעסק</p>
                  <p className="mt-0.5 text-vantix-fg-muted">
                    {businessPickupAddress
                      ? `${businessName ? businessName + ' · ' : ''}${businessPickupAddress}`
                      : `ההזמנה תמתין לאיסוף ב${businessName || 'עסק'}. פרטי המיקום המדויקים יתואמו עם בעל העסק.`}
                  </p>
                </div>
              </div>
            )}

            {formErrors._submit && (
              <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {formErrors._submit}
              </p>
            )}

            <CheckoutSavedSelector
              selectedContactId={selectedContactId}
              selectedAddressId={selectedAddressId}
              selectedPaymentType={selectedPaymentType}
              selectedPaymentId={selectedPaymentId}
              onSelectContact={applyContact}
              onSelectAddress={applyAddress}
              onSelectPaymentMethod={applyPaymentMethod}
              hideAddress={fulfillment === 'pickup'}
            />

            {form.customer_name || form.delivery_city ? (
              <div className="space-y-2.5 rounded-2xl border border-vantix-cyan/20 bg-vantix-surface p-4 text-sm">
                {form.customer_name && (
                  <div className="flex items-start gap-2">
                    <User className="mt-0.5 h-4 w-4 shrink-0 text-vantix-cyan" />
                    <span className="text-vantix-fg">
                      {form.customer_name} · {form.customer_phone}
                      {form.customer_phone_secondary ? ` · ${form.customer_phone_secondary}` : ''}
                    </span>
                  </div>
                )}
                {fulfillment === 'delivery' && form.delivery_city && (
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-vantix-cyan" />
                    <span className="text-vantix-fg">
                      {[form.delivery_street, form.delivery_building_number].filter(Boolean).join(' ')}, {form.delivery_city}
                      {form.delivery_apartment ? ` · דירה ${form.delivery_apartment}` : ''}
                      {form.delivery_floor ? ` · קומה ${form.delivery_floor}` : ''}
                      {form.delivery_building_code ? ` · קוד ${form.delivery_building_code}` : ''}
                    </span>
                  </div>
                )}
                {paymentMethod && (
                  <div className="flex items-start gap-2">
                    <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-vantix-cyan" />
                    <span className="text-vantix-fg">{paymentMethod}</span>
                  </div>
                )}
                {form.delivery_notes && (
                  <p className="border-t border-vantix-cyan/15 pt-2 text-xs text-vantix-fg-muted">
                    הערה לשליח: {form.delivery_notes}
                  </p>
                )}
              </div>
            ) : (
              <p className="py-2 text-center text-sm text-vantix-fg-subtle">
                בחר פרטים אישיים וכתובת מהחלק העליון, או הוסף חדשים בלחיצה על &quot;חדש&quot;.
              </p>
            )}
            <div className="mt-6 flex flex-col gap-3">
              {formErrors._submit && (
                <p
                  ref={submitErrorRef}
                  className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400"
                >
                  {formErrors._submit}
                </p>
              )}
              <div className="flex gap-3">
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
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-vantix-orange dark:bg-vantix-cyan text-white dark:text-black py-3 font-semibold hover:brightness-110 disabled:opacity-70"
              >
                {placing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
                שליחת הזמנה
              </button>
              </div>
            </div>
            </div>
          </motion.div>
        </motion.div>
        )}
        </AnimatePresence>,
        document.body
      )}

      {createPortal(
        <AnimatePresence>
        {addItemModal && (
        <motion.div
          key="item-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-item-title"
          onClick={closeItemModal}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            className="w-full max-h-[88vh] overflow-y-auto rounded-t-3xl bg-vantix-surface-raised shadow-xl sm:max-w-md sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {addItemModal.imageUrl ? (
              <div className="relative w-full aspect-[16/10] overflow-hidden rounded-t-3xl bg-vantix-surface sm:rounded-t-2xl">
                <img
                  src={addItemModal.imageUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover object-center"
                />
              </div>
            ) : (
              <div className="flex justify-center pt-3 sm:hidden">
                <span className="h-1.5 w-10 rounded-full bg-vantix-fg-subtle/40" />
              </div>
            )}
            <div className="p-6">
            <div className="flex items-center justify-between gap-4 mb-2">
              <h3 id="add-item-title" className="text-xl font-bold text-vantix-fg">
                {editingOldOptions !== null ? `עריכת ${addItemModal.name}` : addItemModal.name}
              </h3>
              <button
                type="button"
                onClick={closeItemModal}
                className="p-2 rounded-full text-vantix-fg-muted hover:bg-vantix-cyan/10 hover:text-vantix-cyan"
                aria-label="סגור"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-vantix-cyan font-semibold mb-3">₪{addItemModal.price.toFixed(2)}</p>
            {addItemModal.description && (
              <p className="text-sm text-vantix-fg-muted mb-4 leading-relaxed">{addItemModal.description}</p>
            )}
            {addItemModal.sections && addItemModal.sections.length > 0 && (
            <div className="space-y-4 mb-6">
              {addItemModal.sections.map((sec) => (
                <div key={sec.id} className="rounded-xl border border-vantix-cyan/20 bg-vantix-surface-raised p-4">
                  <p className="font-medium text-vantix-fg mb-2">{sec.title}</p>
                  {sec.choiceType === 'single' ? (
                    <div className="space-y-2">
                      {(sec.options ?? []).map((opt) => (
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
                      {(sec.options ?? []).map((opt) => {
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
            )}
            <button
              type="button"
              onClick={handleAddItemConfirm}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-vantix-orange dark:bg-vantix-cyan text-white dark:text-black py-3.5 font-semibold hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-vantix-cyan"
            >
              {editingOldOptions !== null ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              {editingOldOptions !== null ? 'שמור שינויים' : 'הוסף לעגלה'}
            </button>
            </div>
          </motion.div>
        </motion.div>
        )}
        </AnimatePresence>,
        document.body
      )}

    </div>
  )
}

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useDragControls, type PanInfo } from 'framer-motion'
import { chargeAndPlaceOrder } from '../../services/paymentService'
import type { OrderCreate, OrderItem } from '../../types/order'
import type { MenuItem } from '../../types/menu'
import { isValidIsraeliPhone } from '../../utils/phone'
import { ShoppingCart, Plus, Minus, Loader2, Check, ArrowRight, X, Pencil, Search, Truck, Store } from 'lucide-react'
import { useMenu } from '../../hooks/useMenu'
import { useCart, type CartLine, type CartSelectedOption } from '../../hooks/useCart'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/ui/Toast'
import { haptic } from '../../lib/native'
import { ROUTES } from '../../constants/app'
import { CheckoutSavedSelector } from '../../components/checkout/CheckoutSavedSelector'
import { CourierTipSelector } from '../../components/checkout/CourierTipSelector'
import { DeliveryNotesInput } from '../../components/checkout/DeliveryNotesInput'
import { PopularDishesRow } from '../../components/menu/PopularDishesRow'
import { useMenuItemStats } from '../../hooks/useMenuItemStats'
import { useMainScrollPast } from '../../hooks/useScrolled'
import { incrementMenuItemOrderCounts } from '../../services/menuItemStats'
import {
  CheckoutCvvOnlyField,
  CheckoutCreditSecurityFields,
  validateCheckoutCreditSecurity,
} from '../../components/checkout/CheckoutCreditSecurityFields'
import { useSavedPayments } from '../../hooks/useCustomerProfile'
import { stripCardNumber, formatCardNumberInput } from '../../utils/cardNumber'
import { PAYMENT_METHOD_LABELS, type SavedAddress, type SavedContact, type SavedPayment, type PaymentMethodType } from '../../types/customerProfile'
import { paymentSummary } from '../../components/profile/savedDisplay'

function roundMoney(n: number) {
  return Math.round(n * 100) / 100
}

function getScrollParent(node: HTMLElement | null): HTMLElement | null {
  if (!node) return null
  let el: HTMLElement | null = node.parentElement
  while (el) {
    const { overflowY } = getComputedStyle(el)
    if (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') return el
    el = el.parentElement
  }
  return null
}

function getFirstIncompleteRequiredSectionId(
  item: MenuItem,
  selections: Record<string, string | string[]>
): string | null {
  for (const sec of item.sections ?? []) {
    if (!sec.required) continue
    const val = selections[sec.id]
    if (sec.choiceType === 'single') {
      if (typeof val !== 'string' || !val) return sec.id
      continue
    }
    const multi = Array.isArray(val) ? val : []
    const min = Math.max(1, sec.minSelections ?? 1)
    if (multi.length < min) return sec.id
  }
  return null
}

function MenuItemRow({
  item,
  onOpen,
  onAdd,
  orderingClosed = false,
}: {
  item: MenuItem
  onOpen: () => void
  onAdd: (e: React.MouseEvent) => void
  orderingClosed?: boolean
}) {
  const hasImage = Boolean(item.imageUrl)

  return (
    <li
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen()
        }
      }}
      className={`grid w-full max-w-full cursor-pointer items-center gap-2 overflow-hidden rounded-xl border border-vantix-cyan/20 bg-vantix-surface-raised p-3 shadow-sm transition hover:border-vantix-cyan/40 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-vantix-cyan/40 active:scale-[0.99] sm:gap-3 sm:p-4 ${
        hasImage ? 'grid-cols-[auto_minmax(0,1fr)_auto]' : 'grid-cols-[minmax(0,1fr)_auto]'
      }`}
    >
      {hasImage ? (
        <img
          src={item.imageUrl!}
          alt=""
          className="h-14 w-14 shrink-0 rounded-lg border border-vantix-cyan/20 object-cover sm:h-16 sm:w-16"
        />
      ) : null}
      <div className="min-w-0 overflow-hidden">
        <p className="block w-full truncate font-medium text-vantix-fg" title={item.name}>
          {item.name}
        </p>
        {item.sections && item.sections.length > 0 ? (
          <p className="mt-1 truncate text-xs text-vantix-cyan/80">יש אפשרויות לבחירה</p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <span className="whitespace-nowrap font-semibold text-vantix-cyan">₪{item.price.toFixed(2)}</span>
        <button
          type="button"
          onClick={onAdd}
          disabled={orderingClosed}
          className="rounded-full bg-vantix-cyan p-2.5 text-white hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-vantix-cyan/50 disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label={`הוסף ${item.name} לעגלה`}
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
    </li>
  )
}

export const RestaurantMenuPage = () => {
  const { businessId } = useParams<{ businessId: string }>()
  const navigate = useNavigate()
  const { menu, businessName, businessLogoUrl, businessPickupAddress, isOpenNow, isLoading: loading } = useMenu(businessId)
  const { cart, addToCart, removeFromCart, updateLineOptions, clearCart, totalItems, totalPrice } = useCart(businessId, menu?.items ?? null)
  const { orderCounts, bumpLocalCounts } = useMenuItemStats(businessId)
  const compactStickyNav = useMainScrollPast(72)
  const { user } = useAuth()
  const toast = useToast()
  const { items: savedPayments } = useSavedPayments()

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
    if (!isOpenNow) {
      toast.info('העסק סגור כעת ולא מקבל הזמנות חדשות')
      return
    }
    if (!user) {
      toast.info('כדי להשלים הזמנה צריך להתחבר')
      navigate(ROUTES.AUTH_LOGIN, {
        state: { from: { pathname: ROUTES.RESTAURANT_MENU(businessId) } },
      })
      return
    }
    void haptic.medium()
    setShowCheckout(true)
  }, [businessId, isOpenNow, user, toast, navigate])

  const [placing, setPlacing] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [sessionCardPaymentId, setSessionCardPaymentId] = useState<string | undefined>()
  const [showCartPanel, setShowCartPanel] = useState(false)
  // אופן מימוש ההזמנה: משלוח או איסוף עצמי
  const [fulfillment, setFulfillment] = useState<'delivery' | 'pickup'>('delivery')
  const [menuSearch, setMenuSearch] = useState('')
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null)
  const categorySectionRefs = useRef<Map<string, HTMLElement>>(new Map())
  const categoryTabsRef = useRef<HTMLDivElement>(null)
  const stickyNavRef = useRef<HTMLDivElement>(null)
  const isTabClickScrolling = useRef(false)
  const submitErrorRef = useRef<HTMLParagraphElement>(null)
  const itemModalScrollRef = useRef<HTMLDivElement>(null)
  const itemModalSectionRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const [highlightSectionId, setHighlightSectionId] = useState<string | null>(null)
  const itemModalDragControls = useDragControls()
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
  const [courierTip, setCourierTip] = useState(0)
  const [creditCvv, setCreditCvv] = useState('')
  const [creditCardNumber, setCreditCardNumber] = useState('')
  const [creditSecurityErrors, setCreditSecurityErrors] = useState<{ cvv?: string; cardNumber?: string }>({})

  const selectedSavedCard = useMemo(
    () => savedPayments.find((p) => p.id === selectedPaymentId),
    [savedPayments, selectedPaymentId],
  )
  const requireFullCard = selectedPaymentType === 'credit' && !selectedSavedCard?.hasPayplusToken
  const hasSessionSecrets =
    sessionCardPaymentId === selectedPaymentId &&
    /^\d{3,4}$/.test(creditCvv) &&
    (!requireFullCard || stripCardNumber(creditCardNumber).length === 16)
  const needsInlineCardFields =
    selectedPaymentType === 'credit' && !!selectedPaymentId && requireFullCard && !hasSessionSecrets
  const needsCvvField =
    selectedPaymentType === 'credit' && !!selectedPaymentId && !requireFullCard && !hasSessionSecrets
  const checkoutTotal = useMemo(() => roundMoney(totalPrice + courierTip), [totalPrice, courierTip])

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
    setCreditCvv('')
    setCreditCardNumber('')
    setSessionCardPaymentId(undefined)
    setCreditSecurityErrors({})
    if (type === 'credit' && card) {
      setSelectedPaymentId(card.id)
      const label = card.label ? `${card.label} · ` : ''
      setPaymentMethod(`${label}${paymentSummary(card)}`)
    } else {
      setSelectedPaymentId(undefined)
      setPaymentMethod(PAYMENT_METHOD_LABELS[type])
    }
  }, [])

  const captureCardSecrets = useCallback(
    (paymentId: string, secrets: { cardNumber: string; cvv: string }) => {
      setSessionCardPaymentId(paymentId)
      setCreditCardNumber(formatCardNumberInput(secrets.cardNumber))
      setCreditCvv(secrets.cvv)
      setCreditSecurityErrors({})
    },
    [],
  )

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
    } else if (selectedPaymentType === 'gpay' || selectedPaymentType === 'apay') {
      err._submit = 'תשלום Google Pay / Apple Pay ישירות מהאפליקציה יתמך בקרוב – בחרו כרטיס אשראי או מזומן'
    } else if (selectedPaymentType === 'credit' && needsCvvField) {
      if (!/^\d{3,4}$/.test(creditCvv)) {
        setCreditSecurityErrors({ cvv: 'נא להזין CVV תקין' })
        err._submit = 'נא להזין CVV לפני שליחת ההזמנה'
      }
    } else if (selectedPaymentType === 'credit' && needsInlineCardFields) {
      const creditErr = validateCheckoutCreditSecurity(creditCvv, creditCardNumber, true)
      if (Object.keys(creditErr).length) {
        setCreditSecurityErrors(creditErr)
        err._submit = creditErr.cardNumber || creditErr.cvv || 'נא להשלים פרטי אשראי'
      }
    }
    setFormErrors(err)
    return Object.keys(err).length === 0
  }, [form, fulfillment, selectedPaymentType, selectedPaymentId, creditCvv, creditCardNumber, needsCvvField, needsInlineCardFields])

  const categoriesList = useMemo(() => {
    if (!menu?.categories) return []
    return Object.values(menu.categories)
      .filter((c) => c.available !== false)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
  }, [menu])

  const itemsList = useMemo(() => {
    if (!menu?.items) return []
    const visibleCategoryIds = new Set(
      Object.values(menu.categories ?? {})
        .filter((c) => c.available !== false)
        .map((c) => c.id)
    )
    return Object.values(menu.items)
      .filter((i) => i.available !== false && visibleCategoryIds.has(i.categoryId))
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

  const popularDishes = useMemo(() => {
    return itemsList
      .map((item) => ({ item, orderCount: orderCounts[item.id] ?? 0 }))
      .filter((entry) => entry.orderCount > 0)
      .sort((a, b) => b.orderCount - a.orderCount)
      .slice(0, 15)
  }, [itemsList, orderCounts])

  const scrollToCategory = useCallback((catId: string) => {
    isTabClickScrolling.current = true
    setActiveCategoryId(catId)

    const performScroll = () => {
      const el = categorySectionRefs.current.get(catId)
      if (!el) {
        isTabClickScrolling.current = false
        return
      }

      const scrollRoot = getScrollParent(el)
      const stickyOffset = stickyNavRef.current?.offsetHeight ?? 104

      if (scrollRoot) {
        const target =
          scrollRoot.scrollTop +
          el.getBoundingClientRect().top -
          scrollRoot.getBoundingClientRect().top -
          stickyOffset
        scrollRoot.scrollTo({ top: Math.max(0, target), behavior: 'smooth' })
        scrollRoot.addEventListener('scrollend', () => {
          isTabClickScrolling.current = false
        }, { once: true })
      } else {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }

      window.setTimeout(() => {
        isTabClickScrolling.current = false
      }, 1000)
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(performScroll)
    })
  }, [])

  const syncActiveCategoryFromScroll = useCallback(() => {
    if (isTabClickScrolling.current || visibleCategoriesForNav.length === 0) return

    const firstSection = categorySectionRefs.current.get(visibleCategoriesForNav[0]?.id ?? '')
    const scrollRoot = getScrollParent(firstSection ?? null)
    if (!scrollRoot) return

    const stickyOffset = stickyNavRef.current?.offsetHeight ?? 104
    const anchor = scrollRoot.getBoundingClientRect().top + stickyOffset + 1

    let nextId = visibleCategoriesForNav[0].id
    for (const cat of visibleCategoriesForNav) {
      const el = categorySectionRefs.current.get(cat.id)
      if (!el) continue
      if (el.getBoundingClientRect().top <= anchor) {
        nextId = cat.id
      }
    }

    setActiveCategoryId((prev) => (prev === nextId ? prev : nextId))
  }, [visibleCategoriesForNav])

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

    let scrollRoot: HTMLElement | null = null
    let scrollRaf = 0
    let mountRaf = 0

    const onScroll = () => {
      cancelAnimationFrame(scrollRaf)
      scrollRaf = requestAnimationFrame(syncActiveCategoryFromScroll)
    }

    mountRaf = requestAnimationFrame(() => {
      const firstSection = categorySectionRefs.current.get(visibleCategoriesForNav[0]?.id ?? '')
      scrollRoot = getScrollParent(firstSection ?? null)
      if (!scrollRoot) return
      scrollRoot.addEventListener('scroll', onScroll, { passive: true })
      syncActiveCategoryFromScroll()
    })

    return () => {
      cancelAnimationFrame(mountRaf)
      cancelAnimationFrame(scrollRaf)
      scrollRoot?.removeEventListener('scroll', onScroll)
    }
  }, [visibleCategoriesForNav, isMenuSearching, syncActiveCategoryFromScroll])

  const notifyClosed = useCallback(() => {
    toast.info('העסק סגור כעת ולא מקבל הזמנות חדשות')
  }, [toast])

  useEffect(() => {
    if (!activeCategoryId || !categoryTabsRef.current) return
    const tabsContainer = categoryTabsRef.current
    const tab = tabsContainer.querySelector(`[data-cat-tab="${activeCategoryId}"]`) as HTMLElement | null
    if (!tab) return
    const targetLeft = tab.offsetLeft - (tabsContainer.clientWidth - tab.clientWidth) / 2
    tabsContainer.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' })
  }, [activeCategoryId])

  const handlePlaceOrder = async () => {
    if (!businessId || cart.length === 0) return
    if (!validate()) {
      requestAnimationFrame(() => {
        submitErrorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      })
      return
    }
    await submitOrderWithPayment()
  }

  const submitOrderWithPayment = async () => {
    if (!businessId || cart.length === 0) return
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
        ...(selectedPaymentType && { payment_type: selectedPaymentType }),
        items,
        status: 'new',
      }
      const { orderId, paymentStatus } = await chargeAndPlaceOrder(
        order,
        courierTip,
        {
          type: selectedPaymentType!,
          savedPaymentId: selectedPaymentId,
          cvv: selectedPaymentType === 'credit' ? creditCvv : undefined,
          cardNumber:
            selectedPaymentType === 'credit' &&
            (requireFullCard || stripCardNumber(creditCardNumber).length === 16)
              ? stripCardNumber(creditCardNumber)
              : undefined,
        },
      )
      clearCart()
      setShowCheckout(false)
      setSessionCardPaymentId(undefined)
      setCreditCvv('')
      setCreditCardNumber('')
      setCourierTip(0)
      const statsLines = cart.map((l) => ({ menuItemId: l.item.id, quantity: l.quantity }))
      bumpLocalCounts(statsLines)
      void incrementMenuItemOrderCounts(businessId, statsLines).catch(() => {})
      toast.success(
        paymentStatus === 'paid'
          ? 'התשלום בוצע וההזמנה נשלחה!'
          : 'ההזמנה נשלחה! התשלום במזומן בעת המסירה.',
      )
      navigate(ROUTES.ORDER_TRACKING(orderId))
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string; requiresCardNumber?: boolean }
      const isPermissionDenied =
        err?.code === 'PERMISSION_DENIED' ||
        err?.message?.includes('PERMISSION_DENIED') ||
        err?.message?.includes('permission_denied')
      if (err?.requiresCardNumber && selectedPaymentType === 'credit' && !needsInlineCardFields) {
        setCreditSecurityErrors({ cardNumber: 'נא להזין מספר כרטיס מלא' })
        setFormErrors({ _submit: 'נא להשלים את פרטי הכרטיס למטה' })
        setPlacing(false)
        return
      }
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
    setHighlightSectionId(null)
    itemModalSectionRefs.current.clear()
  }

  const scrollToItemModalSection = (sectionId: string) => {
    const scrollRoot = itemModalScrollRef.current
    const el = itemModalSectionRefs.current.get(sectionId)
    if (!scrollRoot || !el) return
    const top =
      el.getBoundingClientRect().top - scrollRoot.getBoundingClientRect().top + scrollRoot.scrollTop - 12
    scrollRoot.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
  }

  const startItemModalDrag = (event: React.PointerEvent) => {
    event.preventDefault()
    itemModalDragControls.start(event)
  }

  const handleItemModalDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > 90 || info.velocity.y > 400) {
      closeItemModal()
    }
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

  const orderingClosed = !isOpenNow

  const handleAddItem = (item: MenuItem) => {
    if (orderingClosed) {
      notifyClosed()
      return
    }
    if (item.sections && item.sections.length > 0) {
      setEditingOldOptions(null)
      setAddItemModal(item)
      setSectionSelections({})
    } else {
      addLine(item)
    }
  }

  const handlePopularRemove = (item: MenuItem) => {
    const line = cart.find((l) => l.item.id === item.id)
    if (line) removeFromCart(item.id, line.selectedOptions)
  }

  // פתיחת כרטיסיית המנה (לחיצה על כל הכרטיס בתפריט) – מציג פרטים ותמונה לכל מנה
  const openItemDetails = (item: MenuItem) => {
    if (orderingClosed) {
      notifyClosed()
      return
    }
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
    if (orderingClosed) {
      notifyClosed()
      return
    }
    const missingSectionId = getFirstIncompleteRequiredSectionId(addItemModal, sectionSelections)
    if (missingSectionId) {
      scrollToItemModalSection(missingSectionId)
      setHighlightSectionId(missingSectionId)
      window.setTimeout(() => setHighlightSectionId(null), 2000)
      return
    }
    const selectedOptions = buildSelectedOptions(addItemModal)
    if (editingOldOptions !== null) {
      updateLineOptions(addItemModal.id, editingOldOptions, selectedOptions)
    } else {
      addLine(addItemModal, selectedOptions.length ? selectedOptions : undefined)
    }
    closeItemModal()
  }

  return (
    <div className="min-w-0 space-y-2 pb-28 sm:space-y-3" dir="rtl">
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
                disabled={orderingClosed}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-vantix-orange dark:bg-vantix-cyan text-white dark:text-black py-3.5 font-semibold hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-vantix-cyan focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
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

      {orderingClosed && (
        <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-center text-sm font-medium text-red-700 dark:text-red-300">
          {businessName ? `${businessName} סגור/ה כעת` : 'העסק סגור כעת'} — לא ניתן לבצע הזמנה חדשה
        </div>
      )}

      <div className="grid min-w-0 gap-8 lg:grid-cols-3">
        <div className="min-w-0 space-y-4 lg:col-span-2">
          {!isMenuSearching && popularDishes.length > 0 && (
            <PopularDishesRow
              dishes={popularDishes}
              cart={cart}
              orderingClosed={orderingClosed}
              onOpenItem={openItemDetails}
              onAddItem={handleAddItem}
              onRemoveItem={handlePopularRemove}
            />
          )}

          {/* שורת חיפוש – נדבקת לראש המסך מתחת לסרגל העליון בזמן גלילה */}
          <div
            ref={stickyNavRef}
            className={`sticky top-0 z-30 -mx-3 bg-vantix-surface/95 px-3 backdrop-blur-md transition-[padding] duration-200 sm:-mx-6 sm:px-6 ${
              compactStickyNav ? 'pb-0.5 pt-0' : 'pb-2 pt-1'
            }`}
          >
            <div
              className={`flex items-center gap-3 rounded-xl border border-vantix-cyan/25 bg-vantix-surface-raised px-3 shadow-sm transition-[padding] duration-200 ${
                compactStickyNav ? 'py-1.5' : 'py-2.5'
              }`}
            >
              <Search className="h-4 w-4 shrink-0 text-vantix-cyan" />
              <input
                value={menuSearch}
                onChange={(e) => setMenuSearch(e.target.value)}
                placeholder="חיפוש בתפריט..."
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
                className={`overflow-x-auto -mx-1 border-b border-vantix-cyan/15 px-1 transition-[margin] duration-200 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${
                  compactStickyNav ? 'mt-1' : 'mt-2'
                }`}
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
                        className={`relative shrink-0 px-4 text-sm transition-colors ${
                          compactStickyNav ? 'py-2' : 'py-3'
                        } ${
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
                    className="scroll-mt-[6.5rem] sm:scroll-mt-[7rem]"
                    aria-labelledby={`cat-${cat.id}`}
                  >
                    <h2 id={`cat-${cat.id}`} className="text-lg font-bold text-vantix-fg border-b-2 border-vantix-cyan/25 pb-2 mb-3">
                      {cat.name}
                    </h2>
                    <ul className="w-full max-w-full space-y-2">
                      {catItems.map((item) => (
                        <MenuItemRow
                          key={item.id}
                          item={item}
                          orderingClosed={orderingClosed}
                          onOpen={() => openItemDetails(item)}
                          onAdd={(e) => {
                            e.stopPropagation()
                            handleAddItem(item)
                          }}
                        />
                      ))}
                    </ul>
                  </section>
                )
              })
            : (
              <ul className="w-full max-w-full space-y-2">
                {filteredItemsList.map((item) => (
                  <MenuItemRow
                    key={item.id}
                    item={item}
                    orderingClosed={orderingClosed}
                    onOpen={() => openItemDetails(item)}
                    onAdd={(e) => {
                      e.stopPropagation()
                      handleAddItem(item)
                    }}
                  />
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
                  disabled={orderingClosed}
                  className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl bg-vantix-orange dark:bg-vantix-cyan text-white dark:text-black py-3.5 font-semibold hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-vantix-cyan focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
              onCardCaptured={captureCardSecrets}
              hideAddress={fulfillment === 'pickup'}
            />

            {needsCvvField ? (
              <CheckoutCvvOnlyField
                cvv={creditCvv}
                onCvvChange={setCreditCvv}
                error={creditSecurityErrors.cvv}
              />
            ) : null}

            {needsInlineCardFields ? (
              <CheckoutCreditSecurityFields
                cvv={creditCvv}
                onCvvChange={setCreditCvv}
                cardNumber={creditCardNumber}
                onCardNumberChange={setCreditCardNumber}
                requireFullCard
                errors={creditSecurityErrors}
              />
            ) : null}

            {fulfillment === 'delivery' ? (
              <DeliveryNotesInput
                value={form.delivery_notes}
                onChange={(delivery_notes) => setForm((f) => ({ ...f, delivery_notes }))}
              />
            ) : null}

            {fulfillment === 'delivery' ? (
              <CourierTipSelector value={courierTip} onChange={setCourierTip} />
            ) : null}

            <div className="rounded-2xl border border-vantix-cyan/15 bg-vantix-surface-raised px-4 py-3 text-sm">
              <div className="flex items-center justify-between text-vantix-fg-muted">
                <span>סכום מנות</span>
                <span>₪{totalPrice.toFixed(2)}</span>
              </div>
              {fulfillment === 'delivery' && courierTip > 0 ? (
                <div className="mt-1 flex items-center justify-between text-vantix-fg-muted">
                  <span>טיפ לשליח</span>
                  <span>₪{courierTip.toFixed(0)}</span>
                </div>
              ) : null}
              <div className="mt-2 flex items-center justify-between border-t border-vantix-cyan/10 pt-2 font-semibold text-vantix-fg">
                <span>{selectedPaymentType === 'cash' ? 'לתשלום במזומן' : 'לחיוב'}</span>
                <span className="text-vantix-cyan">₪{checkoutTotal.toFixed(2)}</span>
              </div>
            </div>

            
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
            drag="y"
            dragControls={itemModalDragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.55 }}
            onDragEnd={handleItemModalDragEnd}
            className="flex w-full max-h-[88vh] flex-col rounded-t-3xl bg-vantix-surface-raised shadow-xl sm:max-w-md sm:rounded-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div ref={itemModalScrollRef} className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
              {addItemModal.imageUrl ? (
                <div
                  className="relative aspect-[16/10] w-full cursor-grab overflow-hidden bg-vantix-surface touch-none select-none active:cursor-grabbing"
                  onPointerDown={startItemModalDrag}
                >
                  <img
                    src={addItemModal.imageUrl}
                    alt=""
                    draggable={false}
                    className="pointer-events-none h-full w-full object-cover object-center"
                  />
                </div>
              ) : null}
              <div className="p-6">
            <div
              className={`mb-2 flex items-center justify-between gap-4 ${addItemModal.imageUrl ? '' : 'cursor-grab touch-none select-none active:cursor-grabbing'}`}
              onPointerDown={addItemModal.imageUrl ? undefined : startItemModalDrag}
            >
              <h3 id="add-item-title" className="text-xl font-bold text-vantix-fg">
                {editingOldOptions !== null ? `עריכת ${addItemModal.name}` : addItemModal.name}
              </h3>
              <button
                type="button"
                onClick={closeItemModal}
                onPointerDown={(event) => event.stopPropagation()}
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
                <div
                  key={sec.id}
                  ref={(el) => {
                    if (el) itemModalSectionRefs.current.set(sec.id, el)
                    else itemModalSectionRefs.current.delete(sec.id)
                  }}
                  className={`rounded-xl border bg-vantix-surface-raised p-4 transition-shadow duration-300 ${
                    highlightSectionId === sec.id
                      ? 'border-vantix-orange ring-2 ring-vantix-orange/40 shadow-md'
                      : 'border-vantix-cyan/20'
                  }`}
                >
                  <p className="font-medium text-vantix-fg mb-1">
                    {sec.title}
                    {sec.required ? <span className="text-red-500 mr-1">*</span> : null}
                  </p>
                  {sec.required && (
                    <p className="text-xs text-vantix-fg-muted mb-2">
                      {sec.choiceType === 'single'
                        ? 'חובה לבחור אפשרות אחת'
                        : `חובה לבחור לפחות ${Math.max(1, sec.minSelections ?? 1)} אפשרויות`}
                    </p>
                  )}
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
              disabled={orderingClosed}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-vantix-orange dark:bg-vantix-cyan text-white dark:text-black py-3.5 font-semibold hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-vantix-cyan disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {editingOldOptions !== null ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              {editingOldOptions !== null ? 'שמור שינויים' : 'הוסף לעגלה'}
            </button>
            </div>
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

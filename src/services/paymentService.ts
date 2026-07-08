import { getFirebaseAuth } from '../lib/firebase'
import type { OrderCreate } from '../types/order'
import type { PaymentMethodType } from '../types/customerProfile'

export type CheckoutPaymentPayload = {
  type: PaymentMethodType
  savedPaymentId?: string
  cvv?: string
  cardNumber?: string
}

export type ChargeOrderResult = {
  orderId: string
  paymentStatus: 'paid' | 'cash_on_delivery'
  transactionUid?: string
}

function getChargeOrderUrl(): string {
  const explicit = import.meta.env.VITE_CHARGE_VANTIX_ORDER_URL as string | undefined
  if (explicit) return explicit
  return 'https://us-central1-maxdeliveries.cloudfunctions.net/chargeVantixOrder'
}

function getTokenizeCardUrl(): string {
  const explicit = import.meta.env.VITE_TOKENIZE_VANTIX_CARD_URL as string | undefined
  if (explicit) return explicit
  return 'https://us-central1-maxdeliveries.cloudfunctions.net/tokenizeVantixCustomerCard'
}

async function authFetch(url: string, body: unknown) {
  const auth = getFirebaseAuth()
  const user = auth.currentUser
  if (!user) throw new Error('יש להתחבר')

  const idToken = await user.getIdToken()
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(body),
  })

  const data = (await res.json()) as { error?: string; ok?: boolean; hasPayplusToken?: boolean }
  if (!res.ok) {
    throw new Error(data.error || 'שגיאה בשרת')
  }
  return data
}

/** יוצר טוקן PayPlus בעת שמירת כרטיס — מאפשר חיוב מהיר בהזמנה (CVV בלבד) */
export async function tokenizeSavedCard(params: {
  paymentId: string
  cardNumber: string
  cvv: string
  expiryMonth: string
  expiryYear: string
  holderId: string
}): Promise<void> {
  await authFetch(getTokenizeCardUrl(), params)
}

/**
 * יוצר הזמנה + חיוב PayPlus ישיר (ללא redirect) דרך Cloud Function מאובטח.
 * במזומן — רק יצירת הזמנה. באשראי — חיוב בשרת + שמירת טוקן לשימושים הבאים.
 */
export async function chargeAndPlaceOrder(
  order: OrderCreate,
  courierTip: number,
  payment: CheckoutPaymentPayload,
  deliveryFee = 0,
): Promise<ChargeOrderResult> {
  const auth = getFirebaseAuth()
  const user = auth.currentUser
  if (!user) throw new Error('יש להתחבר כדי להשלים הזמנה')

  const idToken = await user.getIdToken()
  const res = await fetch(getChargeOrderUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ order, courierTip, deliveryFee, payment }),
  })

  const data = (await res.json()) as {
    orderId?: string
    paymentStatus?: 'paid' | 'cash_on_delivery'
    transactionUid?: string
    error?: string
    requiresCardNumber?: boolean
  }

  if (!res.ok) {
    const err = new Error(data.error || 'שגיאה בעיבוד התשלום') as Error & {
      requiresCardNumber?: boolean
    }
    err.requiresCardNumber = data.requiresCardNumber
    throw err
  }

  if (!data.orderId || !data.paymentStatus) {
    throw new Error('תגובת שרת לא תקינה')
  }

  return {
    orderId: data.orderId,
    paymentStatus: data.paymentStatus,
    transactionUid: data.transactionUid,
  }
}

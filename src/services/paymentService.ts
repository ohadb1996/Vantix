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

export type WalletCheckoutResult = {
  orderId: string
  paymentUrl: string
  paymentStatus: 'pending_wallet'
}

function getChargeOrderUrl(): string {
  const explicit = import.meta.env.VITE_CHARGE_VANTIX_ORDER_URL as string | undefined
  if (explicit) return explicit
  return 'https://us-central1-maxdeliveries.cloudfunctions.net/chargeVantixOrder'
}

function getWalletCheckoutUrl(): string {
  const explicit = import.meta.env.VITE_WALLET_VANTIX_CHECKOUT_URL as string | undefined
  if (explicit) return explicit
  return 'https://us-central1-maxdeliveries.cloudfunctions.net/startVantixWalletCheckout'
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
 * Google Pay / Apple Pay — יוצר הזמנה ממתינה + לינק PayPlus (redirect לדף תשלום מאובטח).
 */
export async function startWalletCheckout(
  order: OrderCreate,
  courierTip: number,
  walletType: 'gpay' | 'apay',
  deliveryFee = 0,
): Promise<WalletCheckoutResult> {
  const auth = getFirebaseAuth()
  const user = auth.currentUser
  if (!user) throw new Error('יש להתחבר כדי להשלים הזמנה')

  const idToken = await user.getIdToken()
  const res = await fetch(getWalletCheckoutUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      order,
      courierTip,
      deliveryFee,
      payment: { type: walletType },
    }),
  })

  const data = (await res.json()) as {
    orderId?: string
    paymentUrl?: string
    paymentStatus?: 'pending_wallet'
    error?: string
  }

  if (!res.ok) {
    throw new Error(data.error || 'שגיאה ביצירת תשלום Google Pay / Apple Pay')
  }

  if (!data.orderId || !data.paymentUrl) {
    throw new Error('לא התקבל לינק תשלום מהשרת')
  }

  return {
    orderId: data.orderId,
    paymentUrl: data.paymentUrl,
    paymentStatus: 'pending_wallet',
  }
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

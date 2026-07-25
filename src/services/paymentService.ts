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

export type CryptoCheckoutResult = {
  orderId: string
  paymentUrl: string
  paymentStatus: 'pending_crypto'
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

function getCryptoCheckoutUrl(): string {
  const explicit = import.meta.env.VITE_CRYPTO_VANTIX_CHECKOUT_URL as string | undefined
  if (explicit) return explicit
  return 'https://us-central1-maxdeliveries.cloudfunctions.net/startVantixCryptoCheckout'
}

function getCryptoFeeQuoteUrl(): string {
  const explicit = import.meta.env.VITE_CRYPTO_FEE_QUOTE_URL as string | undefined
  if (explicit) return explicit
  return 'https://us-central1-maxdeliveries.cloudfunctions.net/quoteVantixCryptoTransferFee'
}

/** עמלת העברה קבועה בתשלום קריפטו (מוצגת ללקוח; החיוב בפועל בשרת) */
export const CRYPTO_TRANSFER_FEE_USDT = 1

/** מטבעות מותרים לתשלום קריפטו */
export const CRYPTO_PAY_CURRENCY_OPTIONS = [
  { id: 'btc' as const, label: 'Bitcoin (BTC)' },
  { id: 'usdttrc20' as const, label: 'USDT (TRC20)' },
] as const

export type CryptoPayCurrency = (typeof CRYPTO_PAY_CURRENCY_OPTIONS)[number]['id']

export type CryptoTransferFeeQuote = {
  feeUsdt: number
  feeIls: number
}

export async function quoteCryptoTransferFee(): Promise<CryptoTransferFeeQuote> {
  const res = await fetch(getCryptoFeeQuoteUrl(), { method: 'GET' })
  const data = (await res.json()) as {
    feeUsdt?: number
    feeIls?: number
    error?: string
  }
  if (!res.ok) {
    throw new Error(data.error || 'שגיאה בחישוב עמלת קריפטו')
  }
  const feeUsdt = Number(data.feeUsdt)
  const feeIls = Number(data.feeIls)
  if (!Number.isFinite(feeUsdt) || !Number.isFinite(feeIls) || feeIls < 0) {
    throw new Error('תגובת עמלת קריפטו לא תקינה')
  }
  return { feeUsdt, feeIls }
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
 * קריפטו — יוצר הזמנה ממתינה + לינק NOWPayments (redirect לדף תשלום).
 * אחרי אישור IPN ההזמנה מסומנת כשולמה ומופקת חשבונית PayPlus (אם מוגדר).
 */
export async function startCryptoCheckout(
  order: OrderCreate,
  courierTip: number,
  deliveryFee = 0,
  payCurrency: CryptoPayCurrency,
): Promise<CryptoCheckoutResult> {
  const auth = getFirebaseAuth()
  const user = auth.currentUser
  if (!user) throw new Error('יש להתחבר כדי להשלים הזמנה')

  const idToken = await user.getIdToken()
  const res = await fetch(getCryptoCheckoutUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      order,
      courierTip,
      deliveryFee,
      payment: { type: 'crypto', payCurrency },
    }),
  })

  const data = (await res.json()) as {
    orderId?: string
    paymentUrl?: string
    paymentStatus?: 'pending_crypto'
    error?: string
  }

  if (!res.ok) {
    throw new Error(data.error || 'שגיאה ביצירת תשלום קריפטו')
  }

  if (!data.orderId || !data.paymentUrl) {
    throw new Error('לא התקבל לינק תשלום קריפטו מהשרת')
  }

  return {
    orderId: data.orderId,
    paymentUrl: data.paymentUrl,
    paymentStatus: 'pending_crypto',
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

import type { PaymentMethodType } from '../types/customerProfile'

export type WalletPaymentResult = {
  token: string
  walletType: 'gpay' | 'apay'
}

type WalletConfig = {
  googlePayMerchantId?: string
  payplusGatewayMerchantId?: string
  applePayMerchantId?: string
  merchantName: string
}

function getWalletConfig(): WalletConfig {
  return {
    googlePayMerchantId: import.meta.env.VITE_GOOGLE_PAY_MERCHANT_ID as string | undefined,
    payplusGatewayMerchantId: import.meta.env.VITE_PAYPLUS_GATEWAY_MERCHANT_ID as string | undefined,
    applePayMerchantId: import.meta.env.VITE_APPLE_PAY_MERCHANT_ID as string | undefined,
    merchantName: (import.meta.env.VITE_MERCHANT_DISPLAY_NAME as string | undefined) || 'Vantix',
  }
}

export function isWalletPaymentConfigured(type: 'gpay' | 'apay'): boolean {
  const cfg = getWalletConfig()
  if (type === 'gpay') {
    return Boolean(cfg.googlePayMerchantId && cfg.payplusGatewayMerchantId)
  }
  return Boolean(cfg.applePayMerchantId)
}

export function isWalletPaymentSupported(type: 'gpay' | 'apay'): boolean {
  if (typeof window === 'undefined' || !window.PaymentRequest) return false
  if (type === 'apay' && !/Safari/.test(navigator.userAgent) && !(window as Window & { ApplePaySession?: unknown }).ApplePaySession) {
    return false
  }
  return true
}

function buildGooglePayMethodData(cfg: WalletConfig) {
  return {
    supportedMethods: 'https://google.com/pay',
    data: {
      apiVersion: 2,
      apiVersionMinor: 0,
      allowedPaymentMethods: [
        {
          type: 'CARD',
          parameters: {
            allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
            allowedCardNetworks: ['AMEX', 'MASTERCARD', 'VISA'],
          },
          tokenizationSpecification: {
            type: 'PAYMENT_GATEWAY',
            parameters: {
              gateway: 'payplus',
              gatewayMerchantId: cfg.payplusGatewayMerchantId,
            },
          },
        },
      ],
      merchantInfo: {
        merchantId: cfg.googlePayMerchantId,
        merchantName: cfg.merchantName,
      },
    },
  }
}

function buildApplePayMethodData(cfg: WalletConfig) {
  return {
    supportedMethods: 'https://apple.com/apple-pay',
    data: {
      version: 3,
      merchantIdentifier: cfg.applePayMerchantId,
      merchantCapabilities: ['supports3DS'],
      supportedNetworks: ['visa', 'masterCard', 'amex'],
      countryCode: 'IL',
    },
  }
}

function extractWalletToken(details: PaymentResponse, walletType: 'gpay' | 'apay'): string {
  const methodName = details.methodName
  const token =
    walletType === 'gpay'
      ? JSON.stringify((details as PaymentResponse & { details?: unknown }).details ?? {})
      : JSON.stringify((details as PaymentResponse & { details?: unknown }).details ?? {})

  if (!methodName) throw new Error('לא התקבל אישור תשלום מהארנק')
  return token
}

/**
 * פותח את מסך Google Pay / Apple Pay דרך Payment Request API.
 * דורש הגדרת merchant IDs ב-.env ותמיכה ב-chargeVantixOrder בשרת.
 */
export async function requestWalletPayment(params: {
  walletType: 'gpay' | 'apay'
  amount: number
  label: string
}): Promise<WalletPaymentResult> {
  const { walletType, amount, label } = params
  const cfg = getWalletConfig()

  if (!isWalletPaymentSupported(walletType)) {
    throw new Error('הדפדפן או המכשיר לא תומכים באמצעי תשלום זה')
  }

  if (!isWalletPaymentConfigured(walletType)) {
    throw new Error('תשלום ארנק דיגיטלי עדיין לא הוגדר בשרת – בחרו כרטיס אשראי או מזומן')
  }

  const methodData =
    walletType === 'gpay' ? buildGooglePayMethodData(cfg) : buildApplePayMethodData(cfg)

  const request = new PaymentRequest(
    [methodData],
    {
      total: {
        label,
        amount: { currency: 'ILS', value: amount.toFixed(2) },
      },
    },
    { requestPayerName: false, requestPayerEmail: false, requestPayerPhone: false },
  )

  const canPay = await request.canMakePayment()
  if (!canPay) {
    throw new Error('לא נמצא ארנק דיגיטלי זמין במכשיר – בחרו כרטיס אשראי או מזומן')
  }

  const response = await request.show()
  try {
    const token = extractWalletToken(response, walletType)
    await response.complete('success')
    return { token, walletType }
  } catch (e) {
    await response.complete('fail')
    throw e
  }
}

export function walletPaymentTypeLabel(type: PaymentMethodType): string | null {
  if (type === 'gpay') return 'Google Pay'
  if (type === 'apay') return 'Apple Pay'
  return null
}

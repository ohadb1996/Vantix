import { getFirebaseAuth } from '../lib/firebase'

export type DeliveryQuote = {
  distance_km: number
  delivery_fee: number
  max_delivery_km: number
  within_range: boolean
}

function getQuoteUrl(): string {
  const explicit = import.meta.env.VITE_QUOTE_VANTIX_DELIVERY_URL as string | undefined
  if (explicit) return explicit
  return 'https://us-central1-maxdeliveries.cloudfunctions.net/quoteVantixDeliveryFee'
}

export function buildDestinationAddress(parts: {
  delivery_street?: string
  delivery_building_number?: string
  delivery_city?: string
}): string {
  const streetLine = [parts.delivery_street, parts.delivery_building_number].filter(Boolean).join(' ').trim()
  if (!streetLine && !parts.delivery_city) return ''
  if (!parts.delivery_city) return streetLine
  if (!streetLine) return parts.delivery_city.trim()
  return `${streetLine}, ${parts.delivery_city.trim()}`
}

export async function quoteDeliveryFee(
  businessId: string,
  destinationAddress: string,
): Promise<DeliveryQuote> {
  const auth = getFirebaseAuth()
  const user = auth.currentUser
  if (!user) throw new Error('יש להתחבר')

  const idToken = await user.getIdToken()
  const res = await fetch(getQuoteUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      business_id: businessId,
      destinationAddress,
    }),
  })

  const data = (await res.json()) as DeliveryQuote & { error?: string; code?: string }
  if (!res.ok) {
    const err = new Error(data.error || 'לא ניתן לחשב דמי משלוח') as Error & { code?: string }
    err.code = data.code
    throw err
  }

  return data
}

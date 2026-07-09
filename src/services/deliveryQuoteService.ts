import { getFirebaseAuth } from '../lib/firebase'

export type DeliveryQuote = {
  distance_km: number
  delivery_fee: number
  min_delivery_total: number
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
  let line = ''
  if (!streetLine && !parts.delivery_city) return ''
  if (!parts.delivery_city) line = streetLine
  else if (!streetLine) line = parts.delivery_city.trim()
  else line = `${streetLine}, ${parts.delivery_city.trim()}`

  if (!line) return ''
  if (line.includes('ישראל') || line.toLowerCase().includes('israel')) return line
  return `${line}, ישראל`
}

export function formatSavedAddressLine(parts: {
  label?: string
  delivery_street?: string
  delivery_building_number?: string
  delivery_city?: string
}): string {
  const address = buildDestinationAddress(parts)
  const label = parts.label?.trim()
  if (label && address) return `${label} · ${address}`
  return label || address
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

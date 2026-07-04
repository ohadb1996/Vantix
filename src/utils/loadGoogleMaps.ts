const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
const SCRIPT_ID = 'google-maps-script'
const CALLBACK_NAME = '__vantixGoogleMapsOnLoad'

type GoogleMapsWindow = Window & {
  google?: {
    maps?: {
      Map?: unknown
      Geocoder?: unknown
      places?: unknown
    }
  }
  [CALLBACK_NAME]?: () => void
}

let loadPromise: Promise<void> | null = null

export function hasGoogleMapsApiKey(): boolean {
  return API_KEY.length >= 10
}

export function ensureGoogleMapsLoaded(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('No window'))
  const w = window as GoogleMapsWindow
  if (w.google?.maps?.Map) return Promise.resolve()
  if (loadPromise) return loadPromise
  if (!hasGoogleMapsApiKey()) {
    return Promise.reject(new Error('Google Maps API key not configured'))
  }

  loadPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID)
    if (existing) {
      const timer = window.setInterval(() => {
        if (w.google?.maps?.Map) {
          window.clearInterval(timer)
          resolve()
        }
      }, 100)
      return
    }

    w[CALLBACK_NAME] = () => {
      if (w.google?.maps?.Map) resolve()
      else reject(new Error('Google Maps failed to load'))
    }

    const script = document.createElement('script')
    script.id = SCRIPT_ID
    script.async = true
    script.defer = true
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(API_KEY)}&libraries=places&language=iw&loading=async&callback=${CALLBACK_NAME}`
    script.onerror = () => reject(new Error('Failed to load Google Maps script'))
    document.head.appendChild(script)
  })

  return loadPromise
}

export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  if (!address.trim()) return null
  await ensureGoogleMapsLoaded()
  const w = window as GoogleMapsWindow
  const Geocoder = (w.google?.maps as { Geocoder?: new () => { geocode: (r: object, cb: (r: Array<{ geometry?: { location?: { lat: () => number; lng: () => number } } }>, s: string) => void) => void } })?.Geocoder
  if (!Geocoder) return null

  return new Promise((resolve) => {
    const geocoder = new Geocoder()
    geocoder.geocode({ address, region: 'IL' }, (results, status) => {
      if (status !== 'OK' || !results?.[0]?.geometry?.location) {
        resolve(null)
        return
      }
      const loc = results[0].geometry!.location!
      resolve({ lat: loc.lat(), lng: loc.lng() })
    })
  })
}

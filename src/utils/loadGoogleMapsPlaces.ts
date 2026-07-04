const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
const SCRIPT_ID = 'google-maps-places-script'
const CALLBACK_NAME = '__vantixGooglePlacesOnLoad'

type GoogleMapsWindow = Window & {
  google?: {
    maps?: {
      places?: unknown
    }
  }
  [CALLBACK_NAME]?: () => void
}

let loadPromise: Promise<void> | null = null

export function hasGoogleMapsApiKey(): boolean {
  return API_KEY.length >= 10
}

export function ensureGoogleMapsPlacesLoaded(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('No window'))
  const w = window as GoogleMapsWindow
  if (w.google?.maps?.places) return Promise.resolve()
  if (loadPromise) return loadPromise
  if (!hasGoogleMapsApiKey()) {
    return Promise.reject(new Error('Google Maps API key not configured'))
  }

  loadPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID)
    if (existing) {
      const timer = window.setInterval(() => {
        if (w.google?.maps?.places) {
          window.clearInterval(timer)
          resolve()
        }
      }, 100)
      return
    }

    w[CALLBACK_NAME] = () => {
      if (w.google?.maps?.places) resolve()
      else reject(new Error('Places library failed to load'))
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

import { useEffect, useRef, useState } from 'react'
import { MapPin } from 'lucide-react'
import { ensureGoogleMapsPlacesLoaded, hasGoogleMapsApiKey } from '../../utils/loadGoogleMapsPlaces'

type AddressResult = {
  city?: string
  street?: string
  buildingNumber?: string
}

type GoogleAddressComponent = {
  long_name?: string
  short_name?: string
  types?: string[]
}

type GooglePlace = {
  address_components?: GoogleAddressComponent[]
}

function getComponent(place: GooglePlace, type: string): string {
  const match = place.address_components?.find((c) => c.types?.includes(type))
  return (match?.long_name || match?.short_name || '').trim()
}

function parsePlace(place: GooglePlace): AddressResult {
  const city =
    getComponent(place, 'locality') ||
    getComponent(place, 'postal_town') ||
    getComponent(place, 'sublocality_level_1')
  const street =
    getComponent(place, 'route') ||
    getComponent(place, 'premise') ||
    getComponent(place, 'establishment') ||
    getComponent(place, 'point_of_interest')
  const buildingNumber = getComponent(place, 'street_number')
  return { city, street, buildingNumber }
}

export function AddressAutocompleteField({
  value = '',
  onSelect,
  error,
  required = true,
}: {
  value?: string
  onSelect: (result: AddressResult) => void
  error?: string
  required?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<unknown>(null)
  const onSelectRef = useRef(onSelect)
  const [enabled, setEnabled] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [displayValue, setDisplayValue] = useState(value)

  onSelectRef.current = onSelect

  useEffect(() => {
    setDisplayValue(value)
  }, [value])

  useEffect(() => {
    let cancelled = false
    if (!hasGoogleMapsApiKey()) return

    ensureGoogleMapsPlacesLoaded()
      .then(() => {
        if (!cancelled) setEnabled(true)
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : 'Google Places unavailable')
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!enabled || !inputRef.current || autocompleteRef.current) return
    const w = window as unknown as {
      google?: {
        maps?: {
          places?: {
            Autocomplete: new (input: HTMLInputElement, options?: Record<string, unknown>) => {
              addListener: (eventName: string, handler: () => void) => void
              getPlace: () => GooglePlace
            }
          }
          event?: {
            clearInstanceListeners: (instance: unknown) => void
          }
        }
      }
    }
    const AutocompleteCtor = w.google?.maps?.places?.Autocomplete
    if (!AutocompleteCtor) return

    const autocomplete = new AutocompleteCtor(inputRef.current, {
      componentRestrictions: { country: 'il' },
      fields: ['address_components'],
    })
    autocompleteRef.current = autocomplete

    autocomplete.addListener('place_changed', () => {
      const result = parsePlace(autocomplete.getPlace())
      if (!result.city && !result.street) return
      onSelectRef.current(result)
    })

    return () => {
      w.google?.maps?.event?.clearInstanceListeners?.(autocomplete)
      autocompleteRef.current = null
    }
  }, [enabled])

  return (
    <div className="space-y-1.5">
      <label className="mb-1 block text-sm font-medium text-vantix-fg">
        כתובת מלאה
        {required ? ' *' : <span className="text-vantix-fg-subtle"> (אופציונלי)</span>}
      </label>
      <div className="relative">
        <MapPin className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-vantix-cyan/80" />
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={(e) => setDisplayValue(e.target.value)}
          placeholder="הקלד כתובת ובחר מהרשימה"
          disabled={!enabled}
          className={`w-full rounded-xl border bg-vantix-surface py-2.5 pr-9 pl-3 text-vantix-fg outline-none transition placeholder:text-vantix-fg-subtle focus:ring-2 focus:ring-vantix-cyan/20 disabled:opacity-60 ${
            error ? 'border-red-400' : 'border-vantix-cyan/25 focus:border-vantix-cyan/50'
          }`}
          autoComplete="off"
        />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      {!hasGoogleMapsApiKey() ? (
        <p className="text-xs text-amber-500">חסר Google Maps API key, לכן השלמה אוטומטית כבויה כרגע.</p>
      ) : loadError ? (
        <p className="text-xs text-amber-500">חיפוש כתובות לא זמין כרגע, אפשר למלא ידנית.</p>
      ) : (
        <p className="text-xs text-vantix-fg-subtle">בחירת כתובת תמלא אוטומטית עיר, רחוב ומספר בית (אם קיים).</p>
      )}
    </div>
  )
}

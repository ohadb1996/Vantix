import { useCallback, useEffect, useState } from 'react'
import { buildDestinationAddress } from '../services/deliveryQuoteService'
import { getDeviceCoordinates } from '../utils/geolocation'
import type { SavedAddress } from '../types/customerProfile'

const STORAGE_KEY = 'vantix_delivery_quote_location_v1'

export type QuoteLocationChoice =
  | { kind: 'current' }
  | { kind: 'saved'; addressId: string }

function loadStoredChoice(): QuoteLocationChoice | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as QuoteLocationChoice
    if (parsed?.kind === 'current') return { kind: 'current' }
    if (parsed?.kind === 'saved' && typeof parsed.addressId === 'string') {
      return { kind: 'saved', addressId: parsed.addressId }
    }
    return null
  } catch {
    return null
  }
}

function saveStoredChoice(choice: QuoteLocationChoice) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(choice))
}

export function getQuoteLocationLabel(
  choice: QuoteLocationChoice | null,
  savedAddresses: SavedAddress[],
  opts?: { isResolving?: boolean; geoUnavailable?: boolean },
): string {
  if (!choice) return 'בחרו מיקום'
  if (choice.kind === 'current') {
    if (opts?.isResolving) return 'מאתר מיקום נוכחי...'
    if (opts?.geoUnavailable) return 'מיקום נוכחי לא זמין'
    return 'מיקום נוכחי'
  }
  const address = savedAddresses.find((a) => a.id === choice.addressId)
  if (!address) return 'כתובת שמורה'
  const label = address.label?.trim()
  const line = buildDestinationAddress(address)
  return label && line ? `${label} · ${line}` : label || line || 'כתובת שמורה'
}

export function useQuoteLocation(
  savedAddresses: SavedAddress[],
  enabled: boolean,
  savedAddressesLoading = false,
) {
  const [choice, setChoiceState] = useState<QuoteLocationChoice | null>(() => loadStoredChoice())
  const [quoteDestination, setQuoteDestination] = useState<string | null>(null)
  const [isResolving, setIsResolving] = useState(false)
  const [geoUnavailable, setGeoUnavailable] = useState(false)
  const [currentCoords, setCurrentCoords] = useState<string | null>(null)

  const setChoice = useCallback((next: QuoteLocationChoice) => {
    setChoiceState(next)
    saveStoredChoice(next)
    setGeoUnavailable(false)
    setCurrentCoords(null)

    if (next.kind === 'saved') {
      const address = savedAddresses.find((a) => a.id === next.addressId)
      setQuoteDestination(address ? buildDestinationAddress(address) || null : null)
      setIsResolving(false)
      return
    }

    setQuoteDestination(null)
    setIsResolving(true)
  }, [savedAddresses])

  useEffect(() => {
    if (!enabled) {
      setQuoteDestination(null)
      return
    }
    if (savedAddressesLoading) return

    if (!choice) {
      const defaultAddress = savedAddresses.find((a) => a.isDefault) || savedAddresses[0]
      if (defaultAddress) {
        setChoice({ kind: 'saved', addressId: defaultAddress.id })
        return
      }
      setChoice({ kind: 'current' })
      return
    }

    if (choice.kind === 'saved') {
      const address = savedAddresses.find((a) => a.id === choice.addressId)
      if (!address) {
        const fallback = savedAddresses.find((a) => a.isDefault) || savedAddresses[0]
        if (fallback) {
          setChoice({ kind: 'saved', addressId: fallback.id })
        } else {
          setChoice({ kind: 'current' })
        }
      }
    }
  }, [enabled, choice, savedAddresses, savedAddressesLoading, setChoice])

  useEffect(() => {
    if (choice?.kind !== 'current') {
      setCurrentCoords(null)
    }
  }, [choice?.kind])

  useEffect(() => {
    if (!enabled || !choice || choice.kind !== 'saved') {
      return
    }

    if (savedAddressesLoading) return

    const address = savedAddresses.find((a) => a.id === choice.addressId)
    if (!address) {
      const fallback = savedAddresses.find((a) => a.isDefault) || savedAddresses[0]
      if (fallback) {
        setChoice({ kind: 'saved', addressId: fallback.id })
      } else {
        setChoice({ kind: 'current' })
      }
      return
    }

    setQuoteDestination(buildDestinationAddress(address) || null)
    setIsResolving(false)
    setGeoUnavailable(false)
  }, [enabled, choice, savedAddresses, savedAddressesLoading, setChoice])

  useEffect(() => {
    if (!enabled || choice?.kind !== 'current') {
      if (!enabled || !choice) {
        setQuoteDestination(null)
        setIsResolving(false)
      }
      return
    }

    if (currentCoords) {
      setQuoteDestination(currentCoords)
      setIsResolving(false)
      setGeoUnavailable(false)
      return
    }

    let cancelled = false
    setIsResolving(true)
    setGeoUnavailable(false)

    void getDeviceCoordinates().then((coords) => {
      if (cancelled) return
      if (!coords) {
        setGeoUnavailable(true)
        setQuoteDestination(null)
        setIsResolving(false)
        return
      }
      const value = `${coords.latitude},${coords.longitude}`
      setCurrentCoords(value)
      setQuoteDestination(value)
      setIsResolving(false)
      setGeoUnavailable(false)
    })

    return () => {
      cancelled = true
    }
  }, [enabled, choice?.kind, currentCoords])

  return {
    choice,
    setChoice,
    quoteDestination,
    isResolving,
    geoUnavailable,
  }
}

import { useMemo } from 'react'
import { useSavedAddresses } from './useCustomerProfile'
import { useQuoteLocationContext } from '../context/QuoteLocationContext'
import { useRestaurants } from './useRestaurants'
import { useRestaurantsNearDestination } from './useRestaurantsNearDestination'
import { resolveMinDeliveryTotal } from '../constants/deliveryPricing'
import type { BusinessWithMenu } from '../services/orderService'
import type { DiscoveredRestaurant } from '../services/restaurantDiscoveryService'

/** רשימת מסעדות ללקוח — עם סינון מיקום (discovery) או כל האינדקס (אורחים). */
export function useCustomerRestaurantCatalog(
  isLoggedIn: boolean,
  options?: { serverSearchQuery?: string },
) {
  const { items: savedAddresses } = useSavedAddresses()
  const {
    choice: quoteLocationChoice,
    setChoice: setQuoteLocationChoice,
    quoteDestination,
    isResolving: isResolvingQuoteLocation,
    geoUnavailable: quoteGeoUnavailable,
  } = useQuoteLocationContext()

  const isLocationReady =
    isLoggedIn && !!quoteDestination && !isResolvingQuoteLocation
  const serverSearchQuery = options?.serverSearchQuery?.trim() || undefined

  const { data: allBusinesses, isLoading, error: listError, refetch, isRefetching } = useRestaurants()
  const {
    data: discoveredData,
    isPending: isDiscoveryPending,
    isFetching: isDiscoveringFetch,
    refetch: refetchDiscovered,
    error: discoverError,
  } = useRestaurantsNearDestination(
    quoteDestination,
    isLocationReady,
    isLocationReady ? serverSearchQuery : undefined,
  )

  const businesses = useMemo((): BusinessWithMenu[] => {
    if (!isLoggedIn) return allBusinesses ?? []
    if (!isLocationReady) return []
    return discoveredData?.businesses ?? []
  }, [isLoggedIn, isLocationReady, discoveredData?.businesses, allBusinesses])

  const distanceKmByBusiness = useMemo(() => {
    if (!isLocationReady) return {} as Record<string, number>
    const map: Record<string, number> = {}
    for (const b of (discoveredData?.businesses ?? []) as DiscoveredRestaurant[]) {
      map[b.businessId] = b.distance_km
    }
    return map
  }, [isLocationReady, discoveredData?.businesses])

  const deliveryFeeByBusiness = useMemo(() => {
    if (!isLocationReady) return {} as Record<string, number>
    const map: Record<string, number> = {}
    for (const b of (discoveredData?.businesses ?? []) as DiscoveredRestaurant[]) {
      map[b.businessId] = b.delivery_fee
    }
    return map
  }, [isLocationReady, discoveredData?.businesses])

  const minDeliveryTotalByBusiness = useMemo(() => {
    const map: Record<string, number> = {}
    for (const b of businesses) {
      map[b.businessId] = resolveMinDeliveryTotal(b.minDeliveryTotal)
    }
    return map
  }, [businesses])

  const isLocationCatalogPending =
    isLoggedIn && (isResolvingQuoteLocation || !quoteDestination || isDiscoveryPending)

  const isLoadingRestaurants = isLoggedIn ? isLocationCatalogPending : isLoading
  const isRefreshingRestaurants = isLoggedIn ? isDiscoveringFetch : isRefetching

  const refetchRestaurants = () =>
    isLocationReady ? refetchDiscovered() : refetch()

  return {
    businesses,
    distanceKmByBusiness,
    deliveryFeeByBusiness,
    minDeliveryTotalByBusiness,
    isLoadingRestaurants,
    isRefreshingRestaurants,
    refetchRestaurants,
    isLocationCatalogPending,
    savedAddresses,
    quoteLocationChoice,
    setQuoteLocationChoice,
    isResolvingQuoteLocation,
    quoteGeoUnavailable,
    useLocationFilter: isLocationReady,
    catalogLocationKey: quoteDestination,
    maxDeliveryKm: discoveredData?.max_delivery_km,
    listError,
    discoverError,
  }
}

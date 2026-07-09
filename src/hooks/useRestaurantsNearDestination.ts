import { useQuery } from '@tanstack/react-query'
import { discoverRestaurantsNearDestination } from '../services/restaurantDiscoveryService'

export function useRestaurantsNearDestination(
  destination: string | null,
  enabled: boolean,
  searchQuery?: string,
) {
  const q = searchQuery?.trim() || undefined

  return useQuery({
    queryKey: ['vantixRestaurantsNear', destination, q] as const,
    queryFn: () => discoverRestaurantsNearDestination(destination!, q),
    enabled: enabled && !!destination,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: undefined,
  })
}

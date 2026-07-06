import { useQuery } from '@tanstack/react-query'
import { getBusinessesWithMenus } from '../services/orderService'

const QUERY_KEY = ['businessesWithMenus'] as const

export function useRestaurants() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: getBusinessesWithMenus,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  })
}

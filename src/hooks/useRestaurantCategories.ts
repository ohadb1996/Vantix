import { useQuery } from '@tanstack/react-query'
import { getRestaurantCategories } from '../services/restaurantCategories'

const QUERY_KEY = ['restaurantCategories'] as const

export function useRestaurantCategories() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: getRestaurantCategories,
    staleTime: 2 * 60 * 1000,
  })
}

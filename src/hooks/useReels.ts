import { useQuery } from '@tanstack/react-query'
import { getReels } from '../services/reels'

const QUERY_KEY = ['vantixReels'] as const

export function useReels() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: getReels,
    staleTime: 5 * 60 * 1000,
  })
}

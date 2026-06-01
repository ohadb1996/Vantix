import { useQuery } from '@tanstack/react-query'
import {
  fetchMoodCollections,
  fetchSmartFilters,
  fetchSpotlightCampaign,
} from '../../../services/discovery'

const DISCOVERY_QUERY_KEY = ['discovery', 'landing']

export const useDiscoveryData = () => {
  return useQuery({
    queryKey: DISCOVERY_QUERY_KEY,
    queryFn: async () => {
      const [collections, filters, spotlight] = await Promise.all([
        fetchMoodCollections(),
        fetchSmartFilters(),
        fetchSpotlightCampaign(),
      ])
      return { collections, filters, spotlight }
    },
    staleTime: 1000 * 60 * 5,
  })
}


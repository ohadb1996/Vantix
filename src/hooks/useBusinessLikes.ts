import { useCallback, useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { getUserLikedBusinessIds, toggleBusinessLike } from '../services/businessLikes'

const QUERY_KEY = ['userLikedBusinesses'] as const

export function useBusinessLikes() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const { data: likedIds = new Set<string>(), isLoading } = useQuery({
    queryKey: [...QUERY_KEY, user?.uid],
    queryFn: () => (user ? getUserLikedBusinessIds(user.uid) : Promise.resolve(new Set<string>())),
    enabled: !!user,
    staleTime: 60 * 1000,
  })

  const [localLiked, setLocalLiked] = useState<Set<string>>(new Set())

  useEffect(() => {
    setLocalLiked(new Set(likedIds))
  }, [likedIds])

  const isLiked = useCallback(
    (businessId: string) => localLiked.has(businessId),
    [localLiked]
  )

  const toggleLike = useCallback(
    async (businessId: string): Promise<'login' | 'ok' | 'error'> => {
      if (!user) return 'login'
      if (togglingId) return 'error'

      const wasLiked = localLiked.has(businessId)
      setTogglingId(businessId)
      setLocalLiked((prev) => {
        const next = new Set(prev)
        if (wasLiked) next.delete(businessId)
        else next.add(businessId)
        return next
      })

      try {
        await toggleBusinessLike(user.uid, businessId, wasLiked)
        void queryClient.invalidateQueries({ queryKey: ['businessesWithMenus'] })
        return 'ok'
      } catch {
        setLocalLiked((prev) => {
          const next = new Set(prev)
          if (wasLiked) next.add(businessId)
          else next.delete(businessId)
          return next
        })
        return 'error'
      } finally {
        setTogglingId(null)
      }
    },
    [user, localLiked, togglingId, queryClient]
  )

  return {
    isLiked,
    toggleLike,
    togglingId,
    isLoading,
    isLoggedIn: !!user,
  }
}

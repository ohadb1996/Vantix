import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getMenuItemOrderCounts, type MenuItemOrderCounts } from '../services/menuItemStats'

export function useMenuItemStats(businessId: string | undefined) {
  const queryClient = useQueryClient()

  const query = useQuery<MenuItemOrderCounts>({
    queryKey: ['menuItemStats', businessId],
    queryFn: () => (businessId ? getMenuItemOrderCounts(businessId) : Promise.resolve({})),
    enabled: !!businessId,
    staleTime: 2 * 60 * 1000,
  })

  const bumpLocalCounts = (lines: { menuItemId: string; quantity: number }[]) => {
    if (!businessId) return
    queryClient.setQueryData<MenuItemOrderCounts>(['menuItemStats', businessId], (prev) => {
      const next: MenuItemOrderCounts = { ...(prev ?? {}) }
      for (const { menuItemId, quantity } of lines) {
        next[menuItemId] = (next[menuItemId] ?? 0) + quantity
      }
      return next
    })
  }

  return {
    orderCounts: query.data ?? ({} as MenuItemOrderCounts),
    isLoading: query.isLoading,
    bumpLocalCounts,
    refetch: query.refetch,
  }
}

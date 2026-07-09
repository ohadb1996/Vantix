import { useQuery } from '@tanstack/react-query'
import { resolveMinDeliveryTotal } from '../constants/deliveryPricing'
import { getBusinessMenu, getBusinessesWithMenus } from '../services/orderService'

export function useMenu(businessId: string | undefined) {
  const menuQuery = useQuery({
    queryKey: ['menu', businessId],
    queryFn: () => (businessId ? getBusinessMenu(businessId) : Promise.resolve(null)),
    enabled: !!businessId,
  })

  const businessesQuery = useQuery({
    queryKey: ['businessesWithMenus'],
    queryFn: getBusinessesWithMenus,
    enabled: !!businessId,
  })

  const business = businessId
    ? businessesQuery.data?.find((b) => b.businessId === businessId)
    : undefined

  return {
    menu: menuQuery.data ?? null,
    businessName: business?.businessName ?? '',
    businessLogoUrl: business?.logoUrl ?? null,
    businessMinDeliveryTotal: resolveMinDeliveryTotal(business?.minDeliveryTotal),
    businessPickupAddress: business?.pickupAddress ?? null,
    isOpenNow: business?.isOpenNow !== false,
    businessHours: business?.businessHours ?? null,
    isLoading: menuQuery.isLoading,
    error: menuQuery.error,
    refetch: menuQuery.refetch,
  }
}

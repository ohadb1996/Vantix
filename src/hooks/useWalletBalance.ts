import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { getWalletBalance } from '../services/walletService'

export function useWalletBalance() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['walletBalance', user?.uid],
    queryFn: () => getWalletBalance(user!.uid),
    enabled: !!user,
    staleTime: 30 * 1000,
  })
}

import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { getWalletBalance, getWalletSummary, getWalletTransactions } from '../services/walletService'

export function useWalletBalance() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['walletBalance', user?.uid],
    queryFn: () => getWalletBalance(user!.uid),
    enabled: !!user,
    staleTime: 30 * 1000,
  })
}

export function useWalletSummary() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['walletSummary', user?.uid],
    queryFn: () => getWalletSummary(user!.uid),
    enabled: !!user,
    staleTime: 30 * 1000,
  })
}

export function useWalletTransactions(limit = 40) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['walletTransactions', user?.uid, limit],
    queryFn: () => getWalletTransactions(user!.uid, limit),
    enabled: !!user,
    staleTime: 30 * 1000,
  })
}

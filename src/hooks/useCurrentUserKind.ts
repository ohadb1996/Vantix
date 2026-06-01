import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { getIsAdmin, getIsAdminKing } from '../services/adminService'

/**
 * מחזיר האם המשתמש אדמין (קיים ב-RTDB Admins/{uid}).
 */
export function useCurrentUserKind(): {
  isAdmin: boolean
  isLoading: boolean
} {
  const { user } = useAuth()
  const { data: isAdmin = false, isLoading } = useQuery({
    queryKey: ['userIsAdmin', user?.uid],
    queryFn: () => (user?.uid ? getIsAdmin(user.uid) : Promise.resolve(false)),
    enabled: !!user?.uid,
    staleTime: 60 * 1000,
  })
  return { isAdmin, isLoading }
}

/**
 * מחזיר האם המשתמש אדמין מלך (Admins/{uid}/isKing === true).
 */
export function useAdminKing(): {
  isAdminKing: boolean
  isLoading: boolean
} {
  const { user } = useAuth()
  const { data: isAdminKing = false, isLoading } = useQuery({
    queryKey: ['userIsAdminKing', user?.uid],
    queryFn: () => (user?.uid ? getIsAdminKing(user.uid) : Promise.resolve(false)),
    enabled: !!user?.uid,
    staleTime: 60 * 1000,
  })
  return { isAdminKing, isLoading }
}

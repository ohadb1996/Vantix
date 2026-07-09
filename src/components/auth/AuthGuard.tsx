import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useAuthSheet } from '../../context/AuthSheetContext'
import { ROUTES } from '../../constants/app'

/**
 * מגן על נתיבים – רק משתמש מחובר רואה את התוכן.
 * אחרת פותח כרטיסיית התחברות מלמטה.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  const { openAuthSheet } = useAuthSheet()
  const navigate = useNavigate()

  useEffect(() => {
    if (loading || user) return
    openAuthSheet('login', location.pathname)
    navigate(ROUTES.RESTAURANTS, { replace: true })
  }, [loading, user, location.pathname, openAuthSheet, navigate])

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-vantix-fg-muted">
        טוען...
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}

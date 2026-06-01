import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ROUTES } from '../../constants/app'

/**
 * מגן על נתיבים – רק משתמש מחובר רואה את התוכן.
 * אחרת מפנה להתחברות (אפשר אחר כך להחזיר ל־from).
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-vantix-fg-muted">
        טוען...
      </div>
    )
  }

  if (!user) {
    return <Navigate to={ROUTES.AUTH_LOGIN} state={{ from: location }} replace />
  }

  return <>{children}</>
}

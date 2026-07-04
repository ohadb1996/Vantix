import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ROUTES } from '../../constants/app'

/** עמודי אורח בלבד – משתמש מחובר מופנה למסעדות */
export function GuestOnlyGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-vantix-fg-muted">
        טוען...
      </div>
    )
  }

  if (user) {
    return <Navigate to={ROUTES.RESTAURANTS} replace />
  }

  return <>{children}</>
}

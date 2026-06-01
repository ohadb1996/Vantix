import { Navigate, useLocation } from 'react-router-dom'
import { useCurrentUserKind } from '../../hooks/useCurrentUserKind'
import { ROUTES } from '../../constants/app'

/**
 * מגן על נתיבי אדמין – רק kind === 'admin' רואה את התוכן.
 * אחרת מפנה להתחברות או לדף הבית.
 */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAdmin, isLoading } = useCurrentUserKind()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-vantix-fg-muted">
        טוען...
      </div>
    )
  }

  if (!isAdmin) {
    return <Navigate to={ROUTES.HOME} state={{ from: location }} replace />
  }

  return <>{children}</>
}

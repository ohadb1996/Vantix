import { isRouteErrorResponse, useRouteError, Link } from 'react-router-dom'
import { RefreshCw, UtensilsCrossed } from 'lucide-react'
import { ROUTES } from '../../constants/app'

export function RouteErrorPage() {
  const error = useRouteError()
  const is404 = isRouteErrorResponse(error) && error.status === 404

  if (is404) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6 px-4 py-16 text-center" dir="rtl">
        <p className="text-6xl font-bold text-vantix-cyan/30">404</p>
        <div className="space-y-2">
          <h1 className="font-display text-2xl font-bold text-vantix-fg">העמוד לא נמצא</h1>
          <p className="max-w-sm text-sm text-vantix-fg-muted">
            הקישור שפתחתם לא קיים או שהוסר.
          </p>
        </div>
        <Link to={ROUTES.RESTAURANTS} className="vantix-btn-primary inline-flex items-center gap-2 px-5 py-3 text-sm">
          <UtensilsCrossed className="h-4 w-4" />
          חזרה למסעדות
        </Link>
      </div>
    )
  }

  const message =
    error instanceof Error
      ? error.message
      : isRouteErrorResponse(error)
        ? error.statusText || `שגיאה ${error.status}`
        : 'אירעה שגיאה בלתי צפויה'

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6 px-4 py-16 text-center" dir="rtl">
      <p className="text-5xl">⚠️</p>
      <div className="space-y-2">
        <h1 className="font-display text-2xl font-bold text-vantix-fg">משהו השתבש</h1>
        <p className="max-w-sm text-sm text-vantix-fg-muted">{message}</p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="vantix-btn-primary inline-flex items-center gap-2 px-5 py-3 text-sm"
        >
          <RefreshCw className="h-4 w-4" />
          נסו שוב
        </button>
        <Link to={ROUTES.RESTAURANTS} className="vantix-btn-ghost inline-flex items-center gap-2 px-5 py-3 text-sm">
          <UtensilsCrossed className="h-4 w-4" />
          למסעדות
        </Link>
      </div>
    </div>
  )
}

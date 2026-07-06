import { Link } from 'react-router-dom'
import { Home, Search, UtensilsCrossed } from 'lucide-react'
import { ROUTES } from '../../constants/app'

export function NotFoundPage() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6 px-4 py-16 text-center" dir="rtl">
      <p className="text-6xl font-bold text-vantix-cyan/30">404</p>
      <div className="space-y-2">
        <h1 className="font-display text-2xl font-bold text-vantix-fg">העמוד לא נמצא</h1>
        <p className="max-w-sm text-sm text-vantix-fg-muted">
          הקישור שפתחתם לא קיים או שהוסר. אפשר לחזור למסעדות או לחפש מנה.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link to={ROUTES.RESTAURANTS} className="vantix-btn-primary inline-flex items-center gap-2 px-5 py-3 text-sm">
          <UtensilsCrossed className="h-4 w-4" />
          למסעדות
        </Link>
        <Link to={ROUTES.SEARCH} className="vantix-btn-ghost inline-flex items-center gap-2 px-5 py-3 text-sm">
          <Search className="h-4 w-4" />
          חיפוש
        </Link>
        <Link to={ROUTES.HOME} className="vantix-btn-ghost inline-flex items-center gap-2 px-5 py-3 text-sm">
          <Home className="h-4 w-4" />
          עמוד הבית
        </Link>
      </div>
    </div>
  )
}

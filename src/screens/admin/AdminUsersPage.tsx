import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getAllUsers, type Role } from '../../services/adminService'
import { ROUTES } from '../../constants/app'
import { Users, Loader2, UserCircle } from 'lucide-react'

const roleLabels: Record<Role, string> = {
  customer: 'לקוח',
  business: 'עסק',
  courier: 'שליח',
  admin: 'אדמין',
}

export function AdminUsersPage() {
  const { data: users, isLoading, error } = useQuery({
    queryKey: ['adminAllUsers'],
    queryFn: getAllUsers,
  })

  if (isLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center gap-2 text-vantix-fg-muted">
        <Loader2 className="h-6 w-6 animate-spin" />
        טוען משתמשים...
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
        לא ניתן לטעון את רשימת המשתמשים. ייתכן שאין הרשאת אדמין.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl text-vantix-fg flex items-center gap-2">
          <Users className="h-8 w-8 text-vantix-cyan" />
          כל המשתמשים
        </h1>
        <p className="text-sm text-vantix-fg-muted mt-1">
          רק אדמין רואה דף זה. סינון לפי סוג: לקוח, עסק, שליח, אדמין.
        </p>
      </header>

      <div className="rounded-2xl border border-vantix-cyan/20 bg-vantix-surface-raised overflow-hidden">
        <ul className="divide-y divide-vantix-cyan/15">
          {(users ?? []).map((u) => (
            <li key={u.uid}>
              <Link
                to={ROUTES.ADMIN_USER_PROFILE(u.uid)}
                className="flex flex-wrap items-center gap-3 p-4 hover:bg-gradient-to-l from-vantix-cyan to-vantix-orange/5 transition"
              >
                <UserCircle className="h-10 w-10 text-brand-slate/40 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-vantix-fg truncate">
                    {u.displayName || u.email || u.uid.slice(0, 8)}
                  </p>
                  <p className="text-sm text-vantix-fg-muted truncate">{u.email || '—'}</p>
                </div>
                <span className="rounded-full border border-vantix-cyan/25 bg-vantix-cyan/10 px-3 py-1 text-xs font-semibold text-vantix-cyan">
                  {roleLabels[u.role]}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        {(!users || users.length === 0) && (
          <p className="p-6 text-center text-vantix-fg-subtle">אין משתמשים.</p>
        )}
      </div>
    </div>
  )
}

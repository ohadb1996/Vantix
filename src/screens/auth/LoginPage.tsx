import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { LoginForm } from '../../components/forms/LoginForm'
import { ROUTES } from '../../constants/app'

export const LoginPage = () => {
  const { user, loading } = useAuth()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-vantix-fg-muted">
        טוען...
      </div>
    )
  }

  if (user) {
    return <Navigate to={from || ROUTES.RESTAURANTS} replace />
  }

  return (
    <div className="space-y-4">
      <LoginForm redirectTo={from} />
      <p className="text-center text-xs text-vantix-fg-muted">
        אין לכם חשבון?{' '}
        <Link className="font-semibold text-vantix-cyan" to="/auth/register">
          הצטרפו עכשיו
        </Link>
      </p>
    </div>
  )
}


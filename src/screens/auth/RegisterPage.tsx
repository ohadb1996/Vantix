import { Link, useNavigate } from 'react-router-dom'
import { SignUpForm } from '../../components/forms/SignUpForm'

export const RegisterPage = () => {
  const navigate = useNavigate()

  return (
    <div className="space-y-4">
      <SignUpForm onSuccess={() => navigate('/auth/login?welcome=1')} />
      <p className="text-center text-xs text-vantix-fg-muted">
        כבר יצרתם חשבון?{' '}
        <Link className="font-semibold text-vantix-cyan" to="/auth/login">
          התחברו כאן
        </Link>
      </p>
    </div>
  )
}


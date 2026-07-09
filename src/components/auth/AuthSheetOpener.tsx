import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ROUTES } from '../../constants/app'
import { useAuthSheet, type AuthSheetMode } from '../../context/AuthSheetContext'

export function AuthSheetOpener({ mode }: { mode: AuthSheetMode }) {
  const { openAuthSheet } = useAuthSheet()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname
    openAuthSheet(mode, from || ROUTES.RESTAURANTS)
    navigate(from || ROUTES.RESTAURANTS, { replace: true })
  }, [location.state, mode, navigate, openAuthSheet])

  return null
}

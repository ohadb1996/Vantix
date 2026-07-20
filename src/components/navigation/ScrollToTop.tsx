import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { getAppScrollRoot } from '../../hooks/useScrolled'

export const ScrollToTop = () => {
  const { pathname } = useLocation()

  useEffect(() => {
    const main = getAppScrollRoot()
    if (main) main.scrollTop = 0
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

import { useEffect, useState } from 'react'

const SCROLL_EXPAND_THRESHOLD = 36

export const useScrolled = (threshold: number = SCROLL_EXPAND_THRESHOLD) => {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])
  return scrolled
}

export { SCROLL_EXPAND_THRESHOLD }

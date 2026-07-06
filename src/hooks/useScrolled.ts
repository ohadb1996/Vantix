import { useEffect, useState } from 'react'

const SCROLL_EXPAND_THRESHOLD = 36

/** אזור הגלילה הראשי באפליקציה (AppLayout main) */
export function getAppScrollRoot(): HTMLElement | null {
  return document.querySelector('main')
}

export const useScrolled = (threshold: number = SCROLL_EXPAND_THRESHOLD) => {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const scrollRoot = getAppScrollRoot()
    const onScroll = () => {
      const top = scrollRoot?.scrollTop ?? window.scrollY
      setScrolled(top > threshold)
    }
    onScroll()
    scrollRoot?.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      scrollRoot?.removeEventListener('scroll', onScroll)
      window.removeEventListener('scroll', onScroll)
    }
  }, [threshold])
  return scrolled
}

export function useMainScrollPast(threshold: number): boolean {
  const [past, setPast] = useState(false)
  useEffect(() => {
    const scrollRoot = getAppScrollRoot()
    if (!scrollRoot) return
    const onScroll = () => setPast(scrollRoot.scrollTop > threshold)
    onScroll()
    scrollRoot.addEventListener('scroll', onScroll, { passive: true })
    return () => scrollRoot.removeEventListener('scroll', onScroll)
  }, [threshold])
  return past
}

export { SCROLL_EXPAND_THRESHOLD }

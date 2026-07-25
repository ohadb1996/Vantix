import { useEffect, useState } from 'react'

const SCROLL_EXPAND_THRESHOLD = 36

/** אזור הגלילה הראשי באפליקציה (AppLayout main) */
export function getAppScrollRoot(): HTMLElement | null {
  return document.querySelector('main')
}

/**
 * נועל את גלילת ה-main כשמודל/שיט פתוח — מונע גלילת רקע במובייל
 * (בחירת radio/checkbox או overscroll בשיט מזיזים את העמוד מאחור ומשאירים אותו "שבור").
 */
export function useLockAppScroll(locked: boolean) {
  useEffect(() => {
    if (!locked) return
    const scrollRoot = getAppScrollRoot()
    if (!scrollRoot) return

    const savedTop = scrollRoot.scrollTop
    const prevOverflow = scrollRoot.style.overflow
    const prevOverscroll = scrollRoot.style.overscrollBehavior

    scrollRoot.style.overflow = 'hidden'
    scrollRoot.style.overscrollBehavior = 'none'
    scrollRoot.scrollTop = savedTop

    return () => {
      scrollRoot.style.overflow = prevOverflow
      scrollRoot.style.overscrollBehavior = prevOverscroll
      scrollRoot.scrollTop = savedTop
    }
  }, [locked])
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

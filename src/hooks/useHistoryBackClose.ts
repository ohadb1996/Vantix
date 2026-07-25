import { useCallback, useEffect, useRef } from 'react'

type HistoryOverlayState = { vantixOverlay?: string }

/**
 * כש־`open` הופך ל־true דוחפים רשומת history, כדי שכפתור "הקודם"
 * יסגור את השכבה במקום לצאת מהעמוד.
 * מחזיר `dismiss` לשימוש בכפתורי סגירה ב-UI.
 */
export function useHistoryBackClose(open: boolean, onClose: () => void, overlayId: string) {
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  const pushedRef = useRef(false)
  const ignoreNextPopRef = useRef(false)

  useEffect(() => {
    if (!open) return

    window.history.pushState({ vantixOverlay: overlayId } satisfies HistoryOverlayState, '')
    pushedRef.current = true

    const onPopState = () => {
      if (ignoreNextPopRef.current) {
        ignoreNextPopRef.current = false
        pushedRef.current = false
        return
      }
      pushedRef.current = false
      onCloseRef.current()
    }

    window.addEventListener('popstate', onPopState)
    return () => {
      window.removeEventListener('popstate', onPopState)
    }
  }, [open, overlayId])

  const dismiss = useCallback(() => {
    onCloseRef.current()
    if (pushedRef.current && (window.history.state as HistoryOverlayState | null)?.vantixOverlay === overlayId) {
      ignoreNextPopRef.current = true
      pushedRef.current = false
      window.history.back()
    } else {
      pushedRef.current = false
    }
  }, [overlayId])

  return dismiss
}

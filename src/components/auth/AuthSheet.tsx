import { useEffect, type PointerEvent } from 'react'
import { AnimatePresence, motion, useDragControls } from 'framer-motion'
import { X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { haptic } from '../../lib/native'
import { useAuth } from '../../context/AuthContext'
import { useAuthSheet } from '../../context/AuthSheetContext'
import { LoginForm } from '../forms/LoginForm'
import { SignUpForm } from '../forms/SignUpForm'
import { RotatingAuthLogo } from './RotatingAuthLogo'

const SHEET_CLOSE_DRAG_OFFSET = 120
const SHEET_CLOSE_DRAG_VELOCITY = 700

export function AuthSheet() {
  const { user } = useAuth()
  const { isOpen, mode, redirectTo, closeAuthSheet, setMode } = useAuthSheet()
  const navigate = useNavigate()
  const dragControls = useDragControls()

  useEffect(() => {
    if (user && isOpen) {
      void haptic.success()
      closeAuthSheet()
      navigate(redirectTo, { replace: true })
    }
  }, [user, isOpen, closeAuthSheet, navigate, redirectTo])

  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isOpen])

  const handleAuthSuccess = () => {
    closeAuthSheet()
    navigate(redirectTo, { replace: true })
  }

  const handleSheetDragEnd = (_: unknown, info: { offset: { y: number }; velocity: { y: number } }) => {
    if (info.offset.y > SHEET_CLOSE_DRAG_OFFSET || info.velocity.y > SHEET_CLOSE_DRAG_VELOCITY) {
      closeAuthSheet()
    }
  }

  const startSheetDrag = (event: PointerEvent<HTMLElement>) => {
    dragControls.start(event)
  }

  return (
    <AnimatePresence>
      {isOpen ? (
        <div className="fixed inset-0 z-[200] flex flex-col justify-end">
          <motion.button
            type="button"
            aria-label="סגירה"
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeAuthSheet}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-sheet-title"
            className="relative z-10 flex max-h-[min(92dvh,820px)] flex-col overflow-hidden rounded-t-[1.75rem] border border-vantix-cyan/15 bg-vantix-surface shadow-[0_-24px_80px_rgba(0,0,0,0.35)]"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.12}
            onDragEnd={handleSheetDragEnd}
          >
            <button
              type="button"
              onClick={closeAuthSheet}
              className="absolute left-4 top-4 z-20 rounded-full border border-vantix-line/15 bg-vantix-surface-raised/90 p-2 text-vantix-fg-muted transition hover:text-vantix-fg"
              aria-label="סגירה"
            >
              <X className="h-5 w-5" />
            </button>

            {/* אזור גרירה לסגירה — ידית + לוגו + כותרת */}
            <div
              className="shrink-0 cursor-grab touch-none active:cursor-grabbing"
              onPointerDown={startSheetDrag}
            >
              <div className="flex justify-center pt-3 pb-2">
                <span className="h-1.5 w-12 rounded-full bg-vantix-fg-subtle/40" aria-hidden />
              </div>

              <div className="px-5 pt-2 sm:px-8 md:px-6">
                <div className="vantix-soft-card mx-auto flex w-full max-w-[17rem] flex-col items-center p-4 sm:max-w-[15rem] sm:rounded-3xl sm:p-5 md:max-w-[12rem] md:rounded-2xl md:p-3">
                  <RotatingAuthLogo variant="compact" />
                </div>

                <div id="auth-sheet-title" className="mb-2 mt-4 text-center md:mt-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-vantix-cyan">
                    Vantix membership
                  </p>
                  <h2 className="mt-2 font-display text-2xl text-vantix-fg">
                    {mode === 'login' ? 'ברוכים השבים' : 'הצטרפו ל-Vantix'}
                  </h2>
                </div>

                <p
                  className="mb-4 pb-1 text-center text-xs text-vantix-fg-muted"
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  {mode === 'login' ? (
                    <>
                      אין לכם חשבון?{' '}
                      <button
                        type="button"
                        className="font-semibold text-vantix-cyan"
                        onClick={() => setMode('register')}
                      >
                        הצטרפו עכשיו
                      </button>
                    </>
                  ) : (
                    <>
                      כבר יצרתם חשבון?{' '}
                      <button
                        type="button"
                        className="font-semibold text-vantix-cyan"
                        onClick={() => setMode('login')}
                      >
                        התחברו כאן
                      </button>
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* תוכן גליל — טופס */}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[calc(1.75rem+var(--sab))] sm:px-8">
              {mode === 'login' ? (
                <LoginForm redirectTo={redirectTo} onSuccess={handleAuthSuccess} variant="sheet" />
              ) : (
                <SignUpForm
                  redirectTo={redirectTo}
                  onSuccess={() => setMode('login')}
                  variant="sheet"
                />
              )}
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  )
}

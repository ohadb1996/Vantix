import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { haptic } from '../../lib/native'

export type ToastVariant = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  message: string
  variant: ToastVariant
}

interface ToastApi {
  show: (message: string, variant?: ToastVariant) => void
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastApi | null>(null)

const AUTO_DISMISS_MS = 4000

const VARIANT_STYLES: Record<ToastVariant, { icon: typeof Info; ring: string; iconColor: string }> = {
  success: { icon: CheckCircle2, ring: 'border-emerald-500/30', iconColor: 'text-emerald-500' },
  error: { icon: AlertCircle, ring: 'border-red-500/30', iconColor: 'text-red-500' },
  info: { icon: Info, ring: 'border-vantix-cyan/30', iconColor: 'text-vantix-cyan' },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const idRef = useRef(0)

  const remove = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id))
  }, [])

  const show = useCallback(
    (message: string, variant: ToastVariant = 'info') => {
      const id = ++idRef.current
      setToasts((list) => [...list, { id, message, variant }])
      if (variant === 'success') void haptic.success()
      else if (variant === 'error') void haptic.error()
      else void haptic.light()
      window.setTimeout(() => remove(id), AUTO_DISMISS_MS)
    },
    [remove],
  )

  const api = useMemo<ToastApi>(
    () => ({
      show,
      success: (m) => show(m, 'success'),
      error: (m) => show(m, 'error'),
      info: (m) => show(m, 'info'),
    }),
    [show],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      {typeof document !== 'undefined' &&
        createPortal(<ToastViewport toasts={toasts} onClose={remove} />, document.body)}
    </ToastContext.Provider>
  )
}

function ToastViewport({ toasts, onClose }: { toasts: ToastItem[]; onClose: (id: number) => void }) {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex flex-col items-center gap-2 px-3"
      style={{ paddingTop: 'calc(var(--sat) + 12px)' }}
      role="status"
      aria-live="polite"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const { icon: Icon, ring, iconColor } = VARIANT_STYLES[t.variant]
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: -20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.96 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className={`pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl border ${ring} bg-vantix-surface-raised/95 px-4 py-3 shadow-lg shadow-black/10 backdrop-blur-md`}
            >
              <Icon className={`h-5 w-5 shrink-0 ${iconColor}`} aria-hidden />
              <p className="flex-1 text-sm font-medium text-vantix-fg">{t.message}</p>
              <button
                type="button"
                onClick={() => onClose(t.id)}
                aria-label="סגור התראה"
                className="shrink-0 rounded-lg p-1 text-vantix-fg-subtle transition hover:bg-vantix-overlay/5 hover:text-vantix-fg"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}

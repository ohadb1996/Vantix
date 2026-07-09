import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'

export type AuthSheetMode = 'login' | 'register'

type AuthSheetContextValue = {
  isOpen: boolean
  mode: AuthSheetMode
  redirectTo: string
  openAuthSheet: (mode: AuthSheetMode, redirectTo?: string) => void
  closeAuthSheet: () => void
  setMode: (mode: AuthSheetMode) => void
}

const AuthSheetContext = createContext<AuthSheetContextValue | null>(null)

export function AuthSheetProvider({ children }: PropsWithChildren) {
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<AuthSheetMode>('login')
  const [redirectTo, setRedirectTo] = useState('/restaurants')

  const openAuthSheet = useCallback((nextMode: AuthSheetMode, nextRedirect?: string) => {
    setMode(nextMode)
    setRedirectTo(nextRedirect || '/restaurants')
    setIsOpen(true)
  }, [])

  const closeAuthSheet = useCallback(() => {
    setIsOpen(false)
  }, [])

  const value = useMemo(
    () => ({
      isOpen,
      mode,
      redirectTo,
      openAuthSheet,
      closeAuthSheet,
      setMode,
    }),
    [isOpen, mode, redirectTo, openAuthSheet, closeAuthSheet],
  )

  return <AuthSheetContext.Provider value={value}>{children}</AuthSheetContext.Provider>
}

export function useAuthSheet() {
  const ctx = useContext(AuthSheetContext)
  if (!ctx) {
    throw new Error('useAuthSheet must be used within AuthSheetProvider')
  }
  return ctx
}

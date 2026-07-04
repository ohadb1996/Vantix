import { type PropsWithChildren, useMemo } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '../context/AuthContext'
import { ThemeProvider } from '../context/ThemeContext'
import { ToastProvider } from '../components/ui/Toast'

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  })

export const AppProviders = ({ children }: PropsWithChildren) => {
  const queryClient = useMemo(() => createQueryClient(), [])

  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>{children}</ToastProvider>
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}


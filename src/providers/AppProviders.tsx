import { type PropsWithChildren, useMemo } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '../context/AuthContext'
import { AuthSheetProvider } from '../context/AuthSheetContext'
import { QuoteLocationProvider } from '../context/QuoteLocationContext'
import { ThemeProvider } from '../context/ThemeContext'
import { ToastProvider } from '../components/ui/Toast'
import { PrefetchRestaurantsNearLocation } from '../components/location/PrefetchRestaurantsNearLocation'

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
    <div className="h-full min-h-0">
      <ThemeProvider>
        <AuthProvider>
          <AuthSheetProvider>
            <QueryClientProvider client={queryClient}>
              <QuoteLocationProvider>
                <PrefetchRestaurantsNearLocation />
                <ToastProvider>
                  {children}
                </ToastProvider>
              </QuoteLocationProvider>
            </QueryClientProvider>
          </AuthSheetProvider>
        </AuthProvider>
      </ThemeProvider>
    </div>
  )
}


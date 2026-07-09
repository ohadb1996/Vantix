import { createContext, type PropsWithChildren, useContext } from 'react'
import { useAuth } from './AuthContext'
import { useSavedAddresses } from '../hooks/useCustomerProfile'
import { useQuoteLocation, type QuoteLocationChoice } from '../hooks/useQuoteLocation'

type QuoteLocationContextValue = {
  choice: QuoteLocationChoice | null
  setChoice: (next: QuoteLocationChoice) => void
  quoteDestination: string | null
  isResolving: boolean
  geoUnavailable: boolean
}

const QuoteLocationContext = createContext<QuoteLocationContextValue | null>(null)

export function QuoteLocationProvider({ children }: PropsWithChildren) {
  const { user, loading } = useAuth()
  const { items: savedAddresses, isLoading: savedAddressesLoading } = useSavedAddresses()
  const value = useQuoteLocation(savedAddresses, !!user && !loading, savedAddressesLoading)

  return <QuoteLocationContext.Provider value={value}>{children}</QuoteLocationContext.Provider>
}

export function useQuoteLocationContext(): QuoteLocationContextValue {
  const ctx = useContext(QuoteLocationContext)
  if (!ctx) {
    throw new Error('useQuoteLocationContext must be used within QuoteLocationProvider')
  }
  return ctx
}

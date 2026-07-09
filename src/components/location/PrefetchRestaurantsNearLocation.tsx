import { useQuoteLocationContext } from '../../context/QuoteLocationContext'
import { useRestaurantsNearDestination } from '../../hooks/useRestaurantsNearDestination'

/** טוען מראש מסעדות באזור המיקום השמור — מטמון משותף לדף הבית ולחיפוש. */
export function PrefetchRestaurantsNearLocation() {
  const { quoteDestination, isResolving } = useQuoteLocationContext()

  useRestaurantsNearDestination(quoteDestination, !!quoteDestination && !isResolving)

  return null
}

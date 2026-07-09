import { createBrowserRouter, Navigate } from 'react-router-dom'
import { RootLayout } from '../layouts/RootLayout'
import { AppLayout } from '../layouts/AppLayout'
import { HomePage } from '../screens/home/HomePage'
import { RestaurantsPage } from '../screens/restaurants/RestaurantsPage'
import { RestaurantMenuPage } from '../screens/restaurants/RestaurantMenuPage'
import { SearchPage } from '../screens/search/SearchPage'
import { OrderHistoryPage } from '../screens/orders/OrderHistoryPage'
import { OrderTrackingPage } from '../screens/orders/OrderTrackingPage'
import { ProfilePage } from '../screens/profile/ProfilePage'
import { AuthSheetOpener } from '../components/auth/AuthSheetOpener'
import { AuthGuard } from '../components/auth/AuthGuard'
import { GuestOnlyGuard } from '../components/auth/GuestOnlyGuard'
import { NotFoundPage } from '../screens/errors/NotFoundPage'
import { RouteErrorPage } from '../screens/errors/RouteErrorPage'
import { ROUTES } from '../constants/app'

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <RouteErrorPage />,
    children: [
  {
    path: '/live',
    element: <Navigate to={ROUTES.RESTAURANTS} replace />,
  },
  {
    path: '/experiences',
    element: <Navigate to={ROUTES.RESTAURANTS} replace />,
  },
  {
    path: '/',
    element: <AppLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        index: true,
        element: (
          <GuestOnlyGuard>
            <HomePage />
          </GuestOnlyGuard>
        ),
      },
      {
        // גלישה חופשית ללא התחברות — ההתחברות נדרשת רק בשלב התשלום (checkout).
        path: 'restaurants',
        element: <RestaurantsPage />,
      },
      {
        path: 'restaurants/:businessId',
        element: <RestaurantMenuPage />,
      },
      {
        path: 'search',
        element: <SearchPage />,
      },
      {
        path: 'orders',
        element: <OrderHistoryPage />,
      },
      {
        path: 'orders/:orderId',
        element: <AuthGuard><OrderTrackingPage /></AuthGuard>,
      },
      {
        path: 'profile',
        element: <AuthGuard><ProfilePage /></AuthGuard>,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
  {
    path: '/auth/login',
    element: <AuthSheetOpener mode="login" />,
  },
  {
    path: '/auth/register',
    element: <AuthSheetOpener mode="register" />,
  },
  {
    path: '/auth',
    element: <Navigate to={ROUTES.AUTH_LOGIN} replace />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
    ],
  },
])


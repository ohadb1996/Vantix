import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '../layouts/AppLayout'
import { HomePage } from '../screens/home/HomePage'
import { RestaurantsPage } from '../screens/restaurants/RestaurantsPage'
import { RestaurantMenuPage } from '../screens/restaurants/RestaurantMenuPage'
import { OrderHistoryPage } from '../screens/orders/OrderHistoryPage'
import { OrderTrackingPage } from '../screens/orders/OrderTrackingPage'
import { ProfilePage } from '../screens/profile/ProfilePage'
import { ExperiencesPage } from '../screens/experiences/ExperiencesPage'
import { LivePage } from '../screens/live/LivePage'
import { AuthLanding } from '../screens/auth/AuthLanding'
import { LoginPage } from '../screens/auth/LoginPage'
import { RegisterPage } from '../screens/auth/RegisterPage'
import { AuthGuard } from '../components/auth/AuthGuard'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
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
        path: 'experiences',
        element: <ExperiencesPage />,
      },
      {
        path: 'live',
        element: <LivePage />,
      },
    ],
  },
  {
    path: '/auth',
    element: <AuthLanding />,
    children: [
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'register',
        element: <RegisterPage />,
      },
      {
        index: true,
        element: <LoginPage />,
      },
    ],
  },
])


import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '../layouts/AppLayout'
import { HomePage } from '../screens/home/HomePage'
import { RestaurantsPage } from '../screens/restaurants/RestaurantsPage'
import { RestaurantMenuPage } from '../screens/restaurants/RestaurantMenuPage'
import { OrderHistoryPage } from '../screens/orders/OrderHistoryPage'
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
        path: 'restaurants',
        element: <AuthGuard><RestaurantsPage /></AuthGuard>,
      },
      {
        path: 'restaurants/:businessId',
        element: <AuthGuard><RestaurantMenuPage /></AuthGuard>,
      },
      {
        path: 'orders',
        element: <OrderHistoryPage />,
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


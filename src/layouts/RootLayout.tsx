import { Outlet } from 'react-router-dom'
import { AuthSheet } from '../components/auth/AuthSheet'
import { PushNotificationBridge } from '../components/push/PushNotificationBridge'

/** עוטף את כל הראוטים — AuthSheet חייב להיות בתוך RouterProvider. */
export function RootLayout() {
  return (
    <>
      <PushNotificationBridge />
      <Outlet />
      <AuthSheet />
    </>
  )
}

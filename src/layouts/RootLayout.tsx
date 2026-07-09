import { Outlet } from 'react-router-dom'
import { AuthSheet } from '../components/auth/AuthSheet'

/** עוטף את כל הראוטים — AuthSheet חייב להיות בתוך RouterProvider. */
export function RootLayout() {
  return (
    <>
      <Outlet />
      <AuthSheet />
    </>
  )
}

import { RouterProvider } from 'react-router-dom'
import { router } from './routes/router'
import { AppProviders } from './providers/AppProviders'

export const App = () => {
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  )
}

export default App

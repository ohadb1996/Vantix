import { useState } from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from './routes/router'
import { AppProviders } from './providers/AppProviders'
import { AppIntroVideo, hasPlayedAppIntro } from './components/branding/AppIntroVideo'
import ForceUpdateGuard from './components/ForceUpdateGuard'

export const App = () => {
  const [introDone, setIntroDone] = useState(hasPlayedAppIntro)

  return (
    <ForceUpdateGuard>
      <AppProviders>
        {!introDone ? (
          <AppIntroVideo onDone={() => setIntroDone(true)} />
        ) : (
          <RouterProvider router={router} />
        )}
      </AppProviders>
    </ForceUpdateGuard>
  )
}

export default App

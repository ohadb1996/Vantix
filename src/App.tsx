import { useState } from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from './routes/router'
import { AppProviders } from './providers/AppProviders'
import { AppIntroVideo, hasPlayedAppIntro } from './components/branding/AppIntroVideo'

export const App = () => {
  const [introDone, setIntroDone] = useState(hasPlayedAppIntro)

  return (
    <AppProviders>
      {!introDone ? (
        <AppIntroVideo onDone={() => setIntroDone(true)} />
      ) : (
        <RouterProvider router={router} />
      )}
    </AppProviders>
  )
}

export default App

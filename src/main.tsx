import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initNativeUI, isNativeMobile } from './lib/native'
import { retryPushRegistrationIfNeeded } from './services/pushNotificationService'

void initNativeUI()

if (typeof window !== 'undefined' && !isNativeMobile() && 'serviceWorker' in navigator) {
  void navigator.serviceWorker.register('/firebase-messaging-sw.js').then(() => {
    void retryPushRegistrationIfNeeded()
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

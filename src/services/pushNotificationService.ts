/**
 * Push notifications for Vantix customers.
 * Saves FCM token under Customers/{uid}/fcm_token (native) or fcm_token_web (web).
 */
import { Capacitor } from '@capacitor/core'
import { get, ref, update } from 'firebase/database'
import { getFirebaseApp, getFirebaseAuth, getRealtimeDb } from '../lib/firebase'
import { ROUTES } from '../constants/app'

const isNative = (): boolean => Capacitor.isNativePlatform()

const FIREBASE_VAPID_KEY =
  import.meta.env.VITE_FIREBASE_VAPID_KEY ||
  'BLROSyAtx1yCj1arqP9aNV4PJlC-9fqjYnZVhIVTC2G4LgJBGJJOnwYNTv8YXcOGgwnBcbY7cv2G9j0-QQeA6ic'

export type PushForegroundPayload = {
  title?: string
  body?: string
  data?: Record<string, string | undefined>
}

type ForegroundHandler = (payload: PushForegroundPayload) => void

let lastRegisteredUid: string | null = null
let foregroundHandler: ForegroundHandler | null = null
let foregroundListenerAttached = false
let nativeListenersAttached = false

export function setPushForegroundHandler(handler: ForegroundHandler | null): void {
  foregroundHandler = handler
}

async function getAuthTokenForPush(): Promise<string | null> {
  const user = getFirebaseAuth().currentUser
  if (!user) return null
  try {
    return await user.getIdToken(true)
  } catch {
    return null
  }
}

async function customerRecordExists(uid: string): Promise<boolean> {
  const snap = await get(ref(getRealtimeDb(), `Customers/${uid}/email`))
  if (snap.exists()) return true
  const phoneSnap = await get(ref(getRealtimeDb(), `Customers/${uid}/phone`))
  return phoneSnap.exists()
}

async function saveFcmToken(uid: string, fcmToken: string, isWeb: boolean): Promise<boolean> {
  if (!(await customerRecordExists(uid))) {
    console.warn('[Push] Skipping FCM save — no Customers record yet')
    return false
  }

  const fields = isWeb
    ? { fcm_token_web: fcmToken, fcmToken: fcmToken }
    : { fcm_token: fcmToken, fcmToken: fcmToken }

  await update(ref(getRealtimeDb(), `Customers/${uid}`), fields)
  console.log('[Push] Saved FCM token for customer', uid.substring(0, 8))
  return true
}

async function waitForServiceWorker(timeoutMs = 20_000): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === 'undefined' || !navigator.serviceWorker) return null

  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      let reg = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js')
      if (!reg) {
        reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
      }
      if (reg.active) return reg
      await Promise.race([
        new Promise<void>((resolve) => {
          const sw = reg!.installing || reg!.waiting
          if (!sw) {
            resolve()
            return
          }
          if (sw.state === 'activated') {
            resolve()
            return
          }
          sw.addEventListener('statechange', () => {
            if (sw.state === 'activated') resolve()
          })
        }),
        navigator.serviceWorker.ready,
        new Promise<void>((r) => setTimeout(r, 500)),
      ])
      if (reg.active) return reg
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 300))
  }
  return null
}

function emitForeground(payload: PushForegroundPayload): void {
  foregroundHandler?.(payload)
}

function attachServiceWorkerNavigationBridge(): void {
  if (typeof navigator === 'undefined' || !navigator.serviceWorker) return
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'VANTIX_PUSH_NAVIGATE' && event.data.path) {
      window.location.href = event.data.path
    }
  })
}

function attachForegroundMessageListener(messaging: import('firebase/messaging').Messaging): void {
  if (foregroundListenerAttached) return
  foregroundListenerAttached = true

  void import('firebase/messaging').then(({ onMessage }) => {
    onMessage(messaging, (payload) => {
      const data = (payload.data ?? {}) as Record<string, string | undefined>
      emitForeground({
        title: payload.notification?.title ?? data.title,
        body: payload.notification?.body ?? data.body,
        data,
      })
    })
  })
}

async function attachNativeForegroundListeners(): Promise<void> {
  if (nativeListenersAttached || !isNative()) return
  nativeListenersAttached = true

  try {
    const { FirebaseMessaging } = await import('@capacitor-firebase/messaging')
    await FirebaseMessaging.addListener('notificationReceived', (event) => {
      const data = (event.notification?.data ?? {}) as Record<string, string | undefined>
      emitForeground({
        title: event.notification?.title,
        body: event.notification?.body,
        data,
      })
    })
    await FirebaseMessaging.addListener('notificationActionPerformed', (event) => {
      const data = (event.notification?.data ?? {}) as Record<string, string | undefined>
      const orderId = data.orderId || data.order_id
      if (orderId) {
        window.location.href = ROUTES.ORDER_TRACKING(orderId)
      }
    })
  } catch (err) {
    console.warn('[Push] Native foreground listeners failed:', err)
  }
}

async function initNativePush(uid: string): Promise<void> {
  if (!(await getAuthTokenForPush())) {
    console.warn('[Push] Native: no auth token')
    return
  }

  try {
    const { FirebaseMessaging } = await import('@capacitor-firebase/messaging')

    let permStatus = await FirebaseMessaging.checkPermissions()
    if (permStatus.receive === 'prompt') {
      permStatus = await FirebaseMessaging.requestPermissions()
    }
    if (permStatus.receive !== 'granted') return

    const persistToken = async (raw: string | undefined) => {
      const t = raw?.trim()
      if (t) await saveFcmToken(uid, t, false)
    }

    const result = await FirebaseMessaging.getToken()
    const token = (typeof result === 'string' ? result : (result as { token?: string })?.token)?.trim()
    await persistToken(token)

    await FirebaseMessaging.addListener('tokenReceived', (event) => {
      void persistToken(event.token)
    })

    await attachNativeForegroundListeners()
  } catch (e) {
    console.error('[Push] Native init error:', e)
  }
}

async function initWebPush(uid: string): Promise<void> {
  if (!(await getAuthTokenForPush())) {
    console.warn('[Push] Web: no auth token')
    return
  }
  if (typeof window === 'undefined' || !('Notification' in window)) return

  attachServiceWorkerNavigationBridge()

  const permission =
    Notification.permission === 'granted'
      ? 'granted'
      : await Notification.requestPermission()
  if (permission !== 'granted') return

  const registration = await waitForServiceWorker()
  if (!registration) return

  try {
    const { getMessaging, getToken, isSupported } = await import('firebase/messaging')
    if (!(await isSupported())) return

    const messaging = getMessaging(getFirebaseApp())
    const token = await getToken(messaging, {
      vapidKey: FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    })

    if (token) {
      await saveFcmToken(uid, token, true)
    }

    attachForegroundMessageListener(messaging)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    if (!msg.includes('Service Worker') && !msg.includes('PushManager')) {
      console.warn('[Push] Web init (non-fatal):', msg)
    }
  }
}

export async function initializePushNotifications(uid: string): Promise<void> {
  if (!uid) return
  lastRegisteredUid = uid
  if (isNative()) {
    await initNativePush(uid)
  } else {
    await initWebPush(uid)
  }
}

export async function retryPushRegistrationIfNeeded(): Promise<void> {
  if (!lastRegisteredUid || isNative()) return
  await initWebPush(lastRegisteredUid)
}

export async function removePushTokens(uid: string): Promise<void> {
  if (!uid) return
  try {
    await update(ref(getRealtimeDb(), `Customers/${uid}`), {
      fcmToken: null,
      fcm_token: null,
      fcm_token_web: null,
    })
  } catch (err) {
    console.warn('[Push] Failed to clear tokens:', err)
  }
}

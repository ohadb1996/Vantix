import { initializeApp, type FirebaseApp } from 'firebase/app'
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  type Auth,
} from 'firebase/auth'
import { getDatabase, type Database } from 'firebase/database'
import { getAnalytics, type Analytics, isSupported } from 'firebase/analytics'
import { firebaseConfig } from '../config/firebase'

let appInstance: FirebaseApp | null = null
let rtdbInstance: Database | null = null
let authInstance: Auth | null = null
let analyticsInstance: Analytics | null = null

export const getFirebaseApp = (): FirebaseApp => {
  if (!appInstance) {
    appInstance = initializeApp(firebaseConfig)
  }

  return appInstance
}

/** Realtime Database – לאותו פרויקט (maxdeliveries). להזמנות, תפריטים, עסקים. */
export const getRealtimeDb = (): Database => {
  if (!rtdbInstance) {
    rtdbInstance = getDatabase(getFirebaseApp())
  }
  return rtdbInstance
}

export const getFirebaseAuth = (): Auth => {
  if (!authInstance) {
    authInstance = getAuth(getFirebaseApp())

    if (typeof window !== 'undefined') {
      void setPersistence(authInstance, browserLocalPersistence)
    }
  }

  return authInstance
}

export const getFirebaseAnalytics = async (): Promise<Analytics | null> => {
  if (analyticsInstance) {
    return analyticsInstance
  }

  if (typeof window === 'undefined' || !(await isSupported())) {
    return null
  }

  analyticsInstance = getAnalytics(getFirebaseApp())
  return analyticsInstance
}


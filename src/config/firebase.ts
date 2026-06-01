import devConfig from '../api/config/dev/firebaseConfig.json'
import prodConfig from '../api/config/prod/firebaseConfig.json'
import { isDev, sales } from '../api/utils/config'

const resolvedConfig = sales
  ? prodConfig
  : isDev
    ? devConfig
    : prodConfig

export const firebaseConfig = {
  apiKey: resolvedConfig.apiKey,
  authDomain: resolvedConfig.authDomain,
  databaseURL: resolvedConfig.databaseURL,
  projectId: resolvedConfig.projectId,
  storageBucket: resolvedConfig.storageBucket,
  messagingSenderId: resolvedConfig.messagingSenderId,
  appId: resolvedConfig.appId,
  measurementId: resolvedConfig.measurementId,
} as const

export type FirebaseConfig = typeof firebaseConfig

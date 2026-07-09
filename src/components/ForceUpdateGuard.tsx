/**
 * ForceUpdateGuard
 * Checks Firebase AppConfig/vantix_min_version against the installed app version.
 * If the local version is lower, displays a blocking overlay that directs
 * the user to the relevant app store.
 */

import { useEffect, useState, type ReactNode } from 'react'
import { ref, onValue } from 'firebase/database'
import { App as CapacitorApp } from '@capacitor/app'
import { Loader2 } from 'lucide-react'
import { getRealtimeDb } from '../lib/firebase'
import { firebaseConfig } from '../config/firebase'
import { isIOSNative, isNativeMobile } from '../lib/native'
import { APP_VERSION } from '../utils/appVersion'
import { CUSTOMER_APP_ANDROID_URL, CUSTOMER_APP_IOS_URL } from '../constants/customerAppLinks'
import { BRAND_ASSETS } from './branding/Logo'

const ANDROID_STORE_URL = CUSTOMER_APP_ANDROID_URL
const IOS_STORE_URL = CUSTOMER_APP_IOS_URL

type AppConfigVersions = {
  vantix_min_version?: string
  vantix_min_version_ios?: string
  vantix_min_version_android?: string
}

function compareVersions(current: string, required: string): number {
  const a = current.split('.').map(Number)
  const b = required.split('.').map(Number)
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const av = a[i] ?? 0
    const bv = b[i] ?? 0
    if (av < bv) return -1
    if (av > bv) return 1
  }
  return 0
}

function resolveRequiredVersion(
  data: AppConfigVersions | null,
  isIOS: boolean,
): string | undefined {
  if (!data) return undefined
  if (isIOS) {
    return data.vantix_min_version_ios ?? data.vantix_min_version
  }
  return data.vantix_min_version_android ?? data.vantix_min_version
}

async function fetchAppConfig(): Promise<AppConfigVersions | null> {
  const url = `${firebaseConfig.databaseURL}/AppConfig.json`
  const response = await fetch(url)
  if (!response.ok) return null
  return response.json() as Promise<AppConfigVersions>
}

type GuardState = 'checking' | 'ok' | 'update'

type ForceUpdateGuardProps = {
  children: ReactNode
}

export default function ForceUpdateGuard({ children }: ForceUpdateGuardProps) {
  const [installedVersion, setInstalledVersion] = useState(APP_VERSION)
  const [guardState, setGuardState] = useState<GuardState>(
    isNativeMobile() ? 'checking' : 'ok',
  )

  useEffect(() => {
    if (!isNativeMobile()) return

    const checkAgainstMinVersion = (requiredVersion?: string) => {
      if (!requiredVersion) {
        setGuardState('ok')
        return
      }
      if (compareVersions(installedVersion, requiredVersion) < 0) {
        setGuardState('update')
      } else {
        setGuardState('ok')
      }
    }

    if (isIOSNative()) {
      let active = true
      const check = async () => {
        try {
          const data = await fetchAppConfig()
          if (!active) return
          checkAgainstMinVersion(resolveRequiredVersion(data, true))
        } catch {
          if (active) setGuardState('ok')
        }
      }
      void check()
      const interval = window.setInterval(() => { void check() }, 5 * 60 * 1000)
      return () => {
        active = false
        window.clearInterval(interval)
      }
    }

    const configRef = ref(getRealtimeDb(), 'AppConfig')
    const unsub = onValue(
      configRef,
      (snap) => {
        if (!snap.exists()) {
          setGuardState('ok')
          return
        }
        const data = snap.val() as AppConfigVersions
        checkAgainstMinVersion(resolveRequiredVersion(data, false))
      },
      () => setGuardState('ok'),
    )

    return () => unsub()
  }, [installedVersion])

  useEffect(() => {
    if (!isNativeMobile()) return

    let active = true
    const readInstalledVersion = async () => {
      try {
        const appInfo = await CapacitorApp.getInfo()
        if (!active) return
        if (appInfo.version?.trim()) {
          setInstalledVersion(appInfo.version.trim())
        }
      } catch {
        if (active) setInstalledVersion(APP_VERSION)
      }
    }

    void readInstalledVersion()
    return () => { active = false }
  }, [])

  if (guardState === 'checking') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-vantix-surface">
        <Loader2 className="h-10 w-10 animate-spin text-vantix-cyan" aria-hidden />
        <p className="text-sm text-vantix-fg-muted">טוען...</p>
      </div>
    )
  }

  if (guardState === 'ok') return <>{children}</>

  const handleUpdate = () => {
    const url = isIOSNative() ? IOS_STORE_URL : ANDROID_STORE_URL
    window.open(url, '_blank')
  }

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-gradient-to-br from-vantix-surface via-vantix-surface-raised to-vantix-surface p-6"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-vantix-cyan/[0.18] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -left-32 h-[26rem] w-[26rem] rounded-full bg-vantix-orange/[0.14] blur-3xl"
      />

      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <picture>
            <source srcSet={BRAND_ASSETS.wordmarkDark} media="(prefers-color-scheme: dark)" />
            <img
              src={BRAND_ASSETS.wordmark}
              alt="Vantix"
              className="h-12 w-auto select-none"
              draggable={false}
            />
          </picture>
        </div>

        <div className="relative rounded-3xl border border-vantix-line/10 bg-vantix-surface-raised/80 p-7 text-center shadow-2xl shadow-black/40 ring-1 ring-white/[0.04] backdrop-blur-xl sm:p-8">
          <div className="mb-5 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-vantix-cyan/30 blur-xl" aria-hidden />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-vantix-cyan/40 bg-gradient-to-br from-vantix-cyan/20 to-vantix-cyan/[0.06] text-3xl">
                🔄
              </div>
            </div>
          </div>

          <h1 className="mb-2 text-2xl font-bold tracking-tight text-vantix-fg">
            עדכון חדש זמין!
          </h1>
          <p className="mb-2 text-[15px] leading-relaxed text-vantix-fg-muted">
            גרסה חדשה של האפליקציה זמינה להורדה.
            <br />
            יש לעדכן כדי להמשיך להשתמש באפליקציה.
          </p>
          <p className="mb-6 text-xs text-vantix-fg-muted/70">גרסה נוכחית: {installedVersion}</p>

          <button
            type="button"
            onClick={handleUpdate}
            className="inline-flex h-12 w-full touch-manipulation select-none items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-vantix-cyan-400 via-vantix-cyan to-vantix-cyan-600 font-semibold text-black shadow-lg shadow-vantix-cyan/30 transition-all hover:shadow-vantix-cyan/40 active:scale-[0.98] [-webkit-tap-highlight-color:transparent]"
          >
            עדכן עכשיו
          </button>
        </div>
      </div>
    </div>
  )
}

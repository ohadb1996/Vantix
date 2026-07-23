/**
 * ForceUpdateGuard
 *
 * Native only: reads the installed app version from the device, compares it to
 * the required version stored in RTDB `AppConfig`, and if outdated shows a
 * non-dismissible screen that sends the user to the correct store (iOS/Android).
 *
 * RTDB keys (under AppConfig):
 *   vantix_version                  — required version for all platforms
 *   vantix_version_ios / _android   — optional platform overrides
 *   (legacy fallbacks: vantix_min_version, vantix_required_version, …)
 */

import { useEffect, useState, type ReactNode } from 'react'
import { Capacitor } from '@capacitor/core'
import { App as CapacitorApp } from '@capacitor/app'
import { Loader2 } from 'lucide-react'
import { firebaseConfig } from '../config/firebase'
import { APP_VERSION } from '../utils/appVersion'
import { CUSTOMER_APP_ANDROID_URL, CUSTOMER_APP_IOS_URL } from '../constants/customerAppLinks'
import { BRAND_ASSETS } from './branding/Logo'

type GuardState = 'checking' | 'ok' | 'update'

type AppConfigVersions = Record<string, string | undefined>

function normalizeVersion(raw: string | undefined | null): string {
  if (!raw) return ''
  return String(raw).trim().replace(/^v/i, '').split(/[+\s(-]/)[0] || ''
}

function compareVersions(current: string, required: string): number {
  const a = normalizeVersion(current).split('.').map((n) => Number(n) || 0)
  const b = normalizeVersion(required).split('.').map((n) => Number(n) || 0)
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const av = a[i] ?? 0
    const bv = b[i] ?? 0
    if (av < bv) return -1
    if (av > bv) return 1
  }
  return 0
}

function pickFirst(...values: Array<string | undefined>): string | undefined {
  for (const value of values) {
    const normalized = normalizeVersion(value)
    if (normalized) return normalized
  }
  return undefined
}

function resolveRequiredVersion(data: AppConfigVersions | null, platform: string): string | undefined {
  if (!data) return undefined
  if (platform === 'ios') {
    return pickFirst(
      data.vantix_version_ios,
      data.vantix_required_version_ios,
      data.vantix_min_version_ios,
      data.vantix_version,
      data.vantix_required_version,
      data.vantix_min_version,
    )
  }
  return pickFirst(
    data.vantix_version_android,
    data.vantix_required_version_android,
    data.vantix_min_version_android,
    data.vantix_version,
    data.vantix_required_version,
    data.vantix_min_version,
  )
}

async function fetchAppConfig(): Promise<AppConfigVersions | null> {
  const databaseURL = String(firebaseConfig.databaseURL || '').replace(/\/$/, '')
  if (!databaseURL) return null
  const response = await fetch(`${databaseURL}/AppConfig.json`, {
    method: 'GET',
    cache: 'no-store',
  })
  if (!response.ok) return null
  const data = await response.json()
  return data && typeof data === 'object' ? (data as AppConfigVersions) : null
}

async function readInstalledVersion(): Promise<string> {
  try {
    const info = await CapacitorApp.getInfo()
    const version = normalizeVersion(info.version)
    if (version) return version
  } catch {
    // fall through
  }
  return normalizeVersion(APP_VERSION) || APP_VERSION
}

function openStore(platform: string) {
  const url = platform === 'ios' ? CUSTOMER_APP_IOS_URL : CUSTOMER_APP_ANDROID_URL
  window.location.assign(url)
}

type ForceUpdateGuardProps = {
  children: ReactNode
}

export default function ForceUpdateGuard({ children }: ForceUpdateGuardProps) {
  const isNative = Capacitor.isNativePlatform()
  const platform = Capacitor.getPlatform()
  const [installedVersion, setInstalledVersion] = useState(APP_VERSION)
  const [requiredVersion, setRequiredVersion] = useState<string | null>(null)
  const [guardState, setGuardState] = useState<GuardState>(isNative ? 'checking' : 'ok')

  useEffect(() => {
    if (!isNative) return

    let cancelled = false

    const evaluate = async () => {
      try {
        const installed = await readInstalledVersion()
        if (cancelled) return
        setInstalledVersion(installed)

        const config = await fetchAppConfig()
        if (cancelled) return

        const required = resolveRequiredVersion(config, platform)
        setRequiredVersion(required ?? null)

        if (!required) {
          setGuardState('ok')
          return
        }

        setGuardState(compareVersions(installed, required) < 0 ? 'update' : 'ok')
      } catch (error) {
        console.warn('[ForceUpdate] check failed, allowing app:', error)
        if (!cancelled) setGuardState('ok')
      }
    }

    void evaluate()

    const interval = window.setInterval(() => {
      void evaluate()
    }, 5 * 60 * 1000)

    const resumeSub = CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive) void evaluate()
    })

    return () => {
      cancelled = true
      window.clearInterval(interval)
      void resumeSub.then((handle) => handle.remove())
    }
  }, [isNative, platform])

  if (!isNative || guardState === 'ok') {
    return <>{children}</>
  }

  if (guardState === 'checking') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-vantix-surface">
        <Loader2 className="h-10 w-10 animate-spin text-vantix-cyan" aria-hidden />
        <p className="text-sm text-vantix-fg-muted">טוען...</p>
      </div>
    )
  }

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-gradient-to-br from-vantix-surface via-vantix-surface-raised to-vantix-surface p-6"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="force-update-title"
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

          <h1 id="force-update-title" className="mb-2 text-2xl font-bold tracking-tight text-vantix-fg">
            עדכון חדש זמין!
          </h1>
          <p className="mb-2 text-[15px] leading-relaxed text-vantix-fg-muted">
            גרסה חדשה של האפליקציה זמינה להורדה.
            <br />
            יש לעדכן כדי להמשיך להשתמש באפליקציה.
          </p>
          <p className="mb-6 text-xs text-vantix-fg-muted/70">
            גרסה מותקנת: {installedVersion}
            {requiredVersion ? ` · נדרש: ${requiredVersion}` : ''}
          </p>

          <button
            type="button"
            onClick={() => openStore(platform)}
            className="inline-flex h-12 w-full touch-manipulation select-none items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-vantix-cyan-400 via-vantix-cyan to-vantix-cyan-600 font-semibold text-black shadow-lg shadow-vantix-cyan/30 transition-all hover:shadow-vantix-cyan/40 active:scale-[0.98] [-webkit-tap-highlight-color:transparent]"
          >
            עדכן עכשיו ב{platform === 'ios' ? 'App Store' : 'Google Play'}
          </button>
        </div>
      </div>
    </div>
  )
}

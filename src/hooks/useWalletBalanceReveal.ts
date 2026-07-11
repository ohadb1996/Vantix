import { useEffect, useRef, useState } from 'react'

/**
 * Count-up animation for wallet balance (same feel as business credits in partners).
 * Light shake on each whole-number tick while counting.
 */
export function useWalletBalanceReveal(target: number, isReady: boolean) {
  const [displayValue, setDisplayValue] = useState(0)
  const [shakeKey, setShakeKey] = useState(0)

  const targetRef = useRef(target)
  targetRef.current = target

  useEffect(() => {
    if (!isReady) return

    let cancelled = false
    let raf: number | null = null
    const shakeTimeouts: number[] = []
    const t0 = performance.now()
    const getTarget = () => Math.max(0, targetRef.current)
    const initialTarget = getTarget()
    const duration = Math.min(7200, 1400 + Math.sqrt(initialTarget) * 220)

    let prevFloor = -1
    let lastShakeBurstEnd = -1e9
    const minMsBetweenBursts = 40
    const staggerMs = 52
    const maxPulsesPerBurst = 6

    const easedValue = (t: number, tgt: number): number => {
      if (tgt <= 0) return 0
      const whole = Math.floor(tgt)
      const slowFrom = Math.max(0, whole - 4)
      if (slowFrom <= 0) {
        const e = 1 - Math.pow(1 - t, 2.8)
        return tgt * e
      }
      const fastTimeShare = 0.52
      if (t < fastTimeShare) {
        const lt = t / fastTimeShare
        const e = 1 - (1 - lt) * (1 - lt)
        return slowFrom * e
      }
      const lt = (t - fastTimeShare) / (1 - fastTimeShare)
      const e = 1 - Math.pow(1 - lt, 2.4)
      return slowFrom + (tgt - slowFrom) * e
    }

    const loop = (now: number) => {
      if (cancelled) return
      const tgt = getTarget()
      const elapsed = now - t0
      const t = Math.min(1, elapsed / duration)
      const val = easedValue(t, tgt)
      setDisplayValue(val)

      const fl = Math.floor(val + 1e-9)
      if (fl > prevFloor) {
        const crossed = fl - prevFloor
        prevFloor = fl
        if (fl >= 1 && now >= lastShakeBurstEnd + minMsBetweenBursts) {
          const n = Math.min(crossed, maxPulsesPerBurst)
          for (let i = 0; i < n; i++) {
            const id = window.setTimeout(() => {
              if (!cancelled) setShakeKey((k) => k + 1)
            }, i * staggerMs)
            shakeTimeouts.push(id)
          }
          lastShakeBurstEnd = now + (n - 1) * staggerMs
        }
      }

      if (t < 1) {
        raf = requestAnimationFrame(loop)
      } else {
        setDisplayValue(getTarget())
      }
    }

    raf = requestAnimationFrame(loop)

    return () => {
      cancelled = true
      if (raf != null) cancelAnimationFrame(raf)
      shakeTimeouts.forEach((id) => clearTimeout(id))
    }
  }, [isReady])

  return { displayValue, shakeKey }
}

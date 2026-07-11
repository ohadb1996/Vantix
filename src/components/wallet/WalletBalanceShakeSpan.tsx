import { useLayoutEffect, useRef } from 'react'
import clsx from 'clsx'

const SHAKE_CLASS = 'animate-credit-tick-shake'

function playWaapiShake(el: HTMLElement): Animation | null {
  if (typeof el.animate !== 'function') return null
  return el.animate(
    [
      { transform: 'translate3d(0, 0, 0)' },
      { transform: 'translate3d(-6px, 0, 0)', offset: 0.22 },
      { transform: 'translate3d(6px, 0, 0)', offset: 0.5 },
      { transform: 'translate3d(-3px, 0, 0)', offset: 0.72 },
      { transform: 'translate3d(0, 0, 0)', offset: 1 },
    ],
    { duration: 160, easing: 'ease-out', fill: 'both' },
  )
}

function playCssShakeFallback(el: HTMLElement) {
  el.classList.remove(SHAKE_CLASS)
  el.style.animation = 'none'
  void el.getBoundingClientRect()
  el.style.removeProperty('animation')
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      el.classList.add(SHAKE_CLASS)
    })
  })
}

function prefersReducedMotion(): boolean {
  try {
    return Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
  } catch {
    return false
  }
}

export function WalletBalanceShakeSpan({
  value,
  shakeTick,
  className,
}: {
  value: string
  shakeTick: number
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const runningAnimRef = useRef<Animation | null>(null)

  useLayoutEffect(() => {
    if (shakeTick <= 0) return
    if (prefersReducedMotion()) return

    let rafId = 0
    rafId = requestAnimationFrame(() => {
      const el = ref.current
      if (!el) return

      runningAnimRef.current?.cancel()
      runningAnimRef.current = null

      const anim = playWaapiShake(el)
      if (anim) {
        runningAnimRef.current = anim
        anim.onfinish = () => {
          if (runningAnimRef.current === anim) runningAnimRef.current = null
        }
        anim.oncancel = anim.onfinish
      } else {
        playCssShakeFallback(el)
      }
    })

    return () => {
      cancelAnimationFrame(rafId)
      runningAnimRef.current?.cancel()
      runningAnimRef.current = null
    }
  }, [shakeTick])

  return (
    <span
      ref={ref}
      className={clsx('inline-block tabular-nums [transform:translateZ(0)] isolate', className)}
    >
      {value}
    </span>
  )
}

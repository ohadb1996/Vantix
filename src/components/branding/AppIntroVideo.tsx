import { useCallback, useEffect, useRef } from 'react'

const INTRO_STORAGE_KEY = 'vantix.intro.played'
const INTRO_SRC = '/assets/intro.mp4'

let introPlaybackStarted = false

type AppIntroVideoProps = {
  onDone: () => void
}

export function hasPlayedAppIntro(): boolean {
  try {
    return sessionStorage.getItem(INTRO_STORAGE_KEY) === '1'
  } catch {
    return true
  }
}

function markIntroPlayed(): void {
  try {
    sessionStorage.setItem(INTRO_STORAGE_KEY, '1')
  } catch {
    /* ignore */
  }
}

export const AppIntroVideo = ({ onDone }: AppIntroVideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const finishedRef = useRef(false)

  const finish = useCallback(() => {
    if (finishedRef.current) return
    finishedRef.current = true
    markIntroPlayed()
    onDone()
  }, [onDone])

  useEffect(() => {
    if (introPlaybackStarted) return
    introPlaybackStarted = true

    const video = videoRef.current
    if (!video) {
      finish()
      return
    }

    const tryPlay = async () => {
      try {
        await video.play()
        return
      } catch {
        /* דפדפנים רבים חוסמים autoplay עם סאונד — מנסים muted */
      }

      try {
        video.muted = true
        await video.play()
      } catch {
        finish()
      }
    }

    void tryPlay()

    return () => {
      video.pause()
    }
  }, [finish])

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black"
      role="dialog"
      aria-label="סרטון פתיחה"
    >
      <video
        ref={videoRef}
        src={INTRO_SRC}
        className="h-full w-full object-contain"
        playsInline
        autoPlay
        preload="auto"
        onEnded={finish}
        onError={finish}
      />
    </div>
  )
}

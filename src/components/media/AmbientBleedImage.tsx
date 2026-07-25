import { useState } from 'react'

type AmbientBleedImageProps = {
  src: string
  alt?: string
  className?: string
  imgClassName?: string
}

/**
 * תמונה עם object-contain מעל שכבת רקע מטושטשת מאותה תמונה,
 * כך שצבעי שולי התמונה "זוהרים" אל השטח המת (letterbox / pillarbox).
 */
export function AmbientBleedImage({
  src,
  alt = '',
  className = '',
  imgClassName = '',
}: AmbientBleedImageProps) {
  const [failed, setFailed] = useState(false)

  if (failed || !src) {
    return <div className={`min-h-[10rem] w-full bg-vantix-surface-muted ${className}`} />
  }

  return (
    <div className={`relative isolate overflow-hidden bg-black ${className}`}>
      {/* שכבת זוהר – אותה תמונה מטושטשת ממלאת את כל השטח */}
      <img
        src={src}
        alt=""
        aria-hidden
        draggable={false}
        className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover opacity-80 blur-2xl saturate-150"
      />
      {/* ריכוך קל כדי שהזוהר לא יהיה חד מדי מול השחור */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/35"
      />
      <img
        src={src}
        alt={alt}
        draggable={false}
        onError={() => setFailed(true)}
        className={`relative z-10 mx-auto block h-auto w-full object-contain object-center ${imgClassName}`}
      />
    </div>
  )
}

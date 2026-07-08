import { Loader2 } from 'lucide-react'
import { GoogleIcon } from '../branding/GoogleIcon'

type GoogleAuthButtonProps = {
  label: string
  loading?: boolean
  disabled?: boolean
  onClick: () => void | Promise<void>
}

export function GoogleAuthButton({ label, loading, disabled, onClick }: GoogleAuthButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="vantix-btn-google group/google w-full"
    >
      <span aria-hidden className="vantix-btn-google-shimmer" />
      <span aria-hidden className="vantix-btn-google-glow" />
      <span className="relative z-10 inline-flex items-center justify-center gap-2">
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin text-vantix-cyan" />
        ) : (
          <>
            <span className="transition-transform duration-700 group-hover/google:scale-110">
              <GoogleIcon />
            </span>
            {label}
          </>
        )}
      </span>
    </button>
  )
}

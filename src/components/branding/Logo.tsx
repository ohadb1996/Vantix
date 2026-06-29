import { APP_DISPLAY_NAME, APP_ICON_PATH } from '../../constants/app'
import { useTheme } from '../../context/ThemeContext'

export const BRAND_ASSETS = {
  icon: APP_ICON_PATH,
  /* אייקון פינתי תלוי-תמה: כתום (רקע לבן) בלייט, כחול (רקע כהה) בדארק */
  iconLight: '/assets/orangevv.jpg',
  iconDark: '/assets/bluev.jpeg',
  hero: '/assets/logo.jpg',
  wordmark: '/assets/logoText.png',
  wordmarkDark: '/assets/logoText-dark.png',
} as const

type LogoSize = 'sm' | 'md' | 'lg' | 'xl'

type LogoProps = {
  /** גודל בפיקסלים (מסלול ישן) – מתורגם ל-sm/md/lg/xl */
  size?: number | LogoSize
  withWordmark?: boolean
  /** לוגו אופקי מלא (טקסט + אייקון) כמו ב-Partners */
  variant?: 'icon' | 'horizontal'
  /** כפיית wordmark לרקע כהה (מסך auth עם תמונת רקע) */
  onDark?: boolean
  className?: string
  subtitle?: React.ReactNode
}

const sizeToPreset = (size: number | LogoSize): LogoSize => {
  if (typeof size === 'string') return size
  if (size >= 80) return 'xl'
  if (size >= 48) return 'lg'
  if (size >= 32) return 'md'
  return 'sm'
}

const iconSizeClasses: Record<LogoSize, string> = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
  xl: 'h-24 w-24',
}

const horizontalWidth: Record<LogoSize, string> = {
  sm: 'w-28',
  md: 'w-40',
  lg: 'w-52',
  xl: 'w-64',
}

const horizontalHeight: Record<LogoSize, string> = {
  sm: 'h-9',
  md: 'h-12',
  lg: 'h-14',
  xl: 'h-20',
}

export const Logo = ({
  size = 'md',
  withWordmark = false,
  variant,
  onDark = false,
  className,
  subtitle,
}: LogoProps) => {
  const { theme } = useTheme()
  const preset = sizeToPreset(size)
  const useHorizontal = variant === 'horizontal' || withWordmark
  const isDarkBg = onDark ?? theme === 'dark'

  if (useHorizontal) {
    return (
      <div className={`flex flex-col items-start gap-0.5 ${className ?? ''}`}>
        <div className={isDarkBg ? '' : 'rounded-lg bg-[#0a0a0c] px-2 py-1 dark:bg-transparent dark:px-0 dark:py-0'}>
          <img
            src={isDarkBg ? BRAND_ASSETS.wordmarkDark : BRAND_ASSETS.wordmark}
            alt={APP_DISPLAY_NAME}
            className={`${horizontalWidth[preset]} ${horizontalHeight[preset]} object-contain object-right`}
          />
        </div>
        {subtitle ? <div className="text-start text-xs text-vantix-fg-muted">{subtitle}</div> : null}
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-3 ${className ?? ''}`}>
      <div className={`${iconSizeClasses[preset]} shrink-0 overflow-hidden rounded-2xl`}>
        <img
          src={BRAND_ASSETS.iconLight}
          alt={APP_DISPLAY_NAME}
          className="h-full w-full object-cover dark:hidden"
        />
        <img
          src={BRAND_ASSETS.iconDark}
          alt={APP_DISPLAY_NAME}
          className="hidden h-full w-full object-cover dark:block"
        />
      </div>
      {withWordmark ? (
        <span className="font-display text-lg font-bold tracking-[0.2em] text-vantix-fg uppercase">
          {APP_DISPLAY_NAME}
        </span>
      ) : null}
    </div>
  )
}

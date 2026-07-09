import { motion } from 'framer-motion'
import { APP_DISPLAY_NAME } from '../../constants/app'

const LOGO_SIZE_CLASS = {
  hero: 'w-56 sm:w-72',
  compact: 'w-44 sm:w-40 md:w-32',
} as const

type RotatingVantixLogoProps = {
  className?: string
  variant?: keyof typeof LOGO_SIZE_CLASS
}

/** לוגו Vantix מסתובב — אותה לוגיקה כמו בעמוד הבית. */
export function RotatingVantixLogo({
  className = '',
  variant = 'hero',
}: RotatingVantixLogoProps) {
  const logoImgClass = LOGO_SIZE_CLASS[variant]

  return (
    <div className={`flex flex-col items-center ${className}`} style={{ perspective: '1000px' }}>
      <motion.div
        className="flex flex-col items-center"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: 360 }}
        transition={{ repeat: Infinity, duration: 6, ease: 'linear' }}
      >
        <img
          src="/assets/logo-white.jpeg"
          alt={APP_DISPLAY_NAME}
          className={`${logoImgClass} rounded-2xl object-contain dark:hidden`}
          draggable={false}
        />
        <img
          src="/assets/logo-dark.png"
          alt={APP_DISPLAY_NAME}
          className={`hidden ${logoImgClass} rounded-2xl object-contain dark:block`}
          draggable={false}
        />
      </motion.div>
    </div>
  )
}

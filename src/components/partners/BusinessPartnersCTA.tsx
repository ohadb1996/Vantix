import { Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { PARTNERS_APP_URL } from '../../constants/app'

export const BusinessPartnersCTA = () => {
  return (
    <motion.section
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
      id="business-partners"
      className="vantix-soft-card p-6"
    >
      <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.35em] text-vantix-cyan">
            <Sparkles className="h-4 w-4" /> smart handoff
          </p>
          <h2 className="mt-2 font-display text-2xl text-vantix-fg sm:text-3xl">
            בעל עסק? רוצה להגדיל את המכירות ולהצטרף לפלטפורמה המתקדמת ביותר?
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-vantix-fg-muted">
            אצלנו אתה לא עוד מסעדה — אתה שותף אסטרטגי. עם מערכת ניהול חכמה, תמחור שקוף,
            כלים מתקדמים לניהול הזמנות, ומערכת שיווק שמביאה לך לקוחות חדשים.
          </p>
        </div>
        <a
          className="vantix-btn-primary px-6 py-3 text-sm"
          href={PARTNERS_APP_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          הצטרף עכשיו!
        </a>
      </div>
    </motion.section>
  )
}

import { Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import type { SpotlightCampaign } from '../../types/discovery'

type SpotlightCtaProps = {
  campaign: SpotlightCampaign
  badge?: string
  delay?: number
}

export const SpotlightCta = ({ campaign, badge = 'smart handoff', delay = 0 }: SpotlightCtaProps) => {
  return (
    <motion.section
      initial={{ y: 24, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, ease: 'easeOut', delay }}
      id={campaign.id}
      className="vantix-soft-card p-4 sm:p-6"
    >
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center sm:gap-6">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-vantix-cyan sm:text-xs sm:tracking-[0.35em]">
            <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> {badge}
          </p>
          <h2 className="mt-2 font-display text-xl text-vantix-fg sm:text-3xl">
            {campaign.title}
          </h2>
          <p className="mt-2 max-w-2xl text-xs text-vantix-fg-muted sm:mt-3 sm:text-sm">
            {campaign.description}
          </p>
        </div>
        <a
          className="vantix-btn-primary w-full shrink-0 px-5 py-3 text-center text-sm sm:w-auto sm:px-6"
          href={campaign.href}
          target="_blank"
          rel="noopener noreferrer"
        >
          {campaign.ctaLabel}
        </a>
      </div>
    </motion.section>
  )
}

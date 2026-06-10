import { PARTNERS_APP_URL } from '../../constants/app'
import type { SpotlightCampaign } from '../../types/discovery'
import { SpotlightCta } from './SpotlightCta'

const businessPartnersCampaign: SpotlightCampaign = {
  id: 'business-partners',
  title: 'בעל עסק? רוצה להגדיל את המכירות ולהצטרף לפלטפורמה המתקדמת ביותר?',
  description:
    'אצלנו אתה לא עוד מסעדה — אתה שותף אסטרטגי. עם מערכת ניהול חכמה, תמחור שקוף, כלים מתקדמים לניהול הזמנות, ומערכת שיווק שמביאה לך לקוחות חדשים.',
  ctaLabel: 'המשך מכאן!',
  href: PARTNERS_APP_URL,
  illustration: null,
}

export const BusinessPartnersCTA = () => (
  <SpotlightCta campaign={businessPartnersCampaign} delay={0.1} />
)

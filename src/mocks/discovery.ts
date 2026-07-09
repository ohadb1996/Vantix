import { ALL_SEARCH_FILTER_DEFS } from '../constants/searchFilterDefs'
import type { MoodCollection, SmartFilter, SpotlightCampaign } from '../types/discovery'

const HOME_SMART_FILTER_IDS = [
  'open_now',
  'recommended',
  'pizza',
  'sushi',
  'italian',
  'kosher',
] as const

const HOME_FILTER_TONES: SmartFilter['tone'][] = [
  'neutral',
  'primary',
  'elevated',
  'neutral',
  'primary',
  'elevated',
]

export const mockMoodCollections: MoodCollection[] = [
  {
    id: 'now-cravings',
    title: 'קרייבינג של עכשיו',
    description: 'מנות חמות שמגיעות אליך ב-20 דקות',
    tags: ['ריזוטו כמהין', 'פאד-תאי סלמון', 'פיצה נאפולי'],
    priority: 1,
  },
  {
    id: 'morning-boost',
    title: 'בוסט של בוקר',
    description: 'מיצים קרים, בולס סופר פוד וקפה מהמאסטרים',
    tags: ['Acai Boost', 'Flat White', 'סלמון קרים ביוגל'],
    priority: 2,
  },
  {
    id: 'night-treat',
    title: 'פינוק לילה',
    description: 'טעמים נועזים עם קינוחים מטריפים',
    tags: ['סושי פיוז׳ן', 'בר; גרידת לימון', 'טארט לימון'],
    priority: 3,
  },
]

export const mockSmartFilters: SmartFilter[] = HOME_SMART_FILTER_IDS.map((id, index) => {
  const def = ALL_SEARCH_FILTER_DEFS.find((f) => f.id === id)
  if (!def) throw new Error(`Missing search filter def for home chip: ${id}`)
  return {
    id: def.id,
    label: def.label,
    tone: HOME_FILTER_TONES[index],
    order: index + 1,
  }
})

export const mockSpotlightCampaign: SpotlightCampaign = {
  id: 'smart-handoff',
  title: 'שליח? רוצה להרוויח יותר מכל משלוח? הצטרף לצוות שמתגמל יותר מכל חברה אחרת!',
  description: 'אצלנו אתה לא עוד שליח — אתה שותף. עם מערכת חכמה, תמחור שקוף, בונוסים אמיתיים, ומשימות שמגיעות אליך בקצב הנכון – אתה עובד בנוחות, מרוויח יותר, ושומר על שליטה מלאה בזמנים שלך. בוא לעבוד עם חברה שמבינה שליחים ונותנת כבוד אמיתי למי שמזיז את העיר.',
  ctaLabel: 'המשך מכאן!',
  href: 'https://vantix.web.app',
  illustration: null,
}


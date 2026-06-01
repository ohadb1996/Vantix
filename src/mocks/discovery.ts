import type { MoodCollection, SmartFilter, SpotlightCampaign } from '../types/discovery'

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

export const mockSmartFilters: SmartFilter[] = [
  { id: 'gluten-free', label: 'ללא גלוטן', tone: 'neutral', order: 1 },
  { id: 'vegan', label: 'טבעוני', tone: 'primary', order: 2 },
  { id: 'quick-eta', label: 'עד 25 דק׳', tone: 'elevated', order: 3 },
  { id: 'budget', label: 'תקציב עד 60₪', tone: 'neutral', order: 4 },
  { id: 'trending-now', label: 'הכי מזמין עכשיו', tone: 'primary', order: 5 },
  { id: 'new-in-town', label: 'חדש בעיר', tone: 'elevated', order: 6 },
]

export const mockSpotlightCampaign: SpotlightCampaign = {
  id: 'smart-handoff',
  title: 'שליח? רוצה להרוויח יותר מכל משלוח? הצטרף לצוות שמתגמל יותר מכל חברה אחרת!',
  description: 'אצלנו אתה לא עוד שליח — אתה שותף. עם מערכת חכמה, תמחור שקוף, בונוסים אמיתיים, ומשימות שמגיעות אליך בקצב הנכון – אתה עובד בנוחות, מרוויח יותר, ושומר על שליטה מלאה בזמנים שלך. בוא לעבוד עם חברה שמבינה שליחים ונותנת כבוד אמיתי למי שמזיז את העיר.',
  ctaLabel: 'המשך מכאן!',
  href: 'https://vantix.web.app',
  illustration: null,
}


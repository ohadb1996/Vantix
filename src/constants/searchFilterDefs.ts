/**
 * הגדרות פילטרים לעמוד החיפוש.
 * כל פילטר מוצג רק אם יש לפחות עסק אחד שעונה עליו (ראה businessSearch.ts).
 */

export type SearchFilterGroup = 'status' | 'dietary' | 'niche' | 'featured'

export interface SearchFilterDef {
  id: string
  label: string
  emoji: string
  /** מחלקות Tailwind לרקע הכרטיס */
  gradient: string
  group: SearchFilterGroup
  /** מילות מפתח לחיפוש בשם עסק, סוג עסק, קטגוריות ומנות */
  keywords?: string[]
  /** סוגי עסק מדויקים (business_type) */
  businessTypes?: string[]
}

/** פילטרים לפי סטטוס / מחיר */
export const STATUS_FILTER_DEFS: SearchFilterDef[] = [

  {
    id: 'recommended',
    label: 'מומלץ',
    emoji: '⭐',
    gradient: 'from-yellow-400/90 to-amber-500/90',
    group: 'featured',
  },
]

/** פילטרים תזונתיים – מוצגים רק אם נמצאו התאמות אמיתיות בנתונים */
export const DIETARY_FILTER_DEFS: SearchFilterDef[] = [
  { id: 'kosher', label: 'כשר', emoji: '✡️', gradient: 'from-blue-600/90 to-indigo-700/90', group: 'dietary', keywords: ['כשר', 'כשרות', 'מהדרין', 'בד"ץ', 'badatz'] },
  { id: 'not_kosher', label: 'לא כשר', emoji: '🍽️', gradient: 'from-slate-500/90 to-slate-700/90', group: 'dietary', keywords: ['לא כשר', 'טרף'] },
  { id: 'vegetarian', label: 'צמחוני', emoji: '🥗', gradient: 'from-lime-500/90 to-green-600/90', group: 'dietary', keywords: ['צמחוני', 'vegetarian'] },
  { id: 'vegan', label: 'טבעוני', emoji: '🌱', gradient: 'from-green-500/90 to-emerald-700/90', group: 'dietary', keywords: ['טבעוני', 'vegan'] },
  { id: 'gluten_free', label: 'ללא גלוטן', emoji: '🌾', gradient: 'from-amber-500/90 to-yellow-600/90', group: 'dietary', keywords: ['ללא גלוטן', 'גלוטן חינם', 'gluten free', 'gluten-free'] },
  { id: 'meat', label: 'בשרי', emoji: '🥩', gradient: 'from-red-600/90 to-rose-800/90', group: 'dietary', keywords: ['בשרי', 'בשר', 'סטייק', 'גריל'] },
  { id: 'dairy', label: 'חלבי', emoji: '🧀', gradient: 'from-sky-400/90 to-blue-500/90', group: 'dietary', keywords: ['חלבי', 'חלב', 'גבינה', 'לאכטוז'] },
]

/** פילטרים לפי נישה */
export const NICHE_FILTER_DEFS: SearchFilterDef[] = [
  { id: 'pasta', label: 'פסטות', emoji: '🍝', gradient: 'from-orange-400/90 to-red-500/90', group: 'niche', keywords: ['פסטה', 'פסטות', 'pasta', 'ספגטי', 'רביולי'] },
  { id: 'pizza', label: 'פיצות', emoji: '🍕', gradient: 'from-red-500/90 to-orange-600/90', group: 'niche', keywords: ['פיצה', 'פיצות', 'pizza'] },
  { id: 'burgers', label: 'המבורגרים', emoji: '🍔', gradient: 'from-amber-500/90 to-orange-700/90', group: 'niche', keywords: ['המבורגר', 'burger', 'בורגר'] },
  { id: 'shakes', label: 'שייקים', emoji: '🥤', gradient: 'from-pink-400/90 to-fuchsia-500/90', group: 'niche', keywords: ['שייק', 'שייקים', 'smoothie', 'מיץ'] },
  { id: 'desserts', label: 'קינוחים', emoji: '🍰', gradient: 'from-pink-500/90 to-rose-600/90', group: 'niche', keywords: ['קינוח', 'קינוחים', 'עוגה', 'מאפה', 'dessert', 'cake'] },
  { id: 'supermarket', label: 'סופר מרקט', emoji: '🛒', gradient: 'from-green-500/90 to-emerald-700/90', group: 'niche', keywords: ['סופר', 'סופרמרקט', 'מכולת', 'supermarket'], businessTypes: ['מכולת / סופרמרקט'] },
  { id: 'cafes', label: 'בתי קפה', emoji: '☕', gradient: 'from-amber-700/90 to-yellow-900/90', group: 'niche', keywords: ['קפה', 'בית קפה', 'cafe', 'אספרסו', 'לאטה'] },
  { id: 'beauty', label: 'טיפוח וקוסמטיקה', emoji: '💄', gradient: 'from-fuchsia-400/90 to-pink-600/90', group: 'niche', keywords: ['טיפוח', 'קוסמטיקה', 'יופי', 'beauty', 'מניקור'] },
  { id: 'pets', label: 'בע״ח', emoji: '🐾', gradient: 'from-teal-500/90 to-cyan-700/90', group: 'niche', keywords: ['בע"ח', 'בע״ח', 'חיות', 'כלב', 'חתול', 'pet'] },
  { id: 'electronics', label: 'סלולאר וחשמל', emoji: '📱', gradient: 'from-slate-600/90 to-zinc-800/90', group: 'niche', keywords: ['סלולאר', 'חשמל', 'טלפון', 'electronics', 'מחשב'] },
  { id: 'toys', label: 'צעצועים ותינוקות', emoji: '🧸', gradient: 'from-sky-400/90 to-indigo-500/90', group: 'niche', keywords: ['צעצוע', 'ילדים', 'תינוק', 'toy', 'משחק'] },
  { id: 'flowers', label: 'פרחים ועציצים', emoji: '💐', gradient: 'from-rose-400/90 to-pink-500/90', group: 'niche', keywords: ['פרח', 'פרחים', 'עציץ', 'זר', 'flower'] },
  { id: 'home_design', label: 'עיצוב ובית', emoji: '🏠', gradient: 'from-stone-500/90 to-neutral-700/90', group: 'niche', keywords: ['עיצוב', 'בית', 'ריהוט', 'decor', 'home'] },
  { id: 'hobbies', label: 'תחביבים ופנאי', emoji: '🎯', gradient: 'from-violet-500/90 to-purple-700/90', group: 'niche', keywords: ['תחביב', 'פנאי', 'hobby', 'ספורט'] },
  { id: 'fashion', label: 'אופנה', emoji: '👗', gradient: 'from-purple-400/90 to-violet-600/90', group: 'niche', keywords: ['אופנה', 'בגד', 'fashion', 'הלבשה'] },
  { id: 'adults_only', label: 'למבוגרים בלבד', emoji: '🔞', gradient: 'from-neutral-700/90 to-black/90', group: 'niche', keywords: ['למבוגרים', '18+', 'מבוגרים בלבד'] },
  { id: 'alcohol', label: 'אלכוהול', emoji: '🍷', gradient: 'from-red-800/90 to-rose-950/90', group: 'niche', keywords: ['אלכוהול', 'בירה', 'יין', 'וויסקי', 'wine', 'beer'], businessTypes: ['חנות אלכוהול / מוצרי עישון'] },
  { id: 'health', label: 'בריאות', emoji: '💊', gradient: 'from-cyan-500/90 to-teal-600/90', group: 'niche', keywords: ['בריאות', 'health', 'רפואה', 'בית מרקחת'] },
  { id: 'supplements', label: 'תוספי תזונה', emoji: '💪', gradient: 'from-lime-600/90 to-green-800/90', group: 'niche', keywords: ['תוסף', 'תוספי תזונה', 'ויטמין', 'supplement', 'פרוטאין'] },
]

export const ALL_SEARCH_FILTER_DEFS: SearchFilterDef[] = [
  ...STATUS_FILTER_DEFS,
  ...DIETARY_FILTER_DEFS,
  ...NICHE_FILTER_DEFS,
]

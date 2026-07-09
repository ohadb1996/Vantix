import { Capacitor } from '@capacitor/core'
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'
import { StatusBar, Style } from '@capacitor/status-bar'
import { SplashScreen } from '@capacitor/splash-screen'
import { Keyboard } from '@capacitor/keyboard'
import type { ThemeMode } from '../context/ThemeContext'

/**
 * שכבת גישה לפיצ'רים נייטיביים (Capacitor).
 * כל קריאה עטופה ב-guard כך שבווב היא no-op בטוחה — אפשר לקרוא מכל מקום.
 */
const isNative = Capacitor.isNativePlatform()

export const isNativeMobile = (): boolean => Capacitor.isNativePlatform()

export const isIOSNative = (): boolean => Capacitor.getPlatform() === 'ios'

/** אתחול חד-פעמי של ה-UI הנייטיבי (סטטוס בר, מקלדת, הסתרת ספלאש). */
export async function initNativeUI(): Promise<void> {
  if (!isNative) return
  try {
    await SplashScreen.hide()
  } catch {
    /* ignore */
  }
  try {
    // מסמן על ה-body מתי המקלדת פתוחה — מאפשר התאמות CSS (למשל להסתיר בר תחתון).
    await Keyboard.addListener('keyboardWillShow', () => {
      document.body.classList.add('keyboard-open')
    })
    await Keyboard.addListener('keyboardWillHide', () => {
      document.body.classList.remove('keyboard-open')
    })
  } catch {
    /* ignore */
  }
}

/**
 * מסנכרן את צבע/סגנון הסטטוס-בר לפי מצב התצוגה.
 * Style.Dark = טקסט בהיר (לרקע כהה), Style.Light = טקסט כהה (לרקע בהיר).
 */
export async function setStatusBarTheme(theme: ThemeMode): Promise<void> {
  if (!isNative) return
  try {
    await StatusBar.setStyle({ style: theme === 'dark' ? Style.Dark : Style.Light })
    if (Capacitor.getPlatform() === 'android') {
      await StatusBar.setBackgroundColor({ color: theme === 'dark' ? '#000000' : '#fafafa' })
    }
  } catch {
    /* ignore */
  }
}

async function impact(style: ImpactStyle): Promise<void> {
  if (!isNative) return
  try {
    await Haptics.impact({ style })
  } catch {
    /* ignore */
  }
}

async function notify(type: NotificationType): Promise<void> {
  if (!isNative) return
  try {
    await Haptics.notification({ type })
  } catch {
    /* ignore */
  }
}

/** משוב מישושי (רטט) לפעולות מפתח. no-op בווב. */
export const haptic = {
  /** לחיצה קלה — הוספה לעגלה, לייק, בחירת טאב. */
  light: () => impact(ImpactStyle.Light),
  /** לחיצה בינונית — פתיחת מודל, אישור בחירה. */
  medium: () => impact(ImpactStyle.Medium),
  heavy: () => impact(ImpactStyle.Heavy),
  /** הזמנה בוצעה בהצלחה. */
  success: () => notify(NotificationType.Success),
  warning: () => notify(NotificationType.Warning),
  /** שגיאה / כשל בפעולה. */
  error: () => notify(NotificationType.Error),
}

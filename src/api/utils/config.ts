// פרויקט אחד כמו ב-partners – דמו ופרודקשן מתחברים ל-maxdeliveries.
export const isDev = false;
export const sales = false

export const isIOS = () =>
  typeof navigator !== 'undefined'
    ? /iPhone|iPad|iPod/i.test(navigator.userAgent)
    : false

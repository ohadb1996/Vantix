/** אייקוני מרקר ל-Google Maps – שפה ויזואלית כמו mapIcons ב-partners */

const CYAN = '#22d3ee'
const CYAN_DARK = '#0891b2'
const ORANGE = '#f97316'
const ORANGE_DARK = '#ea580c'

function svgMarkerDataUrl(emoji: string, gradientStart: string, gradientEnd: string, size = 34): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs>
      <radialGradient id="g" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stop-color="${gradientStart}"/>
        <stop offset="100%" stop-color="${gradientEnd}"/>
      </radialGradient>
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="rgba(0,0,0,0.55)"/>
      </filter>
    </defs>
    <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 2}" fill="url(#g)" stroke="white" stroke-width="2" filter="url(#glow)"/>
    <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-size="${Math.round(size * 0.48)}">${emoji}</text>
  </svg>`
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

export function googleMarkerIconForKind(kind: 'home' | 'business' | 'courier'): google.maps.Icon {
  const size = 34
  let url: string
  switch (kind) {
    case 'business':
      url = svgMarkerDataUrl('🏪', CYAN, CYAN_DARK, size)
      break
    case 'courier':
      url = svgMarkerDataUrl('🚴', CYAN, CYAN_DARK, size)
      break
    case 'home':
    default:
      url = svgMarkerDataUrl('📦', ORANGE, ORANGE_DARK, size)
      break
  }
  return {
    url,
    scaledSize: new google.maps.Size(size, size),
    anchor: new google.maps.Point(size / 2, size / 2),
  }
}

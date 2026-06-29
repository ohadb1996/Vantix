#!/usr/bin/env node
/**
 * מעדכן את גרסת האפליקציה בכל המקומות בבת אחת:
 *   1. package.json
 *   2. android/app/build.gradle  -> versionName + מקדם versionCode ב-1
 *   3. ios/App/App.xcodeproj/project.pbxproj -> MARKETING_VERSION + CURRENT_PROJECT_VERSION
 *
 * שימוש:
 *   npm run bump 1.0.1
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const version = process.argv[2]

if (!version || !/^\d+\.\d+\.\d+$/.test(version)) {
  console.error('\n❌ יש לספק מספר גרסה תקין בפורמט X.Y.Z')
  console.error('   דוגמה: npm run bump 1.0.1\n')
  process.exit(1)
}

function patch(relPath, transform) {
  const filePath = resolve(root, relPath)
  const before = readFileSync(filePath, 'utf8')
  const after = transform(before)
  if (before === after) {
    console.warn(`⚠️  לא נמצא מה לעדכן ב-${relPath} (אולי הפורמט השתנה?)`)
    return
  }
  writeFileSync(filePath, after, 'utf8')
  console.log(`✅ ${relPath}`)
}

patch('package.json', (s) =>
  s.replace(/("version":\s*")\d+\.\d+\.\d+(")/, `$1${version}$2`),
)

patch('android/app/build.gradle', (s) => {
  let next = s.replace(/(versionName\s+")\d+\.\d+\.\d+(")/, `$1${version}$2`)
  next = next.replace(/versionCode\s+(\d+)/, (_m, code) => {
    const bumped = Number(code) + 1
    console.log(`   ↳ Android versionCode: ${code} → ${bumped}`)
    return `versionCode ${bumped}`
  })
  return next
})

patch('ios/App/App.xcodeproj/project.pbxproj', (s) => {
  let next = s.replace(/(MARKETING_VERSION = )\d+\.\d+\.\d+(;)/g, `$1${version}$2`)
  const current = Number((s.match(/CURRENT_PROJECT_VERSION = (\d+);/) || [])[1] || 0)
  const bumped = current + 1
  next = next.replace(/(CURRENT_PROJECT_VERSION = )\d+(;)/g, `$1${bumped}$2`)
  console.log(`   ↳ iOS build (CURRENT_PROJECT_VERSION): ${current} → ${bumped}`)
  return next
})

console.log(`\n🎉 כל הקבצים עודכנו לגרסה ${version}.`)
console.log('   הצעדים הבאים:')
console.log('   1) npm run sync')
console.log('   2) iOS: Codemagic או npm run ios:release')
console.log('   3) Android: npm run android:aab (או Android Studio → Signed Bundle)\n')

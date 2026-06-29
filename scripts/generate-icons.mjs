#!/usr/bin/env node
/**
 * יוצר favicon, אייקוני PWA, iOS App Store ו-Android mipmaps
 * מקור: public/assets/whitevantixicon.png
 */
import { execSync } from 'node:child_process'
import { existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const source = join(root, 'public', 'assets', 'whitevantixicon.png')
const square = join(root, 'public', 'assets', 'whitevantixicon-square.png')

if (!existsSync(source)) {
  console.error('Missing source icon:', source)
  process.exit(1)
}

const run = (cmd) => {
  execSync(cmd, { stdio: 'inherit' })
}

const resize = (size, out) => {
  mkdirSync(dirname(out), { recursive: true })
  run(`sips -z ${size} ${size} -s format png "${square}" --out "${out}"`)
}

// ריבוע לבן (987×768 → 987×987)
run(
  `sips --padToHeightWidth 987 987 -s format png "${source}" --padColor FFFFFF --out "${square}"`,
)

// Web / SEO
resize(32, join(root, 'public', 'favicon-32x32.png'))
resize(180, join(root, 'public', 'apple-touch-icon.png'))
resize(192, join(root, 'public', 'icon-192.png'))
resize(512, join(root, 'public', 'icon-512.png'))

// iOS App Store (1024×1024)
resize(
  1024,
  join(root, 'ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset', 'AppIcon-512@2x.png'),
)

// Android mipmaps + adaptive foreground
const androidSizes = {
  'mipmap-mdpi': { launcher: 48, foreground: 108 },
  'mipmap-hdpi': { launcher: 72, foreground: 162 },
  'mipmap-xhdpi': { launcher: 96, foreground: 216 },
  'mipmap-xxhdpi': { launcher: 144, foreground: 324 },
  'mipmap-xxxhdpi': { launcher: 192, foreground: 432 },
}

for (const [folder, sizes] of Object.entries(androidSizes)) {
  const base = join(root, 'android', 'app', 'src', 'main', 'res', folder)
  resize(sizes.launcher, join(base, 'ic_launcher.png'))
  resize(sizes.launcher, join(base, 'ic_launcher_round.png'))
  resize(sizes.foreground, join(base, 'ic_launcher_foreground.png'))
}

console.log('✅ Icons generated from whitevantixicon.png')

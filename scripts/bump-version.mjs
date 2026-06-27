import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const gradlePath = join(root, 'android', 'app', 'build.gradle')
const pkgPath = join(root, 'package.json')

// --- Android build.gradle ---
let gradle = readFileSync(gradlePath, 'utf8')

const codeMatch = gradle.match(/versionCode\s+(\d+)/)
const nameMatch = gradle.match(/versionName\s+"([^"]+)"/)

if (!codeMatch || !nameMatch) {
  console.error('Could not find versionCode / versionName in', gradlePath)
  process.exit(1)
}

const oldCode = parseInt(codeMatch[1], 10)
const newCode = oldCode + 1

const oldName = nameMatch[1]
const parts = oldName.split('.').map((n) => parseInt(n, 10))
while (parts.length < 3) parts.push(0)
parts[2] += 1 // bump patch
const newName = parts.join('.')

gradle = gradle
  .replace(/versionCode\s+\d+/, `versionCode ${newCode}`)
  .replace(/versionName\s+"[^"]+"/, `versionName "${newName}"`)

writeFileSync(gradlePath, gradle)

// --- package.json (keep version in sync) ---
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
pkg.version = newName
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')

console.log(`Bumped version:`)
console.log(`  versionCode: ${oldCode} -> ${newCode}`)
console.log(`  versionName: ${oldName} -> ${newName}`)

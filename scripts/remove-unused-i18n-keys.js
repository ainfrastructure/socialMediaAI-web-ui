#!/usr/bin/env node

/**
 * Remove unused i18n keys from all locale files
 *
 * Usage: node scripts/remove-unused-i18n-keys.js
 *
 * This script:
 * 1. Finds all unused keys (same logic as find-unused-i18n-keys.js)
 * 2. Removes them from all locale files (en.ts, no.ts, etc.)
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

/**
 * Get all source files to search
 */
function getSourceFiles() {
  const files = []
  const srcDir = path.join(rootDir, 'src')

  function walkDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        // Skip locale files directory
        if (fullPath.includes('i18n/locales')) continue
        walkDir(fullPath)
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name)
        if (['.vue', '.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
          files.push(fullPath)
        }
      }
    }
  }

  walkDir(srcDir)
  return files
}

/**
 * Read and cache all source file contents
 */
function loadSourceFiles(filePaths) {
  const contents = []
  for (const filePath of filePaths) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      contents.push(content)
    } catch {
      // Skip files that can't be read
    }
  }
  return contents.join('\n')
}

/**
 * Get all keys from the English locale file
 */
function getAllKeys() {
  const enLocalePath = path.join(rootDir, 'src/i18n/locales/en.ts')

  if (!fs.existsSync(enLocalePath)) {
    console.error('Error: en.ts locale file not found')
    process.exit(1)
  }

  const content = fs.readFileSync(enLocalePath, 'utf-8')

  // Parse the object structure manually
  const keys = []
  const lines = content.split('\n')
  const pathStack = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
      continue
    }

    // Check for object start with key
    const objectStartMatch = trimmed.match(/^['"]?(\w+)['"]?\s*:\s*\{/)
    if (objectStartMatch) {
      pathStack.push(objectStartMatch[1])
      continue
    }

    // Check for object end
    if (trimmed === '},' || trimmed === '}') {
      pathStack.pop()
      continue
    }

    // Check for leaf key-value (string value)
    const leafMatch = trimmed.match(/^['"]?(\w+)['"]?\s*:\s*['"`]/)
    if (leafMatch) {
      const fullKey = [...pathStack, leafMatch[1]].join('.')
      if (fullKey && !fullKey.startsWith('.')) {
        keys.push(fullKey)
      }
    }
  }

  return keys
}

/**
 * Check if a key is used in the source content
 */
function isKeyUsed(key, sourceContent) {
  // Direct usage patterns
  const patterns = [
    `'${key}'`,
    `"${key}"`,
    `\`${key}\``,
  ]

  for (const pattern of patterns) {
    if (sourceContent.includes(pattern)) {
      return true
    }
  }

  // Check for dynamic key usage (e.g., t(`pricing.${plan}.title`))
  const keyParts = key.split('.')
  if (keyParts.length > 1) {
    const parentKey = keyParts.slice(0, -1).join('.')
    const dynamicPatterns = [
      `\`${parentKey}.\${`,
      `'${parentKey}.' +`,
      `"${parentKey}." +`,
      `${parentKey}[`,
    ]
    for (const pattern of dynamicPatterns) {
      if (sourceContent.includes(pattern)) {
        return true
      }
    }
  }

  return false
}


/**
 * Parse and rebuild locale file, removing unused keys
 */
function rebuildLocaleFile(filePath, unusedKeys) {
  const content = fs.readFileSync(filePath, 'utf-8')
  const unusedSet = new Set(unusedKeys)

  const lines = content.split('\n')
  const result = []
  const pathStack = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    // Always include empty lines and comments
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
      result.push(line)
      i++
      continue
    }

    // Handle export default and closing
    if (trimmed === 'export default {' || trimmed === '} as const') {
      result.push(line)
      i++
      continue
    }

    // Check for object start
    const objectStartMatch = trimmed.match(/^['"]?(\w+)['"]?\s*:\s*\{/)
    if (objectStartMatch) {
      pathStack.push(objectStartMatch[1])
      result.push(line)
      i++
      continue
    }

    // Check for object/array end
    if (trimmed === '},' || trimmed === '}' || trimmed === '],' || trimmed === '],') {
      pathStack.pop()
      result.push(line)
      i++
      continue
    }

    // Check for array start
    const arrayStartMatch = trimmed.match(/^['"]?(\w+)['"]?\s*:\s*\[/)
    if (arrayStartMatch) {
      const fullKey = [...pathStack, arrayStartMatch[1]].join('.')
      if (unusedSet.has(fullKey)) {
        // Skip the entire array
        let braceCount = 1
        i++
        while (i < lines.length && braceCount > 0) {
          const l = lines[i].trim()
          braceCount += (l.match(/\[/g) || []).length
          braceCount -= (l.match(/\]/g) || []).length
          i++
        }
        continue
      }
      pathStack.push(arrayStartMatch[1])
      result.push(line)
      i++
      continue
    }

    // Check for leaf key-value
    const leafMatch = trimmed.match(/^['"]?(\w+)['"]?\s*:/)
    if (leafMatch) {
      const fullKey = [...pathStack, leafMatch[1]].join('.')

      if (unusedSet.has(fullKey)) {
        // Skip this key-value pair
        // Check if it spans multiple lines (template literal or continues on next line)
        while (i < lines.length) {
          const nextTrimmed = lines[i].trim()
          // Check if line ends with a comma or is complete
          if (nextTrimmed.endsWith(',') || nextTrimmed.endsWith("',") ||
              nextTrimmed.endsWith('",') || nextTrimmed.endsWith('`,')) {
            i++
            break
          }
          // Check if it's a simple value on one line
          if (nextTrimmed.match(/:\s*['"`][^'"`]*['"`],?\s*$/)) {
            i++
            break
          }
          i++
        }
        continue
      }
    }

    result.push(line)
    i++
  }

  // Clean up result - remove empty objects
  let cleaned = result.join('\n')

  // Remove empty objects (objects with only whitespace/comments inside)
  // This is a simple approach - may need refinement
  cleaned = cleaned.replace(/['"]?\w+['"]?:\s*\{\s*\},?\n/g, '')

  // Remove trailing commas before closing braces
  cleaned = cleaned.replace(/,(\s*\})/g, '$1')

  // Remove multiple consecutive blank lines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n')

  return cleaned
}

/**
 * Main function
 */
async function main() {
  console.log('🔍 Finding unused i18n keys...\n')

  // Get all defined keys
  const allKeys = getAllKeys()
  console.log(`📝 Found ${allKeys.length} total keys in en.ts\n`)

  // Load all source files
  console.log('📂 Loading source files...')
  const sourceFiles = getSourceFiles()
  console.log(`   Found ${sourceFiles.length} source files\n`)

  const sourceContent = loadSourceFiles(sourceFiles)
  console.log('🔎 Checking key usage...\n')

  // Find unused keys
  const unusedKeys = []
  for (const key of allKeys) {
    if (!isKeyUsed(key, sourceContent)) {
      unusedKeys.push(key)
    }
  }

  console.log(`⚠️  Found ${unusedKeys.length} unused keys to remove\n`)

  if (unusedKeys.length === 0) {
    console.log('✅ No unused keys to remove!')
    return
  }

  // Get all locale files
  const localesDir = path.join(rootDir, 'src/i18n/locales')
  const localeFiles = fs.readdirSync(localesDir)
    .filter(f => f.endsWith('.ts'))
    .map(f => path.join(localesDir, f))

  console.log(`📁 Processing ${localeFiles.length} locale files...\n`)

  for (const filePath of localeFiles) {
    const fileName = path.basename(filePath)
    console.log(`   Processing ${fileName}...`)

    const newContent = rebuildLocaleFile(filePath, unusedKeys)
    fs.writeFileSync(filePath, newContent)

    console.log(`   ✓ ${fileName} updated`)
  }

  console.log('\n✅ Done! Removed unused keys from all locale files.')
  console.log('\n⚠️  Please run the build to verify everything still works:')
  console.log('   npm run build')
}

main().catch(console.error)

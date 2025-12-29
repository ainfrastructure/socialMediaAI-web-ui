#!/usr/bin/env node

/**
 * Find and optionally remove unused i18n keys from locale files
 *
 * Usage: node scripts/find-unused-i18n-keys.js
 *
 * This script:
 * 1. Reads all keys from ALL locale files in src/i18n/locales/
 * 2. Merges and deduplicates keys across all languages
 * 3. Searches the codebase for usages of each key
 * 4. Reports keys that are not used anywhere
 * 5. Optionally removes them from all locale files (after confirmation)
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import readline from 'readline'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

/**
 * Prompt user for confirmation
 */
function askQuestion(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer.toLowerCase().trim())
    })
  })
}

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
 * Get all keys from a single locale file
 */
function getKeysFromFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return []
  }

  const content = fs.readFileSync(filePath, 'utf-8')

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
 * Get all keys from ALL locale files (merged, deduplicated)
 */
function getAllKeys() {
  const localesDir = path.join(rootDir, 'src/i18n/locales')

  if (!fs.existsSync(localesDir)) {
    console.error('Error: locales directory not found')
    process.exit(1)
  }

  const localeFiles = fs.readdirSync(localesDir)
    .filter(f => f.endsWith('.ts'))
    .map(f => path.join(localesDir, f))

  if (localeFiles.length === 0) {
    console.error('Error: No locale files found')
    process.exit(1)
  }

  // Collect keys from all files
  const allKeysSet = new Set()
  const keysByFile = {}

  for (const filePath of localeFiles) {
    const fileName = path.basename(filePath)
    const keys = getKeysFromFile(filePath)
    keysByFile[fileName] = keys.length

    for (const key of keys) {
      allKeysSet.add(key)
    }
  }

  // Log which files were scanned
  console.log('📂 Scanned locale files:')
  for (const [file, count] of Object.entries(keysByFile)) {
    console.log(`   ${file}: ${count} keys`)
  }
  console.log('')

  return Array.from(allKeysSet)
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
  // If the parent path is used with template literal interpolation
  const keyParts = key.split('.')
  if (keyParts.length > 1) {
    const parentKey = keyParts.slice(0, -1).join('.')
    // Check for patterns like `parentKey.${` or `parentKey[`
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

    // Check for object end (only '}' closes an object, not ']' which closes arrays)
    if (trimmed === '},' || trimmed === '}') {
      pathStack.pop()
      result.push(line)
      i++
      continue
    }

    // Check for array end - just pass through, arrays don't affect path stack
    if (trimmed === '],' || trimmed === ']') {
      result.push(line)
      i++
      continue
    }

    // Check for array start - arrays are leaf values, they don't push to path stack
    const arrayStartMatch = trimmed.match(/^['"]?(\w+)['"]?\s*:\s*\[/)
    if (arrayStartMatch) {
      const fullKey = [...pathStack, arrayStartMatch[1]].join('.')
      if (unusedSet.has(fullKey)) {
        // Skip the entire array (handles multi-line arrays)
        let braceCount = (trimmed.match(/\[/g) || []).length - (trimmed.match(/\]/g) || []).length
        if (braceCount === 0) {
          // Single-line array like: key: ['a', 'b', 'c'],
          i++
          continue
        }
        // Multi-line array
        i++
        while (i < lines.length && braceCount > 0) {
          const l = lines[i].trim()
          braceCount += (l.match(/\[/g) || []).length
          braceCount -= (l.match(/\]/g) || []).length
          i++
        }
        continue
      }
      // Arrays are leaf values - don't push to path stack
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
  cleaned = cleaned.replace(/['"]?\w+['"]?:\s*\{\s*\},?\n/g, '')

  // Remove trailing commas before closing braces
  cleaned = cleaned.replace(/,(\s*\})/g, '$1')

  // Remove multiple consecutive blank lines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n')

  return cleaned
}

/**
 * Remove unused keys from all locale files
 */
function removeUnusedKeys(unusedKeys) {
  const localesDir = path.join(rootDir, 'src/i18n/locales')
  const localeFiles = fs.readdirSync(localesDir)
    .filter(f => f.endsWith('.ts'))
    .map(f => path.join(localesDir, f))

  console.log(`\n📁 Processing ${localeFiles.length} locale files...\n`)

  for (const filePath of localeFiles) {
    const fileName = path.basename(filePath)
    process.stdout.write(`   Processing ${fileName}...`)

    const newContent = rebuildLocaleFile(filePath, unusedKeys)
    fs.writeFileSync(filePath, newContent)

    console.log(' ✓')
  }

  console.log('\n✅ Done! Removed unused keys from all locale files.')
  console.log('\n⚠️  Run the build to verify everything still works:')
  console.log('   npm run build')
}

/**
 * Main function
 */
async function main() {
  console.log('🔍 Finding unused i18n keys...\n')

  // Get all defined keys from ALL locale files
  const allKeys = getAllKeys()
  console.log(`📝 Found ${allKeys.length} unique keys across all locale files\n`)

  // Load all source files
  console.log('📂 Loading source files...')
  const sourceFiles = getSourceFiles()
  console.log(`   Found ${sourceFiles.length} source files\n`)

  const sourceContent = loadSourceFiles(sourceFiles)
  console.log('🔎 Checking key usage...\n')

  // Check each key for usage
  const unusedKeys = []
  const usedKeys = []

  for (const key of allKeys) {
    if (isKeyUsed(key, sourceContent)) {
      usedKeys.push(key)
    } else {
      unusedKeys.push(key)
    }
  }

  // Report results
  if (unusedKeys.length === 0) {
    console.log('✅ No unused keys found!')
    console.log('\n📊 Summary:')
    console.log(`   Total keys: ${allKeys.length}`)
    console.log(`   Used keys: ${usedKeys.length}`)
    console.log(`   Unused keys: 0`)
    return
  }

  console.log(`⚠️  Found ${unusedKeys.length} potentially unused keys:\n`)

  // Group by top-level namespace
  const grouped = {}
  for (const key of unusedKeys) {
    const namespace = key.split('.')[0]
    if (!grouped[namespace]) {
      grouped[namespace] = []
    }
    grouped[namespace].push(key)
  }

  for (const [namespace, keys] of Object.entries(grouped)) {
    console.log(`  ${namespace}: (${keys.length} keys)`)
    for (const key of keys) {
      console.log(`    - ${key}`)
    }
    console.log()
  }

  console.log('\n💡 Note: Some keys may be used dynamically and appear as false positives.')
  console.log('   Review the list above carefully before proceeding.\n')

  // Summary
  console.log('📊 Summary:')
  console.log(`   Total keys: ${allKeys.length}`)
  console.log(`   Used keys: ${usedKeys.length}`)
  console.log(`   Unused keys: ${unusedKeys.length}`)

  // Ask for confirmation to delete
  console.log('')
  const answer = await askQuestion('🗑️  Do you want to remove these unused keys from all locale files? (y/n): ')

  if (answer === 'y' || answer === 'yes') {
    removeUnusedKeys(unusedKeys)
  } else {
    console.log('\n❌ Cancelled. No changes were made.')
  }
}

main().catch(console.error)

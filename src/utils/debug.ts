/**
 * Debug Logging Utility
 *
 * Centralized logging system with debug mode control.
 * Set VITE_DEBUG=true in .env to enable detailed logging.
 *
 * Usage:
 *   import { debugLog, debugWarn, debugError } from '@/utils/debug'
 *
 *   debugLog('User logged in', { userId: 123 })
 *   debugWarn('API rate limit approaching')
 *   debugError('Failed to fetch data', error)
 */

// Read debug flag from environment variables
// In production builds, Vite will replace import.meta.env.VITE_DEBUG with the actual value
const DEBUG = import.meta.env.VITE_DEBUG === 'true'

/**
 * Debug log - only shows when DEBUG is enabled
 * Use for detailed debugging information
 */
export function debugLog(message: string, ...args: any[]): void {
  if (DEBUG) {
    console.log(`[DEBUG] ${message}`, ...args)
  }
}

/**
 * Debug warn - only shows when DEBUG is enabled
 * Use for non-critical warnings during development
 */
export function debugWarn(message: string, ...args: any[]): void {
  if (DEBUG) {
    console.warn(`[DEBUG] ${message}`, ...args)
  }
}

/**
 * Debug error - only shows when DEBUG is enabled
 * Use for debugging errors (production errors should use errorLog)
 */
export function debugError(message: string, ...args: any[]): void {
  if (DEBUG) {
    console.error(`[DEBUG] ${message}`, ...args)
  }
}

/**
 * Info log - always shows, for important information
 * Use sparingly for user-facing or critical information
 */
export function infoLog(message: string, ...args: any[]): void {
  console.log(`[INFO] ${message}`, ...args)
}

/**
 * Error log - always shows
 * Use for production errors that should always be logged
 */
export function errorLog(message: string, ...args: any[]): void {
  console.error(`[ERROR] ${message}`, ...args)
}

/**
 * Warning log - always shows
 * Use for important warnings that should always be visible
 */
export function warnLog(message: string, ...args: any[]): void {
  console.warn(`[WARN] ${message}`, ...args)
}

/**
 * Group logging - only shows when DEBUG is enabled
 * Useful for grouping related debug logs
 */
export function debugGroup(label: string, fn: () => void): void {
  if (DEBUG) {
    console.group(`[DEBUG] ${label}`)
    fn()
    console.groupEnd()
  }
}

/**
 * Table logging - only shows when DEBUG is enabled
 * Useful for displaying structured data
 */
export function debugTable(data: any): void {
  if (DEBUG) {
    console.table(data)
  }
}

/**
 * Time tracking - only shows when DEBUG is enabled
 * Use for performance debugging
 */
export function debugTime(label: string): void {
  if (DEBUG) {
    console.time(`[DEBUG] ${label}`)
  }
}

export function debugTimeEnd(label: string): void {
  if (DEBUG) {
    console.timeEnd(`[DEBUG] ${label}`)
  }
}

// Log debug mode status on startup
if (DEBUG) {
  console.log('%c🔍 DEBUG MODE ENABLED', 'background: #222; color: #bada55; font-size: 14px; padding: 4px 8px; border-radius: 4px;')
} else {
  console.log('%cℹ️ Production Mode - Debug logs disabled', 'color: #888; font-size: 12px;')
}

/**
 * Fetch with timeout utility
 * Wraps the native fetch API with configurable timeout support using AbortController
 */

export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 10000
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    })
    clearTimeout(timeoutId)
    return response
  } catch (error: any) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs}ms`)
    }
    throw error
  }
}

/**
 * Recommended timeout values for different operation types
 */
export const TIMEOUTS = {
  AUTH: 5000,           // Auth operations
  GET: 8000,            // GET requests
  POST: 10000,          // POST/PUT requests
  IMAGE_GEN: 60000,     // Image generation (1 minute)
  VIDEO_GEN: 120000,    // Video generation (2 minutes)
} as const

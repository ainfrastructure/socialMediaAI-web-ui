/**
 * Buffer Integration Service
 *
 * Handles scheduling Instagram Reels captions to Buffer
 * with timezone-optimized posting times.
 *
 * Buffer API v1 reference: https://buffer.com/developers/api
 */

import type { ApiResponse } from './apiBase'
import { API_URL, getAuthHeaders } from './apiBase'
import type { ContentCalendarEntry } from '@/types/reels-captions'
import { formatFullCaption } from '@/config/reelsCaptions'

export interface BufferProfile {
  id: string
  service: string
  serviceUsername: string
  avatar: string
  isConnected: boolean
}

export interface BufferScheduleResult {
  day: number
  success: boolean
  bufferPostId?: string
  scheduledTime?: string
  error?: string
}

class BufferService {
  /**
   * Get connected Buffer profiles.
   * Proxied through our backend to avoid exposing Buffer access tokens.
   */
  async getProfiles(): Promise<ApiResponse<{ profiles: BufferProfile[] }>> {
    const response = await fetch(`${API_URL}/api/integrations/buffer/profiles`, {
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      const text = await response.text()
      try {
        return JSON.parse(text)
      } catch {
        return {
          success: false,
          error: `HTTP ${response.status}: ${text || response.statusText}`,
        }
      }
    }

    return response.json()
  }

  /**
   * Schedule a single caption to Buffer.
   */
  async schedulePost(params: {
    profileId: string
    text: string
    scheduledAt: string // ISO 8601 UTC
    media?: { link?: string; photo?: string }
  }): Promise<ApiResponse<{ postId: string; scheduledAt: string }>> {
    const response = await fetch(`${API_URL}/api/integrations/buffer/schedule`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(params),
    })

    if (!response.ok) {
      const text = await response.text()
      try {
        return JSON.parse(text)
      } catch {
        return {
          success: false,
          error: `HTTP ${response.status}: ${text || response.statusText}`,
        }
      }
    }

    return response.json()
  }

  /**
   * Schedule all 30 days of captions to Buffer in batch.
   * Processes sequentially to respect Buffer rate limits.
   *
   * @param profileId - Buffer profile ID for Instagram
   * @param entries - Calendar entries with captions and scheduled times
   * @param timezone - Target timezone for scheduling
   * @returns Array of results for each scheduled post
   */
  async scheduleBatch(
    profileId: string,
    entries: ContentCalendarEntry[],
    _timezone: string
  ): Promise<BufferScheduleResult[]> {
    const results: BufferScheduleResult[] = []

    for (const entry of entries) {
      const captionText = formatFullCaption(entry.caption)
      const scheduledAt = `${entry.scheduledDate}T${entry.scheduledTime}:00Z`

      try {
        const result = await this.schedulePost({
          profileId,
          text: captionText,
          scheduledAt,
        })

        results.push({
          day: entry.caption.day,
          success: result.success,
          bufferPostId: result.data?.postId,
          scheduledTime: result.data?.scheduledAt,
          error: result.error,
        })
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        results.push({
          day: entry.caption.day,
          success: false,
          error: message,
        })
      }

      // Rate limit: wait 200ms between requests (Buffer allows 50/10min)
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    return results
  }

  /**
   * Cancel a scheduled Buffer post.
   */
  async cancelPost(postId: string): Promise<ApiResponse> {
    const response = await fetch(`${API_URL}/api/integrations/buffer/posts/${postId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      const text = await response.text()
      try {
        return JSON.parse(text)
      } catch {
        return {
          success: false,
          error: `HTTP ${response.status}: ${text || response.statusText}`,
        }
      }
    }

    return response.json()
  }
}

export const bufferService = new BufferService()

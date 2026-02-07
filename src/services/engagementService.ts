import type { ApiResponse } from './apiBase'
import { API_URL, getAuthHeader, getAuthHeaders } from './apiBase'
import type { PostEngagement } from '@/types/engagement'

class EngagementService {
  /**
   * Get engagement metrics for a single post
   */
  async getPostEngagement(scheduledPostId: string): Promise<ApiResponse<PostEngagement>> {
    const response = await fetch(`${API_URL}/api/engagement/${scheduledPostId}`, {
      headers: getAuthHeader(),
    })
    return response.json()
  }

  /**
   * Get engagement metrics for multiple posts
   */
  async getBulkEngagement(
    scheduledPostIds: string[]
  ): Promise<ApiResponse<{ posts: PostEngagement[] }>> {
    const response = await fetch(`${API_URL}/api/engagement/bulk`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ scheduled_post_ids: scheduledPostIds }),
    })
    return response.json()
  }

  /**
   * Manually refresh engagement metrics for a post
   */
  async refreshEngagement(scheduledPostId: string): Promise<ApiResponse<PostEngagement>> {
    const response = await fetch(`${API_URL}/api/engagement/${scheduledPostId}/refresh`, {
      method: 'POST',
      headers: getAuthHeader(),
    })
    return response.json()
  }

  /**
   * Get aggregated engagement analytics
   */
  async getAnalytics(filters: {
    start_date?: string
    end_date?: string
    platforms?: string[]
    restaurant_ids?: string[]
    business_ids?: string[]
  }): Promise<ApiResponse<any>> {
    const params = new URLSearchParams()

    if (filters.start_date) params.append('start_date', filters.start_date)
    if (filters.end_date) params.append('end_date', filters.end_date)
    if (filters.platforms && filters.platforms.length > 0) {
      params.append('platforms', filters.platforms.join(','))
    }
    if (filters.restaurant_ids && filters.restaurant_ids.length > 0) {
      params.append('restaurant_ids', filters.restaurant_ids.join(','))
    }
    if (filters.business_ids && filters.business_ids.length > 0) {
      params.append('business_ids', filters.business_ids.join(','))
    }

    const url = `${API_URL}/api/engagement/analytics?${params.toString()}`
    const response = await fetch(url, {
      headers: getAuthHeader(),
    })
    return response.json()
  }
}

export const engagementService = new EngagementService()

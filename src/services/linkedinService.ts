import type { ApiResponse } from './apiBase'
import { API_URL, getAuthHeader, getAuthHeaders } from './apiBase'
import { fetchWithTimeout, TIMEOUTS } from '@/utils/fetchWithTimeout'

class LinkedInService {
  async initAuth(businessId?: string): Promise<ApiResponse<{ authUrl: string; state: string }>> {
    const params = new URLSearchParams()
    if (businessId) params.append('business_id', businessId)
    const url = params.toString()
      ? `${API_URL}/api/linkedin/auth/init?${params}`
      : `${API_URL}/api/linkedin/auth/init`

    const response = await fetchWithTimeout(
      url,
      {
        headers: getAuthHeader(),
      },
      TIMEOUTS.AUTH
    )

    if (!response.ok) {
      const text = await response.text()
      try {
        return JSON.parse(text)
      } catch {
        return {
          success: false,
          error: `HTTP ${response.status}: ${text || response.statusText}`
        }
      }
    }

    return response.json()
  }

  async completeAuth(
    code: string,
    state: string
  ): Promise<ApiResponse<{ pages: any[] }>> {
    const response = await fetchWithTimeout(
      `${API_URL}/api/linkedin/auth/callback`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ code, state }),
      },
      TIMEOUTS.POST
    )

    if (!response.ok) {
      const text = await response.text()
      try {
        return JSON.parse(text)
      } catch {
        return {
          success: false,
          error: `HTTP ${response.status}: ${text || response.statusText}`
        }
      }
    }

    return response.json()
  }

  async getPages(businessId?: string): Promise<ApiResponse<{ pages: any[] }>> {
    const params = new URLSearchParams()
    if (businessId) params.append('business_id', businessId)
    const url = params.toString()
      ? `${API_URL}/api/linkedin/pages?${params}`
      : `${API_URL}/api/linkedin/pages`

    const response = await fetchWithTimeout(
      url,
      {
        headers: getAuthHeader(),
      },
      TIMEOUTS.GET
    )

    if (!response.ok) {
      const text = await response.text()
      try {
        return JSON.parse(text)
      } catch {
        return {
          success: false,
          error: `HTTP ${response.status}: ${text || response.statusText}`
        }
      }
    }

    return response.json()
  }

  async disconnectPage(pageId: string, businessId?: string): Promise<ApiResponse> {
    const params = new URLSearchParams()
    if (businessId) params.append('business_id', businessId)
    const url = params.toString()
      ? `${API_URL}/api/linkedin/pages/${pageId}?${params}`
      : `${API_URL}/api/linkedin/pages/${pageId}`

    const response = await fetchWithTimeout(
      url,
      {
        method: 'DELETE',
        headers: getAuthHeader(),
      },
      TIMEOUTS.POST
    )

    if (!response.ok) {
      const text = await response.text()
      try {
        return JSON.parse(text)
      } catch {
        return {
          success: false,
          error: `HTTP ${response.status}: ${text || response.statusText}`
        }
      }
    }

    return response.json()
  }

  async post(
    pageId: string,
    text: string,
    mediaUrls?: string[],
    mediaType?: 'image' | 'video'
  ): Promise<ApiResponse<{ postId: string; postUrl: string }>> {
    const response = await fetchWithTimeout(
      `${API_URL}/api/linkedin/pages/${pageId}/post`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          text,
          mediaUrls: mediaUrls || [],
          mediaType
        }),
      },
      mediaType === 'video' ? TIMEOUTS.VIDEO_GEN : TIMEOUTS.POST
    )

    if (!response.ok) {
      const text = await response.text()
      try {
        return JSON.parse(text)
      } catch {
        return {
          success: false,
          error: `HTTP ${response.status}: ${text || response.statusText}`
        }
      }
    }

    return response.json()
  }
}

export const linkedinService = new LinkedInService()

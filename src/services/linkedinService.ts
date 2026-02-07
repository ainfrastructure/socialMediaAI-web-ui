import type { ApiResponse } from './apiBase'
import { API_URL, getAuthHeader, getAuthHeaders } from './apiBase'
import { fetchWithTimeout, TIMEOUTS } from '@/utils/fetchWithTimeout'

class LinkedInService {
  async initAuth(brandId?: string): Promise<ApiResponse<{ authUrl: string; state: string }>> {
    const response = await fetchWithTimeout(
      `${API_URL}/api/linkedin/auth/init${brandId ? `?brand_id=${brandId}` : ''}`,
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

  async getPages(brandId?: string): Promise<ApiResponse<{ pages: any[] }>> {
    const response = await fetchWithTimeout(
      `${API_URL}/api/linkedin/pages${brandId ? `?brand_id=${brandId}` : ''}`,
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

  async disconnectPage(pageId: string, brandId?: string): Promise<ApiResponse> {
    const response = await fetchWithTimeout(
      `${API_URL}/api/linkedin/pages/${pageId}${brandId ? `?brand_id=${brandId}` : ''}`,
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

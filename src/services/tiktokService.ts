import type { ApiResponse } from './apiBase'
import { API_URL, getAuthHeader, getAuthHeaders } from './apiBase'
import { fetchWithTimeout, TIMEOUTS } from '@/utils/fetchWithTimeout'

class TikTokService {
  async initAuth(businessId?: string): Promise<ApiResponse<{ authUrl: string; state: string }>> {
    const params = new URLSearchParams()
    if (businessId) params.append('business_id', businessId)
    const url = params.toString()
      ? `${API_URL}/api/tiktok/auth/init?${params}`
      : `${API_URL}/api/tiktok/auth/init`

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
  ): Promise<ApiResponse<{ accounts: any[] }>> {
    const response = await fetchWithTimeout(
      `${API_URL}/api/tiktok/auth/callback`,
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

  async getAccounts(businessId?: string): Promise<ApiResponse<{ accounts: any[] }>> {
    const params = new URLSearchParams()
    if (businessId) params.append('business_id', businessId)
    const url = params.toString()
      ? `${API_URL}/api/tiktok/accounts?${params}`
      : `${API_URL}/api/tiktok/accounts`

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

  async disconnectAccount(accountId: string, businessId?: string): Promise<ApiResponse> {
    const params = new URLSearchParams()
    if (businessId) params.append('business_id', businessId)
    const url = params.toString()
      ? `${API_URL}/api/tiktok/accounts/${accountId}?${params}`
      : `${API_URL}/api/tiktok/accounts/${accountId}`

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
    accountId: string,
    caption: string,
    videoUrl: string,
    privacyLevel?: 'PUBLIC_TO_EVERYONE' | 'MUTUAL_FOLLOW_FRIENDS' | 'SELF_ONLY'
  ): Promise<ApiResponse<{ videoId: string; postUrl: string }>> {
    const response = await fetchWithTimeout(
      `${API_URL}/api/tiktok/accounts/${accountId}/post`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          caption,
          videoUrl,
          privacy_level: privacyLevel || 'PUBLIC_TO_EVERYONE'
        }),
      },
      TIMEOUTS.VIDEO_GEN // Use 2-minute timeout for video uploads
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

export const tiktokService = new TikTokService()

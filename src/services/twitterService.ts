import type { ApiResponse } from './apiBase'
import { API_URL, getAuthHeader, getAuthHeaders } from './apiBase'
import { fetchWithTimeout, TIMEOUTS } from '@/utils/fetchWithTimeout'

class TwitterService {
  async initAuth(brandId?: string): Promise<ApiResponse<{ authUrl: string; state: string }>> {
    const response = await fetchWithTimeout(
      `${API_URL}/api/twitter/auth/init${brandId ? `?brand_id=${brandId}` : ''}`,
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
      `${API_URL}/api/twitter/auth/callback`,
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

  async getAccounts(brandId?: string): Promise<ApiResponse<{ accounts: any[] }>> {
    const response = await fetchWithTimeout(
      `${API_URL}/api/twitter/accounts${brandId ? `?brand_id=${brandId}` : ''}`,
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

  async disconnectAccount(accountId: string, brandId?: string): Promise<ApiResponse> {
    const response = await fetchWithTimeout(
      `${API_URL}/api/twitter/accounts/${accountId}${brandId ? `?brand_id=${brandId}` : ''}`,
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
    text: string,
    mediaUrls?: string[]
  ): Promise<ApiResponse<{ tweetId: string; tweetUrl: string }>> {
    const response = await fetchWithTimeout(
      `${API_URL}/api/twitter/accounts/${accountId}/post`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          text,
          mediaUrls: mediaUrls || []
        }),
      },
      TIMEOUTS.PUBLISH
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

export const twitterService = new TwitterService()

import type { ApiResponse } from './apiBase'
import { API_URL, getAuthHeader, getAuthHeaders } from './apiBase'

class TikTokService {
  async initAuth(): Promise<ApiResponse<{ authUrl: string; state: string }>> {
    const response = await fetch(`${API_URL}/api/tiktok/auth/init`, {
      headers: getAuthHeader(),
    })

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
    const response = await fetch(`${API_URL}/api/tiktok/auth/callback`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ code, state }),
    })
    return response.json()
  }

  async getAccounts(): Promise<ApiResponse<{ accounts: any[] }>> {
    const response = await fetch(`${API_URL}/api/tiktok/accounts`, {
      headers: getAuthHeader(),
    })
    return response.json()
  }

  async disconnectAccount(accountId: string): Promise<ApiResponse> {
    const response = await fetch(`${API_URL}/api/tiktok/accounts/${accountId}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    })
    return response.json()
  }

  async post(
    accountId: string,
    caption: string,
    videoUrl: string,
    privacyLevel?: 'PUBLIC_TO_EVERYONE' | 'MUTUAL_FOLLOW_FRIENDS' | 'SELF_ONLY'
  ): Promise<ApiResponse<{ videoId: string; postUrl: string }>> {
    const response = await fetch(`${API_URL}/api/tiktok/accounts/${accountId}/post`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        caption,
        videoUrl,
        privacy_level: privacyLevel || 'PUBLIC_TO_EVERYONE'
      }),
    })
    return response.json()
  }
}

export const tiktokService = new TikTokService()

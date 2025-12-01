import type { ApiResponse } from './apiBase'
import { API_URL, getAuthHeader, getAuthHeaders } from './apiBase'

class InstagramService {
  async initAuth(): Promise<ApiResponse<{ authUrl: string; state: string }>> {
    const response = await fetch(`${API_URL}/api/instagram/auth/init`, {
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
    const response = await fetch(`${API_URL}/api/instagram/auth/callback`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ code, state }),
    })
    return response.json()
  }

  async getAccounts(): Promise<ApiResponse<{ accounts: any[] }>> {
    const response = await fetch(`${API_URL}/api/instagram/accounts`, {
      headers: getAuthHeader(),
    })
    return response.json()
  }

  async disconnectAccount(accountId: string): Promise<ApiResponse> {
    const response = await fetch(`${API_URL}/api/instagram/accounts/${accountId}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    })
    return response.json()
  }

  async post(
    accountId: string,
    caption: string,
    imageUrl: string
  ): Promise<ApiResponse<{ postId: string; postUrl: string }>> {
    const response = await fetch(`${API_URL}/api/instagram/accounts/${accountId}/post`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ caption, imageUrl }),
    })
    return response.json()
  }
}

export const instagramService = new InstagramService()

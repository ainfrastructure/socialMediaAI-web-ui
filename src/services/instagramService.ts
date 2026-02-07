import type { ApiResponse } from './apiBase'
import { API_URL, getAuthHeader, getAuthHeaders } from './apiBase'

class InstagramService {
  async initAuth(brandId?: string): Promise<ApiResponse<{ authUrl: string; state: string }>> {
    const response = await fetch(`${API_URL}/api/instagram/auth/init${brandId ? `?brand_id=${brandId}` : ''}`, {
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
    const response = await fetch(`${API_URL}/api/instagram/accounts${brandId ? `?brand_id=${brandId}` : ''}`, {
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

  async disconnectAccount(accountId: string, brandId?: string): Promise<ApiResponse> {
    const response = await fetch(`${API_URL}/api/instagram/accounts/${accountId}${brandId ? `?brand_id=${brandId}` : ''}`, {
      method: 'DELETE',
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

  async post(
    accountId: string,
    caption: string,
    imageUrl?: string,
    videoUrl?: string,
    contentType?: 'image' | 'video',
    postType?: 'feed' | 'story' | 'reel' | 'carousel',
    carouselItems?: Array<{ mediaUrl: string; contentType: 'image' | 'video' }>
  ): Promise<ApiResponse<{ postId: string; postUrl: string }>> {
    const requestBody = {
      caption,
      imageUrl,
      videoUrl,
      contentType,
      postType: postType || 'feed',
      carouselItems // Keep camelCase - backend expects this format
    }

    console.log('🚨🚨🚨 [instagramService.post] REQUEST BODY:', JSON.stringify(requestBody, null, 2))

    const response = await fetch(`${API_URL}/api/instagram/accounts/${accountId}/post`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(requestBody),
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
}

export const instagramService = new InstagramService()

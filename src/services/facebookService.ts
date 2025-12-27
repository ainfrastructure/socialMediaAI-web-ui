import type { ApiResponse } from './apiBase'
import { API_URL, getAuthHeader, getAuthHeaders } from './apiBase'
import { debugLog, debugError } from '@/utils/debug'

class FacebookService {
  async initAuth(): Promise<ApiResponse<{ authUrl: string; state: string }>> {
    const response = await fetch(`${API_URL}/api/facebook/auth/init`, {
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
  ): Promise<ApiResponse<{ pages: any[] }>> {
    const response = await fetch(`${API_URL}/api/facebook/auth/callback`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ code, state }),
    })
    return response.json()
  }

  async getPages(): Promise<ApiResponse<{ pages: any[] }>> {
    const response = await fetch(`${API_URL}/api/facebook/pages`, {
      headers: getAuthHeader(),
    })
    return response.json()
  }

  async disconnectPage(pageId: string): Promise<ApiResponse> {
    const response = await fetch(`${API_URL}/api/facebook/pages/${pageId}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    })
    return response.json()
  }

  async post(
    pageId: string,
    message: string,
    imageUrl?: string,
    videoUrl?: string,
    contentType?: 'image' | 'video'
  ): Promise<ApiResponse<{ postId: string; postUrl: string }>> {
    debugLog('[FacebookService] Posting to Facebook:', { pageId, messageLength: message.length, hasImage: !!imageUrl, hasVideo: !!videoUrl, contentType, apiUrl: `${API_URL}/api/facebook/pages/${pageId}/post` })

    try {
      const response = await fetch(`${API_URL}/api/facebook/pages/${pageId}/post`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ message, imageUrl, videoUrl, contentType }),
      })

      debugLog('[FacebookService] Response status:', response.status, response.statusText)

      if (!response.ok) {
        const text = await response.text()
        debugError('[FacebookService] Response not OK:', text)
        try {
          return JSON.parse(text)
        } catch {
          return {
            success: false,
            error: `HTTP ${response.status}: ${text || response.statusText}`
          }
        }
      }

      const data = await response.json()
      debugLog('[FacebookService] Response data:', data)
      return data
    } catch (error) {
      debugError('[FacebookService] Network or parse error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network request failed'
      }
    }
  }

  async uploadImage(file: File): Promise<ApiResponse<{ imageUrl: string; imageId: string; width: number; height: number }>> {
    const formData = new FormData()
    formData.append('image', file)

    const response = await fetch(`${API_URL}/api/facebook/upload-image`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: formData,
    })
    return response.json()
  }

  async getPostHistory(pageId?: string): Promise<ApiResponse<{ posts: any[] }>> {
    const url = pageId
      ? `${API_URL}/api/facebook/posts?pageId=${encodeURIComponent(pageId)}`
      : `${API_URL}/api/facebook/posts`

    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeader(),
    })
    return response.json()
  }
}

export const facebookService = new FacebookService()

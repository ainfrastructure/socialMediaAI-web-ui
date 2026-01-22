import type { ApiResponse } from './apiBase'
import { API_URL, getAuthHeader, getAuthHeaders } from './apiBase'

class FavoritesService {
  async getFavorites(filters?: {
    platform?: string
    restaurant_id?: string
    content_type?: 'image' | 'video'
    limit?: number
    offset?: number
    sort?: 'newest' | 'oldest'
  }): Promise<ApiResponse<{ favorites: any[]; pagination: { total: number; limit: number; offset: number; totalPages: number } }>> {
    const params = new URLSearchParams()
    if (filters?.platform) params.append('platform', filters.platform)
    if (filters?.restaurant_id) params.append('restaurant_id', filters.restaurant_id)
    if (filters?.content_type) params.append('content_type', filters.content_type)
    if (filters?.limit) params.append('limit', filters.limit.toString())
    if (filters?.offset) params.append('offset', filters.offset.toString())
    if (filters?.sort) params.append('sort', filters.sort)

    const url = params.toString() ? `${API_URL}/api/favorites?${params}` : `${API_URL}/api/favorites`
    const response = await fetch(url, {
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

  async getFavorite(id: string): Promise<ApiResponse<{ favorite: any }>> {
    const response = await fetch(`${API_URL}/api/favorites/${id}`, {
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

  async saveFavorite(favoriteData: {
    restaurant_id?: string
    content_type: 'image' | 'video'
    media_url: string
    post_text?: string
    hashtags?: string[]
    platform?: string
    platforms?: string[]
    prompt?: string
    menu_items?: any[]
    context?: string
    brand_dna?: any
  }): Promise<ApiResponse<{ favorite: any }>> {
    const response = await fetch(`${API_URL}/api/favorites`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(favoriteData),
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

  async updateFavorite(
    id: string,
    updates: {
      post_text?: string
      hashtags?: string[]
      platform?: string
      platforms?: string[]
      video_url?: string
      content_type?: string
    }
  ): Promise<ApiResponse<{ favorite: any }>> {
    const response = await fetch(`${API_URL}/api/favorites/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
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

  async deleteFavorite(id: string): Promise<ApiResponse> {
    const response = await fetch(`${API_URL}/api/favorites/${id}`, {
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
}

export const favoritesService = new FavoritesService()

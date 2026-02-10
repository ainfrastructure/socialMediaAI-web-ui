import type { ApiResponse } from './apiBase'
import { API_URL, getAuthHeader, getAuthHeaders } from './apiBase'

class FavoritesService {
  async getFavorites(filters?: {
    platform?: string
    brand_id?: string
    content_type?: 'image' | 'video'
    limit?: number
    offset?: number
    sort?: 'newest' | 'oldest'
  }): Promise<ApiResponse<{ favorites: any[]; pagination: { total: number; limit: number; offset: number; totalPages: number } }>> {
    const params = new URLSearchParams()
    if (filters?.platform) params.append('platform', filters.platform)
    if (filters?.brand_id) params.append('brand_id', filters.brand_id)
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
    brand_id?: string
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
    // Map frontend field names to backend field names
    const payload = {
      brand_id: favoriteData.brand_id || favoriteData.restaurant_id,
      content_type: favoriteData.content_type,
      image_url: favoriteData.media_url,
      caption: favoriteData.post_text,
      hashtags: favoriteData.hashtags,
      platform: favoriteData.platform,
      platforms: favoriteData.platforms,
      video_url: favoriteData.content_type === 'video' ? favoriteData.media_url : undefined,
    }

    const response = await fetch(`${API_URL}/api/favorites`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
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
      image_url?: string
      status?: string
    }
  ): Promise<ApiResponse<{ favorite: any }>> {
    // Map frontend field names to backend field names
    const payload: Record<string, unknown> = {}
    if (updates.post_text !== undefined) payload.caption = updates.post_text
    if (updates.hashtags !== undefined) payload.hashtags = updates.hashtags
    if (updates.platform !== undefined) payload.platform = updates.platform
    if (updates.platforms !== undefined) payload.platform_targets = updates.platforms
    if (updates.video_url !== undefined) payload.video_url = updates.video_url
    if (updates.content_type !== undefined) payload.content_type = updates.content_type
    if (updates.image_url !== undefined) payload.image_url = updates.image_url
    if (updates.status !== undefined) payload.status = updates.status

    const response = await fetch(`${API_URL}/api/favorites/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
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

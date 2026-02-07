import type { ApiResponse } from './apiBase'
import { API_URL, getAuthHeader, getAuthHeaders } from './apiBase'

// ============================================================================
// Brand Types (matching backend types.ts)
// ============================================================================

export interface BrandMenu {
  items?: MenuItem[]
  categories?: string[]
  last_updated?: string
  source?: string
}

export interface MenuItem {
  name: string
  description?: string
  price?: number | string
  category?: string
  imageUrl?: string
}

export interface BrandDna {
  logo_url?: string
  tone?: string
  vibe?: string
  color_palette?: Record<string, string>
  tagline?: string
  font_style?: string
  target_audience?: string
  demographics?: Record<string, unknown>
  content_pillars?: string[]
  [key: string]: unknown
}

export interface SocialMediaLinks {
  instagram?: string
  facebook?: string
  twitter?: string
  tiktok?: string
  linkedin?: string
  [key: string]: string | undefined
}

export interface Brand {
  id: string
  user_id: string

  // Basic
  name: string
  description: string | null
  logo_url: string | null
  website: string | null
  location: string | null
  phone_number: string | null

  // Classification
  business_type: string | null
  language: string | null
  locale: string | null

  // Brand Identity
  tagline: string | null
  tone: string | null
  voice: string | null
  vibe: string | null
  color_palette: Record<string, string> | null
  font_style: string | null

  // Audience
  target_audience: string | null
  demographics: Record<string, unknown> | null
  interests: string[] | null

  // Competitive
  competitors: Array<{ name: string; url?: string; notes?: string }> | null

  // Content Strategy
  content_pillars: string[] | null
  posting_frequency: string | null
  preferred_platforms: string[] | null
  content_templates: Record<string, unknown> | null

  // Google Places (optional)
  google_place_id: string | null
  google_rating: number | null
  google_reviews_count: number | null
  google_reviews: unknown[] | null
  google_types: string[] | null
  opening_hours: unknown | null
  geo_location: { lat: number; lng: number } | null

  // Social handles
  social_links: Record<string, string> | null

  // Menu
  menu: BrandMenu | null

  // AI
  openclaw_session_key: string | null

  // Onboarding
  onboarding_step: string | null
  onboarding_completed: boolean

  created_at: string
  updated_at: string

  // Legacy compat fields (used by codex-era components)
  brand_dna?: BrandDna | null
  social_media?: SocialMediaLinks | null
  is_default?: boolean
  address?: string | null
  place_id?: string | null
  rating?: number | null
  user_ratings_total?: number | null
  uploaded_images?: BrandAsset[] | null
  is_manual?: boolean
  brand_id?: string | null
  types?: string[] | null
}

export type AssetType = 'photo' | 'video' | 'logo' | 'document'
export type AssetSource = 'upload' | 'website_scrape' | 'ai_generated' | 'google_places'

export interface BrandAsset {
  id: string
  brand_id: string
  user_id: string
  url: string
  storage_path: string | null
  type: AssetType
  mime_type: string | null
  folder: string | null
  description: string | null
  alt_text: string | null
  width: number | null
  height: number | null
  file_size: number | null
  duration: number | null
  format: string | null
  source: AssetSource
  source_url: string | null
  created_at: string
  updated_at: string
}

export type PostStatus = 'draft' | 'approved' | 'scheduled' | 'published' | 'rejected' | 'archived'
export type ContentType = 'image' | 'video' | 'carousel' | 'text' | 'reel' | 'story'

export interface BrandPost {
  id: string
  brand_id: string
  user_id: string
  caption: string | null
  hashtags: string[] | null
  image_url: string | null
  image_prompt: string | null
  video_url: string | null
  carousel_items: Array<{ url: string; caption?: string }> | null
  content_type: ContentType
  status: PostStatus
  platform: string | null
  platform_targets: string[] | null
  scheduled_for: string | null
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: string
  conversation_id: string
  user_id: string
  role: 'user' | 'assistant' | 'system'
  content: string | null
  parts: unknown[] | null
  metadata: Record<string, unknown> | null
  token_count: number | null
  created_at: string
}

export type SocialPlatform = 'facebook' | 'instagram' | 'tiktok' | 'twitter' | 'linkedin' | 'youtube' | 'threads'

export interface SocialConnection {
  id: string
  brand_id: string
  user_id: string
  platform: SocialPlatform
  platform_account_id: string
  username: string | null
  display_name: string | null
  profile_picture_url: string | null
  access_token: string | null
  refresh_token: string | null
  token_expires_at: string | null
  platform_data: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

// ============================================================================
// Create / Update DTOs
// ============================================================================

export interface CreateBrandData {
  name: string
  business_type?: string | null
  description?: string | null
  website?: string | null
  location?: string | null
  phone_number?: string | null
  logo_url?: string | null
  tagline?: string | null
  tone?: string | null
  voice?: string | null
  vibe?: string | null
  color_palette?: Record<string, string> | null
  font_style?: string | null
  target_audience?: string | null
  social_links?: Record<string, string> | null
  address?: string | null
  brand_id?: string | null
}

export interface UpdateBrandData {
  name?: string
  business_type?: string | null
  description?: string | null
  website?: string | null
  location?: string | null
  phone_number?: string | null
  logo_url?: string | null
  tagline?: string | null
  tone?: string | null
  voice?: string | null
  vibe?: string | null
  color_palette?: Record<string, string> | null
  font_style?: string | null
  target_audience?: string | null
  demographics?: Record<string, unknown> | null
  interests?: string[] | null
  competitors?: Array<{ name: string; url?: string; notes?: string }> | null
  content_pillars?: string[] | null
  posting_frequency?: string | null
  preferred_platforms?: string[] | null
  content_templates?: Record<string, unknown> | null
  social_links?: Record<string, string> | null
  menu?: BrandMenu | null
  language?: string | null
  locale?: string | null
  opening_hours?: unknown | null
  social_media?: SocialMediaLinks | null
  address?: string | null
  brand_dna?: BrandDna | null
  brand_id?: string | null
}

export interface UploadAssetData {
  base64: string
  mimeType: string
  folder?: string
  description?: string
  type?: AssetType
}

// ============================================================================
// Brand Service
// ============================================================================

class BrandService {
  // --- Brand CRUD ---

  async getBrands(): Promise<Brand[]> {
    const response = await fetch(`${API_URL}/api/brands`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    })

    if (!response.ok) {
      const text = await response.text()
      let message = text || response.statusText
      try { const parsed = JSON.parse(text); message = parsed.error || message } catch { /* ignore */ }
      throw new Error(`HTTP ${response.status}: ${message}`)
    }

    const data: ApiResponse<Brand[]> = await response.json()
    return data.data || []
  }

  async getBrand(id: string): Promise<ApiResponse<Brand>> {
    const response = await fetch(`${API_URL}/api/brands/${id}`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    })

    if (!response.ok) {
      const text = await response.text()
      try { return JSON.parse(text) } catch {
        return { success: false, error: `HTTP ${response.status}: ${text || response.statusText}` }
      }
    }

    return response.json()
  }

  async createBrand(data: CreateBrandData): Promise<ApiResponse<Brand>> {
    const response = await fetch(`${API_URL}/api/brands`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const text = await response.text()
      try { return JSON.parse(text) } catch {
        return { success: false, error: `HTTP ${response.status}: ${text || response.statusText}` }
      }
    }

    return response.json()
  }

  async updateBrand(id: string, updates: UpdateBrandData): Promise<ApiResponse<Brand>> {
    const response = await fetch(`${API_URL}/api/brands/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    })

    if (!response.ok) {
      const text = await response.text()
      try { return JSON.parse(text) } catch {
        return { success: false, error: `HTTP ${response.status}: ${text || response.statusText}` }
      }
    }

    return response.json()
  }

  async deleteBrand(id: string): Promise<ApiResponse> {
    const response = await fetch(`${API_URL}/api/brands/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    })

    if (!response.ok) {
      const text = await response.text()
      try { return JSON.parse(text) } catch {
        return { success: false, error: `HTTP ${response.status}: ${text || response.statusText}` }
      }
    }

    return response.json()
  }

  // --- Assets ---

  async getAssets(brandId: string, options?: { folder?: string; type?: AssetType }): Promise<BrandAsset[]> {
    const params = new URLSearchParams()
    if (options?.folder) params.append('folder', options.folder)
    if (options?.type) params.append('type', options.type)

    const qs = params.toString()
    const url = qs ? `${API_URL}/api/brands/${brandId}/assets?${qs}` : `${API_URL}/api/brands/${brandId}/assets`

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data: ApiResponse<BrandAsset[]> = await response.json()
    return data.data || []
  }

  async uploadAsset(brandId: string, asset: UploadAssetData): Promise<ApiResponse<BrandAsset>> {
    const response = await fetch(`${API_URL}/api/brands/${brandId}/assets`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(asset),
    })

    if (!response.ok) {
      const text = await response.text()
      try { return JSON.parse(text) } catch {
        return { success: false, error: `HTTP ${response.status}: ${text || response.statusText}` }
      }
    }

    return response.json()
  }

  async updateAsset(brandId: string, assetId: string, updates: Partial<Pick<BrandAsset, 'description' | 'alt_text' | 'folder' | 'type'>>): Promise<ApiResponse<BrandAsset>> {
    const response = await fetch(`${API_URL}/api/brands/${brandId}/assets/${assetId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    })

    if (!response.ok) {
      const text = await response.text()
      try { return JSON.parse(text) } catch {
        return { success: false, error: `HTTP ${response.status}: ${text || response.statusText}` }
      }
    }

    return response.json()
  }

  async deleteAsset(brandId: string, assetId: string): Promise<ApiResponse> {
    const response = await fetch(`${API_URL}/api/brands/${brandId}/assets/${assetId}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    })

    if (!response.ok) {
      const text = await response.text()
      try { return JSON.parse(text) } catch {
        return { success: false, error: `HTTP ${response.status}: ${text || response.statusText}` }
      }
    }

    return response.json()
  }

  // --- Social Connections ---

  async getSocialConnections(brandId: string): Promise<ApiResponse<Record<SocialPlatform, SocialConnection[]>>> {
    const response = await fetch(`${API_URL}/api/brands/${brandId}/social/connections`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    })

    if (!response.ok) {
      const text = await response.text()
      try { return JSON.parse(text) } catch {
        return { success: false, error: `HTTP ${response.status}: ${text || response.statusText}` }
      }
    }

    return response.json()
  }

  // --- Posts ---

  async getPosts(brandId: string, status?: PostStatus): Promise<BrandPost[]> {
    const params = new URLSearchParams()
    if (status) params.append('status', status)

    const qs = params.toString()
    const url = qs ? `${API_URL}/api/brands/${brandId}/posts?${qs}` : `${API_URL}/api/brands/${brandId}/posts`

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data: ApiResponse<BrandPost[]> = await response.json()
    return data.data || []
  }

  // --- Conversations ---

  async getMessages(brandId: string, options?: { limit?: number; offset?: number }): Promise<ChatMessage[]> {
    const params = new URLSearchParams()
    if (options?.limit) params.append('limit', String(options.limit))
    if (options?.offset) params.append('offset', String(options.offset))

    const qs = params.toString()
    const url = qs ? `${API_URL}/api/brands/${brandId}/messages?${qs}` : `${API_URL}/api/brands/${brandId}/messages`

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data: ApiResponse<ChatMessage[]> = await response.json()
    return data.data || []
  }

  // --- Legacy compat methods ---

  async uploadLogo(brandId: string, asset: UploadAssetData): Promise<ApiResponse<BrandAsset>> {
    return this.uploadAsset(brandId, { ...asset, type: 'logo' })
  }

  async deleteBrandImage(brandId: string, assetId: string): Promise<ApiResponse> {
    return this.deleteAsset(brandId, assetId)
  }

  async uploadRestaurantImages(brandId: string, assets: UploadAssetData[]): Promise<ApiResponse<BrandAsset>[]> {
    return Promise.all(assets.map(asset => this.uploadAsset(brandId, asset)))
  }

  async deleteRestaurant(brandId: string): Promise<ApiResponse> {
    return this.deleteBrand(brandId)
  }

  async createFolder(_brandId: string, _folderName: string): Promise<ApiResponse> {
    return { success: true }
  }

  async renameFolder(_brandId: string, _oldName: string, _newName: string): Promise<ApiResponse> {
    return { success: true }
  }

  async deleteFolder(_brandId: string, _folderName: string): Promise<ApiResponse> {
    return { success: true }
  }

  async moveImages(_brandId: string, _imageIds: string[], _targetFolder: string): Promise<ApiResponse> {
    return { success: true }
  }
}

export const brandService = new BrandService()

// Legacy type aliases
export type Business = Brand
export type BrandType = string
export type UploadedImage = BrandAsset

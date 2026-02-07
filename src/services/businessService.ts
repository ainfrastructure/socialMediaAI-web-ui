import type { ApiResponse } from './apiBase'
import { API_URL, getAuthHeader, getAuthHeaders } from './apiBase'
import type { UploadedImage } from '@/types/media'

export type BusinessType = 'restaurant' | 'resort' | 'liquor' | 'yacht' | 'general'

export interface Business {
  id: string
  user_id: string
  name: string
  business_type: BusinessType
  description?: string | null
  address?: string | null
  location?: {
    latitude: number
    longitude: number
  } | null
  phone_number?: string | null
  website?: string | null
  social_media?: {
    instagram?: string
    facebook?: string
    twitter?: string
    youtube?: string
    tiktok?: string
  } | null
  brand_dna?: {
    logo_url?: string
    brand_name?: string
    primary_color?: string
    secondary_color?: string
    additional_colors?: string[]
    font_style?: string
  } | null
  uploaded_images?: UploadedImage[] | null
  media_root_id?: string | null
  logo_url?: string | null
  is_default?: boolean
  created_at: string
  updated_at: string
}

export interface CreateBusinessData {
  name: string
  business_type: BusinessType
  description?: string | null
  address?: string | null
  location?: { latitude: number; longitude: number } | null
  phone_number?: string | null
  website?: string | null
  social_media?: any | null
  brand_dna?: any | null
  logo_url?: string | null
  uploaded_images?: UploadedImage[] | null
  is_default?: boolean
}

export interface UpdateBusinessData {
  name?: string
  business_type?: BusinessType
  description?: string | null
  address?: string | null
  location?: { latitude: number; longitude: number } | null
  phone_number?: string | null
  website?: string | null
  social_media?: any | null
  brand_dna?: any | null
  logo_url?: string | null
  uploaded_images?: UploadedImage[] | null
  is_default?: boolean
}

class BusinessService {
  async getBusinesses(limit: number = 100): Promise<Business[]> {
    const params = new URLSearchParams()
    if (limit) params.append('limit', limit.toString())

    const url = params.toString() ? `${API_URL}/api/businesses?${params}` : `${API_URL}/api/businesses`
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    })

    if (!response.ok) {
      const text = await response.text()
      let message = text || response.statusText
      try {
        const parsed = JSON.parse(text)
        message = parsed.error || message
      } catch {
        // ignore parse errors
      }
      throw new Error(`HTTP ${response.status}: ${message}`)
    }

    const data: ApiResponse<Business[]> = await response.json()
    return data.data || []
  }

  async getBusiness(id: string): Promise<ApiResponse<Business>> {
    const response = await fetch(`${API_URL}/api/businesses/${id}`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
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

  async createBusiness(data: CreateBusinessData): Promise<ApiResponse<Business>> {
    const response = await fetch(`${API_URL}/api/businesses`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
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

  async updateBusiness(id: string, updates: UpdateBusinessData): Promise<ApiResponse<Business>> {
    const response = await fetch(`${API_URL}/api/businesses/${id}`, {
      method: 'PATCH',
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

  async deleteBusiness(id: string): Promise<ApiResponse> {
    const response = await fetch(`${API_URL}/api/businesses/${id}`, {
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

  /**
   * Upload images for a business
   */
  async uploadBusinessImages(
    businessId: string,
    files: File[],
    category: string = 'uncategorized'
  ): Promise<{ uploaded: UploadedImage[]; count: number }> {
    if (!businessId || businessId.trim().length === 0) {
      throw new Error('Business ID is required')
    }

    if (!files || files.length === 0) {
      throw new Error('No files provided')
    }

    const formData = new FormData()
    files.forEach((file) => {
      formData.append('images', file)
    })
    formData.append('category', category)

    const response = await fetch(
      `${API_URL}/api/businesses/${encodeURIComponent(businessId)}/images`,
      {
        method: 'POST',
        headers: {
          ...getAuthHeader(),
        },
        body: formData,
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.error || 'Failed to upload images')
    }

    return data.data
  }

  /**
   * Delete a specific uploaded image from a business
   */
  async deleteBusinessImage(businessId: string, imageId: string): Promise<boolean> {
    if (!businessId || businessId.trim().length === 0) {
      throw new Error('Business ID is required')
    }

    if (!imageId || imageId.trim().length === 0) {
      throw new Error('Image ID is required')
    }

    const response = await fetch(
      `${API_URL}/api/businesses/${encodeURIComponent(businessId)}/images/${encodeURIComponent(imageId)}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data.success
  }

  /**
   * Create a folder (virtual)
   */
  async createFolder(businessId: string, folderPath: string): Promise<boolean> {
    if (!businessId || businessId.trim().length === 0) {
      throw new Error('Business ID is required')
    }

    if (!folderPath || folderPath.trim().length === 0) {
      throw new Error('Folder path is required')
    }

    const response = await fetch(
      `${API_URL}/api/businesses/${encodeURIComponent(businessId)}/folders`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({ folderPath }),
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data.success
  }

  /**
   * Rename a folder
   */
  async renameFolder(
    businessId: string,
    oldFolderPath: string,
    newFolderPath: string
  ): Promise<Business | null> {
    if (!businessId || businessId.trim().length === 0) {
      throw new Error('Business ID is required')
    }

    if (!oldFolderPath || !newFolderPath) {
      throw new Error('Old and new folder paths are required')
    }

    const response = await fetch(
      `${API_URL}/api/businesses/${encodeURIComponent(businessId)}/folders`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({ oldFolderPath, newFolderPath }),
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data.success ? data.data : null
  }

  /**
   * Delete a folder and all its images
   */
  async deleteFolder(businessId: string, folderPath: string): Promise<Business | null> {
    if (!businessId || businessId.trim().length === 0) {
      throw new Error('Business ID is required')
    }

    if (!folderPath || folderPath.trim().length === 0) {
      throw new Error('Folder path is required')
    }

    const response = await fetch(
      `${API_URL}/api/businesses/${encodeURIComponent(businessId)}/folders?folderPath=${encodeURIComponent(folderPath)}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data.success ? data.data : null
  }

  /**
   * Move images to a different folder
   */
  async moveImages(
    businessId: string,
    imageIds: string[],
    targetFolderPath: string
  ): Promise<Business | null> {
    if (!businessId || businessId.trim().length === 0) {
      throw new Error('Business ID is required')
    }

    if (!imageIds || imageIds.length === 0) {
      throw new Error('Image IDs are required')
    }

    if (!targetFolderPath) {
      throw new Error('Target folder path is required')
    }

    const response = await fetch(
      `${API_URL}/api/businesses/${encodeURIComponent(businessId)}/images/move`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({ imageIds, targetFolderPath }),
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data.success ? data.data : null
  }
}

export const businessService = new BusinessService()

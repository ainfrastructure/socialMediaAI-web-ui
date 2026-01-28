import { API_URL } from './apiBase'

export interface UploadedImage {
  id: string
  url: string
  storage_path: string
  category?: string
  width: number
  height: number
  format: string
  file_size: number
  uploaded_at: string
}

export interface MenuCategory {
  id: string
  name: string
  display_order: number
}

export interface SavedBusiness {
  id: string
  user_id: string
  place_id: string | null
  is_manual?: boolean
  name: string
  address: string
  location: {
    latitude: number
    longitude: number
  } | null
  phone_number: string | null
  website: string | null
  rating: number | null
  user_ratings_total: number | null
  types: string[] | null
  opening_hours: any | null
  reviews: any[] | null
  competitors: any[] | null
  competitor_analysis: any | null
  menu: any | null
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
  photos: any | null
  uploaded_images: UploadedImage[] | null
  selected_photo_indices: number[] | null
  saved_at: string
  updated_at: string
}

export interface CreateManualBusinessData {
  name: string
  address: string
  phone_number?: string
  website?: string
  location?: {
    latitude: number
    longitude: number
  }
  social_media?: {
    instagram?: string
    facebook?: string
    twitter?: string
    youtube?: string
    tiktok?: string
  }
  brand_dna?: {
    logo_url?: string
    brand_name?: string
    primary_color?: string
    secondary_color?: string
    additional_colors?: string[]
    font_style?: string
  }
  menu?: {
    categories?: MenuCategory[]
  }
}

export interface CategorizedImages {
  [categoryName: string]: UploadedImage[]
}

export interface SaveBusinessData {
  place_id: string
  name: string
  address: string
  location?: { latitude: number; longitude: number } | null
  phone_number?: string | null
  website?: string | null
  rating?: number | null
  user_ratings_total?: number | null
  types?: string[] | null
  opening_hours?: any | null
  reviews?: any[] | null
  competitors?: any[] | null
  competitor_analysis?: any | null
  menu?: any | null
  social_media?: any | null
  photos?: any | null
  selected_photo_indices?: number[] | null
}

export interface SaveBusinessResponse {
  success: boolean
  data?: SavedBusiness
  message?: string
  error?: string
}

export interface GetBusinessesResponse {
  success: boolean
  data?: SavedBusiness[]
  error?: string
}

export interface GetBusinessResponse {
  success: boolean
  data?: SavedBusiness
  error?: string
}

export interface DeleteBusinessResponse {
  success: boolean
  message?: string
  error?: string
}

export interface UpdateBusinessData {
  name?: string
  address?: string
  phone_number?: string | null
  website?: string | null
  opening_hours?: any | null
  social_media?: {
    instagram?: string
    facebook?: string
    twitter?: string
    youtube?: string
    tiktok?: string
  } | null
  brand_dna?: {
    logo_url?: string | null
    brand_name?: string
    primary_color?: string
    secondary_color?: string
    additional_colors?: string[]
    font_style?: string
  } | null
}

export interface UpdateBusinessResponse {
  success: boolean
  data?: SavedBusiness
  message?: string
  error?: string
}

class BusinessService {
  private getAuthHeader(): HeadersInit {
    const token = localStorage.getItem('access_token')
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  /**
   * Save a business with all gathered data
   * @param businessData - The complete business data to save
   * @returns Saved business object or error
   */
  async saveBusiness(businessData: SaveBusinessData): Promise<SaveBusinessResponse> {
    const response = await fetch(`${API_URL}/api/businesses/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
      body: JSON.stringify(businessData),
    })

    const data: SaveBusinessResponse = await response.json()

    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`)
    }

    return data
  }

  /**
   * Get all saved businesses for the authenticated user
   * @param limit - Maximum number of businesses to return (default: 100)
   * @returns Array of saved businesses
   */
  async getSavedBusinesss(limit: number = 100): Promise<SavedBusiness[]> {
    const response = await fetch(
      `${API_URL}/api/businesses?limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeader(),
        },
      }
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data: GetBusinessesResponse = await response.json()

    if (!data.success) {
      throw new Error(data.error || 'Failed to get saved businesses')
    }

    return data.data || []
  }

  /**
   * Get a specific saved business by place_id
   * @param placeId - The Google Place ID
   * @returns Saved business or null if not found
   */
  async getBusinessByPlaceId(placeId: string): Promise<SavedBusiness | null> {
    if (!placeId || placeId.trim().length === 0) {
      return null
    }

    const response = await fetch(
      `${API_URL}/api/businesses/${encodeURIComponent(placeId)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeader(),
        },
      }
    )

    if (response.status === 404) {
      return null
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data: GetBusinessResponse = await response.json()

    if (!data.success || !data.data) {
      return null
    }

    return data.data
  }

  /**
   * Update a saved business's editable fields
   * @param placeId - The Google Place ID
   * @param updateData - The fields to update (website, opening_hours, social_media)
   * @returns Updated business object or error
   */
  async updateBusiness(
    placeId: string,
    updateData: UpdateBusinessData
  ): Promise<UpdateBusinessResponse> {
    if (!placeId || placeId.trim().length === 0) {
      throw new Error('Place ID is required')
    }

    const response = await fetch(
      `${API_URL}/api/businesses/${encodeURIComponent(placeId)}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeader(),
        },
        body: JSON.stringify(updateData),
      }
    )

    const data: UpdateBusinessResponse = await response.json()

    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`)
    }

    return data
  }

  /**
   * Delete a saved business
   * @param placeId - The Google Place ID
   * @returns Success status
   */
  async deleteBusiness(placeId: string): Promise<boolean> {
    if (!placeId || placeId.trim().length === 0) {
      return false
    }

    const response = await fetch(
      `${API_URL}/api/businesses/${encodeURIComponent(placeId)}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeader(),
        },
      }
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data: DeleteBusinessResponse = await response.json()

    return data.success
  }

  /**
   * Check if a business is already saved
   * @param placeId - The Google Place ID
   * @returns True if saved, false otherwise
   */
  async isBusinessSaved(placeId: string): Promise<boolean> {
    try {
      const business = await this.getBusinessByPlaceId(placeId)
      return business !== null
    } catch {
      return false
    }
  }

  /**
   * Create a manual business (without Google Places)
   * @param businessData - The business data
   * @returns Saved business response
   */
  async createManualBusiness(
    businessData: CreateManualBusinessData
  ): Promise<SaveBusinessResponse> {
    const response = await fetch(`${API_URL}/api/businesses/manual`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
      body: JSON.stringify(businessData),
    })

    const data: SaveBusinessResponse = await response.json()

    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`)
    }

    return data
  }

  /**
   * Upload images for a business
   * @param businessId - The business ID (UUID) or Google Place ID
   * @param files - Array of image files to upload
   * @param category - Optional category/folder name for organization
   * @returns Uploaded images data
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

    // Append all files to FormData
    files.forEach((file) => {
      formData.append('images', file)
    })

    // Append category
    formData.append('category', category)

    const response = await fetch(
      `${API_URL}/api/businesses/${encodeURIComponent(businessId)}/images`,
      {
        method: 'POST',
        headers: {
          ...this.getAuthHeader(),
          // Don't set Content-Type for FormData - browser will set it with boundary
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
   * @param placeId - The Google Place ID
   * @param imageId - The image ID or storage_path
   * @returns Success status
   */
  async deleteBusinessImage(placeId: string, imageId: string): Promise<boolean> {
    if (!placeId || placeId.trim().length === 0) {
      throw new Error('Place ID is required')
    }

    if (!imageId || imageId.trim().length === 0) {
      throw new Error('Image ID is required')
    }

    const response = await fetch(
      `${API_URL}/api/businesses/${encodeURIComponent(placeId)}/images/${encodeURIComponent(imageId)}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeader(),
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
   * @param placeId - The Google Place ID
   * @param folderPath - Folder path to create (e.g., "menu/burgers")
   * @returns Success status
   */
  async createFolder(placeId: string, folderPath: string): Promise<boolean> {
    if (!placeId || placeId.trim().length === 0) {
      throw new Error('Place ID is required')
    }

    if (!folderPath || folderPath.trim().length === 0) {
      throw new Error('Folder path is required')
    }

    const response = await fetch(
      `${API_URL}/api/businesses/${encodeURIComponent(placeId)}/folders`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeader(),
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
   * @param placeId - The Google Place ID
   * @param oldFolderPath - Current folder path
   * @param newFolderPath - New folder path
   * @returns Updated business object
   */
  async renameFolder(
    placeId: string,
    oldFolderPath: string,
    newFolderPath: string
  ): Promise<SavedBusiness | null> {
    if (!placeId || placeId.trim().length === 0) {
      throw new Error('Place ID is required')
    }

    if (!oldFolderPath || !newFolderPath) {
      throw new Error('Old and new folder paths are required')
    }

    const response = await fetch(
      `${API_URL}/api/businesses/${encodeURIComponent(placeId)}/folders`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeader(),
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
   * @param placeId - The Google Place ID
   * @param folderPath - Folder path to delete
   * @returns Updated business object
   */
  async deleteFolder(placeId: string, folderPath: string): Promise<SavedBusiness | null> {
    if (!placeId || placeId.trim().length === 0) {
      throw new Error('Place ID is required')
    }

    if (!folderPath || folderPath.trim().length === 0) {
      throw new Error('Folder path is required')
    }

    const response = await fetch(
      `${API_URL}/api/businesses/${encodeURIComponent(placeId)}/folders?folderPath=${encodeURIComponent(folderPath)}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeader(),
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
   * @param placeId - The Google Place ID
   * @param imageIds - Array of image IDs to move
   * @param targetFolderPath - Target folder path
   * @returns Updated business object
   */
  async moveImages(
    placeId: string,
    imageIds: string[],
    targetFolderPath: string
  ): Promise<SavedBusiness | null> {
    if (!placeId || placeId.trim().length === 0) {
      throw new Error('Place ID is required')
    }

    if (!imageIds || imageIds.length === 0) {
      throw new Error('Image IDs are required')
    }

    if (!targetFolderPath) {
      throw new Error('Target folder path is required')
    }

    const response = await fetch(
      `${API_URL}/api/businesses/${encodeURIComponent(placeId)}/images/move`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeader(),
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

  /**
   * Upload a logo for a business
   * @param businessId - The business ID (UUID) or Google Place ID
   * @param file - Logo image file to upload
   * @returns Logo URL from Supabase storage
   */
  async uploadLogo(businessId: string, file: File): Promise<string> {
    if (!businessId || businessId.trim().length === 0) {
      throw new Error('Business ID is required')
    }

    if (!file) {
      throw new Error('Logo file is required')
    }

    console.log('Uploading logo for business:', businessId)
    console.log('Logo file:', file.name, file.size, file.type)

    const formData = new FormData()
    formData.append('images', file)
    formData.append('category', 'logos')

    const response = await fetch(
      `${API_URL}/api/businesses/${encodeURIComponent(businessId)}/images`,
      {
        method: 'POST',
        headers: {
          ...this.getAuthHeader(),
        },
        body: formData,
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Logo upload failed:', errorData)
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log('Logo upload response:', data)

    if (!data.success || !data.data.uploaded || data.data.uploaded.length === 0) {
      console.error('Invalid upload response:', data)
      throw new Error('Failed to upload logo')
    }

    const logoUrl = data.data.uploaded[0].url
    console.log('Logo uploaded successfully:', logoUrl)
    return logoUrl
  }
}

export const businessService = new BusinessService()

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

export interface SavedRestaurant {
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

export interface CreateManualRestaurantData {
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

export interface SaveRestaurantData {
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

export interface SaveRestaurantResponse {
  success: boolean
  data?: SavedRestaurant
  message?: string
  error?: string
}

export interface GetRestaurantsResponse {
  success: boolean
  data?: SavedRestaurant[]
  error?: string
}

export interface GetRestaurantResponse {
  success: boolean
  data?: SavedRestaurant
  error?: string
}

export interface DeleteRestaurantResponse {
  success: boolean
  message?: string
  error?: string
}

export interface UpdateRestaurantData {
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

export interface UpdateRestaurantResponse {
  success: boolean
  data?: SavedRestaurant
  message?: string
  error?: string
}

class RestaurantService {
  private getAuthHeader(): HeadersInit {
    const token = localStorage.getItem('access_token')
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  /**
   * Save a restaurant with all gathered data
   * @param restaurantData - The complete restaurant data to save
   * @returns Saved restaurant object or error
   */
  async saveRestaurant(restaurantData: SaveRestaurantData): Promise<SaveRestaurantResponse> {
    const response = await fetch(`${API_URL}/api/restaurants/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
      body: JSON.stringify(restaurantData),
    })

    const data: SaveRestaurantResponse = await response.json()

    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`)
    }

    return data
  }

  /**
   * Get all saved restaurants for the authenticated user
   * @param limit - Maximum number of restaurants to return (default: 100)
   * @returns Array of saved restaurants
   */
  async getSavedRestaurants(limit: number = 100): Promise<SavedRestaurant[]> {
    const response = await fetch(
      `${API_URL}/api/restaurants?limit=${limit}`,
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

    const data: GetRestaurantsResponse = await response.json()

    if (!data.success) {
      throw new Error(data.error || 'Failed to get saved restaurants')
    }

    return data.data || []
  }

  /**
   * Get a specific saved restaurant by place_id
   * @param placeId - The Google Place ID
   * @returns Saved restaurant or null if not found
   */
  async getRestaurantByPlaceId(placeId: string): Promise<SavedRestaurant | null> {
    if (!placeId || placeId.trim().length === 0) {
      return null
    }

    const response = await fetch(
      `${API_URL}/api/restaurants/${encodeURIComponent(placeId)}`,
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

    const data: GetRestaurantResponse = await response.json()

    if (!data.success || !data.data) {
      return null
    }

    return data.data
  }

  /**
   * Update a saved restaurant's editable fields
   * @param placeId - The Google Place ID
   * @param updateData - The fields to update (website, opening_hours, social_media)
   * @returns Updated restaurant object or error
   */
  async updateRestaurant(
    placeId: string,
    updateData: UpdateRestaurantData
  ): Promise<UpdateRestaurantResponse> {
    if (!placeId || placeId.trim().length === 0) {
      throw new Error('Place ID is required')
    }

    const response = await fetch(
      `${API_URL}/api/restaurants/${encodeURIComponent(placeId)}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeader(),
        },
        body: JSON.stringify(updateData),
      }
    )

    const data: UpdateRestaurantResponse = await response.json()

    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`)
    }

    return data
  }

  /**
   * Delete a saved restaurant
   * @param placeId - The Google Place ID
   * @returns Success status
   */
  async deleteRestaurant(placeId: string): Promise<boolean> {
    if (!placeId || placeId.trim().length === 0) {
      return false
    }

    const response = await fetch(
      `${API_URL}/api/restaurants/${encodeURIComponent(placeId)}`,
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

    const data: DeleteRestaurantResponse = await response.json()

    return data.success
  }

  /**
   * Check if a restaurant is already saved
   * @param placeId - The Google Place ID
   * @returns True if saved, false otherwise
   */
  async isRestaurantSaved(placeId: string): Promise<boolean> {
    try {
      const restaurant = await this.getRestaurantByPlaceId(placeId)
      return restaurant !== null
    } catch {
      return false
    }
  }

  /**
   * Create a manual restaurant (without Google Places)
   * @param restaurantData - The restaurant data
   * @returns Saved restaurant response
   */
  async createManualRestaurant(
    restaurantData: CreateManualRestaurantData
  ): Promise<SaveRestaurantResponse> {
    const response = await fetch(`${API_URL}/api/restaurants/manual`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
      body: JSON.stringify(restaurantData),
    })

    const data: SaveRestaurantResponse = await response.json()

    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`)
    }

    return data
  }

  /**
   * Upload images for a restaurant
   * @param restaurantId - The restaurant ID (UUID) or Google Place ID
   * @param files - Array of image files to upload
   * @param category - Optional category/folder name for organization
   * @returns Uploaded images data
   */
  async uploadRestaurantImages(
    restaurantId: string,
    files: File[],
    category: string = 'uncategorized'
  ): Promise<{ uploaded: UploadedImage[]; count: number }> {
    if (!restaurantId || restaurantId.trim().length === 0) {
      throw new Error('Restaurant ID is required')
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
      `${API_URL}/api/restaurants/${encodeURIComponent(restaurantId)}/images`,
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
   * Delete a specific uploaded image from a restaurant
   * @param placeId - The Google Place ID
   * @param imageId - The image ID or storage_path
   * @returns Success status
   */
  async deleteRestaurantImage(placeId: string, imageId: string): Promise<boolean> {
    if (!placeId || placeId.trim().length === 0) {
      throw new Error('Place ID is required')
    }

    if (!imageId || imageId.trim().length === 0) {
      throw new Error('Image ID is required')
    }

    const response = await fetch(
      `${API_URL}/api/restaurants/${encodeURIComponent(placeId)}/images/${encodeURIComponent(imageId)}`,
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
      `${API_URL}/api/restaurants/${encodeURIComponent(placeId)}/folders`,
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
   * @returns Updated restaurant object
   */
  async renameFolder(
    placeId: string,
    oldFolderPath: string,
    newFolderPath: string
  ): Promise<SavedRestaurant | null> {
    if (!placeId || placeId.trim().length === 0) {
      throw new Error('Place ID is required')
    }

    if (!oldFolderPath || !newFolderPath) {
      throw new Error('Old and new folder paths are required')
    }

    const response = await fetch(
      `${API_URL}/api/restaurants/${encodeURIComponent(placeId)}/folders`,
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
   * @returns Updated restaurant object
   */
  async deleteFolder(placeId: string, folderPath: string): Promise<SavedRestaurant | null> {
    if (!placeId || placeId.trim().length === 0) {
      throw new Error('Place ID is required')
    }

    if (!folderPath || folderPath.trim().length === 0) {
      throw new Error('Folder path is required')
    }

    const response = await fetch(
      `${API_URL}/api/restaurants/${encodeURIComponent(placeId)}/folders?folderPath=${encodeURIComponent(folderPath)}`,
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
   * @returns Updated restaurant object
   */
  async moveImages(
    placeId: string,
    imageIds: string[],
    targetFolderPath: string
  ): Promise<SavedRestaurant | null> {
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
      `${API_URL}/api/restaurants/${encodeURIComponent(placeId)}/images/move`,
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
   * Upload a logo for a restaurant
   * @param restaurantId - The restaurant ID (UUID) or Google Place ID
   * @param file - Logo image file to upload
   * @returns Logo URL from Supabase storage
   */
  async uploadLogo(restaurantId: string, file: File): Promise<string> {
    if (!restaurantId || restaurantId.trim().length === 0) {
      throw new Error('Restaurant ID is required')
    }

    if (!file) {
      throw new Error('Logo file is required')
    }

    console.log('Uploading logo for restaurant:', restaurantId)
    console.log('Logo file:', file.name, file.size, file.type)

    const formData = new FormData()
    formData.append('images', file)
    formData.append('category', 'logos')

    const response = await fetch(
      `${API_URL}/api/restaurants/${encodeURIComponent(restaurantId)}/images`,
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

export const restaurantService = new RestaurantService()

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export interface UploadedImage {
  id: string
  url: string
  storage_path: string
  width: number
  height: number
  format: string
  file_size: number
  uploaded_at: string
}

export interface SavedRestaurant {
  id: string
  user_id: string
  place_id: string
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
  social_media: any | null
  brand_dna: any | null
  photos: any | null
  uploaded_images: UploadedImage[] | null
  selected_photo_indices: number[] | null
  saved_at: string
  updated_at: string
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
  website?: string | null
  opening_hours?: any | null
  social_media?: any | null
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
    try {
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
    } catch (error) {

      throw error
    }
  }

  /**
   * Get all saved restaurants for the authenticated user
   * @param limit - Maximum number of restaurants to return (default: 100)
   * @returns Array of saved restaurants
   */
  async getSavedRestaurants(limit: number = 100): Promise<SavedRestaurant[]> {
    try {
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
    } catch (error) {

      throw error
    }
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

    try {
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
    } catch (error) {

      throw error
    }
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

    try {
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
    } catch (error) {

      throw error
    }
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

    try {
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
    } catch (error) {

      throw error
    }
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
    } catch (error) {

      return false
    }
  }

  /**
   * Upload images for a restaurant
   * @param placeId - The Google Place ID
   * @param files - Array of image files to upload
   * @returns Uploaded images data
   */
  async uploadRestaurantImages(
    placeId: string,
    files: File[]
  ): Promise<{ uploaded: UploadedImage[]; count: number }> {
    if (!placeId || placeId.trim().length === 0) {
      throw new Error('Place ID is required')
    }

    if (!files || files.length === 0) {
      throw new Error('No files provided')
    }

    try {
      const formData = new FormData()

      // Append all files to FormData
      files.forEach((file) => {
        formData.append('images', file)
      })

      const response = await fetch(
        `${API_URL}/api/restaurants/${encodeURIComponent(placeId)}/images`,
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
        const error = await response.json()
        throw new Error(error.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to upload images')
      }

      return data.data
    } catch (error) {

      throw error
    }
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

    try {
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
        const error = await response.json()
        throw new Error(error.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      return data.success
    } catch (error) {

      throw error
    }
  }
}

export const restaurantService = new RestaurantService()

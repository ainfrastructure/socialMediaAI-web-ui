const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export interface RestaurantSuggestion {
  place_id: string
  name: string
  address: string
  types?: string[]
}

export interface SearchRestaurantsResponse {
  success: boolean
  data: {
    suggestions: RestaurantSuggestion[]
  }
  error?: string
}

export interface OpeningHours {
  open_now?: boolean
  periods?: Array<{
    open: { day: number; time: string }
    close?: { day: number; time: string }
  }>
  weekday_text?: string[]
}

export interface Review {
  author_name: string
  rating: number
  text: string
  time: number
  relative_time_description: string
  profile_photo_url?: string
}

export interface PlaceDetails {
  place_id: string
  name: string
  address: string
  phone_number?: string
  website?: string
  rating?: number
  user_ratings_total?: number
  opening_hours?: OpeningHours
  reviews?: Review[]
  types?: string[]
}

export interface PlaceDetailsResponse {
  success: boolean
  data?: PlaceDetails
  error?: string
}

class PlacesService {
  /**
   * Search for restaurants using the backend API
   * @param query - The search query text (e.g., "pizza", "italian restaurant oslo")
   * @returns Array of restaurant suggestions
   */
  async searchRestaurants(query: string): Promise<RestaurantSuggestion[]> {
    if (!query || query.trim().length === 0) {
      return []
    }

    try {
      const response = await fetch(
        `${API_URL}/api/places/search?query=${encodeURIComponent(query)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: SearchRestaurantsResponse = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to search restaurants')
      }

      return data.data.suggestions
    } catch (error) {
      console.error('Error searching restaurants:', error)
      throw error
    }
  }

  /**
   * Get detailed information about a place including opening hours
   * @param placeId - The Google Place ID
   * @returns Detailed place information
   */
  async getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
    if (!placeId || placeId.trim().length === 0) {
      return null
    }

    try {
      const response = await fetch(
        `${API_URL}/api/places/${encodeURIComponent(placeId)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: PlaceDetailsResponse = await response.json()

      if (!data.success || !data.data) {
        throw new Error(data.error || 'Failed to get place details')
      }

      return data.data
    } catch (error) {
      console.error('Error getting place details:', error)
      throw error
    }
  }
}

export const placesService = new PlacesService()

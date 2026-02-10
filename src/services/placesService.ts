import { API_URL } from './apiBase'

export interface PlaceSuggestion {
  place_id: string
  name: string
  address: string
  types?: string[]
}

/** @deprecated Use PlaceSuggestion instead */
export type RestaurantSuggestion = PlaceSuggestion

export interface SearchPlacesResponse {
  success: boolean
  data: {
    suggestions: PlaceSuggestion[]
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

export interface Location {
  latitude: number
  longitude: number
}

export interface PlacePhoto {
  name: string // Photo resource name from Google Places API
  widthPx: number
  heightPx: number
  authorAttributions?: Array<{
    displayName: string
    uri?: string
    photoUri?: string
  }>
}

export interface PlaceDetails {
  place_id: string
  name: string
  address: string
  formatted_address?: string
  vicinity?: string
  address_components?: Array<{
    long_name: string
    short_name: string
    types: string[]
  }>
  location?: Location
  phone_number?: string
  website?: string
  rating?: number
  user_ratings_total?: number
  opening_hours?: OpeningHours
  reviews?: Review[]
  types?: string[]
  photos?: PlacePhoto[]
  photoUrls?: string[] // Generated URLs for easy access
}

export interface PlaceDetailsResponse {
  success: boolean
  data?: PlaceDetails
  error?: string
}

export interface Competitor {
  place_id: string
  name: string
  address: string
  location: Location
  rating?: number
  user_ratings_total?: number
  types?: string[]
  distance: number
  photos?: PlacePhoto[]
  photoUrls?: string[]
}

export interface CompetitorSearchResponse {
  competitors: Competitor[]
  searchCenter: {
    name: string
    location: Location
  }
  radiusKm: number
  totalFound: number
}

export interface CompetitorApiResponse {
  success: boolean
  data?: CompetitorSearchResponse
  error?: string
}

class PlacesService {
  /**
   * Search for places/businesses using the backend API
   * @param query - The search query text (e.g., "pizza", "italian restaurant oslo")
   * @returns Array of place suggestions
   */
  async searchPlaces(query: string): Promise<PlaceSuggestion[]> {
    if (!query || query.trim().length === 0) {
      return []
    }

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

    const data: SearchPlacesResponse = await response.json()

    if (!data.success) {
      throw new Error(data.error || 'Failed to search places')
    }

    return data.data.suggestions
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
  }

  /**
   * Find competitor businesses within a radius of a given place
   * @param placeId - The Google Place ID of the business
   * @param radiusKm - Search radius in kilometers (default: 1)
   * @returns List of competitor businesses sorted by distance
   */
  async findCompetitors(
    placeId: string,
    radiusKm: number = 1
  ): Promise<CompetitorSearchResponse | null> {
    if (!placeId || placeId.trim().length === 0) {
      return null
    }

    const response = await fetch(
      `${API_URL}/api/places/${encodeURIComponent(placeId)}/competitors?radius=${radiusKm}`,
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

    const data: CompetitorApiResponse = await response.json()

    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to find competitors')
    }

    return data.data
  }
}

export const placesService = new PlacesService()

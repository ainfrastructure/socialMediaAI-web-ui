const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export interface SocialMediaLinks {
  facebook?: string
  instagram?: string
  twitter?: string
  youtube?: string
  tiktok?: string
}

export interface SocialMediaSearchResult {
  restaurantName: string
  restaurantAddress: string
  socialMedia: SocialMediaLinks
  searchDetails: {
    facebookSearched: boolean
    instagramSearched: boolean
    twitterSearched: boolean
    youtubeSearched: boolean
    tiktokSearched: boolean
    totalFound: number
  }
}

export interface SocialMediaApiResponse {
  success: boolean
  data?: SocialMediaSearchResult
  error?: string
}

class SocialMediaService {
  /**
   * Find social media profiles for a restaurant by Place ID
   * @param placeId - The Google Place ID
   * @returns Social media links found
   */
  async getSocialMediaByPlaceId(placeId: string): Promise<SocialMediaSearchResult | null> {
    if (!placeId || placeId.trim().length === 0) {
      return null
    }

    try {
      const response = await fetch(
        `${API_URL}/api/social-media/search/${encodeURIComponent(placeId)}`,
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

      const data: SocialMediaApiResponse = await response.json()

      if (!data.success || !data.data) {
        throw new Error(data.error || 'Failed to get social media profiles')
      }

      return data.data
    } catch (error) {
      console.error('Error getting social media profiles:', error)
      throw error
    }
  }

  /**
   * Find social media profiles by restaurant name and address
   * @param name - Restaurant name
   * @param address - Restaurant address (optional)
   * @returns Social media links found
   */
  async getSocialMediaByName(
    name: string,
    address?: string
  ): Promise<SocialMediaSearchResult | null> {
    if (!name || name.trim().length === 0) {
      return null
    }

    try {
      const params = new URLSearchParams({ name })
      if (address) {
        params.append('address', address)
      }

      const response = await fetch(
        `${API_URL}/api/social-media/search?${params.toString()}`,
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

      const data: SocialMediaApiResponse = await response.json()

      if (!data.success || !data.data) {
        throw new Error(data.error || 'Failed to get social media profiles')
      }

      return data.data
    } catch (error) {
      console.error('Error getting social media profiles:', error)
      throw error
    }
  }
}

export const socialMediaService = new SocialMediaService()

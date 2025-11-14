const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export interface MenuItem {
  name: string
  description: string
  price: string
  imageUrl?: string
}

export interface MenuData {
  restaurantName: string
  platform: 'wolt' | 'foodora' | 'unknown'
  url: string
  items: MenuItem[]
}

export interface MenuResponse {
  success: boolean
  data?: MenuData
  error?: string
  message?: string
}

class MenuService {
  /**
   * Get restaurant menu from Wolt or Foodora
   * @param placeId - The Google Place ID (recommended for accurate results with address)
   * @param restaurantName - The name of the restaurant (fallback option)
   * @returns Menu data with items
   */
  async getRestaurantMenu(placeId?: string, restaurantName?: string): Promise<MenuData | null> {
    // Validate that at least one parameter is provided
    if ((!placeId || placeId.trim().length === 0) && (!restaurantName || restaurantName.trim().length === 0)) {
      return null
    }

    try {
      // Build query params - prefer placeId for better accuracy
      const params = new URLSearchParams()
      if (placeId && placeId.trim().length > 0) {
        params.append('placeId', placeId)
      } else if (restaurantName && restaurantName.trim().length > 0) {
        params.append('restaurantName', restaurantName)
      }

      const response = await fetch(
        `${API_URL}/api/menu/search?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      const data: MenuResponse = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || data.message || 'Failed to get menu')
      }

      return data.data || null
    } catch (error) {
      console.error('Error getting restaurant menu:', error)
      throw error
    }
  }
}

export const menuService = new MenuService()

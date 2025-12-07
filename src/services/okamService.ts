const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export interface OkamProduct {
  id: string
  name: string
  description: string
  amount: number
  currency: string
  imageUrl?: string
}

export interface OkamCategory {
  id: string
  name: string
  sortOrder: number
  products: OkamProduct[]
}

export interface OkamMenuData {
  storeId: number
  storeName: string
  logoUrl?: string
  categories: OkamCategory[]
  generatedAt: string
}

export interface OkamMenuResponse {
  success: boolean
  hasOkamStore: boolean
  data?: OkamMenuData
  error?: string
  message?: string
}

export interface OkamCheckResponse {
  success: boolean
  hasOkamStore: boolean
  storeInfo?: {
    storeId: number
    storeName: string
  }
}

class OkamService {
  /**
   * Get Okam menu by Google Place ID
   * @param placeId - The Google Place ID
   * @returns Okam menu data or null if not available
   */
  async getMenuByPlaceId(placeId: string): Promise<OkamMenuData | null> {
    if (!placeId || placeId.trim().length === 0) {
      return null
    }

    try {
      const response = await fetch(
        `${API_URL}/api/okam/menu/${encodeURIComponent(placeId)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      const data: OkamMenuResponse = await response.json()

      // 404 means no Okam store for this place - not an error
      if (response.status === 404 || !data.hasOkamStore) {
        return null
      }

      if (!response.ok || !data.success) {
        console.error('[OKAM] Error fetching menu:', data.error || data.message)
        return null
      }

      return data.data || null
    } catch (error) {
      console.error('[OKAM] Error fetching menu:', error)
      return null
    }
  }

  /**
   * Check if a place has an Okam store mapping
   * @param placeId - The Google Place ID
   * @returns Boolean indicating if Okam store exists
   */
  async hasOkamStore(placeId: string): Promise<boolean> {
    if (!placeId || placeId.trim().length === 0) {
      return false
    }

    try {
      const response = await fetch(
        `${API_URL}/api/okam/check/${encodeURIComponent(placeId)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      const data: OkamCheckResponse = await response.json()

      return data.success && data.hasOkamStore
    } catch (error) {
      console.error('[OKAM] Error checking store:', error)
      return false
    }
  }

  /**
   * Convert Okam menu data to the format expected by MenuSection component
   * This allows reusing the existing MenuSection component with Okam data
   */
  convertToMenuItems(okamData: OkamMenuData): {
    name: string
    description: string
    price: string
    imageUrl?: string
  }[] {
    const items: { name: string; description: string; price: string; imageUrl?: string }[] = []

    for (const category of okamData.categories) {
      for (const product of category.products) {
        items.push({
          name: product.name,
          description: product.description || '',
          price: this.formatPrice(product.amount, product.currency),
          imageUrl: this.proxyImageUrl(product.imageUrl),
        })
      }
    }

    return items
  }

  /**
   * Format price from cents to display format
   */
  private formatPrice(amount: number, currency: string): string {
    // Amount is in cents (øre), convert to main currency unit
    const mainAmount = amount / 100
    const currencySymbol = currency === 'NOK' ? 'kr' : currency

    // Format with 2 decimal places if needed
    if (amount % 100 === 0) {
      return `${mainAmount} ${currencySymbol}`
    }
    return `${mainAmount.toFixed(2)} ${currencySymbol}`
  }

  /**
   * Proxy an Okam CDN URL through our backend to avoid CORS issues
   * Only proxies URLs from known Okam CDN domains
   * @param url - The original Okam CDN URL
   * @returns Proxied URL that goes through our backend
   */
  proxyImageUrl(url: string | undefined): string | undefined {
    if (!url) return undefined

    // Only proxy Okam CDN URLs
    if (url.includes('okamapicdn.azureedge.net') || url.includes('okamapi.blob.core.windows.net')) {
      return `${API_URL}/api/okam/proxy-image?url=${encodeURIComponent(url)}`
    }

    // Return other URLs as-is
    return url
  }
}

export const okamService = new OkamService()

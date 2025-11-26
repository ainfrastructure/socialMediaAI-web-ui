/**
 * Wolt API Service
 * Handles OAuth authentication and menu management with Wolt API
 * Integrates with backend for secure token storage
 */

import { useAuthStore } from '@/stores/auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const WOLT_CONFIG = {
  venueId: import.meta.env.VITE_WOLT_VENUE_ID,
  clientId: import.meta.env.VITE_WOLT_CLIENT_ID,
  authUrl: import.meta.env.VITE_WOLT_AUTH_URL || 'https://developer.wolt.com',
  apiUrl: import.meta.env.VITE_WOLT_API_URL || 'https://pos-integration-service.woltapi.com',
  // Use configured redirect URI from environment variable
  redirectUri: import.meta.env.VITE_WOLT_REDIRECT_URI || `${window.location.origin}/wolt-callback`,
  backendApiUrl: `${API_BASE_URL}/api/wolt`
}

export interface WoltTokens {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
}

export interface WoltMenuItem {
  id: string
  name: string
  description?: string
  price: {
    amount: number
    currency: string
  }
  image_url?: string
  category?: string
  available: boolean
}

export interface WoltMenu {
  venue_id: string
  items: WoltMenuItem[]
  categories: Array<{
    id: string
    name: string
    items: string[] // item IDs
  }>
}

class WoltService {
  private venueId: string | null = null
  private venueName: string | null = null

  /**
   * Get auth token from Supabase
   */
  private getAuthToken(): string {
    const authStore = useAuthStore()
    const token = authStore.accessToken

    console.log('🔍 Auth check:', {
      hasStore: !!authStore,
      hasToken: !!token,
      isAuthenticated: authStore.isAuthenticated,
      token: token ? token.substring(0, 20) + '...' : 'null'
    })

    if (!token) {
      // Try to get from localStorage as fallback
      const localToken = localStorage.getItem('access_token')
      if (localToken) {
        console.log('✅ Found token in localStorage')
        return localToken
      }
      throw new Error('Not authenticated. Please log in first.')
    }
    return token
  }

  /**
   * Initialize OAuth flow - redirect directly to Wolt (ORIGINAL WORKING APPROACH)
   */
  initiateOAuth(): void {
    // Generate random state for CSRF protection
    const state = this.generateRandomState()
    localStorage.setItem('wolt_oauth_state', state)

    // Build Wolt Developer Portal authorization URL
    // Use /integrate endpoint which is for browser-based OAuth flows
    const authUrl = new URL(`${WOLT_CONFIG.authUrl}/integrate`)

    authUrl.searchParams.set('client_id', WOLT_CONFIG.clientId)
    authUrl.searchParams.set('redirect_url', WOLT_CONFIG.redirectUri) // Developer Portal uses 'redirect_url'
    authUrl.searchParams.set('state', state)

    console.log('🔐 Initiating Wolt OAuth via Developer Portal')
    console.log('  - Auth URL:', WOLT_CONFIG.authUrl + '/integrate')
    console.log('  - Redirect URL:', WOLT_CONFIG.redirectUri)
    console.log('  - State:', state)
    console.log('  - Full URL:', authUrl.toString())

    // Redirect to Wolt
    window.location.href = authUrl.toString()
  }

  /**
   * Generate random state string
   */
  private generateRandomState(): string {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }

  /**
   * Check connection status
   * The backend handles OAuth callback automatically and stores tokens securely
   */
  async checkConnectionStatus(): Promise<{ connected: boolean; venueCount: number }> {
    try {
      const token = this.getAuthToken()

      const response = await fetch(`${WOLT_CONFIG.backendApiUrl}/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to check connection status')
      }

      const data = await response.json()
      return {
        connected: data.connected,
        venueCount: data.venueCount
      }

    } catch (error: any) {
      console.error('Failed to check Wolt connection status:', error)
      return { connected: false, venueCount: 0 }
    }
  }

  /**
   * Get connected venues
   */
  async getConnectedVenues(): Promise<Array<{ id: string; venueId: string; venueName: string | null }>> {
    try {
      const token = this.getAuthToken()

      const response = await fetch(`${WOLT_CONFIG.backendApiUrl}/venues`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch connected venues')
      }

      const data = await response.json()
      return data.venues || []

    } catch (error: any) {
      console.error('Failed to fetch connected venues:', error)
      return []
    }
  }

  /**
   * Disconnect a venue
   */
  async disconnectVenue(venueId: string): Promise<void> {
    try {
      const token = this.getAuthToken()

      const response = await fetch(`${WOLT_CONFIG.backendApiUrl}/venues/${venueId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to disconnect venue')
      }

      // Clear cached venue info if it was the disconnected one
      if (this.venueId === venueId) {
        this.venueId = null
        this.venueName = null
      }

    } catch (error: any) {
      console.error('Failed to disconnect venue:', error)
      throw error
    }
  }

  /**
   * Get menu from Wolt API for a specific venue
   */
  async getMenu(venueId?: string): Promise<WoltMenu> {
    try {
      const token = this.getAuthToken()

      // If no venueId provided, get the first connected venue
      let targetVenueId = venueId
      if (!targetVenueId) {
        targetVenueId = await this.getVenueId()
        if (!targetVenueId) {
          throw new Error('No Wolt venue connected. Please connect a venue first.')
        }
      }

      console.log('📋 Fetching menu for venue:', targetVenueId)

      const response = await fetch(`${WOLT_CONFIG.backendApiUrl}/menu/${targetVenueId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to fetch menu')
      }

      const data = await response.json()
      console.log('✅ Menu fetched:', data.menu)

      return data.menu

    } catch (error: any) {
      console.error('❌ Failed to fetch menu:', error)
      throw error
    }
  }

  /**
   * Check if user is authenticated with Wolt
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const status = await this.checkConnectionStatus()
      return status.connected
    } catch {
      return false
    }
  }

  /**
   * Get current venue ID (from first connected venue)
   */
  async getVenueId(): Promise<string | null> {
    if (this.venueId) {
      return this.venueId
    }

    const venues = await this.getConnectedVenues()
    if (venues.length > 0) {
      this.venueId = venues[0].venueId
      this.venueName = venues[0].venueName
      return this.venueId
    }

    return null
  }

  /**
   * Logout - disconnect all venues
   */
  async logout(): Promise<void> {
    try {
      const venues = await this.getConnectedVenues()
      for (const venue of venues) {
        await this.disconnectVenue(venue.venueId)
      }

      // Clear cached data
      this.venueId = null
      this.venueName = null
      localStorage.removeItem('wolt_oauth_state')

    } catch (error: any) {
      console.error('Failed to logout from Wolt:', error)
      throw error
    }
  }
}

export const woltService = new WoltService()

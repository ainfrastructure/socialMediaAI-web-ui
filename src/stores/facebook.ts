import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../services/api'

export interface FacebookPage {
  id: string
  pageId: string
  pageName: string
  connectedAt: string
}

export const useFacebookStore = defineStore('facebook', () => {
  const connectedPages = ref<FacebookPage[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Initialize Facebook OAuth flow with redirect (no popup)
   */
  async function connectFacebook(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      console.log('[Facebook Store] Initiating Facebook auth...')

      // Step 1: Get authorization URL from backend
      const initResponse = await api.initFacebookAuth()

      console.log('[Facebook Store] Init response:', {
        success: initResponse.success,
        hasData: !!initResponse.data,
        error: initResponse.error,
        fullResponse: initResponse
      })

      if (!initResponse.success) {
        const errorMsg = initResponse.error || 'Failed to initialize Facebook authentication'
        console.error('[Facebook Store] Backend returned error:', errorMsg)
        throw new Error(errorMsg)
      }

      if (!initResponse.data) {
        console.error('[Facebook Store] No data in response:', initResponse)
        throw new Error('No data received from server')
      }

      const { authUrl, state } = initResponse.data
      console.log('[Facebook Store] Got auth URL and state:', {
        authUrl: authUrl.substring(0, 50) + '...',
        stateLength: state.length
      })

      // Step 2: Store state in localStorage for verification after redirect
      localStorage.setItem('facebook_oauth_state', state)
      console.log('[Facebook Store] Stored state in localStorage')

      // Step 3: Redirect to Facebook (instead of opening popup)
      console.log('[Facebook Store] Redirecting to Facebook...')
      window.location.href = authUrl
    } catch (err: any) {
      console.error('[Facebook Store] Facebook connection error:', err)
      console.error('[Facebook Store] Error details:', {
        message: err.message,
        stack: err.stack,
        error: err
      })
      error.value = err.message || 'Failed to connect Facebook account'
      loading.value = false
      throw err
    }
    // Note: loading.value stays true because we're redirecting away
  }

  /**
   * Load user's connected Facebook pages
   */
  async function loadConnectedPages(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const response = await api.getFacebookPages()

      if (!response.success) {
        throw new Error(response.error || 'Failed to load connected pages')
      }

      connectedPages.value = response.data?.pages || []
    } catch (err: any) {
      console.error('Load pages error:', err)
      error.value = err.message || 'Failed to load connected pages'
    } finally {
      loading.value = false
    }
  }

  /**
   * Disconnect a Facebook page
   */
  async function disconnectPage(pageId: string): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const response = await api.disconnectFacebookPage(pageId)

      if (!response.success) {
        throw new Error(response.error || 'Failed to disconnect page')
      }

      // Remove from local state
      connectedPages.value = connectedPages.value.filter((page) => page.pageId !== pageId)
    } catch (err: any) {
      console.error('Disconnect page error:', err)
      error.value = err.message || 'Failed to disconnect page'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Complete Facebook OAuth callback after redirect
   * Called by the callback page/component
   */
  async function handleOAuthCallback(code: string, state: string): Promise<void> {
    loading.value = true
    error.value = null

    try {
      // Verify state matches what we stored
      const storedState = localStorage.getItem('facebook_oauth_state')
      if (state !== storedState) {
        throw new Error('Invalid state parameter - possible CSRF attack')
      }

      // Clear stored state
      localStorage.removeItem('facebook_oauth_state')

      // Send code to backend to complete OAuth
      const callbackResponse = await api.completeFacebookAuth(code, state)

      if (!callbackResponse.success) {
        throw new Error(callbackResponse.error || 'Failed to complete Facebook authentication')
      }

      // Update connected pages
      connectedPages.value = callbackResponse.data?.pages || []
      error.value = null
    } catch (err: any) {
      console.error('Facebook callback error:', err)
      error.value = err.message || 'Failed to complete Facebook authentication'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    connectedPages,
    loading,
    error,
    connectFacebook,
    handleOAuthCallback,
    loadConnectedPages,
    disconnectPage,
  }
})

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

      // Step 1: Get authorization URL from backend
      const initResponse = await api.initFacebookAuth()

      if (!initResponse.success) {
        const errorMsg = initResponse.error || 'Failed to initialize Facebook authentication'

        throw new Error(errorMsg)
      }

      if (!initResponse.data) {

        throw new Error('No data received from server')
      }

      const { authUrl, state } = initResponse.data

      // Step 2: Store state in localStorage for verification after redirect
      localStorage.setItem('facebook_oauth_state', state)

      // Step 3: Redirect to Facebook (instead of opening popup)

      window.location.href = authUrl
    } catch (err: any) {

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

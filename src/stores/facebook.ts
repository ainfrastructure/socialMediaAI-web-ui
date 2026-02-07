import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '../services/api'
import { usePreferencesStore } from '@/stores/preferences'
import { debugLog } from '@/utils/debug'

export interface FacebookPage {
  id: string
  pageId: string
  pageName: string
  profilePictureUrl?: string
  connectedAt: string
}

export const useFacebookStore = defineStore('facebook', () => {
  const connectedPagesByBusiness = ref<Record<string, FacebookPage[]>>({})
  const loadingConnections = ref(false)
  const connecting = ref(false)
  const error = ref<string | null>(null)
  const preferencesStore = usePreferencesStore()

  // Computed property to check if any pages are connected
  const connectedPages = computed(() => {
    const businessId = preferencesStore.selectedBusinessId
    return businessId ? connectedPagesByBusiness.value[businessId] || [] : []
  })

  const isConnected = computed(() => connectedPages.value.length > 0)

  /**
   * Initialize Facebook OAuth flow with redirect (no popup)
   * @param returnUrl - Optional URL to return to after OAuth completes
   */
  async function connectFacebook(returnUrl?: string, businessId?: string): Promise<void> {
    connecting.value = true
    error.value = null

    try {
      const resolvedBusinessId = businessId || preferencesStore.selectedBusinessId || undefined
      if (!resolvedBusinessId) {
        throw new Error('Please select a business before connecting Facebook')
      }

      // Step 1: Get authorization URL from backend
      const initResponse = await api.initFacebookAuth(resolvedBusinessId)

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

      // Step 2b: Store return URL if provided
      if (returnUrl) {
        debugLog('[FacebookStore] Storing return URL:', returnUrl)
        localStorage.setItem('oauth_return_url', returnUrl)
      } else {
        localStorage.removeItem('oauth_return_url')
      }

      // Step 3: Redirect to Facebook (instead of opening popup)

      window.location.href = authUrl
    } catch (err: any) {

      error.value = err.message || 'Failed to connect Facebook account'
      loadingConnections.value = false
      throw err
    }
    // Note: connecting stays true because we're redirecting away
  }

  /**
   * Load user's connected Facebook pages
   */
  async function loadConnectedPages(businessId?: string): Promise<void> {
    loadingConnections.value = true
    error.value = null

    try {
      const resolvedBusinessId = businessId || preferencesStore.selectedBusinessId || undefined
      const response = await api.getFacebookPages(resolvedBusinessId)

      if (!response.success) {
        throw new Error(response.error || 'Failed to load connected pages')
      }

      if (resolvedBusinessId) {
        connectedPagesByBusiness.value = {
          ...connectedPagesByBusiness.value,
          [resolvedBusinessId]: response.data?.pages || []
        }
      }
    } catch (err: any) {

      error.value = err.message || 'Failed to load connected pages'
    } finally {
      loadingConnections.value = false
    }
  }

  /**
   * Disconnect a Facebook page
   */
  async function disconnectPage(pageId: string, businessId?: string): Promise<void> {
    connecting.value = true
    error.value = null

    try {
      const resolvedBusinessId = businessId || preferencesStore.selectedBusinessId || undefined
      const response = await api.disconnectFacebookPage(pageId, resolvedBusinessId)

      if (!response.success) {
        throw new Error(response.error || 'Failed to disconnect page')
      }

      // Remove from local state
      if (resolvedBusinessId) {
        const current = connectedPagesByBusiness.value[resolvedBusinessId] || []
        connectedPagesByBusiness.value = {
          ...connectedPagesByBusiness.value,
          [resolvedBusinessId]: current.filter((page) => page.pageId !== pageId)
        }
      }
    } catch (err: any) {

      error.value = err.message || 'Failed to disconnect page'
      throw err
    } finally {
      loadingConnections.value = false
    }
  }

  /**
   * Complete Facebook OAuth callback after redirect
   * Called by the callback page/component
   */
  async function handleOAuthCallback(code: string, state: string): Promise<void> {
    connecting.value = true
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

      // Update connected pages for current business
      const businessId = preferencesStore.selectedBusinessId
      if (businessId) {
        connectedPagesByBusiness.value = {
          ...connectedPagesByBusiness.value,
          [businessId]: callbackResponse.data?.pages || []
        }
      }
      error.value = null
    } catch (err: any) {

      error.value = err.message || 'Failed to complete Facebook authentication'
      throw err
    } finally {
      loadingConnections.value = false
    }
  }


  function ensureBusinessCache(businessId: string): void {
    if (!connectedPagesByBusiness.value[businessId]) {
      connectedPagesByBusiness.value = {
        ...connectedPagesByBusiness.value,
        [businessId]: []
      }
    }
  }

  function resetConnectionState(): void {
    connecting.value = false
    error.value = null
  }
  return {
    connectedPages,
    connectedPagesByBusiness,
    isConnected,
    loadingConnections,
    connecting,
    error,
    ensureBusinessCache,
    resetConnectionState,
    connectFacebook,
    handleOAuthCallback,
    loadConnectedPages,
    disconnectPage,
  }
})

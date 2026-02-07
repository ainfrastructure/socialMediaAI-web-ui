import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '../services/api'
import { usePreferencesStore } from '@/stores/preferences'
import { debugLog } from '@/utils/debug'

export interface LinkedInPage {
  id: string
  organizationId: string
  pageName: string
  profilePictureUrl?: string
  connectedAt: string
}

export const useLinkedInStore = defineStore('linkedin', () => {
  const connectedPages = ref<LinkedInPage[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const preferencesStore = usePreferencesStore()

  const isConnected = computed(() => connectedPages.value.length > 0)

  /**
   * Initialize LinkedIn OAuth flow with redirect
   * @param returnUrl - Optional URL to return to after OAuth completes
   */
  async function connectLinkedIn(returnUrl?: string, businessId?: string): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const resolvedBusinessId = businessId || preferencesStore.selectedBusinessId || undefined
      if (!resolvedBusinessId) {
        throw new Error('Please select a business before connecting LinkedIn')
      }
      // Step 1: Get authorization URL from backend
      const initResponse = await api.initLinkedInAuth(resolvedBusinessId)

      if (!initResponse.success) {
        const errorMsg = initResponse.error || 'Failed to initialize LinkedIn authentication'
        throw new Error(errorMsg)
      }

      if (!initResponse.data) {
        throw new Error('No data received from server')
      }

      const { authUrl, state } = initResponse.data

      // Step 2: Store state in localStorage for verification after redirect
      localStorage.setItem('linkedin_oauth_state', state)

      // Step 2b: Store return URL if provided
      if (returnUrl) {
        debugLog('[LinkedInStore] Storing return URL:', returnUrl)
        localStorage.setItem('oauth_return_url', returnUrl)
      } else {
        localStorage.removeItem('oauth_return_url')
      }

      // Step 3: Redirect to LinkedIn OAuth
      window.location.href = authUrl
    } catch (err: any) {
      error.value = err.message || 'Failed to connect LinkedIn account'
      loading.value = false
      throw err
    }
    // Note: loading.value stays true because we're redirecting away
  }

  /**
   * Load user's connected LinkedIn pages
   */
  async function loadConnectedPages(businessId?: string): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const resolvedBusinessId = businessId || preferencesStore.selectedBusinessId || undefined
      const response = await api.getLinkedInPages(resolvedBusinessId)

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
   * Disconnect a LinkedIn page
   */
  async function disconnectPage(pageId: string, businessId?: string): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const resolvedBusinessId = businessId || preferencesStore.selectedBusinessId || undefined
      const response = await api.disconnectLinkedInPage(pageId, resolvedBusinessId)

      if (!response.success) {
        throw new Error(response.error || 'Failed to disconnect page')
      }

      // Remove from local state
      connectedPages.value = connectedPages.value.filter(
        (page) => page.organizationId !== pageId
      )
    } catch (err: any) {
      error.value = err.message || 'Failed to disconnect page'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Complete LinkedIn OAuth callback after redirect
   * Called by the callback page/component
   */
  async function handleOAuthCallback(code: string, state: string): Promise<void> {
    loading.value = true
    error.value = null

    try {
      // Verify state matches what we stored
      const storedState = localStorage.getItem('linkedin_oauth_state')
      if (state !== storedState) {
        throw new Error('Invalid state parameter - possible CSRF attack')
      }

      // Clear stored state
      localStorage.removeItem('linkedin_oauth_state')

      // Send code to backend to complete OAuth
      const callbackResponse = await api.completeLinkedInAuth(code, state)

      if (!callbackResponse.success) {
        throw new Error(callbackResponse.error || 'Failed to complete LinkedIn authentication')
      }

      // Update connected pages
      connectedPages.value = callbackResponse.data?.pages || []
      error.value = null
    } catch (err: any) {
      error.value = err.message || 'Failed to complete LinkedIn authentication'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    connectedPages,
    isConnected,
    loading,
    error,
    connectLinkedIn,
    handleOAuthCallback,
    loadConnectedPages,
    disconnectPage,
  }
})

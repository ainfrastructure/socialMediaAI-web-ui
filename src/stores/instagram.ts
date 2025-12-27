import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../services/api'
import { debugLog } from '@/utils/debug'

export interface InstagramAccount {
  id: string
  instagramAccountId: string
  username: string
  pageId: string
  pageName: string
  connectedAt: string
}

export const useInstagramStore = defineStore('instagram', () => {
  const connectedAccounts = ref<InstagramAccount[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Initialize Instagram OAuth flow with redirect
   * @param returnUrl - Optional URL to return to after OAuth completes
   */
  async function connectInstagram(returnUrl?: string): Promise<void> {
    loading.value = true
    error.value = null

    try {
      // Step 1: Get authorization URL from backend
      const initResponse = await api.initInstagramAuth()

      if (!initResponse.success) {
        const errorMsg = initResponse.error || 'Failed to initialize Instagram authentication'
        throw new Error(errorMsg)
      }

      if (!initResponse.data) {
        throw new Error('No data received from server')
      }

      const { authUrl, state } = initResponse.data

      // Step 2: Store state in localStorage for verification after redirect
      localStorage.setItem('instagram_oauth_state', state)

      // Step 2b: Store return URL if provided
      if (returnUrl) {
        debugLog('[InstagramStore] Storing return URL:', returnUrl)
        localStorage.setItem('oauth_return_url', returnUrl)
      } else {
        localStorage.removeItem('oauth_return_url')
      }

      // Step 3: Redirect to Facebook OAuth (Instagram uses Facebook OAuth)
      window.location.href = authUrl
    } catch (err: any) {
      error.value = err.message || 'Failed to connect Instagram account'
      loading.value = false
      throw err
    }
    // Note: loading.value stays true because we're redirecting away
  }

  /**
   * Load user's connected Instagram accounts
   */
  async function loadConnectedAccounts(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const response = await api.getInstagramAccounts()

      if (!response.success) {
        throw new Error(response.error || 'Failed to load connected accounts')
      }

      connectedAccounts.value = response.data?.accounts || []
    } catch (err: any) {
      error.value = err.message || 'Failed to load connected accounts'
    } finally {
      loading.value = false
    }
  }

  /**
   * Disconnect an Instagram account
   */
  async function disconnectAccount(accountId: string): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const response = await api.disconnectInstagramAccount(accountId)

      if (!response.success) {
        throw new Error(response.error || 'Failed to disconnect account')
      }

      // Remove from local state
      connectedAccounts.value = connectedAccounts.value.filter(
        (account) => account.instagramAccountId !== accountId
      )
    } catch (err: any) {
      error.value = err.message || 'Failed to disconnect account'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Complete Instagram OAuth callback after redirect
   * Called by the callback page/component
   */
  async function handleOAuthCallback(code: string, state: string): Promise<void> {
    loading.value = true
    error.value = null

    try {
      // Verify state matches what we stored
      const storedState = localStorage.getItem('instagram_oauth_state')
      if (state !== storedState) {
        throw new Error('Invalid state parameter - possible CSRF attack')
      }

      // Clear stored state
      localStorage.removeItem('instagram_oauth_state')

      // Send code to backend to complete OAuth
      const callbackResponse = await api.completeInstagramAuth(code, state)

      if (!callbackResponse.success) {
        throw new Error(callbackResponse.error || 'Failed to complete Instagram authentication')
      }

      // Update connected accounts
      connectedAccounts.value = callbackResponse.data?.accounts || []
      error.value = null
    } catch (err: any) {
      error.value = err.message || 'Failed to complete Instagram authentication'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    connectedAccounts,
    loading,
    error,
    connectInstagram,
    handleOAuthCallback,
    loadConnectedAccounts,
    disconnectAccount,
  }
})

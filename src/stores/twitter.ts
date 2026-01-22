import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../services/api'
import { debugLog } from '@/utils/debug'

export interface TwitterAccount {
  id: string
  twitterAccountId: string
  username: string
  displayName: string
  profilePictureUrl?: string
  connectedAt: string
}

export const useTwitterStore = defineStore('twitter', () => {
  const connectedAccounts = ref<TwitterAccount[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Initialize Twitter OAuth flow with redirect
   * @param returnUrl - Optional URL to return to after OAuth completes
   */
  async function connectTwitter(returnUrl?: string): Promise<void> {
    loading.value = true
    error.value = null

    try {
      // Step 1: Get authorization URL from backend
      const initResponse = await api.initTwitterAuth()

      if (!initResponse.success) {
        const errorMsg = initResponse.error || 'Failed to initialize Twitter authentication'
        throw new Error(errorMsg)
      }

      if (!initResponse.data) {
        throw new Error('No data received from server')
      }

      const { authUrl, state } = initResponse.data

      // Step 2: Store state in localStorage for verification after redirect
      localStorage.setItem('twitter_oauth_state', state)

      // Step 2b: Store return URL if provided
      if (returnUrl) {
        debugLog('[TwitterStore] Storing return URL:', returnUrl)
        localStorage.setItem('oauth_return_url', returnUrl)
      } else {
        localStorage.removeItem('oauth_return_url')
      }

      // Step 3: Redirect to Twitter OAuth
      window.location.href = authUrl
    } catch (err: any) {
      error.value = err.message || 'Failed to connect Twitter account'
      loading.value = false
      throw err
    }
    // Note: loading.value stays true because we're redirecting away
  }

  /**
   * Load user's connected Twitter accounts
   */
  async function loadConnectedAccounts(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const response = await api.getTwitterAccounts()

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
   * Disconnect a Twitter account
   */
  async function disconnectAccount(accountId: string): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const response = await api.disconnectTwitterAccount(accountId)

      if (!response.success) {
        throw new Error(response.error || 'Failed to disconnect account')
      }

      // Remove from local state
      connectedAccounts.value = connectedAccounts.value.filter(
        (account) => account.twitterAccountId !== accountId
      )
    } catch (err: any) {
      error.value = err.message || 'Failed to disconnect account'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Complete Twitter OAuth callback after redirect
   * Called by the callback page/component
   */
  async function handleOAuthCallback(code: string, state: string): Promise<void> {
    loading.value = true
    error.value = null

    try {
      // Verify state matches what we stored
      const storedState = localStorage.getItem('twitter_oauth_state')
      if (state !== storedState) {
        throw new Error('Invalid state parameter - possible CSRF attack')
      }

      // Clear stored state
      localStorage.removeItem('twitter_oauth_state')

      // Send code to backend to complete OAuth
      const callbackResponse = await api.completeTwitterAuth(code, state)

      if (!callbackResponse.success) {
        throw new Error(callbackResponse.error || 'Failed to complete Twitter authentication')
      }

      // Update connected accounts
      connectedAccounts.value = callbackResponse.data?.accounts || []
      error.value = null
    } catch (err: any) {
      error.value = err.message || 'Failed to complete Twitter authentication'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    connectedAccounts,
    loading,
    error,
    connectTwitter,
    handleOAuthCallback,
    loadConnectedAccounts,
    disconnectAccount,
  }
})

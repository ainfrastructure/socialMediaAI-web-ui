import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../services/api'
import { debugLog } from '@/utils/debug'

export interface TikTokAccount {
  id: string
  tiktokAccountId: string
  username: string
  displayName: string
  profilePictureUrl?: string
  connectedAt: string
}

export const useTikTokStore = defineStore('tiktok', () => {
  const connectedAccounts = ref<TikTokAccount[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Initialize TikTok OAuth flow with redirect
   * @param returnUrl - Optional URL to return to after OAuth completes
   */
  async function connectTikTok(returnUrl?: string): Promise<void> {
    loading.value = true
    error.value = null

    try {
      // Step 1: Get authorization URL from backend
      const initResponse = await api.initTikTokAuth()

      if (!initResponse.success) {
        const errorMsg = initResponse.error || 'Failed to initialize TikTok authentication'
        throw new Error(errorMsg)
      }

      if (!initResponse.data) {
        throw new Error('No data received from server')
      }

      const { authUrl, state } = initResponse.data

      // Step 2: Store state in localStorage for verification after redirect
      localStorage.setItem('tiktok_oauth_state', state)

      // Step 2b: Store return URL if provided
      if (returnUrl) {
        debugLog('[TikTokStore] Storing return URL:', returnUrl)
        localStorage.setItem('oauth_return_url', returnUrl)
      } else {
        localStorage.removeItem('oauth_return_url')
      }

      // Step 3: Redirect to TikTok OAuth
      window.location.href = authUrl
    } catch (err: any) {
      error.value = err.message || 'Failed to connect TikTok account'
      loading.value = false
      throw err
    }
    // Note: loading.value stays true because we're redirecting away
  }

  /**
   * Load user's connected TikTok accounts
   */
  async function loadConnectedAccounts(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const response = await api.getTikTokAccounts()

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
   * Disconnect a TikTok account
   */
  async function disconnectAccount(accountId: string): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const response = await api.disconnectTikTokAccount(accountId)

      if (!response.success) {
        throw new Error(response.error || 'Failed to disconnect account')
      }

      // Remove from local state
      connectedAccounts.value = connectedAccounts.value.filter(
        (account) => account.tiktokAccountId !== accountId
      )
    } catch (err: any) {
      error.value = err.message || 'Failed to disconnect account'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Complete TikTok OAuth callback after redirect
   * Called by the callback page/component
   */
  async function handleOAuthCallback(code: string, state: string): Promise<void> {
    loading.value = true
    error.value = null

    try {
      // Verify state matches what we stored
      const storedState = localStorage.getItem('tiktok_oauth_state')
      if (state !== storedState) {
        throw new Error('Invalid state parameter - possible CSRF attack')
      }

      // Clear stored state
      localStorage.removeItem('tiktok_oauth_state')

      // Send code to backend to complete OAuth
      const callbackResponse = await api.completeTikTokAuth(code, state)

      if (!callbackResponse.success) {
        throw new Error(callbackResponse.error || 'Failed to complete TikTok authentication')
      }

      // Update connected accounts
      connectedAccounts.value = callbackResponse.data?.accounts || []
      error.value = null
    } catch (err: any) {
      error.value = err.message || 'Failed to complete TikTok authentication'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    connectedAccounts,
    loading,
    error,
    connectTikTok,
    handleOAuthCallback,
    loadConnectedAccounts,
    disconnectAccount,
  }
})

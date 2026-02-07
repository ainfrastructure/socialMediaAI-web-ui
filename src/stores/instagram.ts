import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '../services/api'
import { usePreferencesStore } from '@/stores/preferences'
import { debugLog } from '@/utils/debug'

export interface InstagramAccount {
  id: string
  instagramAccountId: string
  username: string
  pageId: string
  pageName: string
  profilePictureUrl?: string
  connectedAt: string
}

export const useInstagramStore = defineStore('instagram', () => {
  const connectedAccountsByBusiness = ref<Record<string, InstagramAccount[]>>({})
  const loadingConnections = ref(false)
  const connecting = ref(false)
  const error = ref<string | null>(null)
  const preferencesStore = usePreferencesStore()

  const connectedAccounts = computed(() => {
    const businessId = preferencesStore.selectedBusinessId
    return businessId ? connectedAccountsByBusiness.value[businessId] || [] : []
  })

  /**
   * Initialize Instagram OAuth flow with redirect
   * @param returnUrl - Optional URL to return to after OAuth completes
   */
  async function connectInstagram(returnUrl?: string, businessId?: string): Promise<void> {
    connecting.value = true
    error.value = null

    try {
      const resolvedBusinessId = businessId || preferencesStore.selectedBusinessId || undefined
      if (!resolvedBusinessId) {
        throw new Error('Please select a business before connecting Instagram')
      }
      // Step 1: Get authorization URL from backend
      const initResponse = await api.initInstagramAuth(resolvedBusinessId)

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
      connecting.value = false
      throw err
    }
    // Note: connecting stays true because we're redirecting away
  }

  /**
   * Load user's connected Instagram accounts
   */
  async function loadConnectedAccounts(businessId?: string): Promise<void> {
    loadingConnections.value = true
    error.value = null

    try {
      const resolvedBusinessId = businessId || preferencesStore.selectedBusinessId || undefined
      const response = await api.getInstagramAccounts(resolvedBusinessId)

      if (!response.success) {
        throw new Error(response.error || 'Failed to load connected accounts')
      }

      if (resolvedBusinessId) {
        connectedAccountsByBusiness.value = {
          ...connectedAccountsByBusiness.value,
          [resolvedBusinessId]: response.data?.accounts || []
        }
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to load connected accounts'
    } finally {
      connecting.value = false
    }
  }

  /**
   * Disconnect an Instagram account
   */
  async function disconnectAccount(accountId: string, businessId?: string): Promise<void> {
    connecting.value = true
    error.value = null

    try {
      const resolvedBusinessId = businessId || preferencesStore.selectedBusinessId || undefined
      const response = await api.disconnectInstagramAccount(accountId, resolvedBusinessId)

      if (!response.success) {
        throw new Error(response.error || 'Failed to disconnect account')
      }

      // Remove from local state
      const currentBusinessId = resolvedBusinessId
      if (currentBusinessId && connectedAccountsByBusiness.value[currentBusinessId]) {
        connectedAccountsByBusiness.value = {
          ...connectedAccountsByBusiness.value,
          [currentBusinessId]: connectedAccountsByBusiness.value[currentBusinessId].filter(
            (account) => account.instagramAccountId !== accountId
          )
        }
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to disconnect account'
      throw err
    } finally {
      connecting.value = false
    }
  }

  /**
   * Complete Instagram OAuth callback after redirect
   * Called by the callback page/component
   */
  async function handleOAuthCallback(code: string, state: string): Promise<void> {
    connecting.value = true
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

      // Update connected accounts for current business
      const businessId = preferencesStore.selectedBusinessId
      if (businessId) {
        connectedAccountsByBusiness.value = {
          ...connectedAccountsByBusiness.value,
          [businessId]: callbackResponse.data?.accounts || []
        }
      }
      error.value = null
    } catch (err: any) {
      error.value = err.message || 'Failed to complete Instagram authentication'
      throw err
    } finally {
      connecting.value = false
    }
  }


  function ensureBusinessCache(businessId: string): void {
    if (!connectedAccountsByBusiness.value[businessId]) {
      connectedAccountsByBusiness.value = {
        ...connectedAccountsByBusiness.value,
        [businessId]: []
      }
    }
  }

  function resetConnectionState(): void {
    connecting.value = false
    error.value = null
  }
  return {
    connectedAccounts,
    connectedAccountsByBusiness,
    loadingConnections,
    connecting,
    error,
    ensureBusinessCache,
    resetConnectionState,
    connectInstagram,
    handleOAuthCallback,
    loadConnectedAccounts,
    disconnectAccount,
  }
})

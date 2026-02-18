import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../services/api'
import { usePreferencesStore } from '@/stores/preferences'

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

  function getBrandId(): string | undefined {
    const preferencesStore = usePreferencesStore()
    return preferencesStore.selectedBrandId || undefined
  }

  async function connectTwitter(returnUrl?: string): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const brandId = getBrandId()
      const initResponse = await api.initTwitterAuth(brandId, 'web')

      if (!initResponse.success) {
        throw new Error(initResponse.error || 'Failed to initialize Twitter authentication')
      }

      if (!initResponse.data) {
        throw new Error('No data received from server')
      }

      const { authUrl } = initResponse.data

      // Backend handles the full OAuth flow and redirects back to /connect-accounts
      window.location.href = authUrl
    } catch (err: any) {
      error.value = err.message || 'Failed to connect Twitter account'
      loading.value = false
      throw err
    }
  }

  async function loadConnectedAccounts(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const brandId = getBrandId()
      const response = await api.getTwitterAccounts(brandId)

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

  async function disconnectAccount(accountId: string): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const brandId = getBrandId()
      const response = await api.disconnectTwitterAccount(accountId, brandId)

      if (!response.success) {
        throw new Error(response.error || 'Failed to disconnect account')
      }

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

  return {
    connectedAccounts,
    loading,
    error,
    connectTwitter,
    loadConnectedAccounts,
    disconnectAccount,
  }
})

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../services/api'
import { usePreferencesStore } from '@/stores/preferences'

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
  const connectedAccounts = ref<InstagramAccount[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  function getBrandId(): string | undefined {
    const preferencesStore = usePreferencesStore()
    return preferencesStore.selectedBrandId || undefined
  }

  async function connectInstagram(returnUrl?: string): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const brandId = getBrandId()
      const initResponse = await api.initInstagramAuth(brandId, 'web')

      if (!initResponse.success) {
        throw new Error(initResponse.error || 'Failed to initialize Instagram authentication')
      }

      if (!initResponse.data) {
        throw new Error('No data received from server')
      }

      const { authUrl } = initResponse.data

      // Backend handles the full OAuth flow and redirects back to /connect-accounts
      window.location.href = authUrl
    } catch (err: any) {
      error.value = err.message || 'Failed to connect Instagram account'
      loading.value = false
      throw err
    }
  }

  async function fetchAccounts(brandId?: string): Promise<void> {
    return loadConnectedAccounts(brandId)
  }

  async function loadConnectedAccounts(overrideBrandId?: string): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const brandId = overrideBrandId || getBrandId()
      const response = await api.getInstagramAccounts(brandId)

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

  async function disconnectAccount(accountId: string, overrideBrandId?: string): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const brandId = overrideBrandId || getBrandId()
      const response = await api.disconnectInstagramAccount(accountId, brandId)

      if (!response.success) {
        throw new Error(response.error || 'Failed to disconnect account')
      }

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

  // Legacy compat
  async function ensureBusinessCache(_brandId?: string): Promise<void> { return loadConnectedAccounts(_brandId) }
  function resetConnectionState(): void { connectedAccounts.value = []; error.value = null }

  return {
    connectedAccounts,
    loading,
    error,
    connectInstagram,
    loadConnectedAccounts,
    fetchAccounts,
    disconnectAccount,
    ensureBusinessCache,
    resetConnectionState,
  }
})

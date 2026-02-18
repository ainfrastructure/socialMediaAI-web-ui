import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '../services/api'
import { usePreferencesStore } from '@/stores/preferences'

export interface FacebookPage {
  id: string
  pageId: string
  pageName: string
  profilePictureUrl?: string
  connectedAt: string
}

export const useFacebookStore = defineStore('facebook', () => {
  const connectedPages = ref<FacebookPage[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isConnected = computed(() => connectedPages.value.length > 0)

  function getBrandId(): string | undefined {
    const preferencesStore = usePreferencesStore()
    return preferencesStore.selectedBrandId || undefined
  }

  async function connectFacebook(returnUrl?: string): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const brandId = getBrandId()
      const initResponse = await api.initFacebookAuth(brandId, 'web')

      if (!initResponse.success) {
        throw new Error(initResponse.error || 'Failed to initialize Facebook authentication')
      }

      if (!initResponse.data) {
        throw new Error('No data received from server')
      }

      const { authUrl } = initResponse.data

      // Backend handles the full OAuth flow and redirects back to /connect-accounts
      window.location.href = authUrl
    } catch (err: any) {
      error.value = err.message || 'Failed to connect Facebook account'
      loading.value = false
      throw err
    }
  }

  async function fetchPages(brandId?: string): Promise<void> {
    return loadConnectedPages(brandId)
  }

  async function loadConnectedPages(overrideBrandId?: string): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const brandId = overrideBrandId || getBrandId()
      const response = await api.getFacebookPages(brandId)

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

  async function disconnectPage(pageId: string, overrideBrandId?: string): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const brandId = overrideBrandId || getBrandId()
      const response = await api.disconnectFacebookPage(pageId, brandId)

      if (!response.success) {
        throw new Error(response.error || 'Failed to disconnect page')
      }

      connectedPages.value = connectedPages.value.filter((page) => page.pageId !== pageId)
    } catch (err: any) {
      error.value = err.message || 'Failed to disconnect page'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Legacy compat
  async function ensureBusinessCache(_brandId?: string): Promise<void> { return loadConnectedPages(_brandId) }
  function resetConnectionState(): void { connectedPages.value = []; error.value = null }

  return {
    connectedPages,
    isConnected,
    loading,
    error,
    connectFacebook,
    loadConnectedPages,
    fetchPages,
    disconnectPage,
    ensureBusinessCache,
    resetConnectionState,
  }
})

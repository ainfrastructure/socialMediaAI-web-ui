import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '../services/api'
import { usePreferencesStore } from '@/stores/preferences'

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

  const isConnected = computed(() => connectedPages.value.length > 0)

  function getBrandId(): string | undefined {
    const preferencesStore = usePreferencesStore()
    return preferencesStore.selectedBrandId || undefined
  }

  async function connectLinkedIn(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const brandId = getBrandId()
      const initResponse = await api.initLinkedInAuth(brandId, 'web')

      if (!initResponse.success) {
        throw new Error(initResponse.error || 'Failed to initialize LinkedIn authentication')
      }

      if (!initResponse.data) {
        throw new Error('No data received from server')
      }

      const { authUrl } = initResponse.data

      // Backend handles the full OAuth flow and redirects back to /connect-accounts
      window.location.href = authUrl
    } catch (err: any) {
      error.value = err.message || 'Failed to connect LinkedIn account'
      loading.value = false
      throw err
    }
  }

  async function loadConnectedPages(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const brandId = getBrandId()
      const response = await api.getLinkedInPages(brandId)

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

  async function disconnectPage(pageId: string): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const brandId = getBrandId()
      const response = await api.disconnectLinkedInPage(pageId, brandId)

      if (!response.success) {
        throw new Error(response.error || 'Failed to disconnect page')
      }

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

  return {
    connectedPages,
    isConnected,
    loading,
    error,
    connectLinkedIn,
    loadConnectedPages,
    disconnectPage,
  }
})

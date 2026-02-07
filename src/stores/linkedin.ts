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

  const isConnected = computed(() => connectedPages.value.length > 0)

  function getBrandId(): string | undefined {
    const preferencesStore = usePreferencesStore()
    return preferencesStore.selectedBrandId || undefined
  }

  async function connectLinkedIn(returnUrl?: string): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const brandId = getBrandId()
      const initResponse = await api.initLinkedInAuth(brandId)

      if (!initResponse.success) {
        throw new Error(initResponse.error || 'Failed to initialize LinkedIn authentication')
      }

      if (!initResponse.data) {
        throw new Error('No data received from server')
      }

      const { authUrl, state } = initResponse.data

      localStorage.setItem('linkedin_oauth_state', state)

      if (returnUrl) {
        debugLog('[LinkedInStore] Storing return URL:', returnUrl)
        localStorage.setItem('oauth_return_url', returnUrl)
      } else {
        localStorage.removeItem('oauth_return_url')
      }

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

  async function handleOAuthCallback(code: string, state: string): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const storedState = localStorage.getItem('linkedin_oauth_state')
      if (state !== storedState) {
        throw new Error('Invalid state parameter - possible CSRF attack')
      }

      localStorage.removeItem('linkedin_oauth_state')

      const callbackResponse = await api.completeLinkedInAuth(code, state)

      if (!callbackResponse.success) {
        throw new Error(callbackResponse.error || 'Failed to complete LinkedIn authentication')
      }

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

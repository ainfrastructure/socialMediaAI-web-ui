import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { businessService, type Business, type CreateBusinessData, type UpdateBusinessData } from '@/services/businessService'
import { usePreferencesStore } from '@/stores/preferences'
import { errorLog } from '@/utils/debug'

export const useBusinessesStore = defineStore('businesses', () => {
  const businesses = ref<Business[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastFetchTime = ref<number | null>(null)

  const preferencesStore = usePreferencesStore()

  const selectedBusiness = computed(() => {
    if (!preferencesStore.selectedBusinessId) return null
    return businesses.value.find(business => business.id === preferencesStore.selectedBusinessId) || null
  })

  const businessCount = computed(() => businesses.value.length)

  async function fetchBusinesses(limit: number = 100): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const data = await businessService.getBusinesses(limit)
      businesses.value = data
      lastFetchTime.value = Date.now()

      if (!preferencesStore.selectedBusinessId && businesses.value.length > 0) {
        const defaultBusiness = businesses.value.find(business => business.is_default)
        preferencesStore.setSelectedBusiness(defaultBusiness?.id || businesses.value[0].id)
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch businesses'
      errorLog('Failed to fetch businesses:', err)
    } finally {
      loading.value = false
    }
  }

  async function refreshBusinesses(): Promise<void> {
    return fetchBusinesses()
  }

  async function createBusiness(data: CreateBusinessData): Promise<Business | null> {
    loading.value = true
    error.value = null

    try {
      const response = await businessService.createBusiness(data)
      if (response.success && response.data) {
        businesses.value.unshift(response.data)
        return response.data
      }
      return null
    } catch (err: any) {
      error.value = err.message || 'Failed to create business'
      errorLog('Failed to create business:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  async function updateBusiness(id: string, updates: UpdateBusinessData): Promise<Business | null> {
    loading.value = true
    error.value = null

    try {
      const response = await businessService.updateBusiness(id, updates)
      if (response.success && response.data) {
        const index = businesses.value.findIndex(business => business.id === id)
        if (index !== -1) {
          businesses.value[index] = response.data
        }
        return response.data
      }
      return null
    } catch (err: any) {
      error.value = err.message || 'Failed to update business'
      errorLog('Failed to update business:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  async function deleteBusiness(id: string): Promise<boolean> {
    loading.value = true
    error.value = null

    try {
      const response = await businessService.deleteBusiness(id)
      if (response.success) {
        businesses.value = businesses.value.filter(business => business.id !== id)

        if (preferencesStore.selectedBusinessId === id) {
          preferencesStore.setSelectedBusiness(businesses.value[0]?.id || null)
        }

        return true
      }
      return false
    } catch (err: any) {
      error.value = err.message || 'Failed to delete business'
      errorLog('Failed to delete business:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  function clearError(): void {
    error.value = null
  }

  function isStale(): boolean {
    if (!lastFetchTime.value) return true
    const fiveMinutes = 5 * 60 * 1000
    return Date.now() - lastFetchTime.value > fiveMinutes
  }

  async function initialize(): Promise<void> {
    if (businesses.value.length === 0 || isStale()) {
      await fetchBusinesses()
    }
  }

  return {
    businesses,
    loading,
    error,
    lastFetchTime,
    selectedBusiness,
    businessCount,
    fetchBusinesses,
    refreshBusinesses,
    createBusiness,
    updateBusiness,
    deleteBusiness,
    clearError,
    isStale,
    initialize,
  }
})

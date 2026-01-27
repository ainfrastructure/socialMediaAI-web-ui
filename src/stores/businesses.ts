import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { businessService, type SavedBusiness, type CreateManualBusinessData } from '../services/businessService'
import { errorLog } from '@/utils/debug'

export const useBusinessesStore = defineStore('businesses', () => {
  // State
  const businesses = ref<SavedBusiness[]>([])
  const selectedBusinessId = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastFetchTime = ref<number | null>(null)

  // Computed
  const selectedBusiness = computed(() => {
    if (!selectedBusinessId.value) return null
    return businesses.value.find(r => r.id === selectedBusinessId.value) || null
  })

  const businessCount = computed(() => businesses.value.length)

  const businessesWithMenu = computed(() =>
    businesses.value.filter(r => r.menu?.items?.length > 0)
  )

  const businessesWithLogo = computed(() =>
    businesses.value.filter(r => r.brand_dna?.logo_url)
  )

  // Get businesses sorted by most recently saved
  const sortedByRecent = computed(() =>
    [...businesses.value].sort((a, b) => {
      const dateA = new Date(a.saved_at || 0)
      const dateB = new Date(b.saved_at || 0)
      return dateB.getTime() - dateA.getTime()
    })
  )

  // Manual businesses (created without Google Places)
  const manualBusinesses = computed(() =>
    businesses.value.filter(r => r.is_manual === true)
  )

  // Google Places businesses
  const placesBusinesses = computed(() =>
    businesses.value.filter(r => r.place_id !== null && !r.is_manual)
  )

  // Actions
  async function fetchBusinesses(limit: number = 100): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const data = await businessService.getSavedBusinesss(limit)
      console.log('Fetched businesses from API:', data.length)
      data.forEach(r => {
        if (r.brand_dna?.logo_url) {
          console.log(`Business "${r.name}" has logo:`, r.brand_dna.logo_url)
        }
      })
      businesses.value = data
      lastFetchTime.value = Date.now()
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

  function selectBusiness(id: string | null): void {
    selectedBusinessId.value = id
  }

  function selectBusinessByPlaceId(placeId: string): void {
    const business = businesses.value.find(r => r.place_id === placeId)
    selectedBusinessId.value = business?.id || null
  }

  function clearSelection(): void {
    selectedBusinessId.value = null
  }

  function getBusinessById(id: string): SavedBusiness | undefined {
    return businesses.value.find(r => r.id === id)
  }

  function getBusinessByPlaceId(placeId: string): SavedBusiness | undefined {
    return businesses.value.find(r => r.place_id === placeId)
  }

  async function createManualBusiness(
    businessData: CreateManualBusinessData
  ): Promise<SavedBusiness | null> {
    loading.value = true
    error.value = null

    try {
      const response = await businessService.createManualBusiness(businessData)

      if (response.success && response.data) {
        // Add to local state
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

  async function deleteBusiness(businessIdOrPlaceId: string): Promise<boolean> {
    loading.value = true
    error.value = null

    try {
      const success = await businessService.deleteBusiness(businessIdOrPlaceId)

      if (success) {
        // Remove from local state (match by id or place_id)
        businesses.value = businesses.value.filter(
          r => r.id !== businessIdOrPlaceId && r.place_id !== businessIdOrPlaceId
        )

        // Clear selection if deleted business was selected
        if (selectedBusinessId.value === businessIdOrPlaceId) {
          selectedBusinessId.value = null
        }
      }

      return success
    } catch (err: any) {
      error.value = err.message || 'Failed to delete business'
      errorLog('Failed to delete business:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  async function updateBusiness(
    placeId: string,
    updates: { website?: string | null; opening_hours?: any; social_media?: any }
  ): Promise<boolean> {
    loading.value = true
    error.value = null

    try {
      const response = await businessService.updateBusiness(placeId, updates)

      if (response.success && response.data) {
        // Update local state
        const index = businesses.value.findIndex(r => r.place_id === placeId)
        if (index !== -1) {
          businesses.value[index] = response.data
        }
        return true
      }

      return false
    } catch (err: any) {
      error.value = err.message || 'Failed to update business'
      errorLog('Failed to update business:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  function clearError(): void {
    error.value = null
  }

  // Check if data is stale (older than 5 minutes)
  function isStale(): boolean {
    if (!lastFetchTime.value) return true
    const fiveMinutes = 5 * 60 * 1000
    return Date.now() - lastFetchTime.value > fiveMinutes
  }

  // Initialize store - fetch if empty or stale
  async function initialize(): Promise<void> {
    if (businesses.value.length === 0 || isStale()) {
      await fetchBusinesses()
    }
  }

  return {
    // State
    businesses,
    selectedBusinessId,
    loading,
    error,
    lastFetchTime,

    // Computed
    selectedBusiness,
    businessCount,
    businessesWithMenu,
    businessesWithLogo,
    sortedByRecent,
    manualBusinesses,
    placesBusinesses,

    // Actions
    fetchBusinesses,
    refreshBusinesses,
    createManualBusiness,
    selectBusiness,
    selectBusinessByPlaceId,
    clearSelection,
    getBusinessById,
    getBusinessByPlaceId,
    deleteBusiness,
    updateBusiness,
    clearError,
    isStale,
    initialize,
  }
})

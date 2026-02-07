import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { brandService, type Brand, type CreateBrandData, type UpdateBrandData } from '@/services/brandService'
import { usePreferencesStore } from '@/stores/preferences'
import { errorLog } from '@/utils/debug'

export const useBrandsStore = defineStore('brands', () => {
  const brands = ref<Brand[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastFetchTime = ref<number | null>(null)

  const preferencesStore = usePreferencesStore()

  // Selected brand driven by preferences store (persisted)
  const selectedBrand = computed(() => {
    if (!preferencesStore.selectedBrandId) return null
    return brands.value.find(b => b.id === preferencesStore.selectedBrandId) || null
  })

  const brandCount = computed(() => brands.value.length)

  // Actions
  async function fetchBrands(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const data = await brandService.getBrands()
      brands.value = data
      lastFetchTime.value = Date.now()

      // Auto-select first brand if none selected
      if (!preferencesStore.selectedBrandId && brands.value.length > 0) {
        preferencesStore.setSelectedBrand(brands.value[0].id)
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch brands'
      errorLog('Failed to fetch brands:', err)
    } finally {
      loading.value = false
    }
  }

  async function refreshBrands(): Promise<void> {
    return fetchBrands()
  }

  async function createBrand(data: CreateBrandData): Promise<Brand | null> {
    loading.value = true
    error.value = null

    try {
      const response = await brandService.createBrand(data)
      if (response.success && response.data) {
        brands.value.unshift(response.data)
        return response.data
      }
      return null
    } catch (err: any) {
      error.value = err.message || 'Failed to create brand'
      errorLog('Failed to create brand:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  async function updateBrand(id: string, updates: UpdateBrandData): Promise<Brand | null> {
    loading.value = true
    error.value = null

    try {
      const response = await brandService.updateBrand(id, updates)
      if (response.success && response.data) {
        const index = brands.value.findIndex(b => b.id === id)
        if (index !== -1) {
          brands.value[index] = response.data
        }
        return response.data
      }
      return null
    } catch (err: any) {
      error.value = err.message || 'Failed to update brand'
      errorLog('Failed to update brand:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  async function deleteBrand(id: string): Promise<boolean> {
    loading.value = true
    error.value = null

    try {
      const response = await brandService.deleteBrand(id)
      if (response.success) {
        brands.value = brands.value.filter(b => b.id !== id)

        // Re-select if deleted brand was selected
        if (preferencesStore.selectedBrandId === id) {
          preferencesStore.setSelectedBrand(brands.value[0]?.id || null)
        }

        return true
      }
      return false
    } catch (err: any) {
      error.value = err.message || 'Failed to delete brand'
      errorLog('Failed to delete brand:', err)
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
    if (brands.value.length === 0 || isStale()) {
      await fetchBrands()
    }
  }

  // Legacy compat aliases
  const restaurants = brands
  async function refreshBusinesses(): Promise<void> { return fetchBrands() }
  async function createManualBrand(data: CreateBrandData): Promise<Brand | null> { return createBrand(data) }

  return {
    brands,
    restaurants,
    loading,
    error,
    lastFetchTime,
    selectedBrand,
    brandCount,
    fetchBrands,
    refreshBrands,
    refreshBusinesses,
    createBrand,
    createManualBrand,
    updateBrand,
    deleteBrand,
    clearError,
    isStale,
    initialize,
  }
})

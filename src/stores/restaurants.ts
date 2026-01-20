import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { restaurantService, type SavedRestaurant, type CreateManualRestaurantData } from '../services/restaurantService'
import { errorLog } from '@/utils/debug'

export const useRestaurantsStore = defineStore('restaurants', () => {
  // State
  const restaurants = ref<SavedRestaurant[]>([])
  const selectedRestaurantId = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastFetchTime = ref<number | null>(null)

  // Computed
  const selectedRestaurant = computed(() => {
    if (!selectedRestaurantId.value) return null
    return restaurants.value.find(r => r.id === selectedRestaurantId.value) || null
  })

  const restaurantCount = computed(() => restaurants.value.length)

  const restaurantsWithMenu = computed(() =>
    restaurants.value.filter(r => r.menu?.items?.length > 0)
  )

  const restaurantsWithLogo = computed(() =>
    restaurants.value.filter(r => r.brand_dna?.logo_url)
  )

  // Get restaurants sorted by most recently saved
  const sortedByRecent = computed(() =>
    [...restaurants.value].sort((a, b) => {
      const dateA = new Date(a.saved_at || 0)
      const dateB = new Date(b.saved_at || 0)
      return dateB.getTime() - dateA.getTime()
    })
  )

  // Manual restaurants (created without Google Places)
  const manualRestaurants = computed(() =>
    restaurants.value.filter(r => r.is_manual === true)
  )

  // Google Places restaurants
  const placesRestaurants = computed(() =>
    restaurants.value.filter(r => r.place_id !== null && !r.is_manual)
  )

  // Actions
  async function fetchRestaurants(limit: number = 100): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const data = await restaurantService.getSavedRestaurants(limit)
      console.log('Fetched restaurants from API:', data.length)
      data.forEach(r => {
        if (r.brand_dna?.logo_url) {
          console.log(`Restaurant "${r.name}" has logo:`, r.brand_dna.logo_url)
        }
      })
      restaurants.value = data
      lastFetchTime.value = Date.now()
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch restaurants'
      errorLog('Failed to fetch restaurants:', err)
    } finally {
      loading.value = false
    }
  }

  async function refreshRestaurants(): Promise<void> {
    return fetchRestaurants()
  }

  function selectRestaurant(id: string | null): void {
    selectedRestaurantId.value = id
  }

  function selectRestaurantByPlaceId(placeId: string): void {
    const restaurant = restaurants.value.find(r => r.place_id === placeId)
    selectedRestaurantId.value = restaurant?.id || null
  }

  function clearSelection(): void {
    selectedRestaurantId.value = null
  }

  function getRestaurantById(id: string): SavedRestaurant | undefined {
    return restaurants.value.find(r => r.id === id)
  }

  function getRestaurantByPlaceId(placeId: string): SavedRestaurant | undefined {
    return restaurants.value.find(r => r.place_id === placeId)
  }

  async function createManualRestaurant(
    restaurantData: CreateManualRestaurantData
  ): Promise<SavedRestaurant | null> {
    loading.value = true
    error.value = null

    try {
      const response = await restaurantService.createManualRestaurant(restaurantData)

      if (response.success && response.data) {
        // Add to local state
        restaurants.value.unshift(response.data)
        return response.data
      }

      return null
    } catch (err: any) {
      error.value = err.message || 'Failed to create restaurant'
      errorLog('Failed to create restaurant:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  async function deleteRestaurant(restaurantIdOrPlaceId: string): Promise<boolean> {
    loading.value = true
    error.value = null

    try {
      const success = await restaurantService.deleteRestaurant(restaurantIdOrPlaceId)

      if (success) {
        // Remove from local state (match by id or place_id)
        restaurants.value = restaurants.value.filter(
          r => r.id !== restaurantIdOrPlaceId && r.place_id !== restaurantIdOrPlaceId
        )

        // Clear selection if deleted restaurant was selected
        if (selectedRestaurantId.value === restaurantIdOrPlaceId) {
          selectedRestaurantId.value = null
        }
      }

      return success
    } catch (err: any) {
      error.value = err.message || 'Failed to delete restaurant'
      errorLog('Failed to delete restaurant:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  async function updateRestaurant(
    placeId: string,
    updates: { website?: string | null; opening_hours?: any; social_media?: any }
  ): Promise<boolean> {
    loading.value = true
    error.value = null

    try {
      const response = await restaurantService.updateRestaurant(placeId, updates)

      if (response.success && response.data) {
        // Update local state
        const index = restaurants.value.findIndex(r => r.place_id === placeId)
        if (index !== -1) {
          restaurants.value[index] = response.data
        }
        return true
      }

      return false
    } catch (err: any) {
      error.value = err.message || 'Failed to update restaurant'
      errorLog('Failed to update restaurant:', err)
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
    if (restaurants.value.length === 0 || isStale()) {
      await fetchRestaurants()
    }
  }

  return {
    // State
    restaurants,
    selectedRestaurantId,
    loading,
    error,
    lastFetchTime,

    // Computed
    selectedRestaurant,
    restaurantCount,
    restaurantsWithMenu,
    restaurantsWithLogo,
    sortedByRecent,
    manualRestaurants,
    placesRestaurants,

    // Actions
    fetchRestaurants,
    refreshRestaurants,
    createManualRestaurant,
    selectRestaurant,
    selectRestaurantByPlaceId,
    clearSelection,
    getRestaurantById,
    getRestaurantByPlaceId,
    deleteRestaurant,
    updateRestaurant,
    clearError,
    isStale,
    initialize,
  }
})

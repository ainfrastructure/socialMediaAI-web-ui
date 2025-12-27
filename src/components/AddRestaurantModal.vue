<template>
  <BaseModal
    :model-value="modelValue"
    size="md"
    :title="$t('restaurantSelector.addNew')"
    :show-close-button="true"
    :close-on-overlay-click="!savingRestaurant"
    :close-on-escape="!savingRestaurant"
    :allow-overflow="true"
    @update:model-value="(val: boolean) => !val && closeModal()"
    @close="closeModal"
  >
    <!-- Error Alert -->
    <BaseAlert v-if="restaurantError" type="error" :dismissible="false">
      {{ restaurantError }}
    </BaseAlert>

    <!-- Search Field -->
    <div class="search-section">
      <label class="search-label">{{ $t('restaurantSearch.searchPlaceholder') }}</label>
      <RestaurantAutocomplete
        :placeholder="$t('restaurantSearch.searchPlaceholder')"
        :saved-restaurants="savedRestaurants"
        @select="handleRestaurantSelect"
        :disabled="savingRestaurant"
      />
    </div>

    <!-- Loading State -->
    <div v-if="savingRestaurant && !detailsFetched" class="loading-state">
      <div class="spinner"></div>
      <p class="loading-text">{{ $t('common.loading') }}</p>
    </div>

    <!-- Selected Restaurant Preview -->
    <div v-if="(detailsFetched || restaurantSaved) && selectedRestaurant" class="selected-restaurant">
      <div class="restaurant-card">
        <div class="restaurant-logo" v-if="selectedRestaurant.brand_dna?.logo_url">
          <img :src="selectedRestaurant.brand_dna.logo_url" :alt="selectedRestaurant.name" />
        </div>
        <div class="restaurant-info">
          <h3>{{ selectedRestaurant.name }}</h3>
          <p v-if="selectedRestaurant.address" class="address">{{ selectedRestaurant.address }}</p>
          <div v-if="selectedRestaurant.menu_items?.length > 0" class="menu-badge-container">
            <span v-if="selectedRestaurant.menu_source === 'okam'" class="menu-badge okam-badge">
              ✓ Okam Menu - {{ selectedRestaurant.menu_items.length }} items
            </span>
            <span v-else-if="selectedRestaurant.menu_source" class="menu-badge platform-badge">
              {{ selectedRestaurant.menu_source }} - {{ selectedRestaurant.menu_items.length }} items
            </span>
          </div>
        </div>
        <span class="check-icon">✓</span>
      </div>
    </div>

    <!-- Success Message -->
    <div v-if="restaurantSaved" class="success-message">
      <div class="success-icon">✓</div>
      <p>{{ $t('restaurantSelector.restaurantAdded') }}</p>
    </div>

    <template #footer v-if="detailsFetched && !restaurantSaved">
      <BaseButton
        variant="ghost"
        @click="closeModal"
      >
        {{ $t('common.cancel') }}
      </BaseButton>
      <BaseButton
        variant="primary"
        :disabled="savingRestaurant"
        @click="handleSave"
      >
        {{ savingRestaurant ? $t('common.processing') : $t('common.save') }}
      </BaseButton>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseModal from './BaseModal.vue'
import BaseButton from './BaseButton.vue'
import BaseAlert from './BaseAlert.vue'
import RestaurantAutocomplete from './RestaurantAutocomplete.vue'
import { placesService } from '../services/placesService'
import { okamService } from '../services/okamService'
import { restaurantService } from '../services/restaurantService'
import { debugLog, errorLog } from '@/utils/debug'

interface Props {
  modelValue: boolean
  savedRestaurants?: Array<{ place_id: string; name: string }>
}

const props = withDefaults(defineProps<Props>(), {
  savedRestaurants: () => []
})
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'restaurantAdded', restaurant: any): void
}>()

const selectedRestaurant = ref<any>(null)
const savingRestaurant = ref(false)
const loadingDetails = ref(false)
const detailsFetched = ref(false)
const restaurantSaved = ref(false)
const restaurantError = ref('')
const placeDetails = ref<any>(null)
const fetchedDetails = ref<any>(null)
const fetchedMenuData = ref<any>(null)
const fetchedBrandDNA = ref<any>(null)

// Reset state when modal opens
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    resetState()
  }
})

function resetState() {
  selectedRestaurant.value = null
  savingRestaurant.value = false
  loadingDetails.value = false
  detailsFetched.value = false
  restaurantSaved.value = false
  restaurantError.value = ''
  placeDetails.value = null
  fetchedDetails.value = null
  fetchedMenuData.value = null
  fetchedBrandDNA.value = null
}

function closeModal() {
  emit('update:modelValue', false)
}

async function handleRestaurantSelect(restaurant: any) {
  selectedRestaurant.value = restaurant
  restaurantError.value = ''
  restaurantSaved.value = false

  await fetchRestaurantDetails(restaurant)
}

async function fetchRestaurantDetails(restaurant: any) {
  try {
    savingRestaurant.value = true
    loadingDetails.value = true
    restaurantError.value = ''

    // Fetch full place details from Google Places
    const details = await placesService.getPlaceDetails(restaurant.place_id)

    if (!details) {
      throw new Error('Failed to fetch restaurant details')
    }

    placeDetails.value = details

    // Fetch menu data from OKAM
    let menuData = null
    let menuSource = 'none'
    let brandDNA = null

    try {
      const okamMenu = await okamService.getMenuByPlaceId(restaurant.place_id)

      if (okamMenu && okamMenu.categories?.length > 0) {
        // Convert Okam format to standard format
        menuData = {
          restaurantName: okamMenu.storeName,
          platform: 'okam' as const,
          url: '',
          items: okamService.convertToMenuItems(okamMenu)
        }
        menuSource = 'okam'

        // If Okam has a logo, use it (proxy through our backend to avoid CORS issues)
        if (okamMenu.logoUrl) {
          brandDNA = {
            logo_url: okamService.proxyImageUrl(okamMenu.logoUrl) || okamMenu.logoUrl,
            brand_name: okamMenu.storeName,
            primary_color: null,
            secondary_color: null,
            font_style: null
          }
        }
      }
    } catch (error) {
      debugLog('Menu data not available:', error)
    }

    // Store the fetched data (don't save to database yet)
    fetchedDetails.value = {
      restaurant,
      details,
      menuSource
    }
    fetchedMenuData.value = menuData
    fetchedBrandDNA.value = brandDNA
    detailsFetched.value = true

    // Set up the selectedRestaurant preview (but not saved yet)
    selectedRestaurant.value = {
      id: '', // Will be set when saved
      place_id: restaurant.place_id,
      name: details.name,
      address: details.formatted_address || details.vicinity || restaurant.address || '',
      city: details.address_components?.find((c: any) => c.types.includes('locality'))?.long_name || '',
      country: details.address_components?.find((c: any) => c.types.includes('country'))?.long_name || '',
      brand_dna: brandDNA,
      menu_items: menuData?.items || [],
      menu_source: menuSource,
      google_data: details
    }
  } catch (error: any) {
    errorLog('Failed to fetch restaurant details:', error)
    restaurantError.value = error.message || 'Failed to fetch restaurant details. Please try again.'
    detailsFetched.value = false
  } finally {
    savingRestaurant.value = false
    loadingDetails.value = false
  }
}

async function handleSave() {
  if (!fetchedDetails.value) {
    restaurantError.value = 'No restaurant details to save'
    return
  }

  try {
    savingRestaurant.value = true
    restaurantError.value = ''

    const { restaurant, details } = fetchedDetails.value
    const menuData = fetchedMenuData.value
    const brandDNA = fetchedBrandDNA.value

    // Save restaurant to database
    const restaurantData = {
      place_id: restaurant.place_id || details.place_id,
      name: details.name || restaurant.name,
      address: details.formatted_address || details.vicinity || restaurant.address || '',
      city: details.address_components?.find((c: any) => c.types.includes('locality'))?.long_name || '',
      country: details.address_components?.find((c: any) => c.types.includes('country'))?.long_name || '',
      google_data: details,
      menu: menuData || null,
      brand_dna: brandDNA || null,
      photos: details.photos ? {
        photos: details.photos,
        photoUrls: details.photoUrls
      } : null,
    }

    if (!restaurantData.place_id || !restaurantData.name || !restaurantData.address) {
      throw new Error('Missing required fields')
    }

    const result = await restaurantService.saveRestaurant(restaurantData)

    if (result.success) {
      restaurantSaved.value = true
      selectedRestaurant.value.id = result.data?.id || ''

      // Emit the saved restaurant
      emit('restaurantAdded', selectedRestaurant.value)

      // Close modal after a short delay
      setTimeout(() => {
        closeModal()
      }, 1500)
    } else {
      if (result.error && result.error.includes('already saved')) {
        // Restaurant already exists, that's fine!
        restaurantSaved.value = true
        selectedRestaurant.value.id = result.data?.id || ''
        emit('restaurantAdded', selectedRestaurant.value)

        setTimeout(() => {
          closeModal()
        }, 1500)
      } else {
        throw new Error(result.error || 'Failed to save restaurant')
      }
    }
  } catch (error: any) {
    errorLog('Failed to save restaurant:', error)
    restaurantError.value = error.message || 'Failed to save restaurant. Please try again.'
  } finally {
    savingRestaurant.value = false
  }
}
</script>

<style scoped>
.search-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  overflow: visible;
  position: relative;
  z-index: 10;
}

.search-label {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-primary);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-3xl);
  gap: var(--space-lg);
  cursor: default;
  user-select: none;
  pointer-events: none;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(212, 175, 55, 0.2);
  border-top-color: var(--gold-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  cursor: default;
  user-select: none;
  pointer-events: none;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  color: var(--text-secondary);
  font-size: var(--text-sm);
  margin: 0;
}

.selected-restaurant {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.restaurant-card {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  padding: var(--space-lg);
  background: rgba(212, 175, 55, 0.05);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: var(--radius-lg);
}

.restaurant-logo {
  flex-shrink: 0;
  width: 60px;
  height: 60px;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

.restaurant-logo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.restaurant-info {
  flex: 1;
  min-width: 0;
}

.restaurant-info h3 {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  color: var(--text-primary);
  margin: 0 0 var(--space-xs) 0;
}

.restaurant-info .address {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: 0 0 var(--space-sm) 0;
}

.menu-badge-container {
  display: flex;
  gap: var(--space-sm);
  flex-wrap: wrap;
}

.menu-badge {
  display: inline-flex;
  align-items: center;
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 600;
}

.okam-badge {
  background: rgba(76, 175, 80, 0.15);
  color: #4CAF50;
  border: 1px solid rgba(76, 175, 80, 0.3);
}

.platform-badge {
  background: rgba(33, 150, 243, 0.15);
  color: #2196F3;
  border: 1px solid rgba(33, 150, 243, 0.3);
}

.check-icon {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  background: var(--gold-primary);
  color: var(--text-on-gold);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--font-bold);
  font-size: var(--text-lg);
}

.success-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-xl);
  animation: fadeIn 0.3s ease;
}

.success-icon {
  width: 60px;
  height: 60px;
  background: var(--gold-primary);
  color: var(--text-on-gold);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: var(--font-bold);
  box-shadow: var(--glow-gold-md);
}

.success-message p {
  color: var(--text-primary);
  font-size: var(--text-base);
  font-weight: 600;
  margin: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .restaurant-card {
    flex-direction: column;
    text-align: center;
  }
}
</style>

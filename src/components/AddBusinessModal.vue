<template>
  <BaseModal
    :model-value="modelValue"
    size="md"
    :title="$t('businessSelector.addNew')"
    :show-close-button="true"
    :close-on-overlay-click="!savingBusiness"
    :close-on-escape="!savingBusiness"
    :allow-overflow="true"
    @update:model-value="(val: boolean) => !val && closeModal()"
    @close="closeModal"
  >
    <!-- Error Alert -->
    <BaseAlert v-if="businessError" type="error" :dismissible="false">
      {{ businessError }}
    </BaseAlert>

    <!-- Search Field -->
    <div class="search-section">
      <label class="search-label">{{ $t('businessSearch.searchPlaceholder') }}</label>
      <BusinessAutocomplete
        :placeholder="$t('businessSearch.searchPlaceholder')"
        :saved-businesses="savedBusinesses"
        @select="handleBusinessSelect"
        :disabled="savingBusiness"
      />

      <!-- Manual Entry Link -->
      <button
        v-if="!detailsFetched && !savingBusiness"
        class="manual-entry-link"
        @click="handleSwitchToManual"
        type="button"
      >
        {{ $t('businessSelector.cantFindAddManually') }}
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="savingBusiness && !detailsFetched" class="loading-state">
      <div class="spinner"></div>
      <p class="loading-text">{{ $t('common.loading') }}</p>
    </div>

    <!-- Selected Business Preview -->
    <div v-if="(detailsFetched || businessSaved) && selectedBusiness" class="selected-business">
      <div class="business-card">
        <div class="business-logo" v-if="selectedBusiness.brand_dna?.logo_url">
          <img :src="selectedBusiness.brand_dna.logo_url" :alt="selectedBusiness.name" />
        </div>
        <div class="business-info">
          <h3>{{ selectedBusiness.name }}</h3>
          <p v-if="selectedBusiness.address" class="address">{{ selectedBusiness.address }}</p>
          <div v-if="selectedBusiness.menu_items?.length > 0" class="menu-badge-container">
            <span v-if="selectedBusiness.menu_source === 'okam'" class="menu-badge okam-badge">
              ✓ Okam Menu - {{ selectedBusiness.menu_items.length }} items
            </span>
            <span v-else-if="selectedBusiness.menu_source" class="menu-badge platform-badge">
              {{ selectedBusiness.menu_source }} - {{ selectedBusiness.menu_items.length }} items
            </span>
          </div>
        </div>
        <span class="check-icon">✓</span>
      </div>
    </div>

    <!-- Success Message -->
    <div v-if="businessSaved" class="success-message">
      <div class="success-icon">✓</div>
      <p>{{ $t('businessSelector.businessAdded') }}</p>
    </div>

    <template #footer v-if="detailsFetched && !businessSaved">
      <BaseButton
        variant="ghost"
        @click="closeModal"
      >
        {{ $t('common.cancel') }}
      </BaseButton>
      <BaseButton
        variant="primary"
        :disabled="savingBusiness"
        @click="handleSave"
      >
        {{ savingBusiness ? $t('common.processing') : $t('common.save') }}
      </BaseButton>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseModal from './BaseModal.vue'
import BaseButton from './BaseButton.vue'
import BaseAlert from './BaseAlert.vue'
import BusinessAutocomplete from './BusinessAutocomplete.vue'
import { placesService } from '../services/placesService'
import { okamService } from '../services/okamService'
import { businessService } from '../services/businessService'
import { debugLog, errorLog } from '@/utils/debug'

interface Props {
  modelValue: boolean
  savedBusinesses?: Array<{ place_id: string; name: string }>
}

const props = withDefaults(defineProps<Props>(), {
  savedBusinesses: () => []
})
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'businessAdded', business: any): void
  (e: 'switch-to-manual'): void
}>()

const selectedBusiness = ref<any>(null)
const savingBusiness = ref(false)
const loadingDetails = ref(false)
const detailsFetched = ref(false)
const businessSaved = ref(false)
const businessError = ref('')
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
  selectedBusiness.value = null
  savingBusiness.value = false
  loadingDetails.value = false
  detailsFetched.value = false
  businessSaved.value = false
  businessError.value = ''
  placeDetails.value = null
  fetchedDetails.value = null
  fetchedMenuData.value = null
  fetchedBrandDNA.value = null
}

function closeModal() {
  emit('update:modelValue', false)
}

function handleSwitchToManual() {
  closeModal()
  emit('switch-to-manual')
}

async function handleBusinessSelect(business: any) {
  selectedBusiness.value = business
  businessError.value = ''
  businessSaved.value = false

  await fetchBusinessDetails(business)
}

async function fetchBusinessDetails(business: any) {
  try {
    savingBusiness.value = true
    loadingDetails.value = true
    businessError.value = ''

    // Fetch full place details from Google Places
    const details = await placesService.getPlaceDetails(business.place_id)

    if (!details) {
      throw new Error('Failed to fetch business details')
    }

    placeDetails.value = details

    // Fetch menu data from OKAM
    let menuData = null
    let menuSource = 'none'
    let brandDNA = null

    try {
      const okamMenu = await okamService.getMenuByPlaceId(business.place_id)

      if (okamMenu && okamMenu.categories?.length > 0) {
        // Convert Okam format to standard format
        menuData = {
          businessName: okamMenu.storeName,
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
      business,
      details,
      menuSource
    }
    fetchedMenuData.value = menuData
    fetchedBrandDNA.value = brandDNA
    detailsFetched.value = true

    // Set up the selectedBusiness preview (but not saved yet)
    selectedBusiness.value = {
      id: '', // Will be set when saved
      place_id: business.place_id,
      name: details.name,
      address: details.formatted_address || details.vicinity || business.address || '',
      city: details.address_components?.find((c: any) => c.types.includes('locality'))?.long_name || '',
      country: details.address_components?.find((c: any) => c.types.includes('country'))?.long_name || '',
      brand_dna: brandDNA,
      menu_items: menuData?.items || [],
      menu_source: menuSource,
      google_data: details
    }
  } catch (error: any) {
    errorLog('Failed to fetch business details:', error)
    businessError.value = error.message || 'Failed to fetch business details. Please try again.'
    detailsFetched.value = false
  } finally {
    savingBusiness.value = false
    loadingDetails.value = false
  }
}

async function handleSave() {
  if (!fetchedDetails.value) {
    businessError.value = 'No business details to save'
    return
  }

  try {
    savingBusiness.value = true
    businessError.value = ''

    const { business, details } = fetchedDetails.value
    const menuData = fetchedMenuData.value
    const brandDNA = fetchedBrandDNA.value

    // Save business to database
    const businessData = {
      place_id: business.place_id || details.place_id,
      name: details.name || business.name,
      address: details.formatted_address || details.vicinity || business.address || '',
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

    if (!businessData.place_id || !businessData.name || !businessData.address) {
      throw new Error('Missing required fields')
    }

    const result = await businessService.saveBusiness(businessData)

    if (result.success) {
      businessSaved.value = true
      selectedBusiness.value.id = result.data?.id || ''

      // Emit the saved business
      emit('businessAdded', selectedBusiness.value)

      // Close modal after a short delay
      setTimeout(() => {
        closeModal()
      }, 1500)
    } else {
      if (result.error && result.error.includes('already saved')) {
        // Business already exists, that's fine!
        businessSaved.value = true
        selectedBusiness.value.id = result.data?.id || ''
        emit('businessAdded', selectedBusiness.value)

        setTimeout(() => {
          closeModal()
        }, 1500)
      } else {
        throw new Error(result.error || 'Failed to save business')
      }
    }
  } catch (error: any) {
    errorLog('Failed to save business:', error)
    businessError.value = error.message || 'Failed to save business. Please try again.'
  } finally {
    savingBusiness.value = false
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

.manual-entry-link {
  align-self: center;
  background: none;
  border: none;
  color: var(--gold-primary);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  padding: var(--space-md) 0;
  transition: var(--transition-base);
  text-decoration: none;
  margin-top: var(--space-md);
}

.manual-entry-link:hover {
  text-decoration: underline;
  color: var(--gold-dark);
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
  border: 3px solid rgba(15, 61, 46, 0.2);
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

.selected-business {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.business-card {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  padding: var(--space-lg);
  background: rgba(15, 61, 46, 0.05);
  border: 1px solid rgba(15, 61, 46, 0.2);
  border-radius: var(--radius-lg);
}

.business-logo {
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

.business-logo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.business-info {
  flex: 1;
  min-width: 0;
}

.business-info h3 {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  color: var(--text-primary);
  margin: 0 0 var(--space-xs) 0;
}

.business-info .address {
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
  color: #ffffff;
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
  color: #ffffff;
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
  .business-card {
    flex-direction: column;
    text-align: center;
  }
}

/* ===== DARK MODE OVERRIDES ===== */
:root[data-theme="dark"] .spinner {
  border-color: var(--border-color);
  border-top-color: var(--gold-primary);
}

:root[data-theme="dark"] .business-card {
  background: var(--accent-alpha-10);
  border-color: var(--border-color);
}

:root[data-theme="dark"] .business-logo {
  background: var(--bg-tertiary);
}
</style>

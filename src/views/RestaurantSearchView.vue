<template>
  <div class="restaurant-search-view">
    <div class="container">
      <!-- Header -->
      <div class="header">
        <h1 class="title">{{ $t('restaurantSearch.title') }}</h1>
        <p class="subtitle">
          {{ $t('restaurantSearch.subtitle') }}
        </p>
      </div>

      <!-- Search Input -->
      <div class="search-wrapper">
        <RestaurantAutocomplete
          v-model="selectedRestaurant"
          label=""
          :placeholder="$t('restaurantSearch.searchPlaceholder')"
          autofocus
          @select="handleRestaurantSelect"
          @dropdownOpen="isAutocompleteOpen = $event"
        />
      </div>

      <!-- Quick Overview Stats -->
      <RestaurantQuickOverview
        v-if="selectedRestaurant && placeDetails && !isAutocompleteOpen"
        :place-details="placeDetails"
        :menu-data="menuData"
        :competitor-data="competitorData"
        :social-media-data="socialMediaData"
      />

      <!-- Restaurant Details Card -->
      <RestaurantDetailsCard
        v-if="selectedRestaurant && !isAutocompleteOpen"
        :restaurant="selectedRestaurant"
        :place-details="placeDetails"
        :loading-details="loadingDetails"
        :social-media-data="socialMediaData"
        :loading-social-media="loadingSocialMedia"
        :social-media-error="socialMediaError"
        v-model:selected-photo-indices="selectedPhotoIndices"
        v-model:upload-files="uploadFiles"
        @upload-error="uploadError = $event"
      />

      <!-- Brand DNA Card -->
      <BrandDNACard
        v-if="selectedRestaurant && !isAutocompleteOpen"
        :brand-d-n-a="brandDNA"
        :loading="loadingBrandDNA"
        :error="brandDNAError"
        :website-url="placeDetails?.website"
      />

      <!-- Reviews Section -->
      <ReviewsSection
        v-if="placeDetails && placeDetails.reviews && placeDetails.reviews.length > 0 && !isAutocompleteOpen"
        :reviews="placeDetails.reviews"
        v-model:current-page="reviewsPage"
        :per-page="reviewsPerPage"
      />

      <!-- Competitors Section -->
      <CompetitorsSection
        v-if="selectedRestaurant && !isAutocompleteOpen"
        :competitor-data="competitorData"
        :loading="loadingCompetitors"
        :error="competitorError"
        v-model:current-page="competitorsPage"
        :per-page="competitorsPerPage"
      />

      <!-- Menu Section -->
      <MenuSection
        v-if="selectedRestaurant && !isAutocompleteOpen"
        :menu-data="menuData"
        :loading="loadingMenu"
        :error="menuError"
        v-model:current-page="menuPage"
        :per-page="menuItemsPerPage"
      />

      <!-- Save Actions Alerts -->
      <div v-if="selectedRestaurant && !isAutocompleteOpen" class="actions-section">
        <BaseAlert v-if="saveSuccess" type="success">
          {{ saveSuccessMessage }}
        </BaseAlert>

        <BaseAlert v-if="saveError" type="error">
          {{ saveError }}
        </BaseAlert>
      </div>
    </div>

    <!-- Sticky CTA Button -->
    <StickyCTA
      v-if="selectedRestaurant && placeDetails && !isAutocompleteOpen"
      :visible="true"
      :disabled="savingRestaurant || loadingDetails || loadingMenu || loadingCompetitors || loadingSocialMedia"
      :loading="savingRestaurant"
      :saved="isSaved"
      :restaurant-name="selectedRestaurant.name"
      @back="clearSelection"
      @continue="saveAndContinue"
    />

    <!-- Progress Modal -->
    <ProgressModal
      v-model="showProgressModal"
      :title="$t('restaurantSearch.savingRestaurant')"
      :progress="progressPercentage"
      :current-message="progressMessage"
      :steps="progressSteps"
      :current-step-index="currentProgressStep"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import BaseAlert from '../components/BaseAlert.vue'
import RestaurantAutocomplete from '../components/RestaurantAutocomplete.vue'
import RestaurantQuickOverview from '../components/RestaurantQuickOverview.vue'
import RestaurantDetailsCard from '../components/RestaurantDetailsCard.vue'
import BrandDNACard from '../components/BrandDNACard.vue'
import ReviewsSection from '../components/ReviewsSection.vue'
import CompetitorsSection from '../components/CompetitorsSection.vue'
import MenuSection from '../components/MenuSection.vue'
import StickyCTA from '../components/StickyCTA.vue'
import ProgressModal from '../components/ProgressModal.vue'
import type { RestaurantSuggestion, PlaceDetails, CompetitorSearchResponse } from '../services/placesService'
import { placesService } from '../services/placesService'
import { menuService, type MenuData } from '../services/menuService'
import { socialMediaService, type SocialMediaSearchResult } from '../services/socialMediaService'
import { restaurantService } from '../services/restaurantService'
import { api } from '../services/api'

const router = useRouter()
const { t } = useI18n()

// Restaurant data
const selectedRestaurant = ref<RestaurantSuggestion | null>(null)
const placeDetails = ref<PlaceDetails | null>(null)
const loadingDetails = ref(false)
const menuData = ref<MenuData | null>(null)
const loadingMenu = ref(false)
const menuError = ref<string | null>(null)
const competitorData = ref<CompetitorSearchResponse | null>(null)
const loadingCompetitors = ref(false)
const competitorError = ref<string | null>(null)
const socialMediaData = ref<SocialMediaSearchResult | null>(null)
const loadingSocialMedia = ref(false)
const socialMediaError = ref<string | null>(null)
const brandDNA = ref<any | null>(null)
const loadingBrandDNA = ref(false)
const brandDNAError = ref<string | null>(null)

// Save to database state
const savingRestaurant = ref(false)
const saveError = ref<string | null>(null)
const saveSuccess = ref(false)
const saveSuccessMessage = ref<string>(t('restaurantSearch.restaurantSaved'))
const isSaved = ref(false)

// Image selection and upload
const selectedPhotoIndices = ref<number[]>([])
const uploadFiles = ref<File[]>([])
const uploadingImages = ref(false)
const uploadError = ref<string | null>(null)

// Autocomplete dropdown state
const isAutocompleteOpen = ref(false)

// Progress modal state
const showProgressModal = ref(false)
const progressPercentage = ref(0)
const progressMessage = ref('')
const progressSteps = ref<string[]>([
  t('restaurantSearch.savingData'),
  t('restaurantSearch.processingImages'),
  t('restaurantSearch.analyzingMenu'),
  t('restaurantSearch.finalizingSetup')
])
const currentProgressStep = ref(0)

// Pagination
const reviewsPage = ref(1)
const reviewsPerPage = 3
const menuPage = ref(1)
const menuItemsPerPage = 9
const competitorsPage = ref(1)
const competitorsPerPage = 5

// Scroll to top when pagination changes
const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

watch(reviewsPage, scrollToTop)
watch(menuPage, scrollToTop)
watch(competitorsPage, scrollToTop)

// Restaurant selection handler
const handleRestaurantSelect = async (restaurant: RestaurantSuggestion) => {
  // Clear previous data
  menuData.value = null
  menuError.value = null
  placeDetails.value = null
  competitorData.value = null
  competitorError.value = null
  socialMediaData.value = null
  socialMediaError.value = null
  brandDNA.value = null
  brandDNAError.value = null
  saveError.value = null
  saveSuccess.value = false
  isSaved.value = false
  reviewsPage.value = 1
  menuPage.value = 1
  competitorsPage.value = 1
  selectedPhotoIndices.value = []
  uploadFiles.value = []
  uploadError.value = null

  // Fetch place details first to get website
  await fetchPlaceDetails(restaurant.place_id)

  // Then fetch everything else in parallel (including brand DNA if website exists)
  const promises = [
    fetchMenu(restaurant.place_id, restaurant.name),
    fetchCompetitors(restaurant.place_id),
    fetchSocialMedia(restaurant.place_id)
  ]

  // Add brand DNA analysis if website is available
  const website = placeDetails.value?.website
  if (website) {
    promises.push(fetchBrandDNA(website, restaurant.place_id))
  }

  await Promise.all(promises)
}

const fetchPlaceDetails = async (placeId: string) => {
  try {
    loadingDetails.value = true
    const details = await placesService.getPlaceDetails(placeId)
    placeDetails.value = details
  } catch (error: any) {
    // Don't show error to user, just log it
    console.error('Failed to fetch place details:', error)
  } finally {
    loadingDetails.value = false
  }
}

const fetchMenu = async (placeId: string, restaurantName: string) => {
  try {
    loadingMenu.value = true
    menuError.value = null

    const data = await menuService.getRestaurantMenu(placeId, restaurantName)
    menuData.value = data

    if (!data || data.items.length === 0) {
      menuError.value = t('restaurantSearch.noMenuFound')
    }
  } catch (error: any) {
    menuError.value = error.message || t('restaurantSearch.menuNotAvailable')
  } finally {
    loadingMenu.value = false
  }
}

const fetchCompetitors = async (placeId: string) => {
  try {
    loadingCompetitors.value = true
    competitorError.value = null

    const data = await placesService.findCompetitors(placeId, 1) // 1 km radius
    competitorData.value = data

    if (!data || data.competitors.length === 0) {
      competitorError.value = t('restaurantSearch.noCompetitorsFound', { radius: 1 })
    }
  } catch (error: any) {
    competitorError.value = error.message || t('restaurantSearch.noCompetitorsFound', { radius: 1 })
  } finally {
    loadingCompetitors.value = false
  }
}

const fetchSocialMedia = async (placeId: string) => {
  try {
    loadingSocialMedia.value = true
    socialMediaError.value = null

    const data = await socialMediaService.getSocialMediaByPlaceId(placeId)
    socialMediaData.value = data

    if (!data || data.searchDetails.totalFound === 0) {
      socialMediaError.value = t('restaurantSearch.noSocialMediaFound')
    }
  } catch (error: any) {
    socialMediaError.value = error.message || t('restaurantSearch.noSocialMediaFound')
  } finally {
    loadingSocialMedia.value = false
  }
}

const fetchBrandDNA = async (website: string, placeId?: string) => {
  try {
    loadingBrandDNA.value = true
    brandDNAError.value = null

    const response = await api.analyzeBrandDNA(website, placeId)

    if (response.success && (response as any).brandDNA) {
      brandDNA.value = (response as any).brandDNA
    } else {
      brandDNAError.value = 'Could not extract brand DNA'
    }
  } catch (error: any) {
    brandDNAError.value = error.message || 'Failed to analyze brand DNA'
  } finally {
    loadingBrandDNA.value = false
  }
}

const clearSelection = () => {
  selectedRestaurant.value = null
  placeDetails.value = null
  menuData.value = null
  menuError.value = null
  competitorData.value = null
  competitorError.value = null
  socialMediaData.value = null
  socialMediaError.value = null
  brandDNA.value = null
  brandDNAError.value = null
  saveError.value = null
  saveSuccess.value = false
  isSaved.value = false
  reviewsPage.value = 1
  menuPage.value = 1
  competitorsPage.value = 1

  // Scroll to top and focus search field
  window.scrollTo({ top: 0, behavior: 'smooth' })

  // Focus the search input after a short delay to allow for DOM update
  setTimeout(() => {
    const searchInput = document.querySelector('.autocomplete-container input') as HTMLInputElement
    if (searchInput) {
      searchInput.focus()
    }
  }, 300)
}

const saveToDatabase = async () => {
  if (!selectedRestaurant.value || !placeDetails.value) {
    saveError.value = 'Missing restaurant data'
    return
  }

  try {
    savingRestaurant.value = true
    saveError.value = null
    saveSuccess.value = false

    // Prepare restaurant data for saving
    const reviews = placeDetails.value.reviews ? placeDetails.value.reviews.slice(0, 5) : null

    const restaurantData = {
      place_id: selectedRestaurant.value.place_id,
      name: selectedRestaurant.value.name,
      address: selectedRestaurant.value.address,
      location: placeDetails.value.location || null,
      phone_number: placeDetails.value.phone_number || null,
      website: placeDetails.value.website || null,
      rating: placeDetails.value.rating || null,
      user_ratings_total: placeDetails.value.user_ratings_total || null,
      types: selectedRestaurant.value.types || placeDetails.value.types || null,
      opening_hours: placeDetails.value.opening_hours || null,
      reviews,
      competitors: competitorData.value?.competitors || null,
      competitor_analysis: competitorData.value ? {
        totalFound: competitorData.value.totalFound,
        radiusKm: competitorData.value.radiusKm,
        searchCenter: competitorData.value.searchCenter
      } : null,
      menu: menuData.value || null,
      social_media: socialMediaData.value?.socialMedia || null,
      brand_dna: brandDNA.value || null,
      photos: placeDetails.value.photos ? {
        photos: placeDetails.value.photos,
        photoUrls: placeDetails.value.photoUrls
      } : null,
      selected_photo_indices: selectedPhotoIndices.value.length > 0 ? selectedPhotoIndices.value : null,
    }

    const result = await restaurantService.saveRestaurant(restaurantData)

    if (result.success) {
      saveSuccessMessage.value = result.message || t('restaurantSearch.restaurantSaved')

      // If there are files to upload, upload them now
      if (uploadFiles.value.length > 0) {
        try {
          uploadingImages.value = true
          uploadError.value = null

          const uploadResult = await restaurantService.uploadRestaurantImages(
            selectedRestaurant.value.place_id,
            uploadFiles.value
          )

          if (uploadResult.count > 0) {
            saveSuccessMessage.value += ' ' + t('restaurantSearch.imagesUploaded', { count: uploadResult.count })
          }

          uploadFiles.value = []
        } catch (uploadErr: any) {
          uploadError.value = uploadErr.message || t('restaurantSearch.failedToUpload')
        } finally {
          uploadingImages.value = false
        }
      }

      saveSuccess.value = true
      isSaved.value = true
    } else {
      if (result.error && result.error.includes('already saved')) {
        saveError.value = t('restaurantSearch.restaurantAlreadySaved')
        isSaved.value = true
      } else {
        saveError.value = result.error || t('restaurantSearch.failedToSave')
      }
    }
  } catch (error: any) {
    saveError.value = error.message || t('restaurantSearch.failedToSave')
  } finally {
    savingRestaurant.value = false
  }
}

const simulateProgress = async () => {
  progressPercentage.value = 0
  currentProgressStep.value = 0

  const steps = [
    { step: 0, message: t('restaurantSearch.savingData'), delay: 800, progress: 25 },
    { step: 1, message: t('restaurantSearch.processingImages'), delay: 1200, progress: 50 },
    { step: 2, message: t('restaurantSearch.analyzingMenu'), delay: 1000, progress: 75 },
    { step: 3, message: t('restaurantSearch.finalizingSetup'), delay: 800, progress: 100 }
  ]

  for (const stepConfig of steps) {
    currentProgressStep.value = stepConfig.step
    progressMessage.value = stepConfig.message

    const targetProgress = stepConfig.progress
    const currentProgress = progressPercentage.value
    const increment = (targetProgress - currentProgress) / 10

    for (let i = 0; i < 10; i++) {
      await new Promise(resolve => setTimeout(resolve, stepConfig.delay / 10))
      progressPercentage.value = Math.min(currentProgress + (increment * (i + 1)), targetProgress)
    }
  }
}

const saveAndContinue = async () => {
  if (isSaved.value) {
    // Already saved, show quick animation then navigate
    showProgressModal.value = true
    progressMessage.value = t('restaurantSearch.redirecting')
    progressPercentage.value = 100
    currentProgressStep.value = 3

    await new Promise(resolve => setTimeout(resolve, 800))

    showProgressModal.value = false

    router.push({
      name: 'playground',
      query: { restaurant: selectedRestaurant.value?.place_id }
    })
  } else {
    // Show progress modal
    showProgressModal.value = true

    // Start fake progress animation
    const progressPromise = simulateProgress()

    // Save to database (real operation)
    await saveToDatabase()

    // Wait for progress animation to complete
    await progressPromise

    // Keep modal visible for a moment at 100%
    await new Promise(resolve => setTimeout(resolve, 500))

    // Hide modal
    showProgressModal.value = false

    // Only navigate if save was successful
    if (isSaved.value) {
      router.push({
        name: 'playground',
        query: { restaurant: selectedRestaurant.value?.place_id }
      })
    }
  }
}
</script>

<style scoped>
.restaurant-search-view {
  min-height: 100vh;
  padding: var(--space-3xl) var(--space-2xl);
  background: var(--bg-primary);
}

.container {
  max-width: var(--max-width-lg);
  margin: 0 auto;
  padding-bottom: 120px; /* Space for sticky CTA button */
  display: flex;
  flex-direction: column;
  gap: var(--space-2xl); /* Add spacing between all sections */
}

.header {
  text-align: center;
  margin-bottom: var(--space-3xl);
  animation: fadeInUp 0.6s var(--ease-smooth);
}

.title {
  font-family: var(--font-heading);
  font-size: var(--text-4xl);
  font-weight: var(--font-bold);
  margin: 0 0 var(--space-lg) 0;
  background: var(--gradient-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  font-size: var(--text-lg);
  color: var(--text-secondary);
  margin: 0;
  line-height: var(--leading-normal);
  max-width: 600px;
  margin: 0 auto;
}

.search-wrapper {
  max-width: 900px;
  margin: 0 auto var(--space-2xl);
  animation: fadeInUp 0.6s var(--ease-smooth) 0.1s both;
}

.search-wrapper :deep(input) {
  font-size: var(--text-xl);
  padding: var(--space-xl) var(--space-2xl);
  height: auto;
  min-height: 64px;
}

.search-wrapper :deep(.autocomplete-dropdown) {
  font-size: var(--text-lg);
}

.actions-section {
  margin-top: var(--space-2xl);
  max-width: var(--max-width-lg);
  margin-left: auto;
  margin-right: auto;
}

.actions-section > * + * {
  margin-top: var(--space-md);
}

/* Animations */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .restaurant-search-view {
    padding: var(--space-2xl) var(--space-lg);
  }

  .title {
    font-size: var(--text-3xl);
  }

  .subtitle {
    font-size: var(--text-base);
  }

  .container {
    padding-bottom: 100px;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .header,
  .search-wrapper {
    animation: none;
  }
}
</style>

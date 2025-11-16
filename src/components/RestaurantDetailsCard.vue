<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseCard from './BaseCard.vue'
import BaseAlert from './BaseAlert.vue'
import OpeningHoursSection from './OpeningHoursSection.vue'
import ContactInfoSection from './ContactInfoSection.vue'
import SocialMediaLinks from './SocialMediaLinks.vue'
import ImageUpload from './ImageUpload.vue'
import SelectableImageGallery from './SelectableImageGallery.vue'
import LoadingState from './LoadingState.vue'
import EmptyState from './EmptyState.vue'

interface Photo {
  name: string
  widthPx: number
  heightPx: number
  authorAttributions?: any[]
}

interface PlaceDetails {
  rating?: number
  user_ratings_total?: number
  phone_number?: string
  website?: string
  opening_hours?: {
    open_now?: boolean
    weekday_text?: string[]
  }
  photos?: Photo[]
  photoUrls?: string[]
}

interface Restaurant {
  name: string
  address: string
  types?: string[]
}

interface SocialMediaData {
  socialMedia: {
    facebook?: string
    instagram?: string
    twitter?: string
    youtube?: string
    tiktok?: string
  }
  searchDetails: {
    totalFound: number
  }
}

interface Props {
  restaurant: Restaurant
  placeDetails?: PlaceDetails | null
  loadingDetails?: boolean
  socialMediaData?: SocialMediaData | null
  loadingSocialMedia?: boolean
  socialMediaError?: string | null
  selectedPhotoIndices: number[]
  uploadFiles: File[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:selectedPhotoIndices', value: number[]): void
  (e: 'update:uploadFiles', value: File[]): void
  (e: 'uploadError', value: string): void
}>()

const { t } = useI18n()
const uploadError = ref<string | null>(null)

const formatType = (type: string): string => {
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const handlePhotoIndicesUpdate = (value: number[]) => {
  emit('update:selectedPhotoIndices', value)
}

const handleUploadFilesUpdate = (value: File[]) => {
  emit('update:uploadFiles', value)
}

const handleUploadError = (error: string) => {
  uploadError.value = error
  emit('uploadError', error)
}
</script>

<template>
  <BaseCard variant="glass-intense" class="restaurant-details-card">
    <div class="restaurant-header">
      <div class="restaurant-header-content">
        <h2 class="restaurant-name">{{ restaurant.name }}</h2>
        <p class="restaurant-address">{{ restaurant.address }}</p>
      </div>
    </div>

    <div class="restaurant-content">
      <!-- Types Tags -->
      <div v-if="restaurant.types && restaurant.types.length > 0" class="detail-section">
        <div class="type-tags">
          <span
            v-for="type in restaurant.types.slice(0, 5)"
            :key="type"
            class="type-tag"
          >
            {{ formatType(type) }}
          </span>
        </div>
      </div>

      <!-- Opening Hours -->
      <div v-if="placeDetails" class="detail-section">
        <OpeningHoursSection
          :opening-hours="placeDetails.opening_hours"
          :loading="loadingDetails"
        />
      </div>

      <!-- Contact Information -->
      <div class="detail-section">
        <ContactInfoSection
          :rating="placeDetails?.rating"
          :user-ratings-total="placeDetails?.user_ratings_total"
          :phone-number="placeDetails?.phone_number"
          :website="placeDetails?.website"
        />
      </div>

      <!-- Google Photos Gallery with Selection -->
      <div v-if="placeDetails && placeDetails.photos && placeDetails.photos.length > 0 && placeDetails.photoUrls" class="detail-section">
        <SelectableImageGallery
          :model-value="selectedPhotoIndices"
          @update:model-value="handlePhotoIndicesUpdate"
          :images="placeDetails.photos.map((photo, idx) => ({
            url: placeDetails.photoUrls![idx] || '',
            name: photo.name,
            width: photo.widthPx,
            height: photo.heightPx,
            authorAttributions: photo.authorAttributions || []
          }))"
          :title="t('restaurantSearch.googlePhotos')"
          :show-select-all="true"
        />
      </div>

      <!-- Image Upload Section -->
      <div class="detail-section">
        <h3 class="section-subtitle">{{ t('restaurantSearch.uploadOwnImages') }}</h3>
        <ImageUpload
          :model-value="uploadFiles"
          @update:model-value="handleUploadFilesUpdate"
          :max-files="10"
          :max-size-m-b="5"
          @error="handleUploadError"
        />
        <BaseAlert v-if="uploadError" type="error" class="upload-alert">
          {{ uploadError }}
        </BaseAlert>
      </div>

      <!-- Social Media -->
      <div class="detail-section">
        <h3 class="section-subtitle">{{ t('restaurantSearch.socialMediaTitle') }}</h3>

        <LoadingState
          v-if="loadingSocialMedia"
          :message="t('restaurantSearch.findingSocialMedia')"
        />

        <SocialMediaLinks
          v-else-if="socialMediaData && socialMediaData.searchDetails.totalFound > 0"
          :links="socialMediaData.socialMedia"
        />

        <EmptyState
          v-else-if="socialMediaError"
          :message="socialMediaError"
        />

        <EmptyState
          v-else
          :message="t('restaurantSearch.noSocialMediaFound')"
        />
      </div>
    </div>
  </BaseCard>
</template>

<style scoped>
.restaurant-details-card {
  animation: fadeInUp 0.6s var(--ease-smooth);
}

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

.restaurant-header {
  padding-bottom: var(--space-xl);
  margin-bottom: var(--space-xl);
  border-bottom: 1px solid rgba(212, 175, 55, 0.15);
}

.restaurant-header-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.restaurant-name {
  font-family: var(--font-heading);
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  margin: 0;
  background: var(--gradient-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.restaurant-address {
  font-size: var(--text-base);
  color: var(--text-secondary);
  margin: 0;
}

.restaurant-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xl);
}

.detail-section {
  padding: var(--space-lg) 0;
}

.detail-section:not(:last-child) {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.section-subtitle {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--space-lg) 0;
}

.type-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.type-tag {
  padding: var(--space-xs) var(--space-md);
  background: rgba(212, 175, 55, 0.1);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--gold-light);
  transition: var(--transition-base);
}

.type-tag:hover {
  background: rgba(212, 175, 55, 0.15);
  border-color: rgba(212, 175, 55, 0.5);
}

.upload-alert {
  margin-top: var(--space-md);
}

/* Responsive */
@media (max-width: 768px) {
  .restaurant-name {
    font-size: var(--text-2xl);
  }

  .restaurant-address {
    font-size: var(--text-sm);
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .restaurant-details-card {
    animation: none;
  }

  .type-tag {
    transition: none;
  }
}
</style>

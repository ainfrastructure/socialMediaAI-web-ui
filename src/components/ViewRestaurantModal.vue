<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { restaurantService } from '@/services/restaurantService'
import { businessService } from '@/services/businessService'
import { useBusinessesStore } from '@/stores/businesses'
import { useRestaurantsStore } from '@/stores/restaurants'
import type { SavedRestaurant, UpdateRestaurantData } from '@/services/restaurantService'
import BaseModal from './BaseModal.vue'
import BaseButton from './BaseButton.vue'
import BaseInput from './BaseInput.vue'
import BaseAlert from './BaseAlert.vue'
import MaterialIcon from './MaterialIcon.vue'
import LogoUpload from './LogoUpload.vue'
import ColorPicker from './ColorPicker.vue'
import RestaurantImageManager from './restaurant-images/RestaurantImageManager.vue'

const props = withDefaults(defineProps<{
  modelValue: boolean
  restaurant: SavedRestaurant
  initialTab?: 'details' | 'images'
}>(), {
  initialTab: 'details'
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'updated'): void
}>()

const { t } = useI18n()
const businessesStore = useBusinessesStore()
const restaurantsStore = useRestaurantsStore()
const activeTab = ref(props.initialTab)
const isEditing = ref(false)
const saving = ref(false)
const uploadingLogo = ref(false)
const saveError = ref('')
const logoFile = ref<File | null>(null)

const editForm = reactive({
  name: '',
  address: '',
  phone_number: '',
  website: '',
  social_media: {
    instagram: '',
    facebook: '',
    twitter: ''
  },
  brand_dna: {
    logo_url: '',
    primary_color: '',
    secondary_color: ''
  }
})

const totalImageCount = computed(() => props.restaurant.uploaded_images?.length || 0)

function handleClose() {
  emit('update:modelValue', false)
  isEditing.value = false
  saveError.value = ''
  logoFile.value = null
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      activeTab.value = props.initialTab || 'details'
    }
  }
)

watch(
  () => props.initialTab,
  (tab) => {
    if (props.modelValue) {
      activeTab.value = tab || 'details'
    }
  }
)

function startEditing() {
  // Populate form with current restaurant data
  editForm.name = props.restaurant.name || ''
  editForm.address = props.restaurant.address || ''
  editForm.phone_number = props.restaurant.phone_number || ''
  editForm.website = props.restaurant.website || ''
  editForm.social_media.instagram = props.restaurant.social_media?.instagram || ''
  editForm.social_media.facebook = props.restaurant.social_media?.facebook || ''
  editForm.social_media.twitter = props.restaurant.social_media?.twitter || ''
  editForm.brand_dna.logo_url = props.restaurant.brand_dna?.logo_url || ''
  editForm.brand_dna.primary_color = props.restaurant.brand_dna?.primary_color || '#0f3d2e'
  editForm.brand_dna.secondary_color = props.restaurant.brand_dna?.secondary_color || '#1a5a45'

  isEditing.value = true
  saveError.value = ''
}

function cancelEditing() {
  isEditing.value = false
  saveError.value = ''
  logoFile.value = null
}

function handleLogoUpload(file: File) {
  logoFile.value = file
}

function handleLogoError(message: string) {
  saveError.value = message
}

async function saveChanges() {
  saveError.value = ''
  saving.value = true

  try {
    const restaurantId = props.restaurant.place_id || props.restaurant.id
    const isBusinessLinked = !!props.restaurant.business_id
    const businessId = props.restaurant.business_id || ''
    console.log('Saving restaurant changes for:', restaurantId)

    // Upload logo only for standalone restaurants (business-linked branding is managed in Business)
    let logoUrl = editForm.brand_dna.logo_url
    if (!isBusinessLinked && logoFile.value) {
      console.log('New logo file detected, uploading...')
      uploadingLogo.value = true
      try {
        logoUrl = await restaurantService.uploadLogo(restaurantId, logoFile.value)
        console.log('Logo uploaded, URL:', logoUrl)
      } catch (err: any) {
        console.error('Failed to upload logo:', err)
        saveError.value = t('restaurantManagement.errors.logoUploadFailed')
        saving.value = false
        uploadingLogo.value = false
        return
      } finally {
        uploadingLogo.value = false
      }
    }

    if (isBusinessLinked) {
      let businessLogoUrl = logoUrl
      if (logoFile.value) {
        uploadingLogo.value = true
        try {
          const uploadResult = await businessService.uploadBusinessImages(
            businessId,
            [logoFile.value],
            'logos'
          )
          businessLogoUrl = uploadResult.uploaded?.[0]?.url || businessLogoUrl
        } catch (err: any) {
          console.error('Failed to upload business logo:', err)
          saveError.value = t('restaurantManagement.errors.logoUploadFailed')
          saving.value = false
          uploadingLogo.value = false
          return
        } finally {
          uploadingLogo.value = false
        }
      }

      const businessUpdate = {
        name: editForm.name || props.restaurant.name,
        address: editForm.address || null,
        phone_number: editForm.phone_number || null,
        website: editForm.website || null,
        social_media: {
          instagram: editForm.social_media.instagram || null,
          facebook: editForm.social_media.facebook || null,
          twitter: editForm.social_media.twitter || null
        },
        logo_url: businessLogoUrl || null,
        brand_dna: {
          ...(props.restaurant as any).brand_dna,
          logo_url: businessLogoUrl || null,
          primary_color: editForm.brand_dna.primary_color,
          secondary_color: editForm.brand_dna.secondary_color
        }
      }

      // Use store method to update in-place (updates both API and local state)
      const updatedBusiness = await businessesStore.updateBusiness(businessId, businessUpdate)
      if (!updatedBusiness) {
        throw new Error(businessesStore.error || 'Failed to update business')
      }
    } else {
      const updateData: UpdateRestaurantData = {
        website: editForm.website || null,
        social_media: {
          instagram: editForm.social_media.instagram || null,
          facebook: editForm.social_media.facebook || null,
          twitter: editForm.social_media.twitter || null
        }
      }

      if (props.restaurant.is_manual && !props.restaurant.business_id) {
        updateData.name = editForm.name
        updateData.address = editForm.address
        updateData.phone_number = editForm.phone_number || null
        updateData.brand_dna = {
          logo_url: logoUrl || null,
          primary_color: editForm.brand_dna.primary_color,
          secondary_color: editForm.brand_dna.secondary_color
        }
      }

      const updateResponse = await restaurantService.updateRestaurant(restaurantId, updateData)
      if (!updateResponse.success) {
        throw new Error(updateResponse.message || 'Failed to update restaurant')
      }
    }

    // Refresh restaurants store so parent components get fresh data
    await restaurantsStore.fetchRestaurants()

    emit('updated')
    isEditing.value = false
    logoFile.value = null
  } catch (err: any) {
    console.error('Save failed:', err)
    saveError.value = err.message || 'Failed to save changes'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <BaseModal :model-value="modelValue" @update:model-value="handleClose" size="xl">
    <template #title>
      <span class="modal-title-text">{{ restaurant.name }}</span>
    </template>

    <!-- Tabs -->
    <div class="tabs">
      <button
        :class="['tab-btn', { active: activeTab === 'details' }]"
        @click="activeTab = 'details'"
      >
        <MaterialIcon icon="info" size="sm" :color="activeTab === 'details' ? 'var(--gold-primary)' : 'var(--text-muted)'" />
        {{ $t('restaurantManagement.details') }}
      </button>
      <button
        :class="['tab-btn', { active: activeTab === 'images' }]"
        @click="activeTab = 'images'"
      >
        <MaterialIcon icon="photo_library" size="sm" :color="activeTab === 'images' ? 'var(--gold-primary)' : 'var(--text-muted)'" />
        {{ $t('restaurantManagement.images') }}
        <span v-if="totalImageCount" class="tab-count">{{ totalImageCount }}</span>
      </button>
    </div>

    <!-- Details Tab -->
    <div v-if="activeTab === 'details'" class="tab-content">
      <!-- Edit/Save/Cancel Actions -->
      <div v-if="!isEditing" class="details-actions">
        <BaseButton @click="startEditing" variant="ghost" size="small">
          <MaterialIcon icon="edit" size="sm" color="var(--text-secondary)" />
          {{ $t('common.edit') }}
        </BaseButton>
      </div>
      <div v-else class="details-actions editing">
        <BaseButton @click="cancelEditing" variant="ghost" size="small" :disabled="saving || uploadingLogo">
          {{ $t('common.cancel') }}
        </BaseButton>
        <BaseButton @click="saveChanges" variant="primary" size="small" :disabled="saving || uploadingLogo">
          {{ saving || uploadingLogo ? $t('common.saving') : $t('common.save') }}
        </BaseButton>
      </div>

      <BaseAlert v-if="saveError" type="error" class="save-error">
        {{ saveError }}
      </BaseAlert>

      <div class="details-view">
        <div class="detail-section">
          <div class="section-header">
            <MaterialIcon icon="apartment" size="sm" color="var(--gold-primary)" />
            <h3>{{ $t('restaurantManagement.basicInfo') }}</h3>
          </div>
          <div v-if="!isEditing" class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">{{ $t('restaurantManagement.restaurantName') }}</span>
              <span class="detail-value">{{ restaurant.name }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">{{ $t('restaurantManagement.address') }}</span>
              <span class="detail-value">{{ restaurant.address || '—' }}</span>
            </div>
          </div>
          <div v-else class="edit-grid">
            <BaseInput
              v-model="editForm.name"
              :label="$t('restaurantManagement.restaurantName')"
              :disabled="!restaurant.is_manual"
              :hint="!restaurant.is_manual ? 'Cannot edit Google Places restaurant name' : ''"
              required
            />
            <BaseInput
              v-model="editForm.address"
              :label="$t('restaurantManagement.address')"
              :disabled="!restaurant.is_manual"
              :hint="!restaurant.is_manual ? 'Cannot edit Google Places restaurant address' : ''"
              type="textarea"
              required
            />
          </div>
        </div>

        <div v-if="restaurant.phone_number || restaurant.website || isEditing" class="detail-section">
          <div class="section-header">
            <MaterialIcon icon="call" size="sm" color="var(--gold-primary)" />
            <h3>{{ $t('restaurantManagement.contactInfo') }}</h3>
          </div>
          <div v-if="!isEditing" class="detail-grid">
            <div v-if="restaurant.phone_number" class="detail-item">
              <span class="detail-label">{{ $t('restaurantManagement.phoneNumber') }}</span>
              <span class="detail-value">{{ restaurant.phone_number }}</span>
            </div>
            <div v-if="restaurant.website" class="detail-item">
              <span class="detail-label">{{ $t('restaurantManagement.website') }}</span>
              <a :href="restaurant.website" target="_blank" class="detail-link">
                {{ restaurant.website }}
              </a>
            </div>
          </div>
          <div v-else class="edit-grid">
            <BaseInput
              v-model="editForm.phone_number"
              type="tel"
              :label="$t('restaurantManagement.phoneNumber')"
              :placeholder="$t('restaurantManagement.phoneNumberPlaceholder')"
              :disabled="!restaurant.is_manual"
              :hint="!restaurant.is_manual ? 'Cannot edit Google Places restaurant phone' : ''"
            />
            <BaseInput
              v-model="editForm.website"
              type="url"
              :label="$t('restaurantManagement.website')"
              :placeholder="$t('restaurantManagement.websitePlaceholder')"
            />
          </div>
        </div>

        <div v-if="restaurant.social_media?.instagram || restaurant.social_media?.facebook || restaurant.social_media?.twitter || isEditing" class="detail-section">
          <div class="section-header">
            <MaterialIcon icon="share" size="sm" color="var(--gold-primary)" />
            <h3>{{ $t('restaurantManagement.socialMedia') }}</h3>
          </div>
          <div v-if="!isEditing" class="detail-grid">
            <div v-if="restaurant.social_media?.instagram" class="detail-item">
              <span class="detail-label">{{ $t('restaurantManagement.instagram') }}</span>
              <span class="detail-value">{{ restaurant.social_media.instagram }}</span>
            </div>
            <div v-if="restaurant.social_media?.facebook" class="detail-item">
              <span class="detail-label">{{ $t('restaurantManagement.facebook') }}</span>
              <span class="detail-value">{{ restaurant.social_media.facebook }}</span>
            </div>
            <div v-if="restaurant.social_media?.twitter" class="detail-item">
              <span class="detail-label">{{ $t('restaurantManagement.twitter') }}</span>
              <span class="detail-value">{{ restaurant.social_media.twitter }}</span>
            </div>
          </div>
          <div v-else class="edit-grid">
            <BaseInput
              v-model="editForm.social_media.instagram"
              :label="$t('restaurantManagement.instagram')"
              :placeholder="$t('restaurantManagement.instagramPlaceholder')"
            />
            <BaseInput
              v-model="editForm.social_media.facebook"
              :label="$t('restaurantManagement.facebook')"
              :placeholder="$t('restaurantManagement.facebookPlaceholder')"
            />
            <BaseInput
              v-model="editForm.social_media.twitter"
              :label="$t('restaurantManagement.twitter')"
              :placeholder="$t('restaurantManagement.twitterPlaceholder')"
            />
          </div>
        </div>

        <div class="detail-section">
          <div class="section-header">
            <MaterialIcon icon="palette" size="sm" color="var(--gold-primary)" />
            <h3>{{ $t('restaurantManagement.branding') }}</h3>
          </div>
          <div v-if="!isEditing" class="detail-grid">
            <div v-if="restaurant.brand_dna?.logo_url" class="detail-item">
              <span class="detail-label">{{ $t('restaurantManagement.logo') }}</span>
              <img :src="restaurant.brand_dna.logo_url" alt="Logo" class="brand-logo" />
            </div>
            <div v-if="restaurant.brand_dna?.primary_color" class="detail-item">
              <span class="detail-label">{{ $t('restaurantManagement.primaryColor') }}</span>
              <div class="color-preview">
                <div class="color-swatch" :style="{ backgroundColor: restaurant.brand_dna.primary_color }"></div>
                <span class="detail-value">{{ restaurant.brand_dna.primary_color }}</span>
              </div>
            </div>
            <div v-if="restaurant.brand_dna?.secondary_color" class="detail-item">
              <span class="detail-label">{{ $t('restaurantManagement.secondaryColor') }}</span>
              <div class="color-preview">
                <div class="color-swatch" :style="{ backgroundColor: restaurant.brand_dna.secondary_color }"></div>
                <span class="detail-value">{{ restaurant.brand_dna.secondary_color }}</span>
              </div>
            </div>
            <div v-if="!restaurant.brand_dna?.logo_url && !restaurant.brand_dna?.primary_color" class="detail-note">
              <MaterialIcon icon="info" size="xs" color="var(--text-muted)" />
              {{ $t('restaurantManagement.noBrandingYet', 'No branding configured yet. Click Edit to set up your logo and brand colors.') }}
            </div>
          </div>
          <div v-else class="edit-grid">
            <div class="logo-section">
              <label class="form-label">{{ $t('restaurantManagement.logo') }}</label>
              <LogoUpload
                v-model="editForm.brand_dna.logo_url"
                :uploading="uploadingLogo"
                @upload="handleLogoUpload"
                @error="handleLogoError"
              />
            </div>
            <div class="color-inputs">
              <ColorPicker
                v-model="editForm.brand_dna.primary_color"
                :label="$t('restaurantManagement.primaryColor')"
              />
              <ColorPicker
                v-model="editForm.brand_dna.secondary_color"
                :label="$t('restaurantManagement.secondaryColor')"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Images Tab -->
    <div v-if="activeTab === 'images'" class="tab-content images-tab">
      <RestaurantImageManager :restaurant="restaurant" @updated="emit('updated')" />
    </div>
  </BaseModal>
</template>

<style scoped>
/* ===== Modal Title ===== */
.modal-title-text {
  font-family: var(--font-heading);
  letter-spacing: -0.02em;
}

/* ===== Tabs ===== */
.tabs {
  display: flex;
  gap: var(--space-xs);
  margin-bottom: var(--space-xl);
  padding: var(--space-xs);
  background: var(--bg-tertiary);
  border-radius: var(--radius-lg);
}

.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-xl);
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  color: var(--text-muted);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: all 0.25s ease;
}

.tab-btn:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.5);
}

.tab-btn.active {
  color: var(--gold-primary);
  background: var(--bg-secondary);
  box-shadow: var(--shadow-sm);
  font-weight: var(--font-semibold);
}

.tab-count {
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
  color: var(--text-on-gold);
  background: var(--gold-primary);
  padding: 1px 7px;
  border-radius: var(--radius-full);
  min-width: 20px;
  text-align: center;
}

/* ===== Tab Content ===== */
.tab-content {
  padding: var(--space-lg);
  max-height: 60vh;
  overflow-y: auto;
}

.tab-content.images-tab {
  padding: 0;
  max-height: none;
  overflow: visible;
}

/* ===== Details Actions ===== */
.details-actions {
  display: flex;
  gap: var(--space-md);
  justify-content: flex-end;
  margin-bottom: var(--space-xl);
}

.details-actions.editing {
  padding-bottom: var(--space-lg);
  border-bottom: 1px solid var(--border-color);
}

.save-error {
  margin-bottom: var(--space-lg);
}

/* ===== Details View ===== */
.details-view {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

/* ===== Detail Section ===== */
.detail-section {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  padding: var(--space-xl);
}

.detail-section .section-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-lg);
  padding-bottom: var(--space-md);
  border-bottom: 1px solid var(--border-color);
}

.detail-section .section-header h3 {
  font-family: var(--font-heading);
  font-size: var(--text-base);
  color: var(--text-primary);
  letter-spacing: -0.01em;
  margin: 0;
}

.detail-note {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--text-sm);
  color: var(--text-muted);
  font-style: italic;
}

/* ===== Detail Grid ===== */
.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-lg);
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.detail-label {
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.detail-value {
  font-size: var(--text-base);
  color: var(--text-primary);
  font-weight: var(--font-medium);
}

.detail-link {
  color: var(--gold-primary);
  text-decoration: none;
  font-weight: var(--font-medium);
  transition: var(--transition-base);
}

.detail-link:hover {
  text-decoration: underline;
  color: var(--gold-light);
}

/* ===== Edit Grid ===== */
.edit-grid {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

/* ===== Branding ===== */
.brand-logo {
  max-width: 100px;
  max-height: 100px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  object-fit: cover;
}

.color-preview {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.color-swatch {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  border: 2px solid rgba(255, 255, 255, 0.3);
  box-shadow: var(--shadow-sm);
}

.logo-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  margin-bottom: var(--space-lg);
}

.form-label {
  display: block;
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-family: var(--font-body);
}

.color-inputs {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-md);
}

/* ===== Responsive ===== */
@media (max-width: 768px) {
  .tabs {
    overflow-x: auto;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }

  .tab-content {
    max-height: 70vh;
  }

  .tab-content.images-tab {
    max-height: none;
  }

  .details-actions {
    flex-direction: column-reverse;
  }

  .details-actions button {
    width: 100%;
  }

  .color-inputs {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .tab-btn {
    transition: none;
  }
}
</style>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { restaurantService } from '@/services/restaurantService'
import type { SavedRestaurant, UpdateRestaurantData } from '@/services/restaurantService'
import BaseModal from './BaseModal.vue'
import BaseButton from './BaseButton.vue'
import BaseInput from './BaseInput.vue'
import BaseAlert from './BaseAlert.vue'
import LogoUpload from './LogoUpload.vue'
import ColorPicker from './ColorPicker.vue'
import RestaurantImageManager from './restaurant-images/RestaurantImageManager.vue'

const props = defineProps<{
  modelValue: boolean
  restaurant: SavedRestaurant
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'updated'): void
}>()

const { t } = useI18n()
const activeTab = ref('details')
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
    console.log('Saving restaurant changes for:', restaurantId)

    // Upload logo first if there's a new one
    let logoUrl = editForm.brand_dna.logo_url
    if (logoFile.value) {
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

    // For manual restaurants, we can update more fields
    // For Google Places restaurants, only certain fields are editable
    const updateData: UpdateRestaurantData = {
      website: editForm.website || null,
      social_media: {
        instagram: editForm.social_media.instagram || null,
        facebook: editForm.social_media.facebook || null,
        twitter: editForm.social_media.twitter || null
      }
    }

    // If it's a manual restaurant, we can also update name, address, phone, and branding
    if (props.restaurant.is_manual) {
      updateData.name = editForm.name
      updateData.address = editForm.address
      updateData.phone_number = editForm.phone_number || null
      updateData.brand_dna = {
        logo_url: logoUrl || null,
        primary_color: editForm.brand_dna.primary_color,
        secondary_color: editForm.brand_dna.secondary_color
      }
    }

    console.log('Updating restaurant with data:', updateData)
    const updateResponse = await restaurantService.updateRestaurant(restaurantId, updateData)
    console.log('Restaurant updated successfully, response:', updateResponse)

    // Emit updated event and wait for parent to refresh
    emit('updated')

    // Wait for parent to fetch and update before exiting edit mode
    await new Promise(resolve => setTimeout(resolve, 500))

    console.log('Exiting edit mode')
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
    <template #title>{{ restaurant.name }}</template>

    <!-- Tabs -->
    <div class="tabs">
      <button
        :class="['tab-btn', { active: activeTab === 'details' }]"
        @click="activeTab = 'details'"
      >
        {{ $t('restaurantManagement.details') }}
      </button>
      <button
        :class="['tab-btn', { active: activeTab === 'images' }]"
        @click="activeTab = 'images'"
      >
        {{ $t('restaurantManagement.images') }}
        <span v-if="totalImageCount" class="tab-count">({{ totalImageCount }})</span>
      </button>
    </div>

    <!-- Details Tab -->
    <div v-if="activeTab === 'details'" class="tab-content">
      <!-- Edit/Save/Cancel Actions -->
      <div v-if="!isEditing" class="details-actions">
        <BaseButton @click="startEditing" variant="primary" size="small">
          {{ $t('common.edit') }}
        </BaseButton>
      </div>
      <div v-else class="details-actions">
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
          <h3>{{ $t('restaurantManagement.basicInfo') }}</h3>
          <div v-if="!isEditing" class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">{{ $t('restaurantManagement.restaurantName') }}</span>
              <span class="detail-value">{{ restaurant.name }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">{{ $t('restaurantManagement.address') }}</span>
              <span class="detail-value">{{ restaurant.address }}</span>
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
          <h3>{{ $t('restaurantManagement.contactInfo') }}</h3>
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
          <h3>{{ $t('restaurantManagement.socialMedia') }}</h3>
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

        <div v-if="restaurant.brand_dna?.logo_url || restaurant.brand_dna?.primary_color || isEditing" class="detail-section">
          <h3>{{ $t('restaurantManagement.branding') }}</h3>
          <div v-if="!isEditing" class="detail-grid">
            <div v-if="restaurant.brand_dna?.logo_url" class="detail-item">
              <span class="detail-label">{{ $t('restaurantManagement.logo') }}</span>
              <img :src="restaurant.brand_dna.logo_url" alt="Logo" class="brand-logo" />
            </div>
            <div v-if="restaurant.brand_dna?.primary_color" class="detail-item">
              <span class="detail-label">{{ $t('restaurantManagement.primaryColor') }}</span>
              <div class="color-preview">
                <div class="color-swatch" :style="{ backgroundColor: restaurant.brand_dna.primary_color }"></div>
                <span>{{ restaurant.brand_dna.primary_color }}</span>
              </div>
            </div>
            <div v-if="restaurant.brand_dna?.secondary_color" class="detail-item">
              <span class="detail-label">{{ $t('restaurantManagement.secondaryColor') }}</span>
              <div class="color-preview">
                <div class="color-swatch" :style="{ backgroundColor: restaurant.brand_dna.secondary_color }"></div>
                <span>{{ restaurant.brand_dna.secondary_color }}</span>
              </div>
            </div>
          </div>
          <div v-else class="edit-grid">
            <div class="logo-section">
              <label class="form-label">{{ $t('restaurantManagement.logo') }}</label>
              <LogoUpload
                v-model="editForm.brand_dna.logo_url"
                :uploading="uploadingLogo"
                :disabled="!restaurant.is_manual"
                @upload="handleLogoUpload"
                @error="handleLogoError"
              />
            </div>
            <div class="color-inputs">
              <ColorPicker
                v-model="editForm.brand_dna.primary_color"
                :label="$t('restaurantManagement.primaryColor')"
                :disabled="!restaurant.is_manual"
              />
              <ColorPicker
                v-model="editForm.brand_dna.secondary_color"
                :label="$t('restaurantManagement.secondaryColor')"
                :disabled="!restaurant.is_manual"
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
.tabs {
  display: flex;
  gap: var(--space-sm);
  margin-bottom: var(--space-xl);
  border-bottom: 2px solid rgba(15, 61, 46, 0.1);
}

.tab-btn {
  padding: var(--space-md) var(--space-xl);
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--text-secondary);
  font-family: var(--font-body);
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: var(--transition-base);
  margin-bottom: -2px;
}

.tab-btn:hover {
  color: var(--text-primary);
}

.tab-btn.active {
  color: var(--gold-primary);
  border-bottom-color: var(--gold-primary);
}

.tab-count {
  font-size: var(--text-sm);
  color: var(--text-muted);
  margin-left: var(--space-xs);
}

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

/* Details Tab */
.details-actions {
  display: flex;
  gap: var(--space-md);
  justify-content: flex-end;
  margin-bottom: var(--space-lg);
  padding-bottom: var(--space-lg);
  border-bottom: 1px solid rgba(15, 61, 46, 0.1);
}

.save-error {
  margin-bottom: var(--space-lg);
}

.details-view {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xl);
}

.edit-grid {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.detail-section h3 {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  color: var(--text-primary);
  margin-bottom: var(--space-lg);
  padding-bottom: var(--space-sm);
  border-bottom: 1px solid rgba(15, 61, 46, 0.1);
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--space-lg);
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.detail-label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
}

.detail-value {
  font-size: var(--text-base);
  color: var(--text-primary);
}

.detail-link {
  color: var(--gold-primary);
  text-decoration: none;
  transition: var(--transition-base);
}

.detail-link:hover {
  text-decoration: underline;
}

.brand-logo {
  max-width: 120px;
  max-height: 120px;
  border-radius: var(--radius-md);
  border: 1px solid rgba(15, 61, 46, 0.1);
}

.color-preview {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.color-swatch {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  border: 1px solid rgba(15, 61, 46, 0.2);
}

.logo-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  margin-bottom: var(--space-lg);
}

.form-label {
  display: block;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
  font-family: var(--font-body);
}

.color-inputs {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-md);
}

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
  .tab-btn,
  .image-item,
  .delete-btn,
  .image-info {
    transition: none;
  }
}
</style>

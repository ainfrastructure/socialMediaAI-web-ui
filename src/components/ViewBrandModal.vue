<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { brandService } from '@/services/brandService'
import type { Brand, UpdateBrandData } from '@/services/brandService'
import BaseModal from './BaseModal.vue'
import BaseButton from './BaseButton.vue'
import BaseInput from './BaseInput.vue'
import BaseAlert from './BaseAlert.vue'
import LogoUpload from './LogoUpload.vue'
import ColorPicker from './ColorPicker.vue'
import BrandImageManager from './brand-images/BrandImageManager.vue'

const props = defineProps<{
  modelValue: boolean
  brand: Brand
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

function handleClose() {
  emit('update:modelValue', false)
  isEditing.value = false
  saveError.value = ''
  logoFile.value = null
}

function startEditing() {
  // Populate form with current brand data
  editForm.name = props.brand.name || ''
  editForm.address = props.brand.address || ''
  editForm.phone_number = props.brand.phone_number || ''
  editForm.website = props.brand.website || ''
  editForm.social_media.instagram = props.brand.social_media?.instagram || ''
  editForm.social_media.facebook = props.brand.social_media?.facebook || ''
  editForm.social_media.twitter = props.brand.social_media?.twitter || ''
  editForm.brand_dna.logo_url = (props.brand.brand_dna?.logo_url as string) || ''
  editForm.brand_dna.primary_color = (props.brand.brand_dna?.primary_color as string) || '#0f3d2e'
  editForm.brand_dna.secondary_color = (props.brand.brand_dna?.secondary_color as string) || '#1a5a45'

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

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Strip the data URL prefix (e.g. "data:image/png;base64,")
      const base64 = result.split(',')[1] || result
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function saveChanges() {
  saveError.value = ''
  saving.value = true

  try {
    const brandId = props.brand.place_id || props.brand.id
    console.log('Saving brand changes for:', brandId)

    // Upload logo first if there's a new one
    let logoUrl = editForm.brand_dna.logo_url
    if (logoFile.value) {
      console.log('New logo file detected, uploading...')
      uploadingLogo.value = true
      try {
        const base64 = await fileToBase64(logoFile.value)
        const response = await brandService.uploadLogo(brandId, {
          base64,
          mimeType: logoFile.value.type,
        })
        if (!response.success || !response.data) {
          throw new Error(response.error || 'Upload failed')
        }
        logoUrl = response.data.url
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

    // For manual brands, we can update more fields
    // For Google Places brands, only certain fields are editable
    const updateData: UpdateBrandData = {
      website: editForm.website || null,
      social_media: {
        instagram: editForm.social_media.instagram || null,
        facebook: editForm.social_media.facebook || null,
        twitter: editForm.social_media.twitter || null
      }
    }

    // If it's a manual brand, we can also update name, address, phone, and branding
    if (props.brand.is_manual) {
      updateData.name = editForm.name
      updateData.address = editForm.address
      updateData.phone_number = editForm.phone_number || null
      updateData.brand_dna = {
        logo_url: logoUrl || null,
        primary_color: editForm.brand_dna.primary_color,
        secondary_color: editForm.brand_dna.secondary_color
      }
    }

    console.log('Updating brand with data:', updateData)
    const updateResponse = await brandService.updateBrand(brandId, updateData)
    console.log('Brand updated successfully, response:', updateResponse)

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
    <template #title>{{ brand.name }}</template>

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
              <span class="detail-label">{{ $t('restaurantManagement.brandName') }}</span>
              <span class="detail-value">{{ brand.name }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">{{ $t('restaurantManagement.address') }}</span>
              <span class="detail-value">{{ brand.address }}</span>
            </div>
          </div>
          <div v-else class="edit-grid">
            <BaseInput
              v-model="editForm.name"
              :label="$t('restaurantManagement.brandName')"
              :disabled="!brand.is_manual"
              :hint="!brand.is_manual ? 'Cannot edit Google Places brand name' : ''"
              required
            />
            <BaseInput
              v-model="editForm.address"
              :label="$t('restaurantManagement.address')"
              :disabled="!brand.is_manual"
              :hint="!brand.is_manual ? 'Cannot edit Google Places brand address' : ''"
              type="textarea"
              required
            />
          </div>
        </div>

        <div v-if="brand.phone_number || brand.website || isEditing" class="detail-section">
          <h3>{{ $t('restaurantManagement.contactInfo') }}</h3>
          <div v-if="!isEditing" class="detail-grid">
            <div v-if="brand.phone_number" class="detail-item">
              <span class="detail-label">{{ $t('restaurantManagement.phoneNumber') }}</span>
              <span class="detail-value">{{ brand.phone_number }}</span>
            </div>
            <div v-if="brand.website" class="detail-item">
              <span class="detail-label">{{ $t('restaurantManagement.website') }}</span>
              <a :href="brand.website" target="_blank" class="detail-link">
                {{ brand.website }}
              </a>
            </div>
          </div>
          <div v-else class="edit-grid">
            <BaseInput
              v-model="editForm.phone_number"
              type="tel"
              :label="$t('restaurantManagement.phoneNumber')"
              :placeholder="$t('restaurantManagement.phoneNumberPlaceholder')"
              :disabled="!brand.is_manual"
              :hint="!brand.is_manual ? 'Cannot edit Google Places brand phone' : ''"
            />
            <BaseInput
              v-model="editForm.website"
              type="url"
              :label="$t('restaurantManagement.website')"
              :placeholder="$t('restaurantManagement.websitePlaceholder')"
            />
          </div>
        </div>

        <div v-if="brand.social_media?.instagram || brand.social_media?.facebook || brand.social_media?.twitter || isEditing" class="detail-section">
          <h3>{{ $t('restaurantManagement.socialMedia') }}</h3>
          <div v-if="!isEditing" class="detail-grid">
            <div v-if="brand.social_media?.instagram" class="detail-item">
              <span class="detail-label">{{ $t('restaurantManagement.instagram') }}</span>
              <span class="detail-value">{{ brand.social_media.instagram }}</span>
            </div>
            <div v-if="brand.social_media?.facebook" class="detail-item">
              <span class="detail-label">{{ $t('restaurantManagement.facebook') }}</span>
              <span class="detail-value">{{ brand.social_media.facebook }}</span>
            </div>
            <div v-if="brand.social_media?.twitter" class="detail-item">
              <span class="detail-label">{{ $t('restaurantManagement.twitter') }}</span>
              <span class="detail-value">{{ brand.social_media.twitter }}</span>
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

        <div v-if="brand.brand_dna?.logo_url || brand.brand_dna?.primary_color || isEditing" class="detail-section">
          <h3>{{ $t('restaurantManagement.branding') }}</h3>
          <div v-if="!isEditing" class="detail-grid">
            <div v-if="brand.brand_dna?.logo_url" class="detail-item">
              <span class="detail-label">{{ $t('restaurantManagement.logo') }}</span>
              <img :src="brand.brand_dna.logo_url" alt="Logo" class="brand-logo" />
            </div>
            <div v-if="brand.brand_dna?.primary_color" class="detail-item">
              <span class="detail-label">{{ $t('restaurantManagement.primaryColor') }}</span>
              <div class="color-preview">
                <div class="color-swatch" :style="{ backgroundColor: brand.brand_dna.primary_color as string }"></div>
                <span>{{ brand.brand_dna.primary_color }}</span>
              </div>
            </div>
            <div v-if="brand.brand_dna?.secondary_color" class="detail-item">
              <span class="detail-label">{{ $t('restaurantManagement.secondaryColor') }}</span>
              <div class="color-preview">
                <div class="color-swatch" :style="{ backgroundColor: brand.brand_dna.secondary_color as string }"></div>
                <span>{{ brand.brand_dna.secondary_color }}</span>
              </div>
            </div>
          </div>
          <div v-else class="edit-grid">
            <div class="logo-section">
              <label class="form-label">{{ $t('restaurantManagement.logo') }}</label>
              <LogoUpload
                v-model="editForm.brand_dna.logo_url"
                :uploading="uploadingLogo"
                :disabled="!brand.is_manual"
                @upload="handleLogoUpload"
                @error="handleLogoError"
              />
            </div>
            <div class="color-inputs">
              <ColorPicker
                v-model="editForm.brand_dna.primary_color"
                :label="$t('restaurantManagement.primaryColor')"
                :disabled="!brand.is_manual"
              />
              <ColorPicker
                v-model="editForm.brand_dna.secondary_color"
                :label="$t('restaurantManagement.secondaryColor')"
                :disabled="!brand.is_manual"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Images Tab -->
    <div v-if="activeTab === 'images'" class="tab-content images-tab">
      <BrandImageManager :brand="brand" @updated="emit('updated')" />
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

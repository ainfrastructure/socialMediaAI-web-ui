<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { businessService } from '@/services/businessService'
import type { SavedBusiness, UpdateBusinessData } from '@/services/businessService'
import BaseModal from './BaseModal.vue'
import BaseButton from './BaseButton.vue'
import BaseInput from './BaseInput.vue'
import BaseAlert from './BaseAlert.vue'
import LogoUpload from './LogoUpload.vue'
import ColorPicker from './ColorPicker.vue'
import BusinessImageManager from './business-images/BusinessImageManager.vue'

const props = defineProps<{
  modelValue: boolean
  business: SavedBusiness
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

const totalImageCount = computed(() => props.business.uploaded_images?.length || 0)

function handleClose() {
  emit('update:modelValue', false)
  isEditing.value = false
  saveError.value = ''
  logoFile.value = null
}

function startEditing() {
  // Populate form with current business data
  editForm.name = props.business.name || ''
  editForm.address = props.business.address || ''
  editForm.phone_number = props.business.phone_number || ''
  editForm.website = props.business.website || ''
  editForm.social_media.instagram = props.business.social_media?.instagram || ''
  editForm.social_media.facebook = props.business.social_media?.facebook || ''
  editForm.social_media.twitter = props.business.social_media?.twitter || ''
  editForm.brand_dna.logo_url = props.business.brand_dna?.logo_url || ''
  editForm.brand_dna.primary_color = props.business.brand_dna?.primary_color || '#0f3d2e'
  editForm.brand_dna.secondary_color = props.business.brand_dna?.secondary_color || '#1a5a45'

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
    const businessId = props.business.place_id || props.business.id
    console.log('Saving business changes for:', businessId)

    // Upload logo first if there's a new one
    let logoUrl = editForm.brand_dna.logo_url
    if (logoFile.value) {
      console.log('New logo file detected, uploading...')
      uploadingLogo.value = true
      try {
        logoUrl = await businessService.uploadLogo(businessId, logoFile.value)
        console.log('Logo uploaded, URL:', logoUrl)
      } catch (err: any) {
        console.error('Failed to upload logo:', err)
        saveError.value = t('businessManagement.errors.logoUploadFailed')
        saving.value = false
        uploadingLogo.value = false
        return
      } finally {
        uploadingLogo.value = false
      }
    }

    // For manual businesses, we can update more fields
    // For Google Places businesses, only certain fields are editable
    const updateData: UpdateBusinessData = {
      website: editForm.website || null,
      social_media: {
        instagram: editForm.social_media.instagram || null,
        facebook: editForm.social_media.facebook || null,
        twitter: editForm.social_media.twitter || null
      }
    }

    // If it's a manual business, we can also update name, address, phone, and branding
    if (props.business.is_manual) {
      updateData.name = editForm.name
      updateData.address = editForm.address
      updateData.phone_number = editForm.phone_number || null
      updateData.brand_dna = {
        logo_url: logoUrl || null,
        primary_color: editForm.brand_dna.primary_color,
        secondary_color: editForm.brand_dna.secondary_color
      }
    }

    console.log('Updating business with data:', updateData)
    const updateResponse = await businessService.updateBusiness(businessId, updateData)
    console.log('Business updated successfully, response:', updateResponse)

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
    <template #title>{{ business.name }}</template>

    <!-- Tabs -->
    <div class="tabs">
      <button
        :class="['tab-btn', { active: activeTab === 'details' }]"
        @click="activeTab = 'details'"
      >
        {{ $t('businessManagement.details') }}
      </button>
      <button
        :class="['tab-btn', { active: activeTab === 'images' }]"
        @click="activeTab = 'images'"
      >
        {{ $t('businessManagement.images') }}
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
          <h3>{{ $t('businessManagement.basicInfo') }}</h3>
          <div v-if="!isEditing" class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">{{ $t('businessManagement.businessName') }}</span>
              <span class="detail-value">{{ business.name }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">{{ $t('businessManagement.address') }}</span>
              <span class="detail-value">{{ business.address }}</span>
            </div>
          </div>
          <div v-else class="edit-grid">
            <BaseInput
              v-model="editForm.name"
              :label="$t('businessManagement.businessName')"
              :disabled="!business.is_manual"
              :hint="!business.is_manual ? 'Cannot edit Google Places business name' : ''"
              required
            />
            <BaseInput
              v-model="editForm.address"
              :label="$t('businessManagement.address')"
              :disabled="!business.is_manual"
              :hint="!business.is_manual ? 'Cannot edit Google Places business address' : ''"
              type="textarea"
              required
            />
          </div>
        </div>

        <div v-if="business.phone_number || business.website || isEditing" class="detail-section">
          <h3>{{ $t('businessManagement.contactInfo') }}</h3>
          <div v-if="!isEditing" class="detail-grid">
            <div v-if="business.phone_number" class="detail-item">
              <span class="detail-label">{{ $t('businessManagement.phoneNumber') }}</span>
              <span class="detail-value">{{ business.phone_number }}</span>
            </div>
            <div v-if="business.website" class="detail-item">
              <span class="detail-label">{{ $t('businessManagement.website') }}</span>
              <a :href="business.website" target="_blank" class="detail-link">
                {{ business.website }}
              </a>
            </div>
          </div>
          <div v-else class="edit-grid">
            <BaseInput
              v-model="editForm.phone_number"
              type="tel"
              :label="$t('businessManagement.phoneNumber')"
              :placeholder="$t('businessManagement.phoneNumberPlaceholder')"
              :disabled="!business.is_manual"
              :hint="!business.is_manual ? 'Cannot edit Google Places business phone' : ''"
            />
            <BaseInput
              v-model="editForm.website"
              type="url"
              :label="$t('businessManagement.website')"
              :placeholder="$t('businessManagement.websitePlaceholder')"
            />
          </div>
        </div>

        <div v-if="business.social_media?.instagram || business.social_media?.facebook || business.social_media?.twitter || isEditing" class="detail-section">
          <h3>{{ $t('businessManagement.socialMedia') }}</h3>
          <div v-if="!isEditing" class="detail-grid">
            <div v-if="business.social_media?.instagram" class="detail-item">
              <span class="detail-label">{{ $t('businessManagement.instagram') }}</span>
              <span class="detail-value">{{ business.social_media.instagram }}</span>
            </div>
            <div v-if="business.social_media?.facebook" class="detail-item">
              <span class="detail-label">{{ $t('businessManagement.facebook') }}</span>
              <span class="detail-value">{{ business.social_media.facebook }}</span>
            </div>
            <div v-if="business.social_media?.twitter" class="detail-item">
              <span class="detail-label">{{ $t('businessManagement.twitter') }}</span>
              <span class="detail-value">{{ business.social_media.twitter }}</span>
            </div>
          </div>
          <div v-else class="edit-grid">
            <BaseInput
              v-model="editForm.social_media.instagram"
              :label="$t('businessManagement.instagram')"
              :placeholder="$t('businessManagement.instagramPlaceholder')"
            />
            <BaseInput
              v-model="editForm.social_media.facebook"
              :label="$t('businessManagement.facebook')"
              :placeholder="$t('businessManagement.facebookPlaceholder')"
            />
            <BaseInput
              v-model="editForm.social_media.twitter"
              :label="$t('businessManagement.twitter')"
              :placeholder="$t('businessManagement.twitterPlaceholder')"
            />
          </div>
        </div>

        <div v-if="business.brand_dna?.logo_url || business.brand_dna?.primary_color || isEditing" class="detail-section">
          <h3>{{ $t('businessManagement.branding') }}</h3>
          <div v-if="!isEditing" class="detail-grid">
            <div v-if="business.brand_dna?.logo_url" class="detail-item">
              <span class="detail-label">{{ $t('businessManagement.logo') }}</span>
              <img :src="business.brand_dna.logo_url" alt="Logo" class="brand-logo" />
            </div>
            <div v-if="business.brand_dna?.primary_color" class="detail-item">
              <span class="detail-label">{{ $t('businessManagement.primaryColor') }}</span>
              <div class="color-preview">
                <div class="color-swatch" :style="{ backgroundColor: business.brand_dna.primary_color }"></div>
                <span>{{ business.brand_dna.primary_color }}</span>
              </div>
            </div>
            <div v-if="business.brand_dna?.secondary_color" class="detail-item">
              <span class="detail-label">{{ $t('businessManagement.secondaryColor') }}</span>
              <div class="color-preview">
                <div class="color-swatch" :style="{ backgroundColor: business.brand_dna.secondary_color }"></div>
                <span>{{ business.brand_dna.secondary_color }}</span>
              </div>
            </div>
          </div>
          <div v-else class="edit-grid">
            <div class="logo-section">
              <label class="form-label">{{ $t('businessManagement.logo') }}</label>
              <LogoUpload
                v-model="editForm.brand_dna.logo_url"
                :uploading="uploadingLogo"
                :disabled="!business.is_manual"
                @upload="handleLogoUpload"
                @error="handleLogoError"
              />
            </div>
            <div class="color-inputs">
              <ColorPicker
                v-model="editForm.brand_dna.primary_color"
                :label="$t('businessManagement.primaryColor')"
                :disabled="!business.is_manual"
              />
              <ColorPicker
                v-model="editForm.brand_dna.secondary_color"
                :label="$t('businessManagement.secondaryColor')"
                :disabled="!business.is_manual"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Images Tab -->
    <div v-if="activeTab === 'images'" class="tab-content images-tab">
      <BusinessImageManager :business="business" @updated="emit('updated')" />
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

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { useBusinessesStore } from '@/stores/businesses'
import { businessService } from '@/services/businessService'
import BaseModal from './BaseModal.vue'
import BaseInput from './BaseInput.vue'
import BaseButton from './BaseButton.vue'
import BaseAlert from './BaseAlert.vue'
import LogoUpload from './LogoUpload.vue'
import ColorPicker from './ColorPicker.vue'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'created', business: any): void
}>()

const { t } = useI18n()
const businessesStore = useBusinessesStore()
const creating = ref(false)
const uploadingLogo = ref(false)
const error = ref('')
const logoFile = ref<File | null>(null)

const form = reactive({
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
    primary_color: '#0f3d2e',
    secondary_color: '#1a5a45'
  }
})

async function handleLogoUpload(file: File) {
  logoFile.value = file
}

function handleLogoError(message: string) {
  error.value = message
}

async function handleSubmit() {
  creating.value = true
  error.value = ''

  try {
    // First create the business
    const business = await businessesStore.createManualBusiness(form)
    if (!business) {
      error.value = businessesStore.error || t('businessManagement.errors.createFailed')
      creating.value = false
      return
    }

    // If there's a logo to upload, upload it now
    if (logoFile.value) {
      uploadingLogo.value = true
      try {
        const logoUrl = await businessService.uploadLogo(business.id, logoFile.value)

        // Update the business with the logo URL
        await businessService.updateBusiness(business.id, {
          brand_dna: {
            logo_url: logoUrl,
            primary_color: form.brand_dna.primary_color,
            secondary_color: form.brand_dna.secondary_color
          }
        })

        // Refresh businesses list to get updated data
        await businessesStore.fetchBusinesses()
      } catch (err: any) {
        console.error('Failed to upload logo:', err)
        error.value = t('businessManagement.errors.logoUploadFailed')
        creating.value = false
        uploadingLogo.value = false
        return // Don't close modal if logo upload fails
      } finally {
        uploadingLogo.value = false
      }
    }

    emit('created', business)
    emit('update:modelValue', false)

    // Reset form
    form.name = ''
    form.address = ''
    form.phone_number = ''
    form.website = ''
    form.social_media.instagram = ''
    form.social_media.facebook = ''
    form.social_media.twitter = ''
    form.brand_dna.logo_url = ''
    logoFile.value = null
  } catch (err: any) {
    error.value = err.message || t('businessManagement.errors.createFailed')
  } finally {
    creating.value = false
  }
}

function handleCancel() {
  emit('update:modelValue', false)
}
</script>

<template>
  <BaseModal :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" size="xl">
    <template #title>{{ $t('businessManagement.createBusiness') }}</template>

    <form @submit.prevent="handleSubmit" class="create-form">
      <!-- Basic Info -->
      <div class="form-section">
        <h3>{{ $t('businessManagement.basicInfo') }}</h3>
        <BaseInput
          v-model="form.name"
          :label="$t('businessManagement.businessName')"
          :placeholder="$t('businessManagement.businessNamePlaceholder')"
          required
        />
        <BaseInput
          v-model="form.address"
          type="textarea"
          :label="$t('businessManagement.address')"
          :placeholder="$t('businessManagement.addressPlaceholder')"
          required
        />
      </div>

      <!-- Contact Info -->
      <div class="form-section">
        <h3>{{ $t('businessManagement.contactInfo') }}</h3>
        <BaseInput
          v-model="form.phone_number"
          type="tel"
          :label="$t('businessManagement.phoneNumber')"
          :placeholder="$t('businessManagement.phoneNumberPlaceholder')"
        />
        <BaseInput
          v-model="form.website"
          type="url"
          :label="$t('businessManagement.website')"
          :placeholder="$t('businessManagement.websitePlaceholder')"
        />
      </div>

      <!-- Social Media -->
      <div class="form-section">
        <h3>{{ $t('businessManagement.socialMedia') }}</h3>
        <BaseInput
          v-model="form.social_media.instagram"
          :label="$t('businessManagement.instagram')"
          :placeholder="$t('businessManagement.instagramPlaceholder')"
        />
        <BaseInput
          v-model="form.social_media.facebook"
          :label="$t('businessManagement.facebook')"
          :placeholder="$t('businessManagement.facebookPlaceholder')"
        />
        <BaseInput
          v-model="form.social_media.twitter"
          :label="$t('businessManagement.twitter')"
          :placeholder="$t('businessManagement.twitterPlaceholder')"
        />
      </div>

      <!-- Branding -->
      <div class="form-section">
        <h3>{{ $t('businessManagement.branding') }}</h3>
        <div class="logo-section">
          <label class="form-label">{{ $t('businessManagement.logo') }}</label>
          <LogoUpload
            v-model="form.brand_dna.logo_url"
            :uploading="uploadingLogo"
            @upload="handleLogoUpload"
            @error="handleLogoError"
          />
        </div>
        <div class="color-inputs">
          <ColorPicker
            v-model="form.brand_dna.primary_color"
            :label="$t('businessManagement.primaryColor')"
          />
          <ColorPicker
            v-model="form.brand_dna.secondary_color"
            :label="$t('businessManagement.secondaryColor')"
          />
        </div>
      </div>

      <!-- Actions -->
      <div class="form-actions">
        <BaseButton type="button" variant="ghost" @click="handleCancel" :disabled="creating || uploadingLogo">
          {{ $t('common.cancel') }}
        </BaseButton>
        <BaseButton type="submit" variant="primary" :disabled="creating || uploadingLogo">
          {{ creating || uploadingLogo ? $t('common.creating') : $t('common.create') }}
        </BaseButton>
      </div>

      <BaseAlert v-if="error" type="error">{{ error }}</BaseAlert>
    </form>
  </BaseModal>
</template>

<style scoped>
.create-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xl);
  padding: var(--space-md);
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.form-section h3 {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  color: var(--text-primary);
  padding-bottom: var(--space-sm);
  border-bottom: 1px solid rgba(15, 61, 46, 0.1);
}

.logo-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
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

.form-actions {
  display: flex;
  gap: var(--space-md);
  justify-content: flex-end;
  padding-top: var(--space-lg);
  border-top: 1px solid rgba(15, 61, 46, 0.1);
}

@media (max-width: 768px) {
  .color-inputs {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column-reverse;
  }

  .form-actions button {
    width: 100%;
  }
}
</style>

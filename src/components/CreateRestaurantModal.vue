<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRestaurantsStore } from '@/stores/restaurants'
import { restaurantService } from '@/services/restaurantService'
import BaseModal from './BaseModal.vue'
import BaseInput from './BaseInput.vue'
import BaseButton from './BaseButton.vue'
import BaseAlert from './BaseAlert.vue'
import LogoUpload from './LogoUpload.vue'
import ColorPicker from './ColorPicker.vue'

const props = defineProps<{ modelValue: boolean; businessId?: string | null }>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'created', restaurant: any): void
}>()

const { t } = useI18n()
const restaurantsStore = useRestaurantsStore()
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
    // First create the restaurant
    const restaurant = await restaurantsStore.createManualRestaurant({
      ...form,
      business_id: props.businessId || null
    })
    if (!restaurant) {
      error.value = restaurantsStore.error || t('restaurantManagement.errors.createFailed')
      creating.value = false
      return
    }

    // If there's a logo to upload, upload it now
    if (logoFile.value) {
      uploadingLogo.value = true
      try {
        const logoUrl = await restaurantService.uploadLogo(restaurant.id, logoFile.value)

        // Update the restaurant with the logo URL
        await restaurantService.updateRestaurant(restaurant.id, {
          brand_dna: {
            logo_url: logoUrl,
            primary_color: form.brand_dna.primary_color,
            secondary_color: form.brand_dna.secondary_color
          }
        })

        // Refresh restaurants list to get updated data
        await restaurantsStore.fetchRestaurants()
      } catch (err: any) {
        console.error('Failed to upload logo:', err)
        error.value = t('restaurantManagement.errors.logoUploadFailed')
        creating.value = false
        uploadingLogo.value = false
        return // Don't close modal if logo upload fails
      } finally {
        uploadingLogo.value = false
      }
    }

    emit('created', restaurant)
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
    error.value = err.message || t('restaurantManagement.errors.createFailed')
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
    <template #title>{{ $t('restaurantManagement.createRestaurant') }}</template>

    <form @submit.prevent="handleSubmit" class="create-form">
      <!-- Basic Info -->
      <div class="form-section">
        <h3>{{ $t('restaurantManagement.basicInfo') }}</h3>
        <BaseInput
          v-model="form.name"
          :label="$t('restaurantManagement.restaurantName')"
          :placeholder="$t('restaurantManagement.restaurantNamePlaceholder')"
          required
        />
        <BaseInput
          v-model="form.address"
          type="textarea"
          :label="$t('restaurantManagement.address')"
          :placeholder="$t('restaurantManagement.addressPlaceholder')"
          required
        />
      </div>

      <!-- Contact Info -->
      <div class="form-section">
        <h3>{{ $t('restaurantManagement.contactInfo') }}</h3>
        <BaseInput
          v-model="form.phone_number"
          type="tel"
          :label="$t('restaurantManagement.phoneNumber')"
          :placeholder="$t('restaurantManagement.phoneNumberPlaceholder')"
        />
        <BaseInput
          v-model="form.website"
          type="url"
          :label="$t('restaurantManagement.website')"
          :placeholder="$t('restaurantManagement.websitePlaceholder')"
        />
      </div>

      <!-- Social Media -->
      <div class="form-section">
        <h3>{{ $t('restaurantManagement.socialMedia') }}</h3>
        <BaseInput
          v-model="form.social_media.instagram"
          :label="$t('restaurantManagement.instagram')"
          :placeholder="$t('restaurantManagement.instagramPlaceholder')"
        />
        <BaseInput
          v-model="form.social_media.facebook"
          :label="$t('restaurantManagement.facebook')"
          :placeholder="$t('restaurantManagement.facebookPlaceholder')"
        />
        <BaseInput
          v-model="form.social_media.twitter"
          :label="$t('restaurantManagement.twitter')"
          :placeholder="$t('restaurantManagement.twitterPlaceholder')"
        />
      </div>

      <!-- Branding -->
      <div class="form-section">
        <h3>{{ $t('restaurantManagement.branding') }}</h3>
        <div class="logo-section">
          <label class="form-label">{{ $t('restaurantManagement.logo') }}</label>
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
            :label="$t('restaurantManagement.primaryColor')"
          />
          <ColorPicker
            v-model="form.brand_dna.secondary_color"
            :label="$t('restaurantManagement.secondaryColor')"
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

<script setup lang="ts">
import { reactive, ref, computed, watch } from 'vue'
import BaseModal from './BaseModal.vue'
import BaseInput from './BaseInput.vue'
import BaseButton from './BaseButton.vue'
import BaseAlert from './BaseAlert.vue'
import { useBrandsStore } from '@/stores/brands'
import { brandService } from '@/services/brandService'
import type { Brand, UploadAssetData } from '@/services/brandService'
import { BUSINESS_TYPE_OPTIONS } from '@/utils/businessTypes'

const props = defineProps<{
  modelValue: boolean
  brand?: Brand | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'saved'): void
}>()

const brandsStore = useBrandsStore()
const saving = ref(false)
const error = ref('')
const logoFile = ref<File | null>(null)
const logoPreviewUrl = ref<string | null>(null)

const isEdit = computed(() => !!props.brand)

const form = reactive({
  name: '',
  business_type: 'restaurant' as string,
  description: '',
  address: '',
  phone_number: '',
  website: '',
  logo_url: '',
  is_default: false,
})

function resetForm() {
  form.name = ''
  form.business_type = 'restaurant'
  form.description = ''
  form.address = ''
  form.phone_number = ''
  form.website = ''
  form.logo_url = ''
  form.is_default = false
  logoFile.value = null
  logoPreviewUrl.value = null
}

watch(
  () => props.brand,
  (brand) => {
    if (brand) {
      form.name = brand.name || ''
      form.business_type = brand.business_type
      form.description = brand.description || ''
      form.address = brand.address || ''
      form.phone_number = brand.phone_number || ''
      form.website = brand.website || ''
      form.logo_url = brand.logo_url || ''
      logoPreviewUrl.value = brand.logo_url || null
      form.is_default = !!brand.is_default
    } else {
      resetForm()
    }
  },
  { immediate: true }
)

function handleLogoFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] || null
  logoFile.value = file
  logoPreviewUrl.value = file ? URL.createObjectURL(file) : null
}

function removeLogoFile() {
  logoFile.value = null
  logoPreviewUrl.value = form.logo_url || null
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

async function handleSubmit() {
  error.value = ''

  if (!form.name.trim()) {
    error.value = 'Brand name is required.'
    return
  }

  saving.value = true

  const payload = {
    name: form.name.trim(),
    business_type: form.business_type,
    description: form.description?.trim() || null,
    address: form.address?.trim() || null,
    phone_number: form.phone_number?.trim() || null,
    website: form.website?.trim() || null,
    logo_url: form.logo_url?.trim() || null,
    is_default: form.is_default,
  }

  try {
    if (props.brand) {
      const updated = await brandsStore.updateBrand(props.brand.id, payload)
      if (!updated) {
        error.value = brandsStore.error || 'Failed to update brand.'
        return
      }

      if (logoFile.value) {
        try {
          const base64 = await fileToBase64(logoFile.value)
          const assetData: UploadAssetData = {
            base64,
            mimeType: logoFile.value.type,
            folder: 'logos',
            type: 'logo',
          }
          const uploadResult = await brandService.uploadAsset(props.brand.id, assetData)
          const logoUrl = uploadResult.data?.url
          if (logoUrl) {
            const logoUpdated = await brandsStore.updateBrand(props.brand.id, {
              logo_url: logoUrl,
            })
            if (!logoUpdated) {
              error.value = 'Brand saved but logo URL update failed.'
              return
            }
          }
        } catch (err: any) {
          error.value = err.message || 'Brand saved but logo upload failed.'
          return
        }
      }
    } else {
      const created = await brandsStore.createBrand(payload)
      if (!created) {
        error.value = brandsStore.error || 'Failed to create brand.'
        return
      }

      if (logoFile.value) {
        try {
          const base64 = await fileToBase64(logoFile.value)
          const assetData: UploadAssetData = {
            base64,
            mimeType: logoFile.value.type,
            folder: 'logos',
            type: 'logo',
          }
          const uploadResult = await brandService.uploadAsset(created.id, assetData)
          const logoUrl = uploadResult.data?.url
          if (logoUrl) {
            const logoUpdated = await brandsStore.updateBrand(created.id, {
              logo_url: logoUrl,
            })
            if (!logoUpdated) {
              error.value = 'Brand created but logo URL update failed.'
              return
            }
          }
        } catch (err: any) {
          error.value = err.message || 'Brand created but logo upload failed.'
          return
        }
      }
    }

    emit('saved')
    emit('update:modelValue', false)
  } catch (err: any) {
    error.value = err.message || 'Unable to save brand.'
  } finally {
    saving.value = false
  }
}

function handleClose() {
  emit('update:modelValue', false)
}
</script>

<template>
  <BaseModal :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)" size="lg">
    <template #title>
      {{ isEdit ? 'Edit Brand' : 'Create Brand' }}
    </template>

    <form @submit.prevent="handleSubmit" class="brand-form">
      <BaseInput
        v-model="form.name"
        label="Brand name"
        placeholder="e.g., Sven Group"
        required
      />

      <div class="form-group">
        <label class="form-label">Brand type</label>
        <select v-model="form.business_type" class="form-select">
          <option
            v-for="option in BUSINESS_TYPE_OPTIONS"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
      </div>

      <BaseInput
        v-model="form.description"
        type="textarea"
        label="Description"
        placeholder="Short summary about this brand"
      />

      <BaseInput
        v-model="form.address"
        label="Address"
        placeholder="123 Market St, City"
      />

      <BaseInput
        v-model="form.phone_number"
        label="Phone"
        placeholder="+1 (555) 123-4567"
      />

      <BaseInput
        v-model="form.website"
        label="Website"
        placeholder="https://yourbusiness.com"
      />

      <BaseInput
        v-model="form.logo_url"
        label="Logo URL"
        placeholder="https://..."
      />

      <div class="form-group">
        <label class="form-label">Logo Upload</label>
        <div class="logo-upload">
          <div v-if="logoPreviewUrl" class="logo-preview">
            <img :src="logoPreviewUrl" alt="Logo preview" />
          </div>
          <div class="logo-actions">
            <input type="file" accept="image/*" @change="handleLogoFileChange" />
            <BaseButton v-if="logoFile" type="button" variant="ghost" size="small" @click="removeLogoFile">
              Remove
            </BaseButton>
          </div>
          <p class="logo-hint">Upload a square logo (PNG/JPG). This overrides the Logo URL.</p>
        </div>
      </div>

      <label class="checkbox">
        <input type="checkbox" v-model="form.is_default" />
        <span>Make this my default brand</span>
      </label>

      <BaseAlert v-if="error" type="error">{{ error }}</BaseAlert>

      <div class="form-actions">
        <BaseButton type="button" variant="ghost" @click="handleClose" :disabled="saving">
          Cancel
        </BaseButton>
        <BaseButton type="submit" variant="primary" :disabled="saving">
          {{ saving ? 'Saving...' : (isEdit ? 'Save changes' : 'Create brand') }}
        </BaseButton>
      </div>
    </form>
  </BaseModal>
</template>

<style scoped>
.brand-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.form-label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
  font-family: var(--font-body);
}

.form-select {
  width: 100%;
  padding: var(--space-md) var(--space-lg);
  background: var(--bg-tertiary);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--text-base);
  font-family: var(--font-body);
  transition: var(--transition-base);
}

.logo-upload {
  display: flex;
  gap: var(--space-md);
  align-items: center;
  flex-wrap: wrap;
}

.logo-preview {
  width: 72px;
  height: 72px;
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid var(--border-color);
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.logo-actions {
  display: flex;
  gap: var(--space-sm);
  align-items: center;
}

.logo-hint {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.form-select:focus {
  outline: none;
  border-color: var(--gold-primary);
  box-shadow: 0 0 0 3px var(--accent-alpha-12);
}

.checkbox {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  color: var(--text-secondary);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-md);
}
</style>

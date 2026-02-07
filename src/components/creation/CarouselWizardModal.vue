<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseModal from '../BaseModal.vue'
import BaseButton from '../BaseButton.vue'
import BaseInput from '../BaseInput.vue'
import BaseAlert from '../BaseAlert.vue'
import LoadingOverlay from '../LoadingOverlay.vue'
import CarouselImageSelector from './CarouselImageSelector.vue'
import type { CarouselItem } from '@/types/scheduling'

interface Props {
  modelValue: boolean
  platform: 'facebook' | 'instagram'
  restaurantName?: string
  brandDNA?: any
  brandId?: string
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', data: {
    images: CarouselItem[]
    caption: string
    hashtags: string[]
  }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const { t } = useI18n()

// State
const currentStep = ref<1 | 2>(1)
const selectedImages = ref<CarouselItem[]>([])
const caption = ref('')
const hashtagsText = ref('')
const isGenerating = ref(false)
const error = ref<string | null>(null)
const hasGenerated = ref(false)

// Computed
const hashtags = computed(() => {
  return hashtagsText.value
    .split('\n')
    .map(h => h.trim())
    .filter(h => h.length > 0)
    .map(h => h.startsWith('#') ? h : `#${h}`)
})

const isValid = computed(() => {
  return caption.value.trim().length > 0
})

// Step navigation
function goToStep2() {
  if (selectedImages.value.length < 2) return
  currentStep.value = 2

  // Auto-generate ONLY when moving to Step 2 (images guaranteed to exist)
  if (!hasGenerated.value && !caption.value) {
    generateContent()
  }
}

function goToStep1() {
  currentStep.value = 1
  // Preserve caption/hashtags (allow editing selection)
}

// Content generation (fixed timing issue)
async function generateContent() {
  isGenerating.value = true
  error.value = null

  const imageUrls = selectedImages.value.map(img => img.mediaUrl)

  try {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    const authStore = (await import('@/stores/auth')).useAuthStore()
    const token = authStore.accessToken

    if (!token) {
      throw new Error('Not authenticated')
    }

    const response = await fetch(`${API_URL}/api/carousel/generate-content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        imageUrls, // ✅ Now always has ≥2 images
        platform: props.platform,
        restaurantName: props.restaurantName,
        brandDNA: props.brandDNA
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to generate content')
    }

    const data = await response.json()

    if (data.success && data.data) {
      caption.value = data.data.caption || ''
      hashtagsText.value = (data.data.hashtags || []).join('\n')
      hasGenerated.value = true
    } else {
      throw new Error(data.error || 'Failed to generate content')
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to generate carousel content'
    console.error('Carousel content generation failed:', err)
  } finally {
    isGenerating.value = false
  }
}

function handleConfirm() {
  if (!isValid.value) return

  emit('confirm', {
    images: selectedImages.value,
    caption: caption.value.trim(),
    hashtags: hashtags.value
  })

  closeModal()
}

function closeModal() {
  emit('update:modelValue', false)
  // Reset state when modal closes
  currentStep.value = 1
  selectedImages.value = []
  caption.value = ''
  hashtagsText.value = ''
  error.value = null
  hasGenerated.value = false
}

function updateSelectedImages(items: CarouselItem[]) {
  selectedImages.value = items
}
</script>

<template>
  <Teleport to="body">
    <BaseModal
      :model-value="modelValue"
      size="lg"
      @update:model-value="closeModal"
    >
      <template #header>
        <div class="wizard-header">
          <h2 class="wizard-title">{{ t('carousel.wizardTitle') }}</h2>
          <div class="step-indicator">
            <span :class="['step', { active: currentStep === 1 }]">
              {{ t('carousel.step1Title') }}
            </span>
            <span class="separator">→</span>
            <span :class="['step', { active: currentStep === 2 }]">
              {{ t('carousel.step2Title') }}
            </span>
          </div>
        </div>
      </template>

      <!-- Step 1: Image Selection -->
      <div v-show="currentStep === 1" class="step-content">
        <CarouselImageSelector
          :model-value="selectedImages"
          :min-images="2"
          :max-images="10"
          :brand-id="brandId"
          @update:model-value="updateSelectedImages"
        />
      </div>

      <!-- Step 2: Content Customization -->
      <div v-show="currentStep === 2" class="step-content">
        <LoadingOverlay
          v-if="isGenerating"
          :visible="true"
          :title="t('carousel.generating')"
        />

        <BaseAlert v-if="error" type="error" class="error-alert">
          {{ error }}
        </BaseAlert>

        <!-- Compact image preview -->
        <div class="selected-images-preview">
          <h3 class="preview-title">{{ t('carousel.selectedImages') }}</h3>
          <div class="image-strip">
            <img
              v-for="(img, idx) in selectedImages"
              :key="idx"
              :src="img.previewUrl || img.mediaUrl"
              :alt="`Image ${idx + 1}`"
              class="preview-thumbnail"
            />
          </div>
        </div>

        <!-- Caption & Hashtags -->
        <div class="content-fields">
          <BaseInput
            v-model="caption"
            type="textarea"
            :label="t('carousel.caption')"
            :placeholder="t('carousel.captionPlaceholder')"
            :rows="6"
          />

          <BaseInput
            v-model="hashtagsText"
            type="textarea"
            :label="t('carousel.hashtags')"
            :placeholder="t('carousel.hashtagsPlaceholder')"
            :hint="t('carousel.hashtagsHint')"
            :rows="4"
          />

          <BaseButton
            variant="ghost"
            size="small"
            :disabled="isGenerating"
            @click="generateContent"
          >
            <span class="material-symbols-outlined">refresh</span>
            {{ t('carousel.regenerate') }}
          </BaseButton>
        </div>
      </div>

      <!-- Footer Actions -->
      <template #footer>
        <div class="wizard-actions">
          <BaseButton
            v-if="currentStep === 2"
            variant="ghost"
            @click="goToStep1"
          >
            {{ t('carousel.previousStep') }}
          </BaseButton>

          <BaseButton variant="ghost" @click="closeModal">
            {{ t('common.cancel') }}
          </BaseButton>

          <BaseButton
            v-if="currentStep === 1"
            variant="primary"
            :disabled="selectedImages.length < 2"
            @click="goToStep2"
          >
            {{ t('carousel.nextStep') }}
          </BaseButton>

          <BaseButton
            v-else
            variant="primary"
            :disabled="!isValid || isGenerating"
            @click="handleConfirm"
          >
            {{ t('carousel.useContent') }}
          </BaseButton>
        </div>
      </template>
    </BaseModal>
  </Teleport>
</template>

<style scoped>
/* Wizard Header */
.wizard-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.wizard-title {
  font-size: var(--text-xl);
  font-weight: 600;
  color: var(--text-primary);
  font-family: var(--font-heading);
  margin: 0;
}

.step-indicator {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--text-sm);
}

.step {
  color: var(--text-muted);
  font-weight: 500;
  transition: var(--transition-base);
}

.step.active {
  color: var(--gold-primary);
  font-weight: 600;
}

.separator {
  color: var(--text-muted);
  font-weight: 400;
}

/* Step Content */
.step-content {
  position: relative;
  min-height: 400px;
  padding: var(--space-md);
}

.error-alert {
  margin-bottom: var(--space-lg);
}

/* Selected Images Preview */
.selected-images-preview {
  margin-bottom: var(--space-xl);
}

.preview-title {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: var(--space-sm);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.image-strip {
  display: flex;
  gap: var(--space-sm);
  overflow-x: auto;
  padding: var(--space-sm);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  scrollbar-width: thin;
  scrollbar-color: var(--gold-primary) var(--bg-tertiary);
}

.image-strip::-webkit-scrollbar {
  height: 6px;
}

.image-strip::-webkit-scrollbar-track {
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
}

.image-strip::-webkit-scrollbar-thumb {
  background: var(--gold-primary);
  border-radius: var(--radius-sm);
}

.preview-thumbnail {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: var(--radius-sm);
  border: 2px solid var(--glass-border);
  flex-shrink: 0;
  transition: var(--transition-base);
}

.preview-thumbnail:hover {
  border-color: var(--gold-primary);
  transform: scale(1.05);
}

/* Content Fields */
.content-fields {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.content-fields button {
  align-self: flex-start;
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.content-fields button .material-symbols-outlined {
  font-size: 18px;
}

/* Wizard Actions */
.wizard-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-md);
  padding: var(--space-md);
  border-top: 1px solid var(--glass-border);
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .step-content {
    min-height: 300px;
    padding: var(--space-sm);
  }

  .wizard-actions {
    flex-direction: column-reverse;
    gap: var(--space-sm);
  }

  .wizard-actions button {
    width: 100%;
  }

  .step-indicator {
    font-size: var(--text-xs);
    flex-wrap: wrap;
  }

  .preview-thumbnail {
    width: 60px;
    height: 60px;
  }
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  .step,
  .preview-thumbnail {
    transition: none;
  }
}
</style>

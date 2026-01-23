<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseModal from './BaseModal.vue'
import BaseButton from './BaseButton.vue'
import BaseInput from './BaseInput.vue'
import BaseAlert from './BaseAlert.vue'
import LoadingOverlay from './LoadingOverlay.vue'
import type { CarouselItem } from '@/types/scheduling'

interface Props {
  modelValue: boolean
  carouselImages: CarouselItem[]
  platform: 'facebook' | 'instagram'
  restaurantName?: string
  brandDNA?: any
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', data: { caption: string; hashtags: string[] }): void
  (e: 'cancel'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const { t } = useI18n()

const isGenerating = ref(false)
const error = ref<string | null>(null)
const caption = ref('')
const hashtagsText = ref('')

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

async function generateContent() {
  isGenerating.value = true
  error.value = null

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
        imageUrls: props.carouselImages.map(img => img.mediaUrl),
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
    caption: caption.value.trim(),
    hashtags: hashtags.value
  })

  handleClose()
}

function handleClose() {
  emit('update:modelValue', false)
}

function handleCancel() {
  emit('cancel')
  handleClose()
}

// Auto-generate when modal opens
if (props.modelValue && !caption.value) {
  generateContent()
}
</script>

<template>
  <Teleport to="body">
    <BaseModal
      :model-value="modelValue"
      size="md"
      @update:model-value="handleClose"
    >
      <template #header>
        <h2 class="modal-title">
          {{ t('carousel.generateContentTitle') || 'Customize Carousel Content' }}
        </h2>
      </template>

      <div class="carousel-content-modal">
        <LoadingOverlay
          v-if="isGenerating"
          :visible="isGenerating"
          :title="t('carousel.generating') || 'Generating content...'"
        />

        <BaseAlert v-if="error" type="error" class="error-alert">
          {{ error }}
        </BaseAlert>

        <div class="preview-section">
          <h3 class="section-label">{{ t('carousel.selectedImages') || 'Selected Images' }}</h3>
          <div class="image-grid">
            <img
              v-for="(img, idx) in carouselImages"
              :key="idx"
              :src="img.previewUrl || img.mediaUrl"
              class="preview-img"
              :alt="`Carousel image ${idx + 1}`"
            />
          </div>
        </div>

        <div class="content-section">
          <BaseInput
            v-model="caption"
            type="textarea"
            :label="t('carousel.caption') || 'Caption'"
            :rows="6"
            :placeholder="t('carousel.captionPlaceholder') || 'Write your carousel caption...'"
          />

          <BaseInput
            v-model="hashtagsText"
            type="textarea"
            :label="t('carousel.hashtags') || 'Hashtags (one per line)'"
            :rows="4"
            :placeholder="t('carousel.hashtagsPlaceholder') || '#food\n#restaurant\n#delicious'"
            :hint="t('carousel.hashtagsHint') || 'Enter one hashtag per line'"
          />

          <div class="regenerate-section">
            <BaseButton
              variant="ghost"
              size="small"
              :disabled="isGenerating"
              @click="generateContent"
            >
              <span class="material-symbols-outlined">refresh</span>
              {{ t('carousel.regenerate') || 'Regenerate Content' }}
            </BaseButton>
          </div>
        </div>

        <div class="actions">
          <BaseButton
            variant="ghost"
            @click="handleCancel"
          >
            {{ t('common.cancel') }}
          </BaseButton>
          <BaseButton
            variant="primary"
            :disabled="!isValid || isGenerating"
            @click="handleConfirm"
          >
            {{ t('carousel.useContent') || 'Use This Content' }}
          </BaseButton>
        </div>
      </div>
    </BaseModal>
  </Teleport>
</template>

<style scoped>
.carousel-content-modal {
  position: relative;
  padding: var(--space-md);
}

.modal-title {
  font-size: var(--text-xl);
  font-weight: 600;
  color: var(--text-primary);
  font-family: var(--font-heading);
}

.error-alert {
  margin-bottom: var(--space-lg);
}

.preview-section {
  margin-bottom: var(--space-xl);
}

.section-label {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: var(--space-sm);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: var(--space-sm);
  max-height: 200px;
  overflow-y: auto;
  padding: var(--space-sm);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
}

.preview-img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: var(--radius-sm);
  border: 2px solid var(--glass-border);
}

.content-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  margin-bottom: var(--space-xl);
}

.regenerate-section {
  display: flex;
  justify-content: flex-start;
}

.regenerate-section button {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-md);
  padding-top: var(--space-lg);
  border-top: 1px solid var(--glass-border);
}

@media (max-width: 768px) {
  .image-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .actions {
    flex-direction: column-reverse;
  }

  .actions button {
    width: 100%;
  }
}
</style>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseButton from './BaseButton.vue'

interface Props {
  modelValue?: string
  uploading?: boolean
  maxSizeMB?: number
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  uploading: false,
  maxSizeMB: 2
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'upload', file: File): void
  (e: 'error', message: string): void
}>()

const { t } = useI18n()
const fileInput = ref<HTMLInputElement | null>(null)
const previewUrl = ref<string>(props.modelValue)
const isDragging = ref(false)

watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    previewUrl.value = newValue
  }
})

function handleDragEnter(e: DragEvent) {
  e.preventDefault()
  isDragging.value = true
}

function handleDragLeave(e: DragEvent) {
  e.preventDefault()
  isDragging.value = false
}

function handleDragOver(e: DragEvent) {
  e.preventDefault()
}

function handleDrop(e: DragEvent) {
  e.preventDefault()
  isDragging.value = false

  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    processFile(files[0])
  }
}

function handleFileInput(e: Event) {
  const target = e.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    processFile(target.files[0])
  }
  target.value = ''
}

function processFile(file: File) {
  if (!file.type.startsWith('image/')) {
    emit('error', t('businessManagement.errors.onlyImages'))
    return
  }

  const maxBytes = props.maxSizeMB * 1024 * 1024
  if (file.size > maxBytes) {
    emit('error', t('businessManagement.errors.logoTooLarge', { size: props.maxSizeMB }))
    return
  }

  const url = URL.createObjectURL(file)
  previewUrl.value = url

  emit('upload', file)
}

function openFileDialog() {
  fileInput.value?.click()
}

function removeLogo() {
  if (previewUrl.value && previewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(previewUrl.value)
  }
  previewUrl.value = ''
  emit('update:modelValue', '')
}

import { onUnmounted } from 'vue'
onUnmounted(() => {
  if (previewUrl.value && previewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(previewUrl.value)
  }
})
</script>

<template>
  <div class="logo-upload">
    <input
      ref="fileInput"
      type="file"
      accept="image/jpeg,image/jpg,image/png,image/webp"
      class="file-input"
      @change="handleFileInput"
    />

    <div v-if="!previewUrl"
      :class="['upload-area', { dragging: isDragging }]"
      @dragenter="handleDragEnter"
      @dragleave="handleDragLeave"
      @dragover="handleDragOver"
      @drop="handleDrop"
      @click="openFileDialog"
    >
      <div class="upload-icon">🖼️</div>
      <p class="upload-text">
        {{ $t('businessManagement.dragLogoOrClick') }}
      </p>
      <p class="upload-hint">
        {{ $t('businessManagement.logoMaxSize', { size: maxSizeMB }) }}
      </p>
    </div>

    <div v-else class="logo-preview">
      <img :src="previewUrl" :alt="$t('businessManagement.logoPreview')" class="logo-image" />
      <div class="logo-actions">
        <BaseButton
          variant="ghost"
          size="small"
          @click="openFileDialog"
          :disabled="uploading"
        >
          {{ $t('common.change') }}
        </BaseButton>
        <BaseButton
          variant="ghost"
          size="small"
          @click="removeLogo"
          :disabled="uploading"
        >
          {{ $t('common.remove') }}
        </BaseButton>
      </div>
      <div v-if="uploading" class="uploading-overlay">
        <div class="spinner"></div>
        <p>{{ $t('common.uploading') }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.logo-upload {
  width: 100%;
}

.file-input {
  display: none;
}

.upload-area {
  position: relative;
  padding: var(--space-3xl);
  border: 2px dashed var(--border-color);
  border-radius: var(--radius-lg);
  background: var(--bg-secondary);
  text-align: center;
  cursor: pointer;
  transition: var(--transition-base);
  max-width: 400px;
}

.upload-area:hover,
.upload-area.dragging {
  border-color: var(--gold-primary);
  background: var(--gold-subtle);
}

.upload-icon {
  font-size: var(--text-4xl);
  margin-bottom: var(--space-md);
}

.upload-text {
  font-size: var(--text-base);
  color: var(--text-primary);
  margin-bottom: var(--space-sm);
}

.upload-hint {
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.logo-preview {
  position: relative;
  display: inline-block;
  max-width: 400px;
}

.logo-image {
  width: 100%;
  max-height: 200px;
  object-fit: contain;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  padding: var(--space-md);
}

.logo-actions {
  display: flex;
  gap: var(--space-sm);
  margin-top: var(--space-md);
  justify-content: center;
}

.uploading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(246, 241, 231, 0.9);
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border-color);
  border-top-color: var(--gold-primary);
  border-radius: var(--radius-full);
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.uploading-overlay p {
  color: var(--text-primary);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
}

@media (max-width: 768px) {
  .upload-area {
    padding: var(--space-2xl);
  }
}

@media (prefers-reduced-motion: reduce) {
  .upload-area,
  .spinner {
    animation: none;
    transition: none;
  }
}
</style>

<script setup lang="ts">
/**
 * ImageUploadBox - Reusable image upload component with preview
 * Used by both EasyModeCreation and AdvancedModeCreation
 */
import { useI18n } from 'vue-i18n'
import MaterialIcon from '../MaterialIcon.vue'

interface Props {
  previewUrl?: string | null
  acceptTypes?: string
  uploadText?: string
  uploadHint?: string
  showGoldenIcon?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  acceptTypes: 'image/*',
  showGoldenIcon: false
})

const emit = defineEmits<{
  (e: 'upload', file: File): void
  (e: 'remove'): void
}>()

const { t } = useI18n()

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    emit('upload', file)
  }
  // Reset input for re-uploads
  target.value = ''
}
</script>

<template>
  <div class="image-upload-box">
    <!-- Preview State -->
    <div v-if="previewUrl" class="uploaded-image-preview">
      <img :src="previewUrl" alt="Uploaded image" class="preview-image" />
      <button
        class="remove-image-btn"
        @click="emit('remove')"
        :title="t('common.remove', 'Remove')"
      >
        <MaterialIcon icon="close" size="sm" :color="'var(--text-primary)'" />
      </button>
      <div class="upload-badge">
        <MaterialIcon icon="check_circle" size="sm" :color="'var(--text-on-gold)'" />
      </div>
    </div>

    <!-- Upload State -->
    <label v-else class="upload-button">
      <input
        type="file"
        :accept="acceptTypes"
        @change="handleFileChange"
        class="upload-input"
      />
      <div class="upload-content">
        <slot name="icon">
          <MaterialIcon icon="upload" size="xl" :color="'var(--text-primary)'" />
        </slot>
        <span class="upload-text">{{ uploadText || t('common.uploadImage', 'Upload Image') }}</span>
        <span class="upload-hint">{{ uploadHint || t('common.uploadHint', 'JPG, PNG, or WebP') }}</span>
      </div>
    </label>
  </div>
</template>

<style scoped>
.image-upload-box {
  width: 100%;
}

.uploaded-image-preview {
  position: relative;
  width: 100%;
  max-width: 300px;
  aspect-ratio: 1;
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 2px solid var(--gold-primary);
  box-shadow: var(--glow-gold-sm);
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-image-btn {
  position: absolute;
  top: var(--space-sm);
  right: var(--space-sm);
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: var(--transition-base);
}

.remove-image-btn:hover {
  background: var(--error-bg);
  border-color: var(--error-border);
}

.upload-badge {
  position: absolute;
  bottom: var(--space-sm);
  right: var(--space-sm);
  width: 28px;
  height: 28px;
  border-radius: var(--radius-full);
  background: var(--gradient-gold);
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 300px;
  aspect-ratio: 1;
  border: 2px dashed var(--border-color);
  border-radius: var(--radius-lg);
  background: var(--bg-tertiary);
  cursor: pointer;
  transition: var(--transition-base);
}

.upload-button:hover {
  border-color: var(--gold-primary);
  background: var(--gold-subtle);
}

.upload-input {
  display: none;
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-xl);
  text-align: center;
}

.upload-text {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.upload-hint {
  font-size: var(--text-sm);
  color: var(--text-muted);
}

/* Responsive */
@media (max-width: 768px) {
  .uploaded-image-preview,
  .upload-button {
    max-width: 100%;
  }
}
</style>

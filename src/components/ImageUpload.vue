<script setup lang="ts">
import { ref, computed } from 'vue'
import BaseButton from './BaseButton.vue'

interface Props {
  modelValue?: File[]
  maxFiles?: number
  maxSizeMB?: number
  accept?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  maxFiles: 10,
  maxSizeMB: 5,
  accept: 'image/jpeg,image/jpg,image/png,image/webp'
})

const emit = defineEmits<{
  (e: 'update:modelValue', files: File[]): void
  (e: 'error', message: string): void
}>()

const isDragging = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const previewUrls = ref<Map<string, string>>(new Map())

const selectedFiles = computed(() => props.modelValue)

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

  const files = Array.from(e.dataTransfer?.files || [])
  processFiles(files)
}

function handleFileInput(e: Event) {
  const target = e.target as HTMLInputElement
  const files = Array.from(target.files || [])
  processFiles(files)

  // Reset input to allow re-uploading same file
  target.value = ''
}

function processFiles(files: File[]) {
  // Filter for images only
  const imageFiles = files.filter(file => file.type.startsWith('image/'))

  if (imageFiles.length !== files.length) {
    emit('error', 'Only image files are allowed')
  }

  // Check file sizes
  const maxSizeBytes = props.maxSizeMB * 1024 * 1024
  const oversizedFiles = imageFiles.filter(file => file.size > maxSizeBytes)

  if (oversizedFiles.length > 0) {
    emit('error', `Some files exceed ${props.maxSizeMB}MB limit`)
    return
  }

  // Check total count
  const totalFiles = selectedFiles.value.length + imageFiles.length
  if (totalFiles > props.maxFiles) {
    emit('error', `Maximum ${props.maxFiles} files allowed`)
    return
  }

  // Create preview URLs
  imageFiles.forEach(file => {
    const url = URL.createObjectURL(file)
    previewUrls.value.set(file.name, url)
  })

  // Emit updated files
  const updatedFiles = [...selectedFiles.value, ...imageFiles]
  emit('update:modelValue', updatedFiles)
}

function removeFile(index: number) {
  const file = selectedFiles.value[index]

  // Revoke preview URL
  const url = previewUrls.value.get(file.name)
  if (url) {
    URL.revokeObjectURL(url)
    previewUrls.value.delete(file.name)
  }

  // Remove from list
  const updatedFiles = selectedFiles.value.filter((_, i) => i !== index)
  emit('update:modelValue', updatedFiles)
}

function openFileDialog() {
  fileInput.value?.click()
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Cleanup on unmount
import { onUnmounted } from 'vue'
onUnmounted(() => {
  previewUrls.value.forEach(url => URL.revokeObjectURL(url))
  previewUrls.value.clear()
})
</script>

<template>
  <div class="image-upload">
    <!-- Upload Area -->
    <div
      :class="['upload-area', { dragging: isDragging }]"
      @dragenter="handleDragEnter"
      @dragleave="handleDragLeave"
      @dragover="handleDragOver"
      @drop="handleDrop"
      @click="openFileDialog"
    >
      <input
        ref="fileInput"
        type="file"
        :accept="accept"
        multiple
        class="file-input"
        @change="handleFileInput"
      />

      <div class="upload-icon">📁</div>
      <p class="upload-text">
        Drag & drop images here or <span class="highlight">click to browse</span>
      </p>
      <p class="upload-hint">
        Max {{ maxFiles }} files, {{ maxSizeMB }}MB each (JPEG, PNG, WebP)
      </p>
    </div>

    <!-- Preview Grid -->
    <div v-if="selectedFiles.length > 0" class="preview-grid">
      <div
        v-for="(file, index) in selectedFiles"
        :key="file.name + index"
        class="preview-item"
      >
        <img
          :src="previewUrls.get(file.name)"
          :alt="file.name"
          class="preview-image"
        />
        <button
          class="remove-btn"
          @click.stop="removeFile(index)"
          aria-label="Remove image"
        >
          ×
        </button>
        <div class="preview-info">
          <p class="preview-name">{{ file.name }}</p>
          <p class="preview-size">{{ formatFileSize(file.size) }}</p>
        </div>
      </div>
    </div>

    <!-- Upload Count -->
    <div v-if="selectedFiles.length > 0" class="upload-count">
      {{ selectedFiles.length }} / {{ maxFiles }} images selected
    </div>
  </div>
</template>

<style scoped>
.image-upload {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
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
}

.upload-area:hover,
.upload-area.dragging {
  border-color: var(--gold-primary);
  background: var(--gold-subtle);
}

.file-input {
  display: none;
}

.upload-icon {
  font-size: var(--text-5xl);
  margin-bottom: var(--space-md);
}

.upload-text {
  font-size: var(--text-base);
  color: var(--text-primary);
  margin-bottom: var(--space-sm);
}

.upload-text .highlight {
  color: var(--gold-primary);
  font-weight: var(--font-medium);
}

.upload-hint {
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: var(--space-lg);
}

.preview-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--bg-tertiary);
  border: var(--border-width) solid var(--border-color);
  transition: var(--transition-base);
}

.preview-item:hover {
  border-color: var(--gold-primary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-btn {
  position: absolute;
  top: var(--space-sm);
  right: var(--space-sm);
  width: 28px;
  height: 28px;
  border-radius: var(--radius-full);
  background: rgba(0, 0, 0, 0.7);
  border: none;
  color: white;
  font-size: var(--text-xl);
  line-height: 1;
  cursor: pointer;
  opacity: 0;
  transition: var(--transition-base);
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-item:hover .remove-btn {
  opacity: 1;
}

.remove-btn:hover {
  background: var(--gold-primary);
  color: var(--text-on-gold);
  transform: scale(1.1);
}

.preview-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: var(--space-sm);
  background: linear-gradient(to top, rgba(0, 0, 0, 0.9), transparent);
  opacity: 0;
  transition: var(--transition-base);
}

.preview-item:hover .preview-info {
  opacity: 1;
}

.preview-name {
  font-size: var(--text-xs);
  color: white;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: var(--space-xs);
}

.preview-size {
  font-size: var(--text-xs);
  color: rgba(255, 255, 255, 0.7);
}

.upload-count {
  text-align: center;
  font-size: var(--text-sm);
  color: var(--text-secondary);
  padding: var(--space-md);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
}

/* Responsive */
@media (max-width: 768px) {
  .preview-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: var(--space-md);
  }

  .upload-area {
    padding: var(--space-2xl);
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .upload-area,
  .preview-item,
  .remove-btn,
  .preview-info {
    transition: none;
  }
}
</style>

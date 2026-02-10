<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { brandService } from '@/services/brandService'
import type { Brand } from '@/services/brandService'
import type { FolderNode } from '@/composables/useBrandImages'
import BaseModal from '../BaseModal.vue'
import BaseButton from '../BaseButton.vue'
import BaseInput from '../BaseInput.vue'
import BaseAlert from '../BaseAlert.vue'

interface Props {
  modelValue: boolean
  brand: Brand
  folderStructure: FolderNode | null
  currentFolderPath?: string
}

const props = withDefaults(defineProps<Props>(), {
  currentFolderPath: '/'
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'uploaded'): void
}>()

const { t } = useI18n()

// State
const selectedFiles = ref<File[]>([])
// Don't allow root folder selection - force user to pick a folder
const targetFolder = ref<string>(props.currentFolderPath === '/' ? '' : props.currentFolderPath)
const newFolderName = ref<string>('')
const isCreatingFolder = ref<boolean>(false)
const isDragging = ref<boolean>(false)
const uploading = ref<boolean>(false)
const uploadError = ref<string>('')
const uploadSuccess = ref<string>('')

// Computed: Flatten folder structure for dropdown
const folderOptions = computed<Array<{ path: string; label: string }>>(() => {
  const options: Array<{ path: string; label: string }> = []

  function traverse(node: FolderNode, depth: number = 0) {
    for (const child of node.children) {
      const indent = '  '.repeat(depth)
      options.push({
        path: child.path,
        label: `${indent}${child.name}`
      })
      if (child.children.length > 0) {
        traverse(child, depth + 1)
      }
    }
  }

  if (props.folderStructure) {
    traverse(props.folderStructure)
  }

  // If target folder is set but not in the list (newly created), add it
  if (targetFolder.value && !options.some(opt => opt.path === targetFolder.value)) {
    options.push({
      path: targetFolder.value,
      label: `${targetFolder.value} (new)`
    })
  }

  return options
})

// Constants
const MAX_FILES = 50 // Backend limit

// Handle file selection
function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files) {
    const files = Array.from(target.files)

    // Check file limit
    if (files.length > MAX_FILES) {
      uploadError.value = t('restaurantManagement.errors.tooManyFiles', { max: MAX_FILES, count: files.length })
      selectedFiles.value = []
      return
    }

    selectedFiles.value = files
    uploadError.value = ''
    uploadSuccess.value = ''
  }
}

// Handle drag and drop
function handleDragOver(event: DragEvent) {
  event.preventDefault()
  isDragging.value = true
}

function handleDragLeave() {
  isDragging.value = false
}

function handleDrop(event: DragEvent) {
  event.preventDefault()
  isDragging.value = false

  if (event.dataTransfer?.files) {
    const files = Array.from(event.dataTransfer.files)

    // Check file limit
    if (files.length > MAX_FILES) {
      uploadError.value = t('restaurantManagement.errors.tooManyFiles', { max: MAX_FILES, count: files.length })
      selectedFiles.value = []
      return
    }

    selectedFiles.value = files
    uploadError.value = ''
    uploadSuccess.value = ''
  }
}

// Remove file from selection
function removeFile(index: number) {
  selectedFiles.value.splice(index, 1)
}

// Validate folder name
function validateFolderName(name: string): boolean {
  // No slashes, no special characters that could break paths
  return /^[a-zA-Z0-9-_\s]+$/.test(name) && name.trim().length > 0
}

// Create new folder
function handleCreateFolder() {
  if (!newFolderName.value.trim()) {
    uploadError.value = t('restaurantManagement.errors.invalidFolderName')
    return
  }

  if (!validateFolderName(newFolderName.value)) {
    uploadError.value = t('restaurantManagement.errors.invalidFolderName')
    return
  }

  // Check if folder already exists
  const folderPath = newFolderName.value.trim().toLowerCase()
  const exists = folderOptions.value.some(
    opt => opt.path.toLowerCase() === folderPath
  )

  if (exists) {
    uploadError.value = t('restaurantManagement.errors.folderExists')
    return
  }

  // Set target folder to new folder name (folder will be created on upload)
  const folderName = newFolderName.value.trim()
  targetFolder.value = folderName
  newFolderName.value = ''
  isCreatingFolder.value = false
  uploadError.value = ''
  uploadSuccess.value = t('restaurantManagement.newFolderReady', { name: folderName })
}

// Upload images
async function handleUpload() {
  if (selectedFiles.value.length === 0) {
    uploadError.value = t('restaurantManagement.errors.noFilesSelected')
    return
  }

  if (!targetFolder.value || targetFolder.value === '/') {
    uploadError.value = t('restaurantManagement.errors.selectFolderRequired')
    return
  }

  uploading.value = true
  uploadError.value = ''
  uploadSuccess.value = ''

  try {
    const brandId = props.brand.place_id || props.brand.id
    const category = targetFolder.value

    // Convert each file to base64 and upload as individual assets
    const uploadPromises = selectedFiles.value.map(async (file) => {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve((reader.result as string).split(',')[1])
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      return brandService.uploadAsset(brandId, {
        base64,
        mimeType: file.type,
        folder: category,
      })
    })
    await Promise.all(uploadPromises)

    uploadSuccess.value = t('restaurantManagement.uploadSuccess', {
      count: selectedFiles.value.length
    })

    selectedFiles.value = []

    // Emit success and close modal after a brief delay
    setTimeout(() => {
      emit('uploaded')
      emit('update:modelValue', false)
    }, 1500)
  } catch (err: any) {
    console.error('Upload failed:', err)
    uploadError.value = err.message || t('restaurantManagement.errors.uploadFailed')
  } finally {
    uploading.value = false
  }
}

// Format file size
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function handleClose() {
  emit('update:modelValue', false)
}
</script>

<template>
  <BaseModal :model-value="modelValue" @update:model-value="handleClose" size="lg">
    <template #title>{{ $t('restaurantManagement.uploadImages') }}</template>

    <div class="upload-modal-content">
      <BaseAlert v-if="uploadError" type="error" class="upload-alert">
        {{ uploadError }}
      </BaseAlert>

      <BaseAlert v-if="uploadSuccess" type="success" class="upload-alert">
        {{ uploadSuccess }}
      </BaseAlert>

      <!-- Folder Selection -->
      <div class="folder-selection-section">
        <label class="section-label">
          {{ $t('restaurantManagement.selectFolder') }}
        </label>

        <div class="folder-select-row">
          <select v-model="targetFolder" class="folder-select" :disabled="uploading">
            <option value="" disabled>{{ $t('restaurantManagement.chooseFolderPlaceholder') }}</option>
            <option v-for="option in folderOptions" :key="option.path" :value="option.path">
              {{ option.label }}
            </option>
          </select>

          <BaseButton
            v-if="!isCreatingFolder"
            @click="isCreatingFolder = true"
            variant="ghost"
            size="small"
            :disabled="uploading"
          >
            {{ $t('restaurantManagement.createNewFolder') }}
          </BaseButton>
        </div>

        <!-- Create New Folder Inline -->
        <div v-if="isCreatingFolder" class="create-folder-row">
          <BaseInput
            v-model="newFolderName"
            :placeholder="$t('restaurantManagement.enterFolderName')"
            :hint="$t('restaurantManagement.errors.invalidFolderName')"
            @keyup.enter="handleCreateFolder"
          />
          <div class="create-folder-actions">
            <BaseButton @click="handleCreateFolder" variant="primary" size="small">
              {{ $t('common.create') }}
            </BaseButton>
            <BaseButton @click="isCreatingFolder = false" variant="ghost" size="small">
              {{ $t('common.cancel') }}
            </BaseButton>
          </div>
        </div>
      </div>

      <!-- Drag and Drop Zone -->
      <div
        :class="['drag-drop-zone', { dragging: isDragging, 'has-files': selectedFiles.length > 0 }]"
        @dragover="handleDragOver"
        @dragleave="handleDragLeave"
        @drop="handleDrop"
      >
        <input
          id="file-input"
          type="file"
          multiple
          accept="image/*"
          class="file-input"
          @change="handleFileSelect"
        />

        <label for="file-input" class="drop-zone-label">
          <div class="drop-zone-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="3" y="4" width="18" height="16" rx="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M3 16L8 11L11 14L16 8L21 14" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="17" cy="8" r="2"/>
            </svg>
          </div>
          <p class="drop-zone-text">{{ $t('restaurantManagement.dragDropHint') }}</p>
          <p class="drop-zone-subtext">{{ $t('common.or') }} <span class="browse-link">browse files</span></p>
          <p class="drop-zone-limit">{{ $t('restaurantManagement.maxFilesHint', { max: MAX_FILES }) }}</p>
        </label>
      </div>

      <!-- Selected Files List -->
      <div v-if="selectedFiles.length > 0" class="selected-files-section">
        <h4 class="section-label">
          {{ $t('restaurantManagement.selectedCount', { count: selectedFiles.length }) }}
        </h4>

        <div class="selected-files-list">
          <div v-for="(file, index) in selectedFiles" :key="index" class="file-item">
            <div class="file-info">
              <span class="file-name">{{ file.name }}</span>
              <span class="file-size">{{ formatFileSize(file.size) }}</span>
            </div>
            <button
              type="button"
              class="remove-file-btn"
              :disabled="uploading"
              @click="removeFile(index)"
            >
              ×
            </button>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="modal-actions">
        <BaseButton @click="handleClose" variant="ghost" :disabled="uploading">
          {{ $t('common.cancel') }}
        </BaseButton>
        <BaseButton
          @click="handleUpload"
          variant="primary"
          :disabled="selectedFiles.length === 0 || uploading || !targetFolder || targetFolder === '/'"
        >
          {{ uploading ? $t('restaurantManagement.uploadingImages') : $t('common.upload') }}
        </BaseButton>
      </div>
    </div>
  </BaseModal>
</template>

<style scoped>
.upload-modal-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
  padding: var(--space-md);
}

.upload-alert {
  margin-bottom: var(--space-md);
}

.section-label {
  display: block;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-primary);
  margin-bottom: var(--space-md);
}

/* Folder Selection */
.folder-selection-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.folder-select-row {
  display: flex;
  gap: var(--space-md);
  align-items: center;
}

.folder-select {
  flex: 1;
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-secondary);
  border: 1px solid rgba(15, 61, 46, 0.2);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  cursor: pointer;
}

.folder-select:focus {
  outline: none;
  border-color: var(--gold-primary);
}

.create-folder-row {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  padding: var(--space-md);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
}

.create-folder-actions {
  display: flex;
  gap: var(--space-sm);
  justify-content: flex-end;
}

/* Drag and Drop Zone */
.drag-drop-zone {
  position: relative;
  padding: var(--space-3xl);
  border: 2px dashed rgba(15, 61, 46, 0.3);
  border-radius: var(--radius-lg);
  background: var(--bg-secondary);
  transition: var(--transition-base);
  cursor: pointer;
}

.drag-drop-zone.dragging {
  border-color: var(--gold-primary);
  background: var(--gold-subtle);
}

.drag-drop-zone.has-files {
  border-color: var(--gold-primary);
  border-style: solid;
}

.file-input {
  display: none;
}

.drop-zone-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
  cursor: pointer;
}

.drop-zone-icon {
  color: var(--gold-primary);
  opacity: 0.6;
}

.drop-zone-icon svg {
  display: block;
}

.drop-zone-text {
  font-size: var(--text-base);
  color: var(--text-primary);
  margin: 0;
}

.drop-zone-subtext {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: 0;
}

.drop-zone-limit {
  font-size: var(--text-xs);
  color: var(--text-muted);
  margin: var(--space-sm) 0 0 0;
  font-style: italic;
}

.browse-link {
  color: var(--gold-primary);
  font-weight: var(--font-medium);
}

/* Selected Files List */
.selected-files-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.selected-files-list {
  max-height: 200px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  border: 1px solid rgba(15, 61, 46, 0.1);
}

.file-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: var(--text-sm);
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  font-size: var(--text-xs);
  color: var(--text-secondary);
}

.remove-file-btn {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-full);
  background: var(--error-bg);
  border: 1px solid var(--error-border);
  color: var(--error-text);
  font-size: var(--text-xl);
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition-base);
  flex-shrink: 0;
}

.remove-file-btn:hover:not(:disabled) {
  background: var(--error-text);
  color: white;
}

.remove-file-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Modal Actions */
.modal-actions {
  display: flex;
  gap: var(--space-md);
  justify-content: flex-end;
  padding-top: var(--space-lg);
  border-top: 1px solid rgba(15, 61, 46, 0.1);
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .folder-select-row {
    flex-direction: column;
    align-items: stretch;
  }

  .drag-drop-zone {
    padding: var(--space-2xl);
  }

  .modal-actions {
    flex-direction: column-reverse;
  }

  .modal-actions button {
    width: 100%;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .drag-drop-zone,
  .remove-file-btn {
    transition: none;
  }
}
</style>

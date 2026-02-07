<script setup lang="ts">
/**
 * ImageSourceSelector - Allows users to upload new images or select from existing restaurant images
 * Used in EasyModeCreation and AdvancedModeCreation
 */
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useBrandImages } from '@/composables/useBrandImages'
import type { Brand, UploadedImage } from '@/services/brandService'
import ImageUploadBox from './ImageUploadBox.vue'
import BaseButton from '../BaseButton.vue'
import MaterialIcon from '../MaterialIcon.vue'

interface Props {
  entity?: Brand
  previewUrl?: string | null
  acceptTypes?: string
}

const props = withDefaults(defineProps<Props>(), {
  acceptTypes: 'image/*'
})

const emit = defineEmits<{
  (e: 'select', file: File): void
  (e: 'remove'): void
}>()

const { t } = useI18n()

// Tab state
type SourceMode = 'upload' | 'existing'
const sourceMode = ref<SourceMode>('upload')

// Unified composable - only initialize if entity is provided
const imageState = props.entity ? useBrandImages(props.entity!) : null

const folderStructure = imageState?.folderStructure
const currentFolderPath = imageState?.currentFolderPath
const filteredImages = imageState?.filteredImages
const navigateToFolder = imageState?.navigateToFolder
const toggleFolderExpansion = imageState?.toggleFolderExpansion
const searchQuery = imageState?.searchQuery
const loading = imageState?.loading
const error = imageState?.error

// Image selection state
const selectedImageId = ref<string | null>(null)
const isConverting = ref(false)

// Computed - check total images across all folders, not just current folder
const hasImages = computed(() => {
  return (imageState?.images?.value?.length || 0) > 0
})

const flatFolders = computed(() => {
  if (!folderStructure?.value) return []
  return getFlatFolderList(folderStructure.value)
})

// Helper: Get flat folder list for rendering
function getFlatFolderList(node: any, level: number = 0): any[] {
  const items: any[] = [{
    node,
    level,
    isActive: currentFolderPath.value === node.path,
    hasChildren: node.children.length > 0,
    isExpanded: node.isExpanded
  }]

  if (node.isExpanded && node.children.length > 0) {
    for (const child of node.children) {
      items.push(...getFlatFolderList(child, level + 1))
    }
  }

  return items
}

// Extract filename from storage path
function extractFilenameFromPath(storagePath: string): string {
  const parts = storagePath.split('/')
  return parts[parts.length - 1] || ''
}

// Handle file upload from ImageUploadBox
function handleFileUpload(file: File) {
  selectedImageId.value = null
  emit('select', file)
}

// Handle image selection from grid
async function handleImageSelect(image: UploadedImage) {
  try {
    isConverting.value = true
    selectedImageId.value = image.id

    // 1. Fetch image from Supabase URL
    const response = await fetch(image.url)
    if (!response.ok) throw new Error('Failed to fetch image')
    const blob = await response.blob()

    // 2. Extract filename from storage_path
    const filename = extractFilenameFromPath(image.storage_path)

    // 3. Create File object (same interface as uploaded files)
    const file = new File([blob], filename, {
      type: blob.type || 'image/jpeg',
      lastModified: new Date(image.created_at).getTime()
    })

    // 4. Emit to parent (parent creates preview same as upload)
    emit('select', file)
  } catch (error) {
    console.error('Failed to select image:', error)
    selectedImageId.value = null
    alert(t('imageSourceSelector.selectImage') + ' - ' + 'Error fetching image')
  } finally {
    isConverting.value = false
  }
}

// Handle remove
function handleRemove() {
  selectedImageId.value = null
  emit('remove')
}
</script>

<template>
  <div class="image-source-selector">
    <!-- Tab Switcher -->
    <div class="tab-switcher">
      <button
        :class="['tab-button', { active: sourceMode === 'upload' }]"
        @click="sourceMode = 'upload'"
      >
        {{ t('imageSourceSelector.uploadNew') }}
      </button>
      <button
        :class="['tab-button', { active: sourceMode === 'existing' }]"
        @click="sourceMode = 'existing'"
        :disabled="!hasImages"
      >
        {{ t('imageSourceSelector.browseExisting') }}
        <span v-if="!hasImages" class="disabled-hint">({{ t('imageSourceSelector.noImagesAvailable') }})</span>
      </button>
    </div>

    <!-- Upload Tab Content -->
    <div v-if="sourceMode === 'upload'" class="tab-content">
      <ImageUploadBox
        :preview-url="previewUrl"
        :accept-types="acceptTypes"
        @upload="handleFileUpload"
        @remove="handleRemove"
      />
    </div>

    <!-- Browse Existing Tab Content -->
    <div v-else-if="sourceMode === 'existing'" class="tab-content browse-content">
      <div v-if="loading" class="loading-state">
        <MaterialIcon icon="progress_activity" size="xl" :color="'var(--gold-primary)'" />
        <p>{{ t('common.loading') }}</p>
      </div>

      <div v-else-if="error" class="error-state">
        <MaterialIcon icon="error" size="xl" :color="'var(--error-text)'" />
        <p>{{ error }}</p>
      </div>

      <div v-else-if="!hasImages" class="empty-state">
        <MaterialIcon icon="photo_library" size="xl" :color="'var(--text-muted)'" />
        <p>{{ t('imageSourceSelector.noImagesAvailable') }}</p>
        <p class="hint">{{ t('imageSourceSelector.uploadOrSelect') }}</p>
      </div>

      <div v-else class="browser-layout">
        <!-- Left: Compact Folder Tree -->
        <div class="folder-sidebar">
          <div class="folder-list">
            <div
              v-for="item in flatFolders"
              :key="item.node.path"
              :class="['folder-item', { active: item.isActive }]"
              :style="{ paddingLeft: `${item.level * 16 + 12}px` }"
              @click="navigateToFolder(item.node.path)"
            >
              <button
                v-if="item.hasChildren"
                class="expand-button"
                @click.stop="toggleFolderExpansion(item.node.path)"
              >
                <MaterialIcon
                  :icon="item.isExpanded ? 'expand_more' : 'chevron_right'"
                  size="sm"
                  :color="'var(--text-muted)'"
                />
              </button>
              <span v-else class="expand-spacer"></span>
              <MaterialIcon icon="folder" size="sm" :color="item.isActive ? 'var(--gold-primary)' : 'var(--text-muted)'" />
              <span class="folder-name">{{ item.node.name }}</span>
              <span class="folder-count">({{ item.node.imageCount }})</span>
            </div>
          </div>
        </div>

        <!-- Right: Image Grid -->
        <div class="image-grid-container">
          <!-- Search Bar -->
          <div class="search-bar">
            <MaterialIcon icon="search" size="sm" :color="'var(--text-muted)'" />
            <input
              v-model="searchQuery"
              type="text"
              :placeholder="t('imageSourceSelector.searchPlaceholder')"
              class="search-input"
            />
          </div>

          <!-- Image Grid -->
          <div v-if="filteredImages.length === 0" class="empty-folder">
            <MaterialIcon icon="image" size="xl" :color="'var(--text-muted)'" />
            <p>{{ t('imageSourceSelector.folderEmpty') }}</p>
          </div>

          <div v-else class="image-grid">
            <div
              v-for="image in filteredImages"
              :key="image.id"
              :class="['image-card', { selected: selectedImageId === image.id, converting: isConverting && selectedImageId === image.id }]"
              @click="handleImageSelect(image)"
            >
              <img :src="image.url" :alt="extractFilenameFromPath(image.storage_path)" class="image-thumb" />

              <div v-if="selectedImageId === image.id" class="selected-badge">
                <MaterialIcon icon="check_circle" size="sm" :color="'#ffffff'" />
              </div>

              <div v-if="isConverting && selectedImageId === image.id" class="converting-overlay">
                <MaterialIcon icon="progress_activity" size="lg" :color="'#ffffff'" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.image-source-selector {
  width: 100%;
}

/* Tab Switcher */
.tab-switcher {
  display: flex;
  gap: var(--space-sm);
  margin-bottom: var(--space-xl);
  border-bottom: 2px solid var(--border-color);
}

.tab-button {
  flex: 1;
  padding: var(--space-md) var(--space-lg);
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-base);
  margin-bottom: -2px;
}

.tab-button:hover:not(:disabled) {
  color: var(--text-primary);
  background: var(--bg-tertiary);
}

.tab-button.active {
  color: var(--gold-primary);
  border-bottom-color: var(--gold-primary);
}

.tab-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.disabled-hint {
  font-size: var(--text-xs);
  font-weight: var(--font-normal);
  margin-left: var(--space-xs);
}

/* Tab Content */
.tab-content {
  min-height: 250px;
}

.browse-content {
  min-height: 500px;
}

/* States */
.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-4xl);
  text-align: center;
  gap: var(--space-md);
}

.empty-state .hint {
  font-size: var(--text-sm);
  color: var(--text-muted);
  margin-top: var(--space-sm);
}

/* Browser Layout */
.browser-layout {
  display: flex;
  gap: var(--space-xl);
  height: 500px;
}

/* Folder Sidebar */
.folder-sidebar {
  width: 250px;
  flex-shrink: 0;
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  overflow-y: auto;
  border: 1px solid var(--border-color);
}

.folder-list {
  padding: var(--space-sm) 0;
}

.folder-item {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  border-left: 3px solid transparent;
}

.folder-item:hover {
  background: var(--bg-tertiary);
}

.folder-item.active {
  background: rgba(15, 61, 46, 0.12);
  border-left-color: var(--gold-primary);
}

.expand-button {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
}

.expand-spacer {
  width: 20px;
}

.folder-name {
  flex: 1;
  font-size: var(--text-sm);
  color: var(--text-primary);
  font-weight: var(--font-medium);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.folder-count {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

/* Image Grid Container */
.image-grid-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Search Bar */
.search-bar {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md);
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  margin-bottom: var(--space-lg);
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: var(--text-sm);
  color: var(--text-primary);
  outline: none;
}

.search-input::placeholder {
  color: var(--text-muted);
}

/* Empty Folder */
.empty-folder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-4xl);
  text-align: center;
  gap: var(--space-md);
  color: var(--text-muted);
}

/* Image Grid */
.image-grid {
  flex: 1;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: var(--space-lg);
  align-content: start;
  padding-right: var(--space-sm);
}

.image-card {
  position: relative;
  width: 100%;
  padding-bottom: 100%; /* Creates 1:1 aspect ratio */
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  cursor: pointer;
  transition: all var(--transition-base);
  box-shadow: 0 2px 8px rgba(15, 61, 46, 0.06);
}

.image-card:hover {
  border-color: var(--gold-primary);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(15, 61, 46, 0.12);
}

.image-card.selected {
  border-color: var(--gold-primary);
  box-shadow: 0 0 0 3px rgba(15, 61, 46, 0.2);
}

.image-card.converting {
  pointer-events: none;
  opacity: 0.7;
}

.image-thumb {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.selected-badge {
  position: absolute;
  top: var(--space-sm);
  right: var(--space-sm);
  width: 28px;
  height: 28px;
  border-radius: var(--radius-full);
  background: var(--gradient-gold);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

.converting-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3;
}

/* Responsive */
@media (max-width: 1024px) {
  .browser-layout {
    flex-direction: column;
    height: auto;
  }

  .folder-sidebar {
    width: 100%;
    max-height: 200px;
  }

  .image-grid-container {
    min-height: 400px;
  }
}

@media (max-width: 768px) {
  .tab-button {
    font-size: var(--text-sm);
    padding: var(--space-sm) var(--space-md);
  }

  .disabled-hint {
    display: none;
  }

  .image-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: var(--space-md);
  }
}
</style>

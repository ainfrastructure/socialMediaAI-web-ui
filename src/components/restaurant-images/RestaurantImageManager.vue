<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useBusinessImages } from '@/composables/useBusinessImages'
import type { SavedRestaurant } from '@/services/restaurantService'
import type { FolderNode } from '@/composables/useBusinessImages'
import CreateFolderModal from './CreateFolderModal.vue'
import RenameFolderModal from './RenameFolderModal.vue'
import MoveImagesModal from './MoveImagesModal.vue'
import UploadImagesModal from './UploadImagesModal.vue'
import ConfirmModal from '../ConfirmModal.vue'
import BaseButton from '../BaseButton.vue'
import MaterialIcon from '../MaterialIcon.vue'

interface Props {
  restaurant: SavedRestaurant
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'updated'): void
}>()

const { t } = useI18n()

const {
  folderStructure,
  currentFolderPath,
  currentFolder,
  filteredImages,
  selectedImages,
  hasSelection,
  breadcrumbs,
  searchQuery,
  sortBy,
  loading,
  error,
  navigateToFolder,
  toggleFolderExpansion,
  toggleImageSelection,
  deleteImages,
  createFolder,
  renameFolder,
  deleteFolder,
  moveImagesToFolder,
  refreshImages,
  applyNewImages
} = useBusinessImages(() => props.restaurant)

// Modal states
const showCreateFolderModal = ref(false)
const showRenameFolderModal = ref(false)
const showMoveImagesModal = ref(false)
const showUploadModal = ref(false)
const showDeleteConfirm = ref(false)
const showDeleteFolderConfirm = ref(false)
const isDeleting = ref(false)

// Current folder info
const currentFolderName = computed(() => {
  if (currentFolderPath.value === '/') return props.restaurant.name
  const parts = currentFolderPath.value.split('/')
  return parts[parts.length - 1]
})

const isRootFolder = computed(() => currentFolderPath.value === '/')

// Folder actions
async function handleCreateFolder(folderPath: string) {
  const success = await createFolder(folderPath)
  if (success) {
    emit('updated')
  }
}

async function handleRenameFolder(oldPath: string, newPath: string) {
  const success = await renameFolder(oldPath, newPath)
  if (success) {
    emit('updated')
  }
}

function promptDeleteFolder() {
  if (isRootFolder.value) return
  showDeleteFolderConfirm.value = true
}

async function confirmDeleteFolder() {
  if (isRootFolder.value) return

  isDeleting.value = true
  try {
    const success = await deleteFolder(currentFolderPath.value)
    if (success) {
      showDeleteFolderConfirm.value = false
      emit('updated')
    }
  } finally {
    isDeleting.value = false
  }
}

async function handleMoveImages(targetFolderPath: string) {
  const imageIds = selectedImages.value.map((img) => img.id)
  const success = await moveImagesToFolder(imageIds, targetFolderPath)
  if (success) {
    emit('updated')
  }
}

function promptDeleteImages() {
  if (!hasSelection.value) return
  showDeleteConfirm.value = true
}

async function confirmDeleteImages() {
  if (!hasSelection.value) return

  const imageIds = selectedImages.value.map((img) => img.id)
  isDeleting.value = true
  try {
    await deleteImages(imageIds)
    showDeleteConfirm.value = false
    emit('updated')
  } finally {
    isDeleting.value = false
  }
}

// Upload functionality
function triggerFileUpload() {
  showUploadModal.value = true
}

async function handleUploadComplete(uploadedImages: import('@/types/media').UploadedImage[]) {
  if (uploadedImages?.length) {
    applyNewImages(uploadedImages)
  }
  emit('updated')
  // Background sync for full consistency
  refreshImages()
}

// Recursive folder tree renderer
function renderFolderTreeItem(node: FolderNode, level: number = 0) {
  const isActive = currentFolderPath.value === node.path
  const hasChildren = node.children.length > 0

  return {
    node,
    level,
    isActive,
    hasChildren,
    isExpanded: node.isExpanded
  }
}

function getFlatFolderList(node: FolderNode, level: number = 0): any[] {
  const items: any[] = [renderFolderTreeItem(node, level)]

  if (node.isExpanded && node.children.length > 0) {
    for (const child of node.children) {
      items.push(...getFlatFolderList(child, level + 1))
    }
  }

  return items
}

const flatFolders = computed(() => {
  if (!folderStructure.value) return []
  return getFlatFolderList(folderStructure.value)
})

// Format file size
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
</script>

<template>
  <div class="image-manager">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <MaterialIcon icon="folder_open" size="sm" color="var(--gold-primary)" />
        <h3>{{ t('restaurantManagement.folderTree') }}</h3>
      </div>

      <div class="sidebar-actions">
        <BaseButton
          @click="showCreateFolderModal = true"
          variant="primary"
          size="small"
          full-width
        >
          <MaterialIcon icon="create_new_folder" size="xs" color="var(--text-on-gold)" />
          {{ t('restaurantManagement.newFolder') }}
        </BaseButton>
      </div>

      <div class="folder-list">
        <button
          v-for="item in flatFolders"
          :key="item.node.path"
          :class="['folder-item', { active: item.isActive }]"
          :style="{ paddingLeft: `${item.level * 16 + 12}px` }"
          @click="navigateToFolder(item.node.path)"
        >
          <span
            v-if="item.hasChildren"
            class="expand-icon"
            @click.stop="toggleFolderExpansion(item.node.path)"
          >
            <MaterialIcon :icon="item.isExpanded ? 'expand_more' : 'chevron_right'" size="xs" color="var(--text-muted)" />
          </span>
          <span v-else class="expand-spacer"></span>

          <MaterialIcon :icon="item.isActive ? 'folder_open' : 'folder'" size="sm" :color="item.isActive ? 'var(--gold-primary)' : 'var(--text-secondary)'" />
          <span class="folder-name">{{ item.node.name }}</span>
          <span class="folder-count">{{ item.node.imageCount }}</span>
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="content">
      <!-- Breadcrumbs & Actions -->
      <div class="content-header">
        <div class="breadcrumbs">
          <button
            v-for="(crumb, index) in breadcrumbs"
            :key="crumb.path"
            class="breadcrumb"
            @click="navigateToFolder(crumb.path)"
          >
            <MaterialIcon v-if="index === 0" icon="home" size="xs" color="currentColor" />
            <span v-else>{{ crumb.name }}</span>
            <MaterialIcon v-if="index < breadcrumbs.length - 1" icon="chevron_right" size="xs" color="var(--text-muted)" />
          </button>
        </div>

        <div v-if="!isRootFolder" class="header-actions">
          <button class="action-btn" @click="showRenameFolderModal = true">
            <MaterialIcon icon="edit" size="xs" color="currentColor" />
            {{ t('restaurantManagement.rename') }}
          </button>
          <button class="action-btn delete" @click="promptDeleteFolder">
            <MaterialIcon icon="delete_outline" size="xs" color="currentColor" />
            {{ t('restaurantManagement.delete') }}
          </button>
        </div>
      </div>

      <!-- Toolbar -->
      <div class="toolbar">
        <div class="search-wrapper">
          <MaterialIcon icon="search" size="sm" color="var(--text-muted)" />
          <input
            v-model="searchQuery"
            type="text"
            class="search-input"
            :placeholder="t('restaurantManagement.searchImages')"
          />
        </div>

        <div class="toolbar-actions">
          <BaseButton
            @click="triggerFileUpload"
            variant="primary"
            size="small"
          >
            <MaterialIcon icon="cloud_upload" size="xs" color="var(--text-on-gold)" />
            {{ t('restaurantManagement.uploadImages') }}
          </BaseButton>

          <div class="sort-wrapper">
            <MaterialIcon icon="sort" size="xs" color="var(--text-secondary)" />
            <select v-model="sortBy" class="sort-select">
              <option value="date">{{ t('restaurantManagement.sortByDate') }}</option>
              <option value="name">{{ t('restaurantManagement.sortByName') }}</option>
              <option value="size">{{ t('restaurantManagement.sortBySize') }}</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Bulk Actions -->
      <div v-if="hasSelection" class="bulk-actions">
        <div class="selection-info">
          <MaterialIcon icon="check_circle" size="sm" color="var(--gold-primary)" />
          <span class="selection-count">
            {{ t('restaurantManagement.selectedCount', { count: selectedImages.length }) }}
          </span>
        </div>

        <div class="bulk-buttons">
          <button class="bulk-btn move" @click="showMoveImagesModal = true">
            <MaterialIcon icon="drive_file_move" size="xs" color="currentColor" />
            {{ t('restaurantManagement.moveToFolder') }}
          </button>
          <button class="bulk-btn delete" @click="promptDeleteImages">
            <MaterialIcon icon="delete_outline" size="xs" color="currentColor" />
            {{ t('restaurantManagement.deleteSelected') }}
          </button>
        </div>
      </div>

      <!-- Image Grid -->
      <div v-if="loading" class="loading-state">
        <MaterialIcon icon="hourglass_empty" size="xl" color="var(--text-muted)" />
        <p>{{ t('common.loading') }}</p>
      </div>

      <div v-else-if="!filteredImages.length" class="empty-state">
        <div class="empty-icon-wrapper">
          <MaterialIcon icon="photo_library" size="xl" color="var(--gold-primary)" />
        </div>
        <p v-if="searchQuery" class="empty-message">
          {{ t('restaurantManagement.noImagesFound', { query: searchQuery }) }}
        </p>
        <template v-else-if="isRootFolder">
          <p class="empty-message">
            {{ t('restaurantManagement.noImagesInFolder') }}
          </p>
          <p class="empty-hint">
            {{ t('restaurantManagement.createFolderFirst') }}
          </p>
        </template>
        <template v-else>
          <p class="empty-message">
            {{ t('restaurantManagement.noImagesInFolder') }}
          </p>
          <BaseButton @click="triggerFileUpload" variant="primary">
            <MaterialIcon icon="cloud_upload" size="xs" color="var(--text-on-gold)" />
            {{ t('restaurantManagement.uploadImages') }}
          </BaseButton>
        </template>
      </div>

      <div v-else class="image-grid">
        <div
          v-for="image in filteredImages"
          :key="image.id"
          :class="['image-card', { selected: selectedImages.some(img => img.id === image.id) }]"
          @click="toggleImageSelection(image.id)"
        >
          <div class="image-select-indicator">
            <div class="select-circle">
              <MaterialIcon v-if="selectedImages.some(img => img.id === image.id)" icon="check" size="xs" color="#fff" />
            </div>
          </div>

          <img :src="image.url" :alt="image.storage_path" class="image-thumb" />

          <div class="image-overlay">
            <div class="image-info">
              <span class="image-size">{{ formatFileSize(image.file_size) }}</span>
              <span class="image-dims">{{ image.width }}×{{ image.height }}</span>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Modals -->
    <CreateFolderModal
      v-model="showCreateFolderModal"
      :current-path="currentFolderPath"
      @create="handleCreateFolder"
    />

    <RenameFolderModal
      v-model="showRenameFolderModal"
      :folder-path="currentFolderPath"
      :folder-name="currentFolderName"
      @rename="handleRenameFolder"
    />

    <MoveImagesModal
      v-model="showMoveImagesModal"
      :selected-count="selectedImages.length"
      :folder-structure="folderStructure"
      @move="handleMoveImages"
    />

    <UploadImagesModal
      v-model="showUploadModal"
      :restaurant="restaurant"
      :folder-structure="folderStructure"
      :current-folder-path="currentFolderPath"
      @uploaded="handleUploadComplete"
    />

    <!-- Delete Images Confirm -->
    <ConfirmModal
      v-model="showDeleteConfirm"
      type="danger"
      :title="t('restaurantManagement.deleteImages')"
      :message="t('restaurantManagement.bulkDeleteConfirm', { count: selectedImages.length })"
      :confirm-text="t('common.delete')"
      :cancel-text="t('common.cancel')"
      :loading-text="t('common.deleting')"
      :loading="isDeleting"
      :auto-close-seconds="0"
      @confirm="confirmDeleteImages"
    />

    <!-- Delete Folder Confirm -->
    <ConfirmModal
      v-model="showDeleteFolderConfirm"
      type="danger"
      :title="t('restaurantManagement.deleteFolder')"
      :message="t('restaurantManagement.deleteFolderConfirm', { name: currentFolderName })"
      :confirm-text="t('common.delete')"
      :cancel-text="t('common.cancel')"
      :loading-text="t('common.deleting')"
      :loading="isDeleting"
      :auto-close-seconds="0"
      @confirm="confirmDeleteFolder"
    />
  </div>
</template>

<style scoped>
.image-manager {
  display: flex;
  height: 75vh;
  min-height: 600px;
  background: var(--bg-primary);
  border-radius: var(--radius-xl);
  overflow: hidden;
  border: 1px solid var(--border-color);
}

/* ===== Sidebar ===== */
.sidebar {
  width: 280px;
  flex-shrink: 0;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-xl) var(--space-xl) var(--space-lg);
}

.sidebar-header h3 {
  margin: 0;
  font-family: var(--font-heading);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  letter-spacing: -0.01em;
}

.sidebar-actions {
  padding: 0 var(--space-lg) var(--space-lg);
}

.folder-list {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-xs) var(--space-sm);
  border-top: 1px solid var(--border-color);
}

.folder-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  margin: 2px 0;
  background: none;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  font-family: var(--font-body);
  font-size: var(--text-sm);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
}

.folder-item:hover {
  background: rgba(15, 61, 46, 0.05);
  color: var(--text-primary);
}

.folder-item.active {
  background: var(--bg-primary);
  color: var(--gold-primary);
  font-weight: var(--font-medium);
  box-shadow: 0 1px 4px rgba(15, 61, 46, 0.06);
}

.expand-icon {
  width: 18px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: background 0.15s ease;
}

.expand-icon:hover {
  background: rgba(15, 61, 46, 0.08);
}

.expand-spacer {
  width: 18px;
  flex-shrink: 0;
}

.folder-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.folder-count {
  font-size: 0.65rem;
  font-weight: var(--font-semibold);
  color: var(--text-muted);
  background: rgba(15, 61, 46, 0.06);
  padding: 1px 7px;
  border-radius: var(--radius-full);
  min-width: 20px;
  text-align: center;
}

.folder-item.active .folder-count {
  background: rgba(15, 61, 46, 0.12);
  color: var(--gold-primary);
}

/* ===== Main Content ===== */
.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--bg-primary);
}

.content-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-lg) var(--space-xl);
  border-bottom: 1px solid var(--border-color);
}

.breadcrumbs {
  display: flex;
  align-items: center;
  gap: 2px;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  background: none;
  border: none;
  padding: var(--space-xs) var(--space-sm);
  color: var(--text-muted);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: var(--radius-md);
}

.breadcrumb:hover {
  color: var(--text-primary);
  background: rgba(15, 61, 46, 0.04);
}

.breadcrumb:last-child {
  color: var(--text-primary);
  font-weight: var(--font-medium);
}

.header-actions {
  display: flex;
  gap: var(--space-sm);
}

.action-btn {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-md);
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.action-btn:hover {
  background: var(--bg-secondary);
  border-color: rgba(15, 61, 46, 0.2);
  color: var(--gold-primary);
}

.action-btn.delete {
  color: var(--error-text);
  border-color: rgba(239, 68, 68, 0.15);
}

.action-btn.delete:hover {
  background: var(--error-bg);
  border-color: var(--error-border);
}

/* ===== Toolbar ===== */
.toolbar {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  padding: var(--space-md) var(--space-xl);
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-secondary);
}

.search-wrapper {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex: 1;
  max-width: 400px;
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  transition: all 0.2s ease;
}

.search-wrapper:focus-within {
  border-color: var(--gold-primary);
  box-shadow: 0 0 0 3px rgba(15, 61, 46, 0.08);
}

.search-input {
  flex: 1;
  padding: 0;
  background: transparent;
  border: none;
  font-family: var(--font-body);
  font-size: var(--text-sm);
  color: var(--text-primary);
}

.search-input:focus {
  outline: none;
}

.search-input::placeholder {
  color: var(--text-muted);
}

.toolbar-actions {
  display: flex;
  gap: var(--space-sm);
  margin-left: auto;
  align-items: center;
}

.sort-wrapper {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  transition: all 0.2s ease;
}

.sort-wrapper:focus-within {
  border-color: var(--gold-primary);
}

.sort-select {
  padding: 0;
  background: transparent;
  border: none;
  font-family: var(--font-body);
  font-size: var(--text-sm);
  color: var(--text-primary);
  cursor: pointer;
  -webkit-appearance: none;
  appearance: none;
}

.sort-select:focus {
  outline: none;
}

/* ===== Bulk Actions ===== */
.bulk-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md) var(--space-xl);
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  animation: slideDown 0.2s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.selection-info {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.selection-count {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.bulk-buttons {
  display: flex;
  gap: var(--space-sm);
}

.bulk-btn {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-md);
  border: none;
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.bulk-btn.move {
  background: rgba(15, 61, 46, 0.1);
  color: var(--gold-primary);
}

.bulk-btn.move:hover {
  background: var(--gold-primary);
  color: #fff;
  box-shadow: 0 2px 8px rgba(15, 61, 46, 0.2);
}

.bulk-btn.delete {
  background: rgba(239, 68, 68, 0.08);
  color: var(--error-text);
}

.bulk-btn.delete:hover {
  background: var(--error-text);
  color: #fff;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.25);
}

/* ===== States ===== */
.loading-state,
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-5xl) var(--space-2xl);
  gap: var(--space-md);
}

.loading-state p {
  color: var(--text-muted);
  font-size: var(--text-sm);
}

.empty-icon-wrapper {
  width: 72px;
  height: 72px;
  border-radius: var(--radius-xl);
  background: rgba(15, 61, 46, 0.06);
  border: 1px solid rgba(15, 61, 46, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-sm);
}

.empty-message {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  color: var(--text-primary);
  letter-spacing: -0.01em;
  margin: 0;
}

.empty-hint {
  font-size: var(--text-sm);
  color: var(--text-muted);
  margin: 0 0 var(--space-lg);
}

/* ===== Image Grid ===== */
.image-grid {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-xl);
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--space-lg);
  align-content: start;
}

.image-card {
  position: relative;
  width: 100%;
  padding-bottom: 100%;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.image-card:hover {
  border-color: rgba(15, 61, 46, 0.25);
  transform: translateY(-3px);
  box-shadow:
    0 8px 24px rgba(15, 61, 46, 0.1),
    0 2px 8px rgba(15, 61, 46, 0.06);
}

.image-card.selected {
  border-color: var(--gold-primary);
  box-shadow:
    0 0 0 2px var(--gold-primary),
    0 4px 16px rgba(15, 61, 46, 0.12);
}

/* ===== Selection Indicator ===== */
.image-select-indicator {
  position: absolute;
  top: var(--space-sm);
  left: var(--space-sm);
  z-index: 2;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.image-card:hover .image-select-indicator,
.image-card.selected .image-select-indicator {
  opacity: 1;
}

.select-circle {
  width: 24px;
  height: 24px;
  border-radius: var(--radius-full);
  border: 2px solid rgba(255, 255, 255, 0.8);
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.image-card.selected .select-circle {
  background: var(--gold-primary);
  border-color: var(--gold-primary);
}

.image-thumb {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.image-card:hover .image-thumb {
  transform: scale(1.04);
}

.image-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.2) 60%, transparent 100%);
  padding: var(--space-xl) var(--space-md) var(--space-md);
  opacity: 0;
  transition: opacity 0.25s ease;
}

.image-card:hover .image-overlay {
  opacity: 1;
}

.image-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.image-size,
.image-dims {
  font-size: var(--text-xs);
  color: rgba(255, 255, 255, 0.9);
  font-weight: var(--font-medium);
  letter-spacing: 0.02em;
}

/* ===== Responsive ===== */
@media (max-width: 768px) {
  .image-manager {
    flex-direction: column;
    height: auto;
    min-height: 500px;
  }

  .sidebar {
    width: 100%;
    max-height: 220px;
    border-right: none;
    border-bottom: 1px solid var(--border-color);
  }

  .content-header {
    padding: var(--space-md) var(--space-lg);
    flex-wrap: wrap;
    gap: var(--space-sm);
  }

  .header-actions {
    width: 100%;
  }

  .action-btn {
    flex: 1;
    justify-content: center;
  }

  .toolbar {
    flex-direction: column;
    align-items: stretch;
    padding: var(--space-md) var(--space-lg);
    gap: var(--space-sm);
  }

  .search-wrapper {
    max-width: none;
  }

  .toolbar-actions {
    margin-left: 0;
    flex-direction: column;
  }

  .image-grid {
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    padding: var(--space-lg);
    gap: var(--space-md);
  }

  .bulk-actions {
    padding: var(--space-md) var(--space-lg);
    flex-wrap: wrap;
    gap: var(--space-sm);
  }

  .bulk-buttons {
    width: 100%;
    flex-direction: column;
  }
}

@media (prefers-reduced-motion: reduce) {
  .image-card,
  .folder-item,
  .breadcrumb,
  .bulk-btn,
  .bulk-actions {
    transition: none;
    animation: none;
  }

  .image-card:hover {
    transform: none;
  }

  .image-card:hover .image-thumb {
    transform: none;
  }

  .bulk-btn:hover {
    transform: none;
  }
}
</style>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useBusinessImages } from '@/composables/useBusinessImages'
import { businessService } from '@/services/businessService'
import type { SavedBusiness } from '@/services/businessService'
import type { FolderNode } from '@/composables/useBusinessImages'
import CreateFolderModal from './CreateFolderModal.vue'
import RenameFolderModal from './RenameFolderModal.vue'
import MoveImagesModal from './MoveImagesModal.vue'
import UploadImagesModal from './UploadImagesModal.vue'
import ConfirmModal from '../ConfirmModal.vue'
import BaseButton from '../BaseButton.vue'

interface Props {
  business: SavedBusiness
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
  moveImagesToFolder
} = useBusinessImages(props.business)

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
  if (currentFolderPath.value === '/') return props.business.name
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

function handleUploadComplete() {
  emit('updated')
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
        <h3>{{ t('businessManagement.folderTree') }}</h3>
      </div>

      <div class="sidebar-actions">
        <BaseButton
          @click="showCreateFolderModal = true"
          variant="primary"
          size="small"
          full-width
        >
          + {{ t('businessManagement.newFolder') }}
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
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path :d="item.isExpanded ? 'M6 9l6 6 6-6' : 'M9 18l6-6-6-6'" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
          <span v-else class="expand-spacer"></span>

          <span class="folder-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
          <span class="folder-name">{{ item.node.name }}</span>
          <span class="folder-count">({{ item.node.imageCount }})</span>
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
            {{ crumb.name }}
            <span v-if="index < breadcrumbs.length - 1" class="separator">/</span>
          </button>
        </div>

        <div v-if="!isRootFolder" class="header-actions">
          <button class="action-btn" @click="showRenameFolderModal = true">
            {{ t('businessManagement.rename') }}
          </button>
          <button class="action-btn delete" @click="promptDeleteFolder">
            {{ t('businessManagement.delete') }}
          </button>
        </div>
      </div>

      <!-- Toolbar -->
      <div class="toolbar">
        <input
          v-model="searchQuery"
          type="text"
          class="search-input"
          :placeholder="t('businessManagement.searchImages')"
        />

        <div class="toolbar-actions">
          <BaseButton
            @click="triggerFileUpload"
            variant="primary"
            size="small"
          >
            {{ t('businessManagement.uploadImages') }}
          </BaseButton>

          <select v-model="sortBy" class="sort-select">
            <option value="date">{{ t('businessManagement.sortByDate') }}</option>
            <option value="name">{{ t('businessManagement.sortByName') }}</option>
            <option value="size">{{ t('businessManagement.sortBySize') }}</option>
          </select>
        </div>
      </div>

      <!-- Bulk Actions -->
      <div v-if="hasSelection" class="bulk-actions">
        <span class="selection-count">
          {{ t('businessManagement.selectedCount', { count: selectedImages.length }) }}
        </span>

        <div class="bulk-buttons">
          <button class="bulk-btn move" @click="showMoveImagesModal = true">
            {{ t('businessManagement.moveToFolder') }}
          </button>
          <button class="bulk-btn delete" @click="promptDeleteImages">
            {{ t('businessManagement.deleteSelected') }}
          </button>
        </div>
      </div>

      <!-- Image Grid -->
      <div v-if="loading" class="loading-state">
        {{ t('common.loading') }}
      </div>

      <div v-else-if="!filteredImages.length" class="empty-state">
        <div class="empty-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="4" width="18" height="16" rx="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M3 16L8 11L11 14L16 8L21 14" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="17" cy="8" r="2"/>
          </svg>
        </div>
        <p v-if="searchQuery" class="empty-message">
          {{ t('businessManagement.noImagesFound', { query: searchQuery }) }}
        </p>
        <template v-else-if="isRootFolder">
          <p class="empty-message">
            {{ t('businessManagement.noImagesInFolder') }}
          </p>
          <p class="empty-hint">
            {{ t('businessManagement.createFolderFirst') }}
          </p>
        </template>
        <template v-else>
          <p class="empty-message">
            {{ t('businessManagement.noImagesInFolder') }}
          </p>
          <BaseButton @click="triggerFileUpload" variant="primary">
            {{ t('businessManagement.uploadImages') }}
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
          <div class="image-checkbox">
            <input
              type="checkbox"
              :checked="selectedImages.some(img => img.id === image.id)"
              @click.stop="toggleImageSelection(image.id)"
            />
          </div>

          <img :src="image.url" :alt="image.storage_path" class="image-thumb" />

          <div class="image-overlay">
            <div class="image-info">
              <p class="image-size">{{ formatFileSize(image.file_size) }}</p>
              <p class="image-dims">{{ image.width }}×{{ image.height }}</p>
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
      :business="business"
      :folder-structure="folderStructure"
      :current-folder-path="currentFolderPath"
      @uploaded="handleUploadComplete"
    />

    <!-- Delete Images Confirm -->
    <ConfirmModal
      v-model="showDeleteConfirm"
      type="danger"
      :title="t('businessManagement.deleteImages')"
      :message="t('businessManagement.bulkDeleteConfirm', { count: selectedImages.length })"
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
      :title="t('businessManagement.deleteFolder')"
      :message="t('businessManagement.deleteFolderConfirm', { name: currentFolderName })"
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
  box-shadow: 0 4px 20px rgba(15, 61, 46, 0.08);
}

/* Sidebar */
.sidebar {
  width: 300px;
  flex-shrink: 0;
  background: var(--bg-secondary);
  border-right: 1px solid rgba(15, 61, 46, 0.12);
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: var(--space-xl);
  border-bottom: 1px solid rgba(15, 61, 46, 0.1);
}

.sidebar-header h3 {
  margin: 0;
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  font-family: var(--font-heading);
}

.sidebar-actions {
  padding: var(--space-lg);
  border-bottom: 1px solid rgba(15, 61, 46, 0.1);
}

.folder-list {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-sm) 0;
}

.folder-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-lg);
  background: none;
  border: none;
  cursor: pointer;
  transition: all var(--transition-base);
  text-align: left;
  font-family: var(--font-body);
  font-size: var(--text-sm);
  border-left: 3px solid transparent;
}

.folder-item:hover {
  background: rgba(15, 61, 46, 0.06);
}

.folder-item.active {
  background: rgba(15, 61, 46, 0.12);
  border-left-color: var(--gold-primary);
  font-weight: var(--font-medium);
}

.expand-icon {
  width: 18px;
  color: var(--text-muted);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform var(--transition-base);
}

.expand-icon svg {
  display: block;
}

.expand-spacer {
  width: 18px;
  flex-shrink: 0;
}

.folder-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  color: var(--gold-primary);
}

.folder-icon svg {
  display: block;
}

.folder-name {
  flex: 1;
  color: var(--text-primary);
}

.folder-item.active .folder-name {
  color: var(--gold-primary);
}

.folder-count {
  font-size: var(--text-xs);
  color: var(--text-muted);
  background: rgba(15, 61, 46, 0.08);
  padding: 2px 8px;
  border-radius: var(--radius-full);
}

/* Main Content */
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
  padding: var(--space-xl) var(--space-2xl);
  border-bottom: 1px solid rgba(15, 61, 46, 0.1);
}

.breadcrumbs {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.breadcrumb {
  background: none;
  border: none;
  padding: var(--space-xs) var(--space-sm);
  color: var(--text-secondary);
  font-family: var(--font-body);
  font-size: var(--text-base);
  cursor: pointer;
  transition: all var(--transition-base);
  border-radius: var(--radius-md);
}

.breadcrumb:hover {
  color: var(--text-primary);
  background: rgba(15, 61, 46, 0.05);
}

.breadcrumb:last-child {
  color: var(--text-primary);
  font-weight: var(--font-medium);
}

.separator {
  margin: 0 var(--space-xs);
  color: var(--text-muted);
}

.header-actions {
  display: flex;
  gap: var(--space-md);
}

.action-btn {
  padding: var(--space-sm) var(--space-lg);
  background: var(--bg-secondary);
  border: 1px solid rgba(15, 61, 46, 0.15);
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-primary);
  cursor: pointer;
  transition: all var(--transition-base);
}

.action-btn:hover {
  background: rgba(15, 61, 46, 0.08);
  border-color: rgba(15, 61, 46, 0.25);
  color: var(--gold-primary);
}

.action-btn.delete {
  color: var(--error-text);
}

.action-btn.delete:hover {
  background: var(--error-bg);
  border-color: var(--error-border);
  color: var(--error-text);
}

/* Toolbar */
.toolbar {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  padding: var(--space-lg) var(--space-2xl);
  border-bottom: 1px solid rgba(15, 61, 46, 0.1);
  background: var(--bg-primary);
}

.search-input {
  flex: 1;
  max-width: 450px;
  padding: var(--space-md) var(--space-lg);
  background: var(--bg-secondary);
  border: 1px solid rgba(15, 61, 46, 0.15);
  border-radius: var(--radius-lg);
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--text-primary);
  transition: all var(--transition-base);
}

.search-input:focus {
  outline: none;
  border-color: var(--gold-primary);
  box-shadow: 0 0 0 3px rgba(15, 61, 46, 0.1);
}

.toolbar-actions {
  display: flex;
  gap: var(--space-md);
  margin-left: auto;
}

.sort-select {
  padding: var(--space-md) var(--space-lg);
  background: var(--bg-secondary);
  border: 1px solid rgba(15, 61, 46, 0.15);
  border-radius: var(--radius-lg);
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--text-primary);
  cursor: pointer;
  transition: all var(--transition-base);
}

.sort-select:focus {
  outline: none;
  border-color: var(--gold-primary);
  box-shadow: 0 0 0 3px rgba(15, 61, 46, 0.1);
}

/* Bulk Actions */
.bulk-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-lg) var(--space-2xl);
  background: rgba(15, 61, 46, 0.08);
  border-bottom: 1px solid rgba(15, 61, 46, 0.15);
}

.selection-count {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.bulk-buttons {
  display: flex;
  gap: var(--space-md);
}

.bulk-btn {
  padding: var(--space-sm) var(--space-lg);
  border: none;
  border-radius: var(--radius-lg);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  cursor: pointer;
  transition: all var(--transition-base);
}

.bulk-btn.move {
  background: rgba(15, 61, 46, 0.15);
  color: var(--gold-primary);
}

.bulk-btn.move:hover {
  background: var(--gold-primary);
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(15, 61, 46, 0.2);
}

.bulk-btn.delete {
  background: var(--error-bg);
  color: var(--error-text);
  border: 1px solid var(--error-border);
}

.bulk-btn.delete:hover {
  background: var(--error-text);
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

/* States */
.loading-state,
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-5xl);
  color: var(--text-secondary);
}

.empty-icon {
  margin-bottom: var(--space-xl);
  opacity: 0.25;
  color: var(--text-muted);
}

.empty-icon svg {
  display: block;
}

.empty-message {
  font-size: var(--text-lg);
  margin-bottom: var(--space-md);
  color: var(--text-secondary);
}

.empty-hint {
  font-size: var(--text-base);
  margin-bottom: var(--space-xl);
  color: var(--text-muted);
  font-style: italic;
}

/* Image Grid */
.image-grid {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-2xl);
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: var(--space-xl);
  align-content: start;
}

.image-card {
  position: relative;
  width: 100%;
  padding-bottom: 100%; /* Creates 1:1 aspect ratio */
  border-radius: var(--radius-xl);
  overflow: hidden;
  background: var(--bg-secondary);
  border: 2px solid rgba(15, 61, 46, 0.12);
  cursor: pointer;
  transition: all var(--transition-base);
  box-shadow: 0 2px 8px rgba(15, 61, 46, 0.06);
}

.image-card:hover {
  border-color: var(--gold-primary);
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(15, 61, 46, 0.15);
}

.image-card.selected {
  border-color: var(--gold-primary);
  box-shadow: 0 0 0 4px rgba(15, 61, 46, 0.15);
}

.image-checkbox {
  position: absolute;
  top: var(--space-md);
  left: var(--space-md);
  z-index: 2;
  opacity: 0;
  transition: opacity var(--transition-base);
}

.image-card:hover .image-checkbox,
.image-card.selected .image-checkbox {
  opacity: 1;
}

.image-checkbox input {
  width: 24px;
  height: 24px;
  cursor: pointer;
  accent-color: var(--gold-primary);
}

.image-thumb {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
  padding: var(--space-lg);
  opacity: 0;
  transition: opacity var(--transition-base);
}

.image-card:hover .image-overlay {
  opacity: 1;
}

.image-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.image-size,
.image-dims {
  margin: 0;
  font-size: var(--text-sm);
  color: white;
  line-height: 1.4;
  font-weight: var(--font-medium);
}

/* Responsive */
@media (max-width: 768px) {
  .image-manager {
    flex-direction: column;
    height: auto;
    min-height: 500px;
  }

  .sidebar {
    width: 100%;
    max-height: 250px;
  }

  .content-header {
    padding: var(--space-lg) var(--space-lg);
    flex-wrap: wrap;
    gap: var(--space-md);
  }

  .header-actions {
    width: 100%;
    justify-content: stretch;
  }

  .action-btn {
    flex: 1;
  }

  .toolbar {
    flex-direction: column;
    align-items: stretch;
    padding: var(--space-lg);
    gap: var(--space-md);
  }

  .search-input {
    max-width: none;
  }

  .toolbar-actions {
    margin-left: 0;
    flex-direction: column;
  }

  .image-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    padding: var(--space-lg);
    gap: var(--space-lg);
  }

  .bulk-actions {
    padding: var(--space-lg);
    flex-wrap: wrap;
    gap: var(--space-md);
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
  .bulk-btn {
    transition: none;
  }

  .image-card:hover {
    transform: none;
  }

  .bulk-btn:hover {
    transform: none;
  }
}
</style>

<script setup lang="ts">
/**
 * MediaLibraryPicker - Select existing posts/media for carousel
 * Shows user's saved posts in a grid, allows multi-select and reordering
 */
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from '@/services/api'
import MaterialIcon from '../MaterialIcon.vue'
import BaseCard from '../BaseCard.vue'
import type { CarouselItem } from '@/types/scheduling'

interface Props {
  modelValue: CarouselItem[]
  minItems?: number
  maxItems?: number
  brandId?: string
}

const props = withDefaults(defineProps<Props>(), {
  minItems: 2,
  maxItems: 10
})

const emit = defineEmits<{
  (e: 'update:modelValue', items: CarouselItem[]): void
}>()

const { t } = useI18n()

interface MediaItem {
  id: string
  mediaUrl: string
  videoUrl?: string
  contentType: 'image' | 'video'
  postText?: string
  createdAt: string
  thumbnail?: string
}

const loading = ref(true)
const mediaLibrary = ref<MediaItem[]>([])
const selectedItems = ref<Set<string>>(new Set())
const draggedIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)

// Computed selection order (maintains order of selection)
const orderedSelection = computed(() => {
  return props.modelValue
})

const canSelectMore = computed(() => {
  return selectedItems.value.size < props.maxItems
})

const isValid = computed(() => {
  return selectedItems.value.size >= props.minItems && selectedItems.value.size <= props.maxItems
})

// Load media library
onMounted(async () => {
  try {
    loading.value = true

    // Fetch user's favorite posts
    const response = await api.getFavorites({
      limit: 100,
      ...(props.brandId && { brand_id: props.brandId })
    })

    if (response.success && response.data?.favorites) {
      mediaLibrary.value = response.data.favorites
        .filter((post: any) => post.media_url || post.video_url)
        .map((post: any) => ({
          id: post.id,
          mediaUrl: post.media_url || post.video_url,
          videoUrl: post.video_url,
          contentType: post.video_url ? 'video' : 'image',
          postText: post.post_text,
          createdAt: post.created_at,
          thumbnail: post.media_url || post.video_url
        }))
    }
  } catch (error) {
    console.error('Failed to load media library:', error)
  } finally {
    loading.value = false
  }
})

// Toggle item selection
function toggleSelection(item: MediaItem) {
  if (selectedItems.value.has(item.id)) {
    // Remove from selection
    selectedItems.value.delete(item.id)
    const newSelection = props.modelValue.filter(i =>
      i.mediaUrl !== item.mediaUrl && i.mediaUrl !== item.videoUrl
    )
    emit('update:modelValue', newSelection)
  } else {
    // Add to selection (if space available)
    if (canSelectMore.value) {
      selectedItems.value.add(item.id)

      const carouselItem: CarouselItem = {
        mediaUrl: item.videoUrl || item.mediaUrl,
        contentType: item.contentType,
        previewUrl: item.thumbnail
      }

      emit('update:modelValue', [...props.modelValue, carouselItem])
    }
  }
}

// Check if item is selected
function isSelected(item: MediaItem): boolean {
  return selectedItems.value.has(item.id)
}

// Get selection order number
function getSelectionOrder(item: MediaItem): number {
  const index = props.modelValue.findIndex(i =>
    i.mediaUrl === item.mediaUrl || i.mediaUrl === item.videoUrl
  )
  return index + 1
}

// Drag and drop reordering
function handleDragStart(index: number, event: DragEvent) {
  draggedIndex.value = index
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
  }
}

function handleDragOver(event: DragEvent, index: number) {
  event.preventDefault()
  dragOverIndex.value = index
}

function handleDragLeave() {
  dragOverIndex.value = null
}

function handleDrop(event: DragEvent, dropIndex: number) {
  event.preventDefault()

  if (draggedIndex.value === null || draggedIndex.value === dropIndex) {
    draggedIndex.value = null
    dragOverIndex.value = null
    return
  }

  const newItems = [...props.modelValue]
  const [draggedItem] = newItems.splice(draggedIndex.value, 1)
  newItems.splice(dropIndex, 0, draggedItem)

  emit('update:modelValue', newItems)

  draggedIndex.value = null
  dragOverIndex.value = null
}

function handleDragEnd() {
  draggedIndex.value = null
  dragOverIndex.value = null
}

// Clear all selections
function clearSelections() {
  selectedItems.value.clear()
  emit('update:modelValue', [])
}
</script>

<template>
  <div class="media-library-picker">
    <!-- Header -->
    <div class="picker-header">
      <div class="header-left">
        <MaterialIcon icon="photo_library" size="md" :color="'var(--gold-primary)'" />
        <div class="header-text">
          <h3 class="header-title">{{ t('contentCreate.selectFromLibrary', 'Select from Library') }}</h3>
          <p class="header-subtitle">
            {{ t('contentCreate.librarySubtitle', 'Choose 2-10 images or videos from your saved posts') }}
          </p>
        </div>
      </div>

      <div class="selection-info">
        <span class="selection-count" :class="{ valid: isValid, invalid: !isValid && selectedItems.size > 0 }">
          {{ selectedItems.size }} / {{ maxItems }}
        </span>
        <button
          v-if="selectedItems.size > 0"
          class="clear-btn"
          @click="clearSelections"
        >
          {{ t('common.clear', 'Clear') }}
        </button>
      </div>
    </div>

    <!-- Selected Items Preview (Reorderable) -->
    <div v-if="selectedItems.size > 0" class="selected-preview">
      <div class="preview-header">
        <MaterialIcon icon="drag_indicator" size="sm" :color="'var(--text-muted)'" />
        <span class="preview-label">{{ t('contentCreate.selectedOrder', 'Selected Order (drag to reorder)') }}</span>
      </div>

      <div class="selected-grid">
        <div
          v-for="(item, index) in orderedSelection"
          :key="index"
          class="selected-item"
          :class="{
            dragging: draggedIndex === index,
            'drag-over': dragOverIndex === index
          }"
          draggable="true"
          @dragstart="handleDragStart(index, $event)"
          @dragover="handleDragOver($event, index)"
          @dragleave="handleDragLeave"
          @drop="handleDrop($event, index)"
          @dragend="handleDragEnd"
        >
          <img :src="item.previewUrl || item.mediaUrl" :alt="`Selected ${index + 1}`" class="selected-thumbnail" />
          <div class="selected-number">{{ index + 1 }}</div>
          <div v-if="item.contentType === 'video'" class="video-indicator">
            <MaterialIcon icon="play_circle" size="xs" :color="'white'" />
          </div>
        </div>
      </div>
    </div>

    <!-- Media Grid -->
    <div v-if="loading" class="loading-state">
      <MaterialIcon icon="image" size="xl" :color="'var(--text-muted)'" />
      <p>{{ t('common.loading', 'Loading...') }}</p>
    </div>

    <div v-else-if="mediaLibrary.length === 0" class="empty-state">
      <MaterialIcon icon="photo_library" size="xl" :color="'var(--text-muted)'" />
      <p>{{ t('contentCreate.noSavedMedia', 'No saved posts found') }}</p>
      <p class="empty-hint">{{ t('contentCreate.createPostsFirst', 'Create some posts first to use them in carousels') }}</p>
    </div>

    <div v-else class="media-grid">
      <div
        v-for="item in mediaLibrary"
        :key="item.id"
        class="media-item"
        :class="{
          selected: isSelected(item),
          disabled: !canSelectMore && !isSelected(item)
        }"
        @click="toggleSelection(item)"
      >
        <div class="media-thumbnail-wrapper">
          <img :src="item.thumbnail" :alt="item.postText || 'Media'" class="media-thumbnail" />

          <!-- Video indicator -->
          <div v-if="item.contentType === 'video'" class="video-badge">
            <MaterialIcon icon="play_circle" size="sm" :color="'white'" />
          </div>

          <!-- Selection overlay -->
          <div v-if="isSelected(item)" class="selection-overlay">
            <div class="selection-check">
              <MaterialIcon icon="check_circle" size="md" :color="'white'" />
            </div>
            <div class="selection-number-badge">{{ getSelectionOrder(item) }}</div>
          </div>

          <!-- Disabled overlay -->
          <div v-else-if="!canSelectMore" class="disabled-overlay">
            <span class="disabled-text">{{ t('common.max', 'Max') }} {{ maxItems }}</span>
          </div>
        </div>

        <p v-if="item.postText" class="media-caption">{{ item.postText.substring(0, 50) }}...</p>
      </div>
    </div>

    <!-- Validation message -->
    <div v-if="selectedItems.size > 0 && !isValid" class="validation-message">
      <MaterialIcon icon="info" size="sm" :color="'var(--warning-text)'" />
      <span v-if="selectedItems.size < minItems">
        {{ t('contentCreate.selectMoreItems', { count: minItems - selectedItems.size }) }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.media-library-picker {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  width: 100%;
}

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-md);
  background: var(--bg-tertiary);
  border-radius: var(--radius-lg);
  gap: var(--space-md);
  flex-wrap: wrap;
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  flex: 1;
}

.header-text {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.header-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0;
}

.header-subtitle {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: 0;
}

.selection-info {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.selection-count {
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  color: var(--text-secondary);
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
}

.selection-count.valid {
  color: var(--gold-primary);
  background: var(--gold-subtle);
}

.selection-count.invalid {
  color: var(--error-text);
  background: var(--error-bg);
}

.clear-btn {
  padding: var(--space-sm) var(--space-md);
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: var(--transition-base);
}

.clear-btn:hover {
  background: var(--bg-elevated);
  border-color: var(--gold-primary);
  color: var(--gold-primary);
}

.selected-preview {
  padding: var(--space-lg);
  background: var(--gold-subtle);
  border: 2px solid var(--gold-primary);
  border-radius: var(--radius-lg);
}

.preview-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}

.preview-label {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.selected-grid {
  display: flex;
  gap: var(--space-md);
  overflow-x: auto;
  padding-bottom: var(--space-sm);
}

.selected-item {
  position: relative;
  flex-shrink: 0;
  width: 100px;
  height: 100px;
  border-radius: var(--radius-md);
  overflow: hidden;
  cursor: grab;
  transition: var(--transition-base);
  border: 2px solid var(--gold-primary);
}

.selected-item:active {
  cursor: grabbing;
}

.selected-item.dragging {
  opacity: 0.5;
  scale: 0.95;
}

.selected-item.drag-over {
  border-color: var(--gold-light);
  box-shadow: var(--glow-gold-md);
}

.selected-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.selected-number {
  position: absolute;
  top: var(--space-xs);
  left: var(--space-xs);
  width: 24px;
  height: 24px;
  border-radius: var(--radius-full);
  background: var(--gradient-gold);
  color: var(--text-on-gold);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
}

.media-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: var(--space-md);
  max-height: 500px;
  overflow-y: auto;
  padding: var(--space-sm);
}

.media-item {
  cursor: pointer;
  transition: var(--transition-base);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.media-item:hover:not(.disabled) {
  transform: translateY(-2px);
}

.media-item.selected {
  opacity: 0.7;
}

.media-item.disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.media-thumbnail-wrapper {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: var(--radius-md);
  border: 2px solid transparent;
  transition: var(--transition-base);
}

.media-item:hover .media-thumbnail-wrapper {
  border-color: var(--gold-primary);
}

.media-item.selected .media-thumbnail-wrapper {
  border-color: var(--gold-primary);
  box-shadow: var(--glow-gold-sm);
}

.media-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-badge {
  position: absolute;
  bottom: var(--space-xs);
  right: var(--space-xs);
  background: rgba(0, 0, 0, 0.7);
  border-radius: var(--radius-sm);
  padding: var(--space-xs);
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-indicator {
  position: absolute;
  bottom: var(--space-xs);
  right: var(--space-xs);
  background: rgba(0, 0, 0, 0.7);
  border-radius: var(--radius-sm);
  padding: 2px;
}

.selection-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 61, 46, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
}

.selection-check {
  display: flex;
  align-items: center;
  justify-content: center;
}

.selection-number-badge {
  position: absolute;
  top: var(--space-sm);
  left: var(--space-sm);
  width: 28px;
  height: 28px;
  border-radius: var(--radius-full);
  background: var(--gradient-gold);
  color: var(--text-on-gold);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-sm);
  font-weight: var(--font-bold);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.disabled-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
}

.disabled-text {
  color: white;
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
}

.media-caption {
  margin-top: var(--space-xs);
  font-size: var(--text-xs);
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-5xl);
  text-align: center;
  color: var(--text-muted);
  gap: var(--space-md);
}

.empty-hint {
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.validation-message {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md);
  background: var(--warning-bg);
  border: 1px solid var(--warning-border);
  border-radius: var(--radius-md);
  color: var(--warning-text);
  font-size: var(--text-sm);
}

/* Mobile responsive */
@media (max-width: 768px) {
  .media-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: var(--space-sm);
  }

  .selected-item {
    width: 80px;
    height: 80px;
  }

  .picker-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>

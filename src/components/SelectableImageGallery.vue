<script setup lang="ts">
import { ref, computed } from 'vue'
import BaseButton from './BaseButton.vue'

interface Image {
  url: string
  name?: string
  width?: number
  height?: number
  authorAttributions?: Array<{
    displayName: string
    uri?: string
    photoUri?: string
  }>
}

interface Props {
  images: Image[]
  modelValue?: number[] // Selected indices
  title?: string
  showSelectAll?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  title: 'Select Images',
  showSelectAll: true
})

const emit = defineEmits<{
  (e: 'update:modelValue', selectedIndices: number[]): void
}>()

const selectedModal = ref<number | null>(null)

const selectedIndices = computed(() => props.modelValue)

const selectedCount = computed(() => selectedIndices.value.length)

const allSelected = computed(() =>
  props.images.length > 0 && selectedIndices.value.length === props.images.length
)

function toggleSelection(index: number) {
  const isSelected = selectedIndices.value.includes(index)

  let newSelection: number[]
  if (isSelected) {
    newSelection = selectedIndices.value.filter(i => i !== index)
  } else {
    newSelection = [...selectedIndices.value, index]
  }

  emit('update:modelValue', newSelection)
}

function selectAll() {
  const allIndices = props.images.map((_, index) => index)
  emit('update:modelValue', allIndices)
}

function deselectAll() {
  emit('update:modelValue', [])
}

function openModal(index: number) {
  selectedModal.value = index
}

function closeModal() {
  selectedModal.value = null
}

function isSelected(index: number): boolean {
  return selectedIndices.value.includes(index)
}

// Keyboard navigation for modal
function handleKeydown(e: KeyboardEvent) {
  if (selectedModal.value === null) return

  if (e.key === 'Escape') {
    closeModal()
  } else if (e.key === 'ArrowRight') {
    const nextIndex = (selectedModal.value + 1) % props.images.length
    selectedModal.value = nextIndex
  } else if (e.key === 'ArrowLeft') {
    const prevIndex = (selectedModal.value - 1 + props.images.length) % props.images.length
    selectedModal.value = prevIndex
  }
}

// Setup keyboard listener
import { onMounted, onUnmounted } from 'vue'
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="selectable-gallery">
    <!-- Header -->
    <div class="gallery-header">
      <h3 class="gallery-title">{{ title }}</h3>
      <div class="gallery-actions">
        <span class="selection-count">{{ selectedCount }} of {{ images.length }} selected</span>
        <div v-if="showSelectAll" class="select-buttons">
          <BaseButton
            v-if="!allSelected"
            variant="ghost"
            size="small"
            @click="selectAll"
          >
            Select All
          </BaseButton>
          <BaseButton
            v-else
            variant="ghost"
            size="small"
            @click="deselectAll"
          >
            Deselect All
          </BaseButton>
        </div>
      </div>
    </div>

    <!-- Image Grid -->
    <div v-if="images.length > 0" class="image-grid">
      <div
        v-for="(image, index) in images"
        :key="index"
        :class="['image-item', { selected: isSelected(index) }]"
      >
        <div class="image-wrapper" @click="toggleSelection(index)">
          <img :src="image.url" :alt="`Image ${index + 1}`" class="gallery-image" />

          <!-- Selection Checkbox Indicator (visual only) -->
          <div class="checkbox-overlay">
            <div class="checkbox-indicator">
              <span v-if="isSelected(index)" class="checkmark">✓</span>
            </div>
          </div>

          <!-- Expand Button -->
          <button
            class="expand-button"
            @click.stop="openModal(index)"
            aria-label="View full size"
            title="View full size"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 3 21 3 21 9"></polyline>
              <polyline points="9 21 3 21 3 15"></polyline>
              <line x1="21" y1="3" x2="14" y2="10"></line>
              <line x1="3" y1="21" x2="10" y2="14"></line>
            </svg>
          </button>

          <!-- Attribution -->
          <div
            v-if="image.authorAttributions && image.authorAttributions.length > 0"
            class="attribution"
          >
            Photo by {{ image.authorAttributions[0].displayName }}
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <p class="empty-text">No images available</p>
    </div>

    <!-- Modal for Full Image View -->
    <Teleport to="body">
      <div
        v-if="selectedModal !== null"
        class="modal-overlay"
        @click="closeModal"
      >
        <div class="modal-content" @click.stop>
          <button class="modal-close" @click="closeModal" aria-label="Close">×</button>

          <img
            :src="images[selectedModal].url"
            :alt="`Image ${selectedModal + 1}`"
            class="modal-image"
          />

          <!-- Navigation Arrows -->
          <button
            v-if="images.length > 1"
            class="modal-nav modal-prev"
            @click.stop="selectedModal = (selectedModal - 1 + images.length) % images.length"
            aria-label="Previous image"
          >
            ‹
          </button>
          <button
            v-if="images.length > 1"
            class="modal-nav modal-next"
            @click.stop="selectedModal = (selectedModal + 1) % images.length"
            aria-label="Next image"
          >
            ›
          </button>

          <!-- Image Info -->
          <div class="modal-info">
            <p class="modal-counter">{{ selectedModal + 1 }} / {{ images.length }}</p>
            <div
              v-if="images[selectedModal].authorAttributions && images[selectedModal].authorAttributions!.length > 0"
              class="modal-attribution"
            >
              Photo by {{ images[selectedModal].authorAttributions![0].displayName }}
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.selectable-gallery {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.gallery-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-md);
}

.gallery-title {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  color: var(--text-primary);
  margin: 0;
}

.gallery-actions {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
}

.selection-count {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.select-buttons {
  display: flex;
  gap: var(--space-sm);
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--space-lg);
}

.image-item {
  position: relative;
  aspect-ratio: 4/3;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--bg-tertiary);
  border: 2px solid var(--border-color);
  transition: var(--transition-base);
  cursor: pointer;
}

.image-item.selected {
  border-color: var(--gold-primary);
  box-shadow: var(--glow-gold-sm);
}

.image-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.image-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.gallery-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.checkbox-overlay {
  position: absolute;
  top: var(--space-sm);
  right: var(--space-sm);
  z-index: 10;
  pointer-events: none;
}

.checkbox-indicator {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  background: rgba(0, 0, 0, 0.7);
  border: 2px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition-base);
  backdrop-filter: blur(4px);
}

.image-item.selected .checkbox-indicator {
  background: var(--gold-primary);
  border-color: var(--gold-primary);
  box-shadow: 0 0 8px rgba(212, 175, 55, 0.5);
}

.checkmark {
  color: var(--text-on-gold);
  font-size: var(--text-base);
  font-weight: var(--font-bold);
}

.expand-button {
  position: absolute;
  bottom: var(--space-sm);
  right: var(--space-sm);
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  background: rgba(0, 0, 0, 0.7);
  border: 1px solid var(--border-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: var(--transition-base);
  backdrop-filter: blur(4px);
  opacity: 0;
  z-index: 15;
}

.image-item:hover .expand-button {
  opacity: 1;
}

.expand-button:hover {
  background: var(--gold-primary);
  border-color: var(--gold-primary);
  color: var(--text-on-gold);
  transform: scale(1.1);
}

.expand-button svg {
  width: 16px;
  height: 16px;
}

.attribution {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: var(--space-sm);
  background: linear-gradient(to top, rgba(0, 0, 0, 0.9), transparent);
  font-size: var(--text-xs);
  color: white;
  opacity: 0;
  transition: var(--transition-base);
}

.image-item:hover .attribution {
  opacity: 1;
}

.empty-state {
  padding: var(--space-3xl);
  text-align: center;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
}

.empty-text {
  color: var(--text-muted);
  font-size: var(--text-base);
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--space-xl);
}

.modal-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-image {
  max-width: 100%;
  max-height: 90vh;
  object-fit: contain;
  border-radius: var(--radius-md);
}

.modal-close {
  position: absolute;
  top: -40px;
  right: 0;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  font-size: var(--text-3xl);
  line-height: 1;
  cursor: pointer;
  transition: var(--transition-base);
}

.modal-close:hover {
  background: var(--gold-primary);
  transform: scale(1.1);
}

.modal-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 48px;
  height: 48px;
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  font-size: var(--text-3xl);
  line-height: 1;
  cursor: pointer;
  transition: var(--transition-base);
}

.modal-nav:hover {
  background: var(--gold-primary);
}

.modal-prev {
  left: -60px;
}

.modal-next {
  right: -60px;
}

.modal-info {
  position: absolute;
  bottom: -40px;
  left: 0;
  right: 0;
  text-align: center;
}

.modal-counter {
  color: white;
  font-size: var(--text-sm);
  margin-bottom: var(--space-xs);
}

.modal-attribution {
  color: rgba(255, 255, 255, 0.7);
  font-size: var(--text-xs);
}

/* Responsive */
@media (max-width: 768px) {
  .image-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: var(--space-md);
  }

  .gallery-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .modal-nav {
    width: 36px;
    height: 36px;
    font-size: var(--text-2xl);
  }

  .modal-prev {
    left: var(--space-md);
  }

  .modal-next {
    right: var(--space-md);
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .image-item,
  .checkbox-indicator,
  .expand-button,
  .attribution,
  .modal-close,
  .modal-nav {
    transition: none;
  }
}

/* Mobile: Always show expand button */
@media (max-width: 768px) {
  .expand-button {
    opacity: 1;
  }
}
</style>

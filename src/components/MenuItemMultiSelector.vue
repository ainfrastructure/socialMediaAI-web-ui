<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import BasePagination from './BasePagination.vue'
import MaterialIcon from './MaterialIcon.vue'

interface MenuItem {
  name: string
  price?: string
  imageUrl?: string
  [key: string]: any
}

const props = defineProps<{
  menuItems: MenuItem[]
  maxItems?: number
}>()

const emit = defineEmits<{
  (e: 'update:selectedItems', items: MenuItem[]): void
}>()

const { t } = useI18n()

// State
const selectedItems = ref<MenuItem[]>([])
const currentPage = ref(1)
const itemsPerPage = ref(16)
const gridContainer = ref<HTMLElement | null>(null)

// Computed
const paginatedMenuItems = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return props.menuItems.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(props.menuItems.length / itemsPerPage.value)
})

const maxSelectableItems = computed(() => props.maxItems || 5)

const selectionCount = computed(() => selectedItems.value.length)

const canSelectMore = computed(() => {
  return selectionCount.value < maxSelectableItems.value
})

const selectionText = computed(() => {
  return t('advancedMode.step1.itemsSelected', { count: selectionCount.value, max: maxSelectableItems.value })
})

// Methods
function isSelected(item: MenuItem): boolean {
  return selectedItems.value.some(selected => selected.name === item.name)
}

function toggleItem(item: MenuItem) {
  const index = selectedItems.value.findIndex(selected => selected.name === item.name)

  if (index >= 0) {
    // Remove item
    selectedItems.value.splice(index, 1)
  } else if (canSelectMore.value) {
    // Add item (if under max)
    selectedItems.value.push(item)
  }

  // Emit update
  emit('update:selectedItems', selectedItems.value)
}

function handlePageChange(page: number) {
  currentPage.value = page
}

// Dynamic items per page calculation
function calculateItemsPerPage() {
  if (!gridContainer.value) return

  const containerWidth = gridContainer.value.offsetWidth
  const containerHeight = window.innerHeight - gridContainer.value.getBoundingClientRect().top - 250

  // Defensive check: retry if no dimensions
  if (containerWidth === 0 || containerHeight <= 0) {
    setTimeout(calculateItemsPerPage, 300)
    return
  }

  // Card dimensions
  const cardWidth = 180 // approximate card width including gap
  const cardHeight = 200 // approximate card height including gap

  // Calculate columns and rows
  const columns = Math.floor(containerWidth / cardWidth) || 1
  const rows = Math.floor(containerHeight / cardHeight) || 2

  // Update items per page
  const newItemsPerPage = columns * rows
  itemsPerPage.value = Math.max(12, Math.min(newItemsPerPage, 24))
}

// Lifecycle hooks
onMounted(async () => {
  await nextTick()

  setTimeout(() => {
    calculateItemsPerPage()
  }, 250)

  // Fallback retry
  setTimeout(() => {
    if (gridContainer.value?.offsetWidth > 0) {
      calculateItemsPerPage()
    }
  }, 500)

  window.addEventListener('resize', calculateItemsPerPage)
})

// Watch for menu items changes and recalculate
watch(() => props.menuItems.length, async () => {
  await nextTick()
  calculateItemsPerPage()
})

onUnmounted(() => {
  window.removeEventListener('resize', calculateItemsPerPage)
})
</script>

<template>
  <div class="menu-item-multi-selector">
    <!-- Selection Counter -->
    <div class="selection-header">
      <div class="selection-count">
        <span class="count-badge" :class="{ 'max-reached': !canSelectMore }">
          {{ selectionCount }} / {{ maxSelectableItems }}
        </span>
        <span class="count-label">{{ selectionText }}</span>
      </div>
      <div v-if="!canSelectMore" class="max-warning">
        {{ t('advancedMode.step1.maxItemsReached', { count: maxSelectableItems }) }}
      </div>
    </div>

    <!-- Menu Items Grid -->
    <div v-if="menuItems.length > 0">
      <div ref="gridContainer" class="menu-items-grid">
        <div
          v-for="(item, index) in paginatedMenuItems"
          :key="index"
          :class="['menu-item-card', {
            'selected': isSelected(item),
            'disabled': !isSelected(item) && !canSelectMore
          }]"
          @click="toggleItem(item)"
        >
          <!-- Image -->
          <div class="menu-item-image-wrapper">
            <img
              v-if="item.imageUrl"
              :src="item.imageUrl"
              :alt="item.name"
              class="menu-item-image"
            />
            <div v-else class="menu-item-placeholder">
              <MaterialIcon icon="restaurant_menu" size="xl" class="placeholder-icon" />
            </div>
          </div>

          <!-- Details -->
          <div class="menu-item-details">
            <h4 class="menu-item-name">{{ item.name }}</h4>
            <p v-if="item.price" class="menu-item-price">{{ item.price }}</p>
          </div>

          <!-- Selected Badge -->
          <div v-if="isSelected(item)" class="selected-badge">
            <MaterialIcon icon="check_circle" size="sm" :color="'var(--text-on-gold)'" />
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <BasePagination
        v-if="totalPages > 1"
        :current-page="currentPage"
        :total-pages="totalPages"
        :total-items="menuItems.length"
        @update:current-page="handlePageChange"
      />
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <MaterialIcon icon="restaurant_menu" size="3xl" class="empty-icon" />
      <p class="empty-text">{{ t('advancedMode.step1.noItems') }}</p>
    </div>
  </div>
</template>

<style scoped>
.menu-item-multi-selector {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

/* Selection Header */
.selection-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-lg);
  background: var(--glass-bg);
  border: var(--border-width) solid var(--glass-border);
  border-radius: var(--radius-md);
  backdrop-filter: blur(var(--blur-md));
}

.selection-count {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 60px;
  padding: var(--space-sm) var(--space-md);
  background: var(--gold-subtle);
  border: 1px solid var(--gold-primary);
  border-radius: var(--radius-full);
  color: var(--gold-primary);
  font-weight: var(--font-semibold);
  font-size: var(--text-sm);
  transition: var(--transition-base);
}

.count-badge.max-reached {
  background: var(--error-bg);
  border-color: var(--error-border);
  color: var(--error-text);
}

.count-label {
  color: var(--text-secondary);
  font-size: var(--text-sm);
}

.max-warning {
  color: var(--error-text);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
}

/* Menu Items Grid - 4 items per row */
.menu-items-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);  /* 4 columns */
  gap: var(--space-lg);
  padding: var(--space-sm);
  overflow: hidden;     /* Hide overflow, pagination handles rest */
}

/* Responsive: Single column on mobile */
@media (max-width: 768px) {
  .menu-items-grid {
    grid-template-columns: 1fr;
    grid-template-rows: repeat(6, 1fr);
    max-height: none;
  }
}

.menu-item-card {
  position: relative;
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  cursor: pointer;
  transition: var(--transition-base);
}

.menu-item-card:hover {
  border-color: var(--gold-primary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.menu-item-card.selected {
  border-color: var(--gold-primary);
  background: var(--gold-subtle);
  box-shadow: var(--glow-gold-md);
}

.menu-item-card.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.menu-item-card.disabled:hover {
  transform: none;
  box-shadow: none;
  border-color: var(--glass-border);
}

/* Image Wrapper */
.menu-item-image-wrapper {
  width: 100%;
  aspect-ratio: 1;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--bg-tertiary);
  margin-bottom: var(--space-md);
}

.menu-item-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.menu-item-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-elevated);
}

.placeholder-icon {
  font-size: 48px;
  color: var(--gold-primary);
  opacity: 0.5;
}

/* Details */
.menu-item-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.menu-item-name {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-primary);
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.menu-item-price {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

/* Selected Badge */
.selected-badge {
  position: absolute;
  top: var(--space-md);
  right: var(--space-md);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: var(--gradient-gold);
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-md);
}

.badge-icon {
  color: var(--text-on-gold);
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-5xl);
  text-align: center;
}

.empty-icon {
  font-size: 64px;
  color: var(--gold-primary);
  opacity: 0.5;
  margin-bottom: var(--space-xl);
}

.empty-text {
  color: var(--text-muted);
  font-size: var(--text-base);
}

/* Responsive */
@media (max-width: 768px) {
  .menu-items-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-md);
  }

  .selection-header {
    flex-direction: column;
    gap: var(--space-md);
    text-align: center;
  }
}

@media (max-width: 480px) {
  .menu-items-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>

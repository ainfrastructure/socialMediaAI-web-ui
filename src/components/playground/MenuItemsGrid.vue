<template>
  <BaseCard variant="glass" class="menu-reference-card">
    <div class="menu-header">
      <div>
        <h3 class="card-title">{{ $t('playground.menuItems', 'Menu Items') }} ({{ items.length }})</h3>
        <p class="card-subtitle">{{ $t('playground.selectItems', 'Select one or more items to create combo prompts') }}</p>
      </div>

      <!-- Pagination - Top Right -->
      <div v-if="totalPages > 1" class="pagination-top">
        <button
          @click="$emit('pageChange', currentPage - 1)"
          :disabled="currentPage === 1"
          class="pagination-btn-compact"
        >
          ←
        </button>
        <span class="pagination-info-compact">
          {{ currentPage }} / {{ totalPages }}
        </span>
        <button
          @click="$emit('pageChange', currentPage + 1)"
          :disabled="currentPage === totalPages"
          class="pagination-btn-compact"
        >
          →
        </button>
      </div>
    </div>

    <div class="menu-items-grid">
      <div
        v-for="(item, index) in paginatedItems"
        :key="index"
        :class="['menu-item-card', { 'selected': isItemSelected(item) }]"
        @click="$emit('toggleItem', item)"
      >
        <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.name" class="menu-item-image" />
        <div class="menu-item-info">
          <h4 class="menu-item-name">{{ item.name }}</h4>
          <p v-if="item.price" class="menu-item-price">{{ item.price }}</p>
        </div>
        <div v-if="isItemSelected(item)" class="menu-selected-badge">✓</div>
      </div>
    </div>

    <!-- Selection Actions -->
    <div v-if="selectedItems.length > 0" class="selection-actions">
      <span class="selection-count">{{ selectedItems.length }} {{ $t('playground.itemsSelected', 'item(s) selected') }}</span>
      <slot name="actions"></slot>
    </div>
  </BaseCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import BaseCard from '../BaseCard.vue'

interface MenuItem {
  name: string
  price?: string
  imageUrl?: string
}

const props = defineProps<{
  items: MenuItem[]
  selectedItems: MenuItem[]
  currentPage: number
  itemsPerPage?: number
}>()

defineEmits<{
  (e: 'toggleItem', item: MenuItem): void
  (e: 'pageChange', page: number): void
}>()

const itemsPerPage = computed(() => props.itemsPerPage || 8)

const totalPages = computed(() => {
  return Math.ceil(props.items.length / itemsPerPage.value)
})

const paginatedItems = computed(() => {
  const start = (props.currentPage - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return props.items.slice(start, end)
})

const isItemSelected = (item: MenuItem): boolean => {
  return props.selectedItems.some(
    selected => selected.name === item.name
  )
}
</script>

<style scoped>
.menu-reference-card {
  margin-bottom: var(--space-xl);
}

.menu-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-lg);
}

.card-title {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  color: var(--text-primary);
  margin: 0 0 var(--space-xs) 0;
}

.card-subtitle {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: 0;
}

.pagination-top {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.pagination-btn-compact {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  cursor: pointer;
  transition: all var(--transition-base);
}

.pagination-btn-compact:hover:not(:disabled) {
  background: rgba(212, 175, 55, 0.2);
  border-color: var(--gold-primary);
}

.pagination-btn-compact:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info-compact {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.menu-items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: var(--space-md);
}

.menu-item-card {
  position: relative;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid transparent;
  border-radius: var(--radius-md);
  overflow: hidden;
  cursor: pointer;
  transition: all var(--transition-base);
}

.menu-item-card:hover {
  border-color: rgba(212, 175, 55, 0.5);
  transform: translateY(-2px);
}

.menu-item-card.selected {
  border-color: var(--gold-primary);
  background: rgba(212, 175, 55, 0.1);
}

.menu-item-image {
  width: 100%;
  height: 120px;
  object-fit: cover;
}

.menu-item-info {
  padding: var(--space-md);
}

.menu-item-name {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--space-xs) 0;
}

.menu-item-price {
  font-size: var(--text-sm);
  color: var(--gold-primary);
  margin: 0;
}

.menu-selected-badge {
  position: absolute;
  top: var(--space-sm);
  right: var(--space-sm);
  width: 24px;
  height: 24px;
  background: var(--gold-primary);
  color: var(--text-on-gold);
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-sm);
  font-weight: var(--font-bold);
}

.selection-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: var(--space-lg);
  padding-top: var(--space-lg);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.selection-count {
  font-size: var(--text-sm);
  color: var(--gold-primary);
  font-weight: var(--font-semibold);
}

@media (max-width: 768px) {
  .menu-header {
    flex-direction: column;
    gap: var(--space-md);
  }

  .menu-items-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>

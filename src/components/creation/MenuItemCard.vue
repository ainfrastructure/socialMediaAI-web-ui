<script setup lang="ts">
/**
 * MenuItemCard - Reusable menu item selection card
 * Used in menu item grids for both creation modes
 */
import MaterialIcon from '../MaterialIcon.vue'

export interface MenuItem {
  name: string
  price?: string
  imageUrl?: string
  [key: string]: any
}

interface Props {
  item: MenuItem
  selected?: boolean
  compact?: boolean
}

withDefaults(defineProps<Props>(), {
  selected: false,
  compact: false
})

const emit = defineEmits<{
  (e: 'select'): void
}>()
</script>

<template>
  <div
    :class="['menu-item-card', { 'selected': selected, 'compact': compact }]"
    @click="emit('select')"
  >
    <div class="menu-item-image-wrapper">
      <img
        v-if="item.imageUrl"
        :src="item.imageUrl"
        :alt="item.name"
        class="menu-item-image"
      />
      <div v-else class="menu-item-placeholder">
        <MaterialIcon icon="restaurant" size="xl" :color="'var(--text-muted)'" />
      </div>
    </div>

    <div class="menu-item-details">
      <h4 class="menu-item-name">{{ item.name }}</h4>
      <p v-if="item.price" class="menu-item-price">{{ item.price }}</p>
    </div>

    <div v-if="selected" class="selected-badge">
      <MaterialIcon icon="check_circle" size="sm" :color="'var(--text-on-gold)'" />
    </div>
  </div>
</template>

<style scoped>
.menu-item-card {
  position: relative;
  display: flex;
  flex-direction: column;
  border-radius: var(--radius-lg);
  background: var(--bg-tertiary);
  border: 2px solid var(--border-color);
  cursor: pointer;
  transition: var(--transition-base);
  overflow: hidden;
}

.menu-item-card:hover {
  border-color: var(--gold-primary);
  transform: translateY(-2px);
}

.menu-item-card.selected {
  border-color: var(--gold-primary);
  box-shadow: var(--glow-gold-sm);
}

.menu-item-image-wrapper {
  width: 100%;
  aspect-ratio: 4/3;
  overflow: hidden;
}

.menu-item-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: var(--transition-base);
}

.menu-item-card:hover .menu-item-image {
  transform: scale(1.05);
}

.menu-item-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
}

.menu-item-details {
  padding: var(--space-md);
  text-align: center;
}

.menu-item-name {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin-bottom: var(--space-xs);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.menu-item-price {
  font-size: var(--text-sm);
  color: var(--gold-primary);
  font-weight: var(--font-medium);
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

/* Compact variant */
.menu-item-card.compact .menu-item-image-wrapper {
  aspect-ratio: 1;
}

.menu-item-card.compact .menu-item-details {
  padding: var(--space-sm);
}

.menu-item-card.compact .menu-item-name {
  font-size: var(--text-xs);
}

/* Responsive */
@media (max-width: 768px) {
  .menu-item-details {
    padding: var(--space-sm);
  }

  .menu-item-name {
    font-size: var(--text-xs);
  }
}
</style>

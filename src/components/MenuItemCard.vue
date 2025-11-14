<template>
  <div class="menu-item-card">
    <div v-if="item.imageUrl" class="item-image">
      <img :src="item.imageUrl" :alt="item.name" />
    </div>
    <div class="item-content">
      <div class="item-header">
        <h4 class="item-name">{{ item.name }}</h4>
        <span class="item-price">{{ item.price }}</span>
      </div>
      <p v-if="item.description" class="item-description">
        {{ item.description }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MenuItem } from '../services/menuService'

interface Props {
  item: MenuItem
}

defineProps<Props>()
</script>

<style scoped>
.menu-item-card {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: rgba(26, 26, 26, 0.6);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.menu-item-card:hover {
  background: rgba(26, 26, 26, 0.8);
  border-color: rgba(212, 175, 55, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(212, 175, 55, 0.15);
}

.item-image {
  flex-shrink: 0;
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.3);
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-content {
  flex: 1;
  min-width: 0;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.item-name {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  color: var(--text-primary);
  flex: 1;
}

.item-price {
  font-size: 1rem;
  font-weight: 700;
  color: var(--accent-gold);
  white-space: nowrap;
}

.item-description {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Responsive */
@media (max-width: 640px) {
  .menu-item-card {
    flex-direction: column;
  }

  .item-image {
    width: 100%;
    height: 150px;
  }

  .item-header {
    flex-direction: column;
    gap: 0.5rem;
  }

  .item-price {
    align-self: flex-start;
  }
}
</style>

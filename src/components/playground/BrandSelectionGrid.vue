<template>
  <div class="brand-selection-view">
    <div class="selection-header">
      <h2 class="selection-title">{{ $t('playground.chooseRestaurant', 'Choose a Brand') }}</h2>
      <p class="selection-subtitle">{{ $t('playground.selectRestaurant', 'Select which brand to create content for') }}</p>
      <BaseButton variant="primary" @click="$emit('addNew')">
        + {{ $t('playground.addNewRestaurant', 'Add New Brand') }}
      </BaseButton>
    </div>

    <div class="brands-grid">
      <BaseCard
        v-for="brand in brands"
        :key="brand.id"
        variant="glass"
        hoverable
        class="brand-card"
        @click="$emit('select', brand.id)"
      >
        <div class="card-header">
          <div class="card-title-section">
            <div v-if="brand.brand_dna?.logo_url" class="card-logo-container">
              <img
                :src="brand.brand_dna.logo_url"
                :alt="brand.brand_dna.brand_name || brand.name"
                class="card-logo"
              />
            </div>
            <h3 class="brand-name">{{ brand.name }}</h3>
          </div>
          <button class="edit-btn" @click.stop="$emit('edit', brand)" title="Edit Brand">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
        </div>

        <p class="brand-address">{{ brand.address }}</p>

        <div class="brand-meta">
          <div v-if="brand.rating" class="meta-item">
            <span class="meta-icon">⭐</span>
            <span>{{ brand.rating }} / 5</span>
          </div>

          <div v-if="brand.menu && brand.menu.items && brand.menu.items.length > 0" class="meta-item">
            <span class="meta-icon">📋</span>
            <span>{{ brand.menu.items.length }} {{ $t('playground.menuItems', 'menu items') }}</span>
          </div>

          <div v-if="brand.saved_at" class="meta-item">
            <span class="meta-icon">📅</span>
            <span>{{ $t('playground.saved', 'Saved') }} {{ formatDate(brand.saved_at) }}</span>
          </div>
        </div>
      </BaseCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import BaseCard from '../BaseCard.vue'
import BaseButton from '../BaseButton.vue'

interface BrandDna {
  logo_url?: string
  brand_name?: string
}

interface MenuItem {
  name: string
  price?: string
  imageUrl?: string
}

interface Brand {
  id: string | number
  name: string
  address?: string
  rating?: number
  saved_at?: string
  brand_dna?: BrandDna
  menu?: {
    items: MenuItem[]
  }
}

defineProps<{
  brands: Brand[]
}>()

defineEmits<{
  (e: 'select', id: string | number): void
  (e: 'edit', brand: Brand): void
  (e: 'addNew'): void
}>()

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}
</script>

<style scoped>
.brand-selection-view {
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.selection-header {
  text-align: center;
  margin-bottom: var(--space-2xl);
}

.selection-title {
  font-family: var(--font-heading);
  font-size: var(--text-3xl);
  color: var(--text-primary);
  margin-bottom: var(--space-sm);
}

.selection-subtitle {
  color: var(--text-secondary);
  margin-bottom: var(--space-lg);
}

.brands-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--space-xl);
}

.brand-card {
  cursor: pointer;
  transition: all var(--transition-base);
}

.brand-card:hover {
  transform: translateY(-4px);
  border-color: rgba(212, 175, 55, 0.5);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-md);
}

.card-title-section {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.card-logo-container {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  overflow: hidden;
  flex-shrink: 0;
}

.card-logo {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.brand-name {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  color: var(--text-primary);
  margin: 0;
}

.edit-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: var(--radius-sm);
  padding: var(--space-sm);
  cursor: pointer;
  color: var(--text-secondary);
  transition: all var(--transition-base);
}

.edit-btn:hover {
  background: rgba(212, 175, 55, 0.2);
  color: var(--gold-primary);
}

.brand-address {
  font-size: var(--text-sm);
  color: var(--text-muted);
  margin-bottom: var(--space-md);
}

.brand-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-md);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.meta-icon {
  font-size: var(--text-base);
}

@media (max-width: 768px) {
  .brands-grid {
    grid-template-columns: 1fr;
  }
}
</style>

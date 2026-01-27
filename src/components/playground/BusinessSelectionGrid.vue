<template>
  <div class="business-selection-view">
    <div class="selection-header">
      <h2 class="selection-title">{{ $t('playground.chooseBusiness', 'Choose a Business') }}</h2>
      <p class="selection-subtitle">{{ $t('playground.selectBusiness', 'Select which business to create content for') }}</p>
      <BaseButton variant="primary" @click="$emit('addNew')">
        + {{ $t('playground.addNewBusiness', 'Add New Business') }}
      </BaseButton>
    </div>

    <div class="businesses-grid">
      <BaseCard
        v-for="business in businesses"
        :key="business.id"
        variant="glass"
        hoverable
        class="business-card"
        @click="$emit('select', business.id)"
      >
        <div class="card-header">
          <div class="card-title-section">
            <div v-if="business.brand_dna?.logo_url" class="card-logo-container">
              <img
                :src="business.brand_dna.logo_url"
                :alt="business.brand_dna.brand_name || business.name"
                class="card-logo"
              />
            </div>
            <h3 class="business-name">{{ business.name }}</h3>
          </div>
          <button class="edit-btn" @click.stop="$emit('edit', business)" title="Edit Business">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
        </div>

        <p class="business-address">{{ business.address }}</p>

        <div class="business-meta">
          <div v-if="business.rating" class="meta-item">
            <span class="meta-icon">⭐</span>
            <span>{{ business.rating }} / 5</span>
          </div>

          <div v-if="business.menu && business.menu.items && business.menu.items.length > 0" class="meta-item">
            <span class="meta-icon">📋</span>
            <span>{{ business.menu.items.length }} {{ $t('playground.menuItems', 'menu items') }}</span>
          </div>

          <div v-if="business.saved_at" class="meta-item">
            <span class="meta-icon">📅</span>
            <span>{{ $t('playground.saved', 'Saved') }} {{ formatDate(business.saved_at) }}</span>
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

interface Business {
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
  businesses: Business[]
}>()

defineEmits<{
  (e: 'select', id: string | number): void
  (e: 'edit', business: Business): void
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
.business-selection-view {
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

.businesses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--space-xl);
}

.business-card {
  cursor: pointer;
  transition: all var(--transition-base);
}

.business-card:hover {
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

.business-name {
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

.business-address {
  font-size: var(--text-sm);
  color: var(--text-muted);
  margin-bottom: var(--space-md);
}

.business-meta {
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
  .businesses-grid {
    grid-template-columns: 1fr;
  }
}
</style>

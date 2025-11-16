<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import BaseCard from './BaseCard.vue'
import BaseAlert from './BaseAlert.vue'
import LoadingState from './LoadingState.vue'
import EmptyState from './EmptyState.vue'

interface BrandDNA {
  brand_name?: string
  primary_color?: string
  secondary_color?: string
  additional_colors?: string[]
  font_style?: string
  logo_url?: string
}

interface Props {
  brandDNA?: BrandDNA | null
  loading?: boolean
  error?: string | null
  websiteUrl?: string
}

const props = defineProps<Props>()
const { t } = useI18n()

const handleLogoError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
}
</script>

<template>
  <BaseCard v-if="websiteUrl" variant="glass-intense" class="brand-dna-card">
    <div class="brand-dna-header">
      <h2 class="brand-dna-title">{{ t('restaurantSearch.brandIdentity') }}</h2>
      <span v-if="brandDNA" class="brand-dna-badge">{{ t('restaurantSearch.analyzed') }}</span>
    </div>

    <!-- Loading state -->
    <LoadingState
      v-if="loading"
      :message="t('restaurantSearch.analyzingBrand')"
    />

    <!-- Error state -->
    <BaseAlert v-else-if="error" type="warning">
      {{ error }}
    </BaseAlert>

    <!-- Brand DNA content -->
    <div v-else-if="brandDNA" class="brand-dna-content">
      <!-- Brand Name -->
      <div v-if="brandDNA.brand_name" class="brand-section">
        <h3 class="section-label">{{ t('restaurantSearch.brandName') }}</h3>
        <p class="brand-name-display">{{ brandDNA.brand_name }}</p>
      </div>

      <!-- Colors Section -->
      <div class="brand-section">
        <h3 class="section-label">{{ t('restaurantSearch.brandColors') }}</h3>
        <div class="colors-grid">
          <!-- Primary Color -->
          <div v-if="brandDNA.primary_color" class="color-item">
            <div class="color-swatch" :style="{ backgroundColor: brandDNA.primary_color }"></div>
            <div class="color-info">
              <span class="color-label">{{ t('restaurantSearch.primary') }}</span>
              <span class="color-value">{{ brandDNA.primary_color }}</span>
            </div>
          </div>

          <!-- Secondary Color -->
          <div v-if="brandDNA.secondary_color" class="color-item">
            <div class="color-swatch" :style="{ backgroundColor: brandDNA.secondary_color }"></div>
            <div class="color-info">
              <span class="color-label">{{ t('restaurantSearch.secondary') }}</span>
              <span class="color-value">{{ brandDNA.secondary_color }}</span>
            </div>
          </div>

          <!-- Additional Colors -->
          <div
            v-for="(color, index) in brandDNA.additional_colors"
            :key="index"
            class="color-item"
          >
            <div class="color-swatch" :style="{ backgroundColor: color }"></div>
            <div class="color-info">
              <span class="color-label">{{ t('restaurantSearch.accent', { number: index + 1 }) }}</span>
              <span class="color-value">{{ color }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Font Style -->
      <div v-if="brandDNA.font_style" class="brand-section">
        <h3 class="section-label">{{ t('restaurantSearch.typography') }}</h3>
        <div class="font-display">
          <div class="font-badge">{{ brandDNA.font_style }}</div>
        </div>
      </div>

      <!-- Logo -->
      <div v-if="brandDNA.logo_url" class="brand-section">
        <h3 class="section-label">{{ t('restaurantSearch.logo') }}</h3>
        <div class="logo-display">
          <img
            :src="brandDNA.logo_url"
            :alt="brandDNA.brand_name || 'Restaurant logo'"
            class="logo-image"
            @error="handleLogoError"
          />
        </div>
      </div>

      <!-- Analysis Info -->
      <div class="brand-footer">
        <span class="analysis-note">
          {{ t('restaurantSearch.brandIdentityNote') }}
        </span>
      </div>
    </div>

    <!-- Empty state -->
    <EmptyState
      v-else
      :message="t('restaurantSearch.selectRestaurantWithWebsite')"
    />
  </BaseCard>
</template>

<style scoped>
.brand-dna-card {
  animation: fadeInUp 0.6s var(--ease-smooth);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.brand-dna-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-xl);
  padding-bottom: var(--space-md);
  border-bottom: 1px solid rgba(212, 175, 55, 0.15);
}

.brand-dna-title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0;
}

.brand-dna-badge {
  padding: var(--space-xs) var(--space-md);
  background: rgba(76, 175, 80, 0.15);
  color: #81C784;
  border: 1px solid rgba(76, 175, 80, 0.3);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
}

.brand-dna-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xl);
}

.brand-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.section-label {
  font-family: var(--font-heading);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--gold-primary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0;
}

.brand-name-display {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  margin: 0;
}

.colors-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: var(--space-lg);
}

.color-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  padding: var(--space-md);
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-md);
  transition: var(--transition-base);
}

.color-item:hover {
  background: rgba(0, 0, 0, 0.3);
  border-color: rgba(212, 175, 55, 0.2);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.color-swatch {
  width: 100%;
  height: 80px;
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-sm);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.color-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.color-label {
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.color-value {
  font-family: monospace;
  font-size: var(--text-sm);
  color: var(--text-primary);
}

.font-display {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.font-badge {
  padding: var(--space-md) var(--space-xl);
  background: rgba(212, 175, 55, 0.1);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: var(--radius-md);
  font-size: var(--text-lg);
  font-weight: var(--font-medium);
  color: var(--text-primary);
}

.logo-display {
  padding: var(--space-xl);
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-image {
  max-width: 200px;
  max-height: 100px;
  width: auto;
  height: auto;
  object-fit: contain;
}

.brand-footer {
  padding-top: var(--space-lg);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.analysis-note {
  font-size: var(--text-xs);
  color: var(--text-muted);
  font-style: italic;
}

/* Responsive */
@media (max-width: 768px) {
  .brand-dna-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-sm);
  }

  .colors-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .brand-dna-card {
    animation: none;
  }

  .color-item {
    transition: none;
  }

  .color-item:hover {
    transform: none;
  }
}
</style>

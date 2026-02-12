<script setup lang="ts">
import { ref } from 'vue'
import MaterialIcon from '@/components/MaterialIcon.vue'
import BrandSelectorModal from '@/components/BrandSelectorModal.vue'

interface Props {
  selectedBrandId: string | null
  brands: any[]
  selectedBrand: any | null
  loading: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:selectedBrandId', id: string | null): void
  (e: 'refresh'): void
}>()

const showBrandSelector = ref(false)

function handleBrandSelected(brand: { id: string }) {
  emit('update:selectedBrandId', brand.id)
}
</script>

<template>
  <div class="analysis-header">
    <div class="hero-banner">
      <div class="hero-left">
        <div class="hero-icon">
          <MaterialIcon icon="auto_awesome" size="lg" />
        </div>
        <div>
          <h1 class="hero-title">Posting Schedule Optimizer</h1>
          <p class="hero-subtitle">90-day analysis with confidence intervals</p>
        </div>
      </div>

      <div class="hero-right">
        <!-- Brand selector -->
        <button v-if="brands.length > 0" class="brand-chip" @click="showBrandSelector = true">
          <div
            v-if="selectedBrand?.logo_url || selectedBrand?.brand_dna?.logo_url"
            class="chip-avatar"
          >
            <img
              :src="selectedBrand.logo_url || selectedBrand.brand_dna?.logo_url"
              :alt="selectedBrand.name"
            />
          </div>
          <span class="chip-label">{{ selectedBrand?.name || 'All Businesses' }}</span>
          <MaterialIcon icon="expand_more" size="xs" />
        </button>

        <!-- Refresh button -->
        <button
          class="refresh-btn"
          :disabled="loading"
          @click="emit('refresh')"
        >
          <MaterialIcon
            icon="refresh"
            size="sm"
            :class="{ spinning: loading }"
          />
          <span class="refresh-label">Re-analyze</span>
        </button>
      </div>
    </div>

    <!-- Brand Selector Modal -->
    <BrandSelectorModal
      v-model="showBrandSelector"
      :brands="brands"
      :current-id="selectedBrandId ?? undefined"
      @select="handleBrandSelected"
    />
  </div>
</template>

<style scoped>
.analysis-header {
  margin-bottom: var(--space-xl);
}

.hero-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-xl);
  background: var(--bg-secondary);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  gap: var(--space-lg);
}

.hero-left {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
}

.hero-icon {
  width: 52px;
  height: 52px;
  border-radius: var(--radius-lg);
  background: var(--gradient-gold);
  color: var(--text-on-gold);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.hero-title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  color: var(--text-primary);
  margin: 0;
  line-height: var(--leading-tight);
}

.hero-subtitle {
  font-size: var(--text-sm);
  color: var(--text-muted);
  margin: 4px 0 0;
}

.hero-right {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  flex-shrink: 0;
}

/* Brand chip */
.brand-chip {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-tertiary);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: var(--transition-fast);
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.brand-chip:hover {
  border-color: var(--border-hover);
  background: var(--bg-elevated);
}

.chip-avatar {
  width: 24px;
  height: 24px;
  border-radius: var(--radius-full);
  overflow: hidden;
  flex-shrink: 0;
}

.chip-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.chip-label {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Refresh button */
.refresh-btn {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-lg);
  background: var(--gradient-gold);
  color: var(--text-on-gold);
  border: none;
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  cursor: pointer;
  transition: var(--transition-base);
}

.refresh-btn:hover:not(:disabled) {
  box-shadow: var(--glow-gold-sm);
  transform: translateY(-1px);
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Responsive */
@media (max-width: 768px) {
  .hero-banner {
    flex-direction: column;
    align-items: flex-start;
    padding: var(--space-lg);
  }

  .hero-right {
    width: 100%;
    justify-content: flex-end;
  }

  .hero-title {
    font-size: var(--text-xl);
  }

  .refresh-label {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .refresh-btn:hover {
    transform: none;
  }

  .spinning {
    animation: none;
  }
}
</style>

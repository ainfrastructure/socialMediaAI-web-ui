<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import MaterialIcon from '@/components/MaterialIcon.vue'
import BrandSelectorModal from '@/components/BrandSelectorModal.vue'
import type { TimeRange } from '@/composables/useAnalyticsData'

interface Props {
  selectedTimeRange: TimeRange
  refreshingEngagement: boolean
  timeSinceLastSync: string | null
  selectedBrandId: string | null
  brands: any[]
  selectedBrand: any | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:selectedTimeRange', range: TimeRange): void
  (e: 'update:selectedBrandId', id: string | null): void
  (e: 'refresh'): void
}>()

const { t } = useI18n()
const router = useRouter()

const showBrandSelector = ref(false)

function handleBrandSelected(brand: { id: string }) {
  emit('update:selectedBrandId', brand.id)
}

const timeRanges: { key: TimeRange; label: string }[] = [
  { key: '7d', label: '7d' },
  { key: '30d', label: '30d' },
  { key: '90d', label: '90d' },
]
</script>

<template>
  <div class="analytics-header">
    <!-- Hero banner -->
    <div class="hero-banner">
      <div class="hero-left">
        <div class="hero-icon">
          <MaterialIcon icon="insights" size="lg" />
        </div>
        <div>
          <h1 class="hero-title">{{ t('analytics.title') }}</h1>
          <p class="hero-subtitle">{{ t('analytics.subtitle') }}</p>
        </div>
      </div>

      <div class="hero-right">
        <!-- Business selector chip -->
        <button v-if="brands.length > 0" class="brand-chip" @click="showBrandSelector = true">
          <div v-if="selectedBrand?.logo_url || selectedBrand?.brand_dna?.logo_url" class="chip-avatar">
            <img :src="selectedBrand.logo_url || selectedBrand.brand_dna?.logo_url" :alt="selectedBrand.name" />
          </div>
          <MaterialIcon v-else icon="storefront" size="sm" />
          <span class="chip-name">{{ selectedBrand?.name || t('analytics.selectBusiness') }}</span>
          <MaterialIcon icon="swap_horiz" size="xs" class="chip-action-icon" />
        </button>
        <button v-else class="add-brand-btn" @click="router.push('/dashboard')">
          <MaterialIcon icon="add_business" size="sm" />
          {{ t('analytics.manageBusinesses') }}
        </button>
      </div>
    </div>

    <!-- Business Selector Modal -->
    <BrandSelectorModal
      v-model="showBrandSelector"
      :brands="brands"
      :current-id="selectedBrandId || undefined"
      @select="handleBrandSelected"
    />

    <!-- Controls bar -->
    <div class="controls-bar">
      <div class="time-pills">
        <button
          v-for="range in timeRanges"
          :key="range.key"
          :class="['pill', { active: selectedTimeRange === range.key }]"
          @click="$emit('update:selectedTimeRange', range.key)"
        >
          {{ range.label }}
        </button>
        <button
          :class="['pill', { active: selectedTimeRange === 'all' }]"
          @click="$emit('update:selectedTimeRange', 'all')"
        >
          {{ t('analytics.allTime') }}
        </button>
      </div>

      <div class="refresh-area">
        <span v-if="timeSinceLastSync" class="sync-text">
          {{ t('analytics.lastSynced') }}: {{ timeSinceLastSync }}
        </span>
        <button
          class="refresh-btn"
          :disabled="refreshingEngagement"
          @click="$emit('refresh')"
        >
          <MaterialIcon icon="sync" size="sm" :class="{ spinning: refreshingEngagement }" />
          <span class="refresh-label">{{ refreshingEngagement ? t('analytics.refreshing') : t('analytics.refreshMetrics') }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.analytics-header {
  margin-bottom: var(--space-2xl);
}

/* Hero Banner */
.hero-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-2xl) var(--space-xl);
  background: linear-gradient(135deg, rgba(15, 61, 46, 0.06) 0%, rgba(15, 61, 46, 0.02) 100%);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  margin-bottom: var(--space-lg);
  gap: var(--space-lg);
  flex-wrap: wrap;
}

.hero-left {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
}

.hero-icon {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-xl);
  background: var(--gradient-gold);
  color: var(--text-on-gold);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 16px rgba(15, 61, 46, 0.2);
}

.hero-title {
  font-family: var(--font-heading);
  font-size: var(--text-3xl);
  color: var(--text-primary);
  margin: 0;
  letter-spacing: -0.02em;
}

.hero-subtitle {
  color: var(--text-secondary);
  margin: var(--space-xs) 0 0 0;
  font-size: var(--text-sm);
}

.hero-right {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

/* Business chip selector */
.brand-chip {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md) var(--space-sm) var(--space-sm);
  background: var(--bg-secondary);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-full);
  color: var(--gold-primary);
  cursor: pointer;
  transition: var(--transition-base);
  font-family: var(--font-body);
  font-size: var(--text-sm);
}

.brand-chip:hover {
  border-color: var(--gold-primary);
  box-shadow: 0 2px 8px rgba(15, 61, 46, 0.1);
}

.chip-avatar {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-full);
  overflow: hidden;
  flex-shrink: 0;
  border: 1.5px solid var(--glass-border);
}

.chip-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.chip-name {
  color: var(--text-primary);
  font-weight: var(--font-medium);
  white-space: nowrap;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chip-action-icon {
  color: var(--text-muted);
  transition: var(--transition-fast);
}

.brand-chip:hover .chip-action-icon {
  color: var(--gold-primary);
}

.add-brand-btn {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-lg);
  background: var(--bg-secondary);
  border: 1px dashed var(--glass-border);
  border-radius: var(--radius-full);
  color: var(--text-secondary);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: var(--transition-base);
}

.add-brand-btn:hover {
  border-color: var(--gold-primary);
  color: var(--gold-primary);
}

/* Controls Bar */
.controls-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-lg);
  flex-wrap: wrap;
}

.time-pills {
  display: flex;
  gap: 2px;
  background: var(--bg-secondary);
  padding: 3px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--glass-border);
}

.pill {
  padding: var(--space-sm) var(--space-xl);
  background: transparent;
  border: none;
  border-radius: calc(var(--radius-lg) - 2px);
  color: var(--text-secondary);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  cursor: pointer;
  transition: var(--transition-fast);
  white-space: nowrap;
}

.pill:hover:not(.active) {
  color: var(--text-primary);
  background: var(--bg-tertiary);
}

.pill.active {
  background: var(--gold-primary);
  color: var(--text-on-gold);
  box-shadow: 0 2px 8px rgba(15, 61, 46, 0.25);
}

.refresh-area {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.sync-text {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-md);
  background: transparent;
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  color: var(--gold-primary);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: var(--transition-base);
}

.refresh-btn:hover:not(:disabled) {
  background: rgba(15, 61, 46, 0.05);
  border-color: var(--gold-primary);
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Responsive */
@media (max-width: 768px) {
  .hero-banner {
    flex-direction: column;
    align-items: flex-start;
    padding: var(--space-xl);
  }

  .hero-left {
    gap: var(--space-md);
  }

  .hero-icon {
    width: 44px;
    height: 44px;
  }

  .hero-title {
    font-size: var(--text-2xl);
  }

  .controls-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .time-pills {
    justify-content: space-between;
  }

  .pill {
    flex: 1;
    text-align: center;
    padding: var(--space-sm);
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .refresh-area {
    justify-content: space-between;
  }

  .refresh-label {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .spinning { animation: none; }
}
</style>

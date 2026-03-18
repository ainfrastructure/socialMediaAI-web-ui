<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import MaterialIcon from '@/components/MaterialIcon.vue'

const { t } = useI18n()

const platformFilters = [
  { key: 'all', label: 'All', active: true },
  { key: 'fb', label: 'f', active: false },
  { key: 'ig', label: 'ig', active: false },
  { key: 'x', label: '𝕏', active: false },
  { key: 'li', label: 'in', active: false },
]

const stats = [
  { icon: 'people', value: '12.4K', labelKey: 'analyticsReach' },
  { icon: 'trending_up', value: '4.2%', labelKey: 'analyticsEngagement' },
  { icon: 'check_circle', value: '28', labelKey: 'analyticsPublished' },
]

const organicRows = [
  { labelKey: 'analyticsReach', value: '12.4K' },
  { labelKey: 'analyticsImpressions', value: '18.2K' },
  { labelKey: 'analyticsEngagement', value: '4.2%' },
  { labelKey: 'analyticsPosts', value: '28' },
]

const paidRows = [
  { labelKey: 'analyticsImpressions', value: '6.8K' },
  { labelKey: 'analyticsClicks', value: '312' },
  { labelKey: 'analyticsTotalSpend', value: '1.2K' },
  { labelKey: 'analyticsCtr', value: '4.6%' },
]
</script>

<template>
  <div class="demo-analytics" data-demo-analytics>
    <!-- Header -->
    <div class="da-header">
      <div class="da-back">
        <MaterialIcon icon="arrow_back" size="xs" />
      </div>
      <span class="da-title">{{ t('appLanding.cinematic.analyticsTitle') }}</span>
      <div class="da-overview-badge">
        <span>{{ t('appLanding.cinematic.analyticsOverview') }}</span>
        <MaterialIcon icon="arrow_drop_down" size="xs" />
      </div>
    </div>

    <!-- Platform filter circles -->
    <div class="da-platform-filters" data-demo-analytics-platforms>
      <div
        v-for="p in platformFilters"
        :key="p.key"
        class="da-platform-filter"
        :class="{ 'da-platform-active': p.active }"
      >
        <span class="da-platform-label">{{ p.label }}</span>
      </div>
    </div>

    <!-- Date filters -->
    <div class="da-date-filters" data-demo-analytics-dates>
      <span class="da-date-filter">{{ t('appLanding.cinematic.analytics7Days') }}</span>
      <span class="da-date-filter da-date-active">{{ t('appLanding.cinematic.analytics30Days') }}</span>
      <span class="da-date-filter">{{ t('appLanding.cinematic.analytics90Days') }}</span>
    </div>

    <!-- 3 stat cards in a row -->
    <div class="da-stats" data-demo-analytics-stats>
      <div
        v-for="stat in stats"
        :key="stat.labelKey"
        class="da-stat"
      >
        <MaterialIcon :icon="stat.icon" size="xs" class="da-stat-icon" />
        <span class="da-stat-value">{{ stat.value }}</span>
        <span class="da-stat-label">{{ t(`appLanding.cinematic.${stat.labelKey}`) }}</span>
      </div>
    </div>

    <!-- Performance Trend -->
    <div class="da-chart" data-demo-analytics-chart>
      <span class="da-section-title">{{ t('appLanding.cinematic.analyticsPerformanceTrend') }}</span>
      <div class="da-chart-box">
        <svg class="da-chart-svg" viewBox="0 0 200 60" preserveAspectRatio="none">
          <path
            class="da-chart-line"
            d="M0,50 C30,48 50,40 80,32 C110,24 140,18 170,12 C185,9 195,6 200,5"
            fill="none"
            stroke="var(--lp-accent-orange)"
            stroke-width="2"
            stroke-linecap="round"
          />
          <path
            class="da-chart-fill"
            d="M0,50 C30,48 50,40 80,32 C110,24 140,18 170,12 C185,9 195,6 200,5 L200,60 L0,60 Z"
            fill="url(#chartGradient)"
          />
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="var(--lp-accent-orange)" stop-opacity="0.2" />
              <stop offset="100%" stop-color="var(--lp-accent-orange)" stop-opacity="0" />
            </linearGradient>
          </defs>
        </svg>
        <div class="da-chart-dates">
          <span>Mar 1</span>
          <span>Mar 8</span>
          <span>Mar 15</span>
          <span>Mar 22</span>
        </div>
      </div>
      <div class="da-chart-legend">
        <span class="da-legend-dot" />
        <span>{{ t('appLanding.cinematic.analyticsOrganic') }}</span>
      </div>
    </div>

    <!-- Organic vs Paid comparison table -->
    <div class="da-comparison" data-demo-analytics-comparison>
      <div class="da-comparison-col">
        <span class="da-col-header">{{ t('appLanding.cinematic.analyticsOrganic') }}</span>
        <div
          v-for="row in organicRows"
          :key="row.labelKey"
          class="da-table-row"
        >
          <span class="da-row-label">{{ t(`appLanding.cinematic.${row.labelKey}`) }}</span>
          <span class="da-row-value">{{ row.value }}</span>
        </div>
      </div>
      <div class="da-comparison-col">
        <span class="da-col-header">{{ t('appLanding.cinematic.analyticsPaid') }}</span>
        <div
          v-for="row in paidRows"
          :key="row.labelKey"
          class="da-table-row"
        >
          <span class="da-row-label">{{ t(`appLanding.cinematic.${row.labelKey}`) }}</span>
          <span class="da-row-value">{{ row.value }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.demo-analytics {
  position: absolute;
  inset: 0;
  z-index: 30;
  background: var(--lp-bg-primary, #09090B);
  display: flex;
  flex-direction: column;
  opacity: 0;
  pointer-events: none;
}

/* Header */
.da-header {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-md);
  border-bottom: 1px solid var(--lp-border, rgba(255, 255, 255, 0.08));
  flex-shrink: 0;
}

.da-back {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--lp-text-secondary);
}

.da-title {
  flex: 1;
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--lp-text-primary);
}

.da-overview-badge {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 2px 6px;
  border-radius: var(--radius-full);
  background: color-mix(in srgb, var(--lp-accent-orange) 15%, transparent);
  border: 1px solid color-mix(in srgb, var(--lp-accent-orange) 30%, transparent);
  font-size: 7px;
  font-weight: var(--font-semibold);
  color: var(--lp-accent-orange);
  flex-shrink: 0;
}

.da-overview-badge .material-icon {
  font-size: 10px;
}

/* Platform filters */
.da-platform-filters {
  display: flex;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-md) 0;
  justify-content: center;
  flex-shrink: 0;
}

.da-platform-filter {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--lp-border, rgba(255, 255, 255, 0.15));
  font-size: 8px;
  font-weight: var(--font-bold);
  color: var(--lp-text-secondary);
}

.da-platform-active {
  background: var(--lp-accent-orange);
  border-color: var(--lp-accent-orange);
  color: #fff;
}

.da-platform-label {
  line-height: 1;
}

/* Date filters */
.da-date-filters {
  display: flex;
  gap: 4px;
  padding: var(--space-xs) var(--space-md);
  justify-content: center;
  flex-shrink: 0;
}

.da-date-filter {
  font-size: 7px;
  padding: 3px 8px;
  border-radius: var(--radius-full);
  background: var(--lp-bg-surface, rgba(255, 255, 255, 0.06));
  border: 1px solid var(--lp-border, rgba(255, 255, 255, 0.08));
  color: var(--lp-text-secondary);
  font-weight: var(--font-medium);
}

.da-date-active {
  background: color-mix(in srgb, var(--lp-accent-orange) 15%, transparent);
  border-color: var(--lp-accent-orange);
  color: var(--lp-accent-orange);
}

/* Stats — 3 in a row */
.da-stats {
  display: flex;
  gap: 6px;
  padding: var(--space-xs) var(--space-md);
  flex-shrink: 0;
}

.da-stat {
  flex: 1;
  background: var(--lp-bg-surface, rgba(255, 255, 255, 0.06));
  border: 1px solid var(--lp-border, rgba(255, 255, 255, 0.08));
  border-radius: var(--radius-md);
  padding: var(--space-xs) var(--space-sm);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  opacity: 0;
}

.da-stat-icon {
  font-size: 12px;
  color: var(--lp-accent-orange);
  margin-bottom: 1px;
}

.da-stat-value {
  font-size: 13px;
  font-weight: var(--font-bold);
  color: var(--lp-text-primary);
  font-family: var(--font-heading);
  line-height: 1.2;
}

.da-stat-label {
  font-size: 6px;
  color: var(--lp-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* Chart */
.da-chart {
  padding: var(--space-xs) var(--space-md);
  flex-shrink: 0;
}

.da-section-title {
  font-size: 8px;
  font-weight: var(--font-semibold);
  color: var(--lp-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  display: block;
  margin-bottom: var(--space-xs);
}

.da-chart-box {
  background: var(--lp-bg-surface, rgba(255, 255, 255, 0.03));
  border: 1px solid var(--lp-border, rgba(255, 255, 255, 0.06));
  border-radius: var(--radius-md);
  padding: var(--space-sm) var(--space-sm) 0;
  overflow: hidden;
}

.da-chart-svg {
  width: 100%;
  height: 45px;
  display: block;
  opacity: 0;
}

.da-chart-dates {
  display: flex;
  justify-content: space-between;
  padding: 3px 0 var(--space-xs);
  font-size: 6px;
  color: var(--lp-text-muted);
}

.da-chart-legend {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 3px;
  font-size: 7px;
  color: var(--lp-text-secondary);
}

.da-legend-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--lp-accent-orange);
}

/* Comparison table */
.da-comparison {
  display: flex;
  gap: 6px;
  padding: var(--space-xs) var(--space-md);
  flex-shrink: 0;
}

.da-comparison-col {
  flex: 1;
  background: var(--lp-bg-surface, rgba(255, 255, 255, 0.04));
  border: 1px solid var(--lp-border, rgba(255, 255, 255, 0.06));
  border-radius: var(--radius-md);
  padding: var(--space-xs) var(--space-sm);
}

.da-col-header {
  font-size: 7px;
  font-weight: var(--font-bold);
  color: var(--lp-accent-orange);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  display: block;
  margin-bottom: 4px;
}

.da-table-row {
  display: flex;
  justify-content: space-between;
  padding: 2px 0;
  opacity: 0;
}

.da-row-label {
  font-size: 7px;
  color: var(--lp-text-muted);
}

.da-row-value {
  font-size: 7px;
  font-weight: var(--font-semibold);
  color: var(--lp-text-primary);
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
</style>

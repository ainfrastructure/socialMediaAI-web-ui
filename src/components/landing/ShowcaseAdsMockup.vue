<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import MaterialIcon from '@/components/MaterialIcon.vue'

defineProps<{ visible: boolean }>()
const { t } = useI18n()
</script>

<template>
  <div class="lp-ads-card">
    <div class="lp-ads-card-header">
      <MaterialIcon icon="campaign" size="sm" />
      <span>{{ t('appLanding.adsManager.campaignTitle') }}</span>
      <span class="lp-ads-status">{{ t('appLanding.adsManager.active') }}</span>
    </div>

    <div class="lp-ads-chart">
      <svg viewBox="0 0 300 80" class="lp-ads-sparkline">
        <defs>
          <linearGradient id="adsSparkGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="var(--lp-accent-orange)" stop-opacity="0.3" />
            <stop offset="100%" stop-color="var(--lp-accent-orange)" stop-opacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M0,60 Q30,55 60,45 T120,30 T180,35 T240,15 T300,20"
          fill="none"
          stroke="var(--lp-accent-orange)"
          stroke-width="2"
        />
        <path
          d="M0,60 Q30,55 60,45 T120,30 T180,35 T240,15 T300,20 V80 H0 Z"
          fill="url(#adsSparkGrad)"
        />
      </svg>
    </div>

    <div class="lp-ads-card-row">
      <div class="lp-ads-metric">
        <span class="lp-ads-metric-label">{{ t('appLanding.adsManager.impressions') }}</span>
        <span class="lp-ads-metric-value">245.8K</span>
      </div>
      <div class="lp-ads-metric">
        <span class="lp-ads-metric-label">{{ t('appLanding.adsManager.clicks') }}</span>
        <span class="lp-ads-metric-value">5,692</span>
      </div>
      <div class="lp-ads-metric">
        <span class="lp-ads-metric-label">CTR</span>
        <span class="lp-ads-metric-value">2.31%</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lp-ads-card {
  background: var(--lp-bg-surface);
  border: 1px solid var(--lp-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
  transition: box-shadow 0.3s ease;
}

.lp-ads-card:hover {
  box-shadow: var(--lp-shadow-card), var(--lp-shadow-glow);
}

.lp-ads-card-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-lg) var(--space-xl);
  border-bottom: 1px solid var(--lp-border);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--lp-text-primary);
}

.lp-ads-card-header .material-icon {
  color: var(--lp-accent-orange);
}

.lp-ads-status {
  margin-left: auto;
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: #22c55e;
  background: rgba(34, 197, 94, 0.1);
  padding: 2px 10px;
  border-radius: var(--radius-full);
}

.lp-ads-chart {
  padding: var(--space-lg) var(--space-xl);
}

.lp-ads-sparkline {
  width: 100%;
  height: 80px;
}

.lp-ads-card-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  border-top: 1px solid var(--lp-border);
}

.lp-ads-metric {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-lg);
  border-right: 1px solid var(--lp-border);
}

.lp-ads-metric:last-child {
  border-right: none;
}

.lp-ads-metric-label {
  font-size: 9px;
  color: var(--lp-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: var(--space-xs);
}

.lp-ads-metric-value {
  font-size: var(--text-base);
  font-weight: var(--font-bold);
  color: var(--lp-text-primary);
}
</style>

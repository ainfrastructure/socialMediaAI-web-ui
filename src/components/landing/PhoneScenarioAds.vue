<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import MaterialIcon from '@/components/MaterialIcon.vue'

const { t } = useI18n()
</script>

<template>
  <div class="scenario-ads">
    <!-- Search bar -->
    <div class="sads-search">
      <MaterialIcon icon="search" size="xs" />
      <span class="sads-search-text">{{ t('appLanding.cinematic.adsSearchText') }}</span>
      <span class="sads-search-cursor">|</span>
    </div>

    <!-- Campaign card -->
    <div class="sads-campaign">
      <div class="sads-campaign-header">
        <MaterialIcon icon="campaign" size="xs" />
        <span class="sads-campaign-name">{{ t('appLanding.cinematic.adsCampaignName') }}</span>
        <span class="sads-campaign-badge">{{ t('appLanding.cinematic.adsActive') }}</span>
      </div>

      <!-- Sparkline -->
      <div class="sads-chart">
        <svg viewBox="0 0 240 60" class="sads-sparkline" preserveAspectRatio="none">
          <defs>
            <linearGradient id="adsSparkGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="var(--lp-accent-orange)" stop-opacity="0.25" />
              <stop offset="100%" stop-color="var(--lp-accent-orange)" stop-opacity="0" />
            </linearGradient>
          </defs>
          <path
            class="sads-spark-fill"
            d="M0,48 Q24,44 48,36 T96,24 T144,28 T192,12 T240,16 V60 H0 Z"
            fill="url(#adsSparkGrad)"
          />
          <path
            class="sads-spark-line"
            d="M0,48 Q24,44 48,36 T96,24 T144,28 T192,12 T240,16"
            fill="none"
            stroke="var(--lp-accent-orange)"
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>
      </div>
    </div>

    <!-- KPI grid -->
    <div class="sads-kpis">
      <div class="sads-kpi">
        <span class="sads-kpi-label">ROAS</span>
        <span class="sads-kpi-value" data-kpi="roas">4.2x</span>
      </div>
      <div class="sads-kpi">
        <span class="sads-kpi-label">CPC</span>
        <span class="sads-kpi-value" data-kpi="cpc">$0.42</span>
      </div>
      <div class="sads-kpi sads-kpi-highlight">
        <span class="sads-kpi-label">{{ t('appLanding.cinematic.adsConversions') }}</span>
        <span class="sads-kpi-value" data-kpi="conversions">1,847</span>
      </div>
      <div class="sads-kpi">
        <span class="sads-kpi-label">{{ t('appLanding.cinematic.adsSpend') }}</span>
        <span class="sads-kpi-value" data-kpi="spend">$2,340</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scenario-ads {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  padding: var(--space-md);
  background: var(--lp-bg-primary, #0d0d12);
}

/* Search */
.sads-search {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  background: var(--lp-bg-surface, rgba(255,255,255,0.06));
  border: 1px solid var(--lp-border, rgba(255,255,255,0.08));
  border-radius: var(--radius-md);
  padding: var(--space-xs) var(--space-sm);
  color: var(--lp-text-muted);
  opacity: 0;
}

.sads-search-text {
  font-size: 10px;
  color: var(--lp-text-primary);
  overflow: hidden;
  white-space: nowrap;
  max-width: 0;
}

.sads-search-cursor {
  color: var(--lp-accent-orange);
  font-weight: var(--font-bold);
  font-size: 10px;
  animation: ads-blink 0.8s step-end infinite;
}

@keyframes ads-blink {
  50% { opacity: 0; }
}

/* Campaign card */
.sads-campaign {
  background: var(--lp-bg-surface, rgba(255,255,255,0.06));
  border: 1px solid var(--lp-border-light, rgba(255,255,255,0.1));
  border-radius: var(--radius-md);
  overflow: hidden;
  opacity: 0;
  transform: translateY(20px);
}

.sads-campaign-header {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-md);
  border-bottom: 1px solid var(--lp-border, rgba(255,255,255,0.06));
  font-size: 10px;
  font-weight: var(--font-semibold);
  color: var(--lp-text-primary);
}

.sads-campaign-header .material-icon {
  color: var(--lp-accent-orange);
}

.sads-campaign-name {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sads-campaign-badge {
  font-size: 8px;
  font-weight: var(--font-semibold);
  color: #22c55e;
  background: rgba(34, 197, 94, 0.12);
  padding: 2px 8px;
  border-radius: var(--radius-full);
}

/* Chart */
.sads-chart {
  padding: var(--space-sm) var(--space-md);
  height: 60px;
}

.sads-sparkline {
  width: 100%;
  height: 100%;
}

.sads-spark-line {
  stroke-dasharray: 400;
  stroke-dashoffset: 400;
}

/* KPI grid */
.sads-kpis {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-xs);
}

.sads-kpi {
  background: var(--lp-bg-surface, rgba(255,255,255,0.06));
  border: 1px solid var(--lp-border, rgba(255,255,255,0.06));
  border-radius: var(--radius-md);
  padding: var(--space-sm) var(--space-md);
  display: flex;
  flex-direction: column;
  gap: 2px;
  opacity: 0;
}

.sads-kpi-label {
  font-size: 8px;
  font-weight: var(--font-semibold);
  color: var(--lp-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.sads-kpi-value {
  font-size: 14px;
  font-weight: var(--font-bold);
  color: var(--lp-text-primary);
}

.sads-kpi-highlight .sads-kpi-value {
  color: #22c55e;
}

@media (prefers-reduced-motion: reduce) {
  .sads-search-cursor { animation: none; opacity: 0.6; }
}
</style>

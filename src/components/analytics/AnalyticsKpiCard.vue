<script setup lang="ts">
import MaterialIcon from '@/components/MaterialIcon.vue'
import AnalyticsSparkline from './AnalyticsSparkline.vue'
import type { TrendData } from '@/composables/useAnalyticsData'

interface Props {
  icon: string
  value: string | number
  label: string
  trend?: TrendData | null
  sparklineData?: number[]
  accentColor?: string
}

withDefaults(defineProps<Props>(), {
  accentColor: 'var(--gold-primary)',
})
</script>

<template>
  <div class="kpi-card reveal-card">
    <!-- Top row: icon + trend -->
    <div class="kpi-top">
      <div class="kpi-icon-wrap">
        <MaterialIcon :icon="icon" size="sm" />
      </div>
      <div v-if="trend && trend.direction !== 'flat'" :class="['kpi-trend', trend.direction]">
        <MaterialIcon
          :icon="trend.direction === 'up' ? 'arrow_upward' : 'arrow_downward'"
          size="xs"
        />
        <span>{{ trend.percentage.toFixed(1) }}%</span>
      </div>
    </div>

    <!-- Value + Label -->
    <div class="kpi-body">
      <span class="kpi-value">{{ typeof value === 'number' ? value.toLocaleString() : value }}</span>
      <span class="kpi-label">{{ label }}</span>
    </div>

    <!-- Sparkline spanning full width -->
    <div v-if="sparklineData?.length" class="kpi-sparkline">
      <AnalyticsSparkline
        :data="sparklineData"
        :width="160"
        :height="40"
        :color="accentColor"
        fill-color="rgba(15, 61, 46, 0.06)"
      />
    </div>
  </div>
</template>

<style scoped>
.kpi-card {
  position: relative;
  background: var(--bg-secondary);
  border: 1px solid var(--glass-border);
  border-bottom: 2px solid rgba(176, 138, 90, 0.25);
  border-radius: var(--radius-xl);
  padding: var(--space-xl) var(--space-lg) var(--space-md);
  overflow: hidden;
  transition: var(--transition-base);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  min-height: 160px;
}

.kpi-card:hover {
  transform: translateY(-4px);
  border-bottom-color: var(--gold-primary);
  box-shadow:
    0 12px 40px rgba(15, 61, 46, 0.1),
    0 4px 12px rgba(15, 61, 46, 0.06);
}

/* Top row */
.kpi-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.kpi-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, rgba(15, 61, 46, 0.1), rgba(15, 61, 46, 0.04));
  color: var(--gold-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* Trend pill */
.kpi-trend {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  font-weight: var(--font-bold);
  padding: 3px 8px;
  border-radius: var(--radius-full);
  line-height: 1;
}

.kpi-trend.up {
  background: rgba(34, 197, 94, 0.12);
  color: #16a34a;
}

.kpi-trend.down {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
}

/* Body */
.kpi-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.kpi-value {
  font-family: var(--font-heading);
  font-size: var(--text-4xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  line-height: 1;
  letter-spacing: -0.02em;
}

.kpi-label {
  font-size: var(--text-sm);
  color: var(--text-muted);
  font-weight: var(--font-medium);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-size: 11px;
}

/* Sparkline */
.kpi-sparkline {
  margin-top: auto;
  margin-left: calc(-1 * var(--space-lg));
  margin-right: calc(-1 * var(--space-lg));
  margin-bottom: calc(-1 * var(--space-md));
  overflow: hidden;
  display: flex;
  justify-content: center;
  opacity: 0.8;
}

.kpi-sparkline :deep(canvas) {
  width: 100% !important;
}

/* Responsive */
@media (max-width: 768px) {
  .kpi-card {
    padding: var(--space-lg) var(--space-md) var(--space-sm);
    min-height: 140px;
  }

  .kpi-icon-wrap {
    width: 36px;
    height: 36px;
  }

  .kpi-value {
    font-size: var(--text-3xl);
  }
}

@media (max-width: 480px) {
  .kpi-value {
    font-size: var(--text-2xl);
  }
}

@media (prefers-reduced-motion: reduce) {
  .kpi-card:hover {
    transform: none;
  }
}
</style>

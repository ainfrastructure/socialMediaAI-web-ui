<script setup lang="ts">
import { useI18n } from 'vue-i18n'

defineProps<{ visible: boolean }>()

const { t } = useI18n()

const barData = [35, 52, 48, 65, 72, 58, 80]
</script>

<template>
  <div class="lp-chart-mockup">
    <div class="lp-chart-header">
      <span class="lp-chart-title">{{ t('appLanding.analytics.chartTitle') }}</span>
      <span class="lp-chart-period">{{ t('appLanding.analytics.chartPeriod') }}</span>
    </div>
    <div class="lp-bar-chart">
      <div v-for="(val, i) in barData" :key="i" class="lp-bar-wrapper">
        <div class="lp-bar-fill" :style="{ height: visible ? `${val}%` : '0%' }" />
        <span class="lp-bar-label">{{ ['M', 'T', 'W', 'T', 'F', 'S', 'S'][i] }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lp-chart-mockup {
  background: var(--lp-bg-surface);
  border: 1px solid var(--lp-border);
  border-radius: var(--radius-xl);
  padding: var(--space-2xl);
}

.lp-chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-2xl);
}

.lp-chart-title {
  font-weight: var(--font-semibold);
  color: var(--lp-text-primary);
}

.lp-chart-period {
  font-size: var(--text-xs);
  color: var(--lp-text-muted);
  background: var(--lp-bg-elevated);
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-full);
}

.lp-bar-chart {
  display: flex;
  gap: var(--space-md);
  align-items: flex-end;
  height: 200px;
}

.lp-bar-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  height: 100%;
  justify-content: flex-end;
}

.lp-bar-fill {
  width: 100%;
  border-radius: var(--radius-sm) var(--radius-sm) 0 0;
  background: var(--lp-gradient-aurora);
  transition: height 0.8s ease;
}

.lp-bar-label {
  font-size: var(--text-xs);
  color: var(--lp-text-muted);
}

@media (max-width: 768px) {
  .lp-bar-chart { height: 140px; }
}
</style>

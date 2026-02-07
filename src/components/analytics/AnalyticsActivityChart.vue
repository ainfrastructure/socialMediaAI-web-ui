<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Line } from 'vue-chartjs'
import MaterialIcon from '@/components/MaterialIcon.vue'

interface Props {
  chartData: any
  chartOptions: any
}

defineProps<Props>()
const { t } = useI18n()
</script>

<template>
  <div class="chart-card reveal-card">
    <div class="chart-header">
      <div class="chart-title-area">
        <div class="chart-icon">
          <MaterialIcon icon="show_chart" size="sm" />
        </div>
        <div>
          <h3 class="chart-title">{{ t('analytics.postingActivity') }}</h3>
          <span class="chart-subtitle">{{ t('analytics.postsOverTime') }}</span>
        </div>
      </div>
    </div>
    <div class="chart-container">
      <Line :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>

<style scoped>
.chart-card {
  background: var(--bg-secondary);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  padding: var(--space-xl);
  overflow: hidden;
  position: relative;
}

.chart-card::after {
  content: '';
  position: absolute;
  top: var(--space-xl);
  bottom: var(--space-xl);
  left: 0;
  width: 3px;
  background: var(--gradient-gold);
  border-radius: 0 2px 2px 0;
}

.chart-header {
  margin-bottom: var(--space-xl);
}

.chart-title-area {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.chart-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, rgba(15, 61, 46, 0.1), rgba(15, 61, 46, 0.04));
  color: var(--gold-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.chart-title {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  color: var(--text-primary);
  margin: 0;
}

.chart-subtitle {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.chart-container {
  height: 300px;
  position: relative;
}

@media (max-width: 768px) {
  .chart-card {
    padding: var(--space-lg);
  }

  .chart-container {
    height: 240px;
  }
}
</style>

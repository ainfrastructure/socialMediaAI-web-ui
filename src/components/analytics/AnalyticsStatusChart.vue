<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Bar } from 'vue-chartjs'
import MaterialIcon from '@/components/MaterialIcon.vue'

interface Props {
  chartData: any
  chartOptions: any
}

const props = defineProps<Props>()
const { t } = useI18n()

const legendItems = computed(() => {
  if (!props.chartData?.labels) return []
  const colors = props.chartData.datasets?.[0]?.backgroundColor || []
  return props.chartData.labels.map((label: string, i: number) => ({
    label,
    color: colors[i] || '#ccc',
  }))
})
</script>

<template>
  <div class="chart-card reveal-card">
    <div class="chart-header">
      <div class="chart-title-area">
        <div class="chart-icon">
          <MaterialIcon icon="bar_chart" size="sm" />
        </div>
        <div>
          <h3 class="chart-title">{{ t('analytics.postStatus') }}</h3>
          <span class="chart-subtitle">{{ t('analytics.byStatus') }}</span>
        </div>
      </div>
    </div>
    <div class="chart-container">
      <Bar :data="chartData" :options="chartOptions" />
    </div>
    <div v-if="legendItems.length" class="custom-legend">
      <span v-for="item in legendItems" :key="item.label" class="legend-item">
        <span class="legend-dot" :style="{ backgroundColor: item.color }" />
        {{ item.label }}
      </span>
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
  right: 0;
  width: 3px;
  background: linear-gradient(180deg, #b08a5a, #9a7848);
  border-radius: 2px 0 0 2px;
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

.custom-legend {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-lg);
  margin-top: var(--space-md);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--text-xs);
  color: var(--text-secondary);
  font-weight: var(--font-medium);
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
  flex-shrink: 0;
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

<script setup lang="ts">
import { Bar } from 'vue-chartjs'
import BaseCard from '@/components/BaseCard.vue'

defineProps<{
  chartData: {
    labels: string[]
    datasets: Array<{
      label: string
      data: number[]
      backgroundColor: string
      borderColor: string
      borderWidth: number
      borderRadius: number
      barPercentage: number
    }>
  }
  chartOptions: Record<string, unknown>
}>()
</script>

<template>
  <BaseCard variant="glass" class="chart-card reveal-card">
    <div class="chart-header">
      <h3 class="chart-title">Mention Volume</h3>
      <p class="chart-subtitle">Total mentions per time interval</p>
    </div>
    <div class="chart-container">
      <Bar :data="chartData" :options="chartOptions" />
    </div>
  </BaseCard>
</template>

<style scoped>
.chart-card {
  padding: var(--space-xl);
}

.chart-header {
  margin-bottom: var(--space-lg);
}

.chart-title {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0;
}

.chart-subtitle {
  font-size: var(--text-sm);
  color: var(--text-muted);
  margin: 2px 0 0;
}

.chart-container {
  height: 280px;
  position: relative;
}

@media (max-width: 768px) {
  .chart-container {
    height: 220px;
  }

  .chart-card {
    padding: var(--space-lg);
  }
}
</style>

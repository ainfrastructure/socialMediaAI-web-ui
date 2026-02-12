<script setup lang="ts">
import { Doughnut } from 'vue-chartjs'
import BaseCard from '@/components/BaseCard.vue'
import type { SentimentSummary } from '@/types/sentiment'

defineProps<{
  chartData: {
    labels: string[]
    datasets: Array<{
      data: number[]
      backgroundColor: string[]
      borderColor: string[]
      borderWidth: number
      hoverOffset: number
    }>
  } | null
  chartOptions: Record<string, unknown>
  summary: SentimentSummary | null
}>()
</script>

<template>
  <BaseCard variant="glass" class="donut-card reveal-card">
    <div class="chart-header">
      <h3 class="chart-title">Sentiment Split</h3>
      <p class="chart-subtitle">Distribution of mention sentiment</p>
    </div>

    <div class="donut-container" v-if="chartData && summary">
      <div class="donut-wrap">
        <Doughnut :data="chartData" :options="chartOptions" />
        <div class="donut-center">
          <span class="donut-center-value">{{ summary.totalMentions }}</span>
          <span class="donut-center-label">mentions</span>
        </div>
      </div>
    </div>

    <div class="donut-skeleton" v-else>
      <div class="skeleton-ring" />
    </div>
  </BaseCard>
</template>

<style scoped>
.donut-card {
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

.donut-container {
  display: flex;
  justify-content: center;
  padding: var(--space-md) 0;
}

.donut-wrap {
  position: relative;
  width: 220px;
  height: 220px;
}

.donut-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -60%);
  text-align: center;
  display: flex;
  flex-direction: column;
  pointer-events: none;
}

.donut-center-value {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  line-height: 1;
}

.donut-center-label {
  font-size: var(--text-xs);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Skeleton */
.donut-skeleton {
  display: flex;
  justify-content: center;
  padding: var(--space-2xl) 0;
}

.skeleton-ring {
  width: 180px;
  height: 180px;
  border-radius: var(--radius-full);
  border: 20px solid var(--bg-tertiary);
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
}

@media (max-width: 768px) {
  .donut-wrap {
    width: 180px;
    height: 180px;
  }

  .donut-card {
    padding: var(--space-lg);
  }
}
</style>

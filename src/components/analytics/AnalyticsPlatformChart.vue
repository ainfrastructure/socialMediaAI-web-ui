<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Doughnut } from 'vue-chartjs'
import PlatformLogo from '@/components/PlatformLogo.vue'

interface Props {
  chartData: any
  chartOptions: any
  hasData: boolean
}

const props = defineProps<Props>()
const { t } = useI18n()

const totalPosts = computed(() => {
  if (!props.hasData || !props.chartData?.datasets?.[0]?.data) return 0
  return props.chartData.datasets[0].data.reduce((sum: number, v: number) => sum + v, 0)
})

const platformEntries = computed(() => {
  if (!props.hasData || !props.chartData?.labels) return []
  const data = props.chartData.datasets[0].data
  const colors = props.chartData.datasets[0].backgroundColor
  const total = totalPosts.value || 1
  return props.chartData.labels.map((label: string, i: number) => ({
    name: label,
    key: label.toLowerCase(),
    count: data[i],
    color: colors[i],
    percent: Math.round((data[i] / total) * 100)
  })).sort((a: { count: number }, b: { count: number }) => b.count - a.count)
})
</script>

<template>
  <div class="platform-card reveal-card">
    <div class="platform-card-header">
      <h3 class="platform-card-title">{{ t('analytics.platformDistribution') }}</h3>
      <span class="platform-card-subtitle">{{ t('analytics.postsByPlatform') }}</span>
    </div>

    <template v-if="hasData">
      <div class="platform-layout">
        <!-- Doughnut with center stat -->
        <div class="doughnut-area">
          <div class="doughnut-wrap">
            <Doughnut :data="chartData" :options="chartOptions" />
            <div class="doughnut-center">
              <span class="center-value">{{ totalPosts }}</span>
              <span class="center-label">{{ t('common.posts') }}</span>
            </div>
          </div>
        </div>

        <!-- Custom platform legend -->
        <div class="platform-legend">
          <div
            v-for="entry in platformEntries"
            :key="entry.key"
            class="legend-row"
          >
            <div class="legend-left">
              <PlatformLogo :platform="entry.key" :size="20" />
              <span class="legend-name">{{ entry.name }}</span>
            </div>
            <div class="legend-right">
              <div class="legend-bar-track">
                <div
                  class="legend-bar-fill"
                  :style="{ width: entry.percent + '%', backgroundColor: entry.color }"
                />
              </div>
              <span class="legend-count">{{ entry.count }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <div v-else class="empty-state">
      <div class="empty-icon-ring">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="var(--text-muted)" stroke-width="1.5" stroke-dasharray="3 3" />
          <circle cx="12" cy="12" r="4" stroke="var(--text-muted)" stroke-width="1.5" />
        </svg>
      </div>
      <p class="empty-text">{{ t('analytics.noDataYet') }}</p>
    </div>
  </div>
</template>

<style scoped>
.platform-card {
  background: var(--bg-secondary);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  padding: var(--space-xl);
}

.platform-card-header {
  margin-bottom: var(--space-lg);
}

.platform-card-title {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  color: var(--text-primary);
  margin: 0;
  letter-spacing: -0.01em;
}

.platform-card-subtitle {
  display: block;
  font-size: var(--text-xs);
  color: var(--text-muted);
  margin-top: 2px;
}

/* Layout: doughnut left, legend right */
.platform-layout {
  display: flex;
  align-items: center;
  gap: var(--space-xl);
}

/* Doughnut */
.doughnut-area {
  flex-shrink: 0;
  width: 160px;
  height: 160px;
}

.doughnut-wrap {
  position: relative;
  width: 100%;
  height: 100%;
}

.doughnut-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.center-value {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  line-height: 1;
}

.center-label {
  font-size: 0.65rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-top: 2px;
}

/* Custom legend */
.platform-legend {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.legend-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  padding: var(--space-xs) 0;
}

.legend-left {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex-shrink: 0;
  min-width: 100px;
}

.legend-name {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-primary);
}

.legend-right {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  flex: 1;
  min-width: 0;
}

.legend-bar-track {
  flex: 1;
  height: 6px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.legend-bar-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}

.legend-count {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-secondary);
  min-width: 24px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-3xl) 0;
  gap: var(--space-md);
}

.empty-icon-ring {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-full);
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-text {
  color: var(--text-muted);
  font-size: var(--text-sm);
  margin: 0;
}

/* Mobile: stack vertically */
@media (max-width: 768px) {
  .platform-card {
    padding: var(--space-lg);
  }

  .platform-layout {
    flex-direction: column;
    gap: var(--space-lg);
  }

  .doughnut-area {
    width: 140px;
    height: 140px;
  }

  .center-value {
    font-size: var(--text-xl);
  }

  .platform-legend {
    width: 100%;
  }
}
</style>

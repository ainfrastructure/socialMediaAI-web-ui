<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import DashboardLayout from '@/components/DashboardLayout.vue'
import SentimentHeader from '@/components/sentiment/SentimentHeader.vue'
import SentimentKpiGrid from '@/components/sentiment/SentimentKpiGrid.vue'
import SentimentChart from '@/components/sentiment/SentimentChart.vue'
import SentimentVolumeChart from '@/components/sentiment/SentimentVolumeChart.vue'
import SentimentDonut from '@/components/sentiment/SentimentDonut.vue'
import SentimentAlerts from '@/components/sentiment/SentimentAlerts.vue'
import SentimentFeed from '@/components/sentiment/SentimentFeed.vue'
import SentimentInfluential from '@/components/sentiment/SentimentInfluential.vue'
import SentimentSpikes from '@/components/sentiment/SentimentSpikes.vue'
import MaterialIcon from '@/components/MaterialIcon.vue'
import { useSentimentData } from '@/composables/useSentimentData'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
)

const {
  store,
  sentimentChartData,
  sentimentChartOptions,
  volumeChartData,
  volumeChartOptions,
  sentimentDonutData,
  sentimentDonutOptions,
  initialize,
  cleanup,
} = useSentimentData()

onMounted(() => {
  initialize()
})

onUnmounted(() => {
  cleanup()
})
</script>

<template>
  <DashboardLayout>
    <div class="sentiment-view">
      <!-- Header with controls -->
      <SentimentHeader
        :time-range="store.timeRange"
        :is-live="store.isLive"
        :last-updated="store.lastUpdated"
        @update:time-range="store.setTimeRange"
        @toggle-live="store.toggleLive"
        @refresh="store.fetchAll"
      />

      <!-- Error state -->
      <div v-if="store.error" class="error-banner">
        <MaterialIcon icon="error_outline" size="sm" />
        <span>{{ store.error }}</span>
        <button class="retry-btn" @click="store.fetchAll">
          <MaterialIcon icon="refresh" size="xs" />
          Retry
        </button>
      </div>

      <!-- KPI Grid -->
      <SentimentKpiGrid :summary="store.summary" />

      <!-- Section: Alerts (if any unacknowledged) -->
      <div v-if="store.unacknowledgedAlerts.length > 0" class="section-alerts">
        <SentimentAlerts
          :alerts="store.alerts"
          @acknowledge="store.acknowledgeAlert"
          @acknowledge-all="store.acknowledgeAllAlerts"
        />
      </div>

      <!-- Section Divider -->
      <div class="section-divider" />

      <!-- Section Label: Charts -->
      <div class="section-label">
        <div class="section-label-icon">
          <MaterialIcon icon="analytics" size="sm" />
        </div>
        <div>
          <h3 class="section-label-title">Sentiment Analysis</h3>
          <p class="section-label-subtitle">Trends, distribution, and volume over time</p>
        </div>
      </div>

      <!-- Charts Row 1: Sentiment Line + Donut -->
      <div class="charts-grid-main">
        <SentimentChart
          :chart-data="sentimentChartData"
          :chart-options="sentimentChartOptions"
        />
        <SentimentDonut
          :chart-data="sentimentDonutData"
          :chart-options="sentimentDonutOptions"
          :summary="store.summary"
        />
      </div>

      <!-- Charts Row 2: Volume Bar -->
      <div class="charts-grid-full">
        <SentimentVolumeChart
          :chart-data="volumeChartData"
          :chart-options="volumeChartOptions"
        />
      </div>

      <!-- Section Divider -->
      <div class="section-divider" />

      <!-- Section Label: Insights -->
      <div class="section-label">
        <div class="section-label-icon">
          <MaterialIcon icon="insights" size="sm" />
        </div>
        <div>
          <h3 class="section-label-title">Insights & Spikes</h3>
          <p class="section-label-subtitle">Influential mentions and unusual activity</p>
        </div>
      </div>

      <!-- Insights Grid: Influential + Spikes + Alerts (collapsed) -->
      <div class="insights-grid">
        <SentimentInfluential :mentions="store.influentialMentions" />
        <SentimentSpikes :spikes="store.volumeSpikes" />
      </div>

      <!-- Alerts (if all acknowledged, show collapsed) -->
      <div v-if="store.unacknowledgedAlerts.length === 0 && store.alerts.length > 0" class="section-alerts-collapsed">
        <SentimentAlerts
          :alerts="store.alerts"
          @acknowledge="store.acknowledgeAlert"
          @acknowledge-all="store.acknowledgeAllAlerts"
        />
      </div>

      <!-- Section Divider -->
      <div class="section-divider" />

      <!-- Section Label: Live Feed -->
      <div class="section-label">
        <div class="section-label-icon">
          <MaterialIcon icon="dynamic_feed" size="sm" />
        </div>
        <div>
          <h3 class="section-label-title">Live Mentions Feed</h3>
          <p class="section-label-subtitle">All brand mentions from X and Reddit</p>
        </div>
      </div>

      <!-- Live Feed -->
      <SentimentFeed
        :mentions="store.mentions"
        :total="store.mentionsTotal"
        :page="store.mentionsPage"
        :source-filter="store.sourceFilter"
        :sentiment-filter="store.sentimentFilter"
        :loading="store.loading"
        @update:source-filter="store.setSourceFilter"
        @update:sentiment-filter="store.setSentimentFilter"
        @update:page="(p) => { store.mentionsPage = p; store.fetchMentions() }"
      />
    </div>
  </DashboardLayout>
</template>

<style scoped>
.sentiment-view {
  padding: var(--space-xl) var(--space-lg);
  max-width: 1600px;
  margin: 0 auto;
}

/* Reveal animation */
@keyframes sentimentReveal {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

:deep(.reveal-card) {
  animation: sentimentReveal 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
}

:deep(.reveal-card:nth-child(1)) { animation-delay: 0ms; }
:deep(.reveal-card:nth-child(2)) { animation-delay: 60ms; }
:deep(.reveal-card:nth-child(3)) { animation-delay: 120ms; }
:deep(.reveal-card:nth-child(4)) { animation-delay: 180ms; }
:deep(.reveal-card:nth-child(5)) { animation-delay: 240ms; }

/* Error banner */
.error-banner {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-lg);
  margin-bottom: var(--space-lg);
  background: var(--error-bg);
  border: 1px solid var(--error-border);
  border-radius: var(--radius-md);
  color: var(--error-text);
  font-size: var(--text-sm);
}

.retry-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
  padding: var(--space-xs) var(--space-md);
  background: none;
  border: 1px solid var(--error-border);
  border-radius: var(--radius-sm);
  color: var(--error-text);
  font-size: var(--text-xs);
  cursor: pointer;
  transition: var(--transition-fast);
}

.retry-btn:hover {
  background: var(--error-bg);
}

/* Section dividers */
.section-divider {
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--glass-border) 20%,
    var(--glass-border) 80%,
    transparent 100%
  );
  margin: var(--space-2xl) 0;
  position: relative;
}

.section-divider::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 6px;
  height: 6px;
  border-radius: var(--radius-full);
  background: var(--gold-primary);
  opacity: 0.4;
}

/* Section labels */
.section-label {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-xl);
}

.section-label-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, var(--accent-alpha-10), var(--accent-alpha-05));
  color: var(--gold-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.section-label-title {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  color: var(--text-primary);
  margin: 0;
}

.section-label-subtitle {
  font-size: var(--text-sm);
  color: var(--text-muted);
  margin: 2px 0 0;
}

/* Chart grids */
.charts-grid-main {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--space-lg);
  margin-bottom: var(--space-lg);
}

.charts-grid-full {
  margin-bottom: var(--space-xl);
}

/* Insights grid */
.insights-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-lg);
  margin-bottom: var(--space-lg);
}

/* Alerts sections */
.section-alerts {
  margin-bottom: var(--space-lg);
}

.section-alerts-collapsed {
  margin-bottom: var(--space-lg);
}

/* Responsive */
@media (max-width: 1200px) {
  .charts-grid-main {
    grid-template-columns: 1fr;
  }

  .insights-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .sentiment-view {
    padding: var(--space-md);
  }

  .section-divider {
    margin: var(--space-lg) 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  :deep(.reveal-card) {
    animation: none !important;
  }
}
</style>

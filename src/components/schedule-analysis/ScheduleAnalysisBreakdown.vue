<script setup lang="ts">
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import MaterialIcon from '@/components/MaterialIcon.vue'
import type {
  DayPerformance,
  HourPerformance,
  ContentTypePerformance,
  ContentLengthPerformance,
} from '@/types/scheduleAnalysis'

interface Props {
  dayPerformance: DayPerformance[]
  hourPerformance: HourPerformance[]
  contentTypePerformance: ContentTypePerformance[]
  contentLengthPerformance: ContentLengthPerformance[]
}

const props = defineProps<Props>()

function formatRate(rate: number): string {
  return rate > 0 ? `${rate.toFixed(2)}%` : '—'
}

const sharedTooltip = {
  backgroundColor: '#faf6ed',
  titleColor: '#2d2d2d',
  bodyColor: '#5a5a5a',
  borderColor: 'rgba(176, 138, 90, 0.25)',
  borderWidth: 1,
  padding: 12,
  cornerRadius: 8,
  titleFont: { size: 12, family: "'Playfair Display', serif" },
  bodyFont: { size: 11 },
}

const sharedScales = {
  x: {
    grid: { display: false },
    ticks: { color: 'rgba(15, 61, 46, 0.5)', font: { size: 12 } },
  },
  y: {
    beginAtZero: true,
    grid: { color: 'rgba(15, 61, 46, 0.05)' },
    ticks: {
      color: 'rgba(15, 61, 46, 0.5)',
      font: { size: 12 },
      callback: (value: any) => `${value}%`,
    },
  },
}

// Day chart
const dayChartData = computed(() => ({
  labels: props.dayPerformance.map(d => d.dayLabel.slice(0, 3)),
  datasets: [
    {
      label: 'Avg Engagement Rate (%)',
      data: props.dayPerformance.map(d => Number(d.avgEngagementRate.toFixed(3))),
      backgroundColor: props.dayPerformance.map(d =>
        d.postCount > 0 ? 'rgba(15, 61, 46, 0.7)' : 'rgba(15, 61, 46, 0.15)'
      ),
      borderColor: 'rgba(15, 61, 46, 0.9)',
      borderWidth: 1,
      borderRadius: 6,
    },
  ],
}))

const dayChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      ...sharedTooltip,
      callbacks: {
        afterBody: (items: any[]) => {
          const idx = items[0]?.dataIndex
          if (idx == null) return ''
          const day = props.dayPerformance[idx]
          if (!day) return ''
          return [
            `Posts: ${day.postCount}`,
            `95% CI: ${day.confidenceInterval[0].toFixed(2)}% – ${day.confidenceInterval[1].toFixed(2)}%`,
          ]
        },
      },
    },
  },
  scales: sharedScales,
}))

// Hour chart — only show hours with data or business hours (6-22)
const filteredHours = computed(() =>
  props.hourPerformance.filter(h => h.hour >= 6 && h.hour <= 22)
)

const hourChartData = computed(() => ({
  labels: filteredHours.value.map(h => h.hourLabel),
  datasets: [
    {
      label: 'Avg Engagement Rate (%)',
      data: filteredHours.value.map(h => Number(h.avgEngagementRate.toFixed(3))),
      backgroundColor: filteredHours.value.map(h =>
        h.postCount > 0 ? 'rgba(15, 61, 46, 0.7)' : 'rgba(15, 61, 46, 0.15)'
      ),
      borderColor: 'rgba(15, 61, 46, 0.9)',
      borderWidth: 1,
      borderRadius: 4,
    },
  ],
}))

const hourChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      ...sharedTooltip,
      callbacks: {
        afterBody: (items: any[]) => {
          const idx = items[0]?.dataIndex
          if (idx == null) return ''
          const hour = filteredHours.value[idx]
          if (!hour) return ''
          return [
            `Posts: ${hour.postCount}`,
            `95% CI: ${hour.confidenceInterval[0].toFixed(2)}% – ${hour.confidenceInterval[1].toFixed(2)}%`,
          ]
        },
      },
    },
  },
  scales: sharedScales,
}))

// Platform chart
const platformChartData = computed(() => ({
  labels: props.contentTypePerformance.map(c => c.label),
  datasets: [
    {
      label: 'Avg Engagement Rate (%)',
      data: props.contentTypePerformance.map(c => Number(c.avgEngagementRate.toFixed(3))),
      backgroundColor: [
        'rgba(24, 119, 242, 0.7)',  // Facebook blue
        'rgba(228, 64, 95, 0.7)',   // Instagram pink
        'rgba(0, 0, 0, 0.7)',       // TikTok black
        'rgba(29, 161, 242, 0.7)',  // Twitter blue
        'rgba(10, 102, 194, 0.7)',  // LinkedIn blue
      ],
      borderWidth: 1,
      borderRadius: 6,
    },
  ],
}))

const platformChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      ...sharedTooltip,
      callbacks: {
        afterBody: (items: any[]) => {
          const idx = items[0]?.dataIndex
          if (idx == null) return ''
          const ct = props.contentTypePerformance[idx]
          if (!ct) return ''
          return [
            `Posts: ${ct.postCount}`,
            `95% CI: ${ct.confidenceInterval[0].toFixed(2)}% – ${ct.confidenceInterval[1].toFixed(2)}%`,
          ]
        },
      },
    },
  },
  scales: sharedScales,
}))

// Length chart
const lengthChartData = computed(() => ({
  labels: props.contentLengthPerformance.map(l => l.bucket),
  datasets: [
    {
      label: 'Avg Engagement Rate (%)',
      data: props.contentLengthPerformance.map(l => Number(l.avgEngagementRate.toFixed(3))),
      backgroundColor: props.contentLengthPerformance.map(l =>
        l.postCount > 0 ? 'rgba(139, 90, 43, 0.6)' : 'rgba(139, 90, 43, 0.15)'
      ),
      borderColor: 'rgba(139, 90, 43, 0.8)',
      borderWidth: 1,
      borderRadius: 6,
    },
  ],
}))

const lengthChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      ...sharedTooltip,
      callbacks: {
        afterBody: (items: any[]) => {
          const idx = items[0]?.dataIndex
          if (idx == null) return ''
          const len = props.contentLengthPerformance[idx]
          if (!len) return ''
          return [
            `Posts: ${len.postCount}`,
            `95% CI: ${len.confidenceInterval[0].toFixed(2)}% – ${len.confidenceInterval[1].toFixed(2)}%`,
          ]
        },
      },
    },
  },
  scales: sharedScales,
}))
</script>

<template>
  <div class="breakdown-grid">
    <!-- Day Performance Chart -->
    <div class="breakdown-card">
      <div class="card-header">
        <div class="card-icon">
          <MaterialIcon icon="calendar_view_week" size="sm" />
        </div>
        <div>
          <h4 class="card-title">By Day of Week</h4>
          <p class="card-subtitle">Average engagement rate per weekday</p>
        </div>
      </div>
      <div class="chart-container">
        <Bar :data="dayChartData" :options="dayChartOptions" />
      </div>
      <div class="card-table">
        <div
          v-for="day in dayPerformance.filter(d => d.postCount > 0)"
          :key="day.dayOfWeek"
          class="table-row"
        >
          <span class="table-label">{{ day.dayLabel }}</span>
          <span class="table-value">{{ formatRate(day.avgEngagementRate) }}</span>
          <span class="table-meta">{{ day.postCount }} posts</span>
        </div>
      </div>
    </div>

    <!-- Hour Performance Chart -->
    <div class="breakdown-card">
      <div class="card-header">
        <div class="card-icon">
          <MaterialIcon icon="access_time" size="sm" />
        </div>
        <div>
          <h4 class="card-title">By Hour of Day</h4>
          <p class="card-subtitle">Average engagement rate per hour (6 AM – 10 PM)</p>
        </div>
      </div>
      <div class="chart-container">
        <Bar :data="hourChartData" :options="hourChartOptions" />
      </div>
    </div>

    <!-- Platform Performance Chart -->
    <div class="breakdown-card">
      <div class="card-header">
        <div class="card-icon">
          <MaterialIcon icon="hub" size="sm" />
        </div>
        <div>
          <h4 class="card-title">By Platform</h4>
          <p class="card-subtitle">Average engagement rate per social platform</p>
        </div>
      </div>
      <div v-if="contentTypePerformance.length > 0" class="chart-container">
        <Bar :data="platformChartData" :options="platformChartOptions" />
      </div>
      <div v-else class="chart-empty">
        <MaterialIcon icon="hub" size="lg" />
        <p>No multi-platform data available</p>
      </div>
      <div class="card-table">
        <div
          v-for="ct in contentTypePerformance"
          :key="ct.contentType"
          class="table-row"
        >
          <span class="table-label">{{ ct.label }}</span>
          <span class="table-value">{{ formatRate(ct.avgEngagementRate) }}</span>
          <span class="table-meta">{{ ct.postCount }} posts</span>
        </div>
      </div>
    </div>

    <!-- Content Length Performance Chart -->
    <div class="breakdown-card">
      <div class="card-header">
        <div class="card-icon">
          <MaterialIcon icon="text_fields" size="sm" />
        </div>
        <div>
          <h4 class="card-title">By Content Length</h4>
          <p class="card-subtitle">Engagement rate by caption/text character count</p>
        </div>
      </div>
      <div class="chart-container">
        <Bar :data="lengthChartData" :options="lengthChartOptions" />
      </div>
      <div class="card-table">
        <div
          v-for="len in contentLengthPerformance.filter(l => l.postCount > 0)"
          :key="len.bucket"
          class="table-row"
        >
          <span class="table-label">{{ len.bucket }}</span>
          <span class="table-value">{{ formatRate(len.avgEngagementRate) }}</span>
          <span class="table-meta">{{ len.postCount }} posts</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.breakdown-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-lg);
}

.breakdown-card {
  background: var(--bg-secondary);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  padding: var(--space-xl);
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}

.card-icon {
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

.card-title {
  font-family: var(--font-heading);
  font-size: var(--text-base);
  color: var(--text-primary);
  margin: 0;
}

.card-subtitle {
  font-size: var(--text-xs);
  color: var(--text-muted);
  margin: 2px 0 0;
}

.chart-container {
  height: 220px;
  margin-bottom: var(--space-lg);
}

.chart-empty {
  height: 220px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  color: var(--text-muted);
}

.chart-empty p {
  font-size: var(--text-sm);
  margin: 0;
}

/* Table */
.card-table {
  display: flex;
  flex-direction: column;
  gap: 1px;
  border-top: 1px solid var(--glass-border);
  padding-top: var(--space-md);
}

.table-row {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: var(--space-md);
  padding: var(--space-xs) 0;
  align-items: center;
}

.table-label {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.table-value {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  text-align: right;
}

.table-meta {
  font-size: var(--text-xs);
  color: var(--text-muted);
  min-width: 60px;
  text-align: right;
}

/* Responsive */
@media (max-width: 1024px) {
  .breakdown-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .breakdown-card {
    padding: var(--space-lg);
  }

  .chart-container {
    height: 180px;
  }
}
</style>

<script lang="ts">
/**
 * EngagementDashboard — Sample mock data for preview.
 * Import and pass these as props to render a demo.
 *
 * Usage:
 *   import EngagementDashboard, { mockPlatforms, mockDailyTrend } from './EngagementDashboard.vue'
 *   <EngagementDashboard :platforms="mockPlatforms" :daily-trend="mockDailyTrend" />
 */
import type { PlatformEngagement } from '@/types/engagement'

export interface DailyEngagement {
  date: string
  likes: number
  comments: number
  shares: number
  reach: number
}

export const mockPlatforms: PlatformEngagement[] = [
  {
    platform: 'instagram',
    metrics: {
      likes: 12_480,
      comments: 1_340,
      shares: 890,
      reach: 48_200,
      impressions: 62_100,
      engagement_rate: 4.2,
      last_synced_at: new Date().toISOString(),
      sync_status: 'success',
    },
  },
  {
    platform: 'facebook',
    metrics: {
      likes: 8_650,
      comments: 920,
      shares: 1_420,
      reach: 35_800,
      impressions: 45_600,
      engagement_rate: 3.1,
      last_synced_at: new Date().toISOString(),
      sync_status: 'success',
    },
  },
  {
    platform: 'twitter',
    metrics: {
      likes: 5_200,
      comments: 480,
      shares: 2_100,
      reach: 22_400,
      impressions: 31_200,
      engagement_rate: 3.8,
      last_synced_at: new Date().toISOString(),
      sync_status: 'success',
    },
  },
]

export const mockDailyTrend: DailyEngagement[] = [
  { date: '2026-02-05', likes: 3200, comments: 310, shares: 420, reach: 12400 },
  { date: '2026-02-06', likes: 2800, comments: 280, shares: 380, reach: 11200 },
  { date: '2026-02-07', likes: 4100, comments: 450, shares: 510, reach: 15600 },
  { date: '2026-02-08', likes: 3600, comments: 390, shares: 440, reach: 13800 },
  { date: '2026-02-09', likes: 5200, comments: 520, shares: 680, reach: 18900 },
  { date: '2026-02-10', likes: 4800, comments: 480, shares: 620, reach: 17500 },
  { date: '2026-02-11', likes: 3900, comments: 410, shares: 490, reach: 14200 },
]
</script>

<script setup lang="ts">
import { computed } from 'vue'
import MaterialIcon from '@/components/MaterialIcon.vue'
import PlatformLogo from '@/components/PlatformLogo.vue'

// ─── Types ──────────────────────────────────────────────────
export interface EngagementDashboardProps {
  /** Per-platform engagement data */
  platforms: PlatformEngagement[]
  /** Daily engagement trend data for the last 7 days */
  dailyTrend?: DailyEngagement[]
  /** Optional title override */
  title?: string
  /** Whether data is currently loading */
  loading?: boolean
}

// ─── Props & Emits ──────────────────────────────────────────
const props = withDefaults(defineProps<EngagementDashboardProps>(), {
  title: 'Engagement Overview',
  loading: false,
  dailyTrend: () => [],
})

const emit = defineEmits<{
  /** Emitted when a metric card is clicked */
  (e: 'metric-click', metric: string, value: number): void
  /** Emitted when a platform card is clicked */
  (e: 'platform-click', platform: string): void
  /** Emitted when a trend bar is clicked */
  (e: 'trend-click', day: DailyEngagement): void
  /** Emitted when refresh is requested */
  (e: 'refresh'): void
}>()

// ─── Platform Colors ────────────────────────────────────────
const platformColors: Record<string, string> = {
  facebook: '#1877F2',
  instagram: '#E4405F',
  tiktok: '#000000',
  twitter: '#000000', // X/Twitter brand black
  linkedin: '#0A66C2',
}

// ─── Computed: Aggregated Metrics ───────────────────────────
const totalMetrics = computed(() => {
  const totals = { likes: 0, comments: 0, shares: 0, reach: 0 }
  for (const p of props.platforms) {
    totals.likes += p.metrics.likes
    totals.comments += p.metrics.comments
    totals.shares += p.metrics.shares
    totals.reach += p.metrics.reach
  }
  return totals
})

// ─── Computed: Metric Cards Config ──────────────────────────
const metricCards = computed(() => [
  {
    key: 'likes',
    icon: 'thumb_up',
    label: 'Likes',
    value: totalMetrics.value.likes,
  },
  {
    key: 'comments',
    icon: 'comment',
    label: 'Comments',
    value: totalMetrics.value.comments,
  },
  {
    key: 'shares',
    icon: 'share',
    label: 'Shares',
    value: totalMetrics.value.shares,
  },
  {
    key: 'reach',
    icon: 'visibility',
    label: 'Reach',
    value: totalMetrics.value.reach,
  },
])

// ─── Computed: Trend Chart Data ─────────────────────────────
const trendChartData = computed(() => {
  if (!props.dailyTrend.length) return []
  const maxEngagement = Math.max(
    ...props.dailyTrend.map((d) => d.likes + d.comments + d.shares),
    1,
  )
  return props.dailyTrend.map((day) => {
    const total = day.likes + day.comments + day.shares
    return {
      ...day,
      total,
      heightPercent: Math.max((total / maxEngagement) * 100, 4), // min 4% for visibility
      dayLabel: formatDayLabel(day.date),
    }
  })
})

// ─── Helpers ────────────────────────────────────────────────
function formatDayLabel(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return dateStr
    return date.toLocaleDateString('en-US', { weekday: 'short' })
  } catch {
    return dateStr
  }
}

function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`
  return num.toLocaleString()
}

function getPlatformColor(platform: string): string {
  return platformColors[platform] ?? '#0f3d2e'
}

function handleMetricClick(key: string, value: number): void {
  emit('metric-click', key, value)
}

function handlePlatformClick(platform: string): void {
  emit('platform-click', platform)
}

function handleTrendClick(day: DailyEngagement): void {
  emit('trend-click', day)
}

function handleRefresh(): void {
  emit('refresh')
}
</script>

<template>
  <div class="engagement-dashboard">
    <!-- Header -->
    <div class="dashboard-header">
      <div class="header-left">
        <div class="header-icon">
          <MaterialIcon icon="monitoring" size="sm" />
        </div>
        <div>
          <h3 class="dashboard-title">{{ title }}</h3>
          <span class="dashboard-subtitle">Unified metrics across platforms</span>
        </div>
      </div>
      <button
        class="refresh-btn"
        :disabled="loading"
        :aria-label="loading ? 'Loading engagement data' : 'Refresh engagement data'"
        @click="handleRefresh"
      >
        <MaterialIcon :icon="loading ? 'sync' : 'refresh'" size="sm" :class="{ spinning: loading }" />
      </button>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="loading" class="loading-state" role="status" aria-label="Loading engagement data">
      <div class="skeleton-grid">
        <div v-for="i in 4" :key="i" class="skeleton-card">
          <div class="skeleton-line skeleton-icon" />
          <div class="skeleton-line skeleton-value" />
          <div class="skeleton-line skeleton-label" />
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!platforms.length" class="empty-state" role="status">
      <MaterialIcon icon="bar_chart_off" size="xl" />
      <p class="empty-text">No engagement data available</p>
      <p class="empty-hint">Connect your platforms and publish content to see metrics here.</p>
    </div>

    <!-- Dashboard Content -->
    <template v-else>
      <!-- Metric Cards -->
      <div class="metrics-grid" role="list" aria-label="Engagement metrics">
        <button
          v-for="card in metricCards"
          :key="card.key"
          class="metric-card"
          role="listitem"
          :aria-label="`${card.label}: ${formatNumber(card.value)}`"
          @click="handleMetricClick(card.key, card.value)"
        >
          <div class="metric-icon-wrap">
            <MaterialIcon :icon="card.icon" size="sm" />
          </div>
          <span class="metric-value">{{ formatNumber(card.value) }}</span>
          <span class="metric-label">{{ card.label }}</span>
        </button>
      </div>

      <!-- Platform Breakdown -->
      <div class="section-header">
        <MaterialIcon icon="device_hub" size="sm" class="section-icon" />
        <span class="section-title">Platform Breakdown</span>
      </div>
      <div class="platforms-list" role="list" aria-label="Engagement by platform">
        <button
          v-for="p in platforms"
          :key="p.platform"
          class="platform-row"
          role="listitem"
          :aria-label="`${p.platform}: ${formatNumber(p.metrics.likes)} likes, ${formatNumber(p.metrics.comments)} comments, ${formatNumber(p.metrics.shares)} shares, ${formatNumber(p.metrics.reach)} reach`"
          @click="handlePlatformClick(p.platform)"
        >
          <div class="platform-info">
            <div class="platform-indicator" :style="{ backgroundColor: getPlatformColor(p.platform) }" />
            <PlatformLogo :platform="p.platform" :size="28" />
            <span class="platform-name">{{ p.platform.charAt(0).toUpperCase() + p.platform.slice(1) }}</span>
          </div>
          <div class="platform-metrics">
            <span class="platform-stat" :title="`${p.metrics.likes.toLocaleString()} likes`">
              <MaterialIcon icon="thumb_up" size="xs" />
              {{ formatNumber(p.metrics.likes) }}
            </span>
            <span class="platform-stat" :title="`${p.metrics.comments.toLocaleString()} comments`">
              <MaterialIcon icon="comment" size="xs" />
              {{ formatNumber(p.metrics.comments) }}
            </span>
            <span class="platform-stat" :title="`${p.metrics.shares.toLocaleString()} shares`">
              <MaterialIcon icon="share" size="xs" />
              {{ formatNumber(p.metrics.shares) }}
            </span>
            <span class="platform-stat" :title="`${p.metrics.reach.toLocaleString()} reach`">
              <MaterialIcon icon="visibility" size="xs" />
              {{ formatNumber(p.metrics.reach) }}
            </span>
          </div>
        </button>
      </div>

      <!-- Trend Chart (last 7 days) -->
      <template v-if="trendChartData.length">
        <div class="section-header">
          <MaterialIcon icon="trending_up" size="sm" class="section-icon" />
          <span class="section-title">7-Day Engagement Trend</span>
        </div>
        <div class="trend-chart" role="img" aria-label="Engagement trend over the last 7 days">
          <div class="trend-bars">
            <button
              v-for="(day, index) in trendChartData"
              :key="index"
              class="trend-bar-col"
              :aria-label="`${day.dayLabel}: ${day.total.toLocaleString()} total engagements`"
              @click="handleTrendClick(day)"
            >
              <div class="trend-bar-wrap">
                <div
                  class="trend-bar"
                  :style="{ height: `${day.heightPercent}%` }"
                >
                  <span class="trend-bar-value">{{ formatNumber(day.total) }}</span>
                </div>
              </div>
              <span class="trend-day-label">{{ day.dayLabel }}</span>
            </button>
          </div>
        </div>
      </template>
    </template>
  </div>
</template>

<style scoped>
/* ─── Container ─────────────────────────────────────────── */
.engagement-dashboard {
  background: var(--bg-secondary);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  padding: var(--space-xl);
  overflow: hidden;
  position: relative;
}

.engagement-dashboard::after {
  content: '';
  position: absolute;
  top: var(--space-xl);
  bottom: var(--space-xl);
  left: 0;
  width: 3px;
  background: var(--gradient-gold);
  border-radius: 0 2px 2px 0;
}

/* ─── Header ────────────────────────────────────────────── */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-xl);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.header-icon {
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

.dashboard-title {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  color: var(--text-primary);
  margin: 0;
}

.dashboard-subtitle {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.refresh-btn {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  border: 1px solid var(--glass-border);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition-base);
}

.refresh-btn:hover:not(:disabled) {
  color: var(--gold-primary);
  border-color: var(--gold-primary);
  background: linear-gradient(135deg, rgba(15, 61, 46, 0.08), rgba(15, 61, 46, 0.02));
}

.refresh-btn:focus-visible {
  outline: 2px solid var(--gold-primary);
  outline-offset: 2px;
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ─── Loading Skeleton ──────────────────────────────────── */
.loading-state {
  padding: var(--space-lg) 0;
}

.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-md);
}

.skeleton-card {
  background: var(--glass-bg);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.skeleton-line {
  border-radius: var(--radius-sm);
  background: linear-gradient(90deg, var(--glass-border) 25%, transparent 50%, var(--glass-border) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite ease-in-out;
}

.skeleton-icon { width: 32px; height: 32px; border-radius: var(--radius-md); }
.skeleton-value { width: 60%; height: 28px; }
.skeleton-label { width: 40%; height: 14px; }

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ─── Empty State ───────────────────────────────────────── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-3xl) var(--space-lg);
  color: var(--text-muted);
  text-align: center;
}

.empty-text {
  margin: var(--space-md) 0 var(--space-xs);
  font-size: var(--text-base);
  color: var(--text-secondary);
}

.empty-hint {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--text-muted);
}

/* ─── Metrics Grid ──────────────────────────────────────── */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-md);
  margin-bottom: var(--space-xl);
}

.metric-card {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  cursor: pointer;
  transition: var(--transition-base);
  text-align: left;
  color: inherit;
  font-family: inherit;
}

.metric-card:hover {
  transform: translateY(-2px);
  border-color: var(--gold-primary);
  box-shadow: 0 8px 24px rgba(15, 61, 46, 0.08);
}

.metric-card:focus-visible {
  outline: 2px solid var(--gold-primary);
  outline-offset: 2px;
}

.metric-icon-wrap {
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

.metric-value {
  font-family: var(--font-heading);
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  line-height: 1;
  letter-spacing: -0.02em;
}

.metric-label {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: var(--font-medium);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* ─── Section Headers ───────────────────────────────────── */
.section-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}

.section-icon {
  color: var(--gold-primary);
}

.section-title {
  font-family: var(--font-heading);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

/* ─── Platform Breakdown ────────────────────────────────── */
.platforms-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  margin-bottom: var(--space-xl);
}

.platform-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-md) var(--space-lg);
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: var(--transition-base);
  width: 100%;
  font-family: inherit;
  color: inherit;
}

.platform-row:hover {
  border-color: var(--gold-primary);
  box-shadow: 0 4px 16px rgba(15, 61, 46, 0.06);
}

.platform-row:focus-visible {
  outline: 2px solid var(--gold-primary);
  outline-offset: 2px;
}

.platform-info {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.platform-indicator {
  width: 4px;
  height: 24px;
  border-radius: 2px;
  flex-shrink: 0;
}

.platform-name {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.platform-metrics {
  display: flex;
  gap: var(--space-lg);
  align-items: center;
}

.platform-stat {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--text-sm);
  color: var(--text-secondary);
  white-space: nowrap;
}

/* ─── Trend Chart ───────────────────────────────────────── */
.trend-chart {
  padding: var(--space-md) 0;
}

.trend-bars {
  display: flex;
  gap: var(--space-sm);
  align-items: flex-end;
  height: 180px;
}

.trend-bar-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
  height: 100%;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  font-family: inherit;
  color: inherit;
  transition: var(--transition-base);
}

.trend-bar-col:focus-visible {
  outline: 2px solid var(--gold-primary);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}

.trend-bar-wrap {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.trend-bar {
  width: 100%;
  max-width: 48px;
  background: linear-gradient(180deg, var(--gold-primary) 0%, rgba(15, 61, 46, 0.3) 100%);
  border-radius: var(--radius-sm) var(--radius-sm) 0 0;
  position: relative;
  transition: height 0.4s ease, opacity 0.2s ease;
  min-height: 8px;
}

.trend-bar-col:hover .trend-bar {
  opacity: 0.85;
  box-shadow: 0 -4px 12px rgba(15, 61, 46, 0.15);
}

.trend-bar-value {
  position: absolute;
  top: -22px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 10px;
  font-weight: var(--font-bold);
  color: var(--text-muted);
  white-space: nowrap;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.trend-bar-col:hover .trend-bar-value {
  opacity: 1;
}

.trend-day-label {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: var(--font-medium);
}

/* ─── Responsive ────────────────────────────────────────── */
@media (max-width: 1024px) {
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .platform-metrics {
    gap: var(--space-md);
  }
}

@media (max-width: 768px) {
  .engagement-dashboard {
    padding: var(--space-lg);
  }

  .skeleton-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .platform-row {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-sm);
    padding: var(--space-md);
  }

  .platform-metrics {
    flex-wrap: wrap;
    gap: var(--space-sm);
    padding-left: calc(4px + var(--space-sm) + 28px + var(--space-sm));
  }

  .trend-bars {
    height: 140px;
  }
}

@media (max-width: 480px) {
  .metrics-grid {
    grid-template-columns: 1fr;
    gap: var(--space-sm);
  }

  .skeleton-grid {
    grid-template-columns: 1fr;
  }

  .metric-value {
    font-size: var(--text-2xl);
  }

  .platform-metrics {
    padding-left: 0;
  }

  .trend-bars {
    height: 120px;
    gap: 4px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .metric-card:hover {
    transform: none;
  }
  .spinning {
    animation: none;
  }
  .skeleton-line {
    animation: none;
  }
  .trend-bar {
    transition: none;
  }
}
</style>

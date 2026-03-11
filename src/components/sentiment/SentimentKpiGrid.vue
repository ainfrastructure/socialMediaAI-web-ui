<script setup lang="ts">
import MaterialIcon from '@/components/MaterialIcon.vue'
import type { SentimentSummary } from '@/types/sentiment'

defineProps<{
  summary: SentimentSummary | null
}>()

function getTrendIcon(direction: string): string {
  switch (direction) {
    case 'up': return 'trending_up'
    case 'down': return 'trending_down'
    default: return 'trending_flat'
  }
}

function getScoreLabel(score: number): string {
  if (score > 0.3) return 'Very Positive'
  if (score > 0.1) return 'Positive'
  if (score > -0.1) return 'Mixed'
  if (score > -0.3) return 'Negative'
  return 'Very Negative'
}

function getScoreColor(score: number): string {
  if (score > 0.1) return '#22c55e'
  if (score > -0.1) return '#a78bfa'
  return '#ef4444'
}
</script>

<template>
  <div class="kpi-grid" v-if="summary">
    <!-- Total Mentions -->
    <div class="kpi-card reveal-card">
      <div class="kpi-icon-wrap mentions-icon">
        <MaterialIcon icon="forum" size="sm" />
      </div>
      <div class="kpi-content">
        <span class="kpi-value">{{ summary.totalMentions.toLocaleString() }}</span>
        <span class="kpi-label">Total Mentions</span>
      </div>
      <div class="kpi-badge">
        <span class="kpi-today">{{ summary.mentionsToday }} today</span>
      </div>
    </div>

    <!-- Sentiment Score -->
    <div class="kpi-card reveal-card">
      <div class="kpi-icon-wrap score-icon" :style="{ color: getScoreColor(summary.averageScore) }">
        <MaterialIcon :icon="summary.averageScore > 0.1 ? 'sentiment_satisfied' : summary.averageScore > -0.1 ? 'sentiment_neutral' : 'sentiment_dissatisfied'" size="sm" />
      </div>
      <div class="kpi-content">
        <span class="kpi-value" :style="{ color: getScoreColor(summary.averageScore) }">
          {{ getScoreLabel(summary.averageScore) }}
        </span>
        <span class="kpi-label">Overall Sentiment</span>
      </div>
      <div class="kpi-badge">
        <span class="kpi-score">{{ (summary.averageScore * 100).toFixed(0) }}%</span>
      </div>
    </div>

    <!-- Positive % -->
    <div class="kpi-card reveal-card">
      <div class="kpi-icon-wrap positive-icon">
        <MaterialIcon icon="thumb_up" size="sm" />
      </div>
      <div class="kpi-content">
        <span class="kpi-value positive-text">{{ summary.positivePercent }}%</span>
        <span class="kpi-label">Positive</span>
      </div>
      <div class="kpi-bar">
        <div class="kpi-bar-fill positive-bar" :style="{ width: `${summary.positivePercent}%` }" />
      </div>
    </div>

    <!-- Negative % -->
    <div class="kpi-card reveal-card">
      <div class="kpi-icon-wrap negative-icon">
        <MaterialIcon icon="thumb_down" size="sm" />
      </div>
      <div class="kpi-content">
        <span class="kpi-value negative-text">{{ summary.negativePercent }}%</span>
        <span class="kpi-label">Negative</span>
      </div>
      <div class="kpi-bar">
        <div class="kpi-bar-fill negative-bar" :style="{ width: `${summary.negativePercent}%` }" />
      </div>
    </div>

    <!-- Trend -->
    <div class="kpi-card reveal-card">
      <div class="kpi-icon-wrap trend-icon" :class="[`trend-${summary.trendDirection}`]">
        <MaterialIcon :icon="getTrendIcon(summary.trendDirection)" size="sm" />
      </div>
      <div class="kpi-content">
        <span class="kpi-value" :class="[`trend-${summary.trendDirection}-text`]">
          {{ summary.trendDirection === 'up' ? '+' : summary.trendDirection === 'down' ? '-' : '' }}{{ summary.trendPercent }}%
        </span>
        <span class="kpi-label">Trend (vs previous)</span>
      </div>
    </div>
  </div>

  <!-- Skeleton -->
  <div class="kpi-grid" v-else>
    <div class="kpi-card skeleton-card" v-for="i in 5" :key="i">
      <div class="skeleton-circle" />
      <div class="skeleton-lines">
        <div class="skeleton-line wide" />
        <div class="skeleton-line narrow" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: var(--space-lg);
  margin-bottom: var(--space-xl);
}

.kpi-card {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--blur-md));
  -webkit-backdrop-filter: blur(var(--blur-md));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  position: relative;
  overflow: hidden;
  transition: var(--transition-base);
}

.kpi-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--glass-highlight);
}

.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
  border-color: var(--border-hover);
}

.kpi-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.mentions-icon {
  background: rgba(59, 130, 246, 0.12);
  color: #3b82f6;
}

.score-icon {
  background: rgba(167, 139, 250, 0.12);
}

.positive-icon {
  background: rgba(34, 197, 94, 0.12);
  color: #22c55e;
}

.negative-icon {
  background: rgba(239, 68, 68, 0.12);
  color: #ef4444;
}

.trend-icon {
  background: rgba(59, 130, 246, 0.12);
  color: #3b82f6;
}

.trend-icon.trend-up {
  background: rgba(34, 197, 94, 0.12);
  color: #22c55e;
}

.trend-icon.trend-down {
  background: rgba(239, 68, 68, 0.12);
  color: #ef4444;
}

.kpi-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.kpi-value {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  line-height: var(--leading-tight);
}

.positive-text { color: #22c55e; }
.negative-text { color: #ef4444; }
.trend-up-text { color: #22c55e; }
.trend-down-text { color: #ef4444; }
.trend-stable-text { color: var(--text-muted); }

.kpi-label {
  font-size: var(--text-xs);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.kpi-badge {
  margin-top: auto;
}

.kpi-today,
.kpi-score {
  font-size: var(--text-xs);
  color: var(--text-secondary);
  background: var(--bg-tertiary);
  padding: 2px var(--space-sm);
  border-radius: var(--radius-sm);
}

/* Mini progress bar */
.kpi-bar {
  height: 4px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-full);
  overflow: hidden;
  margin-top: var(--space-xs);
}

.kpi-bar-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 0.6s var(--ease-smooth);
}

.positive-bar { background: #22c55e; }
.negative-bar { background: #ef4444; }

/* Skeleton */
.skeleton-card {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: var(--space-md);
  min-height: 80px;
}

.skeleton-circle {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  background: var(--bg-tertiary);
  animation: shimmer 1.5s infinite;
}

.skeleton-lines {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.skeleton-line {
  height: 12px;
  border-radius: var(--radius-sm);
  background: var(--bg-tertiary);
  animation: shimmer 1.5s infinite;
}

.skeleton-line.wide { width: 70%; }
.skeleton-line.narrow { width: 40%; }

@keyframes shimmer {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
}

/* Responsive */
@media (max-width: 1200px) {
  .kpi-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .kpi-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .kpi-grid {
    grid-template-columns: 1fr;
  }

  .kpi-card {
    flex-direction: row;
    align-items: center;
    gap: var(--space-md);
    padding: var(--space-md);
  }

  .kpi-content {
    flex: 1;
  }

  .kpi-bar {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    border-radius: 0;
    height: 3px;
  }
}
</style>

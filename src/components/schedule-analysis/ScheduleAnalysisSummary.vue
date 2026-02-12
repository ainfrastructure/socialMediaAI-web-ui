<script setup lang="ts">
import MaterialIcon from '@/components/MaterialIcon.vue'
import type { AnalysisSummary } from '@/types/scheduleAnalysis'

interface Props {
  summary: AnalysisSummary
}

defineProps<Props>()

function formatRate(rate: number): string {
  return rate > 0 ? `${rate.toFixed(2)}%` : '—'
}

function qualityColor(score: number): string {
  if (score >= 70) return 'var(--success-text)'
  if (score >= 40) return 'var(--warning-text)'
  return 'var(--error-text)'
}

function qualityLabel(score: number): string {
  if (score >= 70) return 'Good'
  if (score >= 40) return 'Fair'
  return 'Low'
}
</script>

<template>
  <div class="summary-grid">
    <!-- Total Posts Analyzed -->
    <div class="summary-card reveal-card">
      <div class="summary-top">
        <div class="summary-icon-wrap">
          <MaterialIcon icon="article" size="sm" />
        </div>
      </div>
      <div class="summary-body">
        <span class="summary-value">{{ summary.totalPostsAnalyzed }}</span>
        <span class="summary-label">Posts Analyzed</span>
      </div>
    </div>

    <!-- Average Engagement Rate -->
    <div class="summary-card reveal-card">
      <div class="summary-top">
        <div class="summary-icon-wrap">
          <MaterialIcon icon="trending_up" size="sm" />
        </div>
      </div>
      <div class="summary-body">
        <span class="summary-value">{{ formatRate(summary.avgEngagementRate) }}</span>
        <span class="summary-label">Avg Engagement Rate</span>
      </div>
    </div>

    <!-- Best Day -->
    <div class="summary-card reveal-card">
      <div class="summary-top">
        <div class="summary-icon-wrap">
          <MaterialIcon icon="today" size="sm" />
        </div>
      </div>
      <div class="summary-body">
        <span class="summary-value">{{ summary.bestDay?.dayLabel || '—' }}</span>
        <span class="summary-label">
          Best Day
          <template v-if="summary.bestDay">
            · {{ formatRate(summary.bestDay.avgEngagementRate) }}
          </template>
        </span>
      </div>
    </div>

    <!-- Best Hour -->
    <div class="summary-card reveal-card">
      <div class="summary-top">
        <div class="summary-icon-wrap">
          <MaterialIcon icon="schedule" size="sm" />
        </div>
      </div>
      <div class="summary-body">
        <span class="summary-value">{{ summary.bestHour?.hourLabel || '—' }}</span>
        <span class="summary-label">
          Best Time
          <template v-if="summary.bestHour">
            · {{ formatRate(summary.bestHour.avgEngagementRate) }}
          </template>
        </span>
      </div>
    </div>

    <!-- Best Platform -->
    <div class="summary-card reveal-card">
      <div class="summary-top">
        <div class="summary-icon-wrap">
          <MaterialIcon icon="share" size="sm" />
        </div>
      </div>
      <div class="summary-body">
        <span class="summary-value">{{ summary.bestContentType?.label || '—' }}</span>
        <span class="summary-label">
          Top Platform
          <template v-if="summary.bestContentType">
            · {{ formatRate(summary.bestContentType.avgEngagementRate) }}
          </template>
        </span>
      </div>
    </div>

    <!-- Data Quality -->
    <div class="summary-card reveal-card">
      <div class="summary-top">
        <div class="summary-icon-wrap">
          <MaterialIcon icon="verified" size="sm" />
        </div>
      </div>
      <div class="summary-body">
        <span class="summary-value" :style="{ color: qualityColor(summary.dataQualityScore) }">
          {{ summary.dataQualityScore }}/100
        </span>
        <span class="summary-label">
          Data Quality · {{ qualityLabel(summary.dataQualityScore) }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-lg);
  margin-bottom: var(--space-xl);
}

.summary-card {
  position: relative;
  background: var(--bg-secondary);
  border: 1px solid var(--glass-border);
  border-bottom: 2px solid rgba(176, 138, 90, 0.25);
  border-radius: var(--radius-xl);
  padding: var(--space-xl) var(--space-lg) var(--space-lg);
  overflow: hidden;
  transition: var(--transition-base);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.summary-card:hover {
  transform: translateY(-4px);
  border-bottom-color: var(--gold-primary);
  box-shadow: 0 12px 40px rgba(15, 61, 46, 0.1), 0 4px 12px rgba(15, 61, 46, 0.06);
}

.summary-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.summary-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, rgba(15, 61, 46, 0.1), rgba(15, 61, 46, 0.04));
  color: var(--gold-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.summary-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.summary-value {
  font-family: var(--font-heading);
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  line-height: 1;
  letter-spacing: -0.02em;
}

.summary-label {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: var(--font-medium);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* Reveal animation */
@keyframes summary-reveal {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

.reveal-card {
  animation: summary-reveal 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.reveal-card:nth-child(1) { animation-delay: 0ms; }
.reveal-card:nth-child(2) { animation-delay: 60ms; }
.reveal-card:nth-child(3) { animation-delay: 120ms; }
.reveal-card:nth-child(4) { animation-delay: 180ms; }
.reveal-card:nth-child(5) { animation-delay: 240ms; }
.reveal-card:nth-child(6) { animation-delay: 300ms; }

@media (max-width: 768px) {
  .summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .summary-card {
    padding: var(--space-lg) var(--space-md) var(--space-md);
  }

  .summary-value {
    font-size: var(--text-2xl);
  }
}

@media (max-width: 480px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .summary-card:hover {
    transform: none;
  }

  .reveal-card {
    animation: none !important;
  }
}
</style>

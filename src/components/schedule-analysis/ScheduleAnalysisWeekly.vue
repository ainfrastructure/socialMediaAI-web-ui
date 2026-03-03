<script setup lang="ts">
import MaterialIcon from '@/components/MaterialIcon.vue'
import type { WeeklySchedule, ScheduleSlot } from '@/types/scheduleAnalysis'

interface Props {
  schedule: WeeklySchedule
}

defineProps<Props>()

function confidenceBadgeClass(level: ScheduleSlot['confidenceLevel']): string {
  return `confidence-badge confidence-${level}`
}

function formatCI(ci: [number, number]): string {
  return `${ci[0].toFixed(2)}% – ${ci[1].toFixed(2)}%`
}

function formatRate(rate: number): string {
  return rate > 0 ? `${rate.toFixed(2)}%` : '—'
}

function confidenceIcon(level: ScheduleSlot['confidenceLevel']): string {
  if (level === 'high') return 'verified'
  if (level === 'medium') return 'info'
  return 'warning'
}

function platformLabel(platform: string | null): string {
  if (!platform) return 'Any'
  return platform.charAt(0).toUpperCase() + platform.slice(1)
}

function lengthLabel(length: { min: number; max: number } | null): string {
  if (!length) return 'Any length'
  if (length.max >= 1000) return `${length.min}+ chars`
  return `${length.min}–${length.max} chars`
}
</script>

<template>
  <div class="weekly-schedule">
    <div
      v-for="slot in schedule.slots"
      :key="slot.dayOfWeek"
      class="schedule-slot"
    >
      <!-- Day column -->
      <div class="slot-day">
        <span class="day-name">{{ slot.dayLabel }}</span>
        <span class="day-posts">{{ slot.basedOnPosts }} posts</span>
      </div>

      <!-- Time column -->
      <div class="slot-time">
        <div class="time-badge">
          <MaterialIcon icon="schedule" size="xs" />
          <span>{{ slot.timeLabel }}</span>
        </div>
      </div>

      <!-- Expected engagement -->
      <div class="slot-engagement">
        <div class="engagement-value">{{ formatRate(slot.expectedEngagementRate) }}</div>
        <div class="engagement-ci">
          <span class="ci-label">95% CI:</span>
          <span class="ci-range">{{ formatCI(slot.confidenceInterval) }}</span>
        </div>
      </div>

      <!-- Confidence level -->
      <div class="slot-confidence">
        <div :class="confidenceBadgeClass(slot.confidenceLevel)">
          <MaterialIcon :icon="confidenceIcon(slot.confidenceLevel)" size="xs" />
          <span>{{ slot.confidenceLevel }}</span>
        </div>
      </div>

      <!-- Recommendations -->
      <div class="slot-recommendations">
        <div v-if="slot.recommendedContentType" class="rec-chip">
          <MaterialIcon icon="share" size="xs" />
          {{ platformLabel(slot.recommendedContentType) }}
        </div>
        <div v-if="slot.recommendedLength" class="rec-chip">
          <MaterialIcon icon="text_fields" size="xs" />
          {{ lengthLabel(slot.recommendedLength) }}
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="schedule.slots.length === 0" class="empty-schedule">
      <MaterialIcon icon="event_busy" size="lg" />
      <p>Not enough data to generate schedule recommendations.</p>
    </div>
  </div>
</template>

<style scoped>
.weekly-schedule {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.schedule-slot {
  display: grid;
  grid-template-columns: 140px 120px 1fr 120px 1fr;
  gap: var(--space-lg);
  align-items: center;
  padding: var(--space-lg) var(--space-xl);
  background: var(--bg-secondary);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  transition: var(--transition-fast);
}

.schedule-slot:hover {
  border-color: var(--border-hover);
  box-shadow: var(--shadow-sm);
}

/* Day column */
.slot-day {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.day-name {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  color: var(--text-primary);
}

.day-posts {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

/* Time badge */
.slot-time {
  display: flex;
  align-items: center;
}

.time-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-md);
  background: var(--gradient-gold);
  color: var(--text-on-gold);
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
}

/* Engagement column */
.slot-engagement {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.engagement-value {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
}

.engagement-ci {
  font-size: var(--text-xs);
  color: var(--text-muted);
  display: flex;
  gap: var(--space-xs);
}

.ci-label {
  font-weight: var(--font-medium);
}

/* Confidence badge */
.slot-confidence {
  display: flex;
  align-items: center;
}

.confidence-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  text-transform: capitalize;
}

.confidence-high {
  background: var(--success-bg);
  color: var(--success-text);
}

.confidence-medium {
  background: var(--warning-bg);
  color: var(--warning-text);
}

.confidence-low {
  background: var(--error-bg);
  color: var(--error-text);
}

/* Recommendations */
.slot-recommendations {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}

.rec-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px var(--space-sm);
  background: var(--bg-tertiary);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  color: var(--text-secondary);
}

/* Empty state */
.empty-schedule {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-3xl);
  text-align: center;
  color: var(--text-muted);
}

/* Responsive */
@media (max-width: 1024px) {
  .schedule-slot {
    grid-template-columns: 100px 100px 1fr;
    grid-template-rows: auto auto;
    gap: var(--space-sm) var(--space-md);
    padding: var(--space-md) var(--space-lg);
  }

  .slot-confidence {
    grid-column: 1;
    grid-row: 2;
  }

  .slot-recommendations {
    grid-column: 2 / -1;
    grid-row: 2;
  }
}

@media (max-width: 768px) {
  .schedule-slot {
    grid-template-columns: 1fr 1fr;
    gap: var(--space-sm);
    padding: var(--space-md);
  }

  .slot-engagement {
    grid-column: 1 / -1;
  }

  .slot-confidence {
    grid-column: 1;
  }

  .slot-recommendations {
    grid-column: 1 / -1;
  }
}
</style>

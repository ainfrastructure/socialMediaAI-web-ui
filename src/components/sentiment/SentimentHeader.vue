<script setup lang="ts">
import MaterialIcon from '@/components/MaterialIcon.vue'
import type { SentimentTimeRange } from '@/types/sentiment'

defineProps<{
  timeRange: SentimentTimeRange
  isLive: boolean
  lastUpdated: string | null
}>()

const emit = defineEmits<{
  (e: 'update:timeRange', value: SentimentTimeRange): void
  (e: 'toggleLive'): void
  (e: 'refresh'): void
}>()

const timeRangeOptions: { value: SentimentTimeRange; label: string }[] = [
  { value: '1h', label: '1H' },
  { value: '6h', label: '6H' },
  { value: '24h', label: '24H' },
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
]

function formatLastUpdated(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}
</script>

<template>
  <div class="sentiment-header">
    <div class="header-title-section">
      <div class="header-icon">
        <MaterialIcon icon="monitoring" size="md" />
      </div>
      <div>
        <h1 class="page-title">Sentiment Monitor</h1>
        <p class="page-subtitle">Real-time brand sentiment across X and Reddit</p>
      </div>
    </div>

    <div class="header-controls">
      <!-- Live indicator -->
      <button
        class="live-toggle"
        :class="{ active: isLive }"
        @click="emit('toggleLive')"
        :aria-label="isLive ? 'Pause live updates' : 'Resume live updates'"
      >
        <span class="live-dot" :class="{ pulsing: isLive }" />
        <span class="live-label">{{ isLive ? 'LIVE' : 'PAUSED' }}</span>
      </button>

      <!-- Time range selector -->
      <div class="time-range-selector" role="radiogroup" aria-label="Time range">
        <button
          v-for="opt in timeRangeOptions"
          :key="opt.value"
          class="time-range-btn"
          :class="{ active: timeRange === opt.value }"
          @click="emit('update:timeRange', opt.value)"
          role="radio"
          :aria-checked="timeRange === opt.value"
        >
          {{ opt.label }}
        </button>
      </div>

      <!-- Refresh button -->
      <button
        class="refresh-btn"
        @click="emit('refresh')"
        aria-label="Refresh data"
      >
        <MaterialIcon icon="refresh" size="sm" />
      </button>

      <!-- Last updated -->
      <span v-if="lastUpdated" class="last-updated">
        Updated {{ formatLastUpdated(lastUpdated) }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.sentiment-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-lg);
  margin-bottom: var(--space-xl);
  flex-wrap: wrap;
}

.header-title-section {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.header-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-lg);
  background: var(--gradient-gold);
  color: var(--text-on-gold);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.page-title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  margin: 0;
  line-height: var(--leading-tight);
}

.page-subtitle {
  font-size: var(--text-sm);
  color: var(--text-muted);
  margin: 2px 0 0;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

/* Live toggle */
.live-toggle {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: var(--transition-base);
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
  letter-spacing: 0.05em;
  color: var(--text-muted);
}

.live-toggle.active {
  border-color: rgba(34, 197, 94, 0.4);
  background: rgba(34, 197, 94, 0.08);
  color: #22c55e;
}

.live-toggle:hover {
  border-color: var(--border-hover);
}

.live-dot {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
  background: var(--text-muted);
  transition: var(--transition-base);
}

.live-toggle.active .live-dot {
  background: #22c55e;
}

.live-dot.pulsing {
  animation: livePulse 2s ease-in-out infinite;
}

@keyframes livePulse {
  0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
  50% { opacity: 0.7; box-shadow: 0 0 0 4px rgba(34, 197, 94, 0); }
}

/* Time range selector */
.time-range-selector {
  display: flex;
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  padding: 2px;
  gap: 2px;
}

.time-range-btn {
  padding: var(--space-xs) var(--space-md);
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-muted);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  cursor: pointer;
  transition: var(--transition-fast);
  min-width: 36px;
}

.time-range-btn:hover {
  color: var(--text-primary);
  background: var(--bg-secondary);
}

.time-range-btn.active {
  background: var(--gold-primary);
  color: var(--text-on-gold);
  box-shadow: var(--shadow-sm);
}

/* Refresh button */
.refresh-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition-base);
}

.refresh-btn:hover {
  border-color: var(--border-hover);
  color: var(--gold-primary);
  background: var(--bg-elevated);
}

.refresh-btn:active :deep(.material-symbols-outlined) {
  animation: spin 0.5s ease-in-out;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Last updated */
.last-updated {
  font-size: var(--text-xs);
  color: var(--text-muted);
  white-space: nowrap;
}

/* Responsive */
@media (max-width: 768px) {
  .sentiment-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-controls {
    width: 100%;
    flex-wrap: wrap;
  }

  .page-title {
    font-size: var(--text-xl);
  }

  .last-updated {
    display: none;
  }
}
</style>

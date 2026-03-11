<script setup lang="ts">
import MaterialIcon from '@/components/MaterialIcon.vue'
import BaseCard from '@/components/BaseCard.vue'
import type { SentimentAlert } from '@/types/sentiment'

defineProps<{
  alerts: SentimentAlert[]
}>()

const emit = defineEmits<{
  (e: 'acknowledge', alertId: string): void
  (e: 'acknowledgeAll'): void
}>()

function getSeverityIcon(severity: string): string {
  switch (severity) {
    case 'critical': return 'error'
    case 'warning': return 'warning'
    default: return 'info'
  }
}

function getSeverityLabel(severity: string): string {
  switch (severity) {
    case 'critical': return 'Critical'
    case 'warning': return 'Warning'
    default: return 'Info'
  }
}

function getTypeLabel(type: string): string {
  switch (type) {
    case 'negative_threshold': return 'Negative Threshold'
    case 'volume_spike': return 'Volume Spike'
    case 'influential_negative': return 'Influential Negative'
    default: return type
  }
}

function formatTime(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}
</script>

<template>
  <BaseCard variant="glass" class="alerts-card reveal-card">
    <div class="alerts-header">
      <div class="alerts-title-row">
        <div class="alerts-icon">
          <MaterialIcon icon="notifications_active" size="sm" />
        </div>
        <div>
          <h3 class="alerts-title">Alerts</h3>
          <p class="alerts-subtitle">
            {{ alerts.filter(a => !a.acknowledged).length }} active alerts
          </p>
        </div>
      </div>
      <button
        v-if="alerts.some(a => !a.acknowledged)"
        class="dismiss-all-btn"
        @click="emit('acknowledgeAll')"
      >
        Dismiss all
      </button>
    </div>

    <div class="alerts-list" v-if="alerts.length > 0">
      <div
        v-for="alert in alerts"
        :key="alert.id"
        class="alert-item"
        :class="[`severity-${alert.severity}`, { acknowledged: alert.acknowledged }]"
      >
        <div class="alert-icon-wrap" :class="[`severity-${alert.severity}`]">
          <MaterialIcon :icon="getSeverityIcon(alert.severity)" size="sm" />
        </div>

        <div class="alert-body">
          <div class="alert-meta">
            <span class="alert-type">{{ getTypeLabel(alert.type) }}</span>
            <span class="alert-severity-badge" :class="[`badge-${alert.severity}`]">
              {{ getSeverityLabel(alert.severity) }}
            </span>
            <span class="alert-time">{{ formatTime(alert.timestamp) }}</span>
          </div>
          <p class="alert-message">{{ alert.message }}</p>
        </div>

        <button
          v-if="!alert.acknowledged"
          class="alert-dismiss-btn"
          @click="emit('acknowledge', alert.id)"
          aria-label="Dismiss alert"
        >
          <MaterialIcon icon="close" size="xs" />
        </button>
        <span v-else class="alert-dismissed-label">Dismissed</span>
      </div>
    </div>

    <div class="alerts-empty" v-else>
      <MaterialIcon icon="check_circle" size="lg" />
      <p>No alerts — all clear!</p>
    </div>
  </BaseCard>
</template>

<style scoped>
.alerts-card {
  padding: var(--space-xl);
}

.alerts-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: var(--space-lg);
}

.alerts-title-row {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.alerts-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  background: rgba(245, 158, 11, 0.12);
  color: #f59e0b;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.alerts-title {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0;
}

.alerts-subtitle {
  font-size: var(--text-xs);
  color: var(--text-muted);
  margin: 2px 0 0;
}

.dismiss-all-btn {
  background: none;
  border: 1px solid var(--border-color);
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition-fast);
}

.dismiss-all-btn:hover {
  border-color: var(--border-hover);
  color: var(--gold-primary);
}

/* Alert Items */
.alerts-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.alert-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-md);
  padding: var(--space-md);
  border-radius: var(--radius-md);
  border-left: 3px solid transparent;
  transition: var(--transition-fast);
}

.alert-item.severity-critical {
  background: rgba(239, 68, 68, 0.06);
  border-left-color: #ef4444;
}

.alert-item.severity-warning {
  background: rgba(245, 158, 11, 0.06);
  border-left-color: #f59e0b;
}

.alert-item.severity-info {
  background: rgba(59, 130, 246, 0.06);
  border-left-color: #3b82f6;
}

.alert-item.acknowledged {
  opacity: 0.5;
}

.alert-icon-wrap {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.alert-icon-wrap.severity-critical { color: #ef4444; }
.alert-icon-wrap.severity-warning { color: #f59e0b; }
.alert-icon-wrap.severity-info { color: #3b82f6; }

.alert-body {
  flex: 1;
  min-width: 0;
}

.alert-meta {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: 4px;
  flex-wrap: wrap;
}

.alert-type {
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.alert-severity-badge {
  font-size: 10px;
  font-weight: var(--font-bold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 1px 6px;
  border-radius: var(--radius-sm);
}

.badge-critical {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.badge-warning {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
}

.badge-info {
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
}

.alert-time {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.alert-message {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: 0;
  line-height: var(--leading-normal);
}

.alert-dismiss-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  cursor: pointer;
  transition: var(--transition-fast);
  flex-shrink: 0;
}

.alert-dismiss-btn:hover {
  border-color: var(--border-hover);
  color: var(--text-primary);
  background: var(--bg-elevated);
}

.alert-dismissed-label {
  font-size: var(--text-xs);
  color: var(--text-disabled);
  flex-shrink: 0;
}

/* Empty state */
.alerts-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-2xl) 0;
  color: var(--text-muted);
}

.alerts-empty p {
  margin: 0;
  font-size: var(--text-sm);
}

@media (max-width: 768px) {
  .alerts-card {
    padding: var(--space-lg);
  }

  .alert-item {
    padding: var(--space-sm);
  }
}
</style>

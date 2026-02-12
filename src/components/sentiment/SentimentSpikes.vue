<script setup lang="ts">
import MaterialIcon from '@/components/MaterialIcon.vue'
import BaseCard from '@/components/BaseCard.vue'
import type { VolumeSpike } from '@/types/sentiment'

defineProps<{
  spikes: VolumeSpike[]
}>()

function formatTimeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}
</script>

<template>
  <BaseCard variant="glass" class="spikes-card reveal-card">
    <div class="card-header">
      <div class="header-icon">
        <MaterialIcon icon="bolt" size="sm" />
      </div>
      <div>
        <h3 class="card-title">Volume Spikes</h3>
        <p class="card-subtitle">Unusual mention activity detected</p>
      </div>
    </div>

    <div class="spikes-list" v-if="spikes.length > 0">
      <div
        v-for="spike in spikes"
        :key="spike.id"
        class="spike-item"
        :class="[`severity-${spike.severity}`]"
      >
        <div class="spike-indicator">
          <div class="spike-arrow" :class="[`severity-${spike.severity}`]">
            <MaterialIcon icon="trending_up" size="sm" />
          </div>
          <span class="spike-percent">+{{ spike.volumeIncrease }}%</span>
        </div>

        <div class="spike-body">
          <div class="spike-meta">
            <span class="spike-source">
              {{ spike.source === 'x' ? 'X' : 'Reddit' }}
            </span>
            <span class="spike-count">{{ spike.mentionCount }} mentions</span>
            <span class="spike-sentiment" :class="[`sentiment-${spike.sentiment}`]">
              {{ spike.sentiment }}
            </span>
            <span class="spike-time">{{ formatTimeAgo(spike.timestamp) }}</span>
          </div>
          <p class="spike-top-mention">
            <strong>Top mention:</strong> {{ spike.topMention.text }}
          </p>
        </div>

        <div class="spike-severity-badge" :class="[`badge-${spike.severity}`]">
          {{ spike.severity }}
        </div>
      </div>
    </div>

    <div class="empty-state" v-else>
      <MaterialIcon icon="check_circle" size="lg" />
      <p>No volume spikes detected</p>
    </div>
  </BaseCard>
</template>

<style scoped>
.spikes-card {
  padding: var(--space-xl);
}

.card-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-lg);
}

.header-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  background: rgba(168, 85, 247, 0.12);
  color: #a855f7;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-title {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0;
}

.card-subtitle {
  font-size: var(--text-xs);
  color: var(--text-muted);
  margin: 2px 0 0;
}

.spikes-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.spike-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-md);
  padding: var(--space-md);
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  transition: var(--transition-fast);
}

.spike-item.severity-critical {
  background: rgba(239, 68, 68, 0.04);
  border-color: rgba(239, 68, 68, 0.15);
}

.spike-item.severity-warning {
  background: rgba(245, 158, 11, 0.04);
  border-color: rgba(245, 158, 11, 0.15);
}

.spike-item.severity-info {
  background: rgba(59, 130, 246, 0.04);
  border-color: rgba(59, 130, 246, 0.15);
}

.spike-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

.spike-arrow {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.spike-arrow.severity-critical {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.spike-arrow.severity-warning {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
}

.spike-arrow.severity-info {
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
}

.spike-percent {
  font-family: var(--font-heading);
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
  color: var(--text-primary);
}

.spike-body {
  flex: 1;
  min-width: 0;
}

.spike-meta {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: 4px;
  flex-wrap: wrap;
}

.spike-source {
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.spike-count {
  font-size: var(--text-xs);
  color: var(--text-secondary);
}

.spike-sentiment {
  font-size: 10px;
  font-weight: var(--font-bold);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 1px 6px;
  border-radius: var(--radius-sm);
}

.spike-sentiment.sentiment-positive {
  color: #22c55e;
  background: rgba(34, 197, 94, 0.1);
}

.spike-sentiment.sentiment-neutral {
  color: #a78bfa;
  background: rgba(167, 139, 250, 0.1);
}

.spike-sentiment.sentiment-negative {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.spike-time {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.spike-top-mention {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: 0;
  line-height: var(--leading-normal);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.spike-top-mention strong {
  color: var(--text-primary);
}

.spike-severity-badge {
  font-size: 10px;
  font-weight: var(--font-bold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  flex-shrink: 0;
  white-space: nowrap;
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

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-2xl) 0;
  color: var(--text-muted);
}

.empty-state p {
  margin: 0;
  font-size: var(--text-sm);
}

@media (max-width: 768px) {
  .spikes-card {
    padding: var(--space-lg);
  }

  .spike-severity-badge {
    display: none;
  }
}
</style>

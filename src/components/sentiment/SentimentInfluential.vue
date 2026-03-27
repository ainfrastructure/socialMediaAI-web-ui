<script setup lang="ts">
import MaterialIcon from '@/components/MaterialIcon.vue'
import BaseCard from '@/components/BaseCard.vue'
import type { Mention } from '@/types/sentiment'

defineProps<{
  mentions: Mention[]
}>()

function formatFollowers(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toString()
}

function getSentimentIcon(sentiment: string): string {
  switch (sentiment) {
    case 'positive': return 'sentiment_satisfied'
    case 'negative': return 'sentiment_dissatisfied'
    default: return 'sentiment_neutral'
  }
}

function formatTimeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}
</script>

<template>
  <BaseCard variant="glass" class="influential-card reveal-card">
    <div class="card-header">
      <div class="header-icon">
        <MaterialIcon icon="star" size="sm" />
      </div>
      <div>
        <h3 class="card-title">Most Influential</h3>
        <p class="card-subtitle">Highest-impact mentions by reach</p>
      </div>
    </div>

    <div class="influential-list" v-if="mentions.length > 0">
      <div
        v-for="(mention, idx) in mentions"
        :key="mention.id"
        class="influential-item"
      >
        <div class="rank-badge">{{ idx + 1 }}</div>

        <div class="influential-body">
          <div class="influential-meta">
            <span class="influential-author">{{ mention.author }}</span>
            <span class="influential-source" :class="[`source-${mention.source}`]">
              {{ mention.source === 'x' ? 'X' : 'Reddit' }}
            </span>
          </div>
          <p class="influential-text">{{ mention.text }}</p>
          <div class="influential-stats">
            <span class="stat">
              <MaterialIcon icon="people" size="xs" />
              {{ formatFollowers(mention.authorFollowers) }}
            </span>
            <span class="stat">
              <MaterialIcon icon="favorite" size="xs" />
              {{ mention.engagementScore }}
            </span>
            <span
              class="stat sentiment-stat"
              :class="[`sentiment-${mention.sentiment}`]"
            >
              <MaterialIcon :icon="getSentimentIcon(mention.sentiment)" size="xs" />
              {{ mention.sentiment }}
            </span>
            <span class="stat time-stat">{{ formatTimeAgo(mention.createdAt) }}</span>
          </div>
        </div>

        <a
          :href="mention.url"
          target="_blank"
          rel="noopener noreferrer"
          class="view-link"
          aria-label="View original post"
        >
          <MaterialIcon icon="open_in_new" size="xs" />
        </a>
      </div>
    </div>

    <div class="empty-state" v-else>
      <MaterialIcon icon="star_border" size="lg" />
      <p>No influential mentions yet</p>
    </div>
  </BaseCard>
</template>

<style scoped>
.influential-card {
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
  background: rgba(234, 179, 8, 0.12);
  color: #eab308;
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

.influential-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.influential-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-md);
  padding: var(--space-md);
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  transition: var(--transition-fast);
}

.influential-item:hover {
  background: var(--bg-tertiary);
  border-color: var(--border-color);
}

.rank-badge {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-full);
  background: var(--gradient-gold);
  color: var(--text-on-gold);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
  flex-shrink: 0;
}

.influential-body {
  flex: 1;
  min-width: 0;
}

.influential-meta {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: 4px;
}

.influential-author {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.influential-source {
  font-size: 10px;
  font-weight: var(--font-bold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 1px 6px;
  border-radius: var(--radius-sm);
}

.source-x {
  background: rgba(0, 0, 0, 0.08);
  color: var(--text-secondary);
}

:root[data-theme="dark"] .source-x {
  background: rgba(255, 255, 255, 0.08);
}

.source-reddit {
  background: rgba(255, 69, 0, 0.1);
  color: #ff4500;
}

.influential-text {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: 0 0 var(--space-sm);
  line-height: var(--leading-normal);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.influential-stats {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  flex-wrap: wrap;
}

.stat {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.sentiment-stat.sentiment-positive { color: #22c55e; }
.sentiment-stat.sentiment-neutral { color: #a78bfa; }
.sentiment-stat.sentiment-negative { color: #ef4444; }

.time-stat {
  margin-left: auto;
}

.view-link {
  color: var(--text-muted);
  transition: var(--transition-fast);
  display: flex;
  flex-shrink: 0;
  padding: var(--space-xs);
}

.view-link:hover {
  color: var(--gold-primary);
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
  .influential-card {
    padding: var(--space-lg);
  }

  .influential-item {
    padding: var(--space-sm);
  }

  .influential-stats {
    gap: var(--space-sm);
  }
}
</style>

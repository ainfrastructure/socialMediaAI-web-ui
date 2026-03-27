<script setup lang="ts">
import MaterialIcon from '@/components/MaterialIcon.vue'
import BaseCard from '@/components/BaseCard.vue'
import type { Mention, MentionSource, SentimentLabel } from '@/types/sentiment'

defineProps<{
  mentions: Mention[]
  total: number
  page: number
  sourceFilter: MentionSource | 'all'
  sentimentFilter: SentimentLabel | 'all'
  loading: boolean
}>()

const emit = defineEmits<{
  (e: 'update:sourceFilter', value: MentionSource | 'all'): void
  (e: 'update:sentimentFilter', value: SentimentLabel | 'all'): void
  (e: 'update:page', value: number): void
}>()

const sourceOptions: { value: MentionSource | 'all'; label: string; icon: string }[] = [
  { value: 'all', label: 'All', icon: 'public' },
  { value: 'x', label: 'X', icon: 'tag' },
  { value: 'reddit', label: 'Reddit', icon: 'forum' },
]

const sentimentOptions: { value: SentimentLabel | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'positive', label: 'Positive' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'negative', label: 'Negative' },
]

function formatTimeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

function getSentimentIcon(sentiment: string): string {
  switch (sentiment) {
    case 'positive': return 'sentiment_satisfied'
    case 'negative': return 'sentiment_dissatisfied'
    default: return 'sentiment_neutral'
  }
}

function formatFollowers(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toString()
}

const totalPages = (total: number) => Math.max(1, Math.ceil(total / 20))
</script>

<template>
  <BaseCard variant="glass" class="feed-card reveal-card">
    <div class="feed-header">
      <div class="feed-title-row">
        <div class="feed-icon">
          <MaterialIcon icon="dynamic_feed" size="sm" />
        </div>
        <div>
          <h3 class="feed-title">Live Mentions Feed</h3>
          <p class="feed-subtitle">{{ total }} mentions found</p>
        </div>
      </div>

      <div class="feed-filters">
        <!-- Source filter -->
        <div class="filter-group" role="radiogroup" aria-label="Source filter">
          <button
            v-for="opt in sourceOptions"
            :key="opt.value"
            class="filter-btn"
            :class="{ active: sourceFilter === opt.value }"
            @click="emit('update:sourceFilter', opt.value)"
            role="radio"
            :aria-checked="sourceFilter === opt.value"
          >
            <MaterialIcon :icon="opt.icon" size="xs" />
            {{ opt.label }}
          </button>
        </div>

        <!-- Sentiment filter -->
        <div class="filter-group" role="radiogroup" aria-label="Sentiment filter">
          <button
            v-for="opt in sentimentOptions"
            :key="opt.value"
            class="filter-btn"
            :class="{ active: sentimentFilter === opt.value, [`sentiment-${opt.value}`]: sentimentFilter === opt.value && opt.value !== 'all' }"
            @click="emit('update:sentimentFilter', opt.value)"
            role="radio"
            :aria-checked="sentimentFilter === opt.value"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- Mention list -->
    <div class="mentions-list">
      <div
        v-for="mention in mentions"
        :key="mention.id"
        class="mention-item"
      >
        <div class="mention-left">
          <div class="mention-source-badge" :class="[`source-${mention.source}`]">
            <MaterialIcon :icon="mention.source === 'x' ? 'tag' : 'forum'" size="xs" />
          </div>
          <div class="mention-sentiment-indicator" :class="[`sentiment-${mention.sentiment}`]">
            <MaterialIcon :icon="getSentimentIcon(mention.sentiment)" size="xs" />
          </div>
        </div>

        <div class="mention-body">
          <div class="mention-meta">
            <span class="mention-author">{{ mention.author }}</span>
            <span class="mention-followers">{{ formatFollowers(mention.authorFollowers) }} followers</span>
            <span v-if="mention.subreddit" class="mention-subreddit">{{ mention.subreddit }}</span>
            <span class="mention-time">{{ formatTimeAgo(mention.createdAt) }}</span>
          </div>
          <p class="mention-text">{{ mention.text }}</p>
          <div class="mention-footer">
            <span class="mention-engagement">
              <MaterialIcon icon="favorite" size="xs" />
              {{ mention.engagementScore }}
            </span>
            <div class="mention-hashtags" v-if="mention.hashtags?.length">
              <span v-for="tag in mention.hashtags.slice(0, 3)" :key="tag" class="hashtag">{{ tag }}</span>
            </div>
            <a
              :href="mention.url"
              target="_blank"
              rel="noopener noreferrer"
              class="mention-link"
              aria-label="Open original post"
            >
              <MaterialIcon icon="open_in_new" size="xs" />
            </a>
          </div>
        </div>

        <div class="mention-score">
          <span
            class="score-value"
            :class="[`sentiment-${mention.sentiment}`]"
          >
            {{ mention.sentimentScore > 0 ? '+' : '' }}{{ (mention.sentimentScore * 100).toFixed(0) }}
          </span>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="feed-loading">
        <div class="loading-dots">
          <span /><span /><span />
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="!loading && mentions.length === 0" class="feed-empty">
        <MaterialIcon icon="search_off" size="lg" />
        <p>No mentions found for current filters</p>
      </div>
    </div>

    <!-- Pagination -->
    <div class="feed-pagination" v-if="total > 20">
      <button
        class="page-btn"
        :disabled="page <= 1"
        @click="emit('update:page', page - 1)"
        aria-label="Previous page"
      >
        <MaterialIcon icon="chevron_left" size="sm" />
      </button>
      <span class="page-info">Page {{ page }} of {{ totalPages(total) }}</span>
      <button
        class="page-btn"
        :disabled="page >= totalPages(total)"
        @click="emit('update:page', page + 1)"
        aria-label="Next page"
      >
        <MaterialIcon icon="chevron_right" size="sm" />
      </button>
    </div>
  </BaseCard>
</template>

<style scoped>
.feed-card {
  padding: var(--space-xl);
}

.feed-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-lg);
  margin-bottom: var(--space-lg);
  flex-wrap: wrap;
}

.feed-title-row {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.feed-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  background: rgba(59, 130, 246, 0.12);
  color: #3b82f6;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.feed-title {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0;
}

.feed-subtitle {
  font-size: var(--text-xs);
  color: var(--text-muted);
  margin: 2px 0 0;
}

/* Filters */
.feed-filters {
  display: flex;
  gap: var(--space-sm);
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  padding: 2px;
  gap: 2px;
}

.filter-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: var(--space-xs) var(--space-sm);
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-muted);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: var(--transition-fast);
  white-space: nowrap;
}

.filter-btn:hover {
  color: var(--text-primary);
  background: var(--bg-secondary);
}

.filter-btn.active {
  background: var(--gold-primary);
  color: var(--text-on-gold);
  box-shadow: var(--shadow-sm);
}

.filter-btn.sentiment-positive.active {
  background: rgba(34, 197, 94, 0.85);
}

.filter-btn.sentiment-neutral.active {
  background: rgba(167, 139, 250, 0.85);
}

.filter-btn.sentiment-negative.active {
  background: rgba(239, 68, 68, 0.85);
}

/* Mentions List */
.mentions-list {
  display: flex;
  flex-direction: column;
}

.mention-item {
  display: flex;
  gap: var(--space-md);
  padding: var(--space-md) 0;
  border-bottom: 1px solid var(--border-color);
  transition: var(--transition-fast);
}

.mention-item:last-child {
  border-bottom: none;
}

.mention-item:hover {
  background: var(--bg-tertiary);
  margin: 0 calc(-1 * var(--space-md));
  padding-left: var(--space-md);
  padding-right: var(--space-md);
  border-radius: var(--radius-md);
}

.mention-left {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
  flex-shrink: 0;
}

.mention-source-badge {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
}

.source-x {
  background: rgba(0, 0, 0, 0.08);
  color: var(--text-primary);
}

:root[data-theme="dark"] .source-x {
  background: rgba(255, 255, 255, 0.08);
}

.source-reddit {
  background: rgba(255, 69, 0, 0.1);
  color: #ff4500;
}

.mention-sentiment-indicator {
  width: 22px;
  height: 22px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
}

.mention-sentiment-indicator.sentiment-positive { color: #22c55e; }
.mention-sentiment-indicator.sentiment-neutral { color: #a78bfa; }
.mention-sentiment-indicator.sentiment-negative { color: #ef4444; }

.mention-body {
  flex: 1;
  min-width: 0;
}

.mention-meta {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: 4px;
  flex-wrap: wrap;
}

.mention-author {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.mention-followers {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.mention-subreddit {
  font-size: var(--text-xs);
  color: #ff4500;
  font-weight: var(--font-medium);
}

.mention-time {
  font-size: var(--text-xs);
  color: var(--text-muted);
  margin-left: auto;
}

.mention-text {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: 0 0 var(--space-sm);
  line-height: var(--leading-relaxed);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.mention-footer {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.mention-engagement {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.mention-hashtags {
  display: flex;
  gap: var(--space-xs);
}

.hashtag {
  font-size: 10px;
  color: var(--gold-primary);
  background: var(--gold-subtle);
  padding: 1px 6px;
  border-radius: var(--radius-sm);
}

.mention-link {
  color: var(--text-muted);
  transition: var(--transition-fast);
  display: flex;
  margin-left: auto;
}

.mention-link:hover {
  color: var(--gold-primary);
}

/* Sentiment score */
.mention-score {
  display: flex;
  align-items: flex-start;
  flex-shrink: 0;
}

.score-value {
  font-family: var(--font-heading);
  font-size: var(--text-sm);
  font-weight: var(--font-bold);
  padding: 2px var(--space-sm);
  border-radius: var(--radius-sm);
}

.score-value.sentiment-positive {
  color: #22c55e;
  background: rgba(34, 197, 94, 0.1);
}

.score-value.sentiment-neutral {
  color: #a78bfa;
  background: rgba(167, 139, 250, 0.1);
}

.score-value.sentiment-negative {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

/* Pagination */
.feed-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
  margin-top: var(--space-lg);
  padding-top: var(--space-lg);
  border-top: 1px solid var(--border-color);
}

.page-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition-fast);
}

.page-btn:hover:not(:disabled) {
  border-color: var(--border-hover);
  color: var(--gold-primary);
}

.page-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.page-info {
  font-size: var(--text-sm);
  color: var(--text-muted);
}

/* Loading */
.feed-loading {
  display: flex;
  justify-content: center;
  padding: var(--space-2xl) 0;
}

.loading-dots {
  display: flex;
  gap: var(--space-xs);
}

.loading-dots span {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
  background: var(--gold-primary);
  animation: bounce 1.4s infinite ease-in-out both;
}

.loading-dots span:nth-child(1) { animation-delay: -0.32s; }
.loading-dots span:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

/* Empty */
.feed-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-3xl) 0;
  color: var(--text-muted);
}

.feed-empty p {
  margin: 0;
  font-size: var(--text-sm);
}

/* Responsive */
@media (max-width: 768px) {
  .feed-card {
    padding: var(--space-lg);
  }

  .feed-header {
    flex-direction: column;
  }

  .mention-left {
    display: none;
  }

  .mention-meta {
    gap: var(--space-xs);
  }

  .mention-score {
    display: none;
  }
}
</style>

<script setup lang="ts">
import MaterialIcon from '@/components/MaterialIcon.vue'
import type { TrendingKeyword } from '@/types/seoBriefs'

defineProps<{
  keywords: TrendingKeyword[]
}>()

const directionIcon = (direction: TrendingKeyword['trendDirection']) => {
  if (direction === 'rising') return 'trending_up'
  if (direction === 'stable') return 'trending_flat'
  return 'trending_down'
}

const directionClass = (direction: TrendingKeyword['trendDirection']) => {
  if (direction === 'rising') return 'direction-rising'
  if (direction === 'stable') return 'direction-stable'
  return 'direction-declining'
}

const formatVolume = (volume: number) => {
  if (volume >= 1_000_000) return `${(volume / 1_000_000).toFixed(1)}M`
  if (volume >= 1_000) return `${(volume / 1_000).toFixed(1)}K`
  return volume.toString()
}
</script>

<template>
  <div class="trending-section">
    <div class="trending-header">
      <div class="trending-header-left">
        <MaterialIcon icon="local_fire_department" size="sm" />
        <h3 class="trending-title">Trending Keywords</h3>
      </div>
      <span class="trending-count">{{ keywords.length }} found</span>
    </div>

    <div v-if="keywords.length === 0" class="trending-empty">
      <MaterialIcon icon="search_off" size="lg" />
      <p>No trending keywords found. Try generating briefs to discover trends.</p>
    </div>

    <div v-else class="trending-grid">
      <div
        v-for="kw in keywords"
        :key="kw.keyword"
        class="trending-item"
      >
        <div class="trending-item-main">
          <span class="trending-keyword">{{ kw.keyword }}</span>
          <div class="trending-meta">
            <span :class="['direction-badge', directionClass(kw.trendDirection)]">
              <MaterialIcon :icon="directionIcon(kw.trendDirection)" size="xs" />
              {{ kw.trendDirection }}
            </span>
            <span class="volume-badge">
              <MaterialIcon icon="bar_chart" size="xs" />
              {{ formatVolume(kw.searchVolume) }}
            </span>
          </div>
        </div>
        <div v-if="kw.relatedQueries.length > 0" class="related-queries">
          <span
            v-for="q in kw.relatedQueries.slice(0, 4)"
            :key="q"
            class="related-tag"
          >
            {{ q }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.trending-section {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--blur-md));
  -webkit-backdrop-filter: blur(var(--blur-md));
  border: var(--border-width) solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
  position: relative;
}

.trending-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--glass-highlight);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
}

.trending-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-lg);
}

.trending-header-left {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  color: var(--gold-primary);
}

.trending-title {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0;
}

.trending-count {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.trending-empty {
  text-align: center;
  padding: var(--space-2xl) var(--space-lg);
  color: var(--text-muted);
}

.trending-empty p {
  margin: var(--space-md) 0 0;
  font-size: var(--text-sm);
}

.trending-grid {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.trending-item {
  padding: var(--space-md);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  transition: var(--transition-base);
}

.trending-item:hover {
  border-color: var(--border-hover);
}

.trending-item-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
}

.trending-keyword {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.trending-meta {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.direction-badge {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  padding: 2px var(--space-sm);
  border-radius: var(--radius-sm);
  text-transform: capitalize;
}

.direction-rising {
  background: var(--success-bg);
  color: var(--success-text);
}

.direction-stable {
  background: var(--info-bg);
  color: var(--info-text);
}

.direction-declining {
  background: var(--error-bg);
  color: var(--error-text);
}

.volume-badge {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.related-queries {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
  margin-top: var(--space-sm);
  padding-top: var(--space-sm);
  border-top: 1px solid var(--border-color);
}

.related-tag {
  font-size: 11px;
  color: var(--text-muted);
  padding: 1px var(--space-sm);
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
}

@media (max-width: 768px) {
  .trending-item-main {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-sm);
  }
}
</style>

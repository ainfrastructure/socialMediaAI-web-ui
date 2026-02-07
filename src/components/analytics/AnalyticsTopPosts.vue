<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import MaterialIcon from '@/components/MaterialIcon.vue'
import AnalyticsTopPostCard from './AnalyticsTopPostCard.vue'
import type { TopPostItem } from '@/composables/useAnalyticsData'

interface Props {
  posts: TopPostItem[]
  averageEngagementRate: number
  getMediaUrl: (post: any) => string | null
  getPostText: (post: any) => string
  getBrandName: (post: any) => string
}

defineProps<Props>()
defineEmits<{ (e: 'viewPost', post: any): void }>()

const { t } = useI18n()
</script>

<template>
  <div class="top-posts-section">
    <!-- Section header -->
    <div class="section-header">
      <div class="section-title-area">
        <div class="section-icon">
          <MaterialIcon icon="emoji_events" size="md" />
        </div>
        <div>
          <h3 class="section-title">{{ t('analytics.topPerforming') }}</h3>
          <p class="section-subtitle">{{ t('analytics.highestEngagement') }}</p>
        </div>
      </div>

      <!-- Average engagement badge -->
      <div class="avg-engagement-badge">
        <MaterialIcon icon="speed" size="sm" />
        <span class="avg-label">{{ t('analytics.averageEngagementRate') }}</span>
        <span class="avg-value">{{ averageEngagementRate.toFixed(1) }}%</span>
      </div>
    </div>

    <!-- Posts list -->
    <div v-if="posts.length > 0" class="top-posts-list">
      <AnalyticsTopPostCard
        v-for="(item, index) in posts"
        :key="item.post.id"
        :rank="index + 1"
        :image-url="getMediaUrl(item.post)"
        :post-text="getPostText(item.post)"
        :brand-name="getBrandName(item.post)"
        :reach="item.totalReach"
        :likes="item.totalLikes"
        :engagement-rate="item.engagementRate"
        :platforms="item.post.platforms"
        @click="$emit('viewPost', item.post)"
      />
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <div class="empty-icon-wrap">
        <MaterialIcon icon="trending_up" size="lg" />
      </div>
      <p>{{ t('analytics.noPerformanceData') }}</p>
    </div>
  </div>
</template>

<style scoped>
.top-posts-section {
  margin-bottom: var(--space-2xl);
}

/* Section header */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-lg);
  flex-wrap: wrap;
  gap: var(--space-md);
}

.section-title-area {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.section-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, rgba(176, 138, 90, 0.15), rgba(176, 138, 90, 0.05));
  color: #b08a5a;
  display: flex;
  align-items: center;
  justify-content: center;
}

.section-title {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  color: var(--text-primary);
  margin: 0;
}

.section-subtitle {
  font-size: var(--text-sm);
  color: var(--text-muted);
  margin: 2px 0 0 0;
}

/* Average engagement badge */
.avg-engagement-badge {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-lg);
  background: var(--bg-secondary);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-full);
  color: var(--gold-primary);
}

.avg-label {
  font-size: var(--text-xs);
  color: var(--text-secondary);
}

.avg-value {
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  font-family: var(--font-heading);
  background: var(--gradient-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Posts list */
.top-posts-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-3xl);
  text-align: center;
  background: var(--bg-secondary);
  border-radius: var(--radius-xl);
  border: 1px dashed var(--glass-border);
}

.empty-icon-wrap {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-full);
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
}

.empty-state p {
  color: var(--text-muted);
  font-size: var(--text-sm);
  margin: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .avg-engagement-badge {
    width: 100%;
    justify-content: center;
  }
}
</style>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import BasePagination from '@/components/BasePagination.vue'
import MaterialIcon from '@/components/MaterialIcon.vue'
import PlatformLogo from '@/components/PlatformLogo.vue'
import type { StatusFilter, SortColumn, SortDir, PlatformFilter } from '@/composables/useAnalyticsData'

interface Props {
  posts: any[]
  paginatedPosts: any[]
  currentPage: number
  totalPages: number
  totalItems: number
  selectedStatusFilter: StatusFilter
  selectedPlatform: PlatformFilter
  sortBy: SortColumn
  sortDirection: SortDir
  isMobile: boolean
  platformTabs: Array<{ key: PlatformFilter; label: string; icon: string | null; count: number }>
  getMediaUrl: (post: any) => string | null
  getPostText: (post: any) => string
  getBusinessName: (post: any) => string
  formatDate: (dateStr: string) => string
  hasVideo: (post: any) => boolean
  getPostViews: (postId: string, platform?: string) => string
  getPostEngagementMetric: (postId: string, metric: 'likes' | 'comments' | 'shares', platform?: string) => string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:selectedStatusFilter', filter: StatusFilter): void
  (e: 'update:currentPage', page: number): void
  (e: 'update:selectedPlatform', platform: PlatformFilter): void
  (e: 'sort', column: SortColumn): void
  (e: 'viewPost', post: any): void
}>()

const { t } = useI18n()

const platformForMetric = () =>
  props.selectedPlatform === 'all' ? undefined : props.selectedPlatform
</script>

<template>
  <div class="recent-activity">
    <!-- Section Header -->
    <div class="section-header">
      <div class="section-title-area">
        <div class="section-icon">
          <MaterialIcon icon="history" size="md" />
        </div>
        <div>
          <h3 class="section-title">{{ t('analytics.recentActivity') }}</h3>
          <p class="section-subtitle">{{ t('analytics.latestPosts') }}</p>
        </div>
      </div>

      <!-- Status Filter Pills -->
      <div class="status-pills">
        <button
          :class="['status-pill', { active: selectedStatusFilter === 'all' }]"
          @click="$emit('update:selectedStatusFilter', 'all')"
        >
          {{ t('analytics.allStatuses') }}
          <span class="pill-count">{{ posts.length }}</span>
        </button>
        <button
          :class="['status-pill published-pill', { active: selectedStatusFilter === 'published' }]"
          @click="$emit('update:selectedStatusFilter', 'published')"
        >
          {{ t('analytics.published') }}
        </button>
        <button
          :class="['status-pill scheduled-pill', { active: selectedStatusFilter === 'scheduled' }]"
          @click="$emit('update:selectedStatusFilter', 'scheduled')"
        >
          {{ t('analytics.scheduled') }}
        </button>
        <button
          :class="['status-pill failed-pill', { active: selectedStatusFilter === 'failed' }]"
          @click="$emit('update:selectedStatusFilter', 'failed')"
        >
          {{ t('analytics.failed') }}
        </button>
      </div>
    </div>

    <!-- Platform tabs -->
    <div class="platform-tabs-bar">
      <button
        v-for="tab in platformTabs"
        :key="tab.key"
        :class="['ptab', { active: selectedPlatform === tab.key }]"
        @click="$emit('update:selectedPlatform', tab.key)"
      >
        <PlatformLogo
          v-if="tab.icon"
          :platform="(tab.icon as 'facebook' | 'instagram' | 'tiktok' | 'twitter' | 'linkedin')"
          :size="18"
          :show-background="false"
        />
        <MaterialIcon v-else icon="apps" size="xs" />
        <span>{{ tab.label }}</span>
        <span class="ptab-count">{{ tab.count }}</span>
      </button>
    </div>

    <!-- Empty State -->
    <div v-if="posts.length === 0" class="empty-state">
      <div class="empty-icon-wrap">
        <MaterialIcon icon="inbox" size="xl" />
      </div>
      <h4>{{ t('analytics.noRecentActivity') }}</h4>
      <p>{{ t('analytics.noPlatformPostsDesc') }}</p>
    </div>

    <!-- Post Cards Grid -->
    <div v-else class="post-cards-grid">
      <div
        v-for="post in paginatedPosts"
        :key="post.id"
        class="post-card reveal-card"
        @click="$emit('viewPost', post)"
      >
        <!-- Card Image / Media -->
        <div class="card-media">
          <img
            v-if="getMediaUrl(post)"
            :src="getMediaUrl(post)!"
            alt=""
            class="card-image"
            @error="(e: Event) => (e.target as HTMLImageElement).style.display = 'none'"
          />
          <div v-else class="card-image-placeholder">
            <MaterialIcon icon="article" size="lg" />
          </div>

          <!-- Status badge overlay -->
          <span :class="['card-status', post.status]">
            <MaterialIcon
              :icon="post.status === 'published' ? 'check_circle' : post.status === 'scheduled' ? 'schedule' : 'error'"
              size="xs"
            />
            {{ post.status && t(`analytics.${post.status}`, post.status) }}
          </span>

          <!-- Video indicator -->
          <span v-if="hasVideo(post)" class="card-video-badge">
            <MaterialIcon icon="play_arrow" size="sm" />
          </span>

          <!-- Platform badges -->
          <div v-if="post.platforms?.length" class="card-platforms">
            <PlatformLogo
              v-for="p in post.platforms.slice(0, 3)"
              :key="p"
              :platform="p"
              :size="22"
              class="card-platform-logo"
            />
          </div>
        </div>

        <!-- Card Body -->
        <div class="card-body">
          <!-- Post text -->
          <p class="card-text">
            {{ getPostText(post).substring(0, 80) }}{{ getPostText(post).length > 80 ? '...' : '' }}
          </p>

          <!-- Business & Date -->
          <div class="card-meta">
            <span class="card-business">
              <MaterialIcon icon="storefront" size="xs" />
              {{ getBusinessName(post) }}
            </span>
            <span class="card-date">
              {{ formatDate(post.scheduled_date || post.published_at) }}
            </span>
          </div>

          <!-- Engagement metrics row -->
          <div v-if="post.status === 'published'" class="card-metrics">
            <div class="metric-item">
              <MaterialIcon icon="visibility" size="xs" />
              <span class="metric-val">{{ getPostViews(post.id, platformForMetric()) }}</span>
              <span class="metric-lbl">{{ t('analytics.reach') }}</span>
            </div>
            <div class="metric-item">
              <MaterialIcon icon="thumb_up" size="xs" />
              <span class="metric-val">{{ getPostEngagementMetric(post.id, 'likes', platformForMetric()) }}</span>
              <span class="metric-lbl">{{ t('analytics.likes') }}</span>
            </div>
            <div class="metric-item">
              <MaterialIcon icon="chat_bubble" size="xs" />
              <span class="metric-val">{{ getPostEngagementMetric(post.id, 'comments', platformForMetric()) }}</span>
              <span class="metric-lbl">{{ t('analytics.comments') }}</span>
            </div>
            <div class="metric-item">
              <MaterialIcon icon="share" size="xs" />
              <span class="metric-val">{{ getPostEngagementMetric(post.id, 'shares', platformForMetric()) }}</span>
              <span class="metric-lbl">{{ t('analytics.shares') }}</span>
            </div>
          </div>

          <!-- Platform links -->
          <div
            v-if="post.status === 'published' && post.platform_post_urls && Object.keys(post.platform_post_urls).length > 0"
            class="card-links"
          >
            <a
              v-for="(url, platform) in (post.platform_post_urls as Record<string, string>)"
              :key="platform"
              :href="url"
              target="_blank"
              rel="noopener noreferrer"
              class="card-link"
              @click.stop
            >
              <PlatformLogo :platform="(platform as 'facebook' | 'instagram' | 'tiktok' | 'twitter' | 'linkedin')" :size="16" :show-background="false" />
              <span>{{ t('analytics.viewOn', { platform }) }}</span>
              <MaterialIcon icon="open_in_new" size="xs" />
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="pagination-wrap">
      <BasePagination
        :current-page="currentPage"
        :total-pages="totalPages"
        :total-items="totalItems"
        @update:current-page="$emit('update:currentPage', $event)"
      />
    </div>
  </div>
</template>

<style scoped>
.recent-activity {
  margin-bottom: var(--space-2xl);
}

/* Section Header */
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
  background: linear-gradient(135deg, rgba(15, 61, 46, 0.12), rgba(15, 61, 46, 0.04));
  color: var(--gold-primary);
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

/* Status Pills */
.status-pills {
  display: flex;
  gap: var(--space-xs);
}

.status-pill {
  padding: var(--space-xs) var(--space-md);
  background: var(--bg-secondary);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-full);
  color: var(--text-secondary);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  cursor: pointer;
  transition: var(--transition-fast);
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.status-pill:hover:not(.active) {
  border-color: var(--text-muted);
  color: var(--text-primary);
}

.status-pill.active {
  background: var(--gold-primary);
  border-color: var(--gold-primary);
  color: var(--text-on-gold);
}

.pill-count {
  background: rgba(0, 0, 0, 0.1);
  padding: 1px 6px;
  border-radius: var(--radius-full);
  font-size: 10px;
}

.status-pill.active .pill-count {
  background: rgba(255, 255, 255, 0.2);
}

/* Platform Tabs */
.platform-tabs-bar {
  display: flex;
  gap: var(--space-xs);
  margin-bottom: var(--space-xl);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding-bottom: var(--space-sm);
}

.platform-tabs-bar::-webkit-scrollbar { display: none; }

.ptab {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-secondary);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: var(--transition-fast);
  white-space: nowrap;
  min-height: 40px;
}

.ptab:hover:not(.active) {
  border-color: var(--text-muted);
  color: var(--text-primary);
  background: var(--bg-tertiary);
}

.ptab.active {
  background: rgba(15, 61, 46, 0.08);
  border-color: var(--gold-primary);
  color: var(--gold-primary);
  font-weight: var(--font-semibold);
}

.ptab-count {
  font-size: var(--text-xs);
  color: var(--text-muted);
  background: var(--bg-tertiary);
  padding: 1px 6px;
  border-radius: var(--radius-full);
}

.ptab.active .ptab-count {
  background: rgba(15, 61, 46, 0.12);
  color: var(--gold-primary);
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-5xl) var(--space-xl);
  text-align: center;
}

.empty-icon-wrap {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-full);
  background: var(--bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  margin-bottom: var(--space-lg);
}

.empty-state h4 {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  color: var(--text-primary);
  margin: 0 0 var(--space-sm) 0;
}

.empty-state p {
  color: var(--text-muted);
  font-size: var(--text-sm);
  margin: 0;
  max-width: 360px;
}

/* Post Cards Grid */
.post-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: var(--space-lg);
}

/* Individual Post Card */
.post-card {
  background: var(--bg-secondary);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
  cursor: pointer;
  transition: var(--transition-base);
}

.post-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(15, 61, 46, 0.12);
  border-color: rgba(15, 61, 46, 0.2);
}

/* Card Media */
.card-media {
  position: relative;
  height: 180px;
  overflow: hidden;
  background: var(--bg-tertiary);
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.post-card:hover .card-image {
  transform: scale(1.03);
}

.card-image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  background: linear-gradient(135deg, var(--bg-tertiary), var(--bg-elevated));
}

/* Status badge on image */
.card-status {
  position: absolute;
  top: var(--space-sm);
  left: var(--space-sm);
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px var(--space-sm);
  border-radius: var(--radius-full);
  font-size: 11px;
  font-weight: var(--font-semibold);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  text-transform: capitalize;
}

.card-status.published {
  background: rgba(34, 197, 94, 0.9);
  color: white;
}

.card-status.scheduled {
  background: rgba(245, 158, 11, 0.9);
  color: white;
}

.card-status.failed,
.card-status.cancelled {
  background: rgba(239, 68, 68, 0.9);
  color: white;
}

.card-status.pending {
  background: rgba(59, 130, 246, 0.9);
  color: white;
}

.card-status.draft {
  background: rgba(156, 163, 175, 0.85);
  color: white;
}

/* Video badge */
.card-video-badge {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 44px;
  height: 44px;
  border-radius: var(--radius-full);
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

/* Platform badges on image */
.card-platforms {
  position: absolute;
  bottom: var(--space-sm);
  right: var(--space-sm);
  display: flex;
  gap: 4px;
}

.card-platform-logo {
  background: rgba(255, 255, 255, 0.9);
  border-radius: var(--radius-full);
  padding: 3px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

/* Card Body */
.card-body {
  padding: var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.card-text {
  font-size: var(--text-sm);
  color: var(--text-primary);
  line-height: 1.5;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-sm);
}

.card-business {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--text-xs);
  color: var(--gold-primary);
  font-weight: var(--font-medium);
}

.card-date {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

/* Engagement metrics */
.card-metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-xs);
  padding: var(--space-md);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
}

.metric-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  color: var(--gold-primary);
}

.metric-val {
  font-size: var(--text-sm);
  font-weight: var(--font-bold);
  color: var(--text-primary);
}

.metric-lbl {
  font-size: 10px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

/* Platform links */
.card-links {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}

.card-link {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px var(--space-sm);
  background: var(--bg-secondary);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-full);
  font-size: 11px;
  color: var(--text-secondary);
  text-decoration: none;
  transition: var(--transition-fast);
}

.card-link:hover {
  border-color: var(--gold-primary);
  color: var(--gold-primary);
}

/* Pagination */
.pagination-wrap {
  margin-top: var(--space-xl);
}

/* Responsive */
@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .status-pills {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    width: 100%;
    padding-bottom: var(--space-xs);
  }

  .post-cards-grid {
    grid-template-columns: 1fr;
  }

  .card-media {
    height: 160px;
  }

  .card-metrics {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .card-media {
    height: 140px;
  }

  .card-body {
    padding: var(--space-md);
  }
}

@media (prefers-reduced-motion: reduce) {
  .post-card:hover {
    transform: none;
  }
  .post-card:hover .card-image {
    transform: none;
  }
}
</style>

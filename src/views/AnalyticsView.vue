<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import DashboardLayout from '@/components/DashboardLayout.vue'
import MaterialIcon from '@/components/MaterialIcon.vue'
import PlatformLogo from '@/components/PlatformLogo.vue'
import Toast from '@/components/Toast.vue'
import PostDetailModal from '@/components/PostDetailModal.vue'
import AnalyticsHeader from '@/components/analytics/AnalyticsHeader.vue'
import AnalyticsKpiGrid from '@/components/analytics/AnalyticsKpiGrid.vue'
import AnalyticsSkeleton from '@/components/analytics/AnalyticsSkeleton.vue'
import AnalyticsEmptyState from '@/components/analytics/AnalyticsEmptyState.vue'
import AnalyticsTopPosts from '@/components/analytics/AnalyticsTopPosts.vue'
import AnalyticsActivityChart from '@/components/analytics/AnalyticsActivityChart.vue'
import AnalyticsPlatformChart from '@/components/analytics/AnalyticsPlatformChart.vue'
import AnalyticsStatusChart from '@/components/analytics/AnalyticsStatusChart.vue'
import AnalyticsUsageCard from '@/components/analytics/AnalyticsUsageCard.vue'
import AnalyticsRecentActivity from '@/components/analytics/AnalyticsRecentActivity.vue'
import { useAnalyticsData } from '@/composables/useAnalyticsData'

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler)

const route = useRoute()
const analytics = useAnalyticsData()

// Watch brand changes → reset page
watch(() => analytics.selectedBrandId.value, () => {
  analytics.currentPage.value = 1
})

onMounted(async () => {
  // Initialize platform filter from URL
  const platformParam = route.query.platform as string
  if (platformParam && ['all', 'facebook', 'instagram', 'tiktok', 'twitter', 'linkedin'].includes(platformParam)) {
    analytics.selectedPlatform.value = platformParam as any
  }

  await analytics.brandsStore.fetchBrands()
  if (!analytics.selectedBrandId.value && analytics.brandsStore.brands.length > 0) {
    analytics.preferencesStore.setSelectedBrand(analytics.brandsStore.brands[0].id)
  }

  await analytics.fetchAnalyticsData()
  await analytics.autoSyncEngagementIfNeeded()

  // Resize listener
  const handleResize = () => { analytics.windowWidth.value = window.innerWidth }
  window.addEventListener('resize', handleResize)
  onUnmounted(() => { window.removeEventListener('resize', handleResize) })
})
</script>

<template>
  <DashboardLayout>
    <div class="analytics-view">
      <!-- Header + Business Selector + Time Range -->
      <AnalyticsHeader
        :selected-time-range="analytics.selectedTimeRange.value"
        :refreshing-engagement="analytics.refreshingEngagement.value"
        :time-since-last-sync="analytics.timeSinceLastSync.value"
        :selected-brand-id="analytics.selectedBrandId.value"
        :brands="analytics.brandsStore.brands"
        :selected-brand="analytics.selectedBrand.value"
        @update:selected-time-range="analytics.handleTimeRangeChange"
        @update:selected-brand-id="analytics.selectedBrandId.value = $event"
        @refresh="analytics.refreshAllEngagement"
      />

      <!-- Skeleton Loading -->
      <AnalyticsSkeleton v-if="analytics.loading.value" />

      <!-- Empty State -->
      <AnalyticsEmptyState v-else-if="!analytics.hasMeaningfulStats.value" />

      <template v-else>
        <!-- Engagement Sync Warning -->
        <div v-if="analytics.diagnosticInfo.value.backendIssue && analytics.diagnosticInfo.value.publishedPostsCount > 0" class="engagement-warning">
          <MaterialIcon icon="info" size="sm" />
          <span>{{ $t('analytics.engagementSyncing') }}</span>
          <button class="warning-dismiss" @click="analytics.diagnosticInfo.value.backendIssue = false" aria-label="Dismiss">
            <MaterialIcon icon="close" size="xs" />
          </button>
        </div>

        <!-- Platform Empty State -->
        <div v-if="analytics.platformFilteredPosts.value.length === 0 && analytics.selectedPlatform.value !== 'all'" class="platform-empty-state">
          <PlatformLogo
            :platform="(analytics.selectedPlatform.value as 'facebook' | 'instagram' | 'tiktok' | 'twitter' | 'linkedin')"
            :size="64"
          />
          <h3>{{ $t('analytics.noPlatformPosts', { platform: $t(`platforms.${analytics.selectedPlatform.value}`) }) }}</h3>
          <p>{{ $t('analytics.noPlatformPostsDesc') }}</p>
          <button class="create-post-btn" @click="$router.push('/posts/create')">
            <MaterialIcon icon="add" size="sm" />
            {{ $t('analytics.createPost') }}
          </button>
        </div>

        <!-- KPI Cards Grid -->
        <AnalyticsKpiGrid
          :total-posts="analytics.totalPostsInRange.value"
          :saved-content="analytics.savedContentInRange.value"
          :scheduled="analytics.scheduledPostsCount.value"
          :published="analytics.publishedPostsCount.value"
          :likes="analytics.totalEngagementMetrics.value.likes"
          :reach="analytics.totalEngagementMetrics.value.reach"
          :comments="analytics.totalEngagementMetrics.value.comments"
          :shares="analytics.totalEngagementMetrics.value.shares"
          :trend-data="analytics.trendData.value"
          :sparkline-data="analytics.kpiSparklineData.value"
        />

        <!-- Section Divider: Top Posts -->
        <div class="section-divider" />

        <!-- Top Performing Posts -->
        <AnalyticsTopPosts
          :posts="analytics.topPerformingPosts.value"
          :average-engagement-rate="analytics.averageEngagementRate.value"
          :get-media-url="analytics.getMediaUrl"
          :get-post-text="analytics.getPostText"
          :get-brand-name="analytics.getBrandName"
          @view-post="analytics.viewPost"
        />

        <!-- Section Divider: Charts -->
        <div class="section-divider" />

        <!-- Charts Section Label -->
        <div class="section-label">
          <div class="section-label-icon">
            <MaterialIcon icon="analytics" size="sm" />
          </div>
          <div>
            <h3 class="section-label-title">{{ $t('analytics.detailedBreakdown') }}</h3>
            <p class="section-label-subtitle">{{ $t('analytics.chartsAndDistributions') }}</p>
          </div>
        </div>

        <!-- Charts Row 1: Activity + Platform -->
        <div class="charts-grid">
          <AnalyticsActivityChart
            :chart-data="analytics.activityChartData.value"
            :chart-options="analytics.activityChartOptions.value"
          />
          <AnalyticsPlatformChart
            v-if="analytics.selectedPlatform.value === 'all'"
            :chart-data="analytics.platformChartData.value"
            :chart-options="analytics.platformChartOptions.value"
            :has-data="Object.keys(analytics.platformBreakdown.value).length > 0"
          />
        </div>

        <!-- Charts Row 2: Status + Usage -->
        <div class="charts-grid">
          <AnalyticsStatusChart
            :chart-data="analytics.statusChartData.value"
            :chart-options="analytics.statusChartOptions.value"
          />
          <AnalyticsUsageCard
            :credits-this-month="analytics.authStore.user?.usage?.credits_this_month || 0"
            :monthly-limit="analytics.authStore.user?.usage?.monthly_limit || 0"
            :credits-usage-percent="analytics.creditsUsagePercent.value"
            :subscription-tier="analytics.subscriptionTierDisplay.value"
            :brand-count="analytics.stats.value.restaurantsAdded"
          />
        </div>

        <!-- Section Divider: Recent Activity -->
        <div class="section-divider" />

        <!-- Recent Activity -->
        <AnalyticsRecentActivity
          :posts="analytics.filteredPosts.value"
          :paginated-posts="analytics.paginatedPosts.value"
          :current-page="analytics.currentPage.value"
          :total-pages="analytics.totalPages.value"
          :total-items="analytics.filteredPosts.value.length"
          :selected-status-filter="analytics.selectedStatusFilter.value"
          :selected-platform="analytics.selectedPlatform.value"
          :sort-by="analytics.sortBy.value"
          :sort-direction="analytics.sortDirection.value"
          :is-mobile="analytics.isMobile.value"
          :platform-tabs="analytics.platformTabs.value"
          :get-media-url="analytics.getMediaUrl"
          :get-post-text="analytics.getPostText"
          :get-brand-name="analytics.getBrandName"
          :format-date="analytics.formatDate"
          :has-video="analytics.hasVideo"
          :get-post-views="analytics.getPostViews"
          :get-post-engagement-metric="analytics.getPostEngagementMetric"
          @update:selected-status-filter="analytics.handleStatusFilterChange"
          @update:current-page="analytics.goToPage"
          @update:selected-platform="analytics.handlePlatformChange"
          @sort="analytics.handleSort"
          @view-post="analytics.viewPost"
        />

        <!-- Post Detail Modal -->
        <PostDetailModal
          v-model="analytics.showPostModal.value"
          :post="analytics.selectedPost.value"
          @retry="analytics.handleRetryPost"
          @close="analytics.closeModal"
        />
      </template>
    </div>

    <!-- Toast -->
    <Toast
      v-model="analytics.showToast.value"
      :message="analytics.toastMessage.value"
      :type="analytics.toastType.value"
    />
  </DashboardLayout>
</template>

<style scoped>
.analytics-view {
  padding: var(--space-xl) var(--space-lg);
  max-width: 1600px;
  margin: 0 auto;
}

/* Reveal animation */
@keyframes analytics-reveal {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

:deep(.reveal-card) {
  animation: analytics-reveal 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
}

:deep(.reveal-card:nth-child(1)) { animation-delay: 0ms; }
:deep(.reveal-card:nth-child(2)) { animation-delay: 60ms; }
:deep(.reveal-card:nth-child(3)) { animation-delay: 120ms; }
:deep(.reveal-card:nth-child(4)) { animation-delay: 180ms; }
:deep(.reveal-card:nth-child(5)) { animation-delay: 240ms; }
:deep(.reveal-card:nth-child(6)) { animation-delay: 300ms; }
:deep(.reveal-card:nth-child(7)) { animation-delay: 360ms; }
:deep(.reveal-card:nth-child(8)) { animation-delay: 420ms; }

/* Section Dividers */
.section-divider {
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--glass-border) 20%,
    var(--glass-border) 80%,
    transparent 100%
  );
  margin: var(--space-2xl) 0;
  position: relative;
}

.section-divider::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 6px;
  height: 6px;
  border-radius: var(--radius-full);
  background: #b08a5a;
  opacity: 0.5;
}

/* Section Labels */
.section-label {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-xl);
}

.section-label-icon {
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

.section-label-title {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  color: var(--text-primary);
  margin: 0;
}

.section-label-subtitle {
  font-size: var(--text-sm);
  color: var(--text-muted);
  margin: 2px 0 0 0;
}

/* Charts Grid */
.charts-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--space-lg);
  margin-bottom: var(--space-xl);
}

/* Engagement Warning */
.engagement-warning {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-lg);
  margin-bottom: var(--space-lg);
  background: rgba(245, 158, 11, 0.08);
  border-left: 3px solid rgba(245, 158, 11, 0.5);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.warning-dismiss {
  margin-left: auto;
  background: none;
  border: none;
  padding: var(--space-xs);
  cursor: pointer;
  color: var(--text-muted);
  display: flex;
  border-radius: var(--radius-sm);
  transition: var(--transition-fast);
}

.warning-dismiss:hover {
  background: rgba(0, 0, 0, 0.05);
  color: var(--text-primary);
}

/* Platform Empty State */
.platform-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-lg);
  padding: var(--space-5xl) var(--space-2xl);
  text-align: center;
  background: var(--bg-secondary);
  border: 1px dashed var(--glass-border);
  border-radius: var(--radius-xl);
  margin-bottom: var(--space-2xl);
}

.platform-empty-state h3 {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  color: var(--text-primary);
  margin: 0;
}

.platform-empty-state p {
  font-size: var(--text-base);
  color: var(--text-secondary);
  margin: 0;
  max-width: 500px;
}

.create-post-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-xl);
  background: var(--gradient-gold);
  color: var(--text-on-gold);
  border: none;
  border-radius: var(--radius-lg);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  cursor: pointer;
  transition: var(--transition-base);
}

.create-post-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--glow-gold-md);
}

/* Responsive */
@media (max-width: 1200px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .analytics-view {
    padding: var(--space-md);
  }

  .section-divider {
    margin: var(--space-lg) 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .create-post-btn:hover {
    transform: none;
  }

  :deep(.reveal-card) {
    animation: none !important;
  }
}
</style>

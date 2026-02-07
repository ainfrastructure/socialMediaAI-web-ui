<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import AnalyticsKpiCard from './AnalyticsKpiCard.vue'
import type { TrendData } from '@/composables/useAnalyticsData'

interface Props {
  totalPosts: number
  savedContent: number
  scheduled: number
  published: number
  likes: number
  reach: number
  comments: number
  shares: number
  trendData?: {
    totalPosts: TrendData
    savedContent: TrendData
    scheduled: TrendData
    published: TrendData
    likes: TrendData
    reach: TrendData
    comments: TrendData
    shares: TrendData
  } | null
  sparklineData?: {
    totalPosts: number[]
    savedContent: number[]
    scheduled: number[]
    published: number[]
    likes: number[]
    reach: number[]
    comments: number[]
    shares: number[]
  }
}

const props = defineProps<Props>()
const { t } = useI18n()
</script>

<template>
  <div class="kpi-grid">
    <AnalyticsKpiCard
      icon="edit_note"
      :value="totalPosts"
      :label="t('analytics.totalPosts')"
      :trend="trendData?.totalPosts"
      :sparkline-data="sparklineData?.totalPosts"
    />
    <AnalyticsKpiCard
      icon="bookmark"
      :value="savedContent"
      :label="t('analytics.savedPosts')"
      :trend="trendData?.savedContent"
      :sparkline-data="sparklineData?.savedContent"
    />
    <AnalyticsKpiCard
      icon="schedule"
      :value="scheduled"
      :label="t('analytics.scheduledPosts')"
      :trend="trendData?.scheduled"
      :sparkline-data="sparklineData?.scheduled"
    />
    <AnalyticsKpiCard
      icon="check_circle"
      :value="published"
      :label="t('analytics.publishedPosts')"
      :trend="trendData?.published"
      :sparkline-data="sparklineData?.published"
    />
    <AnalyticsKpiCard
      icon="thumb_up"
      :value="likes"
      :label="t('analytics.likes')"
      :trend="trendData?.likes"
      :sparkline-data="sparklineData?.likes"
    />
    <AnalyticsKpiCard
      icon="visibility"
      :value="reach"
      :label="t('analytics.reach')"
      :trend="trendData?.reach"
      :sparkline-data="sparklineData?.reach"
    />
    <AnalyticsKpiCard
      icon="comment"
      :value="comments"
      :label="t('analytics.comments')"
      :trend="trendData?.comments"
      :sparkline-data="sparklineData?.comments"
    />
    <AnalyticsKpiCard
      icon="share"
      :value="shares"
      :label="t('analytics.shares')"
      :trend="trendData?.shares"
      :sparkline-data="sparklineData?.shares"
    />
  </div>
</template>

<style scoped>
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-lg);
  margin-bottom: var(--space-2xl);
}

@media (max-width: 1200px) {
  .kpi-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .kpi-grid {
    grid-template-columns: 1fr;
    gap: var(--space-sm);
  }
}
</style>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseCard from './BaseCard.vue'
import BaseAlert from './BaseAlert.vue'
import SectionHeader from './SectionHeader.vue'
import CompetitorCard from './CompetitorCard.vue'
import BasePagination from './BasePagination.vue'
import LoadingState from './LoadingState.vue'
import EmptyState from './EmptyState.vue'

interface Competitor {
  name: string
  address: string
  distance: number
  rating?: number
  user_ratings_total?: number
  types?: string[]
  place_id: string
}

interface CompetitorData {
  competitors: Competitor[]
  totalFound: number
  radiusKm: number
  searchCenter: {
    name: string
  }
}

interface Props {
  competitorData?: CompetitorData | null
  loading?: boolean
  error?: string | null
  currentPage: number
  perPage?: number
}

const props = withDefaults(defineProps<Props>(), {
  perPage: 5
})

const emit = defineEmits<{
  (e: 'update:currentPage', value: number): void
}>()

const { t } = useI18n()

const paginatedCompetitors = computed(() => {
  if (!props.competitorData?.competitors) return []
  const start = (props.currentPage - 1) * props.perPage
  const end = start + props.perPage
  return props.competitorData.competitors.slice(start, end)
})

const totalPages = computed(() => {
  if (!props.competitorData?.competitors) return 0
  return Math.ceil(props.competitorData.competitors.length / props.perPage)
})

const handlePageUpdate = (page: number) => {
  emit('update:currentPage', page)
}

const pluralSuffix = computed(() => {
  return props.competitorData && props.competitorData.totalFound === 1 ? '' : 's'
})
</script>

<template>
  <BaseCard variant="glass-intense" class="competitors-section">
    <SectionHeader
      :title="t('restaurantSearch.nearbyCompetitors')"
      :badge="competitorData ? {
        text: t('restaurantSearch.competitorsCount', {
          count: competitorData.totalFound,
          radius: competitorData.radiusKm
        }),
        variant: 'count'
      } : undefined"
    />

    <!-- Loading state -->
    <LoadingState
      v-if="loading"
      :message="t('restaurantSearch.findingCompetitors')"
    />

    <!-- Error state -->
    <BaseAlert v-else-if="error" type="info">
      {{ error }}
    </BaseAlert>

    <!-- Competitor list -->
    <div v-else-if="competitorData && competitorData.competitors.length > 0" class="competitors-content">
      <div class="competitors-info">
        <p class="competitors-description">
          {{ t('restaurantSearch.competitorsFound', {
            count: competitorData.totalFound,
            plural: pluralSuffix,
            name: competitorData.searchCenter.name
          }) }}
        </p>
      </div>

      <div class="competitors-list">
        <CompetitorCard
          v-for="(competitor, index) in paginatedCompetitors"
          :key="competitor.place_id"
          :competitor="competitor"
          :index="(currentPage - 1) * perPage + index + 1"
        />
      </div>

      <!-- Pagination -->
      <BasePagination
        v-if="totalPages > 1"
        :current-page="currentPage"
        @update:current-page="handlePageUpdate"
        :total-pages="totalPages"
        :total-items="competitorData.competitors.length"
      />
    </div>

    <!-- Empty state -->
    <EmptyState
      v-else
      :message="t('restaurantSearch.noCompetitorsFound', { radius: competitorData?.radiusKm || 5 })"
    />
  </BaseCard>
</template>

<style scoped>
.competitors-section {
  animation: fadeInUp 0.6s var(--ease-smooth);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.competitors-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

.competitors-info {
  padding: var(--space-lg);
  background: rgba(33, 150, 243, 0.1);
  border: 1px solid rgba(33, 150, 243, 0.2);
  border-radius: var(--radius-md);
}

.competitors-description {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.competitors-description strong {
  color: var(--text-primary);
  font-weight: var(--font-semibold);
}

.competitors-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .competitors-section {
    animation: none;
  }
}
</style>

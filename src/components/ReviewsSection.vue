<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseCard from './BaseCard.vue'
import SectionHeader from './SectionHeader.vue'
import ReviewCard from './ReviewCard.vue'
import BasePagination from './BasePagination.vue'

interface Review {
  author_name: string
  profile_photo_url?: string
  relative_time_description: string
  rating: number
  text: string
}

interface Props {
  reviews: Review[]
  currentPage: number
  perPage?: number
}

const props = withDefaults(defineProps<Props>(), {
  perPage: 3
})

const emit = defineEmits<{
  (e: 'update:currentPage', value: number): void
}>()

const { t } = useI18n()

const paginatedReviews = computed(() => {
  const start = (props.currentPage - 1) * props.perPage
  const end = start + props.perPage
  return props.reviews.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(props.reviews.length / props.perPage)
})

const handlePageUpdate = (page: number) => {
  emit('update:currentPage', page)
}
</script>

<template>
  <BaseCard v-if="reviews.length > 0" variant="glass-intense" class="reviews-section">
    <SectionHeader
      :title="t('restaurantSearch.customerReviews')"
      :badge="{ text: t('restaurantSearch.reviewsCount', { count: reviews.length }), variant: 'count' }"
    />

    <div class="reviews-list">
      <ReviewCard
        v-for="(review, index) in paginatedReviews"
        :key="index"
        :review="review"
      />
    </div>

    <!-- Pagination -->
    <BasePagination
      v-if="totalPages > 1"
      :current-page="currentPage"
      @update:current-page="handlePageUpdate"
      :total-pages="totalPages"
      :total-items="reviews.length"
    />
  </BaseCard>
</template>

<style scoped>
.reviews-section {
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

.reviews-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  margin-bottom: var(--space-xl);
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .reviews-section {
    animation: none;
  }
}
</style>

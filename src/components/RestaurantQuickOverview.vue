<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseCard from './BaseCard.vue'
import StatsGrid from './StatsGrid.vue'

interface PlaceDetails {
  rating?: number
  user_ratings_total?: number
  opening_hours?: {
    open_now?: boolean
  }
  reviews?: any[]
}

interface MenuData {
  items: any[]
  platform: string
}

interface CompetitorData {
  totalFound: number
  radiusKm: number
}

interface SocialMediaData {
  searchDetails: {
    totalFound: number
  }
}

interface Props {
  placeDetails: PlaceDetails | null
  menuData?: MenuData | null
  competitorData?: CompetitorData | null
  socialMediaData?: SocialMediaData | null
}

const props = defineProps<Props>()
const { t } = useI18n()

const stats = computed(() => {
  const result = []

  // Rating
  if (props.placeDetails?.rating) {
    result.push({
      icon: '⭐',
      label: t('restaurantSearch.rating'),
      value: props.placeDetails.rating,
      subtext: props.placeDetails.user_ratings_total
        ? `(${props.placeDetails.user_ratings_total} ${t('restaurantSearch.reviews')})`
        : undefined
    })
  }

  // Status
  if (props.placeDetails?.opening_hours?.open_now !== undefined) {
    result.push({
      icon: props.placeDetails.opening_hours.open_now ? '🟢' : '🔴',
      label: t('restaurantSearch.status'),
      value: props.placeDetails.opening_hours.open_now
        ? t('restaurantSearch.openNow')
        : t('restaurantSearch.closed')
    })
  }

  // Menu Items
  if (props.menuData?.items) {
    result.push({
      icon: '📋',
      label: t('restaurantSearch.menuItems'),
      value: props.menuData.items.length,
      subtext: `(${props.menuData.platform})`
    })
  }

  // Competitors
  if (props.competitorData?.totalFound) {
    result.push({
      icon: '🏪',
      label: t('restaurantSearch.competitors'),
      value: props.competitorData.totalFound,
      subtext: `(${props.competitorData.radiusKm}km)`
    })
  }

  // Reviews
  if (props.placeDetails?.reviews) {
    result.push({
      icon: '💬',
      label: t('restaurantSearch.reviews'),
      value: props.placeDetails.reviews.length
    })
  }

  // Social Media
  if (props.socialMediaData && props.socialMediaData.searchDetails.totalFound > 0) {
    result.push({
      icon: '🌐',
      label: t('restaurantSearch.socialMedia'),
      value: `${props.socialMediaData.searchDetails.totalFound} ${t('restaurantSearch.profiles')}`
    })
  }

  return result
})
</script>

<template>
  <div class="quick-overview-section">
    <BaseCard variant="glass-intense">
      <h3 class="quick-overview-title">{{ t('restaurantSearch.quickOverviewTitle') }}</h3>
      <StatsGrid :stats="stats" />
    </BaseCard>
  </div>
</template>

<style scoped>
.quick-overview-section {
  margin-top: var(--space-2xl);
  padding-top: var(--space-2xl);
  border-top: 1px solid rgba(212, 175, 55, 0.1);
  animation: fadeInUp 0.6s var(--ease-smooth);
}

.quick-overview-title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  margin: 0 0 var(--space-xl) 0;
  color: var(--text-primary);
  text-align: center;
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

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .quick-overview-section {
    animation: none;
  }
}
</style>

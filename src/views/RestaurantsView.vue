<script setup lang="ts">
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRestaurantsStore } from '@/stores/restaurants'
import DashboardLayout from '../components/DashboardLayout.vue'
import RestaurantManagementSection from '../components/RestaurantManagementSection.vue'

const { t } = useI18n()
const restaurantsStore = useRestaurantsStore()

onMounted(async () => {
  if (!restaurantsStore.restaurants.length) {
    await restaurantsStore.fetchRestaurants()
  }
})
</script>

<template>
  <DashboardLayout>
    <div class="restaurants-view">
      <div class="page-header">
        <h1 class="page-title">{{ $t('profile.manageRestaurants') }}</h1>
        <p class="page-subtitle">
          {{ $t('restaurantManagement.noRestaurantsHint') }}
        </p>
      </div>

      <RestaurantManagementSection />
    </div>
  </DashboardLayout>
</template>

<style scoped>
.restaurants-view {
  max-width: 1400px;
  margin: 0 auto;
  padding: var(--space-2xl);
  animation: fadeInUp 0.6s var(--ease-smooth);
}

.page-header {
  margin-bottom: var(--space-2xl);
}

.page-title {
  font-family: var(--font-heading);
  font-size: var(--text-4xl);
  color: var(--text-primary);
  margin-bottom: var(--space-sm);
}

.page-subtitle {
  font-size: var(--text-lg);
  color: var(--text-secondary);
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

@media (max-width: 768px) {
  .restaurants-view {
    padding: var(--space-xl) var(--space-md);
  }

  .page-title {
    font-size: var(--text-3xl);
  }

  .page-subtitle {
    font-size: var(--text-base);
  }
}

@media (prefers-reduced-motion: reduce) {
  .restaurants-view {
    animation: none;
  }
}
</style>

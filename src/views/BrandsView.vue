<script setup lang="ts">
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useBrandsStore } from '@/stores/brands'
import DashboardLayout from '../components/DashboardLayout.vue'
import BrandManagementSection from '../components/BrandManagementSection.vue'

const { t } = useI18n()
const brandsStore = useBrandsStore()

onMounted(async () => {
  if (!brandsStore.brands.length) {
    await brandsStore.fetchBrands()
  }
})
</script>

<template>
  <DashboardLayout>
    <div class="brands-view">
      <div class="page-header">
        <h1 class="page-title">{{ $t('profile.manageRestaurants') }}</h1>
        <p class="page-subtitle">
          {{ $t('restaurantManagement.noBrandsHint') }}
        </p>
      </div>

      <BrandManagementSection />
    </div>
  </DashboardLayout>
</template>

<style scoped>
.brands-view {
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
  .brands-view {
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
  .brands-view {
    animation: none;
  }
}
</style>

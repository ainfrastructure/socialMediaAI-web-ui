<script setup lang="ts">
import { onMounted } from 'vue'
import { useBusinessesStore } from '@/stores/businesses'
import DashboardLayout from '../components/DashboardLayout.vue'
import BusinessManagementSection from '../components/BusinessManagementSection.vue'

const businessesStore = useBusinessesStore()

onMounted(async () => {
  if (!businessesStore.businesses.length) {
    await businessesStore.fetchBusinesses()
  }
})
</script>

<template>
  <DashboardLayout>
    <div class="businesses-view">
      <div class="page-header">
        <h1 class="page-title">Businesses</h1>
        <p class="page-subtitle">
          Manage the businesses connected to your profile.
        </p>
      </div>

      <BusinessManagementSection />
    </div>
  </DashboardLayout>
</template>

<style scoped>
.businesses-view {
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
  .businesses-view {
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
  .businesses-view {
    animation: none;
  }
}
</style>

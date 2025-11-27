<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseCard from './BaseCard.vue'
import BaseAlert from './BaseAlert.vue'
import SectionHeader from './SectionHeader.vue'
import MenuItemCard from './MenuItemCard.vue'
import BasePagination from './BasePagination.vue'
import LoadingState from './LoadingState.vue'
import EmptyState from './EmptyState.vue'

interface MenuItem {
  name: string
  description: string
  price: string
  imageUrl?: string
}

interface MenuData {
  items: MenuItem[]
  platform: string
  url: string
  restaurantName: string
}

interface Props {
  menuData?: MenuData | null
  loading?: boolean
  error?: string | null
  currentPage: number
  perPage?: number
}

const props = withDefaults(defineProps<Props>(), {
  perPage: 12
})

const emit = defineEmits<{
  (e: 'update:currentPage', value: number): void
}>()

const { t } = useI18n()

const paginatedMenuItems = computed(() => {
  if (!props.menuData?.items) return []
  const start = (props.currentPage - 1) * props.perPage
  const end = start + props.perPage
  return props.menuData.items.slice(start, end)
})

const totalPages = computed(() => {
  if (!props.menuData?.items) return 0
  return Math.ceil(props.menuData.items.length / props.perPage)
})

const platformName = computed(() => {
  if (!props.menuData) return ''
  switch (props.menuData.platform) {
    case 'wolt':
      return 'Wolt'
    case 'foodora':
      return 'Foodora'
    case 'okam':
      return 'Okam'
    default:
      return props.menuData.platform
  }
})

const handlePageUpdate = (page: number) => {
  emit('update:currentPage', page)
}
</script>

<template>
  <BaseCard variant="glass-intense" class="menu-section">
    <SectionHeader
      :title="t('restaurantSearch.menu')"
      :badge="menuData ? {
        text: menuData.platform.toUpperCase(),
        variant: 'platform'
      } : undefined"
    />

    <!-- Loading state -->
    <LoadingState
      v-if="loading"
      :message="t('restaurantSearch.searchingMenu')"
    />

    <!-- Error state -->
    <BaseAlert v-else-if="error" type="warning">
      {{ error }}
    </BaseAlert>

    <!-- Menu items -->
    <div v-else-if="menuData && menuData.items.length > 0" class="menu-content">
      <div class="menu-info" :class="{ 'menu-info--okam': menuData.platform === 'okam' }">
        <p class="menu-source">
          {{ t('restaurantSearch.menuItemsFound', { count: menuData.items.length, platform: platformName }) }}
          <a v-if="menuData.url" :href="menuData.url" target="_blank" rel="noopener noreferrer" class="menu-link">
            {{ platformName }}
          </a>
          <span v-else class="menu-platform">{{ platformName }}</span>
        </p>
      </div>

      <div class="menu-items">
        <MenuItemCard
          v-for="(item, index) in paginatedMenuItems"
          :key="index"
          :item="item"
        />
      </div>

      <!-- Pagination -->
      <BasePagination
        v-if="totalPages > 1"
        :current-page="currentPage"
        @update:current-page="handlePageUpdate"
        :total-pages="totalPages"
        :total-items="menuData.items.length"
      />
    </div>

    <!-- Empty state -->
    <EmptyState
      v-else
      :message="t('restaurantSearch.selectRestaurantToViewMenu')"
    />
  </BaseCard>
</template>

<style scoped>
.menu-section {
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

.menu-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

.menu-info {
  padding: var(--space-lg);
  background: rgba(33, 150, 243, 0.1);
  border: 1px solid rgba(33, 150, 243, 0.2);
  border-radius: var(--radius-md);
}

.menu-info--okam {
  background: rgba(76, 175, 80, 0.1);
  border-color: rgba(76, 175, 80, 0.2);
}

.menu-source {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.menu-link {
  color: var(--gold-primary);
  text-decoration: none;
  font-weight: var(--font-semibold);
  transition: var(--transition-base);
  margin-left: 0.25rem;
}

.menu-link:hover {
  color: var(--gold-light);
  text-decoration: underline;
}

.menu-platform {
  color: var(--gold-primary);
  font-weight: var(--font-semibold);
  margin-left: 0.25rem;
}

.menu-items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-lg);
}

/* Responsive */
@media (max-width: 768px) {
  .menu-items {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  }
}

@media (max-width: 480px) {
  .menu-items {
    grid-template-columns: 1fr;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .menu-section {
    animation: none;
  }

  .menu-link {
    transition: none;
  }
}
</style>

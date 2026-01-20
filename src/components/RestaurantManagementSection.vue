<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRestaurantsStore } from '@/stores/restaurants'
import type { SavedRestaurant } from '@/services/restaurantService'
import BaseCard from './BaseCard.vue'
import BaseButton from './BaseButton.vue'
import CreateRestaurantModal from './CreateRestaurantModal.vue'
import ViewRestaurantModal from './ViewRestaurantModal.vue'

const { t } = useI18n()
const restaurantsStore = useRestaurantsStore()

const showCreateModal = ref(false)
const showViewModal = ref(false)
const selectedRestaurant = ref<SavedRestaurant | null>(null)

onMounted(async () => {
  if (!restaurantsStore.restaurants.length) {
    await restaurantsStore.fetchRestaurants()
  }
})

function viewRestaurant(restaurant: SavedRestaurant) {
  selectedRestaurant.value = restaurant
  showViewModal.value = true
}

function editRestaurant(restaurant: SavedRestaurant) {
  selectedRestaurant.value = restaurant
  showViewModal.value = true
}

async function confirmDelete(restaurant: SavedRestaurant) {
  const restaurantId = restaurant.place_id || restaurant.id
  if (confirm(t('restaurantManagement.deleteConfirmMessage', { name: restaurant.name }))) {
    await restaurantsStore.deleteRestaurant(restaurantId)
  }
}

async function handleRestaurantCreated() {
  showCreateModal.value = false
  await restaurantsStore.fetchRestaurants()
}

async function handleRestaurantUpdated() {
  console.log('Restaurant updated, refreshing list...')

  // Force a fresh fetch from the API
  await restaurantsStore.fetchRestaurants()

  console.log('Restaurants fetched:', restaurantsStore.restaurants.length)

  // Update the selectedRestaurant ref with fresh data from store
  if (selectedRestaurant.value) {
    const restaurantId = selectedRestaurant.value.place_id || selectedRestaurant.value.id
    console.log('Looking for restaurant with ID:', restaurantId)

    const updatedRestaurant = restaurantsStore.restaurants.find(
      r => (r.place_id || r.id) === restaurantId
    )

    if (updatedRestaurant) {
      console.log('Found updated restaurant:', updatedRestaurant.name, 'Logo:', updatedRestaurant.brand_dna?.logo_url)
      selectedRestaurant.value = updatedRestaurant
    } else {
      console.warn('Restaurant not found in store after update')
    }
  }
}

function handleModalClose() {
  selectedRestaurant.value = null
}
</script>

<template>
  <BaseCard variant="glass" class="section-card">
    <div class="section-header">
      <h2 class="section-title">{{ $t('profile.manageRestaurants') }}</h2>
      <BaseButton @click="showCreateModal = true" variant="primary" size="small">
        {{ $t('restaurantManagement.addRestaurant') }}
      </BaseButton>
    </div>

    <!-- Loading State -->
    <div v-if="restaurantsStore.loading && !restaurantsStore.restaurants.length" class="loading-state">
      {{ $t('common.loading') }}
    </div>

    <!-- Empty State -->
    <div v-else-if="!restaurantsStore.restaurants.length" class="empty-state">
      <div class="empty-icon">🏪</div>
      <h3>{{ $t('restaurantManagement.noRestaurants') }}</h3>
      <p>{{ $t('restaurantManagement.noRestaurantsHint') }}</p>
      <BaseButton @click="showCreateModal = true" variant="primary">
        {{ $t('restaurantManagement.addFirstRestaurant') }}
      </BaseButton>
    </div>

    <!-- Restaurants Grid -->
    <div v-else class="restaurants-grid">
      <div
        v-for="restaurant in restaurantsStore.restaurants"
        :key="restaurant.id"
        class="restaurant-card"
        @click="viewRestaurant(restaurant)"
      >
        <!-- Logo -->
        <div class="restaurant-logo">
          <img v-if="restaurant.brand_dna?.logo_url" :src="restaurant.brand_dna.logo_url" alt="Logo" />
          <div v-else class="logo-placeholder">
            {{ restaurant.name.charAt(0).toUpperCase() }}
          </div>
        </div>

        <!-- Info -->
        <div class="restaurant-info">
          <h3>{{ restaurant.name }}</h3>
          <p>{{ restaurant.address }}</p>

          <!-- Badges -->
          <div class="badges">
            <span v-if="restaurant.is_manual" class="badge badge-manual">
              {{ $t('restaurantManagement.manualEntry') }}
            </span>
            <span v-else class="badge badge-places">
              {{ $t('restaurantManagement.googlePlaces') }}
            </span>
            <span v-if="restaurant.uploaded_images?.length" class="badge badge-images">
              {{ $t('restaurantManagement.imagesCount', { count: restaurant.uploaded_images.length }) }}
            </span>
          </div>
        </div>

        <!-- Actions -->
        <div class="restaurant-actions" @click.stop>
          <BaseButton @click="editRestaurant(restaurant)" size="small" variant="ghost">
            {{ $t('common.edit') }}
          </BaseButton>
          <BaseButton @click="confirmDelete(restaurant)" size="small" variant="danger">
            {{ $t('common.delete') }}
          </BaseButton>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <Teleport to="body">
      <CreateRestaurantModal
        v-model="showCreateModal"
        @created="handleRestaurantCreated"
      />
      <ViewRestaurantModal
        v-if="selectedRestaurant"
        v-model="showViewModal"
        :restaurant="selectedRestaurant"
        @updated="handleRestaurantUpdated"
        @update:model-value="handleModalClose"
      />
    </Teleport>
  </BaseCard>
</template>

<style scoped>
.section-card {
  animation: fadeInUp 0.6s var(--ease-smooth);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-xl);
  padding-bottom: var(--space-lg);
  border-bottom: 1px solid rgba(15, 61, 46, 0.1);
}

.section-title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  color: var(--text-primary);
}

.loading-state,
.empty-state {
  padding: var(--space-3xl) var(--space-2xl);
  text-align: center;
}

.empty-icon {
  font-size: var(--text-5xl);
  margin-bottom: var(--space-lg);
}

.empty-state h3 {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  color: var(--text-primary);
  margin-bottom: var(--space-sm);
}

.empty-state p {
  color: var(--text-secondary);
  margin-bottom: var(--space-xl);
}

.restaurants-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--space-lg);
}

.restaurant-card {
  background: transparent;
  border: none;
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  cursor: pointer;
  transition: var(--transition-base);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.restaurant-card:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(15, 61, 46, 0.08);
}

.restaurant-logo {
  width: 60px;
  height: 60px;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.restaurant-logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.logo-placeholder {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--gold-primary);
}

.restaurant-info {
  flex: 1;
}

.restaurant-info h3 {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  color: var(--text-primary);
  margin-bottom: var(--space-xs);
}

.restaurant-info p {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin-bottom: var(--space-md);
}

.badges {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}

.badge {
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.badge-manual {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.badge-places {
  background: rgba(15, 61, 46, 0.2);
  color: var(--gold-primary);
  border: 1px solid rgba(15, 61, 46, 0.3);
}

.badge-images {
  background: rgba(168, 85, 247, 0.2);
  color: #a855f7;
  border: 1px solid rgba(168, 85, 247, 0.3);
}

.restaurant-actions {
  display: flex;
  gap: var(--space-sm);
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
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-md);
  }

  .restaurants-grid {
    grid-template-columns: 1fr;
  }

  .restaurant-actions {
    flex-direction: column;
  }
}

@media (prefers-reduced-motion: reduce) {
  .section-card,
  .restaurant-card {
    animation: none;
    transition: none;
  }
}
</style>

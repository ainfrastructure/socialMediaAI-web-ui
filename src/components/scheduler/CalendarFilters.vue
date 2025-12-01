<template>
  <div class="filter-accordion">
    <button class="filter-toggle" @click="expanded = !expanded">
      <span class="filter-toggle-left">
        <span class="filter-icon">🔍</span>
        <span class="filter-label">{{ $t('scheduler.filters', 'Filters') }}</span>
        <span v-if="activeFilterCount > 0" class="filter-badge">{{ activeFilterCount }}</span>
      </span>
      <span :class="['filter-arrow', { expanded }]">▼</span>
    </button>

    <div v-show="expanded" class="filter-content">
      <div class="inline-filters">
        <!-- Platform Filter -->
        <div class="inline-filter-group" @mouseleave="platformOpen = false">
          <button
            class="inline-filter-btn"
            @click.stop="platformOpen = !platformOpen; restaurantOpen = false"
          >
            <span class="inline-filter-icon">📱</span>
            <span class="inline-filter-label">{{ $t('scheduler.platforms', 'Platforms') }}</span>
            <span v-if="selectedPlatforms.length > 0" class="inline-filter-count">({{ selectedPlatforms.length }})</span>
            <span :class="['inline-filter-arrow', { open: platformOpen }]">▼</span>
          </button>
          <div v-show="platformOpen" class="inline-filter-options" @click.stop>
            <label class="filter-checkbox select-all">
              <input
                type="checkbox"
                :checked="selectedPlatforms.length === platforms.length"
                :indeterminate="selectedPlatforms.length > 0 && selectedPlatforms.length < platforms.length"
                @change="toggleAllPlatforms"
              />
              <span class="checkbox-label">{{ $t('common.selectAll', 'Select All') }}</span>
            </label>
            <div class="filter-divider"></div>
            <label
              v-for="platform in platforms"
              :key="platform.id"
              class="filter-checkbox"
            >
              <input
                type="checkbox"
                :checked="selectedPlatforms.includes(platform.id)"
                @change="togglePlatform(platform.id)"
              />
              <span class="checkbox-label">{{ platform.icon }} {{ platform.name }}</span>
            </label>
          </div>
        </div>

        <!-- Restaurant Filter -->
        <div class="inline-filter-group" @mouseleave="restaurantOpen = false">
          <button
            class="inline-filter-btn"
            @click.stop="restaurantOpen = !restaurantOpen; platformOpen = false"
          >
            <span class="inline-filter-icon">🏪</span>
            <span class="inline-filter-label">{{ $t('scheduler.restaurants', 'Restaurants') }}</span>
            <span v-if="selectedRestaurants.length > 0" class="inline-filter-count">({{ selectedRestaurants.length }})</span>
            <span :class="['inline-filter-arrow', { open: restaurantOpen }]">▼</span>
          </button>
          <div v-show="restaurantOpen" class="inline-filter-options" @click.stop>
            <label class="filter-checkbox select-all">
              <input
                type="checkbox"
                :checked="selectedRestaurants.length === restaurants.length"
                :indeterminate="selectedRestaurants.length > 0 && selectedRestaurants.length < restaurants.length"
                @change="toggleAllRestaurants"
              />
              <span class="checkbox-label">{{ $t('common.selectAll', 'Select All') }}</span>
            </label>
            <div class="filter-divider"></div>
            <label
              v-for="restaurant in restaurants"
              :key="restaurant.id"
              class="filter-checkbox"
            >
              <input
                type="checkbox"
                :checked="selectedRestaurants.includes(restaurant.id)"
                @change="toggleRestaurant(restaurant.id)"
              />
              <span class="checkbox-label">{{ restaurant.name }}</span>
            </label>
          </div>
        </div>

        <!-- Reset Button -->
        <button
          v-if="activeFilterCount > 0"
          class="reset-filters-btn"
          @click="resetFilters"
        >
          ✕ {{ $t('scheduler.resetFilters', 'Reset') }}
        </button>
      </div>

      <!-- Active Filters Display -->
      <div v-if="activeFilterCount > 0" class="active-filters">
        <span
          v-for="platformId in selectedPlatforms"
          :key="'p-' + platformId"
          class="active-filter-tag"
        >
          {{ getPlatformName(platformId) }}
          <button @click="removePlatform(platformId)">✕</button>
        </span>
        <span
          v-for="restaurantId in selectedRestaurants"
          :key="'r-' + restaurantId"
          class="active-filter-tag"
        >
          {{ getRestaurantName(restaurantId) }}
          <button @click="removeRestaurant(restaurantId)">✕</button>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Platform {
  id: string
  name: string
  icon: string
}

interface Restaurant {
  id: string
  name: string
}

const props = defineProps<{
  platforms: Platform[]
  restaurants: Restaurant[]
  selectedPlatforms: string[]
  selectedRestaurants: string[]
}>()

const emit = defineEmits<{
  (e: 'update:selectedPlatforms', value: string[]): void
  (e: 'update:selectedRestaurants', value: string[]): void
  (e: 'apply'): void
}>()

const expanded = ref(false)
const platformOpen = ref(false)
const restaurantOpen = ref(false)

const activeFilterCount = computed(() => {
  return props.selectedPlatforms.length + props.selectedRestaurants.length
})

const togglePlatform = (platformId: string) => {
  const current = [...props.selectedPlatforms]
  const index = current.indexOf(platformId)
  if (index === -1) {
    current.push(platformId)
  } else {
    current.splice(index, 1)
  }
  emit('update:selectedPlatforms', current)
  emit('apply')
}

const toggleAllPlatforms = () => {
  if (props.selectedPlatforms.length === props.platforms.length) {
    emit('update:selectedPlatforms', [])
  } else {
    emit('update:selectedPlatforms', props.platforms.map(p => p.id))
  }
  emit('apply')
}

const toggleRestaurant = (restaurantId: string) => {
  const current = [...props.selectedRestaurants]
  const index = current.indexOf(restaurantId)
  if (index === -1) {
    current.push(restaurantId)
  } else {
    current.splice(index, 1)
  }
  emit('update:selectedRestaurants', current)
  emit('apply')
}

const toggleAllRestaurants = () => {
  if (props.selectedRestaurants.length === props.restaurants.length) {
    emit('update:selectedRestaurants', [])
  } else {
    emit('update:selectedRestaurants', props.restaurants.map(r => r.id))
  }
  emit('apply')
}

const removePlatform = (platformId: string) => {
  emit('update:selectedPlatforms', props.selectedPlatforms.filter(id => id !== platformId))
  emit('apply')
}

const removeRestaurant = (restaurantId: string) => {
  emit('update:selectedRestaurants', props.selectedRestaurants.filter(id => id !== restaurantId))
  emit('apply')
}

const resetFilters = () => {
  emit('update:selectedPlatforms', [])
  emit('update:selectedRestaurants', [])
  emit('apply')
}

const getPlatformName = (platformId: string): string => {
  const platform = props.platforms.find(p => p.id === platformId)
  return platform ? `${platform.icon} ${platform.name}` : platformId
}

const getRestaurantName = (restaurantId: string): string => {
  const restaurant = props.restaurants.find(r => r.id === restaurantId)
  return restaurant?.name || restaurantId
}
</script>

<style scoped>
.filter-accordion {
  margin-bottom: var(--space-lg);
}

.filter-toggle {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-md) var(--space-lg);
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-base);
  color: var(--text-primary);
}

.filter-toggle:hover {
  background: rgba(212, 175, 55, 0.1);
  border-color: rgba(212, 175, 55, 0.3);
}

.filter-toggle-left {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.filter-icon {
  font-size: var(--text-lg);
}

.filter-label {
  font-weight: var(--font-semibold);
}

.filter-badge {
  background: var(--gold-primary);
  color: var(--text-on-gold);
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
  padding: 2px 8px;
  border-radius: var(--radius-full);
}

.filter-arrow {
  transition: transform var(--transition-base);
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.filter-arrow.expanded {
  transform: rotate(180deg);
}

.filter-content {
  padding: var(--space-lg);
  background: rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(212, 175, 55, 0.1);
  border-top: none;
  border-radius: 0 0 var(--radius-md) var(--radius-md);
}

.inline-filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-md);
  align-items: center;
}

.inline-filter-group {
  position: relative;
}

.inline-filter-btn {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-md);
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  cursor: pointer;
  transition: all var(--transition-base);
  font-size: var(--text-sm);
}

.inline-filter-btn:hover {
  background: rgba(212, 175, 55, 0.15);
  border-color: rgba(212, 175, 55, 0.3);
}

.inline-filter-icon {
  font-size: var(--text-base);
}

.inline-filter-count {
  color: var(--gold-primary);
  font-weight: var(--font-semibold);
}

.inline-filter-arrow {
  font-size: var(--text-xs);
  color: var(--text-secondary);
  transition: transform var(--transition-base);
}

.inline-filter-arrow.open {
  transform: rotate(180deg);
}

.inline-filter-options {
  position: absolute;
  top: 100%;
  left: 0;
  min-width: 200px;
  max-height: 300px;
  overflow-y: auto;
  margin-top: var(--space-xs);
  padding: var(--space-sm);
  background: var(--bg-secondary);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  z-index: 100;
}

.filter-checkbox {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: background var(--transition-base);
}

.filter-checkbox:hover {
  background: rgba(212, 175, 55, 0.1);
}

.filter-checkbox.select-all {
  font-weight: var(--font-semibold);
  color: var(--gold-primary);
}

.filter-checkbox input[type="checkbox"] {
  accent-color: var(--gold-primary);
}

.checkbox-label {
  font-size: var(--text-sm);
  color: var(--text-primary);
}

.filter-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: var(--space-sm) 0;
}

.reset-filters-btn {
  padding: var(--space-sm) var(--space-md);
  background: transparent;
  border: 1px solid rgba(255, 59, 48, 0.3);
  border-radius: var(--radius-md);
  color: #ff3b30;
  cursor: pointer;
  font-size: var(--text-sm);
  transition: all var(--transition-base);
}

.reset-filters-btn:hover {
  background: rgba(255, 59, 48, 0.1);
  border-color: #ff3b30;
}

.active-filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  margin-top: var(--space-md);
  padding-top: var(--space-md);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.active-filter-tag {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-sm);
  background: rgba(212, 175, 55, 0.2);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  color: var(--gold-primary);
}

.active-filter-tag button {
  background: none;
  border: none;
  color: var(--gold-primary);
  cursor: pointer;
  padding: 0;
  font-size: var(--text-xs);
  opacity: 0.7;
  transition: opacity var(--transition-base);
}

.active-filter-tag button:hover {
  opacity: 1;
}

@media (max-width: 768px) {
  .inline-filters {
    flex-direction: column;
    align-items: stretch;
  }

  .inline-filter-btn {
    width: 100%;
    justify-content: space-between;
  }

  .inline-filter-options {
    position: static;
    margin-top: var(--space-sm);
  }
}
</style>

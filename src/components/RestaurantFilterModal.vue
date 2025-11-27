<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal-overlay" @click.self="close">
        <div class="modal-container">
          <BaseCard variant="glass-intense" class="modal-card">
            <!-- Header -->
            <div class="modal-header">
              <div class="header-icon">🏪</div>
              <h2 class="modal-title">Select Restaurants</h2>
              <button class="close-btn" @click="close">×</button>
            </div>

            <!-- Search Bar -->
            <div class="search-container">
              <div class="search-wrapper">
                <span class="search-icon">🔍</span>
                <input
                  v-model="searchQuery"
                  type="text"
                  class="search-input"
                  placeholder="Search restaurants..."
                />
              </div>
            </div>

            <!-- Selected Count -->
            <div v-if="selectedCount > 0" class="selected-count">
              {{ selectedCount }} restaurant{{ selectedCount !== 1 ? 's' : '' }} selected
            </div>

            <!-- Restaurant Grid -->
            <div class="restaurants-grid">
              <div
                v-for="restaurant in filteredRestaurants"
                :key="restaurant.id"
                :class="['restaurant-card', { selected: isSelected(restaurant.id) }]"
                @click="toggleRestaurant(restaurant.id)"
              >
                <!-- Checkbox -->
                <div class="checkbox-wrapper">
                  <input
                    type="checkbox"
                    :checked="isSelected(restaurant.id)"
                    class="checkbox-input"
                    @click.stop
                  />
                  <span class="checkbox-custom"></span>
                </div>

                <!-- Restaurant Logo/Image -->
                <div class="restaurant-logo">
                  <img
                    v-if="restaurant.brand_dna?.logo_url"
                    :src="restaurant.brand_dna.logo_url"
                    :alt="restaurant.name"
                    class="logo-image"
                    @error="handleImageError($event, restaurant)"
                  />
                  <div v-else class="logo-placeholder">
                    {{ getInitials(restaurant.name) }}
                  </div>
                </div>

                <!-- Restaurant Info -->
                <div class="restaurant-info">
                  <h3 class="restaurant-name">{{ restaurant.name }}</h3>
                  <p v-if="restaurant.city || restaurant.address" class="restaurant-location">
                    📍 {{ restaurant.city || restaurant.address }}
                  </p>
                </div>

                <!-- Social Media Platforms -->
                <div v-if="restaurant.platforms && restaurant.platforms.length > 0" class="platforms">
                  <span
                    v-for="platform in restaurant.platforms"
                    :key="platform"
                    :class="['platform-icon', `platform-${platform}`]"
                    :title="platform"
                  >
                    {{ getPlatformEmoji(platform) }}
                  </span>
                </div>
              </div>

              <!-- Empty State -->
              <div v-if="filteredRestaurants.length === 0" class="empty-state">
                <div class="empty-icon">🔍</div>
                <p class="empty-text">No restaurants found</p>
                <p class="empty-hint">Try a different search term</p>
              </div>
            </div>

            <!-- Footer Actions -->
            <div class="modal-footer">
              <BaseButton variant="ghost" @click="clearSelection">
                Clear All
              </BaseButton>
              <BaseButton variant="primary" @click="close">
                Apply Filters
              </BaseButton>
            </div>
          </BaseCard>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import BaseCard from './BaseCard.vue'
import BaseButton from './BaseButton.vue'

interface Restaurant {
  id: string
  name: string
  brand_dna?: {
    logo_url?: string
    brand_name?: string
  }
  location?: string
  city?: string
  address?: string
  platforms?: string[]
}

interface Props {
  modelValue: boolean
  restaurants: Restaurant[]
  selectedRestaurantIds: string[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'update:selectedRestaurantIds', value: string[]): void
}>()

const searchQuery = ref('')

const filteredRestaurants = computed(() => {
  if (!searchQuery.value.trim()) {
    return props.restaurants
  }
  const query = searchQuery.value.toLowerCase()
  return props.restaurants.filter((restaurant) =>
    restaurant.name.toLowerCase().includes(query) ||
    restaurant.location?.toLowerCase().includes(query) ||
    restaurant.city?.toLowerCase().includes(query) ||
    restaurant.address?.toLowerCase().includes(query)
  )
})

const selectedCount = computed(() => props.selectedRestaurantIds.length)

const isSelected = (id: string) => {
  return props.selectedRestaurantIds.includes(id)
}

const toggleRestaurant = (id: string) => {
  const currentIds = [...props.selectedRestaurantIds]
  const index = currentIds.indexOf(id)

  if (index > -1) {
    currentIds.splice(index, 1)
  } else {
    currentIds.push(id)
  }

  emit('update:selectedRestaurantIds', currentIds)
}

const clearSelection = () => {
  emit('update:selectedRestaurantIds', [])
}

const close = () => {
  emit('update:modelValue', false)
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const getPlatformEmoji = (platform: string) => {
  const emojis: Record<string, string> = {
    instagram: '📷',
    facebook: '👥',
    tiktok: '🎵',
    twitter: '🐦',
    linkedin: '💼',
  }
  return emojis[platform] || '📱'
}

const handleImageError = (event: Event, restaurant: Restaurant) => {
  const img = event.target as HTMLImageElement
  // Hide the broken image and show placeholder instead
  img.style.display = 'none'
  console.warn(`Failed to load logo for restaurant: ${restaurant.name}`)
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--space-xl);
}

.modal-container {
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  animation: modalSlideUp 0.3s ease;
}

@keyframes modalSlideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-card {
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  padding: 0;
  overflow: hidden;
}

/* Header */
.modal-header {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-xl);
  border-bottom: 1px solid rgba(212, 175, 55, 0.15);
  background: linear-gradient(135deg, rgba(20, 20, 20, 0.8), rgba(30, 30, 30, 0.8));
}

.header-icon {
  font-size: 1.75rem;
  filter: drop-shadow(0 2px 4px rgba(212, 175, 55, 0.3));
}

.modal-title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  color: var(--gold-primary);
  margin: 0;
  flex: 1;
}

.close-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: rgba(212, 175, 55, 0.1);
  color: var(--gold-primary);
  font-size: 1.5rem;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.close-btn:hover {
  background: rgba(212, 175, 55, 0.2);
  transform: rotate(90deg);
}

/* Search */
.search-container {
  padding: var(--space-lg) var(--space-xl);
  border-bottom: 1px solid rgba(212, 175, 55, 0.1);
}

.search-wrapper {
  position: relative;
}

.search-icon {
  position: absolute;
  left: var(--space-md);
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.25rem;
  opacity: 0.5;
}

.search-input {
  width: 100%;
  padding: var(--space-md) var(--space-md) var(--space-md) 3rem;
  background: rgba(10, 10, 10, 0.8);
  border: 1px solid rgba(212, 175, 55, 0.25);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--text-base);
  font-family: var(--font-body);
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--gold-primary);
  box-shadow: 0 0 20px rgba(212, 175, 55, 0.2);
}

.search-input::placeholder {
  color: var(--text-muted);
}

/* Selected Count */
.selected-count {
  padding: var(--space-sm) var(--space-xl);
  background: rgba(212, 175, 55, 0.1);
  border-bottom: 1px solid rgba(212, 175, 55, 0.1);
  color: var(--gold-light);
  font-size: var(--text-sm);
  font-weight: 600;
  text-align: center;
}

/* Restaurant Grid */
.restaurants-grid {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-xl);
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-lg);
  align-content: start;
}

.restaurants-grid::-webkit-scrollbar {
  width: 8px;
}

.restaurants-grid::-webkit-scrollbar-track {
  background: rgba(10, 10, 10, 0.5);
  border-radius: 4px;
}

.restaurants-grid::-webkit-scrollbar-thumb {
  background: rgba(212, 175, 55, 0.3);
  border-radius: 4px;
}

.restaurants-grid::-webkit-scrollbar-thumb:hover {
  background: rgba(212, 175, 55, 0.5);
}

/* Restaurant Card */
.restaurant-card {
  position: relative;
  padding: var(--space-lg);
  background: rgba(20, 20, 20, 0.6);
  border: 2px solid rgba(212, 175, 55, 0.15);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.restaurant-card:hover {
  border-color: rgba(212, 175, 55, 0.4);
  background: rgba(20, 20, 20, 0.8);
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4), 0 0 20px rgba(212, 175, 55, 0.15);
}

.restaurant-card.selected {
  border-color: var(--gold-primary);
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.1), rgba(212, 175, 55, 0.05));
  box-shadow: 0 0 24px rgba(212, 175, 55, 0.2);
}

/* Checkbox */
.checkbox-wrapper {
  position: absolute;
  top: var(--space-md);
  right: var(--space-md);
}

.checkbox-input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
}

.checkbox-custom {
  width: 22px;
  height: 22px;
  border: 2px solid rgba(212, 175, 55, 0.4);
  border-radius: var(--radius-sm);
  display: block;
  position: relative;
  transition: all 0.2s ease;
}

.restaurant-card.selected .checkbox-custom {
  background: var(--gradient-gold);
  border-color: var(--gold-primary);
}

.restaurant-card.selected .checkbox-custom::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: var(--text-on-gold);
  font-size: 14px;
  font-weight: bold;
}

/* Restaurant Logo */
.restaurant-logo {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: rgba(10, 10, 10, 0.5);
  border: 1px solid rgba(212, 175, 55, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.logo-placeholder {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: bold;
  color: var(--gold-primary);
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

/* Restaurant Info */
.restaurant-info {
  flex: 1;
}

.restaurant-name {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  color: var(--text-primary);
  margin: 0 0 var(--space-xs) 0;
  font-weight: 600;
}

.restaurant-location {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: 0;
}

/* Platforms */
.platforms {
  display: flex;
  gap: var(--space-xs);
  flex-wrap: wrap;
}

.platform-icon {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  background: rgba(10, 10, 10, 0.6);
  border: 1px solid rgba(212, 175, 55, 0.2);
  transition: all 0.2s ease;
}

.platform-icon:hover {
  transform: scale(1.1);
  border-color: var(--gold-primary);
}

/* Empty State */
.empty-state {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-5xl) var(--space-xl);
  text-align: center;
}

.empty-icon {
  font-size: 4rem;
  opacity: 0.3;
  margin-bottom: var(--space-lg);
}

.empty-text {
  font-size: var(--text-xl);
  color: var(--text-primary);
  margin: 0 0 var(--space-sm) 0;
}

.empty-hint {
  font-size: var(--text-sm);
  color: var(--text-muted);
  margin: 0;
}

/* Footer */
.modal-footer {
  display: flex;
  justify-content: space-between;
  gap: var(--space-md);
  padding: var(--space-xl);
  border-top: 1px solid rgba(212, 175, 55, 0.15);
  background: linear-gradient(135deg, rgba(20, 20, 20, 0.8), rgba(30, 30, 30, 0.8));
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .modal-overlay {
    padding: var(--space-md);
  }

  .restaurants-grid {
    grid-template-columns: 1fr;
    padding: var(--space-md);
  }

  .modal-footer {
    flex-direction: column;
  }

  .modal-footer button {
    width: 100%;
  }
}
</style>

<template>
  <div class="restaurant-search-view">
    <GradientBackground />

    <div class="container">
      <div class="header">
        <h1 class="title">Restaurant Search</h1>
        <p class="subtitle">
          Search for restaurants using Google Places. Perfect for finding dining options!
        </p>
      </div>

      <BaseCard variant="glass-intense" class="search-card">
        <div class="search-section">
          <RestaurantAutocomplete
            v-model="selectedRestaurant"
            label="Search for a restaurant"
            placeholder="Try 'pizza oslo' or 'italian restaurant'..."
            @select="handleRestaurantSelect"
          />

          <div v-if="selectedRestaurant" class="selected-info">
            <div class="info-label">Selected Restaurant</div>
            <BaseCard variant="glass" class="restaurant-card">
              <div class="restaurant-details">
                <div class="detail-row">
                  <span class="detail-label">Name:</span>
                  <span class="detail-value">{{ selectedRestaurant.name }}</span>
                </div>

                <div class="detail-row">
                  <span class="detail-label">Address:</span>
                  <span class="detail-value">{{ selectedRestaurant.address }}</span>
                </div>

                <div class="detail-row">
                  <span class="detail-label">Place ID:</span>
                  <span class="detail-value mono">{{ selectedRestaurant.place_id }}</span>
                </div>

                <div v-if="selectedRestaurant.types && selectedRestaurant.types.length > 0" class="detail-row">
                  <span class="detail-label">Types:</span>
                  <div class="type-tags">
                    <span
                      v-for="type in selectedRestaurant.types"
                      :key="type"
                      class="type-tag"
                    >
                      {{ formatType(type) }}
                    </span>
                  </div>
                </div>

                <!-- Opening Hours -->
                <div v-if="placeDetails" class="detail-row">
                  <span class="detail-label">Opening Hours:</span>
                  <div v-if="loadingDetails" class="loading-text">
                    Loading hours...
                  </div>
                  <div v-else-if="placeDetails.opening_hours" class="opening-hours">
                    <div v-if="placeDetails.opening_hours.open_now !== undefined" class="status-badge" :class="{ 'open': placeDetails.opening_hours.open_now, 'closed': !placeDetails.opening_hours.open_now }">
                      {{ placeDetails.opening_hours.open_now ? '🟢 Open Now' : '🔴 Closed' }}
                    </div>
                    <div v-if="placeDetails.opening_hours.weekday_text && placeDetails.opening_hours.weekday_text.length > 0" class="hours-list">
                      <div
                        v-for="(day, index) in placeDetails.opening_hours.weekday_text"
                        :key="index"
                        class="hours-item"
                      >
                        {{ day }}
                      </div>
                    </div>
                  </div>
                  <div v-else class="no-hours">
                    Hours not available
                  </div>
                </div>

                <!-- Additional Details -->
                <div v-if="placeDetails && placeDetails.rating" class="detail-row">
                  <span class="detail-label">Rating:</span>
                  <span class="detail-value">
                    ⭐ {{ placeDetails.rating }} / 5
                    <span v-if="placeDetails.user_ratings_total" class="rating-count">
                      ({{ placeDetails.user_ratings_total }} reviews)
                    </span>
                  </span>
                </div>

                <div v-if="placeDetails && placeDetails.phone_number" class="detail-row">
                  <span class="detail-label">Phone:</span>
                  <span class="detail-value">{{ placeDetails.phone_number }}</span>
                </div>

                <div v-if="placeDetails && placeDetails.website" class="detail-row">
                  <span class="detail-label">Website:</span>
                  <a :href="placeDetails.website" target="_blank" rel="noopener noreferrer" class="website-link">
                    {{ placeDetails.website }}
                  </a>
                </div>
              </div>

              <div class="actions">
                <BaseButton
                  variant="secondary"
                  size="medium"
                  @click="clearSelection"
                >
                  Clear Selection
                </BaseButton>

                <BaseButton
                  variant="primary"
                  size="medium"
                  @click="useRestaurant"
                >
                  Use Restaurant
                </BaseButton>
              </div>
            </BaseCard>
          </div>
        </div>
      </BaseCard>

      <!-- Reviews Section -->
      <BaseCard v-if="placeDetails && placeDetails.reviews && placeDetails.reviews.length > 0" variant="glass-intense" class="reviews-card">
        <div class="reviews-header">
          <h2 class="reviews-title">Customer Reviews</h2>
          <span class="reviews-count">{{ placeDetails.reviews.length }} reviews</span>
        </div>

        <div class="reviews-list">
          <div
            v-for="(review, index) in paginatedReviews"
            :key="index"
            class="review-item"
          >
            <div class="review-header">
              <div class="review-author">
                <img
                  v-if="review.profile_photo_url"
                  :src="review.profile_photo_url"
                  :alt="review.author_name"
                  class="author-photo"
                />
                <div v-else class="author-photo-placeholder">
                  {{ review.author_name.charAt(0).toUpperCase() }}
                </div>
                <div class="author-info">
                  <span class="author-name">{{ review.author_name }}</span>
                  <span class="review-time">{{ review.relative_time_description }}</span>
                </div>
              </div>
              <div class="review-rating">
                <span v-for="star in 5" :key="star" class="star" :class="{ 'filled': star <= review.rating }">
                  {{ star <= review.rating ? '★' : '☆' }}
                </span>
              </div>
            </div>
            <p class="review-text">{{ review.text }}</p>
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="pagination">
          <button
            class="pagination-btn"
            :disabled="currentPage === 1"
            @click="currentPage--"
          >
            ← Previous
          </button>
          <span class="pagination-info">
            Page {{ currentPage }} of {{ totalPages }}
          </span>
          <button
            class="pagination-btn"
            :disabled="currentPage === totalPages"
            @click="currentPage++"
          >
            Next →
          </button>
        </div>
      </BaseCard>

      <!-- Menu Section -->
      <BaseCard v-if="selectedRestaurant" variant="glass-intense" class="menu-card">
        <div class="menu-header">
          <h2 class="menu-title">Menu</h2>
          <span v-if="menuData" class="menu-platform-badge">
            {{ menuData.platform.toUpperCase() }}
          </span>
        </div>

        <!-- Loading state -->
        <div v-if="loadingMenu" class="menu-loading">
          <div class="spinner"></div>
          <p>Searching for menu on Wolt and Foodora...</p>
        </div>

        <!-- Error state -->
        <BaseAlert v-else-if="menuError" type="warning">
          {{ menuError }}
        </BaseAlert>

        <!-- Menu items -->
        <div v-else-if="menuData && menuData.items.length > 0" class="menu-content">
          <div class="menu-info">
            <p class="menu-source">
              Found {{ menuData.items.length }} items from
              <a :href="menuData.url" target="_blank" rel="noopener noreferrer" class="menu-link">
                {{ menuData.platform === 'wolt' ? 'Wolt' : 'Foodora' }}
              </a>
            </p>
          </div>

          <div class="menu-items">
            <MenuItemCard
              v-for="(item, index) in menuData.items"
              :key="index"
              :item="item"
            />
          </div>
        </div>

        <!-- Empty state -->
        <div v-else class="menu-empty">
          <p>Select a restaurant to view its menu</p>
        </div>
      </BaseCard>

      <BaseCard variant="glass" class="info-card">
        <h3 class="info-title">How to use</h3>
        <ul class="info-list">
          <li>Start typing a restaurant name or cuisine type (e.g., "pizza", "sushi", "italian")</li>
          <li>You can include a location to narrow results (e.g., "pizza oslo")</li>
          <li>Use arrow keys to navigate suggestions and Enter to select</li>
          <li>The search automatically filters to show only restaurants</li>
          <li>Results are powered by Google Places API</li>
        </ul>
      </BaseCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import GradientBackground from '../components/GradientBackground.vue'
import BaseCard from '../components/BaseCard.vue'
import BaseButton from '../components/BaseButton.vue'
import BaseAlert from '../components/BaseAlert.vue'
import RestaurantAutocomplete from '../components/RestaurantAutocomplete.vue'
import MenuItemCard from '../components/MenuItemCard.vue'
import type { RestaurantSuggestion, PlaceDetails } from '../services/placesService'
import { placesService } from '../services/placesService'
import { menuService, type MenuData } from '../services/menuService'

const selectedRestaurant = ref<RestaurantSuggestion | null>(null)
const placeDetails = ref<PlaceDetails | null>(null)
const loadingDetails = ref(false)
const menuData = ref<MenuData | null>(null)
const loadingMenu = ref(false)
const menuError = ref<string | null>(null)

// Pagination for reviews
const currentPage = ref(1)
const reviewsPerPage = 3

const paginatedReviews = computed(() => {
  if (!placeDetails.value?.reviews) return []
  const start = (currentPage.value - 1) * reviewsPerPage
  const end = start + reviewsPerPage
  return placeDetails.value.reviews.slice(start, end)
})

const totalPages = computed(() => {
  if (!placeDetails.value?.reviews) return 0
  return Math.ceil(placeDetails.value.reviews.length / reviewsPerPage)
})

const handleRestaurantSelect = async (restaurant: RestaurantSuggestion) => {
  console.log('Selected restaurant:', restaurant)

  // Clear previous data
  menuData.value = null
  menuError.value = null
  placeDetails.value = null
  currentPage.value = 1 // Reset to first page

  // Fetch place details (including opening hours) and menu in parallel
  await Promise.all([
    fetchPlaceDetails(restaurant.place_id),
    fetchMenu(restaurant.place_id, restaurant.name)
  ])
}

const fetchPlaceDetails = async (placeId: string) => {
  try {
    loadingDetails.value = true
    const details = await placesService.getPlaceDetails(placeId)
    placeDetails.value = details
  } catch (error: any) {
    console.error('Error fetching place details:', error)
    // Don't show error to user, just log it
  } finally {
    loadingDetails.value = false
  }
}

const fetchMenu = async (placeId: string, restaurantName: string) => {
  try {
    loadingMenu.value = true
    menuError.value = null

    // Pass placeId to automatically include address in search
    const data = await menuService.getRestaurantMenu(placeId, restaurantName)
    menuData.value = data

    if (!data || data.items.length === 0) {
      menuError.value = 'No menu found for this restaurant'
    }
  } catch (error: any) {
    console.error('Error fetching menu:', error)
    menuError.value = error.message || 'Failed to fetch menu. The restaurant may not be available on Wolt or Foodora.'
  } finally {
    loadingMenu.value = false
  }
}

const clearSelection = () => {
  selectedRestaurant.value = null
  placeDetails.value = null
  menuData.value = null
  menuError.value = null
  currentPage.value = 1
}

const useRestaurant = () => {
  if (selectedRestaurant.value) {
    console.log('Using restaurant:', selectedRestaurant.value)
    console.log('Menu data:', menuData.value)
    alert(`You selected: ${selectedRestaurant.value.name}\n\nPlace ID: ${selectedRestaurant.value.place_id}\n\nMenu items: ${menuData.value?.items.length || 0}`)
  }
}

const formatType = (type: string): string => {
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
</script>

<style scoped>
.restaurant-search-view {
  min-height: 100vh;
  position: relative;
  padding: 2rem 1rem;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.header {
  text-align: center;
  margin-bottom: 3rem;
}

.title {
  font-family: var(--font-display);
  font-size: 3rem;
  font-weight: 700;
  margin: 0 0 1rem 0;
  background: linear-gradient(135deg, var(--text-primary) 0%, var(--accent-gold) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  font-size: 1.125rem;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.6;
}

.search-card {
  margin-bottom: 2rem;
  padding: 2rem;
  position: relative;
  z-index: 10;
}

.search-section {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.selected-info {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-label {
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--accent-gold);
}

.restaurant-card {
  padding: 1.5rem;
}

.restaurant-details {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.detail-row {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
}

.detail-value {
  font-size: 1rem;
  color: var(--text-primary);
}

.detail-value.mono {
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  color: var(--accent-gold);
  word-break: break-all;
}

.type-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.type-tag {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: rgba(212, 175, 55, 0.15);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--accent-gold);
  transition: all 0.2s ease;
}

.type-tag:hover {
  background: rgba(212, 175, 55, 0.25);
  border-color: rgba(212, 175, 55, 0.5);
}

.loading-text {
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-style: italic;
}

.opening-hours {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.status-badge {
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
  align-self: flex-start;
}

.status-badge.open {
  background: rgba(34, 197, 94, 0.15);
  border: 1px solid rgba(34, 197, 94, 0.3);
  color: #22c55e;
}

.status-badge.closed {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444;
}

.hours-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.hours-item {
  font-size: 0.875rem;
  color: var(--text-secondary);
  padding: 0.25rem 0;
}

.no-hours {
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-style: italic;
}

.website-link {
  color: var(--accent-gold);
  text-decoration: none;
  font-size: 1rem;
  transition: all 0.2s ease;
  word-break: break-all;
}

.website-link:hover {
  text-decoration: underline;
  color: var(--text-primary);
}

.actions {
  display: flex;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(212, 175, 55, 0.1);
}

.actions button {
  flex: 1;
}

.rating-count {
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-weight: normal;
  margin-left: 0.5rem;
}

/* Reviews Section */
.reviews-card {
  margin-bottom: 2rem;
  padding: 2rem;
}

.reviews-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(212, 175, 55, 0.2);
}

.reviews-title {
  font-family: var(--font-display);
  font-size: 1.75rem;
  font-weight: 600;
  margin: 0;
  color: var(--accent-gold);
}

.reviews-count {
  padding: 0.5rem 1rem;
  background: rgba(212, 175, 55, 0.15);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--accent-gold);
}

.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.review-item {
  padding: 1.5rem;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(212, 175, 55, 0.1);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.review-item:hover {
  background: rgba(0, 0, 0, 0.3);
  border-color: rgba(212, 175, 55, 0.3);
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.review-author {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.author-photo {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(212, 175, 55, 0.3);
}

.author-photo-placeholder {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent-gold) 0%, #b8860b 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--background-primary);
  border: 2px solid rgba(212, 175, 55, 0.3);
}

.author-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.author-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.review-time {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.review-rating {
  display: flex;
  gap: 0.25rem;
}

.star {
  font-size: 1.25rem;
  color: var(--text-secondary);
}

.star.filled {
  color: var(--accent-gold);
}

.review-text {
  font-size: 1rem;
  line-height: 1.6;
  color: var(--text-secondary);
  margin: 0;
  white-space: pre-wrap;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(212, 175, 55, 0.1);
}

.pagination-btn {
  padding: 0.75rem 1.5rem;
  background: rgba(212, 175, 55, 0.1);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 8px;
  color: var(--accent-gold);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.pagination-btn:hover:not(:disabled) {
  background: rgba(212, 175, 55, 0.2);
  border-color: rgba(212, 175, 55, 0.5);
  transform: translateY(-2px);
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.info-card {
  padding: 1.5rem;
}

.info-title {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  color: var(--accent-gold);
}

.info-list {
  margin: 0;
  padding-left: 1.5rem;
  color: var(--text-secondary);
  line-height: 1.8;
}

.info-list li {
  margin-bottom: 0.5rem;
}

.info-list li:last-child {
  margin-bottom: 0;
}

/* Menu Section */
.menu-card {
  margin-bottom: 2rem;
  padding: 2rem;
}

.menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(212, 175, 55, 0.2);
}

.menu-title {
  font-family: var(--font-display);
  font-size: 1.75rem;
  font-weight: 600;
  margin: 0;
  color: var(--accent-gold);
}

.menu-platform-badge {
  padding: 0.5rem 1rem;
  background: rgba(212, 175, 55, 0.2);
  border: 1px solid rgba(212, 175, 55, 0.4);
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--accent-gold);
  letter-spacing: 0.05em;
}

.menu-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  gap: 1rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(212, 175, 55, 0.2);
  border-top-color: var(--accent-gold);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.menu-loading p {
  color: var(--text-secondary);
  margin: 0;
}

.menu-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.menu-info {
  padding: 1rem;
  background: rgba(212, 175, 55, 0.1);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: 8px;
}

.menu-source {
  margin: 0;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.menu-link {
  color: var(--accent-gold);
  text-decoration: none;
  font-weight: 600;
  transition: all 0.2s ease;
}

.menu-link:hover {
  text-decoration: underline;
  color: var(--text-primary);
}

.menu-items {
  display: grid;
  gap: 1rem;
}

.menu-empty {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
}

.menu-empty p {
  margin: 0;
}

/* Responsive Design */
@media (max-width: 768px) {
  .title {
    font-size: 2rem;
  }

  .subtitle {
    font-size: 1rem;
  }

  .search-card {
    padding: 1.5rem;
  }

  .actions {
    flex-direction: column;
  }

  .actions button {
    width: 100%;
  }
}
</style>

<template>
  <div class="saved-restaurants-view">
    <GradientBackground />

    <div class="container">
      <div class="header">
        <h1 class="title">Saved Restaurants</h1>
        <p class="subtitle">
          View and manage your saved restaurant data
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <div class="spinner"></div>
        <p>Loading saved restaurants...</p>
      </div>

      <!-- Error State -->
      <BaseAlert v-else-if="error" type="error">
        {{ error }}
      </BaseAlert>

      <!-- Empty State -->
      <BaseCard v-else-if="restaurants.length === 0" variant="glass-intense" class="empty-state">
        <div class="empty-content">
          <h3>No saved restaurants yet</h3>
          <p>Start by searching for restaurants and saving them to your collection.</p>
          <BaseButton variant="primary" @click="goToSearch">
            Search Restaurants
          </BaseButton>
        </div>
      </BaseCard>

      <!-- Restaurants Grid -->
      <div v-else class="restaurants-grid">
        <BaseCard
          v-for="restaurant in restaurants"
          :key="restaurant.id"
          variant="glass"
          hoverable
          class="restaurant-card"
          @click="selectRestaurant(restaurant)"
        >
          <div class="card-header">
            <h3 class="restaurant-name">{{ restaurant.name }}</h3>
            <button class="delete-btn" @click.stop="confirmDelete(restaurant)" title="Delete">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </div>

          <p class="restaurant-address">{{ restaurant.address }}</p>

          <div class="restaurant-meta">
            <div v-if="restaurant.rating" class="meta-item">
              <span class="meta-icon">⭐</span>
              <span>{{ restaurant.rating }} / 5</span>
            </div>

            <div v-if="restaurant.reviews && restaurant.reviews.length > 0" class="meta-item">
              <span class="meta-icon">💬</span>
              <span>{{ restaurant.reviews.length }} reviews</span>
            </div>

            <div v-if="restaurant.menu && restaurant.menu.items && restaurant.menu.items.length > 0" class="meta-item">
              <span class="meta-icon">📋</span>
              <span>{{ restaurant.menu.items.length }} menu items</span>
            </div>

            <div v-if="restaurant.competitors && restaurant.competitors.length > 0" class="meta-item">
              <span class="meta-icon">🏪</span>
              <span>{{ restaurant.competitors.length }} competitors</span>
            </div>
          </div>

          <div class="card-footer">
            <span class="saved-date">Saved {{ formatDate(restaurant.saved_at) }}</span>
            <span class="view-link">View Details →</span>
          </div>
        </BaseCard>
      </div>

      <!-- Delete Confirmation Modal -->
      <div v-if="showDeleteModal" class="modal-overlay" @click="cancelDelete">
        <BaseCard variant="glass-intense" class="modal-content" @click.stop>
          <h3 class="modal-title">Delete Restaurant?</h3>
          <p class="modal-message">
            Are you sure you want to delete <strong>{{ restaurantToDelete?.name }}</strong>? This action cannot be undone.
          </p>
          <div class="modal-actions">
            <BaseButton variant="secondary" @click="cancelDelete">
              Cancel
            </BaseButton>
            <BaseButton variant="danger" @click="deleteRestaurant" :disabled="deleting">
              {{ deleting ? 'Deleting...' : 'Delete' }}
            </BaseButton>
          </div>
        </BaseCard>
      </div>

      <!-- Restaurant Details Modal -->
      <div v-if="selectedRestaurant" class="modal-overlay" @click="closeDetails">
        <div class="details-modal" @click.stop>
          <BaseCard variant="glass-intense" class="details-content">
            <div class="details-header">
              <h2 class="details-title">{{ selectedRestaurant.name }}</h2>
              <button class="close-btn" @click="closeDetails">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div class="details-body">
              <!-- Basic Info -->
              <section class="details-section">
                <h3 class="section-title">Information</h3>
                <div class="info-grid">
                  <div class="info-item">
                    <span class="info-label">Address</span>
                    <span class="info-value">{{ selectedRestaurant.address }}</span>
                  </div>

                  <div v-if="selectedRestaurant.phone_number" class="info-item">
                    <span class="info-label">Phone</span>
                    <span class="info-value">{{ selectedRestaurant.phone_number }}</span>
                  </div>

                  <div v-if="selectedRestaurant.website" class="info-item">
                    <span class="info-label">Website</span>
                    <a :href="selectedRestaurant.website" target="_blank" class="info-link">
                      {{ selectedRestaurant.website }}
                    </a>
                  </div>

                  <div v-if="selectedRestaurant.rating" class="info-item">
                    <span class="info-label">Rating</span>
                    <span class="info-value">
                      ⭐ {{ selectedRestaurant.rating }} / 5
                      <span v-if="selectedRestaurant.user_ratings_total" class="rating-count">
                        ({{ selectedRestaurant.user_ratings_total }} reviews)
                      </span>
                    </span>
                  </div>
                </div>
              </section>

              <!-- Brand DNA -->
              <section v-if="selectedRestaurant.brand_dna" class="details-section">
                <h3 class="section-title">Brand Identity</h3>

                <!-- Brand Name -->
                <div v-if="selectedRestaurant.brand_dna.brand_name" class="brand-item">
                  <span class="brand-label">Brand Name</span>
                  <span class="brand-value brand-name-text">{{ selectedRestaurant.brand_dna.brand_name }}</span>
                </div>

                <!-- Logo -->
                <div v-if="selectedRestaurant.brand_dna.logo_url" class="brand-item logo-item">
                  <span class="brand-label">Logo</span>
                  <div class="logo-container">
                    <img
                      :src="`http://localhost:3000${selectedRestaurant.brand_dna.logo_url}`"
                      :alt="selectedRestaurant.brand_dna.brand_name || 'Logo'"
                      class="brand-logo"
                    />
                  </div>
                </div>

                <!-- Brand Colors -->
                <div class="brand-item colors-item">
                  <span class="brand-label">Brand Colors</span>
                  <div class="colors-display">
                    <div v-if="selectedRestaurant.brand_dna.primary_color" class="color-box">
                      <div class="color-swatch-small" :style="{ backgroundColor: selectedRestaurant.brand_dna.primary_color }"></div>
                      <div class="color-details">
                        <span class="color-name">Primary</span>
                        <span class="color-code">{{ selectedRestaurant.brand_dna.primary_color }}</span>
                      </div>
                    </div>
                    <div v-if="selectedRestaurant.brand_dna.secondary_color" class="color-box">
                      <div class="color-swatch-small" :style="{ backgroundColor: selectedRestaurant.brand_dna.secondary_color }"></div>
                      <div class="color-details">
                        <span class="color-name">Secondary</span>
                        <span class="color-code">{{ selectedRestaurant.brand_dna.secondary_color }}</span>
                      </div>
                    </div>
                    <div
                      v-for="(color, index) in selectedRestaurant.brand_dna.additional_colors"
                      :key="index"
                      class="color-box"
                    >
                      <div class="color-swatch-small" :style="{ backgroundColor: color }"></div>
                      <div class="color-details">
                        <span class="color-name">Accent {{ index + 1 }}</span>
                        <span class="color-code">{{ color }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Font Style -->
                <div v-if="selectedRestaurant.brand_dna.font_style" class="brand-item">
                  <span class="brand-label">Typography</span>
                  <span class="brand-value font-badge-small">{{ selectedRestaurant.brand_dna.font_style }}</span>
                </div>
              </section>

              <!-- Opening Hours -->
              <section v-if="selectedRestaurant.opening_hours" class="details-section">
                <h3 class="section-title">Opening Hours</h3>
                <div v-if="selectedRestaurant.opening_hours.open_now !== undefined" class="status-badge" :class="{ 'open': selectedRestaurant.opening_hours.open_now }">
                  {{ selectedRestaurant.opening_hours.open_now ? '🟢 Open Now' : '🔴 Closed' }}
                </div>
                <div v-if="selectedRestaurant.opening_hours.weekday_text" class="hours-list">
                  <div v-for="(day, index) in selectedRestaurant.opening_hours.weekday_text" :key="index" class="hours-item">
                    {{ day }}
                  </div>
                </div>
              </section>

              <!-- Social Media -->
              <section v-if="selectedRestaurant.social_media && hasSocialMedia(selectedRestaurant.social_media)" class="details-section">
                <h3 class="section-title">Social Media</h3>
                <div class="social-links">
                  <a v-if="selectedRestaurant.social_media.facebook" :href="selectedRestaurant.social_media.facebook" target="_blank" class="social-link facebook">
                    Facebook
                  </a>
                  <a v-if="selectedRestaurant.social_media.instagram" :href="selectedRestaurant.social_media.instagram" target="_blank" class="social-link instagram">
                    Instagram
                  </a>
                  <a v-if="selectedRestaurant.social_media.twitter" :href="selectedRestaurant.social_media.twitter" target="_blank" class="social-link twitter">
                    Twitter/X
                  </a>
                  <a v-if="selectedRestaurant.social_media.youtube" :href="selectedRestaurant.social_media.youtube" target="_blank" class="social-link youtube">
                    YouTube
                  </a>
                  <a v-if="selectedRestaurant.social_media.tiktok" :href="selectedRestaurant.social_media.tiktok" target="_blank" class="social-link tiktok">
                    TikTok
                  </a>
                </div>
              </section>

              <!-- Reviews -->
              <section v-if="selectedRestaurant.reviews && selectedRestaurant.reviews.length > 0" class="details-section">
                <h3 class="section-title">Customer Reviews ({{ selectedRestaurant.reviews.length }})</h3>
                <div class="reviews-list">
                  <div v-for="(review, index) in selectedRestaurant.reviews" :key="index" class="review-item">
                    <div class="review-header">
                      <div class="review-author">
                        <img v-if="review.profile_photo_url" :src="review.profile_photo_url" :alt="review.author_name" class="author-photo" />
                        <div v-else class="author-photo-placeholder">{{ review.author_name.charAt(0) }}</div>
                        <div>
                          <div class="author-name">{{ review.author_name }}</div>
                          <div class="review-rating">
                            <span v-for="star in 5" :key="star" :class="{ 'filled': star <= review.rating }">
                              {{ star <= review.rating ? '★' : '☆' }}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <p class="review-text">{{ review.text }}</p>
                  </div>
                </div>
              </section>

              <!-- Menu -->
              <section v-if="selectedRestaurant.menu && selectedRestaurant.menu.items && selectedRestaurant.menu.items.length > 0" class="details-section">
                <h3 class="section-title">
                  Menu ({{ selectedRestaurant.menu.items.length }} items)
                  <span v-if="selectedRestaurant.menu.platform" class="platform-badge">
                    {{ selectedRestaurant.menu.platform.toUpperCase() }}
                  </span>
                </h3>
                <div class="menu-grid">
                  <div v-for="(item, index) in selectedRestaurant.menu.items" :key="index" class="menu-item">
                    <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.name" class="menu-image" />
                    <div class="menu-item-content">
                      <h4 class="menu-item-name">{{ item.name }}</h4>
                      <p v-if="item.description" class="menu-item-description">{{ item.description }}</p>
                      <p class="menu-item-price">{{ item.price }}</p>
                    </div>
                  </div>
                </div>
              </section>

              <!-- Competitors -->
              <section v-if="selectedRestaurant.competitors && selectedRestaurant.competitors.length > 0" class="details-section">
                <h3 class="section-title">
                  Nearby Competitors ({{ selectedRestaurant.competitors.length }})
                  <span v-if="selectedRestaurant.competitor_analysis" class="info-text">
                    within {{ selectedRestaurant.competitor_analysis.radiusKm }} km
                  </span>
                </h3>
                <div class="competitors-list">
                  <div v-for="(competitor, index) in selectedRestaurant.competitors" :key="index" class="competitor-item">
                    <div class="competitor-number">{{ index + 1 }}</div>
                    <div class="competitor-info">
                      <h4 class="competitor-name">{{ competitor.name }}</h4>
                      <p class="competitor-address">{{ competitor.address }}</p>
                      <div class="competitor-meta">
                        <span v-if="competitor.rating">⭐ {{ competitor.rating }}</span>
                        <span class="competitor-distance">{{ competitor.distance }} km away</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </BaseCard>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import GradientBackground from '../components/GradientBackground.vue'
import BaseCard from '../components/BaseCard.vue'
import BaseButton from '../components/BaseButton.vue'
import BaseAlert from '../components/BaseAlert.vue'
import { restaurantService, type SavedRestaurant } from '../services/restaurantService'

const router = useRouter()

const restaurants = ref<SavedRestaurant[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const selectedRestaurant = ref<SavedRestaurant | null>(null)
const showDeleteModal = ref(false)
const restaurantToDelete = ref<SavedRestaurant | null>(null)
const deleting = ref(false)

onMounted(async () => {
  await fetchRestaurants()
})

const fetchRestaurants = async () => {
  try {
    loading.value = true
    error.value = null
    restaurants.value = await restaurantService.getSavedRestaurants()
  } catch (err: any) {
    console.error('Error fetching saved restaurants:', err)
    error.value = err.message || 'Failed to load saved restaurants'
  } finally {
    loading.value = false
  }
}

const selectRestaurant = (restaurant: SavedRestaurant) => {
  selectedRestaurant.value = restaurant
}

const closeDetails = () => {
  selectedRestaurant.value = null
}

const confirmDelete = (restaurant: SavedRestaurant) => {
  restaurantToDelete.value = restaurant
  showDeleteModal.value = true
}

const cancelDelete = () => {
  showDeleteModal.value = false
  restaurantToDelete.value = null
}

const deleteRestaurant = async () => {
  if (!restaurantToDelete.value) return

  try {
    deleting.value = true
    const success = await restaurantService.deleteRestaurant(restaurantToDelete.value.place_id)

    if (success) {
      // Remove from list
      restaurants.value = restaurants.value.filter(r => r.id !== restaurantToDelete.value!.id)
      showDeleteModal.value = false
      restaurantToDelete.value = null
    } else {
      error.value = 'Failed to delete restaurant'
    }
  } catch (err: any) {
    console.error('Error deleting restaurant:', err)
    error.value = err.message || 'Failed to delete restaurant'
  } finally {
    deleting.value = false
  }
}

const goToSearch = () => {
  router.push('/restaurants')
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'today'
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
  return `${Math.floor(diffDays / 365)} years ago`
}

const hasSocialMedia = (socialMedia: any): boolean => {
  if (!socialMedia) return false
  return !!(socialMedia.facebook || socialMedia.instagram || socialMedia.twitter || socialMedia.youtube || socialMedia.tiktok)
}
</script>

<style scoped>
.saved-restaurants-view {
  min-height: 100vh;
  position: relative;
  padding: 2rem 1rem;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.header {
  text-align: center;
  margin-bottom: 3rem;
}

.title {
  font-family: var(--font-heading);
  font-size: 3rem;
  font-weight: 700;
  margin: 0 0 1rem 0;
  background: linear-gradient(135deg, var(--text-primary) 0%, var(--gold-primary) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  font-size: 1.125rem;
  color: var(--text-secondary);
  margin: 0;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  gap: 1rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(212, 175, 55, 0.2);
  border-top-color: var(--gold-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-container p {
  color: var(--text-secondary);
  margin: 0;
}

.empty-state {
  padding: 4rem 2rem;
}

.empty-content {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.empty-content h3 {
  font-family: var(--font-heading);
  font-size: 1.5rem;
  color: var(--text-primary);
  margin: 0;
}

.empty-content p {
  color: var(--text-secondary);
  margin: 0;
}

.restaurants-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.restaurant-card {
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.restaurant-card:hover {
  transform: translateY(-4px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.restaurant-name {
  font-family: var(--font-heading);
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  flex: 1;
}

.delete-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.delete-btn:hover {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.restaurant-address {
  color: var(--text-secondary);
  font-size: 0.875rem;
  margin: 0 0 1rem 0;
  line-height: 1.4;
}

.restaurant-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(212, 175, 55, 0.1);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.meta-icon {
  font-size: 1rem;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid rgba(212, 175, 55, 0.1);
}

.saved-date {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.view-link {
  font-size: 0.875rem;
  color: var(--gold-primary);
  font-weight: 500;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  max-width: 500px;
  width: 100%;
  padding: 2rem;
}

.modal-title {
  font-family: var(--font-heading);
  font-size: 1.5rem;
  color: var(--text-primary);
  margin: 0 0 1rem 0;
}

.modal-message {
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0 0 1.5rem 0;
}

.modal-message strong {
  color: var(--gold-primary);
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

/* Details Modal */
.details-modal {
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
}

.details-content {
  padding: 2rem;
}

.details-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid rgba(212, 175, 55, 0.2);
}

.details-title {
  font-family: var(--font-heading);
  font-size: 2rem;
  color: var(--gold-primary);
  margin: 0;
  flex: 1;
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.close-btn:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.1);
}

.details-body {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.details-section {
  padding: 1.5rem;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(212, 175, 55, 0.1);
  border-radius: 12px;
}

.section-title {
  font-family: var(--font-heading);
  font-size: 1.25rem;
  color: var(--gold-primary);
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.platform-badge {
  font-size: 0.75rem;
  padding: 0.25rem 0.75rem;
  background: rgba(212, 175, 55, 0.2);
  border: 1px solid rgba(212, 175, 55, 0.4);
  border-radius: 12px;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.info-text {
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-weight: normal;
}

.info-grid {
  display: grid;
  gap: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
}

.info-value {
  font-size: 1rem;
  color: var(--text-primary);
}

.info-link {
  color: var(--gold-primary);
  text-decoration: none;
  transition: color 0.2s ease;
  word-break: break-all;
}

.info-link:hover {
  color: var(--text-primary);
  text-decoration: underline;
}

.rating-count {
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-weight: normal;
}

.status-badge {
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 1rem;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444;
}

.status-badge.open {
  background: rgba(34, 197, 94, 0.15);
  border: 1px solid rgba(34, 197, 94, 0.3);
  color: #22c55e;
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

.social-links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.social-link {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.3s ease;
  border: 2px solid;
}

.social-link.facebook {
  background: rgba(66, 103, 178, 0.1);
  border-color: rgba(66, 103, 178, 0.3);
  color: #4267B2;
}

.social-link.facebook:hover {
  background: rgba(66, 103, 178, 0.2);
  border-color: #4267B2;
}

.social-link.instagram {
  background: rgba(225, 48, 108, 0.1);
  border-color: rgba(225, 48, 108, 0.3);
  color: #E1306C;
}

.social-link.instagram:hover {
  background: rgba(225, 48, 108, 0.2);
  border-color: #E1306C;
}

.social-link.twitter {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
  color: var(--text-primary);
}

.social-link.twitter:hover {
  background: rgba(255, 255, 255, 0.2);
}

.social-link.youtube {
  background: rgba(255, 0, 0, 0.1);
  border-color: rgba(255, 0, 0, 0.3);
  color: #FF0000;
}

.social-link.youtube:hover {
  background: rgba(255, 0, 0, 0.2);
  border-color: #FF0000;
}

.social-link.tiktok {
  background: rgba(0, 242, 234, 0.1);
  border-color: rgba(0, 242, 234, 0.3);
  color: #00F2EA;
}

.social-link.tiktok:hover {
  background: rgba(0, 242, 234, 0.2);
  border-color: #00F2EA;
}

.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.review-item {
  padding: 1rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
}

.review-header {
  margin-bottom: 0.75rem;
}

.review-author {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.author-photo {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.author-photo-placeholder {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--gold-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: var(--bg-primary);
}

.author-name {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.875rem;
}

.review-rating {
  color: var(--gold-primary);
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.review-rating .filled {
  color: var(--gold-primary);
}

.review-text {
  color: var(--text-secondary);
  font-size: 0.875rem;
  line-height: 1.6;
  margin: 0;
}

.menu-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.menu-item {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  overflow: hidden;
}

.menu-image {
  width: 100%;
  height: 150px;
  object-fit: cover;
}

.menu-item-content {
  padding: 1rem;
}

.menu-item-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
}

.menu-item-description {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0 0 0.5rem 0;
  line-height: 1.4;
}

.menu-item-price {
  font-size: 0.875rem;
  color: var(--gold-primary);
  font-weight: 600;
  margin: 0;
}

.competitors-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.competitor-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
}

.competitor-number {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gold-primary);
  border-radius: 50%;
  font-weight: 700;
  color: var(--bg-primary);
  font-size: 0.875rem;
}

.competitor-info {
  flex: 1;
}

.competitor-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.25rem 0;
}

.competitor-address {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0 0 0.5rem 0;
}

.competitor-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.competitor-distance {
  color: var(--gold-primary);
}

/* Brand DNA Styles */
.brand-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.brand-item:last-child {
  margin-bottom: 0;
}

.brand-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
}

.brand-value {
  font-size: 1rem;
  color: var(--text-primary);
}

.brand-name-text {
  font-family: var(--font-heading);
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--gold-primary);
}

.logo-item {
  align-items: flex-start;
}

.logo-container {
  width: 100%;
  max-width: 300px;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-logo {
  max-width: 100%;
  max-height: 120px;
  width: auto;
  height: auto;
  object-fit: contain;
}

.colors-item {
  align-items: flex-start;
}

.colors-display {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  width: 100%;
}

.color-box {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: 8px;
  flex: 1;
  min-width: 200px;
}

.color-swatch-small {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.color-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.color-name {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
}

.color-code {
  font-size: 0.875rem;
  font-family: monospace;
  color: var(--text-primary);
  font-weight: 500;
}

.font-badge-small {
  display: inline-block;
  padding: 0.5rem 1rem;
  background: rgba(212, 175, 55, 0.15);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: capitalize;
  color: var(--gold-primary);
}

/* Responsive */
@media (max-width: 768px) {
  .title {
    font-size: 2rem;
  }

  .restaurants-grid {
    grid-template-columns: 1fr;
  }

  .details-modal {
    max-height: 100vh;
  }

  .details-content {
    padding: 1.5rem;
  }

  .menu-grid {
    grid-template-columns: 1fr;
  }
}
</style>

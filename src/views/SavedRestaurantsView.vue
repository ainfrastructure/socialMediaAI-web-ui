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
            <div class="card-title-section">
              <div v-if="restaurant.brand_dna?.logo_url" class="card-logo-container">
                <img
                  :src="restaurant.brand_dna.logo_url"
                  :alt="restaurant.brand_dna.brand_name || restaurant.name"
                  class="card-logo"
                />
              </div>
              <h3 class="restaurant-name">{{ restaurant.name }}</h3>
            </div>
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
              <div class="header-actions">
                <button class="close-btn" @click="closeDetails">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>

            <BaseAlert v-if="saveError" type="error" class="save-alert">
              {{ saveError }}
            </BaseAlert>

            <div class="details-body">
              <!-- Basic Info -->
              <section class="details-section">
                <div class="section-header">
                  <h3 class="section-title">Information</h3>
                </div>
                <div class="info-grid">
                  <div class="info-item">
                    <span class="info-label">Address</span>
                    <span class="info-value">{{ selectedRestaurant.address }}</span>
                  </div>

                  <div v-if="selectedRestaurant.phone_number" class="info-item">
                    <span class="info-label">Phone</span>
                    <span class="info-value">{{ selectedRestaurant.phone_number }}</span>
                  </div>

                  <div class="info-item">
                    <span class="info-label">Website</span>
                    <div class="editable-field">
                      <input
                        v-if="editingWebsite"
                        v-model="editedWebsite"
                        type="url"
                        class="edit-input"
                        placeholder="https://example.com"
                      />
                      <a v-else-if="selectedRestaurant.website" :href="selectedRestaurant.website" target="_blank" class="info-link">
                        {{ selectedRestaurant.website }}
                      </a>
                      <span v-else class="info-value empty">Not set</span>

                      <div class="field-actions">
                        <button v-if="!editingWebsite" class="edit-field-btn" @click="startEditWebsite" title="Edit website">
                          ✏️
                        </button>
                        <template v-else>
                          <BaseButton variant="primary" size="small" @click="saveWebsite" :disabled="saving">
                            {{ saving ? '...' : '💾' }}
                          </BaseButton>
                          <BaseButton variant="ghost" size="small" @click="cancelEditWebsite">
                            ✕
                          </BaseButton>
                        </template>
                      </div>
                    </div>
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
                      :src="selectedRestaurant.brand_dna.logo_url"
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
              <section v-if="selectedRestaurant.opening_hours || editingHours" class="details-section">
                <div class="section-header">
                  <h3 class="section-title">Opening Hours</h3>
                  <button v-if="!editingHours" class="edit-section-btn" @click="startEditHours" title="Edit opening hours">
                    ✏️ Edit
                  </button>
                  <div v-else class="section-actions">
                    <BaseButton variant="primary" size="small" @click="saveHours" :disabled="saving">
                      {{ saving ? 'Saving...' : '💾 Save' }}
                    </BaseButton>
                    <BaseButton variant="ghost" size="small" @click="cancelEditHours">
                      Cancel
                    </BaseButton>
                  </div>
                </div>

                <div v-if="selectedRestaurant.opening_hours?.open_now !== undefined && !editingHours" class="status-badge" :class="{ 'open': selectedRestaurant.opening_hours.open_now }">
                  {{ selectedRestaurant.opening_hours.open_now ? '🟢 Open Now' : '🔴 Closed' }}
                </div>

                <!-- Edit Mode -->
                <div v-if="editingHours" class="hours-edit-list">
                  <div v-for="(day, index) in editedHours" :key="index" class="hours-edit-item">
                    <input
                      v-model="editedHours[index]"
                      type="text"
                      class="edit-input hours-input"
                      placeholder="Monday: 9:00 AM – 5:00 PM"
                    />
                    <button class="remove-day-btn" @click="editedHours.splice(index, 1)" title="Remove day">
                      ✕
                    </button>
                  </div>
                  <BaseButton variant="ghost" size="small" @click="editedHours.push('')">
                    ➕ Add Day
                  </BaseButton>
                </div>

                <!-- View Mode -->
                <div v-else-if="selectedRestaurant.opening_hours?.weekday_text" class="hours-list">
                  <div v-for="(day, index) in selectedRestaurant.opening_hours.weekday_text" :key="index" class="hours-item">
                    {{ day }}
                  </div>
                </div>
              </section>

              <!-- Social Media -->
              <section v-if="(selectedRestaurant.social_media && hasSocialMedia(selectedRestaurant.social_media)) || editingSocial" class="details-section">
                <div class="section-header">
                  <h3 class="section-title">Social Media</h3>
                  <button v-if="!editingSocial" class="edit-section-btn" @click="startEditSocial" title="Edit social media">
                    ✏️ Edit
                  </button>
                  <div v-else class="section-actions">
                    <BaseButton variant="primary" size="small" @click="saveSocial" :disabled="saving">
                      {{ saving ? 'Saving...' : '💾 Save' }}
                    </BaseButton>
                    <BaseButton variant="ghost" size="small" @click="cancelEditSocial">
                      Cancel
                    </BaseButton>
                  </div>
                </div>

                <!-- Edit Mode -->
                <div v-if="editingSocial" class="social-edit-grid">
                  <div class="social-edit-item">
                    <label class="social-label">
                      <span class="social-icon facebook-icon">📘</span>
                      Facebook
                    </label>
                    <input
                      v-model="editedSocial.facebook"
                      type="url"
                      class="edit-input"
                      placeholder="https://facebook.com/..."
                    />
                  </div>

                  <div class="social-edit-item">
                    <label class="social-label">
                      <span class="social-icon instagram-icon">📷</span>
                      Instagram
                    </label>
                    <input
                      v-model="editedSocial.instagram"
                      type="url"
                      class="edit-input"
                      placeholder="https://instagram.com/..."
                    />
                  </div>

                  <div class="social-edit-item">
                    <label class="social-label">
                      <span class="social-icon twitter-icon">🐦</span>
                      Twitter/X
                    </label>
                    <input
                      v-model="editedSocial.twitter"
                      type="url"
                      class="edit-input"
                      placeholder="https://twitter.com/..."
                    />
                  </div>

                  <div class="social-edit-item">
                    <label class="social-label">
                      <span class="social-icon youtube-icon">📺</span>
                      YouTube
                    </label>
                    <input
                      v-model="editedSocial.youtube"
                      type="url"
                      class="edit-input"
                      placeholder="https://youtube.com/..."
                    />
                  </div>

                  <div class="social-edit-item">
                    <label class="social-label">
                      <span class="social-icon tiktok-icon">🎵</span>
                      TikTok
                    </label>
                    <input
                      v-model="editedSocial.tiktok"
                      type="url"
                      class="edit-input"
                      placeholder="https://tiktok.com/..."
                    />
                  </div>
                </div>

                <!-- View Mode -->
                <div v-else class="social-links">
                  <a v-if="selectedRestaurant.social_media?.facebook" :href="selectedRestaurant.social_media.facebook" target="_blank" class="social-link facebook">
                    Facebook
                  </a>
                  <a v-if="selectedRestaurant.social_media?.instagram" :href="selectedRestaurant.social_media.instagram" target="_blank" class="social-link instagram">
                    Instagram
                  </a>
                  <a v-if="selectedRestaurant.social_media?.twitter" :href="selectedRestaurant.social_media.twitter" target="_blank" class="social-link twitter">
                    Twitter/X
                  </a>
                  <a v-if="selectedRestaurant.social_media?.youtube" :href="selectedRestaurant.social_media.youtube" target="_blank" class="social-link youtube">
                    YouTube
                  </a>
                  <a v-if="selectedRestaurant.social_media?.tiktok" :href="selectedRestaurant.social_media.tiktok" target="_blank" class="social-link tiktok">
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
                  <div v-for="(item, index) in paginatedMenuItems" :key="index" class="menu-item">
                    <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.name" class="menu-image" />
                    <div class="menu-item-content">
                      <h4 class="menu-item-name">{{ item.name }}</h4>
                      <p v-if="item.description" class="menu-item-description">{{ item.description }}</p>
                      <p class="menu-item-price">{{ item.price }}</p>
                    </div>
                  </div>
                </div>

                <!-- Menu Pagination -->
                <div v-if="totalMenuPages > 1" class="pagination">
                  <button
                    class="pagination-btn"
                    :disabled="menuCurrentPage === 1"
                    @click="goToMenuPage(menuCurrentPage - 1)"
                  >
                    ← Previous
                  </button>

                  <div class="pagination-numbers">
                    <button
                      v-for="page in totalMenuPages"
                      :key="page"
                      class="pagination-number"
                      :class="{ active: menuCurrentPage === page }"
                      @click="goToMenuPage(page)"
                    >
                      {{ page }}
                    </button>
                  </div>

                  <button
                    class="pagination-btn"
                    :disabled="menuCurrentPage === totalMenuPages"
                    @click="goToMenuPage(menuCurrentPage + 1)"
                  >
                    Next →
                  </button>
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
                  <div v-for="(competitor, index) in paginatedCompetitors" :key="index" class="competitor-item">
                    <div class="competitor-number">{{ (competitorsCurrentPage - 1) * competitorsPerPage + index + 1 }}</div>
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

                <!-- Competitors Pagination -->
                <div v-if="totalCompetitorsPages > 1" class="pagination">
                  <button
                    class="pagination-btn"
                    :disabled="competitorsCurrentPage === 1"
                    @click="goToCompetitorsPage(competitorsCurrentPage - 1)"
                  >
                    ← Previous
                  </button>

                  <div class="pagination-numbers">
                    <button
                      v-for="page in totalCompetitorsPages"
                      :key="page"
                      class="pagination-number"
                      :class="{ active: competitorsCurrentPage === page }"
                      @click="goToCompetitorsPage(page)"
                    >
                      {{ page }}
                    </button>
                  </div>

                  <button
                    class="pagination-btn"
                    :disabled="competitorsCurrentPage === totalCompetitorsPages"
                    @click="goToCompetitorsPage(competitorsCurrentPage + 1)"
                  >
                    Next →
                  </button>
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
import { ref, computed, onMounted, watch } from 'vue'
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

// Edit state
// Edit state for individual fields
const editingWebsite = ref(false)
const editedWebsite = ref('')
const editingHours = ref(false)
const editedHours = ref<string[]>([])
const editingSocial = ref(false)
const editedSocial = ref({
  facebook: '',
  instagram: '',
  twitter: '',
  youtube: '',
  tiktok: ''
})
const saving = ref(false)
const saveError = ref<string | null>(null)

// Pagination state
const menuCurrentPage = ref(1)
const menuItemsPerPage = 12
const competitorsCurrentPage = ref(1)
const competitorsPerPage = 6

onMounted(async () => {
  await fetchRestaurants()
})

const fetchRestaurants = async () => {
  try {
    loading.value = true
    error.value = null
    restaurants.value = await restaurantService.getSavedRestaurants()
  } catch (err: any) {

    error.value = err.message || 'Failed to load saved restaurants'
  } finally {
    loading.value = false
  }
}

const selectRestaurant = (restaurant: SavedRestaurant) => {
  selectedRestaurant.value = restaurant
  resetEditState()
}

const closeDetails = () => {
  selectedRestaurant.value = null
  resetEditState()
}

const resetEditState = () => {
  editingWebsite.value = false
  editedWebsite.value = ''
  editingHours.value = false
  editedHours.value = []
  editingSocial.value = false
  editedSocial.value = {
    facebook: '',
    instagram: '',
    twitter: '',
    youtube: '',
    tiktok: ''
  }
  saveError.value = null
}

// Website editing
const startEditWebsite = () => {
  editingWebsite.value = true
  editedWebsite.value = selectedRestaurant.value?.website || ''
}

const cancelEditWebsite = () => {
  editingWebsite.value = false
  editedWebsite.value = ''
  saveError.value = null
}

const saveWebsite = async () => {
  if (!selectedRestaurant.value) return

  try {
    saving.value = true
    saveError.value = null

    const response = await restaurantService.updateRestaurant(selectedRestaurant.value.place_id, {
      website: editedWebsite.value || null
    })

    if (response.success && response.data) {
      selectedRestaurant.value = response.data

      const index = restaurants.value.findIndex(r => r.id === selectedRestaurant.value!.id)
      if (index !== -1) {
        restaurants.value[index] = response.data
      }

      editingWebsite.value = false
      editedWebsite.value = ''
    } else {
      saveError.value = response.error || 'Failed to save website'
    }
  } catch (err: any) {

    saveError.value = err.message || 'Failed to save website'
  } finally {
    saving.value = false
  }
}

// Opening hours editing
const startEditHours = () => {
  editingHours.value = true
  editedHours.value = selectedRestaurant.value?.opening_hours?.weekday_text
    ? [...selectedRestaurant.value.opening_hours.weekday_text]
    : []
}

const cancelEditHours = () => {
  editingHours.value = false
  editedHours.value = []
  saveError.value = null
}

const saveHours = async () => {
  if (!selectedRestaurant.value) return

  try {
    saving.value = true
    saveError.value = null

    const response = await restaurantService.updateRestaurant(selectedRestaurant.value.place_id, {
      opening_hours: {
        weekday_text: editedHours.value.filter(h => h.trim() !== '')
      }
    })

    if (response.success && response.data) {
      selectedRestaurant.value = response.data

      const index = restaurants.value.findIndex(r => r.id === selectedRestaurant.value!.id)
      if (index !== -1) {
        restaurants.value[index] = response.data
      }

      editingHours.value = false
      editedHours.value = []
    } else {
      saveError.value = response.error || 'Failed to save opening hours'
    }
  } catch (err: any) {

    saveError.value = err.message || 'Failed to save opening hours'
  } finally {
    saving.value = false
  }
}

// Social media editing
const startEditSocial = () => {
  editingSocial.value = true
  editedSocial.value = {
    facebook: selectedRestaurant.value?.social_media?.facebook || '',
    instagram: selectedRestaurant.value?.social_media?.instagram || '',
    twitter: selectedRestaurant.value?.social_media?.twitter || '',
    youtube: selectedRestaurant.value?.social_media?.youtube || '',
    tiktok: selectedRestaurant.value?.social_media?.tiktok || ''
  }
}

const cancelEditSocial = () => {
  editingSocial.value = false
  editedSocial.value = {
    facebook: '',
    instagram: '',
    twitter: '',
    youtube: '',
    tiktok: ''
  }
  saveError.value = null
}

const saveSocial = async () => {
  if (!selectedRestaurant.value) return

  try {
    saving.value = true
    saveError.value = null

    const response = await restaurantService.updateRestaurant(selectedRestaurant.value.place_id, {
      social_media: editedSocial.value
    })

    if (response.success && response.data) {
      selectedRestaurant.value = response.data

      const index = restaurants.value.findIndex(r => r.id === selectedRestaurant.value!.id)
      if (index !== -1) {
        restaurants.value[index] = response.data
      }

      editingSocial.value = false
      editedSocial.value = {
        facebook: '',
        instagram: '',
        twitter: '',
        youtube: '',
        tiktok: ''
      }
    } else {
      saveError.value = response.error || 'Failed to save social media'
    }
  } catch (err: any) {

    saveError.value = err.message || 'Failed to save social media'
  } finally {
    saving.value = false
  }
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

// Reset pagination when restaurant changes
watch(selectedRestaurant, () => {
  menuCurrentPage.value = 1
  competitorsCurrentPage.value = 1
})

// Menu pagination
const paginatedMenuItems = computed(() => {
  if (!selectedRestaurant.value?.menu?.items) return []
  const items = selectedRestaurant.value.menu.items
  const start = (menuCurrentPage.value - 1) * menuItemsPerPage
  const end = start + menuItemsPerPage
  return items.slice(start, end)
})

const totalMenuPages = computed(() => {
  if (!selectedRestaurant.value?.menu?.items) return 0
  return Math.ceil(selectedRestaurant.value.menu.items.length / menuItemsPerPage)
})

const goToMenuPage = (page: number) => {
  menuCurrentPage.value = page
}

// Competitors pagination
const paginatedCompetitors = computed(() => {
  if (!selectedRestaurant.value?.competitors) return []
  const start = (competitorsCurrentPage.value - 1) * competitorsPerPage
  const end = start + competitorsPerPage
  return selectedRestaurant.value.competitors.slice(start, end)
})

const totalCompetitorsPages = computed(() => {
  if (!selectedRestaurant.value?.competitors) return 0
  return Math.ceil(selectedRestaurant.value.competitors.length / competitorsPerPage)
})

const goToCompetitorsPage = (page: number) => {
  competitorsCurrentPage.value = page
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
  position: relative;
}

.restaurant-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(212, 175, 55, 0.2);
  border-color: rgba(212, 175, 55, 0.4);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.card-title-section {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.card-logo-container {
  width: 56px;
  height: 56px;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
}

.card-logo {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
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
  justify-content: flex-start;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid rgba(212, 175, 55, 0.1);
}

.saved-date {
  font-size: 0.75rem;
  color: var(--text-muted);
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

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
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

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  gap: 1rem;
}

.section-title {
  font-family: var(--font-heading);
  font-size: 1.25rem;
  color: var(--gold-primary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.edit-section-btn {
  padding: 0.5rem 1rem;
  background: rgba(212, 175, 55, 0.1);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 6px;
  color: var(--gold-primary);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.edit-section-btn:hover {
  background: rgba(212, 175, 55, 0.2);
  border-color: var(--gold-primary);
  transform: translateY(-1px);
}

.section-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.edit-field-btn {
  padding: 0.375rem 0.75rem;
  background: rgba(212, 175, 55, 0.1);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 6px;
  color: var(--gold-primary);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-left: 0.5rem;
}

.edit-field-btn:hover {
  background: rgba(212, 175, 55, 0.2);
  border-color: var(--gold-primary);
}

.editable-field {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.field-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-shrink: 0;
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

/* Pagination Styles */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
  margin-top: var(--space-2xl);
  padding-top: var(--space-xl);
  border-top: var(--border-width) solid var(--border-color);
}

.pagination-btn {
  padding: var(--space-sm) var(--space-lg);
  background: var(--glass-bg);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: var(--transition-base);
  backdrop-filter: blur(var(--blur-md));
}

.pagination-btn:hover:not(:disabled) {
  background: var(--gold-subtle);
  border-color: var(--gold-primary);
  color: var(--gold-primary);
  transform: translateY(-1px);
}

.pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pagination-numbers {
  display: flex;
  gap: var(--space-sm);
}

.pagination-number {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--glass-bg);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: var(--transition-base);
  backdrop-filter: blur(var(--blur-md));
}

.pagination-number:hover {
  background: var(--gold-subtle);
  border-color: var(--gold-primary);
  color: var(--gold-primary);
  transform: translateY(-1px);
}

.pagination-number.active {
  background: var(--gold-primary);
  border-color: var(--gold-primary);
  color: var(--text-on-gold);
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

/* Edit Mode Styles */
.save-alert {
  margin-bottom: 1rem;
}

.edit-actions {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: rgba(212, 175, 55, 0.1);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 12px;
  margin-bottom: 1rem;
}

.edit-input {
  width: 100%;
  padding: 0.75rem 1rem;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 8px;
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.edit-input:focus {
  outline: none;
  border-color: var(--gold-primary);
  background: rgba(0, 0, 0, 0.5);
  box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1);
}

.edit-input::placeholder {
  color: var(--text-muted);
}

.info-value.empty {
  color: var(--text-muted);
  font-style: italic;
}

/* Opening Hours Edit */
.hours-edit-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.hours-edit-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.remove-day-btn {
  padding: 0.375rem 0.75rem;
  background: rgba(220, 38, 38, 0.1);
  border: 1px solid rgba(220, 38, 38, 0.3);
  border-radius: 6px;
  color: #ef4444;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.remove-day-btn:hover {
  background: rgba(220, 38, 38, 0.2);
  border-color: #ef4444;
}

.hours-input {
  flex: 1;
}

/* Social Media Edit */
.social-edit-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.social-edit-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.social-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
}

.social-icon {
  font-size: 1.25rem;
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

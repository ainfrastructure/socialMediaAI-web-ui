<template>
  <div class="favorites-view">
    <GradientBackground />

    <div class="container">
      <div class="header">
        <h1 class="title">{{ $t('favorites.title') }}</h1>
        <p class="subtitle">{{ $t('favorites.subtitle') }}</p>
      </div>

      <!-- Filters Section -->
      <FilterBar
        v-model="filters"
        :restaurants="restaurants"
        show-platform
        show-restaurant
        show-content-type
        show-sort
        @change="applyFilters"
        @clear="resetFilters"
      />

      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <div class="spinner"></div>
        <p>{{ $t('favorites.loading') }}</p>
      </div>

      <!-- Empty State -->
      <BaseCard v-else-if="favorites.length === 0" variant="glass-intense" class="empty-state">
        <div class="empty-content">
          <h3>{{ $t('favorites.noFavorites') }}</h3>
          <p>{{ $t('favorites.noFavoritesDescription') }}</p>
          <BaseButton variant="primary" @click="router.push('/cook-up')">
            {{ $t('favorites.goToCookUp') }}
          </BaseButton>
        </div>
      </BaseCard>

      <!-- Favorites Grid -->
      <div v-else class="favorites-grid">
        <BaseCard
          v-for="favorite in favorites"
          :key="favorite.id"
          variant="glass"
          class="favorite-card"
          @click="viewDetails(favorite)"
        >
          <!-- Media Preview -->
          <div class="media-container">
            <img
              v-if="favorite.content_type === 'image'"
              :src="favorite.media_url"
              alt="Favorite post"
              class="favorite-media"
            />
            <video
              v-else
              :src="favorite.media_url"
              class="favorite-media"
              controls
            ></video>

            <!-- Content Type Icon -->
            <span :class="['type-icon', favorite.content_type]">
              {{ favorite.content_type === 'image' ? '📸' : '🎥' }}
            </span>
          </div>

          <!-- Post Details -->
          <div class="favorite-details">
            <!-- Restaurant Name -->
            <div v-if="favorite.saved_restaurants?.name" class="restaurant-name">
              🏪 {{ favorite.saved_restaurants.name }}
            </div>

            <!-- Post Text -->
            <p v-if="favorite.post_text" class="post-text">
              {{ truncateText(favorite.post_text, 150) }}
            </p>

            <!-- Hashtags -->
            <div v-if="favorite.hashtags && favorite.hashtags.length > 0" class="hashtags">
              <span v-for="(tag, idx) in favorite.hashtags.slice(0, 3)" :key="idx" class="hashtag">
                {{ tag }}
              </span>
              <span v-if="favorite.hashtags.length > 3" class="more-tags">
                +{{ favorite.hashtags.length - 3 }}
              </span>
            </div>

            <!-- Bottom Info (Created Date & Platform) -->
            <div class="card-footer">
              <div class="created-date">
                {{ formatDate(favorite.created_at) }}
              </div>
              <span v-if="favorite.platform" :class="['platform-badge', `platform-${favorite.platform}`]">
                {{ favorite.platform }}
              </span>
            </div>
          </div>
        </BaseCard>
      </div>

      <!-- Pagination -->
      <BasePagination
        v-if="!loading && favorites.length > 0"
        v-model:current-page="currentPage"
        :total-pages="totalPages"
        :total-items="totalItems"
        class="pagination-container"
        @update:current-page="handlePageChange"
      />
    </div>

    <!-- Schedule Modal -->
    <ScheduleModal
      v-model="showScheduleModal"
      :favorite-post="selectedFavorite"
      @scheduled="handleScheduled"
    />

    <!-- Delete Confirmation Modal -->
    <ConfirmModal
      v-model="showDeleteModal"
      title="Delete Favorite"
      message="Are you sure you want to delete this favorite post? This action cannot be undone."
      confirm-text="Delete"
      cancel-text="Cancel"
      type="danger"
      :loading="deletingFavorite"
      @confirm="handleDeleteConfirm"
      @cancel="handleDeleteCancel"
    />

    <!-- Detail Modal -->
    <Teleport to="body">
      <div v-if="showDetailModal" class="modal-overlay" @click.self="closeDetailModal">
        <BaseCard variant="glass-intense" class="detail-modal">
          <div class="modal-header">
            <h3 class="modal-title">{{ $t('favorites.postDetails') }}</h3>
            <button class="close-btn" @click="closeDetailModal">&times;</button>
          </div>

          <div v-if="selectedFavorite" class="modal-body">
            <!-- Media -->
            <img
              v-if="selectedFavorite.content_type === 'image'"
              :src="selectedFavorite.media_url"
              alt="Post"
              class="detail-media"
            />
            <video
              v-else
              :src="selectedFavorite.media_url"
              class="detail-media"
              controls
            ></video>

            <!-- Restaurant Info -->
            <div v-if="selectedFavorite.saved_restaurants?.name" class="detail-section">
              <h4>{{ $t('favorites.restaurant') }}</h4>
              <p>{{ selectedFavorite.saved_restaurants.name }}</p>
            </div>

            <!-- Full Post Text -->
            <div v-if="selectedFavorite.post_text" class="detail-section">
              <h4>{{ $t('favorites.postText') }}</h4>
              <textarea
                v-if="isEditMode"
                v-model="selectedFavorite.post_text"
                class="edit-textarea"
                rows="6"
              ></textarea>
              <p v-else class="full-text">{{ selectedFavorite.post_text }}</p>
            </div>

            <!-- Call to Action -->
            <div v-if="selectedFavorite.call_to_action || isEditMode" class="detail-section">
              <h4>{{ $t('favorites.callToAction') }}</h4>
              <input
                v-if="isEditMode"
                v-model="selectedFavorite.call_to_action"
                type="text"
                class="edit-input"
              />
              <p v-else class="full-text">{{ selectedFavorite.call_to_action }}</p>
            </div>

            <!-- Hashtags -->
            <div v-if="selectedFavorite.hashtags && selectedFavorite.hashtags.length > 0" class="detail-section">
              <h4>{{ $t('favorites.hashtags') }}</h4>
              <div class="hashtags-full">
                <span v-for="(tag, idx) in selectedFavorite.hashtags" :key="idx" class="hashtag">
                  {{ tag }}
                </span>
              </div>
            </div>

            <!-- Platform -->
            <div v-if="selectedFavorite.platform || isEditMode" class="detail-section">
              <h4>Platform</h4>
              <select v-if="isEditMode" v-model="selectedFavorite.platform" class="edit-select">
                <option value="instagram">Instagram</option>
                <option value="facebook">Facebook</option>
                <option value="tiktok">TikTok</option>
                <option value="twitter">Twitter</option>
                <option value="linkedin">LinkedIn</option>
              </select>
              <p v-else class="full-text" style="text-transform: capitalize;">{{ selectedFavorite.platform }}</p>
            </div>

            <!-- Prompt -->
            <div v-if="selectedFavorite.prompt" class="detail-section">
              <h4>{{ $t('favorites.originalPrompt') }}</h4>
              <p class="prompt-text">{{ selectedFavorite.prompt }}</p>
            </div>

            <!-- Action Buttons -->
            <div class="modal-actions">
              <!-- Edit Mode Buttons -->
              <template v-if="isEditMode">
                <BaseButton variant="primary" @click="saveChanges">
                  💾 Save Changes
                </BaseButton>
                <BaseButton variant="ghost" @click="cancelEdit">
                  ✖ Cancel
                </BaseButton>
              </template>

              <!-- View Mode Buttons -->
              <template v-else>
                <BaseButton variant="secondary" @click="enableEditMode">
                  ✏️ Edit
                </BaseButton>
                <BaseButton variant="primary" @click="schedulePost(selectedFavorite)">
                  📅 Schedule Post
                </BaseButton>
                <BaseButton variant="danger" @click="confirmDeleteFromModal">
                  🗑️ Delete
                </BaseButton>
              </template>
            </div>
          </div>
        </BaseCard>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import GradientBackground from '../components/GradientBackground.vue'
import BaseCard from '../components/BaseCard.vue'
import BaseButton from '../components/BaseButton.vue'
import BasePagination from '../components/BasePagination.vue'
import ConfirmModal from '../components/ConfirmModal.vue'
import ScheduleModal from '../components/ScheduleModal.vue'
import FilterBar from '../components/FilterBar.vue'
import { api } from '../services/api'

const router = useRouter()
const { t } = useI18n()

// State
const favorites = ref<any[]>([])
const restaurants = ref<any[]>([])
const loading = ref(false)
const selectedFavorite = ref<any>(null)
const showScheduleModal = ref(false)
const showDetailModal = ref(false)
const showDeleteModal = ref(false)
const deletingFavorite = ref(false)
const favoriteToDelete = ref<string | null>(null)
const isEditMode = ref(false)
const originalFavorite = ref<any>(null)

// Filters
const filters = ref({
  platform: '',
  restaurant_id: '',
  content_type: '',
  sort: 'newest' as 'newest' | 'oldest',
})

// Pagination
const currentPage = ref(1)
const itemsPerPage = 12
const totalItems = ref(0)
const totalPages = ref(0)

// Fetch favorites with filters and pagination
const fetchFavorites = async () => {
  try {
    loading.value = true
    const offset = (currentPage.value - 1) * itemsPerPage

    const response = await api.getFavorites({
      platform: filters.value.platform || undefined,
      restaurant_id: filters.value.restaurant_id || undefined,
      content_type: filters.value.content_type as 'image' | 'video' | undefined,
      limit: itemsPerPage,
      offset,
      sort: filters.value.sort,
    })

    if (response.success) {
      favorites.value = response.data?.favorites || []
      totalItems.value = response.data?.pagination?.total || 0
      totalPages.value = response.data?.pagination?.totalPages || 0
    }
  } catch (error) {
    console.error('Error fetching favorites:', error)
  } finally {
    loading.value = false
  }
}

// Fetch restaurants for filter dropdown
const fetchRestaurants = async () => {
  try {
    const response = await api.getRestaurants()
    if (response.success) {
      restaurants.value = response.data || []
    }
  } catch (error) {
    console.error('Error fetching restaurants:', error)
  }
}

// Filter and pagination handlers
const applyFilters = () => {
  currentPage.value = 1 // Reset to first page when filters change
  fetchFavorites()
}

const resetFilters = () => {
  filters.value = {
    platform: '',
    restaurant_id: '',
    content_type: '',
    sort: 'newest',
  }
  applyFilters()
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchFavorites()
  // Scroll to top of grid
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Post actions
const schedulePost = (favorite: any) => {
  const favoriteToSchedule = favorite ? { ...favorite } : (selectedFavorite.value ? { ...selectedFavorite.value } : null)

  if (!favoriteToSchedule) {
    console.error('No favorite post selected')
    return
  }

  // Close detail modal if it's open
  showDetailModal.value = false

  // Set the favorite and open schedule modal
  selectedFavorite.value = favoriteToSchedule
  showScheduleModal.value = true
}

const viewDetails = (favorite: any) => {
  selectedFavorite.value = { ...favorite }
  originalFavorite.value = { ...favorite }
  isEditMode.value = false
  showDetailModal.value = true
}

const closeDetailModal = () => {
  showDetailModal.value = false
  selectedFavorite.value = null
  originalFavorite.value = null
  isEditMode.value = false
}

const enableEditMode = () => {
  isEditMode.value = true
}

const cancelEdit = () => {
  if (originalFavorite.value) {
    selectedFavorite.value = { ...originalFavorite.value }
  }
  isEditMode.value = false
}

// Save changes from detail modal
const saveChanges = async () => {
  if (!selectedFavorite.value) return

  try {
    const response = await api.updateFavorite(selectedFavorite.value.id, {
      post_text: selectedFavorite.value.post_text,
      hashtags: selectedFavorite.value.hashtags,
      call_to_action: selectedFavorite.value.call_to_action,
      platform: selectedFavorite.value.platform,
    })

    if (response.success) {
      await fetchFavorites()
      isEditMode.value = false
      originalFavorite.value = { ...selectedFavorite.value }
      alert('Changes saved successfully!')
    }
  } catch (error) {
    console.error('Error saving changes:', error)
    alert('Failed to save changes')
  }
}

// Delete from detail modal
const confirmDeleteFromModal = () => {
  if (!selectedFavorite.value) return
  favoriteToDelete.value = selectedFavorite.value.id
  showDeleteModal.value = true
}

// Delete with confirmation modal
const confirmDelete = (id: string) => {
  favoriteToDelete.value = id
  showDeleteModal.value = true
}

const handleDeleteConfirm = async () => {
  if (!favoriteToDelete.value) return

  try {
    deletingFavorite.value = true
    const response = await api.deleteFavorite(favoriteToDelete.value)

    if (response.success) {
      showDeleteModal.value = false
      showDetailModal.value = false
      favoriteToDelete.value = null
      selectedFavorite.value = null
      await fetchFavorites()
    }
  } catch (error) {
    console.error('Error deleting favorite:', error)
  } finally {
    deletingFavorite.value = false
  }
}

const handleDeleteCancel = () => {
  showDeleteModal.value = false
  favoriteToDelete.value = null
}

const handleScheduled = () => {
  showScheduleModal.value = false
  selectedFavorite.value = null
}

// Utility functions
const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    alert(t('favorites.copiedToClipboard'))
  } catch (error) {
    console.error('Error copying to clipboard:', error)
  }
}

// Initialize
onMounted(() => {
  fetchFavorites()
  fetchRestaurants()
})
</script>

<style scoped>
.favorites-view {
  min-height: 100vh;
  position: relative;
  padding: 2rem 1rem;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.header {
  text-align: center;
  margin-bottom: 2rem;
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
  padding: 3rem;
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
  to {
    transform: rotate(360deg);
  }
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

.favorites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.favorite-card {
  overflow: hidden;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  position: relative;
  background: rgba(20, 20, 20, 0.6) !important;
  backdrop-filter: blur(16px);
  border: 1px solid rgba(212, 175, 55, 0.15);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.2),
    0 0 0 1px rgba(212, 175, 55, 0.1);
}

.favorite-card:hover,
.favorite-card.card-expanded {
  transform: translateY(-8px) scale(1.02);
  border-color: rgba(212, 175, 55, 0.4);
  box-shadow:
    0 16px 48px rgba(0, 0, 0, 0.4),
    0 0 40px rgba(212, 175, 55, 0.15),
    0 0 0 1px rgba(212, 175, 55, 0.3);
  background: rgba(20, 20, 20, 0.8) !important;
}

.favorite-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, transparent, var(--gold-primary), transparent);
  opacity: 1;
  transition: opacity 0.4s ease;
}

.favorite-card:hover::before {
  opacity: 1;
  background: linear-gradient(90deg, var(--gold-primary), var(--gold-light), var(--gold-primary));
}

.media-container {
  position: relative;
  width: 100%;
  height: 250px;
  overflow: hidden;
}

.favorite-media {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.type-icon {
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  font-size: 1.5rem;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.5));
  transition: transform 0.3s ease;
}

.favorite-card:hover .type-icon {
  transform: scale(1.1);
}

.platform-badge {
  padding: 0.4rem 0.875rem;
  border-radius: 6px;
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}

.platform-badge.platform-instagram {
  background: linear-gradient(135deg, rgba(225, 48, 108, 0.9), rgba(253, 29, 29, 0.9));
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.platform-badge.platform-facebook {
  background: linear-gradient(135deg, rgba(66, 103, 178, 0.9), rgba(24, 119, 242, 0.9));
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.platform-badge.platform-tiktok {
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(37, 244, 238, 0.3));
  color: white;
  border: 1px solid rgba(37, 244, 238, 0.5);
}

.platform-badge.platform-twitter {
  background: linear-gradient(135deg, rgba(29, 161, 242, 0.9), rgba(26, 140, 216, 0.9));
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.platform-badge.platform-linkedin {
  background: linear-gradient(135deg, rgba(10, 102, 194, 0.9), rgba(0, 119, 181, 0.9));
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.favorite-details {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  flex: 1;
}

.restaurant-name {
  font-size: 0.875rem;
  color: var(--gold-primary);
  font-weight: 600;
}

.post-text {
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
  flex: 1;
}

.hashtags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.hashtag {
  padding: 0.25rem 0.75rem;
  background: rgba(212, 175, 55, 0.15);
  color: var(--gold-light);
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
}

.more-tags {
  padding: 0.25rem 0.75rem;
  background: rgba(212, 175, 55, 0.1);
  color: var(--text-muted);
  border-radius: 6px;
  font-size: 0.75rem;
}


/* Card Footer */
.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid rgba(212, 175, 55, 0.15);
}

.created-date {
  font-size: 0.75rem;
  color: var(--text-muted);
}

/* Detail Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(var(--blur-md));
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-xl);
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.detail-modal {
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-xl);
  border-bottom: 1px solid rgba(212, 175, 55, 0.2);
}

.modal-title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  color: var(--gold-primary);
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 2rem;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(212, 175, 55, 0.1);
  color: var(--gold-primary);
}

.modal-body {
  padding: var(--space-xl);
}

.detail-media {
  width: 100%;
  max-height: 400px;
  object-fit: contain;
  border-radius: var(--radius-md);
  margin-bottom: var(--space-xl);
}

.detail-section {
  margin-bottom: var(--space-xl);
  padding-bottom: var(--space-xl);
  border-bottom: 1px solid rgba(212, 175, 55, 0.1);
}

.detail-section:last-child {
  border-bottom: none;
}

.detail-section h4 {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  color: var(--gold-primary);
  margin: 0 0 var(--space-md) 0;
}

.full-text,
.prompt-text {
  color: var(--text-secondary);
  line-height: 1.6;
  white-space: pre-wrap;
  margin-bottom: var(--space-md);
}

.hashtags-full {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: var(--space-md);
}

/* Edit inputs in modal */
.edit-textarea,
.edit-input,
.edit-select {
  width: 100%;
  background: rgba(10, 10, 10, 0.8);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: var(--radius-md);
  padding: var(--space-sm) var(--space-md);
  color: var(--text-primary);
  font-size: 0.9375rem;
  font-family: var(--font-body);
  transition: all 0.3s ease;
  resize: vertical;
}

.edit-textarea:focus,
.edit-input:focus,
.edit-select:focus {
  outline: none;
  border-color: var(--gold-primary);
  box-shadow: 0 0 15px rgba(212, 175, 55, 0.3);
}

.edit-select option {
  background: var(--bg-primary);
  color: var(--text-primary);
}

/* Modal actions */
.modal-actions {
  display: flex;
  gap: var(--space-md);
  margin-top: var(--space-xl);
  padding-top: var(--space-xl);
  border-top: 1px solid rgba(212, 175, 55, 0.2);
  flex-wrap: wrap;
}

.modal-actions button {
  flex: 1;
  min-width: 150px;
}

/* Pagination */
.pagination-container {
  margin-top: 3rem;
  display: flex;
  justify-content: center;
}

/* Responsive */
@media (max-width: 768px) {
  .title {
    font-size: 2rem;
  }

  .favorites-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .modal-actions {
    flex-direction: column;
  }

  .modal-actions button {
    min-width: 100%;
  }
}

/* Enhanced media container */
.media-container {
  overflow: hidden;
  border-radius: var(--radius-md) var(--radius-md) 0 0;
}

.favorite-media {
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.favorite-card:hover .favorite-media {
  transform: scale(1.05);
}

/* Restaurant name enhancement */
.restaurant-name {
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.1), rgba(212, 175, 55, 0.05));
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  border-left: 3px solid var(--gold-primary);
}

/* Hashtag enhancements */
.hashtag {
  border: 1px solid rgba(212, 175, 55, 0.3);
  transition: all 0.2s ease;
}

.hashtag:hover {
  background: rgba(212, 175, 55, 0.25);
  border-color: var(--gold-primary);
  transform: translateY(-2px);
}

/* Smooth scroll behavior */
html {
  scroll-behavior: smooth;
}
</style>

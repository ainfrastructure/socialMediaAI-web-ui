<template>
  <DashboardLayout>
    <div class="content-hub-view">
    <div class="container">
      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <div class="spinner"></div>
        <p>{{ $t('contentHub.loading') }}</p>
      </div>

      <!-- Main Content -->
      <div v-else class="content-hub">
        <!-- Restaurant Header -->
        <div class="restaurant-header">
          <div class="header-content clickable-header" @click="showRestaurantSelector = true">
            <div class="logo-container">
              <div v-if="selectedRestaurant?.brand_dna?.logo_url" class="restaurant-logo">
                <img :src="selectedRestaurant.brand_dna.logo_url" :alt="selectedRestaurant.name" />
              </div>
              <div v-else class="restaurant-logo placeholder">
                <span class="placeholder-icon">🏪</span>
              </div>
            </div>
            <div class="restaurant-info">
              <h1 class="restaurant-name">{{ selectedRestaurant?.name }}</h1>
              <p class="restaurant-address">{{ selectedRestaurant?.address }}</p>
            </div>
          </div>
        </div>

        <!-- Create Content Card -->
        <BaseCard variant="glass" hoverable class="create-card" @click="goToCreate">
          <div class="create-content">
            <img src="/socialchef_logo.svg" alt="Social Chef" class="create-icon" />
            <div class="create-text">
              <h2 class="create-title">{{ $t('contentHub.createNew') }}</h2>
              <p class="create-description">{{ $t('contentHub.createDescription') }}</p>
            </div>
            <BaseButton variant="primary" size="large">
              {{ $t('contentHub.startCreating') }}
            </BaseButton>
          </div>
        </BaseCard>

        <!-- Posts Section -->
        <section class="posts-section">
          <div class="section-header">
            <h2 class="section-title">{{ $t('contentHub.yourPosts') }}</h2>
          </div>

          <!-- Inline Filters -->
          <div class="inline-filters">
            <div class="filter-group">
              <select v-model="filters.content_type" class="inline-select" @change="applyFilters">
                <option value="">{{ $t('contentHub.filterAll') }}</option>
                <option value="image">{{ $t('posts.image') }}</option>
                <option value="video">{{ $t('posts.video') }}</option>
              </select>
            </div>

            <div class="filter-group">
              <select v-model="filters.sort" class="inline-select" @change="applyFilters">
                <option value="newest">{{ $t('contentHub.sortNewest') }}</option>
                <option value="oldest">{{ $t('contentHub.sortOldest') }}</option>
              </select>
            </div>

            <span v-if="totalItems > 0" class="posts-count">
              {{ totalItems }} {{ totalItems === 1 ? 'post' : 'posts' }}
            </span>
          </div>

          <!-- Loading Posts -->
          <div v-if="loadingPosts" class="loading-container small">
            <div class="spinner"></div>
          </div>

          <!-- Empty State -->
          <BaseCard v-else-if="posts.length === 0" variant="glass" class="empty-state">
            <div class="empty-content">
              <span class="empty-icon">📝</span>
              <h3>{{ $t('contentHub.noPosts') }}</h3>
              <p>{{ $t('contentHub.noPostsDescription') }}</p>
            </div>
          </BaseCard>

          <!-- Posts Grid -->
          <div v-else class="posts-grid">
            <BaseCard
              v-for="post in posts"
              :key="post.id"
              variant="glass"
              class="post-card"
              @click="viewDetails(post)"
            >
              <!-- Media Preview -->
              <div class="media-container">
                <img
                  v-if="post.content_type === 'image'"
                  :src="post.media_url"
                  :alt="$t('posts.postAlt')"
                  class="post-media"
                />
                <video v-else :src="post.media_url" class="post-media"></video>

                <!-- Content Type Icon -->
                <span :class="['type-icon', post.content_type]">
                  {{ post.content_type === 'image' ? '📸' : '🎥' }}
                </span>
              </div>

              <!-- Post Details -->
              <div class="post-details">
                <!-- Post Text -->
                <p v-if="post.post_text" class="post-text">
                  {{ truncateText(post.post_text, 120) }}
                </p>

                <!-- Hashtags -->
                <div v-if="post.hashtags && post.hashtags.length > 0" class="hashtags">
                  <span v-for="(tag, idx) in post.hashtags.slice(0, 3)" :key="idx" class="hashtag">
                    {{ tag }}
                  </span>
                  <span v-if="post.hashtags.length > 3" class="more-tags">
                    +{{ post.hashtags.length - 3 }}
                  </span>
                </div>

                <!-- Bottom Info -->
                <div class="card-footer">
                  <div class="created-date">
                    {{ formatDate(post.created_at) }}
                  </div>
                  <div class="platform-badges">
                    <template v-if="post.platforms && post.platforms.length > 0">
                      <span
                        v-for="platform in post.platforms"
                        :key="platform"
                        :class="['platform-badge', `platform-${platform}`]"
                      >
                        {{ platform }}
                      </span>
                    </template>
                    <span
                      v-else-if="post.platform"
                      :class="['platform-badge', `platform-${post.platform}`]"
                    >
                      {{ post.platform }}
                    </span>
                  </div>
                </div>
              </div>
            </BaseCard>
          </div>

          <!-- Pagination -->
          <BasePagination
            v-if="!loadingPosts && posts.length > 0"
            v-model:current-page="currentPage"
            :total-pages="totalPages"
            :total-items="totalItems"
            class="pagination-container"
            @update:current-page="handlePageChange"
          />
        </section>
      </div>
    </div>

    <!-- Restaurant Selector Modal -->
    <RestaurantSelectorModal
      v-model="showRestaurantSelector"
      :restaurants="restaurants"
      :current-id="selectedRestaurant?.id"
      @select="handleRestaurantChange"
      @restaurant-added="handleRestaurantAdded"
      @delete="handleDeleteRestaurant"
    />

    <!-- Schedule Modal -->
    <ScheduleModal
      v-model="showScheduleModal"
      :favorite-post="selectedPost"
      @scheduled="handleScheduled"
    />

    <!-- Delete Confirmation Modal -->
    <ConfirmModal
      v-model="showDeleteModal"
      :title="$t('posts.deleteModalTitle')"
      :message="$t('posts.deleteModalMessage')"
      :confirm-text="$t('common.delete')"
      :cancel-text="$t('common.cancel')"
      type="danger"
      :loading="deletingPost"
      @confirm="handleDeleteConfirm"
      @cancel="handleDeleteCancel"
    />

    <!-- Detail Modal (View Mode) -->
    <PostDetailModal
      v-if="!isEditMode"
      v-model="showDetailModal"
      :post="selectedPostWithDraftStatus"
      @edit="enableEditMode"
      @schedule="schedulePost"
      @delete="confirmDeleteFromModal"
      @close="closeDetailModal"
    />

    <!-- Edit Modal (Edit Mode) -->
    <Teleport to="body">
      <div v-if="showDetailModal && isEditMode" class="modal-overlay" @click.self="cancelEdit">
        <BaseCard variant="glass-intense" class="detail-modal">
          <div class="modal-header">
            <h3 class="modal-title">{{ $t('posts.editPost') }}</h3>
            <button class="close-btn" @click="cancelEdit">&times;</button>
          </div>

          <div v-if="selectedPost" class="modal-body">
            <!-- Media -->
            <img
              v-if="selectedPost.content_type === 'image'"
              :src="selectedPost.media_url"
              :alt="$t('posts.postAlt')"
              class="detail-media"
            />
            <video v-else :src="selectedPost.media_url" class="detail-media" controls></video>

            <!-- Full Post Text -->
            <div class="detail-section">
              <h4>{{ $t('posts.postText') }}</h4>
              <textarea
                v-model="selectedPost.post_text"
                class="edit-textarea"
                rows="6"
              ></textarea>
            </div>

            <!-- Hashtags -->
            <div class="detail-section">
              <h4>{{ $t('posts.hashtags') }}</h4>
              <div class="hashtag-editor">
                <div class="hashtag-tags">
                  <span v-for="(tag, idx) in selectedPost.hashtags" :key="idx" class="hashtag-tag">
                    {{ tag }}
                    <button @click="removeHashtag(idx)" class="remove-tag">&times;</button>
                  </span>
                </div>
                <input
                  v-model="newHashtag"
                  @keydown.enter.prevent="addHashtag"
                  @keydown.,.prevent="addHashtag"
                  :placeholder="$t('posts.addHashtagPlaceholder')"
                  class="hashtag-input"
                />
              </div>
            </div>

            <!-- Platform -->
            <div class="detail-section">
              <h4>{{ $t('posts.platformSection') }}</h4>
              <select v-model="selectedPost.platform" class="edit-select">
                <option value="instagram">{{ $t('platforms.instagram') }}</option>
                <option value="facebook">{{ $t('platforms.facebook') }}</option>
                <option value="tiktok">{{ $t('platforms.tiktok') }}</option>
                <option value="twitter">{{ $t('platforms.twitter') }}</option>
                <option value="linkedin">{{ $t('platforms.linkedin') }}</option>
              </select>
            </div>

            <!-- Action Buttons -->
            <div class="modal-actions">
              <BaseButton variant="primary" @click="saveChanges">
                {{ $t('posts.saveChangesButton') }}
              </BaseButton>
              <BaseButton variant="ghost" @click="cancelEdit">
                {{ $t('posts.cancelChangesButton') }}
              </BaseButton>
            </div>
          </div>
        </BaseCard>
      </div>
    </Teleport>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { usePreferencesStore } from '@/stores/preferences'
import { api } from '@/services/api'
import { restaurantService, type SavedRestaurant } from '@/services/restaurantService'
import DashboardLayout from '@/components/DashboardLayout.vue'
import BaseCard from '@/components/BaseCard.vue'
import BaseButton from '@/components/BaseButton.vue'
import BasePagination from '@/components/BasePagination.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
import ScheduleModal from '@/components/ScheduleModal.vue'
import RestaurantSelectorModal from '@/components/RestaurantSelectorModal.vue'
import PostDetailModal from '@/components/PostDetailModal.vue'

const router = useRouter()
const { t } = useI18n()
const preferencesStore = usePreferencesStore()

// State
const loading = ref(true)
const loadingPosts = ref(false)
const restaurants = ref<SavedRestaurant[]>([])
const selectedRestaurant = ref<SavedRestaurant | null>(null)
const posts = ref<any[]>([])
const showRestaurantSelector = ref(false)

// Post detail modal state
const selectedPost = ref<any>(null)
const showDetailModal = ref(false)
const showScheduleModal = ref(false)
const showDeleteModal = ref(false)
const deletingPost = ref(false)
const postToDelete = ref<string | null>(null)
const isEditMode = ref(false)
const originalPost = ref<any>(null)
const newHashtag = ref('')

// Computed to add draft status for PostDetailModal
const selectedPostWithDraftStatus = computed(() => {
  if (!selectedPost.value) return null
  return {
    ...selectedPost.value,
    status: 'draft' // ContentHub posts are favorites/drafts
  }
})

// Filters
const filters = ref({
  platform: '',
  content_type: '',
  sort: 'newest' as 'newest' | 'oldest',
})

// Pagination
const currentPage = ref(1)
const itemsPerPage = 12
const totalItems = ref(0)
const totalPages = ref(0)

// Initialize
onMounted(async () => {
  try {
    // Fetch restaurants
    const response = await api.getRestaurants()
    if (response.success) {
      restaurants.value = response.data || []
    }

    // If no restaurants, redirect to onboarding
    if (restaurants.value.length === 0) {
      router.push('/onboarding')
      return
    }

    // Auto-select restaurant
    const savedId = preferencesStore.selectedRestaurantId
    if (savedId) {
      const found = restaurants.value.find((r) => r.id === savedId)
      if (found) {
        selectedRestaurant.value = found
      }
    }

    // If no saved selection or invalid, use first restaurant
    if (!selectedRestaurant.value) {
      selectedRestaurant.value = restaurants.value[0]
      preferencesStore.setSelectedRestaurant(restaurants.value[0].id)
    }

    // Load posts for selected restaurant
    await fetchPosts()
  } finally {
    loading.value = false
  }
})

// Fetch posts filtered by restaurant
async function fetchPosts() {
  if (!selectedRestaurant.value) return

  try {
    loadingPosts.value = true
    const offset = (currentPage.value - 1) * itemsPerPage

    const response = await api.getFavorites({
      restaurant_id: selectedRestaurant.value.id,
      platform: filters.value.platform || undefined,
      content_type: filters.value.content_type as 'image' | 'video' | undefined,
      limit: itemsPerPage,
      offset,
      sort: filters.value.sort,
    })

    if (response.success) {
      posts.value = response.data?.favorites || []
      totalItems.value = response.data?.pagination?.total || 0
      totalPages.value = response.data?.pagination?.totalPages || 0
    }
  } catch (error) {
    console.error('Error fetching posts:', error)
  } finally {
    loadingPosts.value = false
  }
}

// Handle restaurant change
function handleRestaurantChange(restaurant: SavedRestaurant) {
  selectedRestaurant.value = restaurant
  preferencesStore.setSelectedRestaurant(restaurant.id)
  showRestaurantSelector.value = false

  // Reset and reload posts
  currentPage.value = 1
  fetchPosts()
}

// Navigation
function goToCreate() {
  router.push('/content/create')
}

// Handle restaurant added
async function handleRestaurantAdded() {
  try {
    // Refresh restaurants list
    const response = await api.getRestaurants()
    if (response.success) {
      restaurants.value = response.data || []
    }
  } catch (error) {
    console.error('Failed to fetch restaurants:', error)
  }
}

// Handle restaurant deletion
async function handleDeleteRestaurant(restaurant: SavedRestaurant) {
  try {
    await restaurantService.deleteRestaurant(restaurant.place_id)

    // Remove from local list
    restaurants.value = restaurants.value.filter((r) => r.id !== restaurant.id)

    // If the deleted restaurant was selected, select another one or clear
    if (selectedRestaurant.value?.id === restaurant.id) {
      if (restaurants.value.length > 0) {
        selectedRestaurant.value = restaurants.value[0]
        preferencesStore.setSelectedRestaurant(restaurants.value[0].id)
      } else {
        selectedRestaurant.value = null
        preferencesStore.setSelectedRestaurant(null)
      }
      // Reload posts for new selection
      fetchPosts()
    }
  } catch (error) {
    console.error('Failed to delete restaurant:', error)
  }
}

// Filter and pagination handlers
function applyFilters() {
  currentPage.value = 1
  fetchPosts()
}

function resetFilters() {
  filters.value = {
    platform: '',
    content_type: '',
    sort: 'newest',
  }
  applyFilters()
}

function handlePageChange(page: number) {
  currentPage.value = page
  fetchPosts()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Post detail functions
function viewDetails(post: any) {
  selectedPost.value = { ...post }
  originalPost.value = { ...post }
  isEditMode.value = false
  showDetailModal.value = true
}

function closeDetailModal() {
  showDetailModal.value = false
  selectedPost.value = null
  originalPost.value = null
  isEditMode.value = false
}

function enableEditMode() {
  isEditMode.value = true
  newHashtag.value = ''
}

function cancelEdit() {
  if (originalPost.value) {
    selectedPost.value = { ...originalPost.value }
  }
  isEditMode.value = false
}

// Hashtag editing
function addHashtag() {
  if (!selectedPost.value) return
  const tag = newHashtag.value.trim().replace(/^#/, '')
  if (tag) {
    if (!selectedPost.value.hashtags) {
      selectedPost.value.hashtags = []
    }
    if (!selectedPost.value.hashtags.includes(`#${tag}`)) {
      selectedPost.value.hashtags.push(`#${tag}`)
    }
  }
  newHashtag.value = ''
}

function removeHashtag(index: number) {
  if (!selectedPost.value?.hashtags) return
  selectedPost.value.hashtags.splice(index, 1)
}

// Save changes
async function saveChanges() {
  if (!selectedPost.value) return

  try {
    const response = await api.updateFavorite(selectedPost.value.id, {
      post_text: selectedPost.value.post_text,
      hashtags: selectedPost.value.hashtags,
      platform: selectedPost.value.platform,
    })

    if (response.success) {
      await fetchPosts()
      isEditMode.value = false
      originalPost.value = { ...selectedPost.value }
    }
  } catch (error) {
    console.error('Error saving changes:', error)
  }
}

// Schedule post
function schedulePost(post: any) {
  const postToSchedule = post ? { ...post } : selectedPost.value ? { ...selectedPost.value } : null
  if (!postToSchedule) return

  showDetailModal.value = false
  selectedPost.value = postToSchedule
  showScheduleModal.value = true
}

function handleScheduled() {
  showScheduleModal.value = false
  selectedPost.value = null
}

// Delete post
function confirmDeleteFromModal() {
  if (!selectedPost.value) return
  postToDelete.value = selectedPost.value.id
  showDeleteModal.value = true
}

async function handleDeleteConfirm() {
  if (!postToDelete.value) return

  try {
    deletingPost.value = true
    const response = await api.deleteFavorite(postToDelete.value)

    if (response.success) {
      showDeleteModal.value = false
      showDetailModal.value = false
      postToDelete.value = null
      selectedPost.value = null
      await fetchPosts()
    }
  } catch (error) {
    console.error('Error deleting post:', error)
  } finally {
    deletingPost.value = false
  }
}

function handleDeleteCancel() {
  showDeleteModal.value = false
  postToDelete.value = null
}

// Utility functions
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
</script>

<style scoped>
.content-hub-view {
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

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4rem;
  gap: 1rem;
}

.loading-container.small {
  padding: 2rem;
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

/* Restaurant Header */
.restaurant-header {
  margin-bottom: var(--space-3xl);
  padding-bottom: var(--space-2xl);
  border-bottom: 1px solid rgba(212, 175, 55, 0.15);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2xl);
  flex-wrap: wrap;
}

.clickable-header {
  cursor: pointer;
  position: relative;
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.clickable-header:hover {
  opacity: 0.9;
  transform: scale(1.01);
}

.change-restaurant-hint {
  position: absolute;
  top: 0;
  right: 0;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
  padding: var(--space-sm) var(--space-md);
  background: rgba(212, 175, 55, 0.2);
  border: 1px solid var(--gold-primary);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: var(--gold-primary);
  font-weight: var(--font-semibold);
}

.clickable-header:hover .change-restaurant-hint {
  opacity: 1;
}

.logo-container {
  flex-shrink: 0;
  width: 100%;
  max-width: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.restaurant-logo {
  width: 100%;
  min-height: 80px;
  max-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  padding: var(--space-md);
}

.restaurant-logo img {
  max-width: 100%;
  max-height: 120px;
  width: auto;
  height: auto;
  object-fit: contain;
}

.restaurant-logo.placeholder {
  background: rgba(212, 175, 55, 0.1);
  border-radius: var(--radius-lg);
  min-height: 120px;
}

.placeholder-icon {
  font-size: 4rem;
}

.restaurant-info {
  text-align: center;
}

.restaurant-name {
  font-family: var(--font-heading);
  font-size: var(--text-4xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  margin: 0 0 var(--space-sm) 0;
  background: var(--gradient-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.2;
}

.restaurant-address {
  font-size: var(--text-base);
  color: var(--text-secondary);
  margin: 0;
  font-weight: var(--font-normal);
}

/* Create Card */
.create-card {
  margin-bottom: var(--space-3xl);
  cursor: pointer;
  transition: all 0.3s ease;
}

.create-card:hover {
  transform: translateY(-4px);
}

.create-content {
  display: flex;
  align-items: center;
  gap: var(--space-xl);
  padding: var(--space-lg);
}

.create-icon {
  width: 3rem;
  height: 3rem;
  flex-shrink: 0;
  object-fit: contain;
}

.create-text {
  flex: 1;
}

.create-title {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  color: var(--text-primary);
  margin: 0 0 var(--space-xs) 0;
}

.create-description {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: 0;
}

/* Posts Section */
.posts-section {
  margin-top: var(--space-2xl);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-xl);
  flex-wrap: wrap;
  gap: var(--space-lg);
}

.section-title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  color: var(--text-primary);
  margin: 0;
}

/* Inline Filters */
.inline-filters {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-xl);
  flex-wrap: wrap;
}

.filter-group {
  position: relative;
}

.inline-select {
  appearance: none;
  background: rgba(26, 26, 26, 0.6);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: var(--radius-md);
  padding: var(--space-sm) var(--space-2xl) var(--space-sm) var(--space-md);
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: all 0.2s ease;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23D4AF37' d='M6 8L2 4h8z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  min-width: 120px;
}

.inline-select:hover {
  border-color: rgba(212, 175, 55, 0.4);
}

.inline-select:focus {
  outline: none;
  border-color: var(--gold-primary);
  box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.15);
}

.inline-select option {
  background: var(--bg-primary);
  color: var(--text-primary);
}

.posts-count {
  color: var(--text-muted);
  font-size: var(--text-sm);
  margin-left: auto;
}

/* Empty State */
.empty-state {
  padding: 3rem;
  text-align: center;
}

.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
}

.empty-icon {
  font-size: 3rem;
}

.empty-content h3 {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  color: var(--text-primary);
  margin: 0;
}

.empty-content p {
  color: var(--text-secondary);
  margin: 0;
}

/* Posts Grid */
.posts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--space-xl);
}

.post-card {
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
}

.post-card:hover {
  transform: translateY(-4px);
  border-color: rgba(212, 175, 55, 0.4);
}

.media-container {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
  border-radius: var(--radius-md) var(--radius-md) 0 0;
}

.post-media {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.post-card:hover .post-media {
  transform: scale(1.05);
}

.type-icon {
  position: absolute;
  top: var(--space-sm);
  left: var(--space-sm);
  font-size: 1.25rem;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
}

.post-details {
  padding: var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.post-text {
  color: var(--text-secondary);
  line-height: 1.5;
  margin: 0;
  font-size: var(--text-sm);
}

.hashtags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}

.hashtag {
  padding: 0.2rem 0.5rem;
  background: rgba(212, 175, 55, 0.15);
  color: var(--gold-light);
  border-radius: 4px;
  font-size: var(--text-xs);
}

.more-tags {
  padding: 0.2rem 0.5rem;
  background: rgba(212, 175, 55, 0.1);
  color: var(--text-muted);
  border-radius: 4px;
  font-size: var(--text-xs);
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: var(--space-sm);
  padding-top: var(--space-sm);
  border-top: 1px solid rgba(212, 175, 55, 0.1);
}

.created-date {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.platform-badges {
  display: flex;
  gap: var(--space-xs);
  flex-wrap: wrap;
}

.platform-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  text-transform: uppercase;
}

.platform-instagram {
  background: linear-gradient(135deg, rgba(225, 48, 108, 0.9), rgba(253, 29, 29, 0.9));
  color: white;
}

.platform-facebook {
  background: linear-gradient(135deg, rgba(66, 103, 178, 0.9), rgba(24, 119, 242, 0.9));
  color: white;
}

.platform-tiktok {
  background: rgba(0, 0, 0, 0.9);
  color: white;
}

.platform-twitter {
  background: rgba(29, 161, 242, 0.9);
  color: white;
}

.platform-linkedin {
  background: rgba(10, 102, 194, 0.9);
  color: white;
}

/* Pagination */
.pagination-container {
  margin-top: var(--space-2xl);
  display: flex;
  justify-content: center;
}

/* Detail Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(var(--blur-md));
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-xl);
  z-index: 1000;
}

.detail-modal {
  max-width: 700px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: var(--space-lg);
  border-bottom: 1px solid rgba(212, 175, 55, 0.2);
  margin-bottom: var(--space-lg);
}

.modal-title {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  color: var(--gold-primary);
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 2rem;
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
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.detail-media {
  width: 100%;
  max-height: 400px;
  object-fit: contain;
  border-radius: var(--radius-md);
}

.detail-section {
  padding-bottom: var(--space-lg);
  border-bottom: 1px solid rgba(212, 175, 55, 0.1);
}

.detail-section h4 {
  font-family: var(--font-heading);
  font-size: var(--text-base);
  color: var(--gold-primary);
  margin: 0 0 var(--space-sm) 0;
}

.full-text {
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
  white-space: pre-wrap;
}

.hashtags-full {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

/* Edit inputs */
.edit-textarea,
.edit-input,
.edit-select {
  width: 100%;
  background: rgba(10, 10, 10, 0.8);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: var(--radius-md);
  padding: var(--space-sm) var(--space-md);
  color: var(--text-primary);
  font-size: var(--text-base);
  font-family: var(--font-body);
  transition: all 0.3s ease;
}

.edit-textarea:focus,
.edit-input:focus,
.edit-select:focus {
  outline: none;
  border-color: var(--gold-primary);
}

.edit-textarea {
  resize: vertical;
}

.edit-select option {
  background: var(--bg-primary);
}

/* Hashtag editor */
.hashtag-editor {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: var(--radius-md);
  padding: var(--space-md);
}

.hashtag-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  margin-bottom: var(--space-sm);
}

.hashtag-tag {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-sm);
  background: rgba(212, 175, 55, 0.15);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: var(--radius-full);
  color: var(--gold-primary);
  font-size: var(--text-sm);
}

.remove-tag {
  background: none;
  border: none;
  color: var(--gold-primary);
  cursor: pointer;
  padding: 0;
  line-height: 1;
  opacity: 0.7;
}

.remove-tag:hover {
  opacity: 1;
}

.hashtag-input {
  width: 100%;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: var(--text-base);
  padding: var(--space-xs) 0;
}

.hashtag-input:focus {
  outline: none;
}

.hashtag-input::placeholder {
  color: var(--text-muted);
}

/* Modal actions */
.modal-actions {
  display: flex;
  gap: var(--space-md);
  margin-top: var(--space-lg);
  padding-top: var(--space-lg);
  border-top: 1px solid rgba(212, 175, 55, 0.2);
  flex-wrap: wrap;
}

.modal-actions button {
  flex: 1;
  min-width: 120px;
}

/* Responsive */
@media (max-width: 768px) {
  .content-hub-view {
    padding: 1rem;
  }

  .restaurant-header {
    margin-bottom: var(--space-2xl);
    padding-bottom: var(--space-xl);
  }

  .restaurant-logo {
    width: 100px;
    height: 100px;
  }

  .restaurant-name {
    font-size: var(--text-3xl);
  }

  .restaurant-address {
    font-size: var(--text-sm);
  }

  .header-actions {
    width: 100%;
  }

  .header-actions button {
    width: 100%;
  }

  .create-content {
    flex-direction: column;
    text-align: center;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .inline-filters {
    width: 100%;
  }

  .inline-select {
    flex: 1;
    min-width: 100px;
  }

  .posts-count {
    width: 100%;
    text-align: right;
    margin-left: 0;
    margin-top: var(--space-xs);
  }

  .posts-grid {
    grid-template-columns: 1fr;
  }

  .modal-actions {
    flex-direction: column;
  }

  .modal-actions button {
    min-width: 100%;
  }
}
</style>

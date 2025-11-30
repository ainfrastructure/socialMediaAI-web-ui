<template>
  <div class="posts-view">
    <GradientBackground />

    <div class="container">
      <div class="header">
        <h1 class="title">{{ $t('posts.title') }}</h1>
        <p class="subtitle">{{ $t('posts.subtitle') }}</p>
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
        <p>{{ $t('posts.loading') }}</p>
      </div>

      <!-- Empty State -->
      <BaseCard v-else-if="posts.length === 0" variant="glass-intense" class="empty-state">
        <div class="empty-content">
          <h3>{{ $t('posts.noPosts') }}</h3>
          <p>{{ $t('posts.noPostsDescription') }}</p>
          <BaseButton variant="primary" @click="router.push('/cook-up')">
            {{ $t('posts.goToCookUp') }}
          </BaseButton>
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
            <video
              v-else
              :src="post.media_url"
              class="post-media"
              controls
            ></video>

            <!-- Content Type Icon -->
            <span :class="['type-icon', post.content_type]">
              {{ post.content_type === 'image' ? '📸' : '🎥' }}
            </span>
          </div>

          <!-- Post Details -->
          <div class="post-details">
            <!-- Restaurant Name -->
            <div v-if="post.saved_restaurants?.name" class="restaurant-name">
              🏪 {{ post.saved_restaurants.name }}
            </div>

            <!-- Post Text -->
            <p v-if="post.post_text" class="post-text">
              {{ truncateText(post.post_text, 150) }}
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

            <!-- Bottom Info (Created Date & Platform) -->
            <div class="card-footer">
              <div class="created-date">
                {{ formatDate(post.created_at) }}
              </div>
              <span v-if="post.platform" :class="['platform-badge', `platform-${post.platform}`]">
                {{ post.platform }}
              </span>
            </div>
          </div>
        </BaseCard>
      </div>

      <!-- Pagination -->
      <BasePagination
        v-if="!loading && posts.length > 0"
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

    <!-- Detail Modal -->
    <Teleport to="body">
      <div v-if="showDetailModal" class="modal-overlay" @click.self="closeDetailModal">
        <BaseCard variant="glass-intense" class="detail-modal">
          <div class="modal-header">
            <h3 class="modal-title">{{ $t('posts.postDetails') }}</h3>
            <button class="close-btn" @click="closeDetailModal">&times;</button>
          </div>

          <div v-if="selectedPost" class="modal-body">
            <!-- Media -->
            <img
              v-if="selectedPost.content_type === 'image'"
              :src="selectedPost.media_url"
              :alt="$t('posts.postAlt')"
              class="detail-media"
            />
            <video
              v-else
              :src="selectedPost.media_url"
              class="detail-media"
              controls
            ></video>

            <!-- Restaurant Info -->
            <div v-if="selectedPost.saved_restaurants?.name" class="detail-section">
              <h4>{{ $t('posts.restaurant') }}</h4>
              <p>{{ selectedPost.saved_restaurants.name }}</p>
            </div>

            <!-- Full Post Text -->
            <div v-if="selectedPost.post_text" class="detail-section">
              <h4>{{ $t('posts.postText') }}</h4>
              <textarea
                v-if="isEditMode"
                v-model="selectedPost.post_text"
                class="edit-textarea"
                rows="6"
              ></textarea>
              <p v-else class="full-text">{{ selectedPost.post_text }}</p>
            </div>

            <!-- Hashtags -->
            <div v-if="(selectedPost.hashtags && selectedPost.hashtags.length > 0) || isEditMode" class="detail-section">
              <h4>{{ $t('posts.hashtags') }}</h4>
              <!-- Edit Mode: Tag Editor -->
              <div v-if="isEditMode" class="hashtag-editor">
                <div class="hashtag-tags">
                  <span
                    v-for="(tag, idx) in selectedPost.hashtags"
                    :key="idx"
                    class="hashtag-tag"
                  >
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
              <!-- View Mode: Display Tags -->
              <div v-else class="hashtags-full">
                <span v-for="(tag, idx) in selectedPost.hashtags" :key="idx" class="hashtag">
                  {{ tag }}
                </span>
              </div>
            </div>

            <!-- Platform -->
            <div v-if="selectedPost.platform || isEditMode" class="detail-section">
              <h4>{{ $t('posts.platformSection') }}</h4>
              <select v-if="isEditMode" v-model="selectedPost.platform" class="edit-select">
                <option value="instagram">{{ $t('platforms.instagram') }}</option>
                <option value="facebook">{{ $t('platforms.facebook') }}</option>
                <option value="tiktok">{{ $t('platforms.tiktok') }}</option>
                <option value="twitter">{{ $t('platforms.twitter') }}</option>
                <option value="linkedin">{{ $t('platforms.linkedin') }}</option>
              </select>
              <p v-else class="full-text" style="text-transform: capitalize;">{{ selectedPost.platform }}</p>
            </div>

            <!-- Prompt -->
            <div v-if="selectedPost.prompt" class="detail-section">
              <h4>{{ $t('posts.originalPrompt') }}</h4>
              <p class="prompt-text">{{ selectedPost.prompt }}</p>
            </div>

            <!-- Action Buttons -->
            <div class="modal-actions">
              <!-- Edit Mode Buttons -->
              <template v-if="isEditMode">
                <BaseButton variant="primary" @click="saveChanges">
                  {{ $t('posts.saveChangesButton') }}
                </BaseButton>
                <BaseButton variant="ghost" @click="cancelEdit">
                  {{ $t('posts.cancelChangesButton') }}
                </BaseButton>
              </template>

              <!-- View Mode Buttons -->
              <template v-else>
                <BaseButton variant="danger" size="small" @click="confirmDeleteFromModal">
                  🗑️ {{ $t('posts.deleteButton') }}
                </BaseButton>
                <BaseButton variant="secondary" @click="enableEditMode">
                  ✏️ {{ $t('posts.editButton') }}
                </BaseButton>
                <BaseButton variant="primary" size="large" @click="schedulePost(selectedPost)">
                  📅 {{ $t('posts.scheduleButton') }}
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
const posts = ref<any[]>([])
const restaurants = ref<any[]>([])
const loading = ref(false)
const selectedPost = ref<any>(null)
const showScheduleModal = ref(false)
const showDetailModal = ref(false)
const showDeleteModal = ref(false)
const deletingPost = ref(false)
const postToDelete = ref<string | null>(null)
const isEditMode = ref(false)
const originalPost = ref<any>(null)
const newHashtag = ref('')

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

// Fetch posts (stored as favorites in backend) with filters and pagination
const fetchPosts = async () => {
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
      posts.value = response.data?.favorites || []
      totalItems.value = response.data?.pagination?.total || 0
      totalPages.value = response.data?.pagination?.totalPages || 0
    }
  } catch (error) {
    console.error('Error fetching posts:', error)
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
  fetchPosts()
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
  fetchPosts()
  // Scroll to top of grid
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Post actions
const schedulePost = (post: any) => {
  const postToSchedule = post ? { ...post } : (selectedPost.value ? { ...selectedPost.value } : null)

  if (!postToSchedule) {
    console.error('No post selected')
    return
  }

  // Close detail modal if it's open
  showDetailModal.value = false

  // Set the post and open schedule modal
  selectedPost.value = postToSchedule
  showScheduleModal.value = true
}

const viewDetails = (post: any) => {
  selectedPost.value = { ...post }
  originalPost.value = { ...post }
  isEditMode.value = false
  showDetailModal.value = true
}

const closeDetailModal = () => {
  showDetailModal.value = false
  selectedPost.value = null
  originalPost.value = null
  isEditMode.value = false
}

const enableEditMode = () => {
  isEditMode.value = true
  newHashtag.value = ''
}

const addHashtag = () => {
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

const removeHashtag = (index: number) => {
  if (!selectedPost.value?.hashtags) return
  selectedPost.value.hashtags.splice(index, 1)
}

const cancelEdit = () => {
  if (originalPost.value) {
    selectedPost.value = { ...originalPost.value }
  }
  isEditMode.value = false
}

// Save changes from detail modal
const saveChanges = async () => {
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
      alert('Changes saved successfully!')
    }
  } catch (error) {
    console.error('Error saving changes:', error)
    alert('Failed to save changes')
  }
}

// Delete from detail modal
const confirmDeleteFromModal = () => {
  if (!selectedPost.value) return
  postToDelete.value = selectedPost.value.id
  showDeleteModal.value = true
}

// Delete with confirmation modal
const confirmDelete = (id: string) => {
  postToDelete.value = id
  showDeleteModal.value = true
}

const handleDeleteConfirm = async () => {
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

const handleDeleteCancel = () => {
  showDeleteModal.value = false
  postToDelete.value = null
}

const handleScheduled = () => {
  showScheduleModal.value = false
  selectedPost.value = null
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
    alert(t('posts.copiedToClipboard'))
  } catch (error) {
    console.error('Error copying to clipboard:', error)
  }
}

// Initialize
onMounted(() => {
  fetchPosts()
  fetchRestaurants()
})
</script>

<style scoped>
.posts-view {
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

.posts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.post-card {
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

.post-card:hover,
.post-card.card-expanded {
  transform: translateY(-8px) scale(1.02);
  border-color: rgba(212, 175, 55, 0.4);
  box-shadow:
    0 16px 48px rgba(0, 0, 0, 0.4),
    0 0 40px rgba(212, 175, 55, 0.15),
    0 0 0 1px rgba(212, 175, 55, 0.3);
  background: rgba(20, 20, 20, 0.8) !important;
}

.post-card::before {
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

.post-card:hover::before {
  opacity: 1;
  background: linear-gradient(90deg, var(--gold-primary), var(--gold-light), var(--gold-primary));
}

.media-container {
  position: relative;
  width: 100%;
  height: 250px;
  overflow: hidden;
}

.post-media {
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

.post-card:hover .type-icon {
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

.post-details {
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

/* Hashtag Editor */
.hashtag-editor {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  transition: all 0.2s ease;
}

.hashtag-editor:focus-within {
  border-color: var(--gold-primary);
  background: rgba(0, 0, 0, 0.5);
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
  font-weight: var(--font-medium);
}

.remove-tag {
  background: none;
  border: none;
  color: var(--gold-primary);
  font-size: var(--text-base);
  cursor: pointer;
  padding: 0;
  line-height: 1;
  opacity: 0.7;
  transition: opacity 0.2s ease;
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
  gap: var(--space-lg);
  margin-top: var(--space-xl);
  padding-top: var(--space-xl);
  border-top: 1px solid rgba(212, 175, 55, 0.2);
  flex-wrap: wrap;
  align-items: stretch;
}

.modal-actions button {
  transition: all var(--transition-base);
}

/* Visual hierarchy through sizing */
.modal-actions button:nth-child(1) {
  /* Delete - smallest, danger variant */
  flex: 0 1 auto;
  min-width: 100px;
}

.modal-actions button:nth-child(2) {
  /* Edit - medium, secondary variant */
  flex: 1 1 auto;
  min-width: 120px;
}

.modal-actions button:nth-child(3) {
  /* Schedule Post - largest, primary variant */
  flex: 2 1 auto;
  min-width: 160px;
}

/* Pagination */
.pagination-container {
  margin-top: 0;
  padding-top: var(--space-3xl);
  display: flex;
  justify-content: center;
  max-width: 1400px;
  margin-left: auto;
  margin-right: auto;
  border-top: 1px solid rgba(212, 175, 55, 0.15);
  animation: fadeInUp 0.4s ease 0.3s both;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .title {
    font-size: 2rem;
  }

  .posts-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .pagination-container {
    padding-top: var(--space-2xl);
  }

  .modal-actions {
    flex-direction: column-reverse;
  }

  .modal-actions button {
    min-width: 100% !important;
    flex: 1 1 auto !important;
  }

  /* On mobile, primary action appears first (Schedule Post) */
}

/* Enhanced media container */
.media-container {
  overflow: hidden;
  border-radius: var(--radius-md) var(--radius-md) 0 0;
}

.post-media {
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.post-card:hover .post-media {
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

<template>
  <DashboardLayout>
    <div class="content-hub-view">
    <div class="container">
      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <div class="spinner"></div>
        <p>{{ $t('contentHub.loading') }}</p>
      </div>

      <!-- Welcome State for New Users (No Businesses) -->
      <div v-else-if="brands.length === 0" class="welcome-state">
        <div class="welcome-content">
          <div class="welcome-icon">
            <img src="@/assets/socialchef_logo.svg" alt="Social Chef" class="logo-svg" />
          </div>
          <h1 class="welcome-title">{{ $t('contentHub.welcomeTitle') }}</h1>
          <p class="welcome-subtitle">{{ $t('contentHub.welcomeSubtitle') }}</p>

          <BaseCard variant="glass" hoverable class="add-restaurant-card" @click="goToBusinesses">
            <div class="card-icon">
              <MaterialIcon icon="storefront" size="3xl" color="#D4AF37" class="restaurant-material-icon" />
            </div>
            <h3 class="card-title">{{ $t('contentHub.addFirstBusiness') }}</h3>
            <p class="card-description">{{ $t('contentHub.addFirstBusinessDescription') }}</p>
            <BaseButton variant="primary" size="large">
              {{ $t('contentHub.manageBusinesses') }}
            </BaseButton>
          </BaseCard>
        </div>
      </div>

      <!-- Main Content (Has Businesses) -->
      <div v-else class="content-hub">
        <!-- Business Header -->
        <div class="restaurant-header">
          <div class="header-content clickable-header" @click="showBusinessSelector = true">
            <div class="logo-container">
              <div v-if="selectedBrand?.logo_url || selectedBrand?.brand_dna?.logo_url" class="restaurant-logo">
                <img :src="selectedBrand.logo_url || selectedBrand.brand_dna?.logo_url" :alt="selectedBrand.name" />
              </div>
              <div v-else class="restaurant-logo placeholder">
                <span class="placeholder-icon">🏪</span>
              </div>
            </div>
            <div class="restaurant-info">
              <h1 class="restaurant-name">{{ selectedBrand?.name }}</h1>
              <p class="restaurant-address">{{ selectedBrand?.address || '' }}</p>
            </div>
          </div>
        </div>

        <!-- Create Content Card -->
        <div class="create-card" @click="goToCreate">
          <div class="create-plus-icon">
            <span class="plus-symbol">+</span>
          </div>
          <span class="create-label">{{ $t('contentHub.createPost') }}</span>
        </div>

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
              <GoldenDocumentIcon :size="48" class="empty-icon" />
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
              <!-- Media Preview - Always show image as thumbnail for grid view -->
              <div class="media-container">
                <img
                  v-if="post.media_url"
                  :src="post.media_url"
                  :alt="$t('posts.postAlt')"
                  class="post-media"
                />

                <!-- Video Overlay - Large centered play button for videos -->
                <div v-if="post.video_url" class="video-overlay">
                  <div class="video-play-button">
                    <span class="material-symbols-outlined">play_arrow</span>
                  </div>
                  <div class="video-label">VIDEO</div>
                </div>
              </div>

              <!-- Post Details -->
              <div class="post-details">
                <!-- Post Text (only for images, not videos) -->
                <p v-if="post.post_text && !post.video_url" class="post-text">
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
                  <div v-if="post.status && post.status !== 'draft' && post.status !== 'saved' && ((post.platforms && post.platforms.length > 0) || post.platform)" class="platform-badges">
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

    <!-- Business Selector Modal -->
    <BrandSelectorModal
      v-model="showBusinessSelector"
      :brands="brands"
      :current-id="selectedBrand?.id"
      @select="handleBusinessChange"
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
      :animating="animatingPost"
      @edit="enableEditMode"
      @schedule="schedulePost"
      @delete="confirmDeleteFromModal"
      @animate="handleAnimatePost"
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
            <video
              v-else
              :src="selectedPost.media_url"
              class="detail-media"
              controls
              preload="metadata"
              playsinline
            ></video>

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
import { debugLog, errorLog, warnLog } from '@/utils/debug'

import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { usePreferencesStore } from '@/stores/preferences'
import { useBrandsStore } from '@/stores/brands'
import { useNotificationStore } from '@/stores/notifications'
import { useVideoGenerationStore } from '@/stores/videoGeneration'
import { api } from '@/services/api'
import type { Brand } from '@/services/brandService'
import { getFoodAnimationPrompt } from '@/utils/promptHelpers'
import DashboardLayout from '@/components/DashboardLayout.vue'
import BaseCard from '@/components/BaseCard.vue'
import BaseButton from '@/components/BaseButton.vue'
import BasePagination from '@/components/BasePagination.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
import ScheduleModal from '@/components/ScheduleModal.vue'
import BrandSelectorModal from '@/components/BrandSelectorModal.vue'
import PostDetailModal from '@/components/PostDetailModal.vue'
import MaterialIcon from '@/components/MaterialIcon.vue'
import GoldenDocumentIcon from '@/components/icons/GoldenDocumentIcon.vue'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const preferencesStore = usePreferencesStore()
const brandsStore = useBrandsStore()
const notificationStore = useNotificationStore()
const videoGenerationStore = useVideoGenerationStore()

// State
const loading = ref(true)
const loadingPosts = ref(false)
const brands = computed(() => brandsStore.brands)
const selectedBrand = ref<Brand | null>(null)
const posts = ref<any[]>([])
const showBusinessSelector = ref(false)

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
const animatingPost = ref(false)

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
    await brandsStore.fetchBrands()

    if (brands.value.length === 0) {
      loading.value = false
      return
    }

    const savedId = preferencesStore.selectedBrandId
    if (savedId) {
      const found = brands.value.find((b) => b.id === savedId)
      if (found) {
        selectedBrand.value = found
      }
    }

    if (!selectedBrand.value) {
      const defaultBusiness = brands.value.find((b) => b.is_default)
      selectedBrand.value = defaultBusiness || brands.value[0]
      preferencesStore.setSelectedBrand(selectedBrand.value.id)
    }

    await fetchPosts()
    checkOpenPostFromQuery()
  } finally {
    loading.value = false
  }
})

// Watch for route query changes to handle notification clicks
watch(
  () => route.query.openPost,
  (newPostId) => {
    if (newPostId && !loading.value) {
      openPostById(newPostId as string)
    }
  }
)

// Open a specific post by ID (from notification)
async function openPostById(postId: string) {
  // Always fetch fresh data - the post may have been updated (e.g., video generated)
  let post = null
  try {
    const response = await api.getFavorite(postId)
    if (response.success && response.data?.favorite) {
      post = response.data.favorite

      // Also update the local posts array if this post exists there
      const localIndex = posts.value.findIndex(p => p.id === postId)
      if (localIndex !== -1) {
        posts.value[localIndex] = post
      }
    }
  } catch (error) {
    errorLog('Failed to fetch post:', error)
    // Fallback to local data if fetch fails
    post = posts.value.find(p => p.id === postId)
  }

  if (post) {
    viewDetails(post)
    // Clear the query param after opening
    router.replace({ query: { ...route.query, openPost: undefined } })
  }
}

// Check if we should open a post from URL query
function checkOpenPostFromQuery() {
  const openPostId = route.query.openPost as string
  if (openPostId) {
    openPostById(openPostId)
  }
}

// Fetch posts filtered by brand
async function fetchPosts() {
  if (!selectedBrand.value) return

  try {
    loadingPosts.value = true
    const offset = (currentPage.value - 1) * itemsPerPage

    const response = await api.getFavorites({
      brand_id: selectedBrand.value.id,
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
    errorLog('Error fetching posts:', error)
  } finally {
    loadingPosts.value = false
  }
}

// Handle brand change
function handleBusinessChange(brand: Brand) {
  selectedBrand.value = brand
  preferencesStore.setSelectedBrand(brand.id)
  showBusinessSelector.value = false

  // Reset and reload posts
  currentPage.value = 1
  fetchPosts()
}

// Navigation
function goToCreate() {
  // Always start in easy mode when clicking the + button
  preferencesStore.setCreationMode('easy', true)
  router.push('/posts/create')
}

function goToBusinesses() {
  router.push('/brands')
}


// Filter and pagination handlers
function applyFilters() {
  currentPage.value = 1
  fetchPosts()
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
    errorLog('Error saving changes:', error)
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
    errorLog('Error deleting post:', error)
  } finally {
    deletingPost.value = false
  }
}

function handleDeleteCancel() {
  showDeleteModal.value = false
  postToDelete.value = null
}

// Animate post (generate video from image) - runs in background
async function handleAnimatePost(data: { postId: string; videoOptions: { duration: 4 | 6 | 8; aspectRatio: '16:9' | '9:16'; generateAudio: boolean } }) {
  if (!selectedPost.value) return

  const imageUrl = selectedPost.value.media_url || selectedPost.value.image_url
  if (!imageUrl) {
    notificationStore.addNotification({
      type: 'error',
      title: t('posts.create.animationFailed', 'Animation failed'),
      message: t('easyMode.step3.noImageToAnimate', 'No image to animate'),
    })
    return
  }

  const postTitle = selectedPost.value.post_text?.substring(0, 50) || 'Post'
  const postId = selectedPost.value.id

  try {
    // Show brief loading while we start the generation
    animatingPost.value = true

    // Fetch the image and convert to base64
    const imageResponse = await fetch(imageUrl)
    const imageBlob = await imageResponse.blob()
    const base64Data = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        resolve(result.split(',')[1])
      }
      reader.readAsDataURL(imageBlob)
    })

    // Get optimized food animation prompt
    const { prompt, negativePrompt } = getFoodAnimationPrompt()

    // Generate video from image with food-optimized settings
    // Always disable audio to prevent AI-generated voices
    const videoOptions = {
      duration: data.videoOptions.duration,
      aspectRatio: data.videoOptions.aspectRatio,
      resolution: '720p' as '720p' | '1080p',
      generateAudio: false, // Never generate audio - it adds unwanted voices
      negativePrompt,
      enhancePrompt: false // Don't let AI modify our carefully crafted prompt
    }

    const response = await api.generateVideoFromImage(
      prompt,
      base64Data,
      imageBlob.type || 'image/png',
      videoOptions
    )

    if (!response.success) {
      throw new Error(response.error || t('contentCreate.videoError', 'Failed to generate video'))
    }

    // Add task to background generation store - it will handle polling
    videoGenerationStore.addTask({
      postId,
      postTitle,
      operationId: response.operationId,
      modelId: response.modelId
    })

    // Show notification that generation started
    notificationStore.addNotification({
      type: 'info',
      title: t('posts.videoGenerationStarted', 'Video Generation Started'),
      message: t('posts.videoGeneratingInBackground', 'Your video is being generated. You\'ll be notified when it\'s ready.'),
    })

    // Close modal and let user continue
    closeDetailModal()

  } catch (err: any) {
    errorLog('[Animate Post] Error starting generation:', err)
    notificationStore.addNotification({
      type: 'error',
      title: t('posts.create.animationFailed', 'Animation failed'),
      message: err.message || t('contentCreate.videoError', 'Failed to generate video'),
    })
  } finally {
    animatingPost.value = false
  }
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
  min-height: 100dvh;
  position: relative;
  padding: var(--space-2xl) var(--space-lg);
  width: 100%;
  max-width: 100vw;
  overflow-x: hidden;
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
  border: 3px solid rgba(15, 61, 46, 0.2);
  border-top-color: var(--gold-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Welcome State */
.welcome-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
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

.welcome-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  max-width: 500px;
  padding: var(--space-2xl);
}

.welcome-icon {
  margin-bottom: var(--space-xl);
  animation: pulse 2s ease-in-out infinite;
}

.welcome-icon .logo-svg {
  width: 120px;
  height: auto;
  filter: drop-shadow(0 0 20px rgba(15, 61, 46, 0.3));
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.welcome-title {
  font-family: var(--font-heading);
  font-size: var(--text-4xl);
  font-weight: var(--font-bold);
  margin: 0 0 var(--space-md) 0;
  background: var(--gradient-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.welcome-subtitle {
  font-size: var(--text-lg);
  color: var(--text-secondary);
  margin: 0 0 var(--space-3xl) 0;
  line-height: 1.5;
}

.add-restaurant-card {
  padding: var(--space-3xl);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-lg);
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
}

.add-restaurant-card:hover {
  transform: translateY(-4px);
  border-color: var(--gold-primary);
  box-shadow: 0 0 30px rgba(15, 61, 46, 0.2);
}

.add-restaurant-card .card-icon {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-restaurant-card .restaurant-material-icon {
  color: var(--gold-primary);
  filter: drop-shadow(0 0 12px rgba(15, 61, 46, 0.3));
  font-size: 48px;
}

.add-restaurant-card .card-title {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  color: var(--text-primary);
  margin: 0;
}

.add-restaurant-card .card-description {
  font-size: var(--text-base);
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.5;
}

/* Restaurant Header */
.restaurant-header {
  margin-bottom: var(--space-3xl);
  padding-bottom: var(--space-2xl);
  border-bottom: 1px solid rgba(15, 61, 46, 0.15);
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
  background: rgba(15, 61, 46, 0.2);
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
  background: rgba(15, 61, 46, 0.1);
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
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: var(--space-2xl);
}

.create-card:hover .create-plus-icon {
  transform: scale(1.1);
  box-shadow: 0 0 40px rgba(15, 61, 46, 0.4);
}

.create-plus-icon {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: var(--gradient-gold);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 0 20px rgba(15, 61, 46, 0.3);
}

.plus-symbol {
  font-size: 4rem;
  font-weight: var(--font-light);
  color: var(--text-on-gold);
  line-height: 1;
  margin-top: -4px;
}

.create-label {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--gold-primary);
  margin-top: var(--space-lg);
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
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(15, 61, 46, 0.2);
  border-radius: var(--radius-md);
  padding: var(--space-sm) var(--space-2xl) var(--space-sm) var(--space-md);
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: all 0.2s ease;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%230f3d2e' d='M6 8L2 4h8z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  min-width: 120px;
}

.inline-select:hover {
  border-color: rgba(15, 61, 46, 0.4);
}

.inline-select:focus {
  outline: none;
  border-color: var(--gold-primary);
  box-shadow: 0 0 0 2px rgba(15, 61, 46, 0.15);
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
  filter: drop-shadow(0 0 12px rgba(15, 61, 46, 0.3));
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
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr));
  gap: var(--space-xl);
}

.post-card {
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
}

.post-card:hover {
  transform: translateY(-4px);
  border-color: rgba(15, 61, 46, 0.4);
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

/* Video Overlay */
.video-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(2px);
  pointer-events: none;
  z-index: 2;
}

.video-play-button {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.post-card:hover .video-play-button {
  transform: scale(1.1);
  background: rgba(255, 255, 255, 1);
}

.video-play-button .material-symbols-outlined {
  font-size: 40px;
  color: var(--gold-primary);
}

.video-label {
  margin-top: var(--space-sm);
  padding: var(--space-xs) var(--space-md);
  background: rgba(255, 255, 255, 0.95);
  color: var(--text-primary);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.5px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
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
  font-weight: 600;
}

.hashtags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}

.hashtag {
  padding: 0.2rem 0.5rem;
  background: rgba(15, 61, 46, 0.15);
  color: var(--gold-light);
  border-radius: 4px;
  font-size: var(--text-xs);
}

.more-tags {
  padding: 0.2rem 0.5rem;
  background: rgba(15, 61, 46, 0.1);
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
  border-top: 1px solid rgba(15, 61, 46, 0.1);
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
  flex-direction: column;
  align-items: center;
}

/* Detail Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 61, 46, 0.4);
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
  border-bottom: 1px solid rgba(15, 61, 46, 0.2);
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
  background: rgba(15, 61, 46, 0.1);
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
  border-bottom: 1px solid rgba(15, 61, 46, 0.1);
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
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(15, 61, 46, 0.2);
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
  background: rgba(255, 255, 255, 0.4);
  border: 1px solid rgba(15, 61, 46, 0.2);
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
  background: rgba(15, 61, 46, 0.15);
  border: 1px solid rgba(15, 61, 46, 0.3);
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
  border-top: 1px solid rgba(15, 61, 46, 0.2);
  flex-wrap: wrap;
}

.modal-actions button {
  flex: 1;
  min-width: 120px;
}

/* Responsive */
@media (max-width: 768px) {
  .content-hub-view {
    padding: var(--space-xl) var(--space-md);
  }

  .welcome-title {
    font-size: var(--text-3xl);
  }

  .welcome-subtitle {
    font-size: var(--text-base);
  }

  .welcome-icon .logo-svg {
    width: 80px;
  }

  .add-restaurant-card {
    padding: var(--space-2xl);
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
    min-height: var(--touch-target-min);
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

  .modal-overlay {
    padding: var(--space-md);
  }

  .modal-actions {
    flex-direction: column;
  }

  .modal-actions button {
    min-width: 100%;
    min-height: var(--touch-target-min);
  }

  .close-btn {
    min-width: var(--touch-target-min);
    min-height: var(--touch-target-min);
  }

  .create-plus-icon {
    width: 80px;
    height: 80px;
  }

  .plus-symbol {
    font-size: 3rem;
  }
}

@media (max-width: 480px) {
  /* Stack filters vertically on small screens */
  .inline-filters {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-sm);
  }

  .filter-group {
    width: 100%;
  }

  .inline-select {
    width: 100%;
    min-height: var(--touch-target-min);
    font-size: var(--text-mobile-base);
  }

  .posts-count {
    text-align: left;
    margin-left: 0;
    margin-top: var(--space-xs);
  }

  /* Compact grid on small phones */
  .posts-grid {
    gap: var(--space-md);
  }

  .content-hub-view {
    padding: var(--space-lg) var(--space-sm);
  }

  .restaurant-header {
    margin-bottom: var(--space-xl);
    padding-bottom: var(--space-lg);
  }

  .header-content {
    flex-direction: column;
    gap: var(--space-md);
  }

  .logo-container {
    max-width: 200px;
  }

  .restaurant-logo {
    min-height: 60px;
    max-height: 80px;
  }

  .restaurant-logo img {
    max-height: 80px;
  }

  .restaurant-logo.placeholder {
    min-height: 80px;
  }

  .placeholder-icon {
    font-size: 2.5rem;
  }

  .restaurant-name {
    font-size: var(--text-2xl);
  }

  .restaurant-address {
    font-size: var(--text-xs);
  }

  .create-card {
    padding: var(--space-xl);
    margin-bottom: var(--space-2xl);
  }

  .create-plus-icon {
    width: 72px;
    height: 72px;
  }

  .plus-symbol {
    font-size: 2.5rem;
  }

  .section-title {
    font-size: var(--text-xl);
  }

  .posts-section {
    margin-top: var(--space-xl);
  }

  .media-container {
    height: 180px;
  }

  .post-details {
    padding: var(--space-md);
  }

  .post-text {
    font-size: var(--text-xs);
  }

  .modal-overlay {
    padding: var(--space-sm);
    align-items: flex-end;
  }

  .detail-modal {
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    max-height: 95vh;
  }

  .modal-header {
    padding: var(--space-md);
  }

  .modal-title {
    font-size: var(--text-lg);
  }

  .detail-media {
    max-height: 250px;
  }

  .loading-container {
    padding: var(--space-2xl);
  }

  .loading-container.small {
    padding: var(--space-lg);
  }

  .empty-state {
    padding: var(--space-xl);
  }

  .empty-content h3 {
    font-size: var(--text-lg);
  }
}

@media (max-width: 390px) {
  .content-hub-view {
    padding: var(--space-md) var(--space-xs);
  }

  .logo-container {
    max-width: 160px;
  }

  .restaurant-name {
    font-size: var(--text-xl);
  }

  .create-plus-icon {
    width: 64px;
    height: 64px;
  }

  .plus-symbol {
    font-size: 2rem;
  }

  .section-title {
    font-size: var(--text-lg);
  }

  .inline-filters {
    gap: var(--space-sm);
  }

  .inline-select {
    font-size: var(--text-xs);
    min-width: 90px;
    padding: var(--space-sm) var(--space-xl) var(--space-sm) var(--space-sm);
  }

  .media-container {
    height: 160px;
  }

  .card-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-xs);
  }

  .platform-badges {
    width: 100%;
  }
}

/* ===== DARK MODE OVERRIDES ===== */
:root[data-theme="dark"] .modal-overlay {
  background: rgba(0, 0, 0, 0.7);
}

:root[data-theme="dark"] .modal-content {
  background: var(--bg-secondary);
  border-color: var(--border-color);
}

:root[data-theme="dark"] .detail-section {
  border-bottom-color: var(--border-color);
}

:root[data-theme="dark"] .edit-textarea,
:root[data-theme="dark"] .edit-input,
:root[data-theme="dark"] .edit-select {
  background: var(--bg-tertiary);
  border-color: var(--border-color);
}

:root[data-theme="dark"] .hashtag-editor {
  background: var(--bg-tertiary);
  border-color: var(--border-color);
}

:root[data-theme="dark"] .hashtag-tag {
  background: var(--accent-alpha-15);
  border-color: var(--accent-alpha-30);
}

/* Filter buttons and selects */
:root[data-theme="dark"] .inline-select {
  background: var(--bg-tertiary) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23C2A36B' d='M6 8L2 4h8z'/%3E%3C/svg%3E") no-repeat right 10px center;
  border-color: var(--border-color);
}

:root[data-theme="dark"] .inline-select:hover {
  border-color: var(--accent-alpha-40);
}

:root[data-theme="dark"] .inline-select:focus {
  border-color: var(--gold-primary);
  box-shadow: 0 0 0 2px rgba(194, 163, 107, 0.15);
}

:root[data-theme="dark"] .inline-select option {
  background: var(--bg-secondary);
}

:root[data-theme="dark"] .post-card:hover {
  border-color: var(--accent-alpha-40);
}

:root[data-theme="dark"] .section-header {
  border-bottom-color: var(--border-color);
}

/* Landscape: Reduce vertical padding */
@media (max-height: 500px) and (orientation: landscape) {
  .content-hub-view {
    padding: var(--space-md) var(--space-lg);
  }

  .restaurant-header {
    margin-bottom: var(--space-lg);
    padding-bottom: var(--space-md);
  }

  .create-card {
    padding: var(--space-lg);
    margin-bottom: var(--space-lg);
  }

  .section-header {
    margin-bottom: var(--space-md);
  }

  .landscape-hide {
    display: none;
  }
}
</style>

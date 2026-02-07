<template>
  <BaseModal
    :model-value="modelValue"
    size="xl"
    :title="currentStep === 1 ? 'Pick a Saved Post' : 'Schedule Your Post'"
    :show-close-button="true"
    card-variant="glass-intense"
    @update:model-value="(val: boolean) => !val && closeModal()"
    @close="closeModal"
  >
          <!-- Progress Indicator -->
          <div class="progress-indicator">
            <div :class="['step-dot', { active: currentStep === 1, completed: currentStep > 1 }]">1</div>
            <div class="step-line"></div>
            <div :class="['step-dot', { active: currentStep === 2 }]">2</div>
          </div>

          <!-- STEP 1: Select Post -->
          <div v-if="currentStep === 1" class="wizard-step">
            <!-- Loading State -->
            <div v-if="loading" class="loading-container">
              <div class="spinner"></div>
              <p>Loading posts...</p>
            </div>

            <!-- Empty State -->
            <div v-else-if="filteredPosts.length === 0" class="empty-state">
              <p>No posts yet! Create a post first.</p>
              <BaseButton variant="primary" @click="goToCreatePost">
                Create Post
              </BaseButton>
            </div>

            <!-- Posts Grid -->
            <div v-else>
              <!-- Business Filter Toggle (only show if businessId is provided) -->
              <div v-if="businessId" class="filter-toggle-container">
                <button
                  type="button"
                  class="filter-toggle-button"
                  @click="showAllBusinesses = !showAllBusinesses"
                >
                  <span class="material-symbols-outlined">
                    {{ showAllBusinesses ? 'filter_list_off' : 'filter_list' }}
                  </span>
                  <span class="filter-toggle-text">
                    {{ showAllBusinesses ? $t('pickPostModal.showCurrentRestaurant') : $t('pickPostModal.showAllRestaurants') }}
                  </span>
                </button>
              </div>

              <div class="posts-grid">
                <div
                  v-for="post in paginatedPosts"
                  :key="post.id"
                  :class="['post-item', { selected: selectedPost?.id === post.id }]"
                  @click="selectPost(post)"
                >
                  <!-- Media Thumbnail - Always show image for grid view -->
                  <div class="thumbnail-container">
                    <img
                      v-if="post.media_url"
                      :src="post.media_url"
                      alt="Post"
                      class="thumbnail"
                    />

                    <!-- Video Overlay - Large centered play button for videos -->
                    <div v-if="post.video_url" class="video-overlay">
                      <div class="video-play-button">
                        <span class="material-symbols-outlined">play_arrow</span>
                      </div>
                      <div class="video-label">{{ $t('pickPostModal.videoLabel') }}</div>
                    </div>

                    <!-- Platform Badge -->
                    <span v-if="post.platform" :class="['platform-badge', `platform-${post.platform}`]">
                      {{ post.platform }}
                    </span>

                    <!-- Selection Indicator -->
                    <div v-if="selectedPost?.id === post.id" class="selection-check">
                      <span class="material-symbols-outlined">check_circle</span>
                    </div>
                  </div>

                  <!-- Post Info -->
                  <div class="post-info">
                    <p v-if="post.post_text" class="post-preview">
                      {{ truncateText(post.post_text, 80) }}
                    </p>
                    <div v-if="post.businesses?.name || post.business?.name || post.business_name || post.saved_restaurants?.name" class="restaurant-tag">
                      🏢 {{ post.businesses?.name || post.business?.name || post.business_name || post.saved_restaurants?.name }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Pagination -->
              <BasePagination
                v-model:current-page="currentPage"
                :total-pages="totalPages"
                :total-items="filteredPosts.length"
                @update:current-page="handlePageChange"
              />

              <!-- Next Button -->
              <div class="wizard-actions">
                <BaseButton
                  variant="primary"
                  size="large"
                  full-width
                  :disabled="!selectedPost"
                  @click="goToScheduleStep"
                >
                  Next: Set Schedule →
                </BaseButton>
              </div>
            </div>
          </div>

          <!-- STEP 2: Set Schedule -->
          <div v-if="currentStep === 2" class="wizard-step">
            <!-- Use the new reusable PostPreviewCard component -->
            <PostPreviewCard
              v-if="selectedPost"
              :image-url="selectedPost.media_url"
              :video-url="selectedPost.video_url"
              :post-text="selectedPost.post_text"
              :hashtags="selectedPost.hashtags || []"
              :editable="true"
              @update:post-text="handlePostTextUpdate"
              @update:hashtags="handleHashtagsUpdate"
            />

            <!-- Unified Schedule Component -->
            <UnifiedSchedulePost
              :initial-schedule-date="selectedDate"
              :lock-date="!!selectedDate"
              :force-schedule-mode="true"
              :show-cancel-button="true"
              :image-url="selectedPost?.media_url"
              :video-url="selectedPost?.video_url"
              :carousel-items="selectedPost?.carousel_items"
              @publish="handleSchedulePublish"
              @cancel="goBackToSelection"
            />
          </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import type { AccountSelection } from '@/types/scheduling'
import BaseModal from './BaseModal.vue'
import BaseButton from './BaseButton.vue'
import BasePagination from './BasePagination.vue'
import UnifiedSchedulePost from './UnifiedSchedulePost.vue'
import PostPreviewCard from './PostPreviewCard.vue'
import { api } from '../services/api'
import { useFacebookStore } from '../stores/facebook'
import { useInstagramStore } from '../stores/instagram'
import { errorLog } from '@/utils/debug'

interface Props {
  modelValue: boolean
  selectedDate: string | null
  businessId?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'scheduled', data: { post: any; date: string }): void
}>()

const router = useRouter()
const route = useRoute()
const facebookStore = useFacebookStore()
const instagramStore = useInstagramStore()
const posts = ref<any[]>([])
const loading = ref(false)
const currentPage = ref(1)
const itemsPerPage = 6

// Wizard state
const currentStep = ref(1) // 1 = Select Post, 2 = Set Schedule
const selectedPost = ref<any>(null)

// Edit state
const isEditing = ref(false)
const savingEdits = ref(false)
const editedPostText = ref('')
const editedHashtags = ref<string[]>([])
const newHashtag = ref('')

// Business filter state
const showAllBusinesses = ref(false)

// Reset pagination when restaurant filter changes
watch(showAllBusinesses, () => {
  currentPage.value = 1
})

// Filter posts by business if businessId is provided (unless showAllBusinesses is true)
const filteredPosts = computed(() => {
  if (!props.businessId || showAllBusinesses.value) return posts.value
  return posts.value.filter(post =>
    post.business_id === props.businessId ||
    post.restaurant_id === props.businessId
  )
})

// Pagination computed properties
const totalPages = computed(() => Math.ceil(filteredPosts.value.length / itemsPerPage))

const paginatedPosts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredPosts.value.slice(start, end)
})

watch(() => props.modelValue, async (newValue) => {
  if (newValue) {
    // Reset pagination
    currentPage.value = 1

    // Reset wizard state
    currentStep.value = 1
    selectedPost.value = null
    isEditing.value = false

    // Reset business filter
    showAllBusinesses.value = false

    // Load connected accounts from all platforms
    await Promise.all([
      facebookStore.loadConnectedPages(),
      instagramStore.loadConnectedAccounts(),
      fetchPosts()
    ])
  }
})

const fetchPosts = async () => {
  try {
    loading.value = true
    const response = await api.getFavorites()

    if (response.success) {
      posts.value = response.data?.favorites || []
    }
  } catch (error) {

  } finally {
    loading.value = false
  }
}

const closeModal = () => {
  emit('update:modelValue', false)
}

const selectPost = (post: any) => {
  selectedPost.value = post
}

const goToScheduleStep = () => {
  if (!selectedPost.value) {
    alert('Please select a post first')
    return
  }
  currentStep.value = 2
}

const goBackToSelection = () => {
  currentStep.value = 1
  isEditing.value = false
}

const handleSchedulePublish = async (data: {
  platforms: string[]
  publishType: 'now' | 'schedule'
  scheduledDate?: string
  scheduledTime?: string
  timezone?: string
  accountSelections?: {
    facebook?: AccountSelection[]
    instagram?: AccountSelection[]
    tiktok?: string[]
    twitter?: string[]
  }
}) => {
  const post = selectedPost.value
  if (!post) {
    alert('No post selected')
    return
  }

  if (data.publishType !== 'schedule' || !data.scheduledDate || !data.scheduledTime) {
    alert('Please select a date and time')
    return
  }

  if (data.platforms.length === 0) {
    alert('Please select at least one platform')
    return
  }

  try {
    const response = await api.schedulePost({
      favorite_post_id: post.id,
      scheduled_date: data.scheduledDate,
      scheduled_time: data.scheduledTime,
      timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      platforms: data.platforms,
      platform_settings: data.accountSelections,
    })

    if (response.success) {
      emit('scheduled', { post, date: data.scheduledDate })
      closeModal()
    } else {
      alert(response.error || 'Failed to schedule post')
    }
  } catch (error: any) {
    alert(error.message || 'Failed to schedule post')
  }
}

const goToCreatePost = () => {
  const dateParam = props.selectedDate ? `?scheduleDate=${props.selectedDate}` : ''
  router.push(`/posts/create${dateParam}`)
  closeModal()
}


const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// Edit functions
const toggleEditMode = () => {
  if (selectedPost.value) {
    editedPostText.value = selectedPost.value.post_text || ''
    editedHashtags.value = [...(selectedPost.value.hashtags || [])]
    newHashtag.value = ''
  }
  isEditing.value = true
}

const cancelEdits = () => {
  isEditing.value = false
  newHashtag.value = ''
}

const addHashtag = () => {
  const tag = newHashtag.value.trim().replace(/^#/, '')
  if (tag && !editedHashtags.value.includes(`#${tag}`)) {
    editedHashtags.value.push(`#${tag}`)
  }
  newHashtag.value = ''
}

const removeHashtag = (index: number) => {
  editedHashtags.value.splice(index, 1)
}

const saveEdits = async () => {
  if (!selectedPost.value) return

  try {
    savingEdits.value = true
    const response = await api.updateFavorite(selectedPost.value.id, {
      post_text: editedPostText.value,
      hashtags: editedHashtags.value,
    })

    if (response.success) {
      // Update the local selected post with new values
      selectedPost.value = {
        ...selectedPost.value,
        post_text: editedPostText.value,
        hashtags: editedHashtags.value,
      }
      isEditing.value = false
    } else {
      alert(response.error || 'Failed to save changes')
    }
  } catch (error: any) {
    alert(error.message || 'Failed to save changes')
  } finally {
    savingEdits.value = false
  }
}

// Handlers for PostPreviewCard updates
const handlePostTextUpdate = async (newText: string) => {
  if (!selectedPost.value) return

  try {
    const response = await api.updateFavorite(selectedPost.value.id, {
      post_text: newText,
      hashtags: selectedPost.value.hashtags || [],
    })

    if (response.success) {
      selectedPost.value = {
        ...selectedPost.value,
        post_text: newText,
      }
    } else {
      alert(response.error || 'Failed to save changes')
    }
  } catch (error: any) {
    alert(error.message || 'Failed to save changes')
  }
}

const handleHashtagsUpdate = async (newHashtags: string[]) => {
  if (!selectedPost.value) return

  try {
    const response = await api.updateFavorite(selectedPost.value.id, {
      post_text: selectedPost.value.post_text || '',
      hashtags: newHashtags,
    })

    if (response.success) {
      selectedPost.value = {
        ...selectedPost.value,
        hashtags: newHashtags,
      }
    } else {
      alert(response.error || 'Failed to save changes')
    }
  } catch (error: any) {
    alert(error.message || 'Failed to save changes')
  }
}

const handlePageChange = (page: number) => {
  currentPage.value = page
}
</script>

<style scoped>
/* Progress Indicator */
.progress-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-lg);
  margin-bottom: var(--space-2xl);
  padding: var(--space-lg);
}

.step-dot {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--font-bold);
  font-size: var(--text-base);
  background: rgba(15, 61, 46, 0.2);
  border: 2px solid rgba(15, 61, 46, 0.3);
  color: var(--text-muted);
  transition: all 0.3s ease;
}

.step-dot.active {
  background: var(--gold-primary);
  border-color: var(--gold-primary);
  color: var(--text-on-gold);
  box-shadow: var(--glow-gold-sm);
}

.step-dot.completed {
  background: rgba(212, 175, 55, 0.2);
  border-color: var(--gold-primary);
  color: var(--gold-primary);
}

.step-line {
  flex: 1;
  height: 2px;
  background: rgba(212, 175, 55, 0.3);
  max-width: 100px;
}

/* Wizard Step Container */
.wizard-step {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Inline Date Picker Container */
.date-picker-inline {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

/* Force the calendar to not have minimum widths */
.date-picker-inline :deep(.dp__menu) {
  border: none !important;
  background: transparent !important;
  box-shadow: none !important;
  min-width: unset !important;
}

.date-picker-inline :deep(.dp__instance_calendar) {
  min-width: unset !important;
}

.date-picker-inline :deep(.dp__calendar) {
  min-width: unset !important;
}

.date-picker-inline :deep(.dp__calendar_header_item) {
  padding: 4px 2px !important;
  font-size: 11px !important;
  width: auto !important;
  flex: 1 1 0 !important;
  min-width: 28px !important;
}

.date-picker-inline :deep(.dp__calendar_item) {
  width: auto !important;
  flex: 1 1 0 !important;
  min-width: 28px !important;
}

.date-picker-inline :deep(.dp__cell_inner) {
  width: 28px !important;
  height: 28px !important;
  font-size: 12px !important;
  padding: 0 !important;
}

.date-picker-inline :deep(.dp__cell_offset) {
  width: 28px !important;
  height: 28px !important;
}

/* Month/year header */
.date-picker-inline :deep(.dp__month_year_row) {
  padding: 0 4px;
}

.date-picker-inline :deep(.dp__inner_nav) {
  width: 28px !important;
  height: 28px !important;
}

/* Hide the time picker toggle button at bottom of calendar */
.date-picker-inline :deep(.dp__action_row),
.date-picker-inline :deep(.dp__selection_preview),
.date-picker-inline :deep(.dp__action_buttons),
.date-picker-inline :deep(.dp__time_picker_inline_container),
.date-picker-inline :deep(.dp__button) {
  display: none !important;
}

/* Time Picker Wrapper */
.time-picker-wrapper {
  background: rgba(15, 61, 46, 0.15);
  border: 1px solid rgba(15, 61, 46, 0.2);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  display: flex;
  justify-content: center;
}

/* Date/Time Picker Dark Theme Override */
:deep(.dp__theme_dark) {
  --dp-background-color: transparent;
  --dp-text-color: var(--text-primary);
  --dp-hover-color: rgba(212, 175, 55, 0.15);
  --dp-hover-text-color: var(--text-primary);
  --dp-primary-color: var(--gold-primary);
  --dp-primary-text-color: var(--text-on-gold);
  --dp-secondary-color: rgba(212, 175, 55, 0.1);
  --dp-border-color: rgba(212, 175, 55, 0.3);
  --dp-menu-border-color: transparent;
  --dp-border-color-hover: var(--gold-primary);
  --dp-disabled-color: var(--text-muted);
  --dp-disabled-color-text: var(--text-muted);
  --dp-success-color: var(--gold-primary);
  --dp-icon-color: var(--gold-primary);
  --dp-danger-color: #ef4444;
  --dp-highlight-color: rgba(212, 175, 55, 0.1);
}

/* Inline picker - remove default styling */
:deep(.dp__main) {
  width: 100%;
}

:deep(.dp__menu) {
  border: none;
  background: transparent;
  box-shadow: none;
}

/* Calendar header */
:deep(.dp__calendar_header) {
  font-weight: var(--font-semibold);
}

:deep(.dp__calendar_header_item) {
  color: var(--gold-primary);
  font-weight: var(--font-medium);
  text-transform: uppercase;
  font-size: var(--text-xs);
}

/* Month/Year navigation */
:deep(.dp__month_year_row) {
  margin-bottom: var(--space-md);
}

:deep(.dp__month_year_select) {
  color: var(--text-primary);
  font-weight: var(--font-semibold);
  font-size: var(--text-lg);
}

:deep(.dp__month_year_select:hover) {
  color: var(--gold-primary);
  background: rgba(212, 175, 55, 0.1);
  border-radius: var(--radius-sm);
}

/* Navigation arrows */
:deep(.dp__inner_nav) {
  color: var(--text-secondary);
  width: 36px;
  height: 36px;
}

:deep(.dp__inner_nav:hover) {
  background: rgba(212, 175, 55, 0.15);
  color: var(--gold-primary);
  border-radius: var(--radius-sm);
}

/* Calendar days */
:deep(.dp__calendar_item) {
  border-radius: var(--radius-sm);
}

:deep(.dp__cell_inner) {
  border-radius: var(--radius-sm);
  width: 36px;
  height: 36px;
  font-size: var(--text-sm);
}

:deep(.dp__today) {
  border: 2px solid var(--gold-primary);
}

:deep(.dp__active_date) {
  background: var(--gold-primary);
  color: var(--text-on-gold);
}

:deep(.dp__cell_offset) {
  color: var(--text-muted);
  opacity: 0.4;
}

:deep(.dp__cell_disabled) {
  color: var(--text-muted);
  opacity: 0.3;
}

/* Hide action row in inline mode */
:deep(.dp__action_row) {
  display: none;
}

/* Schedule Grid - side by side on desktop */
.schedule-grid {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--space-xl);
  margin-bottom: var(--space-xl);
}

.schedule-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.date-section {
  background: rgba(15, 61, 46, 0.15);
  border: 1px solid rgba(15, 61, 46, 0.2);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  align-self: start;
}

.time-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

/* Platform Grid & Cards */
.platform-grid {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.platform-card {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md);
  background: var(--bg-tertiary);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-base);
}

.platform-card:hover:not(.coming-soon) {
  border-color: var(--gold-primary);
}

.platform-card.selected {
  border-color: var(--gold-primary);
  background: var(--gold-subtle);
}

.platform-card.not-connected {
  border-style: dashed;
}

.platform-card.not-connected:hover {
  border-color: var(--gold-primary);
  background: var(--gold-subtle);
}

.platform-card.coming-soon {
  opacity: 0.5;
  cursor: not-allowed;
}

.platform-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.platform-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.platform-name {
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  font-size: var(--text-sm);
}

.platform-info .status {
  font-size: var(--text-xs);
}

.platform-info .status.connected {
  color: #4ade80;
}

.platform-info .status.coming-soon {
  color: var(--text-muted);
  font-style: italic;
}

.platform-info .status.not-connected {
  color: var(--gold-primary);
}

.platform-check {
  flex-shrink: 0;
}

.connected-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #4ade80;
  flex-shrink: 0;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.form-label {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-primary);
}

.form-label .required {
  color: #ef4444;
  margin-left: 2px;
}

.detected-badge {
  font-size: var(--text-xs);
  color: var(--gold-primary);
  font-weight: var(--font-medium);
  background: rgba(212, 175, 55, 0.15);
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  margin-left: var(--space-sm);
}


.form-input,
.form-select {
  width: 100%;
  padding: var(--space-md);
  background: rgba(15, 61, 46, 0.2);
  border: 1px solid rgba(15, 61, 46, 0.3);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: var(--text-base);
  transition: all 0.2s ease;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: var(--gold-primary);
  background: rgba(15, 61, 46, 0.25);
}

.form-select option {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.platform-hint {
  margin: 0;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  margin-top: var(--space-xs);
}

.platform-hint.error {
  color: #ef4444;
}

.platform-hint.warning {
  color: #f59e0b;
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
  text-align: center;
  padding: 3rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.empty-state p {
  color: var(--text-secondary);
  margin: 0;
}

/* Restaurant Filter Toggle */
.filter-toggle-container {
  display: flex;
  justify-content: flex-end;
  margin-bottom: var(--space-lg);
}

.filter-toggle-button {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-lg);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: all var(--transition-base);
}

.filter-toggle-button:hover {
  background: var(--bg-elevated);
  border-color: var(--gold-primary);
  color: var(--gold-primary);
}

.filter-toggle-button .material-symbols-outlined {
  font-size: 18px;
}

.filter-toggle-text {
  white-space: nowrap;
}

.posts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: var(--space-xl);
}

.post-item {
  background: rgba(15, 61, 46, 0.15);
  border: 1px solid rgba(15, 61, 46, 0.2);
  border-radius: var(--radius-lg);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
}

.post-item:hover {
  border-color: rgba(212, 175, 55, 0.5);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.post-item.selected {
  border: 2px solid var(--gold-primary);
  box-shadow: var(--glow-gold-md);
  transform: translateY(-2px);
}

.thumbnail-container {
  position: relative;
  width: 100%;
  height: 180px;
  overflow: hidden;
}

.thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: all 0.3s ease;
}

/* Video Overlay - Large centered play button */
.video-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(2px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  transition: all 0.3s ease;
}

.post-item:hover .video-overlay {
  background: rgba(0, 0, 0, 0.4);
}

.video-play-button {
  width: 64px;
  height: 64px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.post-item:hover .video-play-button {
  transform: scale(1.1);
  background: rgba(255, 255, 255, 1);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
}

.video-play-button .material-symbols-outlined {
  font-size: 40px;
  color: #2196F3;
  margin-left: 4px; /* Slight offset for visual centering */
}

.video-label {
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
  color: #1a1a1a;
  background: rgba(255, 255, 255, 0.95);
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-full);
  letter-spacing: 0.5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.platform-badge {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
}

.platform-badge.platform-instagram {
  background: rgba(225, 48, 108, 0.9);
  color: white;
}

.platform-badge.platform-facebook {
  background: rgba(66, 103, 178, 0.9);
  color: white;
}

.platform-badge.platform-tiktok {
  background: rgba(0, 0, 0, 0.9);
  color: white;
}

.platform-badge.platform-twitter {
  background: rgba(29, 161, 242, 0.9);
  color: white;
}

.post-info {
  padding: var(--space-md);
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.post-preview {
  color: var(--text-secondary);
  font-size: 0.875rem;
  line-height: 1.4;
  margin: 0;
  flex: 1;
}

.restaurant-tag {
  font-size: 0.75rem;
  color: var(--gold-primary);
  font-weight: 500;
}

/* Selection Check Indicator */
.selection-check {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60px;
  height: 60px;
  background: var(--gold-primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-on-gold);
  box-shadow: var(--glow-gold-md);
  animation: scaleIn 0.3s ease;
  z-index: 2;
}

.selection-check .material-symbols-outlined {
  font-size: 36px;
}

@keyframes scaleIn {
  from {
    transform: translate(-50%, -50%) scale(0);
  }
  to {
    transform: translate(-50%, -50%) scale(1);
  }
}

/* Wizard Actions */
.wizard-actions {
  margin-top: var(--space-2xl);
  padding-top: var(--space-xl);
  border-top: 1px solid rgba(212, 175, 55, 0.2);
}

.wizard-actions.step-2-actions {
  display: flex;
  gap: var(--space-lg);
  justify-content: space-between;
}

/* Selected Post Preview (Step 2) */
.selected-post-preview {
  margin-bottom: var(--space-2xl);
  padding: var(--space-lg);
  background: rgba(15, 61, 46, 0.15);
  border-radius: var(--radius-lg);
  border: 1px solid rgba(15, 61, 46, 0.2);
}

.preview-title {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  color: var(--text-primary);
  margin: 0;
}

.preview-card {
  display: flex;
  gap: var(--space-lg);
  align-items: flex-start;
}

.preview-thumbnail {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: var(--radius-md);
  border: 1px solid rgba(212, 175, 55, 0.3);
}

.preview-text {
  flex: 1;
  color: var(--text-secondary);
  font-size: var(--text-sm);
  line-height: 1.5;
  margin: 0;
}

/* Preview styles now in PostPreviewCard.vue component */

/* Responsive */
@media (max-width: 768px) {
  .schedule-grid {
    grid-template-columns: 1fr;
  }

  .posts-grid {
    grid-template-columns: 1fr;
  }
}
</style>

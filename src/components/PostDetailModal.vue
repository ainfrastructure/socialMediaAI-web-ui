<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseModal from './BaseModal.vue'
import BaseButton from './BaseButton.vue'
import MaterialIcon from './MaterialIcon.vue'
import PlatformLogo from './PlatformLogo.vue'
import { useEngagementStore } from '@/stores/engagement'

const props = defineProps<{
  modelValue: boolean
  post: any
  mode?: 'view' | 'edit' // For future edit mode support
  animating?: boolean // When video is being generated from image
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'edit', post: any): void
  (e: 'delete', post: any): void
  (e: 'schedule', post: any): void
  (e: 'animate', data: { postId: string; videoOptions: { duration: 4 | 6 | 8; aspectRatio: '16:9' | '9:16'; generateAudio: boolean } }): void
  (e: 'retry', post: any): void
  (e: 'close'): void
}>()

const { t } = useI18n()
const engagementStore = useEngagementStore()

// Animation state
const showAnimationOptions = ref(false)
const animationVideoDuration = ref<4 | 6 | 8>(4)
const animationVideoAspectRatio = ref<'16:9' | '9:16'>('9:16')
const animationIncludeAudio = ref(true)

// Media toggle state (when post has both image and video)
const showingVideo = ref(true) // Default to showing video when available

// Check if post has both image and video
const hasBothMediaTypes = computed(() => {
  return !!getMediaUrl() && !!getVideoUrl()
})

// Close modal
function closeModal() {
  emit('update:modelValue', false)
  emit('close')
  showAnimationOptions.value = false
  showingVideo.value = true // Reset to default
}

// Check if post can be animated (has image, no video yet)
const canAnimate = computed(() => {
  const p = props.post
  if (!p) return false

  // Must have an image (media_url)
  const hasImage = !!getMediaUrl()

  // Must not already have a video (video_url)
  const hasVideo = !!getVideoUrl()

  return hasImage && !hasVideo
})

// Handle animate button click
function handleAnimateClick() {
  showAnimationOptions.value = !showAnimationOptions.value
}

// Handle generate video
function handleGenerateVideo() {
  const postId = props.post?.id || props.post?.favorite_post_id
  if (!postId) return

  emit('animate', {
    postId,
    videoOptions: {
      duration: animationVideoDuration.value,
      aspectRatio: animationVideoAspectRatio.value,
      generateAudio: animationIncludeAudio.value
    }
  })
  showAnimationOptions.value = false
}

// Get media URL from post (handles nested structures)
function getMediaUrl(): string | null {
  const p = props.post
  if (!p) return null

  if (p.media_url) return p.media_url
  if (p.image_url) return p.image_url
  if (p.favorite_posts?.media_url) return p.favorite_posts.media_url
  if (p.favorite_post?.media_url) return p.favorite_post.media_url
  if (p.favorite?.media_url) return p.favorite.media_url

  return null
}

// Get video URL from post (for animated images)
function getVideoUrl(): string | null {
  const p = props.post
  if (!p) return null

  if (p.video_url) return p.video_url
  if (p.favorite_posts?.video_url) return p.favorite_posts.video_url
  if (p.favorite_post?.video_url) return p.favorite_post.video_url
  if (p.favorite?.video_url) return p.favorite.video_url

  return null
}

// Get post text
function getPostText(): string | null {
  const p = props.post
  if (!p) return null

  if (p.post_text) return p.post_text
  if (p.caption) return p.caption
  if (p.favorite_posts?.post_text) return p.favorite_posts.post_text
  if (p.favorite_post?.post_text) return p.favorite_post.post_text
  if (p.favorite?.post_text) return p.favorite.post_text

  return null
}

// Get content type
function getContentType(): string {
  const p = props.post
  if (!p) return 'image'

  if (p.content_type) return p.content_type
  if (p.favorite_posts?.content_type) return p.favorite_posts.content_type
  if (p.favorite_post?.content_type) return p.favorite_post.content_type

  const url = getMediaUrl()
  if (url && url.match(/\.(mp4|webm|mov|avi)$/i)) return 'video'
  return 'image'
}

// Get platforms array
function getPlatforms(): string[] {
  const p = props.post
  if (!p) return []

  // Don't show platforms for draft/saved posts or posts without a status
  if (!p.status || p.status === 'draft' || p.status === 'saved') return []

  // Check for published post URLs first
  if (p.platform_post_urls && Object.keys(p.platform_post_urls).length > 0) {
    return Object.keys(p.platform_post_urls)
  }
  // Check for platforms array (multiple platforms)
  if (p.platforms && Array.isArray(p.platforms) && p.platforms.length > 0) {
    return p.platforms
  }
  // Check nested favorite_posts/favorite_post for platforms array
  if (p.favorite_posts?.platforms && Array.isArray(p.favorite_posts.platforms) && p.favorite_posts.platforms.length > 0) {
    return p.favorite_posts.platforms
  }
  if (p.favorite_post?.platforms && Array.isArray(p.favorite_post.platforms) && p.favorite_post.platforms.length > 0) {
    return p.favorite_post.platforms
  }
  // Fall back to single platform
  if (p.platform) return [p.platform]
  if (p.favorite_posts?.platform) return [p.favorite_posts.platform]
  if (p.favorite_post?.platform) return [p.favorite_post.platform]

  return []
}

// Get restaurant name
function getRestaurantName(): string | null {
  const p = props.post
  if (!p) return null

  if (p.restaurant_name) return p.restaurant_name
  if (p.favorite_posts?.restaurant_name) return p.favorite_posts.restaurant_name
  if (p.favorite_post?.restaurant_name) return p.favorite_post.restaurant_name
  if (p.saved_restaurants?.name) return p.saved_restaurants.name

  return null
}

// Get hashtags
function getHashtags(): string[] {
  const p = props.post
  if (!p) return []

  if (p.hashtags && Array.isArray(p.hashtags)) return p.hashtags
  if (p.favorite_posts?.hashtags) return p.favorite_posts.hashtags
  if (p.favorite_post?.hashtags) return p.favorite_post.hashtags

  return []
}

// Get status
const postStatus = computed(() => {
  return props.post?.status || 'draft'
})

// Status class
function getStatusClass(status: string): string {
  switch (status?.toLowerCase()) {
    case 'published': return 'status-published'
    case 'partial': return 'status-partial'
    case 'failed': return 'status-failed'
    case 'cancelled': return 'status-cancelled'
    case 'draft': return 'status-draft'
    case 'scheduled':
    default: return 'status-scheduled'
  }
}

// Status label
function getStatusLabel(status: string): string {
  switch (status?.toLowerCase()) {
    case 'published': return t('dashboardNew.published')
    case 'partial': return t('scheduler.partial')
    case 'failed': return t('dashboardNew.failed')
    case 'cancelled': return t('dashboardNew.cancelled')
    case 'draft': return t('dashboardNew.draft')
    case 'scheduled':
    default: return t('dashboardNew.scheduled')
  }
}

// Format date
function formatDate(): string {
  const p = props.post
  if (!p) return ''

  const date = p.scheduled_date || p.published_at || p.created_at
  if (!date) return ''

  return new Date(date).toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Format time
function formatTime(): string {
  const p = props.post
  if (!p?.scheduled_time) return ''

  const time = p.scheduled_time
  if (time.includes(':')) {
    const [hours, minutes] = time.split(':')
    return `${hours}:${minutes}`
  }
  return time
}

// Get time remaining for scheduled posts
function getTimeRemaining(): string {
  const p = props.post
  if (!p || p.status !== 'scheduled' || !p.scheduled_date) return ''

  const scheduledDate = new Date(p.scheduled_date)
  if (p.scheduled_time) {
    const [hours, minutes] = p.scheduled_time.split(':')
    scheduledDate.setHours(parseInt(hours), parseInt(minutes))
  }

  const now = new Date()
  const diff = scheduledDate.getTime() - now.getTime()

  if (diff < 0) return t('scheduler.overdue') || 'Overdue'

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h`

  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  return `${minutes}m`
}

// Check if post has engagement but missing reach/impressions data
const hasMissingReachData = computed(() => {
  if (!props.post?.id) return false
  const engagement = engagementStore.getPostEngagement(props.post.id)
  if (!engagement) return false

  return Object.values(engagement).some((metrics: any) => {
    const hasEngagement = (metrics.likes > 0 || metrics.comments > 0 || metrics.shares > 0)
    const hasNoReach = metrics.reach === 0 && metrics.impressions === 0
    return hasEngagement && hasNoReach
  })
})

// Actions
function handleEdit() {
  emit('edit', props.post)
}

function handleDelete() {
  emit('delete', props.post)
}

function handleSchedule() {
  emit('schedule', props.post)
}

function handleRetry() {
  emit('retry', props.post)
}
</script>

<template>
  <BaseModal
    :model-value="modelValue && !!post"
    size="xl"
    :show-close-button="false"
    card-variant="glass-intense"
    @update:model-value="(val: boolean) => !val && closeModal()"
    @close="closeModal"
  >
    <!-- Custom Close Button -->
    <button
      class="post-detail-close-button"
      @click="closeModal"
      aria-label="Close"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>

    <div class="modal-content">
          <!-- Media Section -->
          <div class="modal-media">
            <!-- Media Type Toggle (when post has both image and video) -->
            <div v-if="hasBothMediaTypes" class="media-toggle">
              <button
                :class="['toggle-btn', { active: showingVideo }]"
                @click="showingVideo = true"
              >
                <MaterialIcon icon="movie" size="sm" />
                {{ t('posts.video') }}
              </button>
              <button
                :class="['toggle-btn', { active: !showingVideo }]"
                @click="showingVideo = false"
              >
                <MaterialIcon icon="image" size="sm" />
                {{ t('posts.image') }}
              </button>
            </div>

            <!-- Show video if has video and (no image OR toggle is on video) -->
            <video
              v-if="getVideoUrl() && (showingVideo || !getMediaUrl())"
              :src="getVideoUrl()!"
              controls
              class="media-video"
            ></video>
            <!-- Show image if has image and (no video OR toggle is on image) -->
            <img
              v-else-if="getMediaUrl()"
              :src="getMediaUrl()!"
              alt="Post content"
              class="media-image"
            />
            <div v-else class="media-placeholder">
              <MaterialIcon icon="image" size="xl" color="var(--text-muted)" />
              <span>{{ $t('common.noImage') }}</span>
            </div>

            <!-- Animate Image Button -->
            <div v-if="canAnimate && !animating" class="animate-image-section">
              <BaseButton
                variant="secondary"
                size="medium"
                class="animate-button"
                @click="handleAnimateClick"
              >
                <MaterialIcon icon="movie" size="sm" />
                {{ t('easyMode.step3.animateImage') }}
                <span class="credits-hint">{{ t('easyMode.step3.animateCredits') }}</span>
              </BaseButton>

              <!-- Animation Options Panel -->
              <div v-if="showAnimationOptions" class="animation-options-panel">
                <h4 class="options-title">{{ t('easyMode.step3.animationOptionsTitle') }}</h4>

                <!-- Duration Selection -->
                <div class="video-option-group">
                  <label class="video-option-label">{{ t('easyMode.step2.durationLabel') }}</label>
                  <div class="duration-options">
                    <button
                      v-for="duration in [4, 6, 8]"
                      :key="duration"
                      :class="['duration-button', { 'selected': animationVideoDuration === duration }]"
                      @click="animationVideoDuration = duration as 4 | 6 | 8"
                    >
                      {{ duration }}{{ t('easyMode.step2.seconds') }}
                    </button>
                  </div>
                  <p v-if="animationVideoDuration > 4" class="duration-warning">
                    {{ t('easyMode.step2.durationWarning', 'Longer videos take more time to generate and may fail during high demand.') }}
                  </p>
                </div>

                <!-- Aspect Ratio Selection -->
                <div class="video-option-group">
                  <label class="video-option-label">{{ t('easyMode.step2.aspectRatioLabel') }}</label>
                  <div class="aspect-ratio-options">
                    <button
                      :class="['aspect-ratio-button', { 'selected': animationVideoAspectRatio === '9:16' }]"
                      @click="animationVideoAspectRatio = '9:16'"
                    >
                      <span>9:16</span>
                      <span class="aspect-hint">{{ t('easyMode.step2.portrait') }}</span>
                    </button>
                    <button
                      :class="['aspect-ratio-button', { 'selected': animationVideoAspectRatio === '16:9' }]"
                      @click="animationVideoAspectRatio = '16:9'"
                    >
                      <span>16:9</span>
                      <span class="aspect-hint">{{ t('easyMode.step2.landscape') }}</span>
                    </button>
                  </div>
                </div>

                <!-- Generate Video Button -->
                <BaseButton
                  variant="primary"
                  size="medium"
                  class="generate-animation-button"
                  @click="handleGenerateVideo"
                >
                  <MaterialIcon icon="movie" size="sm" />
                  {{ t('easyMode.step3.generateVideoFromImage') }} - {{ t('easyMode.step3.generateVideoCredits') }}
                </BaseButton>
              </div>
            </div>

            <!-- Animating Overlay -->
            <div v-if="animating" class="animating-overlay">
              <div class="animating-spinner"></div>
              <span>{{ t('easyMode.step3.animatingImage') }}</span>
            </div>
          </div>

          <!-- Info Section -->
          <div class="modal-info">
            <h2 class="modal-title">{{ $t('scheduler.postDetails') }}</h2>

            <!-- Status Badge -->
            <div class="info-row">
              <span class="status-badge" :class="getStatusClass(postStatus)">
                {{ getStatusLabel(postStatus) }}
              </span>
            </div>

            <!-- Date, Time & Timezone -->
            <div v-if="postStatus !== 'draft'" class="info-section">
              <div class="info-section-inner">
                <div class="info-label">
                  <MaterialIcon icon="calendar_today" size="sm" />
                  <span>{{ postStatus === 'published' ? $t('scheduler.publishedAt') : $t('scheduler.publishTime') }}</span>
                </div>
                <div class="datetime-details">
                  <div class="datetime-item">
                    <MaterialIcon icon="event" size="sm" />
                    <span>{{ formatDate() }}</span>
                  </div>
                  <div v-if="formatTime()" class="datetime-item">
                    <MaterialIcon icon="schedule" size="sm" />
                    <span>{{ formatTime() }}</span>
                  </div>
                  <div v-if="post.timezone" class="datetime-item">
                    <MaterialIcon icon="public" size="sm" />
                    <span>{{ post.timezone.replace(/_/g, ' ') }}</span>
                  </div>
                  <div v-if="postStatus === 'scheduled' && getTimeRemaining()" class="datetime-item">
                    <MaterialIcon icon="timer" size="sm" />
                    <span>{{ getTimeRemaining() }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Created (for drafts) -->
            <div v-if="postStatus === 'draft'" class="info-section">
              <div class="info-section-inner">
                <div class="info-label">
                  <MaterialIcon icon="edit_note" size="sm" />
                  <span>{{ $t('common.created') }}</span>
                </div>
                <div class="info-value">{{ formatDate() }}</div>
              </div>
            </div>

            <!-- Platforms -->
            <div v-if="getPlatforms().length > 0" class="info-section">
              <div class="info-section-inner">
                <div class="info-label">
                  <MaterialIcon icon="share" size="sm" />
                  <span>{{ $t('dashboardNew.platforms') }}</span>
                </div>
                <div class="platforms-row">
                  <div
                    v-for="platform in getPlatforms()"
                    :key="platform"
                    class="platform-badge"
                    :class="`platform-bg-${platform}`"
                  >
                    <PlatformLogo :platform="platform as any" :size="16" />
                    <span>{{ platform }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Engagement Metrics (for published posts) -->
            <div v-if="postStatus === 'published' && post?.id" class="info-section">
              <div class="info-section-inner">
                <div class="info-label">
                  <MaterialIcon icon="trending_up" size="sm" />
                  <span>{{ $t('analytics.engagement') }}</span>
                </div>
                <div class="engagement-details">
                  <template v-if="engagementStore.getPostEngagement(post.id)">
                    <div
                      v-for="(metrics, platform) in engagementStore.getPostEngagement(post.id)"
                      :key="platform"
                      class="platform-engagement-card"
                    >
                      <div class="platform-engagement-header">
                        <PlatformLogo :platform="platform as any" :size="20" />
                        <span class="platform-engagement-name">{{ platform.charAt(0).toUpperCase() + platform.slice(1) }}</span>
                      </div>
                      <div class="platform-engagement-stats">
                        <div class="engagement-stat">
                          <MaterialIcon icon="thumb_up" size="xs" />
                          <span class="stat-value">{{ (metrics.likes || 0).toLocaleString() }}</span>
                          <span class="stat-label">{{ $t('analytics.likes') }}</span>
                        </div>
                        <div class="engagement-stat">
                          <MaterialIcon icon="comment" size="xs" />
                          <span class="stat-value">{{ (metrics.comments || 0).toLocaleString() }}</span>
                          <span class="stat-label">{{ $t('analytics.comments') }}</span>
                        </div>
                        <div class="engagement-stat">
                          <MaterialIcon icon="share" size="xs" />
                          <span class="stat-value">{{ (metrics.shares || 0).toLocaleString() }}</span>
                          <span class="stat-label">{{ $t('analytics.shares') }}</span>
                        </div>
                        <div v-if="metrics.reach > 0" class="engagement-stat">
                          <MaterialIcon icon="visibility" size="xs" />
                          <span class="stat-value">{{ (metrics.reach || 0).toLocaleString() }}</span>
                          <span class="stat-label">{{ $t('analytics.reach') }}</span>
                        </div>
                        <div v-if="metrics.impressions > 0" class="engagement-stat">
                          <MaterialIcon icon="bar_chart" size="xs" />
                          <span class="stat-value">{{ (metrics.impressions || 0).toLocaleString() }}</span>
                          <span class="stat-label">{{ $t('analytics.impressions') }}</span>
                        </div>
                      </div>
                      <!-- Missing reach data notice -->
                      <div v-if="metrics.reach === 0 && metrics.impressions === 0 && (metrics.likes > 0 || metrics.comments > 0)" class="missing-reach-notice">
                        <MaterialIcon icon="info" size="xs" />
                        <span>{{ $t('analytics.reachDataUnavailable') }}</span>
                      </div>
                    </div>
                  </template>
                  <div v-else class="no-engagement-data">
                    <MaterialIcon icon="info" size="sm" />
                    <p>{{ $t('analytics.noEngagementData') }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Restaurant -->
            <div v-if="getRestaurantName()" class="info-section">
              <div class="info-section-inner">
                <div class="info-label">
                  <MaterialIcon icon="restaurant" size="sm" />
                  <span>{{ $t('dashboardNew.restaurant') }}</span>
                </div>
                <div class="info-value">{{ getRestaurantName() }}</div>
              </div>
            </div>

            <!-- Caption -->
            <div v-if="getPostText()" class="info-section">
              <div class="info-section-inner">
                <div class="info-label">
                  <MaterialIcon icon="notes" size="sm" />
                  <span>{{ $t('scheduler.caption') }}</span>
                </div>
                <div class="caption-text">{{ getPostText() }}</div>
              </div>
            </div>

            <!-- Hashtags -->
            <div v-if="getHashtags().length > 0" class="info-section">
              <div class="info-section-inner">
                <div class="info-label">
                  <MaterialIcon icon="tag" size="sm" />
                  <span>{{ $t('posts.hashtags') }}</span>
                </div>
                <div class="hashtags-row">
                  <span v-for="tag in getHashtags()" :key="tag" class="hashtag">{{ tag }}</span>
                </div>
              </div>
            </div>

            <!-- Error Message (for failed) -->
            <div v-if="postStatus === 'failed' && post.error_message" class="info-section error-section">
              <div class="info-label error-label">
                <MaterialIcon icon="error" size="sm" />
                <span>{{ $t('common.error') }}</span>
              </div>
              <div class="error-text">{{ post.error_message }}</div>
            </div>

            <!-- View Post Links (for published) -->
            <div v-if="postStatus === 'published' && post.platform_post_urls" class="info-section">
              <div class="info-label">
                <MaterialIcon icon="link" size="sm" />
                <span>{{ $t('scheduler.viewPost') }}</span>
              </div>
              <div class="view-links">
                <a
                  v-for="(url, platform) in (post.platform_post_urls as Record<string, string>)"
                  :key="platform"
                  :href="url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="view-link"
                  :class="`platform-bg-${platform}`"
                >
                  <PlatformLogo :platform="platform as any" :size="14" />
                  <span>{{ $t('scheduler.viewOn') }} {{ platform }}</span>
                  <MaterialIcon icon="open_in_new" size="sm" />
                </a>
              </div>
            </div>

            <!-- Notes -->
            <div v-if="post.notes" class="info-section no-border">
              <div class="info-section-inner">
                <div class="info-label">
                  <MaterialIcon icon="sticky_note_2" size="sm" />
                  <span>{{ $t('editScheduledPost.notes') }}</span>
                </div>
                <div class="notes-text">{{ post.notes }}</div>
              </div>
            </div>

            <!-- Actions -->
            <div class="modal-actions">
              <!-- Draft actions -->
              <template v-if="postStatus === 'draft'">
                <BaseButton variant="primary" size="medium" @click="handleSchedule">
                  <MaterialIcon icon="send" size="sm" />
                  {{ $t('posts.publishButton') }}
                </BaseButton>
                <BaseButton variant="secondary" size="medium" @click="handleEdit">
                  <MaterialIcon icon="edit" size="sm" />
                  {{ $t('common.edit') }}
                </BaseButton>
                <BaseButton variant="danger" size="medium" @click="handleDelete">
                  <MaterialIcon icon="delete" size="sm" />
                  {{ $t('common.delete') }}
                </BaseButton>
              </template>

              <!-- Scheduled actions -->
              <template v-else-if="postStatus === 'scheduled'">
                <BaseButton variant="primary" size="medium" @click="handleEdit">
                  <MaterialIcon icon="edit_calendar" size="sm" />
                  {{ $t('scheduler.edit') }}
                </BaseButton>
                <BaseButton variant="danger" size="medium" @click="handleDelete">
                  <MaterialIcon icon="cancel" size="sm" />
                  {{ $t('scheduler.cancelPost') }}
                </BaseButton>
              </template>

              <!-- Published - just close -->
              <template v-else-if="postStatus === 'published'">
                <BaseButton variant="ghost" size="medium" @click="closeModal">
                  {{ $t('common.close') }}
                </BaseButton>
              </template>

              <!-- Failed or Partial actions -->
              <template v-else-if="postStatus === 'failed' || postStatus === 'partial'">
                <BaseButton variant="primary" size="medium" @click="handleRetry">
                  <MaterialIcon icon="refresh" size="sm" />
                  {{ $t('scheduler.retryPost') }}
                </BaseButton>
                <BaseButton variant="secondary" size="medium" @click="handleEdit">
                  <MaterialIcon icon="edit" size="sm" />
                  {{ $t('common.edit') }}
                </BaseButton>
                <BaseButton variant="danger" size="medium" @click="handleDelete">
                  <MaterialIcon icon="delete" size="sm" />
                  {{ $t('common.delete') }}
                </BaseButton>
              </template>
            </div>
          </div>
        </div>
  </BaseModal>
</template>

<style scoped>
/* Custom Close Button */
.post-detail-close-button {
  position: absolute;
  top: var(--space-md);
  right: var(--space-md);
  background: var(--accent-alpha-05);
  border: 1px solid var(--accent-alpha-10);
  color: var(--text-muted);
  cursor: pointer;
  padding: var(--space-sm);
  border-radius: var(--radius-sm);
  transition: var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
  min-width: 44px;
  min-height: 44px;
}

.post-detail-close-button:hover {
  color: var(--text-primary);
  background: var(--accent-alpha-10);
  border-color: var(--accent-alpha-20);
}

.modal-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  max-height: 80vh;
  overflow: hidden;
}

/* Media Section */
.modal-media {
  background: rgba(15, 61, 46, 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  overflow: hidden;
  position: relative;
}

.media-image,
.media-video {
  max-width: 100%;
  max-height: 60vh;
  object-fit: contain;
}

.media-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
  color: var(--text-muted);
  padding: var(--space-3xl);
}

/* Media Toggle */
.media-toggle {
  position: absolute;
  top: var(--space-md);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: var(--space-xs);
  background: var(--bg-secondary);
  padding: var(--space-xs);
  border-radius: var(--radius-full);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 5;
}

.toggle-btn {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-md);
  border: none;
  border-radius: var(--radius-full);
  background: transparent;
  color: var(--text-secondary);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-btn:hover {
  background: var(--bg-tertiary);
}

.toggle-btn.active {
  background: var(--gold-primary);
  color: #ffffff;
}

/* Info Section */
.modal-info {
  padding: var(--space-2xl);
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  overflow-y: auto;
  max-height: 80vh;
}

.modal-title {
  font-family: var(--font-heading);
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  color: var(--gold-primary);
  margin: 0;
}

.info-row {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  flex-wrap: wrap;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: var(--space-xs) var(--space-lg);
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  text-transform: capitalize;
}

.status-published {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}

.status-scheduled {
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
}

.status-partial {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
}

.status-failed {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.status-cancelled {
  background: rgba(107, 114, 128, 0.15);
  color: #6b7280;
}

.status-draft {
  background: rgba(156, 163, 175, 0.15);
  color: #9ca3af;
}

.datetime-details {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.datetime-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--text-base);
  font-weight: var(--font-normal);
  color: var(--text-primary);
}

.datetime-item .material-icon {
  color: var(--text-muted);
}

.info-section {
  padding: var(--space-lg) 0;
  border-bottom: 1px solid var(--border-color);
}

.info-section.no-border,
.info-section:last-of-type {
  border-bottom: none;
}

.info-section-inner {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.info-label {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--text-lg);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
}

.info-value {
  font-size: var(--text-base);
  color: var(--text-primary);
}

.platforms-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.platform-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  color: #fff;
  text-transform: capitalize;
}

.platform-bg-facebook { background: #1877f2; }
.platform-bg-instagram { background: linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888); }
.platform-bg-twitter { background: #000; }
.platform-bg-tiktok { background: #000; }
.platform-bg-linkedin { background: #0077b5; }
.platform-bg-youtube { background: #ff0000; }

.caption-text {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: 1.6;
  white-space: pre-wrap;
  max-height: 150px;
  overflow-y: auto;
  padding: var(--space-md);
  background: var(--bg-primary);
  border-radius: var(--radius-md);
}

.hashtags-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.hashtag {
  font-size: var(--text-sm);
  color: var(--gold-primary);
  background: rgba(15, 61, 46, 0.1);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-sm);
}

.notes-text {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: 1.5;
  padding: var(--space-md);
  background: var(--bg-primary);
  border-radius: var(--radius-md);
  font-style: italic;
}

.error-section {
  background: var(--error-bg);
  border: 1px solid var(--error-border);
  border-radius: var(--radius-md);
  padding: var(--space-md);
}

.error-label {
  color: var(--error-text);
}

.error-text {
  font-size: var(--text-sm);
  color: var(--error-text);
}

.view-links {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.view-link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: #fff;
  text-decoration: none;
  transition: var(--transition-fast);
  width: fit-content;
}

.view-link:hover {
  filter: brightness(1.1);
  transform: translateX(4px);
}

.modal-actions {
  display: flex;
  gap: var(--space-md);
  margin-top: auto;
  padding-top: var(--space-2xl);
  flex-wrap: nowrap;
}

/* Animate Image Section */
.animate-image-section {
  width: 100%;
  padding: var(--space-md);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
}

.animate-button {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.credits-hint {
  font-size: var(--text-xs);
  color: var(--text-muted);
  margin-left: var(--space-xs);
}

.animation-options-panel {
  width: 100%;
  max-width: 320px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
}

.options-title {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--space-md) 0;
}

.video-option-group {
  margin-bottom: var(--space-md);
}

.video-option-label {
  display: block;
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
  margin-bottom: var(--space-xs);
}

.duration-options {
  display: flex;
  gap: var(--space-xs);
}

.duration-button {
  flex: 1;
  padding: var(--space-xs) var(--space-sm);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: var(--text-xs);
  cursor: pointer;
  transition: all 0.2s ease;
}

.duration-button:hover {
  border-color: var(--gold-primary);
}

.duration-button.selected {
  border-color: var(--gold-primary);
  background: var(--gold-subtle);
  color: var(--gold-primary);
}

.duration-warning {
  margin-top: var(--space-xs);
  font-size: var(--text-xs);
  color: var(--warning-text, #f59e0b);
  font-style: italic;
}

.aspect-ratio-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-xs);
}

.aspect-ratio-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-sm);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: var(--text-xs);
  cursor: pointer;
  transition: all 0.2s ease;
}

.aspect-ratio-button:hover {
  border-color: var(--gold-primary);
}

.aspect-ratio-button.selected {
  border-color: var(--gold-primary);
  background: var(--gold-subtle);
}

.aspect-hint {
  font-size: 10px;
  color: var(--text-muted);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  cursor: pointer;
}

.checkbox-input {
  width: 16px;
  height: 16px;
  accent-color: var(--gold-primary);
}

.checkbox-text {
  font-size: var(--text-xs);
  color: var(--text-primary);
}

.generate-animation-button {
  width: 100%;
  margin-top: var(--space-sm);
}

/* Animating Overlay */
.animating-overlay {
  position: absolute;
  inset: 0;
  background: rgba(15, 61, 46, 0.85);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
  z-index: 10;
  color: #ffffff;
  font-weight: var(--font-medium);
}

.animating-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Responsive */
@media (max-width: 900px) {
  .modal-content {
    grid-template-columns: 1fr;
    max-height: none;
    overflow: visible;
  }

  .modal-media {
    min-height: 200px;
  }

  .media-image,
  .media-video {
    max-height: 35vh;
  }

  .modal-info {
    max-height: none;
    overflow-y: visible;
  }
}

@media (max-width: 600px) {
  .modal-info {
    padding: var(--space-lg);
  }

  .modal-title {
    font-size: var(--text-xl);
  }

  .modal-actions {
    flex-direction: column;
    gap: var(--space-sm);
  }

  .modal-actions > * {
    width: 100%;
  }

  .post-detail-close-button {
    top: var(--space-sm);
    right: var(--space-sm);
  }
}

/* Override BaseModal body overflow to prevent double scroll */
:deep(.base-modal-body) {
  overflow: hidden;
  padding: 0;
}

/* Engagement Details */
.engagement-details {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.platform-engagement-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: var(--space-md);
}

.platform-engagement-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
  padding-bottom: var(--space-sm);
  border-bottom: 1px solid var(--border-color);
}

.platform-engagement-name {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  text-transform: capitalize;
}

.platform-engagement-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: var(--space-md);
}

.engagement-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
  text-align: center;
}

.engagement-stat .material-icon {
  color: var(--gold-primary);
}

.stat-value {
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  color: var(--text-primary);
}

.stat-label {
  font-size: var(--text-xs);
  color: var(--text-secondary);
  text-transform: capitalize;
}

.no-engagement-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-xl);
  text-align: center;
  color: var(--text-muted);
  background: var(--bg-primary);
  border-radius: var(--radius-md);
}

.no-engagement-data p {
  margin: 0;
  font-size: var(--text-sm);
}

/* Missing reach data notice */
.missing-reach-notice {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-md);
  margin-top: var(--space-sm);
  background: var(--info-bg);
  border: 1px solid var(--info-border);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: var(--text-xs);
  line-height: 1.4;
}

.missing-reach-notice .material-icon {
  color: var(--info-text);
  flex-shrink: 0;
}

/* ===== DARK MODE OVERRIDES ===== */
:root[data-theme="dark"] .modal-media {
  background: var(--bg-tertiary);
}

:root[data-theme="dark"] .caption-text,
:root[data-theme="dark"] .notes-text {
  background: var(--bg-tertiary);
}

:root[data-theme="dark"] .hashtag {
  background: var(--accent-alpha-15);
}

:root[data-theme="dark"] .platform-engagement-card,
:root[data-theme="dark"] .no-engagement-data {
  background: var(--bg-tertiary);
}
</style>

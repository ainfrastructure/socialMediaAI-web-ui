<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseModal from './BaseModal.vue'
import BaseButton from './BaseButton.vue'
import MaterialIcon from './MaterialIcon.vue'
import PlatformLogo from './PlatformLogo.vue'

const props = defineProps<{
  modelValue: boolean
  post: any
  mode?: 'view' | 'edit' // For future edit mode support
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'edit', post: any): void
  (e: 'delete', post: any): void
  (e: 'schedule', post: any): void
  (e: 'close'): void
}>()

const { t } = useI18n()

// Close modal
function closeModal() {
  emit('update:modelValue', false)
  emit('close')
}

// Get media URL from post (handles nested structures)
function getMediaUrl(): string | null {
  const p = props.post
  if (!p) return null

  if (p.media_url) return p.media_url
  if (p.image_url) return p.image_url
  if (p.video_url) return p.video_url
  if (p.favorite_posts?.media_url) return p.favorite_posts.media_url
  if (p.favorite_post?.media_url) return p.favorite_post.media_url
  if (p.favorite?.media_url) return p.favorite.media_url

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
</script>

<template>
  <BaseModal
    :model-value="modelValue && !!post"
    size="xl"
    :show-close-button="true"
    card-variant="glass-intense"
    @update:model-value="(val: boolean) => !val && closeModal()"
    @close="closeModal"
  >
    <div class="modal-content">
          <!-- Media Section -->
          <div class="modal-media">
            <img
              v-if="getContentType() === 'image' && getMediaUrl()"
              :src="getMediaUrl()!"
              alt="Post content"
              class="media-image"
            />
            <video
              v-else-if="getContentType() === 'video' && getMediaUrl()"
              :src="getMediaUrl()!"
              controls
              class="media-video"
            ></video>
            <div v-else class="media-placeholder">
              <MaterialIcon icon="image" size="xl" color="var(--text-muted)" />
              <span>{{ $t('common.noImage') }}</span>
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

              <!-- Failed actions -->
              <template v-else-if="postStatus === 'failed'">
                <BaseButton variant="primary" size="medium" @click="handleEdit">
                  <MaterialIcon icon="refresh" size="sm" />
                  {{ $t('common.retry') }}
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
.modal-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

/* Media Section */
.modal-media {
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  overflow: hidden;
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

/* Info Section */
.modal-info {
  padding: var(--space-2xl);
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
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
  background: rgba(212, 175, 55, 0.1);
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
  flex-wrap: wrap;
}

/* Responsive */
@media (max-width: 900px) {
  .modal-content {
    grid-template-columns: 1fr;
  }

  .modal-media {
    min-height: 200px;
  }

  .media-image,
  .media-video {
    max-height: 35vh;
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
}
</style>

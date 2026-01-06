<template>
  <div
    :class="['day-post-card', post.status ? `status-${post.status}` : '']"
    @click="$emit('view', post)"
  >
    <!-- Thumbnail Section - Always show image for reliable thumbnails -->
    <div class="post-card-thumbnail">
      <img
        v-if="post.media_url"
        :src="getMediaUrl(post.media_url)"
        :alt="post.post_text || 'Post'"
        class="post-thumb-img"
        @error="handleImageError"
      />
      <div v-else class="post-thumb-placeholder">
        <span class="thumb-icon">📸</span>
      </div>
      <!-- Video indicator overlay -->
      <span v-if="post.video_url" class="video-indicator">🎥</span>
    </div>

    <!-- Time Section -->
    <div class="post-card-time">
      <div class="time-large">{{ formattedTime }}</div>
      <div v-if="post.timezone" class="time-zone">{{ post.timezone }}</div>
    </div>

    <!-- Content Section -->
    <div class="post-card-content">
      <div class="post-card-header">
        <span
          v-if="post.platform"
          :class="['post-card-platform', `platform-${post.platform}`]"
        >
          {{ post.platform }}
        </span>
        <span class="post-card-type">
          {{ contentTypeEmoji }} {{ post.content_type }}
        </span>
        <span
          v-if="post.status"
          :class="['post-card-status', `status-${post.status}`]"
        >
          {{ post.status }}
        </span>
      </div>
      <p v-if="post.post_text" class="post-card-text">
        {{ truncatedText }}
      </p>
      <div v-if="post.restaurant_name" class="post-card-restaurant">
        🏪 {{ post.restaurant_name }}
      </div>
      <!-- Error Message (if failed) -->
      <div v-if="post.status === 'failed' && post.error_message" class="post-card-error">
        ⚠️ {{ truncatedError }}
      </div>
      <div class="post-card-footer">
        <span class="post-card-timing">{{ timeRemaining }}</span>
        <!-- View Post Links for Published Posts - Show all platforms -->
        <div
          v-if="post.status === 'published' && post.platform_post_urls && Object.keys(post.platform_post_urls).length > 0"
          class="platform-links-row"
        >
          <a
            v-for="(url, platform) in (post.platform_post_urls as Record<string, string>)"
            :key="platform"
            :href="url"
            target="_blank"
            rel="noopener noreferrer"
            class="view-post-link"
            @click.stop
          >
            🔗 {{ capitalizeFirst(platform as string) }}
          </a>
        </div>
        <!-- Fallback for old single-platform posts -->
        <a
          v-else-if="post.status === 'published' && post.platform_post_url"
          :href="post.platform_post_url"
          target="_blank"
          rel="noopener noreferrer"
          class="view-post-link"
          @click.stop
        >
          🔗 {{ $t('scheduler.viewPost', 'View Post') }}
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface ScheduledPost {
  id: string | number
  post_text?: string
  media_url?: string
  video_url?: string
  content_type?: string
  platform?: string
  status?: string
  scheduled_time?: string
  timezone?: string
  restaurant_name?: string
  error_message?: string
  platform_post_url?: string
  platform_post_urls?: Record<string, string>
}

const props = defineProps<{
  post: ScheduledPost
}>()

defineEmits<{
  (e: 'view', post: ScheduledPost): void
}>()

const getMediaUrl = (url: string): string => {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000'
  return `${apiBase}${url.startsWith('/') ? '' : '/'}${url}`
}

const handleImageError = (event: Event): void => {
  const img = event.target as HTMLImageElement
  img.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23333" width="100" height="100"/><text fill="%23666" x="50%" y="50%" text-anchor="middle" dy=".3em">📷</text></svg>'
}

const contentTypeEmoji = computed(() => {
  switch (props.post.content_type) {
    case 'image': return '📸'
    case 'video': return '🎥'
    case 'carousel': return '🎠'
    case 'story': return '📖'
    case 'reel': return '🎬'
    default: return '📝'
  }
})

const formattedTime = computed(() => {
  if (!props.post.scheduled_time) return 'No time'
  try {
    const date = new Date(props.post.scheduled_time)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return 'No time'
  }
})

const truncatedText = computed(() => {
  const text = props.post.post_text || ''
  return text.length > 150 ? text.substring(0, 150) + '...' : text
})

const truncatedError = computed(() => {
  const text = props.post.error_message || ''
  return text.length > 80 ? text.substring(0, 80) + '...' : text
})

const timeRemaining = computed(() => {
  if (!props.post.scheduled_time) return ''
  if (props.post.status === 'published') return 'Published'
  if (props.post.status === 'failed') return 'Failed'

  const now = new Date()
  const scheduled = new Date(props.post.scheduled_time)
  const diff = scheduled.getTime() - now.getTime()

  if (diff < 0) return 'Past due'

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (hours > 24) {
    const days = Math.floor(hours / 24)
    return `in ${days} day${days > 1 ? 's' : ''}`
  }
  if (hours > 0) return `in ${hours}h ${minutes}m`
  return `in ${minutes}m`
})

const capitalizeFirst = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
</script>

<style scoped>
.day-post-card {
  display: flex;
  gap: var(--space-lg);
  padding: var(--space-lg);
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(15, 61, 46, 0.1);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-base);
}

.day-post-card:hover {
  background: rgba(15, 61, 46, 0.05);
  border-color: rgba(15, 61, 46, 0.15);
  transform: translateY(-2px);
}

.day-post-card.status-published {
  border-left: 3px solid var(--success-text);
}

.day-post-card.status-failed {
  border-left: 3px solid var(--error-text);
}

.day-post-card.status-pending {
  border-left: 3px solid var(--warning-text);
}

.post-card-thumbnail {
  position: relative;
  width: 80px;
  height: 80px;
  flex-shrink: 0;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: rgba(255, 255, 255, 0.8);
}

.video-indicator {
  position: absolute;
  top: 4px;
  right: 4px;
  font-size: 0.875rem;
  background: rgba(0, 0, 0, 0.6);
  padding: 2px 4px;
  border-radius: var(--radius-sm);
}

.post-thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.post-thumb-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 61, 46, 0.05);
}

.thumb-icon {
  font-size: 1.5rem;
  opacity: 0.5;
}

.post-card-time {
  min-width: 70px;
  text-align: center;
  flex-shrink: 0;
}

.time-large {
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  color: var(--gold-primary);
}

.time-zone {
  font-size: var(--text-xs);
  color: var(--text-muted);
  margin-top: var(--space-xs);
}

.post-card-content {
  flex: 1;
  min-width: 0;
}

.post-card-header {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  margin-bottom: var(--space-sm);
}

.post-card-platform {
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-sm);
  background: rgba(15, 61, 46, 0.1);
  text-transform: capitalize;
}

.post-card-platform.platform-facebook {
  background: rgba(24, 119, 242, 0.2);
  color: #1877F2;
}

.post-card-platform.platform-instagram {
  background: rgba(225, 48, 108, 0.2);
  color: #E1306C;
}

.post-card-type {
  font-size: var(--text-xs);
  color: var(--text-secondary);
  text-transform: capitalize;
}

.post-card-status {
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-sm);
  text-transform: capitalize;
}

.post-card-status.status-scheduled {
  background: rgba(15, 61, 46, 0.1);
  color: var(--gold-primary);
}

.post-card-status.status-published {
  background: var(--success-bg);
  color: var(--success-text);
}

.post-card-status.status-failed {
  background: var(--error-bg);
  color: var(--error-text);
}

.post-card-status.status-pending {
  background: var(--warning-bg);
  color: var(--warning-text);
}

.post-card-text {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: var(--leading-normal);
  margin: 0 0 var(--space-sm) 0;
}

.post-card-restaurant {
  font-size: var(--text-xs);
  color: var(--text-muted);
  margin-bottom: var(--space-sm);
}

.post-card-error {
  font-size: var(--text-xs);
  color: var(--error-text);
  background: var(--error-bg);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-sm);
  margin-bottom: var(--space-sm);
}

.post-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
}

.post-card-timing {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.platform-links-row {
  display: flex;
  gap: var(--space-sm);
}

.view-post-link {
  font-size: var(--text-xs);
  color: var(--gold-primary);
  text-decoration: none;
  padding: var(--space-xs) var(--space-sm);
  background: rgba(15, 61, 46, 0.05);
  border-radius: var(--radius-sm);
  transition: all var(--transition-base);
}

.view-post-link:hover {
  background: rgba(15, 61, 46, 0.1);
}

@media (max-width: 768px) {
  .day-post-card {
    flex-direction: column;
    gap: var(--space-md);
  }

  .post-card-thumbnail {
    width: 100%;
    height: 120px;
  }

  .post-card-time {
    text-align: left;
  }
}
</style>

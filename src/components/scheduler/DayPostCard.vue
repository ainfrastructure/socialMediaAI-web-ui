<template>
  <div
    :class="['day-post-card', post.status ? `status-${post.status}` : '']"
    @click="$emit('view', post)"
  >
    <!-- Thumbnail Section -->
    <div class="post-card-thumbnail">
      <img
        v-if="post.media_url"
        :src="getMediaUrl(post.media_url)"
        :alt="post.post_text || 'Post'"
        class="post-thumb-img"
        @error="handleImageError"
      />
      <div v-else class="post-thumb-placeholder">
        <MaterialIcon icon="image" size="md" />
      </div>
      <!-- Video indicator overlay -->
      <span v-if="post.video_url" class="video-indicator">
        <MaterialIcon icon="videocam" size="xs" />
      </span>
    </div>

    <!-- Time Section -->
    <div class="post-card-time">
      <div class="time-large">{{ formattedTime }}</div>
      <div v-if="post.timezone" class="time-zone">{{ post.timezone }}</div>
    </div>

    <!-- Content Section -->
    <div class="post-card-content">
      <div class="post-card-header">
        <PlatformLogo
          v-if="post.platform"
          :platform="post.platform as 'facebook' | 'instagram' | 'tiktok'"
          :size="18"
        />
        <span class="post-card-type">
          <MaterialIcon :icon="contentTypeIcon" size="xs" />
          {{ post.content_type }}
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
      <div v-if="post.business_name || post.brand_name" class="post-card-brand">
        <MaterialIcon icon="store" size="xs" />
        {{ post.business_name || post.brand_name }}
      </div>
      <!-- Error Message (if failed) -->
      <div v-if="post.status === 'failed' && post.error_message" class="post-card-error">
        <MaterialIcon icon="warning" size="xs" />
        {{ truncatedError }}
      </div>
      <div class="post-card-footer">
        <span class="post-card-timing">{{ timeRemaining }}</span>
        <!-- View Post Links for Published Posts -->
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
            <MaterialIcon icon="open_in_new" size="xs" />
            {{ capitalizeFirst(platform as string) }}
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
          <MaterialIcon icon="open_in_new" size="xs" />
          {{ $t('scheduler.viewPost', 'View Post') }}
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { API_URL } from '@/services/apiBase'
import MaterialIcon from '../MaterialIcon.vue'
import PlatformLogo from '../PlatformLogo.vue'

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
  business_name?: string
  brand_name?: string
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
  return `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`
}

const handleImageError = (event: Event): void => {
  const img = event.target as HTMLImageElement
  img.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23e8e1d5" width="100" height="100"/></svg>'
}

const contentTypeIcon = computed(() => {
  switch (props.post.content_type) {
    case 'image': return 'image'
    case 'video': return 'videocam'
    case 'carousel': return 'view_carousel'
    case 'story': return 'auto_stories'
    case 'reel': return 'movie'
    default: return 'article'
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
  background: var(--glass-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  cursor: pointer;
  transition: all var(--transition-base);
  position: relative;
  overflow: hidden;
}

/* Top gradient stripe for status */
.day-post-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: rgba(15, 61, 46, 0.2);
  transition: background var(--transition-base);
}

.day-post-card.status-published::before {
  background: linear-gradient(90deg, var(--success-text), rgba(15, 61, 46, 0.6));
}

.day-post-card.status-failed::before {
  background: linear-gradient(90deg, #ef4444, rgba(239, 68, 68, 0.6));
}

.day-post-card.status-pending::before {
  background: linear-gradient(90deg, #f59e0b, rgba(245, 158, 11, 0.6));
}

.day-post-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 28px rgba(15, 61, 46, 0.1);
  border-color: rgba(15, 61, 46, 0.2);
}

.post-card-thumbnail {
  position: relative;
  width: 80px;
  height: 80px;
  flex-shrink: 0;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--bg-tertiary);
  transition: transform var(--transition-base);
}

.day-post-card:hover .post-card-thumbnail {
  transform: scale(1.05);
}

.video-indicator {
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(0, 0, 0, 0.6);
  color: #ffffff;
  padding: 2px 4px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
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
  color: var(--text-muted);
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
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-sm);
}

.post-card-type {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--text-xs);
  color: var(--text-secondary);
  text-transform: capitalize;
}

.post-card-status {
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  padding: 3px var(--space-sm);
  border-radius: var(--radius-full);
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

.post-card-brand {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--text-xs);
  color: var(--text-muted);
  margin-bottom: var(--space-sm);
}

.post-card-error {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--text-xs);
  color: var(--error-text);
  background: var(--error-bg);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-md);
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
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--text-xs);
  color: var(--gold-primary);
  text-decoration: none;
  padding: var(--space-xs) var(--space-sm);
  background: rgba(15, 61, 46, 0.05);
  border-radius: var(--radius-full);
  transition: all var(--transition-fast);
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

  .day-post-card:hover .post-card-thumbnail {
    transform: none;
  }

  .post-card-time {
    text-align: left;
  }
}

@media (prefers-reduced-motion: reduce) {
  .day-post-card,
  .post-card-thumbnail {
    transition: none;
  }

  .day-post-card:hover {
    transform: none;
  }

  .day-post-card:hover .post-card-thumbnail {
    transform: none;
  }
}
</style>

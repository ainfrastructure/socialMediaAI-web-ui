<template>
  <div
    :class="['scheduled-post-card-new', post.status ? `status-${post.status}` : '']"
    @click="$emit('view', post)"
  >
    <!-- Status Indicator Bar -->
    <div :class="['status-bar', `status-${post.status || 'scheduled'}`]"></div>

    <!-- Card Content -->
    <div class="card-content">
      <!-- Left: Media Section -->
      <div class="media-section">
        <img
          v-if="post.content_type === 'image' && post.media_url"
          :src="getMediaUrl(post.media_url)"
          :alt="post.post_text || 'Scheduled post'"
          class="post-image"
          @error="$emit('imageError', $event)"
          loading="lazy"
        />
        <video
          v-else-if="post.content_type === 'video' && post.media_url"
          :src="getMediaUrl(post.media_url)"
          class="post-image"
          muted
          preload="metadata"
        ></video>
        <div v-else class="post-image-placeholder">
          <span class="placeholder-icon">📸</span>
        </div>

        <!-- Content Type Badge on Image -->
        <div class="media-badge">
          {{ post.content_type === 'image' ? '📸' : '🎥' }}
        </div>
      </div>

      <!-- Right: Content Section -->
      <div class="content-section">
        <!-- Header Row -->
        <div class="content-header">
          <div class="time-badge">
            <span class="time-icon">🕐</span>
            <span class="time-text">{{ formatTime(post.scheduled_time) || 'No time' }}</span>
          </div>

          <div class="status-badges">
            <!-- Platform Badges (multiple) -->
            <template v-if="post.platforms && post.platforms.length > 0">
              <span
                v-for="platform in post.platforms"
                :key="platform"
                :class="['platform-badge-new', `platform-${platform}`]"
              >
                {{ getPlatformIcon(platform) }} {{ capitalizeFirst(platform) }}
              </span>
            </template>
            <!-- Fallback for old data structure -->
            <span v-else-if="post.platform" :class="['platform-badge-new', `platform-${post.platform}`]">
              {{ getPlatformIcon(post.platform) }} {{ capitalizeFirst(post.platform) }}
            </span>

            <!-- Status Badge -->
            <span :class="['status-badge-new', `status-${post.status || 'scheduled'}`]">
              <template v-if="post.status === 'published'">✅ Posted</template>
              <template v-else-if="post.status === 'failed'">❌ Failed</template>
              <template v-else>📅 Scheduled</template>
            </span>
          </div>
        </div>

        <!-- Post Text / Description -->
        <div class="post-content">
          <p v-if="post.post_text" class="post-description">
            {{ truncateText(post.post_text, 180) }}
          </p>
          <p v-else class="post-description empty">No description provided</p>
        </div>

        <!-- Restaurant Tag -->
        <div v-if="post.restaurant_name" class="restaurant-badge">
          🏪 {{ post.restaurant_name }}
        </div>

        <!-- Footer Row -->
        <div class="content-footer">
          <!-- Time Remaining / Published Info -->
          <div class="footer-info">
            <template v-if="post.status === 'published'">
              <span class="published-time">{{ formatPublishedDate(post.published_at) }}</span>
            </template>
            <template v-else>
              <span class="countdown">{{ timeRemaining }}</span>
            </template>
          </div>

          <!-- Action Buttons -->
          <div v-if="post.status !== 'published'" class="action-buttons" @click.stop>
            <button class="action-btn edit-btn" @click="$emit('edit', post)" title="Edit post">
              ✏️
            </button>
            <button class="action-btn delete-btn" @click="$emit('delete', post.id)" title="Cancel post">
              🗑️
            </button>
          </div>

          <!-- View Post Link for Published Posts -->
          <div v-else-if="post.platform_post_urls && Object.keys(post.platform_post_urls).length > 0" class="action-buttons" @click.stop>
            <a
              v-for="(url, platform) in (post.platform_post_urls as Record<string, string>)"
              :key="platform"
              :href="url"
              target="_blank"
              rel="noopener noreferrer"
              class="view-post-btn"
            >
              🔗 View on {{ capitalizeFirst(platform as string) }}
            </a>
          </div>
          <!-- Fallback for old single-platform posts -->
          <div v-else-if="post.platform_post_url" class="action-buttons" @click.stop>
            <a
              :href="post.platform_post_url"
              target="_blank"
              rel="noopener noreferrer"
              class="view-post-btn"
            >
              🔗 View on {{ capitalizeFirst(post.platform || 'Platform') }}
            </a>
          </div>
        </div>

        <!-- Error Message (if failed) -->
        <div v-if="post.status === 'failed' && post.error_message" class="error-banner">
          <span class="error-icon">⚠️</span>
          <span class="error-text">{{ truncateText(post.error_message, 100) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'

interface Post {
  id: string
  scheduled_date: string
  scheduled_time?: string
  content_type: string
  media_url?: string
  post_text?: string
  platform?: string
  platforms?: string[]
  restaurant_name?: string
  status?: string
  timezone?: string
  published_at?: string
  error_message?: string
  platform_post_url?: string
  platform_post_urls?: Record<string, string>
}

const props = defineProps<{
  post: Post
}>()

defineEmits<{
  (e: 'view', post: Post): void
  (e: 'edit', post: Post): void
  (e: 'delete', postId: string): void
  (e: 'imageError', event: Event): void
}>()

const getMediaUrl = (url: string): string => {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  const apiUrl = import.meta.env.VITE_API_URL || ''
  return url.startsWith('/') ? `${apiUrl}${url}` : `${apiUrl}/${url}`
}

const formatTime = (time: string | null | undefined): string => {
  if (!time) return ''
  try {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  } catch {
    return time
  }
}

const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

const getPlatformIcon = (platform: string): string => {
  const icons: Record<string, string> = {
    facebook: '👥',
    instagram: '📷',
    tiktok: '🎵',
    twitter: '🐦',
    linkedin: '💼'
  }
  return icons[platform.toLowerCase()] || '📱'
}

const capitalizeFirst = (str: string): string => {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

const formatPublishedDate = (dateString: string | undefined): string => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours} hour${hours > 1 ? 's' : ''} ago`
  }
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days} day${days > 1 ? 's' : ''} ago`
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    hour: '2-digit',
    minute: '2-digit'
  })
}

const timeRemaining = computed(() => {
  const post = props.post
  if (!post.scheduled_date || !post.scheduled_time) {
    return '⏱️ No time specified'
  }

  try {
    const dateTimeString = `${post.scheduled_date}T${post.scheduled_time}`
    const userTimezone = post.timezone || 'UTC'

    const scheduledDateInZone = toZonedTime(dateTimeString, userTimezone)
    const scheduledDateTimeUTC = fromZonedTime(scheduledDateInZone, userTimezone)
    const now = new Date()
    const diff = scheduledDateTimeUTC.getTime() - now.getTime()

    if (diff < 0) {
      const absDiff = Math.abs(diff)
      const hours = Math.floor(absDiff / (1000 * 60 * 60))
      const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60))

      if (hours > 24) {
        const days = Math.floor(hours / 24)
        return `⏰ Posted ${days} day${days > 1 ? 's' : ''} ago`
      }
      return `⏰ Posted ${hours}h ${minutes}m ago`
    }

    const totalMinutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60

    if (hours > 48) {
      const days = Math.floor(hours / 24)
      return `⏰ Posts in ${days} day${days > 1 ? 's' : ''}`
    } else if (hours > 0) {
      return `⏰ Posts in ${hours}h ${minutes}m`
    } else {
      return `⏰ Posts in ${minutes}m`
    }
  } catch {
    return '⏱️ Invalid time'
  }
})
</script>

<style scoped>
.scheduled-post-card-new {
  position: relative;
  background: rgba(0, 0, 0, 0.3);
  border-radius: var(--radius-lg);
  overflow: hidden;
  cursor: pointer;
  transition: all var(--transition-base);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.scheduled-post-card-new:hover {
  transform: translateY(-2px);
  border-color: rgba(212, 175, 55, 0.3);
  box-shadow: var(--shadow-lg);
}

.scheduled-post-card-new.status-published {
  border-color: rgba(52, 199, 89, 0.3);
}

.scheduled-post-card-new.status-failed {
  border-color: rgba(255, 59, 48, 0.3);
}

.status-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
}

.status-bar.status-scheduled {
  background: linear-gradient(90deg, var(--gold-primary), var(--gold-light));
}

.status-bar.status-published {
  background: linear-gradient(90deg, #34c759, #30d158);
}

.status-bar.status-failed {
  background: linear-gradient(90deg, #ff3b30, #ff453a);
}

.card-content {
  display: flex;
  gap: var(--space-lg);
  padding: var(--space-lg);
}

.media-section {
  position: relative;
  width: 140px;
  height: 140px;
  flex-shrink: 0;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: rgba(0, 0, 0, 0.2);
}

.post-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.post-image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(212, 175, 55, 0.1);
}

.placeholder-icon {
  font-size: var(--text-3xl);
  opacity: 0.5;
}

.media-badge {
  position: absolute;
  bottom: var(--space-sm);
  right: var(--space-sm);
  padding: var(--space-xs) var(--space-sm);
  background: rgba(0, 0, 0, 0.7);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
}

.content-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  min-width: 0;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-md);
  flex-wrap: wrap;
}

.time-badge {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-sm);
  background: rgba(212, 175, 55, 0.15);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  color: var(--gold-primary);
}

.status-badges {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}

.platform-badge-new {
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-secondary);
}

.platform-badge-new.platform-facebook {
  background: rgba(66, 103, 178, 0.2);
  color: #4267b2;
}

.platform-badge-new.platform-instagram {
  background: rgba(225, 48, 108, 0.2);
  color: #e1306c;
}

.platform-badge-new.platform-tiktok {
  background: rgba(0, 0, 0, 0.3);
  color: #ffffff;
}

.status-badge-new {
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
}

.status-badge-new.status-scheduled {
  background: rgba(212, 175, 55, 0.2);
  color: var(--gold-primary);
}

.status-badge-new.status-published {
  background: rgba(52, 199, 89, 0.2);
  color: #34c759;
}

.status-badge-new.status-failed {
  background: rgba(255, 59, 48, 0.2);
  color: #ff3b30;
}

.post-content {
  flex: 1;
}

.post-description {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: var(--leading-relaxed);
  margin: 0;
}

.post-description.empty {
  color: var(--text-muted);
  font-style: italic;
}

.restaurant-badge {
  font-size: var(--text-xs);
  color: var(--text-muted);
  background: rgba(255, 255, 255, 0.05);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-sm);
  display: inline-block;
}

.content-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  padding-top: var(--space-sm);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.footer-info {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.countdown {
  color: var(--gold-primary);
}

.action-buttons {
  display: flex;
  gap: var(--space-sm);
}

.action-btn {
  padding: var(--space-sm);
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-base);
  font-size: var(--text-sm);
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.edit-btn:hover {
  background: rgba(212, 175, 55, 0.2);
}

.delete-btn:hover {
  background: rgba(255, 59, 48, 0.2);
}

.view-post-btn {
  padding: var(--space-xs) var(--space-sm);
  background: rgba(52, 199, 89, 0.2);
  border-radius: var(--radius-sm);
  color: #34c759;
  text-decoration: none;
  font-size: var(--text-xs);
  transition: all var(--transition-base);
}

.view-post-btn:hover {
  background: rgba(52, 199, 89, 0.3);
}

.error-banner {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm);
  background: rgba(255, 59, 48, 0.1);
  border-radius: var(--radius-sm);
  margin-top: var(--space-sm);
}

.error-text {
  font-size: var(--text-xs);
  color: #ff3b30;
}

@media (max-width: 768px) {
  .card-content {
    flex-direction: column;
  }

  .media-section {
    width: 100%;
    height: 200px;
  }
}
</style>

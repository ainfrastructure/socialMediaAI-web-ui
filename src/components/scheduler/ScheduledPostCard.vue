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
          <span class="placeholder-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
          </span>
        </div>

        <!-- Content Type Badge on Image -->
        <div class="media-badge">
          <svg v-if="post.content_type === 'image'" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="23 7 16 12 23 17 23 7"/>
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
          </svg>
        </div>
      </div>

      <!-- Right: Content Section -->
      <div class="content-section">
        <!-- Header Row -->
        <div class="content-header">
          <div class="time-badge">
            <span class="time-icon">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </span>
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
                <span class="platform-icon" v-html="getPlatformSvg(platform)"></span>
                {{ capitalizeFirst(platform) }}
              </span>
            </template>
            <!-- Fallback for old data structure -->
            <span v-else-if="post.platform" :class="['platform-badge-new', `platform-${post.platform}`]">
              <span class="platform-icon" v-html="getPlatformSvg(post.platform)"></span>
              {{ capitalizeFirst(post.platform) }}
            </span>

            <!-- Status Badge -->
            <span :class="['status-badge-new', `status-${post.status || 'scheduled'}`]">
              <template v-if="post.status === 'published'">
                <svg class="status-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Posted
              </template>
              <template v-else-if="post.status === 'failed'">
                <svg class="status-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
                Failed
              </template>
              <template v-else>
                <svg class="status-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                Scheduled
              </template>
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
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 21h18"/>
            <path d="M5 21V7l8-4v18"/>
            <path d="M19 21V11l-6-4"/>
          </svg>
          {{ post.restaurant_name }}
        </div>

        <!-- Footer Row -->
        <div class="content-footer">
          <!-- Time Remaining / Published Info -->
          <div class="footer-info">
            <template v-if="post.status === 'published'">
              <span class="published-time">{{ formatPublishedDate(post.published_at) }}</span>
            </template>
            <template v-else>
              <span class="countdown">
                <svg class="countdown-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                {{ timeRemaining }}
              </span>
            </template>
          </div>

          <!-- Action Buttons -->
          <div v-if="post.status !== 'published'" class="action-buttons" @click.stop>
            <button class="action-btn edit-btn" @click="$emit('edit', post)" title="Edit post">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button class="action-btn delete-btn" @click="$emit('delete', post.id)" title="Cancel post">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
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
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
              View on {{ capitalizeFirst(platform as string) }}
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
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
              View on {{ capitalizeFirst(post.platform || 'Platform') }}
            </a>
          </div>
        </div>

        <!-- Error Message (if failed) -->
        <div v-if="post.status === 'failed' && post.error_message" class="error-banner">
          <span class="error-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </span>
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

const getPlatformSvg = (platform: string): string => {
  const svgs: Record<string, string> = {
    facebook: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>',
    instagram: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>',
    tiktok: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>',
    twitter: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>',
    linkedin: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>'
  }
  return svgs[platform.toLowerCase()] || '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><path d="M12 18h.01"/></svg>'
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
    return 'No time specified'
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
        return `Posted ${days} day${days > 1 ? 's' : ''} ago`
      }
      return `Posted ${hours}h ${minutes}m ago`
    }

    const totalMinutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60

    if (hours > 48) {
      const days = Math.floor(hours / 24)
      return `Posts in ${days} day${days > 1 ? 's' : ''}`
    } else if (hours > 0) {
      return `Posts in ${hours}h ${minutes}m`
    } else {
      return `Posts in ${minutes}m`
    }
  } catch {
    return 'Invalid time'
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
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--gold-primary);
}

.placeholder-icon svg {
  stroke: var(--gold-primary);
}

.media-badge {
  position: absolute;
  bottom: var(--space-sm);
  right: var(--space-sm);
  padding: var(--space-xs) var(--space-sm);
  background: rgba(0, 0, 0, 0.7);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  display: flex;
  align-items: center;
  justify-content: center;
}

.media-badge svg {
  stroke: var(--gold-primary);
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

.time-icon {
  display: flex;
  align-items: center;
}

.time-icon svg {
  stroke: var(--gold-primary);
}

.status-badges {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}

.platform-badge-new {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-secondary);
}

.platform-icon {
  display: flex;
  align-items: center;
}

.platform-icon svg {
  stroke: currentColor;
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
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
}

.status-icon {
  stroke: currentColor;
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
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.restaurant-badge svg {
  stroke: var(--gold-primary);
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
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--gold-primary);
}

.countdown-icon {
  stroke: var(--gold-primary);
}

.action-buttons {
  display: flex;
  gap: var(--space-sm);
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-sm);
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-base);
  font-size: var(--text-sm);
}

.action-btn svg {
  stroke: var(--gold-primary);
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

.delete-btn:hover svg {
  stroke: #ff3b30;
}

.view-post-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: var(--space-xs) var(--space-sm);
  background: rgba(52, 199, 89, 0.2);
  border-radius: var(--radius-sm);
  color: #34c759;
  text-decoration: none;
  font-size: var(--text-xs);
  transition: all var(--transition-base);
}

.view-post-btn svg {
  stroke: #34c759;
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

.error-icon {
  display: flex;
  align-items: center;
}

.error-icon svg {
  stroke: #ff3b30;
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

  .action-btn {
    min-width: var(--touch-target-min);
    min-height: var(--touch-target-min);
    padding: var(--space-md);
  }
}

@media (max-width: 480px) {
  .media-section {
    height: 160px;
  }

  .info-section {
    padding: var(--space-md);
  }

  .post-title {
    font-size: var(--text-sm);
  }

  .post-caption {
    font-size: var(--text-xs);
  }

  .time-row {
    flex-wrap: wrap;
    gap: var(--space-xs);
  }

  .platform-badges {
    flex-wrap: wrap;
  }

  .platform-badge {
    font-size: 10px;
    padding: 2px 6px;
  }

  .action-buttons {
    gap: var(--space-xs);
  }
}

@media (max-width: 390px) {
  .media-section {
    height: 140px;
  }

  .info-section {
    padding: var(--space-sm);
  }

  .scheduled-post-card {
    border-radius: var(--radius-md);
  }
}
</style>

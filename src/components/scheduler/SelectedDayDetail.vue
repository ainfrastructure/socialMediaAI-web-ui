<template>
  <BaseCard v-if="day && (day.posts.length > 0 || day.holidays?.length > 0)" variant="glass-intense" class="day-detail-card">
    <div class="detail-header">
      <h3 class="detail-title">
        📅 {{ formatShortDate(day) }}
        <span v-if="day.posts.length > 0" class="post-count">
          ({{ day.posts.length }} {{ day.posts.length === 1 ? $t('scheduler.post') : $t('scheduler.posts') }})
        </span>
      </h3>
      <BaseButton variant="primary" size="medium" @click="$emit('create', day)">
        ➕ {{ $t('scheduler.createPost', 'Create Post') }}
      </BaseButton>
    </div>

    <!-- Holidays Section -->
    <div v-if="day.holidays && day.holidays.length > 0" class="holidays-section">
      <h4 class="section-subtitle">{{ $t('scheduler.holidays') }}</h4>
      <div class="holidays-list">
        <div v-for="holiday in day.holidays" :key="holiday.name" class="holiday-card">
          <div class="holiday-icon">{{ getHolidayEmoji(holiday) }}</div>
          <div class="holiday-details">
            <h5 class="holiday-name">{{ holiday.name }}</h5>
            <p v-if="holiday.description" class="holiday-description">{{ holiday.description }}</p>
            <div class="holiday-meta">
              <span v-if="holiday.religion" class="holiday-religion">{{ holiday.religion }}</span>
              <span v-if="holiday.type && holiday.type.length > 0" class="holiday-type">{{ holiday.type.join(', ') }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Posts List -->
    <div class="posts-list">
      <div
        v-for="post in paginatedPosts"
        :key="post.id"
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
              @error="handleImageError"
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
                  <span class="countdown">{{ getTimeRemaining(post) }}</span>
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
                  🔗 View on {{ capitalizeFirst(platform) }}
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
    </div>

    <!-- Pagination Controls -->
    <div v-if="totalPages > 1" class="detail-pagination">
      <button
        class="pagination-btn"
        :disabled="currentPage === 1"
        @click="currentPage--"
      >
        ← Previous
      </button>
      <span class="pagination-info">
        Page {{ currentPage }} of {{ totalPages }}
      </span>
      <button
        class="pagination-btn"
        :disabled="currentPage === totalPages"
        @click="currentPage++"
      >
        Next →
      </button>
    </div>
  </BaseCard>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'
import BaseCard from '../BaseCard.vue'
import BaseButton from '../BaseButton.vue'

interface CalendarDay {
  day: number
  date: Date
  isOtherMonth: boolean
  isToday: boolean
  posts: any[]
  holidays?: any[]
}

const props = defineProps<{
  day: CalendarDay | null
  postsPerPage?: number
}>()

defineEmits<{
  (e: 'view', post: any): void
  (e: 'edit', post: any): void
  (e: 'delete', postId: string): void
  (e: 'create', day: CalendarDay): void
}>()

const postsPerPage = props.postsPerPage || 3
const currentPage = ref(1)

// Reset pagination when day changes
watch(() => props.day, () => {
  currentPage.value = 1
})

const totalPages = computed(() => {
  if (!props.day) return 1
  return Math.ceil(props.day.posts.length / postsPerPage)
})

const paginatedPosts = computed(() => {
  if (!props.day) return []
  const start = (currentPage.value - 1) * postsPerPage
  const end = start + postsPerPage
  return props.day.posts.slice(start, end)
})

const formatShortDate = (day: CalendarDay) => {
  return day.date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

const formatTime = (time: string | null) => {
  if (!time) return null
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${minutes} ${ampm}`
}

const formatPublishedDate = (dateString: string) => {
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

const getPlatformIcon = (platform: string) => {
  const icons: Record<string, string> = {
    facebook: '👥',
    instagram: '📷',
    tiktok: '🎵',
    twitter: '🐦',
    linkedin: '💼'
  }
  return icons[platform.toLowerCase()] || '📱'
}

const capitalizeFirst = (str: string) => {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

const getTimeRemaining = (post: any) => {
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
}

const getHolidayEmoji = (holiday: any) => {
  const name = holiday.name.toLowerCase()

  if (name.includes('christmas')) return '🎄'
  if (name.includes('easter')) return '🐰'
  if (name.includes('new year')) return '🎆'
  if (name.includes('independence') || name.includes('constitution')) return '🇳🇴'
  if (name.includes('labor') || name.includes('labour') || name.includes('workers')) return '👷'

  if (holiday.religion) {
    const religion = holiday.religion.toLowerCase()
    if (religion === 'christian') return '✝️'
    if (religion === 'muslim') return '☪️'
    if (religion === 'jewish') return '✡️'
    if (religion === 'hindu') return '🕉️'
    if (religion === 'buddhist') return '☸️'
  }

  if (holiday.type && holiday.type.includes('national')) return '🎌'
  if (holiday.type && holiday.type.includes('religious')) return '🙏'

  return '🎉'
}

const getMediaUrl = (url: string): string => {
  if (!url) return ''
  if (url.includes('localhost:3000')) {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    return url.replace('http://localhost:3000', apiUrl)
  }
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`
}

const handleImageError = () => {
  // Keep the placeholder visible
}
</script>

<style scoped>
.day-detail-card {
  margin-top: var(--space-lg);
  animation: fadeInUp 0.3s ease;
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

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-lg);
  border-bottom: 1px solid rgba(212, 175, 55, 0.2);
  margin-bottom: var(--space-lg);
}

.detail-title {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  color: var(--text-primary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.post-count {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  font-weight: var(--font-normal);
}

/* Holidays Section */
.holidays-section {
  padding: 0 var(--space-lg);
  margin-bottom: var(--space-lg);
}

.section-subtitle {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  color: var(--text-primary);
  margin: 0 0 var(--space-md) 0;
}

.holidays-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.holiday-card {
  display: flex;
  gap: var(--space-md);
  padding: var(--space-md);
  background: rgba(100, 150, 255, 0.1);
  border: 1px solid rgba(100, 150, 255, 0.3);
  border-radius: var(--radius-md);
}

.holiday-icon {
  font-size: var(--text-2xl);
}

.holiday-details {
  flex: 1;
}

.holiday-name {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--space-xs) 0;
}

.holiday-description {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: 0 0 var(--space-xs) 0;
}

.holiday-meta {
  display: flex;
  gap: var(--space-sm);
  font-size: var(--text-xs);
  color: var(--text-muted);
}

/* Posts List */
.posts-list {
  padding: 0 var(--space-lg) var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.scheduled-post-card-new {
  display: flex;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: var(--radius-lg);
  overflow: hidden;
  cursor: pointer;
  transition: all var(--transition-base);
}

.scheduled-post-card-new:hover {
  border-color: rgba(212, 175, 55, 0.4);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.status-bar {
  width: 4px;
  flex-shrink: 0;
}

.status-bar.status-scheduled {
  background: var(--gold-primary);
}

.status-bar.status-published {
  background: #4ade80;
}

.status-bar.status-failed {
  background: #f87171;
}

.card-content {
  display: flex;
  flex: 1;
  padding: var(--space-md);
  gap: var(--space-md);
}

.media-section {
  position: relative;
  width: 100px;
  height: 100px;
  flex-shrink: 0;
}

.post-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: var(--radius-md);
}

.post-image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
  border-radius: var(--radius-md);
}

.placeholder-icon {
  font-size: var(--text-2xl);
  opacity: 0.5;
}

.media-badge {
  position: absolute;
  bottom: var(--space-xs);
  right: var(--space-xs);
  background: rgba(0, 0, 0, 0.7);
  padding: 2px 6px;
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
  gap: var(--space-sm);
  flex-wrap: wrap;
}

.time-badge {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--text-sm);
  color: var(--gold-primary);
}

.status-badges {
  display: flex;
  gap: var(--space-xs);
  flex-wrap: wrap;
}

.platform-badge-new,
.status-badge-new {
  font-size: var(--text-xs);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.1);
}

.platform-badge-new.platform-facebook {
  background: rgba(24, 119, 242, 0.2);
  color: #4599ff;
}

.platform-badge-new.platform-instagram {
  background: rgba(225, 48, 108, 0.2);
  color: #e1306c;
}

.platform-badge-new.platform-tiktok {
  background: rgba(0, 0, 0, 0.3);
  color: #fff;
}

.status-badge-new.status-scheduled {
  background: rgba(212, 175, 55, 0.2);
  color: var(--gold-primary);
}

.status-badge-new.status-published {
  background: rgba(74, 222, 128, 0.2);
  color: #4ade80;
}

.status-badge-new.status-failed {
  background: rgba(248, 113, 113, 0.2);
  color: #f87171;
}

.post-content {
  flex: 1;
}

.post-description {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.4;
}

.post-description.empty {
  color: var(--text-muted);
  font-style: italic;
}

.restaurant-badge {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.content-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
}

.footer-info {
  font-size: var(--text-xs);
  color: var(--text-secondary);
}

.action-buttons {
  display: flex;
  gap: var(--space-xs);
}

.action-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-base);
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.edit-btn:hover {
  background: rgba(212, 175, 55, 0.3);
}

.delete-btn:hover {
  background: rgba(248, 113, 113, 0.3);
}

.view-post-btn {
  font-size: var(--text-xs);
  color: var(--gold-primary);
  text-decoration: none;
  padding: var(--space-xs) var(--space-sm);
  background: rgba(212, 175, 55, 0.1);
  border-radius: var(--radius-md);
  transition: all var(--transition-base);
}

.view-post-btn:hover {
  background: rgba(212, 175, 55, 0.2);
}

.error-banner {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm);
  background: rgba(248, 113, 113, 0.1);
  border-radius: var(--radius-md);
  margin-top: var(--space-sm);
}

.error-icon {
  font-size: var(--text-base);
}

.error-text {
  font-size: var(--text-xs);
  color: #f87171;
}

/* Pagination */
.detail-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-lg);
  padding: var(--space-lg);
  border-top: 1px solid rgba(212, 175, 55, 0.2);
}

.pagination-btn {
  padding: var(--space-sm) var(--space-lg);
  background: rgba(212, 175, 55, 0.15);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: var(--radius-md);
  color: var(--gold-primary);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  cursor: pointer;
  transition: all var(--transition-base);
}

.pagination-btn:hover:not(:disabled) {
  background: rgba(212, 175, 55, 0.25);
  border-color: var(--gold-primary);
}

.pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pagination-info {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .detail-header {
    flex-direction: column;
    gap: var(--space-md);
    text-align: center;
  }

  .card-content {
    flex-direction: column;
  }

  .media-section {
    width: 100%;
    height: 200px;
  }
}
</style>

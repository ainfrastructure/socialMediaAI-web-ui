<template>
  <BaseCard v-if="posts.length > 0" variant="glass" class="upcoming-posts-card">
    <div class="upcoming-header">
      <h3 class="upcoming-title">📅 {{ $t('scheduler.upcomingPosts', 'Upcoming Posts') }}</h3>
      <span class="upcoming-count">{{ posts.length }} {{ $t('scheduler.scheduled', 'scheduled') }}</span>
    </div>
    <div class="upcoming-list">
      <div
        v-for="post in posts"
        :key="post.id"
        class="upcoming-item"
        @click="$emit('view', post)"
      >
        <div class="upcoming-date-badge">
          <span class="upcoming-date">{{ formatUpcomingDate(post.scheduled_date) }}</span>
          <span class="upcoming-time">{{ formatTime(post.scheduled_time) || 'No time' }}</span>
        </div>
        <div class="upcoming-thumb">
          <img
            v-if="post.content_type === 'image' && post.media_url"
            :src="getMediaUrl(post.media_url)"
            :alt="post.post_text || 'Post'"
            @error="handleImageError($event)"
          />
          <div v-else class="upcoming-thumb-placeholder">
            {{ getContentTypeEmoji(post.content_type) }}
          </div>
        </div>
        <div class="upcoming-content">
          <p class="upcoming-text">{{ truncateText(post.post_text || 'No caption', 60) }}</p>
          <div class="upcoming-meta">
            <span v-if="post.platform" :class="['upcoming-platform', `platform-${post.platform}`]">
              {{ getPlatformIcon(post.platform) }} {{ post.platform }}
            </span>
            <span v-if="post.restaurant_name" class="upcoming-restaurant">🏪 {{ post.restaurant_name }}</span>
          </div>
        </div>
        <div class="upcoming-actions" @click.stop>
          <button class="upcoming-action-btn" @click="$emit('edit', post)" title="Edit">✏️</button>
          <button class="upcoming-action-btn delete" @click="$emit('delete', post.id)" title="Delete">🗑️</button>
        </div>
      </div>
    </div>
  </BaseCard>
</template>

<script setup lang="ts">
import BaseCard from '../BaseCard.vue'

interface Post {
  id: string
  scheduled_date: string
  scheduled_time?: string
  content_type: string
  media_url?: string
  post_text?: string
  platform?: string
  restaurant_name?: string
}

defineProps<{
  posts: Post[]
}>()

defineEmits<{
  (e: 'view', post: Post): void
  (e: 'edit', post: Post): void
  (e: 'delete', postId: string): void
}>()

const formatUpcomingDate = (dateString: string): string => {
  const date = new Date(dateString + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  if (date.getTime() === today.getTime()) {
    return 'Today'
  } else if (date.getTime() === tomorrow.getTime()) {
    return 'Tomorrow'
  } else {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }
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

const getMediaUrl = (url: string): string => {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  const apiUrl = import.meta.env.VITE_API_URL || ''
  return url.startsWith('/') ? `${apiUrl}${url}` : `${apiUrl}/${url}`
}

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
}

const getContentTypeEmoji = (type: string): string => {
  return type === 'video' ? '🎬' : '📷'
}

const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

const getPlatformIcon = (platform: string): string => {
  const icons: Record<string, string> = {
    facebook: '📘',
    instagram: '📸',
    tiktok: '🎵',
    twitter: '🐦',
    linkedin: '💼'
  }
  return icons[platform.toLowerCase()] || '📱'
}
</script>

<style scoped>
.upcoming-posts-card {
  margin-bottom: var(--space-xl);
}

.upcoming-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-lg);
  padding-bottom: var(--space-md);
  border-bottom: 1px solid rgba(212, 175, 55, 0.2);
}

.upcoming-title {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  color: var(--text-primary);
  margin: 0;
}

.upcoming-count {
  font-size: var(--text-sm);
  color: var(--gold-primary);
  font-weight: var(--font-semibold);
  background: rgba(212, 175, 55, 0.15);
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-full);
}

.upcoming-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.upcoming-item {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md);
  background: rgba(0, 0, 0, 0.2);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-base);
  border: 1px solid transparent;
}

.upcoming-item:hover {
  background: rgba(212, 175, 55, 0.1);
  border-color: rgba(212, 175, 55, 0.3);
}

.upcoming-date-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 70px;
  padding: var(--space-sm);
  background: rgba(212, 175, 55, 0.15);
  border-radius: var(--radius-md);
}

.upcoming-date {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--gold-primary);
}

.upcoming-time {
  font-size: var(--text-xs);
  color: var(--text-secondary);
}

.upcoming-thumb {
  width: 50px;
  height: 50px;
  border-radius: var(--radius-md);
  overflow: hidden;
  flex-shrink: 0;
  background: rgba(0, 0, 0, 0.3);
}

.upcoming-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upcoming-thumb-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-xl);
  background: rgba(212, 175, 55, 0.1);
}

.upcoming-content {
  flex: 1;
  min-width: 0;
}

.upcoming-text {
  font-size: var(--text-sm);
  color: var(--text-primary);
  margin: 0 0 var(--space-xs) 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.upcoming-meta {
  display: flex;
  gap: var(--space-md);
  font-size: var(--text-xs);
}

.upcoming-platform {
  color: var(--text-secondary);
  text-transform: capitalize;
}

.upcoming-restaurant {
  color: var(--text-muted);
}

.upcoming-actions {
  display: flex;
  gap: var(--space-xs);
}

.upcoming-action-btn {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-sm);
  padding: var(--space-xs) var(--space-sm);
  cursor: pointer;
  transition: all var(--transition-base);
  font-size: var(--text-sm);
}

.upcoming-action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}

.upcoming-action-btn.delete:hover {
  background: rgba(255, 59, 48, 0.2);
  border-color: rgba(255, 59, 48, 0.5);
}

@media (max-width: 768px) {
  .upcoming-item {
    flex-wrap: wrap;
  }

  .upcoming-date-badge {
    min-width: auto;
    flex-direction: row;
    gap: var(--space-sm);
  }

  .upcoming-content {
    width: 100%;
    order: 3;
  }

  .upcoming-actions {
    margin-left: auto;
  }
}
</style>

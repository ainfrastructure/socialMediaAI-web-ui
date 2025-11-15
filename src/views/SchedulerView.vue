<template>
  <div class="scheduler-view">
    <GradientBackground />

    <div class="container">
      <div class="header">
        <h1 class="title">Content Scheduler</h1>
        <p class="subtitle">Plan and schedule your social media posts</p>
      </div>

      <!-- Calendar Navigation -->
      <BaseCard variant="glass-intense" class="calendar-nav-card">
        <div class="calendar-nav">
          <BaseButton variant="ghost" size="small" @click="previousPeriod">
            ← Previous
          </BaseButton>
          <h2 class="current-month">{{ currentPeriodLabel }}</h2>
          <BaseButton variant="ghost" size="small" @click="nextPeriod">
            Next →
          </BaseButton>
        </div>

        <!-- View Mode Selector -->
        <div class="view-mode-selector">
          <button
            :class="['view-mode-btn', { active: viewMode === 'month' }]"
            @click="viewMode = 'month'"
          >
            Month
          </button>
          <button
            :class="['view-mode-btn', { active: viewMode === 'week' }]"
            @click="viewMode = 'week'"
          >
            Week
          </button>
          <button
            :class="['view-mode-btn', { active: viewMode === 'day' }]"
            @click="viewMode = 'day'"
          >
            Day
          </button>
        </div>
      </BaseCard>

      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <div class="spinner"></div>
        <p>Loading schedule...</p>
      </div>

      <!-- Calendar Grid -->
      <BaseCard v-else variant="glass" class="calendar-card">
        <div :class="['calendar-grid', `view-${viewMode}`]">
          <!-- Day headers (only show for month and week views) -->
          <div
            v-if="viewMode !== 'day'"
            v-for="day in displayedWeekDays"
            :key="day"
            class="calendar-day-header"
          >
            {{ day }}
          </div>

          <!-- Calendar days -->
          <div
            v-for="(day, index) in displayedCalendarDays"
            :key="index"
            :class="[
              'calendar-day',
              {
                'other-month': day.isOtherMonth && viewMode === 'month',
                'today': day.isToday,
                'has-posts': day.posts.length > 0,
                'day-view': viewMode === 'day',
              },
            ]"
            @click="selectDay(day)"
          >
            <div class="day-number">{{ viewMode === 'day' ? '' : day.day }}</div>

            <!-- Day View Header -->
            <div v-if="viewMode === 'day'" class="day-view-header">
              <h2 class="day-view-title">{{ formatSelectedDate(day) }}</h2>
              <div class="day-view-actions">
                <button
                  class="action-button create-btn"
                  @click.stop="createNewPost(day)"
                >
                  <span class="btn-icon">+</span>
                  <span class="btn-text">Create Post</span>
                </button>
                <button
                  class="action-button favorite-btn"
                  @click.stop="pickFavoriteForDate(day)"
                >
                  <span class="btn-icon">⭐</span>
                  <span class="btn-text">Add Favorite</span>
                </button>
              </div>
            </div>

            <!-- Quick Action Buttons (Month/Week View) -->
            <div v-if="!day.isOtherMonth && viewMode !== 'day'" class="day-actions">
              <button
                class="action-btn new-post-btn"
                @click.stop="createNewPost(day)"
                title="Create new post for this date"
              >
                📝
              </button>
              <button
                class="action-btn pick-favorite-btn"
                @click.stop="pickFavoriteForDate(day)"
                title="Schedule a favorite for this date"
              >
                ⭐
              </button>
            </div>

            <!-- Holidays -->
            <div v-if="day.holidays && day.holidays.length > 0" class="day-holidays">
              <!-- Day View: Show all holidays with details -->
              <div v-if="viewMode === 'day'" class="day-view-holidays">
                <div
                  v-for="holiday in day.holidays"
                  :key="holiday.name"
                  class="day-holiday-card"
                >
                  <div class="holiday-card-icon">{{ getHolidayEmoji(holiday) }}</div>
                  <div class="holiday-card-info">
                    <h4 class="holiday-card-name">{{ holiday.name }}</h4>
                    <p v-if="holiday.description" class="holiday-card-desc">{{ holiday.description }}</p>
                  </div>
                </div>
              </div>

              <!-- Month/Week View: Show compact indicators -->
              <template v-else>
                <div
                  v-for="holiday in day.holidays.slice(0, 2)"
                  :key="holiday.name"
                  class="holiday-indicator"
                  :title="`${holiday.name}${holiday.religion ? ' (' + holiday.religion + ')' : ''}`"
                >
                  {{ getHolidayEmoji(holiday) }} {{ holiday.name.length > 20 ? holiday.name.substring(0, 20) + '...' : holiday.name }}
                </div>
                <span v-if="day.holidays.length > 2" class="more-holidays">
                  +{{ day.holidays.length - 2 }} more
                </span>
              </template>
            </div>

            <div v-if="day.posts.length > 0" class="day-posts">
              <!-- Day View: Show detailed post cards -->
              <div v-if="viewMode === 'day'" class="day-view-posts">
                <div
                  v-for="post in day.posts"
                  :key="post.id"
                  class="day-post-card"
                  @click.stop="viewPostDetail(post)"
                >
                  <!-- Thumbnail Section -->
                  <div class="post-card-thumbnail">
                    <img
                      v-if="post.content_type === 'image' && post.media_url"
                      :src="getMediaUrl(post.media_url)"
                      :alt="post.post_text || 'Post'"
                      class="post-thumb-img"
                      @error="handleImageError($event, post)"
                    />
                    <video
                      v-else-if="post.content_type === 'video' && post.media_url"
                      :src="getMediaUrl(post.media_url)"
                      class="post-thumb-img"
                      muted
                    ></video>
                    <div v-else class="post-thumb-placeholder">
                      <span class="thumb-icon">📸</span>
                    </div>
                  </div>

                  <!-- Time Section -->
                  <div class="post-card-time">
                    <div class="time-large">{{ formatTime(post.scheduled_time) || 'No time' }}</div>
                    <div v-if="post.timezone" class="time-zone">{{ post.timezone }}</div>
                  </div>

                  <!-- Content Section -->
                  <div class="post-card-content">
                    <div class="post-card-header">
                      <span v-if="post.platform" :class="['post-card-platform', `platform-${post.platform}`]">
                        {{ post.platform }}
                      </span>
                      <span class="post-card-type">
                        {{ getContentTypeEmoji(post.content_type) }} {{ post.content_type }}
                      </span>
                      <span v-if="post.status" :class="['post-card-status', `status-${post.status}`]">
                        {{ post.status }}
                      </span>
                    </div>
                    <p v-if="post.post_text" class="post-card-text">
                      {{ truncateText(post.post_text, 150) }}
                    </p>
                    <div v-if="post.restaurant_name" class="post-card-restaurant">
                      🏪 {{ post.restaurant_name }}
                    </div>
                    <div class="post-card-footer">
                      <span class="post-card-timing">{{ getTimeRemaining(post) }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Month/Week View: Show compact indicators -->
              <template v-else>
                <div
                  v-for="post in day.posts.slice(0, 3)"
                  :key="post.id"
                  :class="['post-indicator', `platform-${post.platform}`]"
                  :title="`${formatTime(post.scheduled_time) || 'No time'} - ${post.post_text || 'Scheduled post'}`"
                >
                  {{ getContentTypeEmoji(post.content_type) }}
                  <span class="post-time-mini">{{ formatTime(post.scheduled_time) }}</span>
                </div>
                <span v-if="day.posts.length > 3" class="more-posts">
                  +{{ day.posts.length - 3 }}
                </span>
              </template>
            </div>
          </div>
        </div>
      </BaseCard>

      <!-- Selected Day Detail -->
      <BaseCard v-if="selectedDay && (selectedDay.posts.length > 0 || selectedDay.holidays?.length > 0)" variant="glass-intense" class="day-detail-card">
        <h3 class="detail-title">
          {{ formatSelectedDate(selectedDay) }}
          <span v-if="selectedDay.posts.length > 0" class="post-count">({{ selectedDay.posts.length }} post{{ selectedDay.posts.length > 1 ? 's' : '' }})</span>
        </h3>

        <!-- Show holidays if any -->
        <div v-if="selectedDay.holidays && selectedDay.holidays.length > 0" class="holidays-section">
          <h4 class="section-subtitle">Holidays</h4>
          <div class="holidays-list">
            <div
              v-for="holiday in selectedDay.holidays"
              :key="holiday.name"
              class="holiday-card"
            >
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

        <div class="posts-list">
          <div
            v-for="post in selectedDay.posts"
            :key="post.id"
            class="scheduled-post-card"
          >
            <div class="post-media" @click="viewPostDetail(post)">
              <img
                v-if="post.content_type === 'image' && post.media_url"
                :src="getMediaUrl(post.media_url)"
                :alt="post.post_text || 'Scheduled post'"
                class="post-thumbnail clickable"
                @error="handleImageError($event, post)"
                loading="lazy"
              />
              <video
                v-else-if="post.content_type === 'video' && post.media_url"
                :src="getMediaUrl(post.media_url)"
                class="post-thumbnail clickable"
                muted
                preload="metadata"
              ></video>
              <div v-else class="post-thumbnail-placeholder">
                <span class="placeholder-icon">📸</span>
                <span class="placeholder-text">{{ post.media_url ? 'Failed to load' : 'No media' }}</span>
              </div>
              <div v-if="post.media_url" class="thumbnail-overlay">
                <span class="view-icon">👁️ View Details</span>
              </div>
            </div>

            <div class="post-details">
              <div class="post-header">
                <div class="time-info">
                  <span class="post-time">
                    {{ formatTime(post.scheduled_time) || 'No time set' }}
                  </span>
                  <span v-if="post.timezone" class="post-timezone">
                    {{ post.timezone }}
                  </span>
                </div>
                <span v-if="post.platform" :class="['post-platform', `platform-${post.platform}`]">
                  {{ post.platform }}
                </span>
              </div>

              <!-- Time remaining indicator -->
              <div class="time-remaining">
                {{ getTimeRemaining(post) }}
              </div>

              <p v-if="post.post_text" class="post-text">
                {{ truncateText(post.post_text, 150) }}
              </p>

              <div v-if="post.restaurant_name" class="post-restaurant">
                🏪 {{ post.restaurant_name }}
              </div>

              <div class="post-meta">
                <span class="content-type-badge">
                  {{ post.content_type === 'image' ? '📸 Image' : '🎥 Video' }}
                </span>
                <span v-if="post.status" :class="['status-badge', `status-${post.status}`]">
                  {{ post.status }}
                </span>
              </div>

              <div class="post-actions">
                <BaseButton variant="ghost" size="small" @click="editScheduledPost(post)">
                  ✏️ Edit
                </BaseButton>
                <BaseButton variant="danger" size="small" @click="cancelPost(post.id)">
                  🗑️ Cancel
                </BaseButton>
              </div>
            </div>
          </div>
        </div>
      </BaseCard>

      <!-- Empty State -->
      <BaseCard v-else-if="selectedDay" variant="glass" class="empty-detail-card">
        <div class="empty-content">
          <h3>No posts scheduled for this day</h3>
          <p>Go to the Playground to create and schedule new posts!</p>
          <BaseButton variant="primary" @click="router.push('/playground')">
            Go to Playground
          </BaseButton>
        </div>
      </BaseCard>
    </div>

    <!-- Pick Favorite Modal -->
    <PickFavoriteModal
      v-model="showPickFavoriteModal"
      :selected-date="selectedDateForScheduling"
      @scheduled="handleFavoriteScheduled"
    />

    <!-- Post Detail Modal -->
    <div v-if="showPostDetailModal && selectedPostForDetail" class="modal-overlay" @click="closePostDetailModal">
      <div class="modal-content" @click.stop>
        <button class="modal-close" @click="closePostDetailModal">×</button>

        <div class="modal-body">
          <!-- Large Image/Video -->
          <div class="modal-media">
            <img
              v-if="selectedPostForDetail.content_type === 'image' && selectedPostForDetail.media_url"
              :src="getMediaUrl(selectedPostForDetail.media_url)"
              alt="Post content"
              class="modal-image"
            />
            <video
              v-else-if="selectedPostForDetail.content_type === 'video' && selectedPostForDetail.media_url"
              :src="getMediaUrl(selectedPostForDetail.media_url)"
              controls
              class="modal-video"
            ></video>
            <div v-else class="modal-no-media">
              <span class="placeholder-icon">📸</span>
              <span class="placeholder-text">No media available</span>
            </div>
          </div>

          <!-- Post Information -->
          <div class="modal-info">
            <h2 class="modal-title">Post Details</h2>

            <!-- Date & Time -->
            <div class="info-section">
              <div class="info-label">📅 Scheduled For</div>
              <div class="info-value">
                {{ formatSelectedDate({ date: new Date(selectedPostForDetail.scheduled_date) }) }}
              </div>
              <div class="info-value time-display">
                {{ formatTime(selectedPostForDetail.scheduled_time) || 'No time set' }}
                <span v-if="selectedPostForDetail.timezone" class="timezone-badge">
                  {{ selectedPostForDetail.timezone }}
                </span>
              </div>
              <div class="time-remaining-large">
                {{ getTimeRemaining(selectedPostForDetail) }}
              </div>
            </div>

            <!-- Platform & Status -->
            <div class="info-section">
              <div class="info-label">Platform & Status</div>
              <div class="badges-row">
                <span v-if="selectedPostForDetail.platform" :class="['platform-badge-large', `platform-${selectedPostForDetail.platform}`]">
                  {{ selectedPostForDetail.platform }}
                </span>
                <span :class="['content-type-badge-large']">
                  {{ selectedPostForDetail.content_type === 'image' ? '📸 Image' : '🎥 Video' }}
                </span>
                <span v-if="selectedPostForDetail.status" :class="['status-badge-large', `status-${selectedPostForDetail.status}`]">
                  {{ selectedPostForDetail.status }}
                </span>
              </div>
            </div>

            <!-- Restaurant -->
            <div v-if="selectedPostForDetail.restaurant_name" class="info-section">
              <div class="info-label">🏪 Restaurant</div>
              <div class="info-value">{{ selectedPostForDetail.restaurant_name }}</div>
            </div>

            <!-- Post Text -->
            <div v-if="selectedPostForDetail.post_text" class="info-section">
              <div class="info-label">📝 Caption</div>
              <div class="info-value post-caption">{{ selectedPostForDetail.post_text }}</div>
            </div>

            <!-- Actions -->
            <div class="modal-actions">
              <BaseButton variant="ghost" size="medium" @click="editScheduledPost(selectedPostForDetail)">
                ✏️ Edit
              </BaseButton>
              <BaseButton variant="danger" size="medium" @click="cancelPost(selectedPostForDetail.id); closePostDetailModal()">
                🗑️ Cancel Post
              </BaseButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import GradientBackground from '../components/GradientBackground.vue'
import BaseCard from '../components/BaseCard.vue'
import BaseButton from '../components/BaseButton.vue'
import PickFavoriteModal from '../components/PickFavoriteModal.vue'
import { api } from '../services/api'

const router = useRouter()

// Calendar state
const currentDate = ref(new Date())
const selectedDay = ref<any>(null)
const scheduledPosts = ref<any[]>([])
const holidays = ref<any[]>([])
const loading = ref(false)
const showPickFavoriteModal = ref(false)
const selectedDateForScheduling = ref<string | null>(null)
const selectedCountry = ref('NO') // Norway as default
const showPostDetailModal = ref(false)
const selectedPostForDetail = ref<any>(null)
const viewMode = ref<'month' | 'week' | 'day'>('month')

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const currentPeriodLabel = computed(() => {
  if (viewMode.value === 'day') {
    return currentDate.value.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  } else if (viewMode.value === 'week') {
    const weekStart = getWeekStart(currentDate.value)
    const weekEnd = getWeekEnd(currentDate.value)
    return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
  }
  return currentMonthYear.value
})

const displayedWeekDays = computed(() => {
  if (viewMode.value === 'week') {
    return weekDays
  }
  return weekDays
})

const displayedCalendarDays = computed(() => {
  if (viewMode.value === 'day') {
    // Return only the current day
    const year = currentDate.value.getFullYear()
    const month = currentDate.value.getMonth()
    const day = currentDate.value.getDate()
    const date = new Date(year, month, day)
    const dateString = date.toISOString().split('T')[0]
    const postsForDay = scheduledPosts.value.filter(
      (post) => post.scheduled_date === dateString
    )
    const holidaysForDay = holidays.value.filter(
      (holiday) => holiday.date === dateString
    )

    return [{
      day,
      date,
      isOtherMonth: false,
      isToday: isToday(date),
      posts: postsForDay,
      holidays: holidaysForDay,
    }]
  } else if (viewMode.value === 'week') {
    // Return only days in the current week
    return calendarDays.value.filter((day) => {
      const weekStart = getWeekStart(currentDate.value)
      const weekEnd = getWeekEnd(currentDate.value)
      return day.date >= weekStart && day.date <= weekEnd && !day.isOtherMonth
    })
  }
  // Month view - return all days
  return calendarDays.value
})

const getWeekStart = (date: Date) => {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day
  return new Date(d.setDate(diff))
}

const getWeekEnd = (date: Date) => {
  const weekStart = getWeekStart(date)
  return new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000)
}

const previousPeriod = () => {
  if (viewMode.value === 'day') {
    currentDate.value = new Date(
      currentDate.value.getFullYear(),
      currentDate.value.getMonth(),
      currentDate.value.getDate() - 1
    )
  } else if (viewMode.value === 'week') {
    currentDate.value = new Date(
      currentDate.value.getFullYear(),
      currentDate.value.getMonth(),
      currentDate.value.getDate() - 7
    )
  } else {
    currentDate.value = new Date(
      currentDate.value.getFullYear(),
      currentDate.value.getMonth() - 1
    )
  }
  fetchScheduledPosts()
  fetchHolidays()
}

const nextPeriod = () => {
  if (viewMode.value === 'day') {
    currentDate.value = new Date(
      currentDate.value.getFullYear(),
      currentDate.value.getMonth(),
      currentDate.value.getDate() + 1
    )
  } else if (viewMode.value === 'week') {
    currentDate.value = new Date(
      currentDate.value.getFullYear(),
      currentDate.value.getMonth(),
      currentDate.value.getDate() + 7
    )
  } else {
    currentDate.value = new Date(
      currentDate.value.getFullYear(),
      currentDate.value.getMonth() + 1
    )
  }
  fetchScheduledPosts()
  fetchHolidays()
}

const currentMonthYear = computed(() => {
  return currentDate.value.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
})

const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()

  // Get first day of month and last day of month
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  // Get days from previous month to fill the first week
  const startingDayOfWeek = firstDay.getDay()
  const prevMonthLastDay = new Date(year, month, 0)
  const prevMonthDays = prevMonthLastDay.getDate()

  const days = []

  // Previous month days
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const day = prevMonthDays - i
    days.push({
      day,
      date: new Date(year, month - 1, day),
      isOtherMonth: true,
      isToday: false,
      posts: [],
      holidays: [],
    })
  }

  // Current month days
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = new Date(year, month, day)
    const dateString = date.toISOString().split('T')[0]
    const postsForDay = scheduledPosts.value.filter(
      (post) => post.scheduled_date === dateString
    )
    const holidaysForDay = holidays.value.filter(
      (holiday) => holiday.date === dateString
    )

    days.push({
      day,
      date,
      isOtherMonth: false,
      isToday: isToday(date),
      posts: postsForDay,
      holidays: holidaysForDay,
    })
  }

  // Next month days to complete the grid
  const remainingDays = 42 - days.length // 6 weeks * 7 days
  for (let day = 1; day <= remainingDays; day++) {
    days.push({
      day,
      date: new Date(year, month + 1, day),
      isOtherMonth: true,
      isToday: false,
      posts: [],
      holidays: [],
    })
  }

  return days
})

const isToday = (date: Date) => {
  const today = new Date()
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}

const previousMonth = () => {
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() - 1
  )
  fetchScheduledPosts()
  fetchHolidays()
}

const nextMonth = () => {
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() + 1
  )
  fetchScheduledPosts()
  fetchHolidays()
}

const selectDay = (day: any) => {
  if (!day.isOtherMonth) {
    selectedDay.value = day
  }
}

const formatSelectedDate = (day: any) => {
  return day.date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

const getContentTypeEmoji = (type: string) => {
  return type === 'image' ? '📸' : '🎥'
}

const getHolidayEmoji = (holiday: any) => {
  // Check for specific holiday names first
  const name = holiday.name.toLowerCase()

  // Christmas and related
  if (name.includes('christmas')) return '🎄'
  if (name.includes('easter')) return '🐰'
  if (name.includes('new year')) return '🎆'

  // National holidays
  if (name.includes('independence') || name.includes('constitution')) return '🇳🇴'
  if (name.includes('labor') || name.includes('labour') || name.includes('workers')) return '👷'

  // Religious holidays by religion
  if (holiday.religion) {
    const religion = holiday.religion.toLowerCase()
    if (religion === 'christian') return '✝️'
    if (religion === 'muslim') return '☪️'
    if (religion === 'jewish') return '✡️'
    if (religion === 'hindu') return '🕉️'
    if (religion === 'buddhist') return '☸️'
  }

  // Holiday types
  if (holiday.type && holiday.type.includes('national')) return '🎌'
  if (holiday.type && holiday.type.includes('religious')) return '🙏'

  // Default
  return '🎉'
}

const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

const formatTime = (time: string | null) => {
  if (!time) return null
  // Convert 24-hour time to 12-hour format
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${minutes} ${ampm}`
}

const getTimeRemaining = (post: any) => {
  if (!post.scheduled_date || !post.scheduled_time) {
    return '⏱️ No time specified'
  }

  try {
    // Combine date and time
    const scheduledDateTime = new Date(`${post.scheduled_date}T${post.scheduled_time}`)
    const now = new Date()
    const diff = scheduledDateTime.getTime() - now.getTime()

    // If in the past
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

    // Future - calculate time remaining
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
  } catch (error) {
    return '⏱️ Invalid time'
  }
}

const detectContentTypeFromUrl = (mediaUrl: string): string => {
  if (!mediaUrl) return 'image'

  const url = mediaUrl.toLowerCase()
  const videoExtensions = ['.mp4', '.mov', '.avi', '.webm', '.mkv', '.flv', '.wmv']
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg']

  // Check for video extensions
  if (videoExtensions.some(ext => url.includes(ext))) {
    return 'video'
  }

  // Check for image extensions
  if (imageExtensions.some(ext => url.includes(ext))) {
    return 'image'
  }

  // Default to image if can't determine
  return 'image'
}

const fetchScheduledPosts = async () => {
  try {
    loading.value = true
    const month = currentDate.value.getMonth() + 1
    const year = currentDate.value.getFullYear()

    const response = await api.getScheduledPosts({ month, year })

    if (response.success) {
      const posts = response.data?.scheduled_posts || []

      // Fix content_type based on media_url if it's incorrect
      scheduledPosts.value = posts.map((post: any) => {

        if (post.favorite_posts) {

        }

        // Try to find the media URL from various possible fields
        let mediaUrl = post.media_url || post.image_url || post.video_url || post.content_url
        let postText = post.post_text || post.caption
        let contentType = post.content_type
        let platform = post.platform
        let restaurantName = post.restaurant_name

        // Check if this is a scheduled favorite (has favorite_posts field)
        if (!mediaUrl && post.favorite_posts) {
          mediaUrl = post.favorite_posts.media_url || post.favorite_posts.image_url || post.favorite_posts.video_url
          postText = postText || post.favorite_posts.post_text || post.favorite_posts.caption
          contentType = contentType || post.favorite_posts.content_type
          platform = platform || post.favorite_posts.platform
          restaurantName = restaurantName || post.favorite_posts.restaurant_name
        }

        // Also check legacy field names
        if (!mediaUrl && post.favorite) {
          mediaUrl = post.favorite.media_url || post.favorite.image_url || post.favorite.video_url
          postText = postText || post.favorite.post_text || post.favorite.caption
          contentType = contentType || post.favorite.content_type
          platform = platform || post.favorite.platform
          restaurantName = restaurantName || post.favorite.restaurant_name
        }

        if (!mediaUrl && post.favorite_post) {
          mediaUrl = post.favorite_post.media_url || post.favorite_post.image_url || post.favorite_post.video_url
          postText = postText || post.favorite_post.post_text || post.favorite_post.caption
          contentType = contentType || post.favorite_post.content_type
          platform = platform || post.favorite_post.platform
          restaurantName = restaurantName || post.favorite_post.restaurant_name
        }

        // If content_type is still missing, detect from URL
        const detectedType = contentType || detectContentTypeFromUrl(mediaUrl || '')

        return {
          ...post,
          media_url: mediaUrl,
          post_text: postText,
          content_type: detectedType,
          platform: platform,
          restaurant_name: restaurantName
        }
      })
    }
  } catch (error) {

  } finally {
    loading.value = false
  }
}

const fetchHolidays = async () => {
  try {
    const month = currentDate.value.getMonth() + 1
    const year = currentDate.value.getFullYear()

    const response = await api.getHolidaysForMonth(selectedCountry.value, year, month)

    if (response.success) {
      holidays.value = response.data?.holidays || []
    }
  } catch (error) {

    // Don't block the UI if holidays fail to load
    holidays.value = []
  }
}

const editScheduledPost = (post: any) => {
  // TODO: Open edit modal

}

const cancelPost = async (postId: string) => {
  if (!confirm('Are you sure you want to cancel this scheduled post?')) {
    return
  }

  try {
    const response = await api.cancelScheduledPost(postId)

    if (response.success) {
      await fetchScheduledPosts()
      selectedDay.value = null
    }
  } catch (error) {

  }
}

const createNewPost = (day: any) => {
  const dateString = day.date.toISOString().split('T')[0]
  router.push(`/playground?scheduleDate=${dateString}`)
}

const pickFavoriteForDate = (day: any) => {
  const dateString = day.date.toISOString().split('T')[0]
  selectedDateForScheduling.value = dateString
  showPickFavoriteModal.value = true
}

const handleFavoriteScheduled = async () => {
  await fetchScheduledPosts()
  showPickFavoriteModal.value = false
  selectedDateForScheduling.value = null
}

const viewPostDetail = (post: any) => {
  selectedPostForDetail.value = post
  showPostDetailModal.value = true
}

const closePostDetailModal = () => {
  showPostDetailModal.value = false
  selectedPostForDetail.value = null
}

const getMediaUrl = (url: string): string => {
  if (!url) return ''

  // If it's already a full URL, return it
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }

  // If it's a relative path, construct the full URL
  // Assuming your backend is running on the same domain or you have an API_BASE_URL
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`
}

const handleImageError = (event: Event, post: any) => {
  const img = event.target as HTMLImageElement

  // Keep the placeholder visible instead of hiding
}

onMounted(async () => {
  await Promise.all([fetchScheduledPosts(), fetchHolidays()])

  // Auto-select today's date
  const today = new Date()
  const todayDay = calendarDays.value.find(day =>
    !day.isOtherMonth && day.isToday
  )

  if (todayDay) {
    selectedDay.value = todayDay

    // Scroll to the selected day detail card after a short delay
    setTimeout(() => {
      const detailCard = document.querySelector('.day-detail-card')
      if (detailCard) {
        detailCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    }, 100)
  }
})
</script>

<style scoped>
.scheduler-view {
  min-height: 100vh;
  position: relative;
  padding: 2rem 1rem;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.header {
  text-align: center;
  margin-bottom: 3rem;
}

.title {
  font-family: var(--font-heading);
  font-size: 3rem;
  font-weight: 700;
  margin: 0 0 1rem 0;
  background: linear-gradient(135deg, var(--text-primary) 0%, var(--gold-primary) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  font-size: 1.125rem;
  color: var(--text-secondary);
  margin: 0;
}

.calendar-nav-card {
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.calendar-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-lg);
}

.view-mode-selector {
  display: flex;
  gap: var(--space-xs);
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  padding: var(--space-xs);
  border-radius: var(--radius-full);
  border: 1px solid rgba(212, 175, 55, 0.2);
}

.view-mode-btn {
  padding: var(--space-sm) var(--space-xl);
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  cursor: pointer;
  transition: var(--transition-base);
  border-radius: var(--radius-full);
  letter-spacing: 0.02em;
}

.view-mode-btn:hover {
  color: var(--gold-light);
  background: rgba(212, 175, 55, 0.1);
}

.view-mode-btn.active {
  background: var(--gradient-gold);
  color: var(--text-on-gold);
  box-shadow: 0 2px 8px rgba(212, 175, 55, 0.3);
}

.current-month {
  font-family: var(--font-heading);
  font-size: 1.5rem;
  color: var(--gold-primary);
  margin: 0;
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

.calendar-card {
  padding: 2rem;
  margin-bottom: 2rem;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background: rgba(212, 175, 55, 0.1);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.calendar-grid.view-week {
  grid-template-columns: repeat(7, 1fr);
}

.calendar-grid.view-day {
  grid-template-columns: 1fr;
  gap: 0;
}

.calendar-day.day-view {
  min-height: auto;
  max-width: 100%;
  padding: 0;
  background: transparent;
  border: none;
  cursor: default;
}

.calendar-day.day-view:hover {
  transform: none;
  background: transparent;
}

.calendar-grid.view-day .calendar-day {
  background: transparent;
  border: none;
}

.day-view-header {
  padding: var(--space-2xl);
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 2px solid rgba(212, 175, 55, 0.2);
  margin-bottom: var(--space-xl);
}

.day-view-title {
  font-family: var(--font-heading);
  font-size: var(--text-3xl);
  color: var(--text-primary);
  margin: 0 0 var(--space-xl) 0;
  text-align: center;
}

.day-view-actions {
  display: flex;
  gap: var(--space-lg);
  justify-content: center;
}

.action-button {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-2xl);
  border-radius: var(--radius-md);
  border: 1px solid;
  font-family: var(--font-body);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  cursor: pointer;
  transition: var(--transition-base);
  letter-spacing: 0.02em;
}

.create-btn {
  background: rgba(212, 175, 55, 0.1);
  border-color: rgba(212, 175, 55, 0.4);
  color: var(--gold-primary);
}

.create-btn:hover {
  background: var(--gradient-gold);
  border-color: transparent;
  color: var(--text-on-gold);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
}

.favorite-btn {
  background: rgba(100, 150, 255, 0.1);
  border-color: rgba(100, 150, 255, 0.4);
  color: rgba(150, 180, 255, 1);
}

.favorite-btn:hover {
  background: rgba(100, 150, 255, 0.2);
  border-color: rgba(100, 150, 255, 0.6);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(100, 150, 255, 0.3);
}

.btn-icon {
  font-size: var(--text-xl);
  line-height: 1;
}

.btn-text {
  line-height: 1;
}

.day-view-posts {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  padding: var(--space-xl);
}

.day-post-card {
  display: grid;
  grid-template-columns: 140px 100px 1fr;
  gap: var(--space-lg);
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  cursor: pointer;
  transition: var(--transition-base);
}

.day-post-card:hover {
  background: rgba(0, 0, 0, 0.4);
  border-color: rgba(212, 175, 55, 0.5);
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(212, 175, 55, 0.2);
}

.post-card-thumbnail {
  width: 140px;
  height: 140px;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(212, 175, 55, 0.2);
}

.post-thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.post-thumb-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
}

.thumb-icon {
  font-size: 3rem;
  opacity: 0.3;
}

.post-card-time {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
}

.time-large {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--gold-primary);
  text-align: center;
  line-height: 1.2;
}

.time-zone {
  font-size: var(--text-xs);
  color: var(--text-muted);
  text-transform: uppercase;
}

.post-card-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  min-width: 0;
}

.post-card-header {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  flex-wrap: wrap;
}

.post-card-platform {
  padding: 0.375rem 0.875rem;
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.post-card-platform.platform-instagram {
  background: rgba(225, 48, 108, 0.2);
  color: #E1306C;
  border: 1px solid rgba(225, 48, 108, 0.4);
}

.post-card-platform.platform-facebook {
  background: rgba(66, 103, 178, 0.2);
  color: #4267B2;
  border: 1px solid rgba(66, 103, 178, 0.4);
}

.post-card-platform.platform-tiktok {
  background: rgba(105, 105, 105, 0.2);
  color: #696969;
  border: 1px solid rgba(105, 105, 105, 0.4);
}

.post-card-type {
  padding: 0.375rem 0.875rem;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
  color: var(--text-secondary);
  font-weight: 600;
  text-transform: capitalize;
}

.post-card-status {
  padding: 0.375rem 0.875rem;
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.post-card-status.status-scheduled {
  background: rgba(59, 130, 246, 0.2);
  color: #3B82F6;
  border: 1px solid rgba(59, 130, 246, 0.4);
}

.post-card-status.status-posted {
  background: rgba(34, 197, 94, 0.2);
  color: #22C55E;
  border: 1px solid rgba(34, 197, 94, 0.4);
}

.post-card-text {
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
  font-size: var(--text-base);
}

.post-card-restaurant {
  font-size: var(--text-sm);
  color: var(--text-muted);
  font-weight: 500;
}

.post-card-footer {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding-top: var(--space-sm);
  border-top: 1px solid rgba(212, 175, 55, 0.1);
}

.post-card-timing {
  font-size: var(--text-sm);
  color: var(--gold-light);
  font-weight: 600;
}

.post-time-mini {
  font-size: 0.65rem;
  margin-left: 0.25rem;
  opacity: 0.8;
}

.day-view-holidays {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  padding: var(--space-xl);
  background: rgba(100, 150, 255, 0.05);
  border-top: 2px solid rgba(100, 150, 255, 0.3);
  border-bottom: 2px solid rgba(100, 150, 255, 0.3);
  margin-bottom: var(--space-xl);
}

.day-holiday-card {
  display: flex;
  gap: var(--space-lg);
  align-items: flex-start;
  background: rgba(100, 150, 255, 0.1);
  border: 1px solid rgba(100, 150, 255, 0.3);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
}

.holiday-card-icon {
  font-size: var(--text-3xl);
  line-height: 1;
}

.holiday-card-info {
  flex: 1;
}

.holiday-card-name {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  color: var(--text-primary);
  margin: 0 0 var(--space-sm) 0;
}

.holiday-card-desc {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: 1.5;
  margin: 0;
}

.calendar-day-header {
  background: rgba(0, 0, 0, 0.4);
  padding: 1rem;
  text-align: center;
  font-weight: 600;
  color: var(--gold-primary);
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.calendar-day {
  background: rgba(0, 0, 0, 0.3);
  min-height: 120px;
  padding: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  display: flex;
  flex-direction: column;
}

.calendar-day:hover {
  background: rgba(212, 175, 55, 0.1);
  transform: translateY(-2px);
}

.calendar-day:hover .day-actions {
  opacity: 1;
  pointer-events: all;
}

.calendar-day.other-month {
  opacity: 0.3;
}

.calendar-day.today {
  background: rgba(212, 175, 55, 0.15);
  border: 2px solid var(--gold-primary);
}

.calendar-day.has-posts {
  background: rgba(212, 175, 55, 0.08);
}

.day-number {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.day-actions {
  display: flex;
  gap: 0.25rem;
  margin-bottom: 0.5rem;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
}

.action-btn {
  flex: 1;
  padding: 0.375rem;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(212, 175, 55, 0.3);
}

.new-post-btn {
  border-color: var(--gold-primary);
  background: rgba(212, 175, 55, 0.2);
}

.new-post-btn:hover {
  background: rgba(212, 175, 55, 0.3);
  border-color: var(--gold-light);
}

.pick-favorite-btn {
  border-color: rgba(212, 175, 55, 0.4);
}

.pick-favorite-btn:hover {
  background: rgba(212, 175, 55, 0.15);
  border-color: var(--gold-primary);
}

.day-holidays {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 0.5rem;
}

.holiday-indicator {
  padding: 0.25rem 0.5rem;
  background: rgba(100, 150, 255, 0.15);
  border-left: 3px solid rgba(100, 150, 255, 0.6);
  border-radius: 4px;
  font-size: 0.7rem;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
}

.more-holidays {
  font-size: 0.7rem;
  color: rgba(100, 150, 255, 0.8);
  font-weight: 600;
  font-style: italic;
  margin-top: 0.125rem;
}

.day-posts {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.post-indicator {
  padding: 0.25rem 0.5rem;
  background: rgba(212, 175, 55, 0.2);
  border-radius: 4px;
  font-size: 0.75rem;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.post-indicator.platform-instagram {
  background: rgba(225, 48, 108, 0.2);
  border-left: 3px solid #E1306C;
}

.post-indicator.platform-facebook {
  background: rgba(66, 103, 178, 0.2);
  border-left: 3px solid #4267B2;
}

.post-indicator.platform-tiktok {
  background: rgba(105, 105, 105, 0.2);
  border-left: 3px solid #696969;
}

.post-indicator.platform-twitter {
  background: rgba(29, 161, 242, 0.2);
  border-left: 3px solid #1DA1F2;
}

.more-posts {
  font-size: 0.75rem;
  color: var(--gold-primary);
  font-weight: 600;
}

.day-detail-card {
  padding: 2rem;
}

.detail-title {
  font-family: var(--font-heading);
  font-size: 1.5rem;
  color: var(--gold-primary);
  margin: 0 0 1.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.post-count {
  font-size: 1rem;
  color: var(--text-secondary);
  font-weight: normal;
}

.section-subtitle {
  font-family: var(--font-heading);
  font-size: 1.125rem;
  color: var(--gold-primary);
  margin: 0 0 1rem 0;
  padding-top: 0.5rem;
  border-top: 1px solid rgba(212, 175, 55, 0.2);
}

.holidays-section {
  margin-bottom: 2rem;
}

.holidays-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.holiday-card {
  display: flex;
  gap: 1rem;
  background: rgba(100, 150, 255, 0.08);
  border: 1px solid rgba(100, 150, 255, 0.2);
  border-radius: var(--radius-md);
  padding: 1rem;
  transition: all 0.2s ease;
}

.holiday-card:hover {
  background: rgba(100, 150, 255, 0.12);
  border-color: rgba(100, 150, 255, 0.4);
}

.holiday-icon {
  font-size: 2rem;
  line-height: 1;
}

.holiday-details {
  flex: 1;
}

.holiday-name {
  font-family: var(--font-heading);
  font-size: 1.125rem;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
}

.holiday-description {
  color: var(--text-secondary);
  font-size: 0.875rem;
  line-height: 1.5;
  margin: 0 0 0.5rem 0;
}

.holiday-meta {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.holiday-religion,
.holiday-type {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  text-transform: capitalize;
}

.holiday-religion {
  background: rgba(212, 175, 55, 0.15);
  color: var(--gold-primary);
  border: 1px solid rgba(212, 175, 55, 0.3);
}

.holiday-type {
  background: rgba(100, 150, 255, 0.15);
  color: rgba(150, 180, 255, 1);
  border: 1px solid rgba(100, 150, 255, 0.3);
}

.posts-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.scheduled-post-card {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 1.5rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  transition: all 0.2s ease;
}

.scheduled-post-card:hover {
  border-color: rgba(212, 175, 55, 0.5);
  background: rgba(0, 0, 0, 0.4);
}

.post-media {
  position: relative;
  cursor: pointer;
  overflow: hidden;
  border-radius: var(--radius-md);
}

.post-thumbnail {
  width: 100%;
  height: 250px;
  object-fit: cover;
  border-radius: var(--radius-md);
  transition: transform 0.3s ease;
  display: block;
}

.post-thumbnail-placeholder {
  width: 100%;
  height: 250px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
  border: 2px dashed rgba(212, 175, 55, 0.3);
  border-radius: var(--radius-md);
  gap: var(--space-md);
}

.placeholder-icon {
  font-size: 3rem;
  opacity: 0.5;
}

.placeholder-text {
  color: var(--text-secondary);
  font-size: var(--text-sm);
  opacity: 0.7;
}

.post-thumbnail.clickable:hover {
  transform: scale(1.05);
}

.thumbnail-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  border-radius: var(--radius-md);
}

.post-media:hover .thumbnail-overlay {
  opacity: 1;
}

.view-icon {
  color: var(--gold-primary);
  font-size: 0.875rem;
  font-weight: 600;
  text-align: center;
}

.post-details {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.time-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.post-time {
  font-size: 1.125rem;
  color: var(--gold-primary);
  font-weight: 700;
}

.post-timezone {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: 500;
}

.time-remaining {
  padding: 0.5rem 0.75rem;
  background: rgba(212, 175, 55, 0.1);
  border-left: 3px solid var(--gold-primary);
  border-radius: 4px;
  font-size: 0.875rem;
  color: var(--gold-light);
  font-weight: 600;
}

.post-platform {
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.post-platform.platform-instagram {
  background: rgba(225, 48, 108, 0.2);
  color: #E1306C;
}

.post-platform.platform-facebook {
  background: rgba(66, 103, 178, 0.2);
  color: #4267B2;
}

.post-text {
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
}

.post-restaurant {
  font-size: 0.875rem;
  color: var(--text-muted);
}

.post-meta {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.content-type-badge {
  padding: 0.25rem 0.75rem;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 6px;
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.status-scheduled {
  background: rgba(59, 130, 246, 0.2);
  color: #3B82F6;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.status-badge.status-posted {
  background: rgba(34, 197, 94, 0.2);
  color: #22C55E;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.status-badge.status-failed {
  background: rgba(239, 68, 68, 0.2);
  color: #EF4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.post-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.empty-detail-card {
  padding: 3rem 2rem;
}

.empty-content {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.empty-content h3 {
  font-family: var(--font-heading);
  font-size: 1.5rem;
  color: var(--text-primary);
  margin: 0;
}

.empty-content p {
  color: var(--text-secondary);
  margin: 0;
}

/* Responsive */
@media (max-width: 1024px) {
  .calendar-day {
    min-height: 100px;
  }

  .scheduled-post-card {
    grid-template-columns: 250px 1fr;
  }
}

@media (max-width: 768px) {
  .title {
    font-size: 2rem;
  }

  .calendar-grid {
    gap: 0;
  }

  .schedule-settings {
    grid-template-columns: 1fr;
  }

  .scheduled-post-card {
    grid-template-columns: 1fr;
  }

  .post-thumbnail {
    height: 200px;
  }

  .time-info {
    flex-direction: row;
    align-items: center;
    gap: 0.5rem;
  }

  .post-timezone::before {
    content: '(';
  }

  .post-timezone::after {
    content: ')';
  }

  .calendar-day {
    min-height: 80px;
    padding: 0.5rem;
  }

  .day-number {
    font-size: 1rem;
  }

  .calendar-day-header {
    padding: 0.75rem 0.5rem;
    font-size: 0.75rem;
  }

  .scheduled-post-card {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .post-thumbnail,
  .post-thumbnail-placeholder {
    height: 200px;
  }

  /* Day View Mobile */
  .day-view-header {
    padding: var(--space-lg);
  }

  .day-view-title {
    font-size: var(--text-2xl);
  }

  .day-view-actions {
    flex-direction: column;
    gap: var(--space-md);
  }

  .action-button {
    width: 100%;
    justify-content: center;
  }

  .day-view-posts,
  .day-view-holidays {
    padding: var(--space-lg);
  }

  .day-post-card {
    grid-template-columns: 1fr;
    gap: var(--space-md);
  }

  .post-card-thumbnail {
    width: 100%;
    height: 200px;
  }

  .post-card-time {
    flex-direction: row;
    justify-content: space-between;
    padding-bottom: var(--space-sm);
    border-bottom: 1px solid rgba(212, 175, 55, 0.2);
  }

  .time-large {
    font-size: var(--text-xl);
  }

  .view-mode-selector {
    flex-direction: row;
  }

  .view-mode-btn {
    flex: 1;
    padding: var(--space-sm) var(--space-md);
    font-size: 0.75rem;
  }
}

/* Post Detail Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--space-xl);
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

.modal-content {
  background: var(--bg-secondary);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: var(--radius-xl);
  max-width: 1200px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-close {
  position: absolute;
  top: var(--space-lg);
  right: var(--space-lg);
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(212, 175, 55, 0.3);
  color: var(--text-primary);
  font-size: 2rem;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 10;
  line-height: 1;
  padding: 0;
}

.modal-close:hover {
  background: var(--gold-primary);
  border-color: var(--gold-primary);
  color: var(--bg-primary);
  transform: rotate(90deg);
}

.modal-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3xl);
  padding: var(--space-3xl);
}

.modal-media {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.modal-image,
.modal-video {
  max-width: 100%;
  max-height: 70vh;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: var(--radius-lg);
}

.modal-no-media {
  width: 100%;
  height: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-lg);
  background: rgba(0, 0, 0, 0.4);
  border: 2px dashed rgba(212, 175, 55, 0.3);
  border-radius: var(--radius-lg);
}

.modal-no-media .placeholder-icon {
  font-size: 4rem;
  opacity: 0.5;
}

.modal-no-media .placeholder-text {
  color: var(--text-secondary);
  font-size: var(--text-lg);
  opacity: 0.7;
}

.modal-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

.modal-title {
  font-family: var(--font-heading);
  font-size: var(--text-3xl);
  color: var(--gold-primary);
  margin: 0;
  padding-bottom: var(--space-lg);
  border-bottom: 2px solid rgba(212, 175, 55, 0.2);
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.info-label {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.info-value {
  font-size: var(--text-lg);
  color: var(--text-primary);
  line-height: 1.6;
}

.time-display {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--gold-primary);
}

.timezone-badge {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text-secondary);
  background: rgba(0, 0, 0, 0.4);
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-md);
  border: 1px solid rgba(212, 175, 55, 0.2);
}

.time-remaining-large {
  padding: var(--space-md) var(--space-lg);
  background: rgba(212, 175, 55, 0.15);
  border-left: 4px solid var(--gold-primary);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  color: var(--gold-light);
  font-weight: 600;
  margin-top: var(--space-sm);
}

.badges-row {
  display: flex;
  gap: var(--space-md);
  flex-wrap: wrap;
}

.platform-badge-large {
  padding: var(--space-sm) var(--space-lg);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.platform-badge-large.platform-instagram {
  background: rgba(225, 48, 108, 0.2);
  color: #E1306C;
  border: 1px solid rgba(225, 48, 108, 0.4);
}

.platform-badge-large.platform-facebook {
  background: rgba(66, 103, 178, 0.2);
  color: #4267B2;
  border: 1px solid rgba(66, 103, 178, 0.4);
}

.content-type-badge-large {
  padding: var(--space-sm) var(--space-lg);
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: var(--text-primary);
  font-weight: 600;
}

.status-badge-large {
  padding: var(--space-sm) var(--space-lg);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-badge-large.status-scheduled {
  background: rgba(59, 130, 246, 0.2);
  color: #3B82F6;
  border: 1px solid rgba(59, 130, 246, 0.4);
}

.status-badge-large.status-posted {
  background: rgba(34, 197, 94, 0.2);
  color: #22C55E;
  border: 1px solid rgba(34, 197, 94, 0.4);
}

.status-badge-large.status-failed {
  background: rgba(239, 68, 68, 0.2);
  color: #EF4444;
  border: 1px solid rgba(239, 68, 68, 0.4);
}

.post-caption {
  white-space: pre-wrap;
  line-height: 1.8;
  padding: var(--space-lg);
  background: rgba(0, 0, 0, 0.3);
  border-radius: var(--radius-md);
  border-left: 3px solid var(--gold-primary);
}

.modal-actions {
  display: flex;
  gap: var(--space-md);
  padding-top: var(--space-lg);
  border-top: 1px solid rgba(212, 175, 55, 0.2);
  margin-top: auto;
}

/* Responsive Modal */
@media (max-width: 1024px) {
  .modal-body {
    grid-template-columns: 1fr;
    gap: var(--space-2xl);
  }

  .modal-media {
    max-height: 50vh;
  }
}

@media (max-width: 768px) {
  .modal-overlay {
    padding: var(--space-md);
  }

  .modal-body {
    padding: var(--space-2xl) var(--space-lg);
  }

  .modal-title {
    font-size: var(--text-2xl);
  }

  .time-display {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-sm);
  }

  .modal-actions {
    flex-direction: column;
  }
}
</style>

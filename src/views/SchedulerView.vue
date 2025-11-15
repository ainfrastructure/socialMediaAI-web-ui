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
          <BaseButton variant="ghost" size="small" @click="previousMonth">
            ← Previous
          </BaseButton>
          <h2 class="current-month">{{ currentMonthYear }}</h2>
          <BaseButton variant="ghost" size="small" @click="nextMonth">
            Next →
          </BaseButton>
        </div>
      </BaseCard>

      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <div class="spinner"></div>
        <p>Loading schedule...</p>
      </div>

      <!-- Calendar Grid -->
      <BaseCard v-else variant="glass" class="calendar-card">
        <div class="calendar-grid">
          <!-- Day headers -->
          <div
            v-for="day in weekDays"
            :key="day"
            class="calendar-day-header"
          >
            {{ day }}
          </div>

          <!-- Calendar days -->
          <div
            v-for="(day, index) in calendarDays"
            :key="index"
            :class="[
              'calendar-day',
              {
                'other-month': day.isOtherMonth,
                'today': day.isToday,
                'has-posts': day.posts.length > 0,
              },
            ]"
            @click="selectDay(day)"
          >
            <div class="day-number">{{ day.day }}</div>

            <!-- Quick Action Buttons -->
            <div v-if="!day.isOtherMonth" class="day-actions">
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
            </div>

            <div v-if="day.posts.length > 0" class="day-posts">
              <div
                v-for="post in day.posts.slice(0, 3)"
                :key="post.id"
                :class="['post-indicator', `platform-${post.platform}`]"
                :title="post.post_text || 'Scheduled post'"
              >
                {{ getContentTypeEmoji(post.content_type) }}
              </div>
              <span v-if="day.posts.length > 3" class="more-posts">
                +{{ day.posts.length - 3 }}
              </span>
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
            <div class="post-media">
              <img
                v-if="post.content_type === 'image'"
                :src="post.media_url"
                alt="Scheduled post"
                class="post-thumbnail"
              />
              <video
                v-else
                :src="post.media_url"
                class="post-thumbnail"
              ></video>
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

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

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

const fetchScheduledPosts = async () => {
  try {
    loading.value = true
    const month = currentDate.value.getMonth() + 1
    const year = currentDate.value.getFullYear()

    const response = await api.getScheduledPosts({ month, year })

    if (response.success) {
      scheduledPosts.value = response.data?.scheduled_posts || []
    }
  } catch (error) {
    console.error('Error fetching scheduled posts:', error)
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
    console.error('Error fetching holidays:', error)
    // Don't block the UI if holidays fail to load
    holidays.value = []
  }
}

const editScheduledPost = (post: any) => {
  // TODO: Open edit modal
  console.log('Edit post:', post)
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
    console.error('Error cancelling post:', error)
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

onMounted(() => {
  fetchScheduledPosts()
  fetchHolidays()
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
  grid-template-columns: 200px 1fr;
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

.post-thumbnail {
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-radius: var(--radius-md);
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
    grid-template-columns: 150px 1fr;
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

  .post-thumbnail {
    height: 200px;
  }
}
</style>

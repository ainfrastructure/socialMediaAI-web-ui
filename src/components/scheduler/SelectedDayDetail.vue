<template>
  <div v-if="shouldShowPanel" :class="['day-detail-wrapper', { 'no-tab-bar': hideTabBar }]">
    <!-- Segmented Tab Control (hidden when hideTabBar is true) -->
    <div v-if="!hideTabBar" class="segmented-control">
      <div class="segmented-track">
        <div :class="['segmented-indicator', `position-${activeTab}`]"></div>
        <button
          :class="['segment-btn', { active: activeTab === 'day' }]"
          @click="switchTab('day')"
        >
          {{ day ? formatShortDate(day) : $t('scheduler.selectedDay', 'Selected Day') }}
          <span v-if="day && day.posts.length > 0" class="segment-count">{{ day.posts.length }}</span>
        </button>
        <button
          :class="['segment-btn', { active: activeTab === 'upcoming' }]"
          @click="switchTab('upcoming')"
        >
          {{ $t('scheduler.upcoming', 'Upcoming') }}
          <span v-if="upcomingPosts.length > 0" class="segment-count">{{ upcomingPosts.length }}</span>
        </button>
      </div>
    </div>

    <!-- Holidays Section (if any) - only show in day view -->
    <div v-if="activeTab === 'day' && day?.holidays && day.holidays.length > 0" class="holidays-section">
      <div class="holidays-list">
        <div v-for="holiday in day.holidays" :key="holiday.name" class="holiday-card">
          <div class="holiday-icon" v-html="getHolidayIcon(holiday)"></div>
          <div class="holiday-details">
            <h5 class="holiday-name">{{ holiday.name }}</h5>
            <p v-if="holiday.description" class="holiday-description">{{ holiday.description }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Posts Card Grid -->
    <div v-if="displayPosts.length > 0" class="posts-card-grid-container">
      <div class="posts-card-grid">
        <div
          v-for="(post, index) in paginatedPosts"
          :key="post.id"
          :class="['scheduler-post-card', { 'is-expanded': expandedPostId === post.id }]"
          :data-post-id="post.id"
          :style="{ '--stagger': index }"
          @click="toggleExpanded(post.id, post)"
        >
          <!-- Card Media -->
          <div class="card-media">
            <img
              v-if="post.media_url"
              :src="getMediaUrl(post.media_url)"
              alt=""
              class="card-image"
              @error="handleImageError"
            />
            <div v-else class="card-image-placeholder">
              <MaterialIcon icon="article" size="lg" />
            </div>

            <!-- Status badge overlay -->
            <span :class="['card-status', post.status || 'scheduled']">
              <MaterialIcon
                :icon="post.status === 'published' ? 'check_circle' : post.status === 'failed' ? 'error' : 'schedule'"
                size="xs"
              />
              {{ getStatusLabel(post.status) }}
            </span>

            <!-- Video indicator -->
            <span v-if="post.video_url" class="card-video-badge">
              <MaterialIcon icon="play_arrow" size="sm" />
            </span>

            <!-- Platform badges -->
            <div v-if="getPostPlatforms(post).length" class="card-platforms">
              <div
                v-for="platform in getPostPlatforms(post).slice(0, 3)"
                :key="platform"
                class="card-platform-wrapper"
              >
                <PlatformLogo
                  :platform="platform as 'facebook' | 'instagram' | 'tiktok'"
                  :size="22"
                  class="card-platform-logo"
                />
                <!-- Per-platform status indicator -->
                <span
                  v-if="post.platform_statuses && post.platform_statuses[platform]"
                  :class="['platform-status-badge', `status-${post.platform_statuses[platform].status}`]"
                >
                  <svg v-if="post.platform_statuses[platform].status === 'success'" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <svg v-else width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </span>
              </div>
            </div>
          </div>

          <!-- Card Body -->
          <div class="card-body">
            <!-- Post text -->
            <p class="card-text">{{ truncateText(post.post_text || '', 80) }}</p>

            <!-- Business & Date -->
            <div class="card-meta">
              <span class="card-brand">
                <MaterialIcon icon="storefront" size="xs" />
                {{ getBusinessName(post) }}
              </span>
              <span class="card-date">
                <template v-if="activeTab === 'upcoming'">{{ formatPostDate(post.scheduled_date) }} • </template>
                {{ formatTime(post.scheduled_time) || '--:--' }}
              </span>
            </div>

            <!-- Post type badge -->
            <PostTypeBadge
              :post-type-settings="post.post_type_settings"
              :platforms="getPostPlatforms(post)"
              size="small"
            />
          </div>
        </div>
      </div>

      <!-- Expanded Details (shown below the grid) -->
      <div
        v-for="post in paginatedPosts"
        :key="'expanded-' + post.id"
      >
        <div v-if="expandedPostId === post.id" class="expanded-details" @click.stop>
            <!-- EDITABLE FORM for scheduled posts (only when editing) -->
            <div v-if="post.status !== 'published' && isEditing" class="edit-expanded">
              <!-- Left: Media Preview - Show video if video_url exists, otherwise image -->
              <div class="edit-image-section">
                <label class="edit-label">Preview</label>
                <div class="edit-image-wrapper">
                  <video
                    v-if="post.video_url"
                    :src="getMediaUrl(post.video_url)"
                    class="edit-preview-img"
                    controls
                    playsinline
                  />
                  <img
                    v-else-if="post.media_url"
                    :src="getMediaUrl(post.media_url)"
                    class="edit-preview-img"
                    @error="handleImageError"
                  />
                  <div v-else class="edit-preview-placeholder">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                  </div>
                </div>
              </div>

              <!-- Right: All Fields -->
              <div class="edit-fields-section">
                <!-- Row 1: Date, Time, Timezone, Platforms -->
                <div class="edit-row-4">
                  <div class="edit-field">
                    <label class="edit-label">Date</label>
                    <input
                      type="date"
                      v-model="editForm.scheduled_date"
                      :min="todayDate"
                      class="edit-input"
                    />
                  </div>
                  <div class="edit-field">
                    <label class="edit-label">Time</label>
                    <input
                      type="time"
                      v-model="editForm.scheduled_time"
                      class="edit-input"
                    />
                  </div>
                  <div class="edit-field">
                    <label class="edit-label">Timezone</label>
                    <select v-model="editForm.timezone" class="edit-input edit-select">
                      <option v-for="tz in timezoneOptions" :key="tz.value" :value="tz.value">
                        {{ tz.label }}
                      </option>
                    </select>
                  </div>
                  <div class="edit-field">
                    <label class="edit-label">Platforms</label>
                    <div class="edit-platforms">
                      <button
                        v-for="platform in availablePlatforms"
                        :key="platform"
                        :class="['platform-toggle', `platform-${platform}`, { active: editForm.platforms.includes(platform) }]"
                        @click="togglePlatform(platform)"
                        type="button"
                      >
                        <PlatformLogo :platform="platform as 'facebook' | 'instagram' | 'tiktok'" :size="16" />
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Row 2: Caption -->
                <div class="edit-field">
                  <div class="edit-label-row">
                    <label class="edit-label">Caption</label>
                    <span class="char-count">{{ editForm.post_text.length }} chars</span>
                  </div>
                  <textarea
                    v-model="editForm.post_text"
                    class="edit-textarea"
                    rows="3"
                    placeholder="Write your caption..."
                  ></textarea>
                </div>

                <!-- Row 3: Hashtags & Notes -->
                <div class="edit-row-2">
                  <div class="edit-field">
                    <label class="edit-label">Hashtags</label>
                    <div class="edit-hashtags">
                      <span
                        v-for="tag in editForm.hashtags"
                        :key="tag"
                        class="hashtag-chip editable"
                        @click="removeHashtag(tag)"
                      >
                        #{{ tag }} ×
                      </span>
                      <input
                        v-model="newHashtag"
                        class="hashtag-input"
                        placeholder="Add tag..."
                        @keydown.enter.prevent="addHashtag"
                        @blur="addHashtag"
                      />
                    </div>
                  </div>
                  <div class="edit-field">
                    <label class="edit-label">Notes</label>
                    <textarea
                      v-model="editForm.notes"
                      class="edit-textarea small"
                      rows="2"
                      placeholder="Internal notes..."
                    ></textarea>
                  </div>
                </div>

                <!-- Action Bar -->
                <div class="edit-actions">
                  <button
                    class="action-btn back-btn"
                    @click="cancelEdit"
                    type="button"
                  >
                    ← Back
                  </button>
                  <button
                    class="action-btn delete-btn"
                    @click="emit('delete', post.id)"
                    type="button"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                    Delete
                  </button>
                  <div class="action-spacer"></div>
                  <span v-if="isDateTimeInPast" class="past-date-warning">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    Cannot schedule in the past
                  </span>
                  <button
                    v-if="hasChanges"
                    class="action-btn save-btn"
                    @click="saveChanges(post.id)"
                    :disabled="savingPost || isDateTimeInPast"
                    type="button"
                  >
                    <svg v-if="!savingPost" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                      <polyline points="17 21 17 13 7 13 7 21"/>
                      <polyline points="7 3 7 8 15 8"/>
                    </svg>
                    {{ savingPost ? 'Saving...' : 'Save' }}
                  </button>
                </div>
              </div>
            </div>

            <!-- READ-ONLY view for published posts and scheduled posts (when not editing) -->
            <div v-else class="expanded-grid">
              <!-- Preview - Show video if video_url exists, otherwise image -->
              <div class="detail-section">
                <h4 class="detail-label">Preview</h4>
                <video
                  v-if="post.video_url"
                  :src="getMediaUrl(post.video_url)"
                  class="detail-preview-img"
                  controls
                  playsinline
                />
                <img
                  v-else-if="post.media_url"
                  :src="getMediaUrl(post.media_url)"
                  class="detail-preview-img"
                />
                <div v-else class="detail-preview-placeholder">No media</div>
              </div>

              <!-- Date/Time & Platforms -->
              <div class="detail-section">
                <h4 class="detail-label">{{ post.status === 'published' ? 'Published At' : 'Scheduled For' }}</h4>
                <p class="detail-value">{{ activeTab === 'upcoming' ? formatPostDateFull(post.scheduled_date) : formatFullDate(day) }}</p>
                <p class="detail-subvalue">{{ formatTime(post.scheduled_time) }} • {{ post.timezone || 'UTC' }}</p>

                <h4 class="detail-label" style="margin-top: var(--space-lg)">Platforms</h4>
                <div class="detail-platforms">
                  <span
                    v-for="platform in getPostPlatforms(post)"
                    :key="platform"
                    :class="['platform-pill', `platform-${platform}`]"
                  >
                    <PlatformLogo :platform="platform as 'facebook' | 'instagram' | 'tiktok'" :size="14" />
                    {{ capitalizeFirst(platform) }}
                  </span>
                </div>

                <h4 class="detail-label" style="margin-top: var(--space-lg)">{{ $t('postType.label') || 'Post Type' }}</h4>
                <div class="detail-post-types">
                  <PostTypeBadge
                    :post-type-settings="post.post_type_settings"
                    :platforms="getPostPlatforms(post)"
                    size="medium"
                    :show-icon="true"
                  />
                </div>
              </div>

              <!-- Caption -->
              <div class="detail-section">
                <div class="detail-label-row">
                  <h4 class="detail-label">Caption</h4>
                  <span class="char-count">{{ (post.post_text || '').length }} chars</span>
                </div>
                <div class="detail-caption-box">
                  {{ post.post_text || 'No caption' }}
                </div>
              </div>

              <!-- Hashtags & Links -->
              <div class="detail-section">
                <h4 class="detail-label">Hashtags</h4>
                <div v-if="getPostHashtags(post).length > 0" class="detail-hashtags">
                  <span
                    v-for="tag in getPostHashtags(post)"
                    :key="tag"
                    class="hashtag-chip"
                  >
                    #{{ tag }}
                  </span>
                </div>
                <p v-else class="detail-empty">No hashtags</p>

                <!-- View Post Links (show for published and partial posts) -->
                <div
                  v-if="['published', 'partial'].includes(post.status) && post.platform_post_urls && Object.keys(post.platform_post_urls).length > 0"
                  class="detail-links"
                >
                  <h4 class="detail-label" style="margin-top: var(--space-lg)">View Post</h4>
                  <a
                    v-for="(url, platform) in (post.platform_post_urls as Record<string, string>)"
                    :key="platform"
                    :href="url"
                    target="_blank"
                    rel="noopener noreferrer"
                    :class="['view-link', `link-${platform}`]"
                  >
                    <PlatformLogo :platform="(platform as string) as 'facebook' | 'instagram' | 'tiktok'" :size="14" />
                    View on {{ capitalizeFirst(platform as string) }} ↗
                  </a>
                </div>

                <!-- Show failed platforms with errors -->
                <div v-if="post.platform_statuses && hasFailedPlatforms(post)" class="detail-error-section">
                  <h4 class="detail-label error-label" style="margin-top: var(--space-lg)">Failed Platforms</h4>
                  <div
                    v-for="(platformStatus, platform) in getFailedPlatforms(post)"
                    :key="platform"
                    class="failed-platform-item"
                  >
                    <div class="failed-platform-header">
                      <PlatformLogo :platform="platform as 'facebook' | 'instagram' | 'tiktok'" :size="16" />
                      <span class="failed-platform-name">{{ capitalizeFirst(platform) }}</span>
                    </div>
                    <p class="failed-platform-error">{{ formatErrorMessage(platformStatus.error) }}</p>
                  </div>

                  <!-- Retry button for failed/partial posts -->
                  <button
                    v-if="['failed', 'partial'].includes(post.status)"
                    class="action-btn retry-btn"
                    @click="retryPost(post.id)"
                    type="button"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                    </svg>
                    Retry Failed Platforms
                  </button>
                </div>

                <!-- Action buttons for scheduled posts -->
                <div v-if="post.status !== 'published'" class="detail-actions-readonly">
                  <button
                    class="action-btn edit-btn"
                    @click="startEditing(post)"
                    type="button"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Edit
                  </button>
                  <button
                    class="action-btn delete-btn"
                    @click="emit('delete', post.id)"
                    type="button"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                    Delete
                  </button>
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
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <div class="empty-icon">📅</div>
      <p class="empty-text">{{ $t('scheduler.noPostsForDay', 'No posts scheduled') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import PlatformLogo from '../PlatformLogo.vue'
import PostTypeBadge from '../PostTypeBadge.vue'
import MaterialIcon from '../MaterialIcon.vue'
import { API_URL } from '@/services/apiBase'
import { api } from '@/services/api'
import { useNotificationStore } from '@/stores/notifications'

const { t } = useI18n()
const notificationStore = useNotificationStore()

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
  upcomingPosts?: any[]
  activeTab?: 'day' | 'upcoming'
  postsPerPage?: number
  hideTabBar?: boolean
}>()

const emit = defineEmits<{
  (e: 'view', post: any): void
  (e: 'edit', post: any): void
  (e: 'delete', postId: string): void
  (e: 'create', day: CalendarDay): void
  (e: 'tab-change', tab: 'day' | 'upcoming'): void
  (e: 'save', postId: string, data: any): void
  (e: 'retry', post: any): void
}>()

const postsPerPage = props.postsPerPage || 5
const currentPage = ref(1)
const expandedPostId = ref<string | number | null>(null)
const activeTab = ref<'day' | 'upcoming'>(props.activeTab || 'day')

// Edit form state
interface EditFormData {
  scheduled_date: string
  scheduled_time: string
  timezone: string
  platforms: string[]
  post_text: string
  hashtags: string[]
  notes: string
}

const editForm = ref<EditFormData>({
  scheduled_date: '',
  scheduled_time: '',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  platforms: [],
  post_text: '',
  hashtags: [],
  notes: ''
})

const originalForm = ref<EditFormData | null>(null)
const newHashtag = ref('')
const savingPost = ref(false)
const isEditing = ref(false) // Track if currently editing a scheduled post

// Timezone options
const timezoneOptions = [
  { value: 'Europe/Oslo', label: 'Oslo (CET)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET)' },
  { value: 'Europe/Stockholm', label: 'Stockholm (CET)' },
  { value: 'America/New_York', label: 'New York (EST)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PST)' },
  { value: 'America/Chicago', label: 'Chicago (CST)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEDT)' },
  { value: 'UTC', label: 'UTC' }
]

// Check if form has changes
const hasChanges = computed(() => {
  if (!originalForm.value) return false
  return (
    editForm.value.scheduled_date !== originalForm.value.scheduled_date ||
    editForm.value.scheduled_time !== originalForm.value.scheduled_time ||
    editForm.value.timezone !== originalForm.value.timezone ||
    editForm.value.post_text !== originalForm.value.post_text ||
    editForm.value.notes !== originalForm.value.notes ||
    JSON.stringify(editForm.value.platforms) !== JSON.stringify(originalForm.value.platforms) ||
    JSON.stringify(editForm.value.hashtags) !== JSON.stringify(originalForm.value.hashtags)
  )
})

// Initialize edit form when expanding a scheduled post
const initEditForm = (post: any) => {
  const platforms = getPostPlatforms(post)
  const hashtags = getPostHashtags(post)

  // Create edit form with fresh array copies
  editForm.value = {
    scheduled_date: post.scheduled_date || '',
    scheduled_time: post.scheduled_time || '',
    timezone: post.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    platforms: [...platforms],
    post_text: post.post_text || '',
    hashtags: [...hashtags],
    notes: post.notes || ''
  }

  // Create original form with separate array copies (important for change detection!)
  originalForm.value = {
    scheduled_date: post.scheduled_date || '',
    scheduled_time: post.scheduled_time || '',
    timezone: post.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    platforms: [...platforms],
    post_text: post.post_text || '',
    hashtags: [...hashtags],
    notes: post.notes || ''
  }
}

// Cancel editing - reset to original and exit edit mode
const cancelEdit = () => {
  if (originalForm.value) {
    // Deep copy arrays to avoid reference issues
    editForm.value = {
      ...originalForm.value,
      platforms: [...originalForm.value.platforms],
      hashtags: [...originalForm.value.hashtags]
    }
  }
  newHashtag.value = ''
  isEditing.value = false
}

// Start editing a scheduled post
const startEditing = (post: any) => {
  initEditForm(post)
  isEditing.value = true
}

// Today's date for min validation (prevent scheduling in the past)
const todayDate = computed(() => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
})

// Check if selected date/time is in the past
const isDateTimeInPast = computed(() => {
  if (!editForm.value.scheduled_date) return false

  const now = new Date()
  const selectedDate = new Date(editForm.value.scheduled_date + 'T00:00:00')
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  // If date is before today, it's in the past
  if (selectedDate < today) return true

  // If date is today, check time
  if (selectedDate.getTime() === today.getTime() && editForm.value.scheduled_time) {
    const [hours, minutes] = editForm.value.scheduled_time.split(':').map(Number)
    const selectedDateTime = new Date(selectedDate)
    selectedDateTime.setHours(hours, minutes, 0, 0)
    return selectedDateTime <= now
  }

  return false
})

// Save changes
const saveChanges = async (postId: string) => {
  // Validate date is not in the past
  if (isDateTimeInPast.value) {
    return // Don't save if date/time is in the past
  }
  savingPost.value = true
  emit('save', postId, { ...editForm.value })
}

// Platform toggle
const availablePlatforms = ['facebook', 'instagram', 'tiktok']

const togglePlatform = (platform: string) => {
  const idx = editForm.value.platforms.indexOf(platform)
  if (idx > -1) {
    editForm.value.platforms.splice(idx, 1)
  } else {
    editForm.value.platforms.push(platform)
  }
}

// Hashtag management
const addHashtag = () => {
  const tag = newHashtag.value.trim().replace(/^#/, '')
  if (tag && !editForm.value.hashtags.includes(tag)) {
    editForm.value.hashtags.push(tag)
  }
  newHashtag.value = ''
}

const removeHashtag = (tag: string) => {
  const idx = editForm.value.hashtags.indexOf(tag)
  if (idx > -1) {
    editForm.value.hashtags.splice(idx, 1)
  }
}

// Sync activeTab with prop
watch(() => props.activeTab, (newTab) => {
  if (newTab) activeTab.value = newTab
})

// Reset pagination and expanded state when tab or day changes
watch([() => props.day, activeTab], () => {
  currentPage.value = 1
  expandedPostId.value = null
  originalForm.value = null
  isEditing.value = false
})

const switchTab = (tab: 'day' | 'upcoming') => {
  activeTab.value = tab
  emit('tab-change', tab)
}

// Sort posts by time (newest first)
const sortPostsByTime = (posts: any[]) => {
  return [...posts].sort((a, b) => {
    const timeA = a.scheduled_time || '00:00'
    const timeB = b.scheduled_time || '00:00'
    // Sort descending (newest/latest time first)
    return timeB.localeCompare(timeA)
  })
}

// Computed: which posts to display based on active tab
const displayPosts = computed(() => {
  if (activeTab.value === 'upcoming') {
    return sortPostsByTime(props.upcomingPosts || [])
  }
  return sortPostsByTime(props.day?.posts || [])
})

// Computed: should show panel at all
const shouldShowPanel = computed(() => {
  const hasDayContent = props.day && (props.day.posts.length > 0 || props.day.holidays?.length)
  const hasUpcoming = (props.upcomingPosts || []).length > 0
  return hasDayContent || hasUpcoming
})

// Use upcomingPosts for convenience
const upcomingPosts = computed(() => props.upcomingPosts || [])

const toggleExpanded = (postId: string | number, _post?: any) => {
  const isExpanding = expandedPostId.value !== postId

  if (expandedPostId.value === postId) {
    expandedPostId.value = null
    originalForm.value = null
    isEditing.value = false
  } else {
    expandedPostId.value = postId
    isEditing.value = false // Start in view mode, not edit mode
    originalForm.value = null
  }

  // Scroll expanded row into view
  if (isExpanding) {
    nextTick(() => {
      const expandedElement = document.querySelector(`[data-post-id="${postId}"]`)
      if (expandedElement) {
        expandedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    })
  }
}

const totalPages = computed(() => {
  return Math.ceil(displayPosts.value.length / postsPerPage) || 1
})

const paginatedPosts = computed(() => {
  const start = (currentPage.value - 1) * postsPerPage
  const end = start + postsPerPage
  return displayPosts.value.slice(start, end)
})

const formatShortDate = (day: CalendarDay) => {
  return day.date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

const formatFullDate = (day: CalendarDay | null) => {
  if (!day) return ''
  return day.date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// Format date string for upcoming posts
const formatPostDate = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (date.getTime() === today.getTime()) return 'Today'

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const formatPostDateFull = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const formatTime = (time: string | null) => {
  if (!time) return null
  const [hours, minutes] = time.split(':')
  return `${hours}:${minutes}`
}

const getPostTimeAgo = (post: any) => {
  if (post.status === 'scheduled') return t('dashboardNew.scheduled') || 'Scheduled'
  if (post.status === 'failed') return t('dashboardNew.failed') || 'Failed'
  if (!post.published_at) return ''

  const date = new Date(post.published_at)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return t('common.justNow') || 'Just now'
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes} ${minutes > 1 ? 'minutes ago' : 'minute ago'}`
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours} ${hours > 1 ? 'hours ago' : 'hour ago'}`
  }
  const days = Math.floor(diffInSeconds / 86400)
  return `${days} ${days > 1 ? 'days ago' : 'day ago'}`
}

const getPostPlatforms = (post: any): string[] => {
  if (post.platforms && Array.isArray(post.platforms) && post.platforms.length > 0) {
    return post.platforms
  }
  if (post.platform) {
    return [post.platform]
  }
  return []
}

const getPostHashtags = (post: any): string[] => {
  const hashtags = post.hashtags || post.favorite_posts?.hashtags || post.favorite?.hashtags || post.favorite_post?.hashtags || []
  if (Array.isArray(hashtags)) return hashtags
  if (typeof hashtags === 'string') return hashtags.split(/\s+/).filter(Boolean)
  return []
}

const getStatusLabel = (status: string | undefined) => {
  switch (status?.toLowerCase()) {
    case 'published': return t('dashboardNew.published') || 'Published'
    case 'failed': return t('dashboardNew.failed') || 'Failed'
    default: return t('dashboardNew.scheduled') || 'Scheduled'
  }
}

const getBusinessName = (post: any): string => {
  if (post.business_name) return post.business_name
  if (post.brands?.name) return post.brands.name
  if (post.brand?.name) return post.brand.name
  if (post.favorite_posts?.brands?.name) return post.favorite_posts.brands.name
  if (post.favorite_post?.brands?.name) return post.favorite_post.brands.name
  if (post.favorite?.brands?.name) return post.favorite.brands.name

  // Fallback to restaurant data
  if (post.restaurant_name) return post.restaurant_name
  if (post.favorite_posts?.saved_restaurants?.name) return post.favorite_posts.saved_restaurants.name
  if (post.favorite_post?.saved_restaurants?.name) return post.favorite_post.saved_restaurants.name
  if (post.favorite?.saved_restaurants?.name) return post.favorite.saved_restaurants.name
  if (post.saved_restaurants?.name) return post.saved_restaurants.name
  return '-'
}

const capitalizeFirst = (str: string) => {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

const truncateText = (text: string, maxLength: number) => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// Check if post has any failed platforms
const hasFailedPlatforms = (post: any): boolean => {
  if (!post.platform_statuses) return false
  return Object.values(post.platform_statuses).some(
    (status: any) => status.status === 'failed'
  )
}

// Get only failed platforms
const getFailedPlatforms = (post: any): Record<string, any> => {
  if (!post.platform_statuses) return {}
  return Object.fromEntries(
    Object.entries(post.platform_statuses).filter(
      ([_, status]: [string, any]) => status.status === 'failed'
    )
  )
}

// Format error message to be user-friendly
const formatErrorMessage = (error: string | null): string => {
  if (!error) return 'Publishing failed'

  // Map common technical errors to user-friendly messages
  const errorMappings: Record<string, string> = {
    'token': 'Account connection expired. Please reconnect your account.',
    'expired': 'Account connection expired. Please reconnect your account.',
    'permission': 'Missing required permissions. Please reconnect your account.',
    'rate limit': 'Rate limit exceeded. Please try again later.',
    'schema': 'System error. Please contact support.',
    'database': 'System error. Please contact support.',
    'not found': 'Account not found. Please reconnect your account.',
    'invalid': 'Invalid account or post data.',
    'timeout': 'Request timed out. Please try again.',
    'network': 'Network error. Please check your connection.'
  }

  // Check if error contains any known patterns
  const lowerError = error.toLowerCase()
  for (const [pattern, message] of Object.entries(errorMappings)) {
    if (lowerError.includes(pattern)) {
      return message
    }
  }

  // If error is too long (technical message), show generic error
  if (error.length > 100) {
    return 'Publishing failed. Please try again or contact support.'
  }

  // Return the original error if it's short and user-friendly
  return error
}

// Retry a post - emit event to parent to handle publishing with progress modal
const retryPost = (postId: string) => {
  // Find the post in the current list
  const post = displayPosts.value.find(p => p.id === postId)
  if (post) {
    emit('retry', post)
  }
}

const getHolidayIcon = (holiday: any) => {
  // Star/sparkle icon for celebrations - gold colored
  const starIcon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>'
  // Calendar icon for national holidays
  const calendarIcon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>'
  // Gift/present icon for Christmas-like holidays
  const giftIcon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>'
  // Sun icon for spring/summer holidays
  const sunIcon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>'
  // Heart icon for love-related holidays
  const heartIcon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>'

  const name = holiday.name.toLowerCase()

  if (name.includes('christmas') || name.includes('jul')) return giftIcon
  if (name.includes('easter') || name.includes('påske')) return sunIcon
  if (name.includes('new year') || name.includes('nyttår')) return starIcon
  if (name.includes('valentine')) return heartIcon
  if (name.includes('independence') || name.includes('constitution') || name.includes('national')) return calendarIcon
  if (name.includes('labor') || name.includes('labour') || name.includes('workers')) return calendarIcon

  if (holiday.type && holiday.type.includes('national')) return calendarIcon
  if (holiday.type && holiday.type.includes('religious')) return starIcon

  return starIcon
}

const getMediaUrl = (url: string): string => {
  if (!url) return ''
  if (url.includes('localhost:3000')) {
    return url.replace('http://localhost:3000', API_URL)
  }
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  return `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`
}

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23333" width="100" height="100"/></svg>'
}

// Expose savingPost so parent can reset it after save completes
defineExpose({
  savingPost
})
</script>

<style scoped>
.day-detail-wrapper {
  margin-top: var(--space-lg);
  animation: fadeSlideUp 0.4s ease both;
  background: var(--glass-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: var(--radius-xl);
  overflow: hidden;
  border: 1px solid var(--glass-border);
}

/* When tab bar is hidden (day view mode) */
.day-detail-wrapper.no-tab-bar {
  margin-top: 0;
  border-radius: 0;
  border: none;
  border-top: 1px solid var(--glass-border);
}

@keyframes fadeSlideUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Segmented Control */
.segmented-control {
  padding: var(--space-md) var(--space-lg);
  border-bottom: 1px solid var(--glass-border);
}

.segmented-track {
  display: inline-flex;
  position: relative;
  background: var(--accent-alpha-05);
  border-radius: var(--radius-full);
  padding: 3px;
}

.segmented-indicator {
  position: absolute;
  top: 3px;
  bottom: 3px;
  width: calc(50% - 3px);
  background: var(--gold-primary);
  border-radius: var(--radius-full);
  transition: transform var(--transition-base);
  z-index: 0;
}

.segmented-indicator.position-day {
  transform: translateX(0);
}

.segmented-indicator.position-upcoming {
  transform: translateX(100%);
}

.segment-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-lg);
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: color var(--transition-fast);
  border: none;
  background: transparent;
  color: var(--text-secondary);
  position: relative;
  z-index: 1;
  white-space: nowrap;
}

.segment-btn.active {
  color: var(--text-on-gold);
}

.segment-btn:not(.active):hover {
  color: var(--gold-primary);
}

.segment-count {
  padding: 1px 7px;
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
  background: var(--surface-alpha-30);
}

.segment-btn:not(.active) .segment-count {
  background: var(--accent-alpha-10);
  color: var(--gold-primary);
}

/* Holidays Section */
.holidays-section {
  padding: var(--space-md) var(--space-lg);
  border-bottom: 1px solid var(--border-color);
}

.holidays-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.holiday-card {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  background: var(--info-bg);
  border: 1px solid var(--info-border);
  border-radius: var(--radius-md);
}

.holiday-icon {
  font-size: var(--text-lg);
  display: flex;
  align-items: center;
  justify-content: center;
}

.holiday-icon svg {
  stroke: var(--gold-primary);
}

.holiday-details {
  flex: 1;
}

.holiday-name {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-primary);
  margin: 0;
}

.holiday-description {
  font-size: var(--text-xs);
  color: var(--text-secondary);
  margin: 2px 0 0 0;
}

/* Posts Card Grid */
.posts-card-grid-container {
  padding: var(--space-md);
}

.posts-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-lg);
}

/* Individual Post Card */
.scheduler-post-card {
  background: var(--bg-secondary);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
  cursor: pointer;
  transition: var(--transition-base);
  animation: fadeSlideUp 0.4s ease both;
  animation-delay: calc(var(--stagger, 0) * 60ms);
}

.scheduler-post-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--accent-alpha-20);
}

.scheduler-post-card.is-expanded {
  border-color: var(--gold-primary);
  box-shadow: var(--shadow-lg);
}

/* Card Media */
.card-media {
  position: relative;
  height: 180px;
  overflow: hidden;
  background: var(--bg-tertiary);
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.scheduler-post-card:hover .card-image {
  transform: scale(1.03);
}

.card-image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  background: linear-gradient(135deg, var(--bg-tertiary), var(--bg-elevated));
}

/* Status badge on image */
.card-status {
  position: absolute;
  top: var(--space-sm);
  left: var(--space-sm);
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px var(--space-sm);
  border-radius: var(--radius-full);
  font-size: 11px;
  font-weight: var(--font-semibold);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  text-transform: capitalize;
}

.card-status.published {
  background: rgba(34, 197, 94, 0.9);
  color: white;
}

.card-status.scheduled {
  background: rgba(245, 158, 11, 0.9);
  color: white;
}

.card-status.failed,
.card-status.partial {
  background: rgba(239, 68, 68, 0.9);
  color: white;
}

/* Video badge */
.card-video-badge {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 44px;
  height: 44px;
  border-radius: var(--radius-full);
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

/* Platform badges on image */
.card-platforms {
  position: absolute;
  bottom: var(--space-sm);
  right: var(--space-sm);
  display: flex;
  gap: 4px;
}

.card-platform-wrapper {
  position: relative;
}

.card-platform-logo {
  background: rgba(255, 255, 255, 0.9);
  border-radius: var(--radius-full);
  padding: 3px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

/* Card Body */
.card-body {
  padding: var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.card-text {
  font-size: var(--text-sm);
  color: var(--text-primary);
  line-height: 1.5;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-sm);
}

.card-brand {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--text-xs);
  color: var(--gold-primary);
  font-weight: var(--font-medium);
}

.card-date {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

/* Expanded Details */
.expanded-details {
  background: var(--accent-alpha-05);
  border-top: 1px solid var(--glass-border);
  padding: var(--space-xl);
  margin: 0 var(--space-sm);
  border-radius: 0 0 var(--radius-lg) var(--radius-lg);
  animation: expandDown 0.3s ease both;
}

@keyframes expandDown {
  from {
    opacity: 0;
    max-height: 0;
  }
  to {
    opacity: 1;
    max-height: 2000px;
  }
}

.expanded-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-xl);
}

.detail-section {
  min-width: 0;
}

.detail-label {
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 var(--space-sm) 0;
}

.detail-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-sm);
}

.char-count {
  font-size: 10px;
  color: var(--text-muted);
  background: var(--bg-tertiary);
  padding: 2px 6px;
  border-radius: 4px;
}

.detail-value {
  font-size: var(--text-sm);
  color: var(--text-primary);
  margin: 0;
}

.detail-subvalue {
  font-size: var(--text-xs);
  color: var(--text-muted);
  margin: 4px 0 0 0;
}

.detail-preview-img {
  width: 100%;
  aspect-ratio: 1;
  border-radius: var(--radius-lg);
  object-fit: cover;
}

.detail-preview-placeholder {
  width: 100%;
  aspect-ratio: 1;
  border-radius: var(--radius-lg);
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  font-size: var(--text-sm);
}

.detail-platforms {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.detail-post-types {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.platform-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: white;
}

.platform-pill.platform-facebook {
  background: #1877F2;
}

.platform-pill.platform-instagram {
  background: linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888);
}

.platform-pill.platform-tiktok {
  background: #000;
  border: 1px solid #333;
}

.detail-caption-box {
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: 1.5;
  max-height: 120px;
  overflow-y: auto;
  border: 1px solid var(--border-color);
}

.detail-hashtags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.hashtag-chip {
  padding: 4px 8px;
  border-radius: 4px;
  background: var(--bg-tertiary);
  color: var(--text-muted);
  font-size: var(--text-xs);
  transition: color 0.2s ease;
}

.hashtag-chip:hover {
  color: var(--gold-primary);
}

.detail-empty {
  font-size: var(--text-sm);
  color: var(--text-muted);
  font-style: italic;
  margin: 0;
}

.detail-error {
  margin-top: var(--space-lg);
}

.error-label {
  color: var(--error-text);
}

.error-message {
  font-size: var(--text-sm);
  color: var(--error-text);
  margin: 0;
}

.detail-links {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.view-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: var(--text-xs);
  text-decoration: none;
  transition: color 0.2s ease;
}

.view-link.link-facebook {
  color: #1877F2;
}

.view-link.link-instagram {
  color: #E1306C;
}

.view-link.link-tiktok {
  color: var(--text-secondary);
}

.view-link:hover {
  text-decoration: underline;
}

.link-arrow {
  font-size: 10px;
  opacity: 0.7;
}

.detail-actions {
  display: flex;
  gap: var(--space-sm);
  margin-top: var(--space-lg);
}

.action-btn {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-md);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.edit-btn {
  background: var(--accent-alpha-10);
  color: var(--gold-primary);
}

.edit-btn svg {
  stroke: var(--gold-primary);
}

.edit-btn:hover {
  background: var(--accent-alpha-15);
}

.back-btn {
  background: rgba(128, 128, 128, 0.2);
  color: var(--text-secondary);
}

.back-btn:hover {
  background: rgba(128, 128, 128, 0.3);
  color: var(--text-primary);
}

.delete-btn {
  background: var(--error-bg);
  color: var(--error-text);
}

.delete-btn svg {
  stroke: var(--error-text);
}

.delete-btn:hover {
  background: var(--error-border);
}

/* Action buttons in read-only view for scheduled posts */
.detail-actions-readonly {
  display: flex;
  gap: var(--space-sm);
  margin-top: var(--space-lg);
  padding-top: var(--space-md);
  border-top: 1px solid var(--border-color);
}

/* Pagination */
.detail-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-lg);
  padding: var(--space-md) var(--space-lg);
  border-top: 1px solid var(--glass-border);
}

.pagination-btn {
  padding: var(--space-sm) var(--space-lg);
  background: var(--accent-alpha-08);
  border: 1px solid var(--accent-alpha-15);
  border-radius: var(--radius-md);
  color: var(--gold-primary);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  cursor: pointer;
  transition: all var(--transition-base);
}

.pagination-btn:hover:not(:disabled) {
  background: var(--accent-alpha-12);
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

@media (max-width: 1024px) {
  .expanded-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  /* Single column card grid on mobile */
  .posts-card-grid {
    grid-template-columns: 1fr;
  }

  .card-media {
    height: 160px;
  }

  .card-body {
    padding: var(--space-md);
  }

  /* Expanded details - stack vertically on mobile */
  .expanded-details {
    padding: var(--space-md);
  }

  .expanded-grid {
    grid-template-columns: 1fr;
    gap: var(--space-md);
  }

  .detail-section {
    padding: var(--space-md);
    background: var(--bg-tertiary);
    border-radius: var(--radius-md);
  }

  .detail-preview-img {
    max-height: 200px;
    width: 100%;
    object-fit: contain;
  }

  .detail-label {
    font-size: var(--text-xs);
    margin-bottom: var(--space-xs);
  }

  .detail-value {
    font-size: var(--text-sm);
  }

  .detail-subvalue {
    font-size: var(--text-xs);
  }

  .detail-caption-box {
    font-size: var(--text-sm);
    max-height: 120px;
    padding: var(--space-sm);
  }

  .detail-platforms {
    flex-wrap: wrap;
  }

  .platform-pill {
    font-size: var(--text-xs);
    padding: var(--space-xs) var(--space-sm);
  }

  .detail-actions-readonly {
    flex-direction: column;
    gap: var(--space-sm);
  }

  .detail-actions-readonly .action-btn {
    width: 100%;
    justify-content: center;
  }

  /* Edit form mobile styles */
  .edit-expanded {
    grid-template-columns: 1fr;
    gap: var(--space-md);
  }

  .edit-image-section {
    align-items: center;
  }

  .edit-row-4,
  .edit-row-3,
  .edit-row-2 {
    grid-template-columns: 1fr;
    gap: var(--space-sm);
  }

  .edit-actions {
    flex-wrap: wrap;
    gap: var(--space-sm);
  }

  .edit-actions .action-btn {
    flex: 1;
    min-width: 80px;
    justify-content: center;
  }

  .action-spacer {
    display: none;
  }

  .past-date-warning {
    width: 100%;
    justify-content: center;
    order: -1;
  }
}

@media (max-width: 480px) {
  .card-media {
    height: 140px;
  }
}

/* ========== Editable Form Styles ========== */
.edit-expanded {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: var(--space-xl);
}

/* Left column: Image preview */
.edit-image-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.edit-image-wrapper {
  width: 120px;
  height: 120px;
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--border-color);
}

.edit-preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.edit-preview-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-tertiary);
  font-size: 32px;
}

.edit-preview-placeholder svg {
  stroke: var(--gold-primary);
}

/* Right column: All editable fields */
.edit-fields-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

/* Row with 4 columns: Date, Time, Timezone, Platforms */
.edit-row-4 {
  display: grid;
  grid-template-columns: 1fr 1fr 1.2fr 1fr;
  gap: var(--space-md);
}

/* Row with 3 columns: Date, Time, Platforms */
.edit-row-3 {
  display: grid;
  grid-template-columns: 1fr 1fr 1.5fr;
  gap: var(--space-md);
}

/* Row with 2 columns: Hashtags, Notes */
.edit-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-md);
}

.edit-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.edit-label {
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.edit-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.edit-input {
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--text-sm);
  font-family: var(--font-body);
  transition: border-color var(--transition-fast);
}

.edit-input:focus {
  outline: none;
  border-color: var(--gold-primary);
}

.edit-select {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23808080' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  padding-right: 28px;
}

.edit-select option {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.edit-textarea {
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--text-sm);
  font-family: var(--font-body);
  resize: vertical;
  min-height: 60px;
  transition: border-color var(--transition-fast);
}

.edit-textarea:focus {
  outline: none;
  border-color: var(--gold-primary);
}

.edit-textarea.small {
  min-height: 48px;
}

/* Platform toggles */
.edit-platforms {
  display: flex;
  gap: var(--space-sm);
}

.platform-toggle {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  background: var(--bg-tertiary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
  opacity: 0.5;
}

.platform-toggle:hover {
  opacity: 0.75;
  border-color: var(--text-muted);
}

.platform-toggle.active {
  opacity: 1;
  border-color: var(--gold-primary);
  box-shadow: 0 0 0 2px var(--accent-alpha-10);
}

.platform-toggle.active.platform-facebook {
  border-color: #1877F2;
  box-shadow: 0 0 0 2px rgba(24, 119, 242, 0.2);
}

.platform-toggle.active.platform-instagram {
  border-color: #E1306C;
  box-shadow: 0 0 0 2px rgba(225, 48, 108, 0.2);
}

.platform-toggle.active.platform-tiktok {
  border-color: #69C9D0;
  box-shadow: 0 0 0 2px rgba(105, 201, 208, 0.2);
}

/* Hashtags */
.edit-hashtags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: var(--space-sm);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  min-height: 48px;
  align-content: flex-start;
}

.hashtag-chip.editable {
  cursor: pointer;
  padding: 4px 10px;
  background: var(--accent-alpha-08);
  border: 1px solid var(--accent-alpha-15);
  color: var(--gold-primary);
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  transition: all var(--transition-fast);
}

.hashtag-chip.editable:hover {
  background: var(--error-bg);
  border-color: var(--error-border);
  color: var(--error-text);
}

.hashtag-input {
  flex: 1;
  min-width: 80px;
  padding: 4px 8px;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: var(--text-xs);
}

.hashtag-input:focus {
  outline: none;
}

.hashtag-input::placeholder {
  color: var(--text-muted);
}

/* Action bar */
.edit-actions {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding-top: var(--space-md);
  border-top: 1px solid var(--border-color);
  margin-top: var(--space-sm);
}

.action-spacer {
  flex: 1;
}

.action-btn.cancel-btn {
  background: rgba(128, 128, 128, 0.2);
  color: var(--text-secondary);
}

.action-btn.cancel-btn:hover {
  background: rgba(128, 128, 128, 0.3);
  color: var(--text-primary);
}

.action-btn.save-btn {
  background: var(--gold-primary);
  color: var(--text-on-gold);
}

.action-btn.save-btn svg {
  stroke: var(--text-on-gold);
}

.action-btn.save-btn:hover:not(:disabled) {
  background: var(--gold-light);
}

.action-btn.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.past-date-warning {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--text-xs);
  color: var(--error-text);
  font-weight: var(--font-medium);
}

.past-date-warning svg {
  stroke: var(--error-text);
}

/* Responsive for editable form */
@media (max-width: 900px) {
  .edit-expanded {
    grid-template-columns: 1fr;
  }

  .edit-image-section {
    flex-direction: row;
    align-items: flex-start;
    gap: var(--space-md);
  }

  .edit-image-wrapper {
    width: 80px;
    height: 80px;
  }

  .edit-row-4 {
    grid-template-columns: 1fr 1fr;
  }

  .edit-row-4 > .edit-field:nth-child(3),
  .edit-row-4 > .edit-field:nth-child(4) {
    grid-column: auto;
  }

  .edit-row-3 {
    grid-template-columns: 1fr 1fr;
  }

  .edit-row-3 > .edit-field:last-child {
    grid-column: 1 / -1;
  }

  .edit-row-2 {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .edit-row-4 {
    grid-template-columns: 1fr;
  }

  .edit-row-3 {
    grid-template-columns: 1fr;
  }
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-3xl) var(--space-xl);
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: var(--space-md);
  opacity: 0.5;
}

.empty-text {
  font-size: var(--text-base);
  color: var(--text-muted);
  margin: 0;
}

/* Platform logo wrapper with status badge */
.platform-logo-wrapper {
  position: relative;
  display: inline-block;
  margin-right: 4px;
}

.platform-status-badge {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid var(--bg-secondary);
}

.platform-status-badge.status-success {
  background: rgba(34, 197, 94, 0.9);
  color: white;
}

.platform-status-badge.status-failed {
  background: rgba(239, 68, 68, 0.9);
  color: white;
}

/* Failed platforms section */
.detail-error-section {
  margin-top: var(--space-lg);
}

.error-label {
  color: var(--error-text);
}

.failed-platform-item {
  padding: var(--space-md);
  background: var(--error-bg);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-sm);
  border: 1px solid var(--error-border);
}

.failed-platform-header {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  margin-bottom: var(--space-xs);
}

.failed-platform-name {
  font-weight: var(--font-medium);
  font-size: var(--text-sm);
  color: var(--text-primary);
}

.failed-platform-error {
  font-size: var(--text-xs);
  color: var(--error-text);
  line-height: 1.5;
  margin: 0;
  padding-left: calc(16px + var(--space-xs)); /* Align with platform name */
}

.retry-btn {
  margin-top: var(--space-md);
  background: var(--info-bg);
  color: var(--info-text);
  border: 1px solid var(--info-border);
}

.retry-btn svg {
  stroke: var(--info-text);
}

.retry-btn:hover {
  background: var(--info-border);
}

@media (prefers-reduced-motion: reduce) {
  .day-detail-wrapper,
  .scheduler-post-card,
  .expanded-details,
  .segmented-indicator {
    animation: none;
    transition: none;
  }

  .scheduler-post-card:hover {
    transform: none;
  }

  .scheduler-post-card:hover .card-image {
    transform: none;
  }
}
</style>

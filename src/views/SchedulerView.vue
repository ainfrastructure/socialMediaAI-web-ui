<template>
  <DashboardLayout>
    <div class="scheduler-view">
    <div class="container">
      <div class="header">
        <h1 class="title">{{ $t('scheduler.title') }}</h1>
        <p class="subtitle">{{ $t('scheduler.subtitle') }}</p>
      </div>

      <!-- Calendar Grid (always rendered) -->
      <BaseCard variant="glass" class="calendar-card">
        <!-- Loading Overlay -->
        <div v-if="loading" class="loading-overlay">
          <div class="spinner"></div>
        </div>

        <!-- Filters Accordion -->
        <CalendarFilters
          :platforms="availablePlatforms"
          :brands="businessesForFilter"
          v-model:selectedPlatforms="filters.platforms"
          v-model:selectedBrandIds="filters.brand_ids"
          @apply="applyFilters"
        />

        <!-- Calendar Navigation -->
        <CalendarHeader
          v-model:viewMode="viewMode"
          :period-label="currentPeriodLabel"
          @previous="previousPeriod"
          @next="nextPeriod"
        />

        <!-- Color Legend (hidden on mobile in day view) -->
        <CalendarLegend :class="{ 'hide-on-mobile-day': viewMode === 'day' }" />
        <div :class="['calendar-grid', `view-${viewMode}`]">
          <!-- Day headers (only show for month and week views) -->
          <template v-if="viewMode !== 'day'">
            <div
              v-for="day in displayedWeekDays"
              :key="day"
              class="calendar-day-header"
            >
              {{ day }}
            </div>
          </template>

          <!-- Calendar days -->
          <div
            v-for="(day, index) in displayedCalendarDays"
            :key="index"
            :class="[
              'calendar-day',
              {
                'other-month': day.isOtherMonth && viewMode === 'month' && !isPastDate(day.date),
                'past-date': isPastDate(day.date) && viewMode !== 'day',
                'future-date': !isPastDate(day.date) && !day.isToday && viewMode !== 'day',
                today: day.isToday,
                'has-posts': day.posts.length > 0,
                'day-view': viewMode === 'day',
              },
            ]"
            @click="selectDay(day)"
          >
            <div class="day-number">{{ viewMode === 'day' ? '' : day.day }}</div>

            <!-- Hover Actions Overlay (Month/Week view only) -->
            <div v-if="viewMode !== 'day' && !isPastDate(day.date)" class="day-hover-overlay">
              <div class="day-hover-actions">
                <button
                  class="hover-action-btn create-btn"
                  @click.stop="openCreatePostWizard(day)"
                  :title="$t('scheduler.createPost', 'Create Post')"
                >
                  <span class="material-symbols-outlined">add</span>
                  <span class="btn-label">{{ $t('common.create', 'Create') }}</span>
                </button>
                <button
                  v-if="day.posts.length > 0"
                  class="hover-action-btn view-btn"
                  @click.stop="selectDay(day)"
                  :title="$t('scheduler.viewPosts', 'View Posts')"
                >
                  <span class="material-symbols-outlined">visibility</span>
                  <span class="btn-label">{{ $t('common.view', 'View') }} ({{ day.posts.length }})</span>
                </button>
              </div>
            </div>

            <!-- Day View Header (hidden on mobile - info shown in CalendarHeader) -->
            <div v-if="viewMode === 'day'" class="day-view-header desktop-only">
              <h2 class="day-view-title">
                {{ formatSelectedDate(day) }}
                <span v-if="day.posts.length > 0" class="post-count">({{ day.posts.length }} {{ day.posts.length === 1 ? 'post' : 'posts' }})</span>
              </h2>
              <div class="day-view-actions">
                <BaseButton variant="primary" size="medium" @click.stop="openCreatePostWizard(day)">
                  ➕ Create Post
                </BaseButton>
              </div>
            </div>

            <!-- Mobile Day View Create Button -->
            <div v-if="viewMode === 'day'" class="mobile-day-create">
              <BaseButton variant="primary" size="large" full-width @click.stop="openCreatePostWizard(day)">
                <span class="material-symbols-outlined">add</span>
                {{ $t('scheduler.createPost', 'Create Post') }}
              </BaseButton>
            </div>

            <!-- Holidays -->
            <div v-if="day.holidays && day.holidays.length > 0" class="day-holidays">
              <!-- Day View: Show all holidays with details -->
              <div v-if="viewMode === 'day'" class="day-view-holidays">
                <div v-for="holiday in day.holidays" :key="holiday.name" class="day-holiday-card">
                  <div class="holiday-card-icon">{{ getHolidayEmoji(holiday) }}</div>
                  <div class="holiday-card-info">
                    <h4 class="holiday-card-name">{{ holiday.name }}</h4>
                    <p v-if="holiday.description" class="holiday-card-desc">
                      {{ holiday.description }}
                    </p>
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
                  {{ getHolidayEmoji(holiday) }}
                  {{
                    holiday.name.length > 20 ? holiday.name.substring(0, 20) + '...' : holiday.name
                  }}
                </div>
                <span v-if="day.holidays.length > 2" class="more-holidays">
                  +{{ day.holidays.length - 2 }} {{ $t('scheduler.moreHolidays') }}
                </span>
              </template>
            </div>

            <div v-if="day.posts.length > 0" class="day-posts">
              <!-- Day View: Expandable Table -->
              <div v-if="viewMode === 'day'" class="day-view-table">
                <!-- Table Header -->
                <div class="table-header">
                  <div class="th-post">{{ $t('scheduler.post') || 'Post' }}</div>
                  <div class="th-post-type">{{ $t('postType.label') || 'Post Type' }}</div>
                  <div class="th-platforms">{{ $t('dashboardNew.platforms') || 'Platforms' }}</div>
                  <div class="th-status">{{ $t('scheduler.status') || 'Status' }}</div>
                  <div class="th-brand">{{ $t('scheduler.restaurant') || 'Brand' }}</div>
                  <div class="th-expand"></div>
                </div>

                <!-- Table Body -->
                <div class="table-body">
                  <div
                    v-for="post in paginatedDayPosts(day.posts)"
                    :key="post.id"
                    class="table-row-wrapper"
                    :data-post-id="post.id"
                  >
                    <!-- Row -->
                    <div
                      :class="['table-row', { 'is-expanded': expandedPostId === post.id }]"
                      @click.stop="toggleExpandedPost(post.id)"
                    >
                      <!-- Post Column -->
                      <div class="td-post">
                        <img
                          v-if="post.media_url"
                          :src="getMediaUrl(post.media_url)"
                          class="post-thumb"
                          @error="(e: Event) => (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22><rect fill=%22%23333%22 width=%22100%22 height=%22100%22/></svg>'"
                        />
                        <div v-else class="post-thumb post-thumb-placeholder">📷</div>
                        <div class="post-info">
                          <div class="post-time-row">
                            <span class="post-time">{{ formatTime(post.scheduled_time) || '--:--' }}</span>
                            <span class="post-time-sep">•</span>
                            <span class="post-time-ago">{{ getPostTimeAgo(post) }}</span>
                          </div>
                          <p class="post-caption-preview">{{ truncateCaption(getPostCaption(post)) }}</p>
                        </div>
                      </div>

                      <!-- Post Type Column -->
                      <div class="td-post-type">
                        <PostTypeBadge
                          :post-type-settings="post.post_type_settings"
                          :platforms="getPostPlatforms(post)"
                          size="small"
                        />
                      </div>

                      <!-- Platforms Column -->
                      <div class="td-platforms">
                        <PlatformLogo
                          v-for="platform in getPostPlatforms(post)"
                          :key="platform"
                          :platform="platform as 'facebook' | 'instagram' | 'tiktok'"
                          :size="24"
                        />
                      </div>

                      <!-- Status Column -->
                      <div class="td-status">
                        <span :class="['status-badge', `status-${post.status || 'scheduled'}`]">
                          <span class="status-dot"></span>
                          {{
                            post.status === 'published' ? $t('dashboardNew.published') :
                            post.status === 'failed' ? $t('dashboardNew.failed') :
                            post.status === 'partial' ? $t('dashboardNew.partial') :
                            $t('dashboardNew.scheduled')
                          }}
                        </span>
                        <button
                          v-if="post.status === 'partial' || post.status === 'failed'"
                          class="retry-button"
                          :title="$t('common.retry')"
                          @click.stop="retryPost(post.id)"
                        >
                          <MaterialIcon icon="refresh" :size="16" />
                        </button>
                      </div>

                      <!-- Business Column -->
                      <div class="td-brand">
                        <span class="brand-name">{{ post.business_name || post.brand_name || '-' }}</span>
                      </div>

                      <!-- Expand Toggle -->
                      <div class="td-expand">
                        <span :class="['expand-icon', { 'is-expanded': expandedPostId === post.id }]">
                          ▾
                        </span>
                      </div>
                    </div>

                    <!-- Expanded Details -->
                    <div v-if="expandedPostId === post.id" class="expanded-details">
                      <div class="expanded-grid">
                        <!-- Preview -->
                        <div class="detail-section">
                          <h4 class="detail-label">{{ $t('scheduleModal.preview') || 'Preview' }}</h4>
                          <img
                            v-if="post.media_url"
                            :src="getMediaUrl(post.media_url)"
                            class="detail-preview-img"
                          />
                          <div v-else class="detail-preview-placeholder">{{ $t('scheduler.noMedia') || 'No media' }}</div>
                        </div>

                        <!-- Published At & Platforms -->
                        <div class="detail-section">
                          <h4 class="detail-label">{{ $t('scheduler.publishedAt') || 'Published At' }}</h4>
                          <p class="detail-value">{{ formatSelectedDate(day) }}</p>
                          <p class="detail-subvalue">{{ formatTime(post.scheduled_time) }} • {{ post.timezone || 'UTC' }}</p>

                          <h4 class="detail-label" style="margin-top: var(--space-lg)">{{ $t('dashboardNew.platforms') || 'Platforms' }}</h4>
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

                          <!-- Story expiry notice -->
                          <div v-if="post.post_type_settings && Object.values(post.post_type_settings).includes('story')" class="story-notice">
                            <span class="material-symbols-outlined notice-icon">schedule</span>
                            <span class="notice-text">{{ $t('postType.storyExpiryNotice', 'Stories expire after 24 hours') }}</span>
                          </div>

                          <!-- Error for failed posts -->
                          <div v-if="post.status === 'failed' && post.error_message" class="detail-error">
                            <h4 class="detail-label error-label">{{ $t('scheduler.error') || 'Error' }}</h4>
                            <p class="error-message">{{ post.error_message }}</p>
                          </div>
                        </div>

                        <!-- Caption -->
                        <div class="detail-section">
                          <div class="detail-label-row">
                            <h4 class="detail-label">{{ $t('scheduleModal.caption') || 'Caption' }}</h4>
                            <span class="char-count">{{ getPostCaption(post).length }} chars</span>
                          </div>
                          <div class="detail-caption-box">
                            {{ getPostCaption(post) || $t('scheduler.noCaption') || 'No caption' }}
                          </div>
                        </div>

                        <!-- Hashtags & Links -->
                        <div class="detail-section">
                          <h4 class="detail-label">{{ $t('scheduleModal.hashtags') || 'Hashtags' }}</h4>
                          <div v-if="getPostHashtags(post).length > 0" class="detail-hashtags">
                            <span
                              v-for="tag in getPostHashtags(post)"
                              :key="tag"
                              class="hashtag-chip"
                            >
                              {{ tag.startsWith('#') ? tag : '#' + tag }}
                            </span>
                          </div>
                          <p v-else class="detail-empty">{{ $t('scheduler.noHashtags') || 'No hashtags' }}</p>

                          <!-- View Post Links -->
                          <div v-if="post.status === 'published' && post.platform_post_urls && Object.keys(post.platform_post_urls).length > 0" class="detail-links">
                            <h4 class="detail-label" style="margin-top: var(--space-lg)">{{ $t('scheduler.viewPost') || 'View Post' }}</h4>
                            <a
                              v-for="(url, platform) in (post.platform_post_urls as Record<string, string>)"
                              :key="platform"
                              :href="url"
                              target="_blank"
                              rel="noopener noreferrer"
                              :class="['view-link', `link-${platform}`]"
                              @click.stop
                            >
                              <PlatformLogo :platform="(platform as string) as 'facebook' | 'instagram' | 'tiktok'" :size="14" />
                              {{ $t('scheduler.viewOn') || 'View on' }} {{ capitalizeFirst(platform as string) }}
                              <span class="link-arrow">↗</span>
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Pagination Controls for Day View -->
              <div v-if="viewMode === 'day' && getTotalPages(day.posts) > 1" class="day-view-pagination">
                <button
                  class="pagination-btn"
                  :disabled="dayViewPage === 1"
                  @click.stop="dayViewPage--"
                >
                  ← {{ $t('common.previous') || 'Previous' }}
                </button>
                <span class="pagination-info">
                  {{ $t('common.page') || 'Page' }} {{ dayViewPage }} {{ $t('common.of') || 'of' }} {{ getTotalPages(day.posts) }}
                </span>
                <button
                  class="pagination-btn"
                  :disabled="dayViewPage === getTotalPages(day.posts)"
                  @click.stop="dayViewPage++"
                >
                  {{ $t('common.next') || 'Next' }} →
                </button>
              </div>

              <!-- Month/Week View: Show compact indicators -->
              <template v-else>
                <div
                  v-for="post in day.posts.slice(0, 3)"
                  :key="post.id"
                  :class="['post-indicator', post.status ? `status-${post.status}` : `platform-${post.platform}`]"
                  :title="`${formatTime(post.scheduled_time) || $t('scheduler.noTime')} - ${post.post_text || $t('scheduler.scheduledPosts')}`"
                  @click.stop="openPostFromIndicator(day, post)"
                >
                  <div class="post-indicator-thumb">
                    <img
                      v-if="post.media_url"
                      :src="getMediaUrl(post.media_url)"
                      class="post-indicator-img"
                      @error="(e: Event) => (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2248%22 height=%2248%22><rect fill=%22%23e8e1d5%22 width=%2248%22 height=%2248%22/><text x=%2224%22 y=%2228%22 text-anchor=%22middle%22 font-size=%2220%22>📷</text></svg>'"
                    />
                    <div v-else class="post-indicator-placeholder">📷</div>
                  </div>
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

      <!-- Selected Day Detail / Upcoming Posts Panel -->
      <SelectedDayDetail
        ref="selectedDayDetailRef"
        :day="selectedDayWithFilteredPosts"
        :upcoming-posts="upcomingPosts"
        :active-tab="bottomPanelTab"
        :posts-per-page="postsPerPage"
        :hide-tab-bar="viewMode === 'day'"
        :class="{ 'day-view-panel': viewMode === 'day' }"
        @view="viewPostDetail"
        @edit="editScheduledPost"
        @delete="cancelPost"
        @create="openCreatePostWizard"
        @tab-change="handleBottomPanelTabChange"
        @save="saveScheduledPost"
        @retry="handleRetryPost"
      />

    </div>

    <!-- Pick Post Modal -->
    <PickPostModal
      v-model="showPickPostModal"
      :selected-date="selectedDateForScheduling"
      :brand-id="selectedBrandIdForPosts"
      @scheduled="handlePostScheduled"
    />

    <!-- Create Post Wizard Modal -->
    <CreatePostWizard
      v-model="showCreatePostWizard"
      :selected-date="selectedDateForScheduling"
      @select="selectCreationMethod"
    />

    <!-- Business Selector Modal (shown when user has multiple brands) -->
    <BrandSelectorModal
      v-model="showBusinessSelector"
      :brands="brands"
      :current-id="preferencesStore.selectedBrandId || undefined"
      :show-manage-button="true"
      @select="handleBusinessSelected"
    />

    <!-- Post Detail Modal -->
    <PostDetailModal
      v-model="showPostDetailModal"
      :post="selectedPostForDetail"
      @edit="handlePostDetailEdit"
      @delete="handlePostDetailDelete"
      @close="closePostDetailModal"
    />

    <!-- Edit Scheduled Post Modal -->
    <EditScheduledPostModal
      v-model="showEditModal"
      :post="postToEdit"
      @save="handleSaveEdit"
    />

    <!-- Confirmation Modal -->
    <ConfirmModal
      v-model="showConfirmModal"
      :title="confirmModalConfig.title"
      :message="confirmModalConfig.message"
      :confirm-text="confirmModalConfig.confirmText"
      :cancel-text="confirmModalConfig.cancelText"
      :type="confirmModalConfig.type"
      :loading="cancelLoading"
      @confirm="confirmModalConfig.onConfirm"
    />

    <!-- Retry Publishing Progress Modal -->
    <PublishingProgressModal
      :visible="showRetryModal"
      :platforms="retryPublishingProgress"
      :is-complete="retryPublishingComplete"
      @close="showRetryModal = false"
    />

    <!-- Toast Notification -->
    <Toast
      v-model="showToast"
      :message="toastMessage"
      :type="toastType"
      :duration="4000"
    />
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { debugLog, errorLog, warnLog } from '@/utils/debug'

import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import DashboardLayout from '../components/DashboardLayout.vue'
import BaseCard from '../components/BaseCard.vue'
import BaseButton from '../components/BaseButton.vue'
import PickPostModal from '../components/PickPostModal.vue'
import EditScheduledPostModal from '../components/EditScheduledPostModal.vue'
import Toast from '../components/Toast.vue'
import ConfirmModal from '../components/ConfirmModal.vue'
import PostDetailModal from '../components/PostDetailModal.vue'
import BrandSelectorModal from '../components/BrandSelectorModal.vue'
import PublishingProgressModal from '../components/PublishingProgressModal.vue'
import { CalendarHeader, CalendarLegend, CreatePostWizard, CalendarFilters, SelectedDayDetail } from '../components/scheduler'
import PlatformLogo from '../components/PlatformLogo.vue'
import PostTypeBadge from '../components/PostTypeBadge.vue'
import { api } from '../services/api'
import { schedulerService } from '../services/schedulerService'
import { API_URL } from '../services/apiBase'
import { useBrandsStore } from '../stores/brands'
import { usePreferencesStore } from '../stores/preferences'
import { useFacebookStore } from '../stores/facebook'
import { useInstagramStore } from '../stores/instagram'
import { useNotificationStore } from '../stores/notifications'

const router = useRouter()
const preferencesStore = usePreferencesStore()
const { t } = useI18n()
const brandsStore = useBrandsStore()

// Calendar state
const currentDate = ref(new Date())
const selectedDay = ref<any>(null)
const scheduledPosts = ref<any[]>([])
const allScheduledPosts = ref<any[]>([]) // Unfiltered posts for "Upcoming" tab
const holidays = ref<any[]>([])
const loading = ref(false)
const showPickPostModal = ref(false)
const selectedDateForScheduling = ref<string | null>(null)
const selectedCountry = ref('NO') // Norway as default
const showPostDetailModal = ref(false)
const selectedPostForDetail = ref<any>(null)
const showEditModal = ref(false)
const postToEdit = ref<any>(null)
const showRetryModal = ref(false)
const retryPublishingProgress = ref<Array<{ platform: string; status: 'pending' | 'publishing' | 'success' | 'error'; url?: string; error?: string }>>([])
const retryPublishingComplete = ref(false)
const postToRetry = ref<any>(null)
const showCreatePostWizard = ref(false)
const wizardStep = ref(1) // 1 = Choose Method, 2 = Create/Select Content
const selectedCreationMethod = ref<'saved' | 'new' | null>(null)
const pendingCreationMethod = ref<'saved' | 'new' | null>(null)
const selectedBrandIdForPosts = ref<string | undefined>(undefined)
const showBusinessSelector = ref(false)
const dayViewPage = ref(1)
const postsPerPage = 5
const expandedPostId = ref<string | number | null>(null)
const bottomPanelTab = ref<'day' | 'upcoming'>('day')
const selectedDayDetailRef = ref<any>(null)

// Toggle expanded row with scroll into view
const toggleExpandedPost = (postId: string | number, _event?: Event) => {
  const isExpanding = expandedPostId.value !== postId
  expandedPostId.value = expandedPostId.value === postId ? null : postId

  // Scroll expanded row into view after DOM updates
  if (isExpanding) {
    nextTick(() => {
      const expandedElement = document.querySelector(`[data-post-id="${postId}"]`)
      if (expandedElement) {
        expandedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    })
  }
}

// Open a specific post from the calendar indicator
const openPostFromIndicator = (day: any, post: any) => {
  // Select the day
  selectedDay.value = day
  // Switch to day tab
  bottomPanelTab.value = 'day'
  // Expand the specific post
  expandedPostId.value = post.id

  // Scroll to the bottom panel and the post
  nextTick(() => {
    // First scroll to the panel
    if (selectedDayDetailRef.value?.$el) {
      selectedDayDetailRef.value.$el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    // Then scroll to the specific expanded post
    setTimeout(() => {
      const expandedElement = document.querySelector(`[data-post-id="${post.id}"]`)
      if (expandedElement) {
        expandedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    }, 300)
  })
}

// Toast and confirmation state
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref<'success' | 'error' | 'info' | 'warning'>('info')
const showConfirmModal = ref(false)
const confirmModalConfig = ref({
  title: '',
  message: '',
  confirmText: '',
  cancelText: '',
  type: 'info' as 'info' | 'warning' | 'danger' | 'success',
  onConfirm: () => {},
})
const cancelLoading = ref(false)
const postIdToCancel = ref<string | null>(null)
const viewMode = ref<'month' | 'week' | 'day'>('month')

// Filters (now using arrays for multi-select)
const filters = ref({
  platforms: [] as string[],
  brand_ids: [] as string[],
})

// Businesses for filters and display
const brands = computed(() => brandsStore.brands)
const selectedBrand = computed(() => {
  if (!preferencesStore.selectedBrandId) return null
  return brands.value.find(brand => brand.id === preferencesStore.selectedBrandId) || null
})

const availablePlatforms = [
  { id: 'facebook', name: 'Facebook' },
  { id: 'instagram', name: 'Instagram' },
  { id: 'tiktok', name: 'TikTok' },
]

// Transform brands for CalendarFilters component
const businessesForFilter = computed(() => {
  return brands.value.map(b => ({
    id: String(b.id),
    name: b.name
  }))
})

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

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
    const postsForDay = scheduledPosts.value.filter((post) => post.scheduled_date === dateString)
    const holidaysForDay = holidays.value.filter((holiday) => holiday.date === dateString)

    return [
      {
        day,
        date,
        isOtherMonth: false,
        isToday: isToday(date),
        posts: postsForDay,
        holidays: holidaysForDay,
      },
    ]
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
  // Adjust for Monday start (Monday = 0, Sunday = 6)
  const diff = d.getDate() - ((day + 6) % 7)
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
      currentDate.value.getDate() - 1,
    )
  } else if (viewMode.value === 'week') {
    currentDate.value = new Date(
      currentDate.value.getFullYear(),
      currentDate.value.getMonth(),
      currentDate.value.getDate() - 7,
    )
  } else {
    currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1)
  }
  fetchScheduledPosts()
  fetchHolidays()
}

const nextPeriod = () => {
  if (viewMode.value === 'day') {
    currentDate.value = new Date(
      currentDate.value.getFullYear(),
      currentDate.value.getMonth(),
      currentDate.value.getDate() + 1,
    )
  } else if (viewMode.value === 'week') {
    currentDate.value = new Date(
      currentDate.value.getFullYear(),
      currentDate.value.getMonth(),
      currentDate.value.getDate() + 7,
    )
  } else {
    currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1)
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

// Helper to format date as YYYY-MM-DD
const formatDateString = (date: Date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()

  // Get first day of month and last day of month
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  // Get days from previous month to fill the first week (Monday = 0, Sunday = 6)
  const startingDayOfWeek = (firstDay.getDay() + 6) % 7
  const prevMonthLastDay = new Date(year, month, 0)
  const prevMonthDays = prevMonthLastDay.getDate()

  const days = []

  // Helper to get posts and holidays for a specific date
  const getDataForDate = (date: Date) => {
    const dateString = formatDateString(date)
    const postsForDay = scheduledPosts.value.filter((post) => {
      const postDate = post.scheduled_date || ''
      return postDate === dateString
    })
    const holidaysForDay = holidays.value.filter((holiday) => {
      const holidayDate = holiday.date ? holiday.date.split('T')[0] : ''
      return holidayDate === dateString
    })
    return { postsForDay, holidaysForDay }
  }

  // Previous month days
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const day = prevMonthDays - i
    const date = new Date(year, month - 1, day)
    const { postsForDay, holidaysForDay } = getDataForDate(date)

    days.push({
      day,
      date,
      isOtherMonth: true,
      isToday: false,
      posts: postsForDay,
      holidays: holidaysForDay,
    })
  }

  // Current month days
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = new Date(year, month, day)
    const { postsForDay, holidaysForDay } = getDataForDate(date)

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
    const date = new Date(year, month + 1, day)
    const { postsForDay, holidaysForDay } = getDataForDate(date)

    days.push({
      day,
      date,
      isOtherMonth: true,
      isToday: false,
      posts: postsForDay,
      holidays: holidaysForDay,
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

const isPastDate = (date: Date) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const checkDate = new Date(date)
  checkDate.setHours(0, 0, 0, 0)
  return checkDate < today
}

const selectDay = (day: any) => {
  // Only allow selecting today or future dates (even from other months)
  if (!isPastDate(day.date)) {
    selectedDay.value = day
    // Auto-switch to day tab when selecting a date
    bottomPanelTab.value = 'day'

    // If day has no posts, open the create post wizard directly
    if (!day.posts || day.posts.length === 0) {
      openCreatePostWizard(day)
    } else {
      // Scroll to the posts table when day has posts
      nextTick(() => {
        if (selectedDayDetailRef.value?.$el) {
          selectedDayDetailRef.value.$el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      })
    }
  }
}

// Computed property to get the selected day with current filtered posts
const selectedDayWithFilteredPosts = computed(() => {
  if (!selectedDay.value) return null

  // Find the day in the current calendar (which has filtered posts)
  const currentDay = displayedCalendarDays.value.find((day: any) => {
    return day.date && selectedDay.value.date &&
      day.date.getTime() === selectedDay.value.date.getTime()
  })

  return currentDay || selectedDay.value
})

// Computed property for upcoming posts (all future scheduled posts - ignores calendar filters)
const upcomingPosts = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  // Use allScheduledPosts (unfiltered) for the Upcoming tab
  return allScheduledPosts.value
    .filter((post) => {
      // Only show scheduled posts (not published or failed)
      if (post.status && post.status !== 'scheduled') return false
      // Only show posts from today onwards
      return post.scheduled_date >= todayString
    })
    .sort((a, b) => {
      // Sort by date then time
      if (a.scheduled_date !== b.scheduled_date) {
        return a.scheduled_date.localeCompare(b.scheduled_date)
      }
      return (a.scheduled_time || '').localeCompare(b.scheduled_time || '')
    })
})

// Handle tab change from SelectedDayDetail
const handleBottomPanelTabChange = (tab: 'day' | 'upcoming') => {
  bottomPanelTab.value = tab
}

const formatSelectedDate = (day: any) => {
  return day.date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

// Pagination helpers
const getTotalPages = (posts: any[]) => {
  return Math.ceil(posts.length / postsPerPage)
}

const paginatedDayPosts = (posts: any[]) => {
  const start = (dayViewPage.value - 1) * postsPerPage
  const end = start + postsPerPage
  return posts.slice(start, end)
}

// Reset pagination when changing views
watch(viewMode, () => {
  dayViewPage.value = 1
})

watch(currentDate, () => {
  dayViewPage.value = 1
})

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

const formatTime = (time: string | null) => {
  if (!time) return null
  const [hours, minutes] = time.split(':')
  return `${hours}:${minutes}`
}

// Helper functions for expandable table
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
    return `${minutes} ${minutes > 1 ? t('common.minutesAgo') || 'minutes ago' : t('common.minuteAgo') || 'minute ago'}`
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours} ${hours > 1 ? t('common.hoursAgo') || 'hours ago' : t('common.hourAgo') || 'hour ago'}`
  }
  const days = Math.floor(diffInSeconds / 86400)
  return `${days} ${days > 1 ? t('common.daysAgo') || 'days ago' : t('common.dayAgo') || 'day ago'}`
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
  const hashtags = post.hashtags || post.posts?.hashtags || post.favorite?.hashtags || []
  if (Array.isArray(hashtags)) return hashtags
  if (typeof hashtags === 'string') return hashtags.split(/\s+/).filter(Boolean)
  return []
}

const getPostCaption = (post: any): string => {
  return post.post_text || post.caption || post.posts?.caption || ''
}

const truncateCaption = (text: string, maxLength: number = 60): string => {
  if (!text) return ''
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

const capitalizeFirst = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

const detectContentTypeFromUrl = (mediaUrl: string): string => {
  if (!mediaUrl) return 'image'

  const url = mediaUrl.toLowerCase()
  const videoExtensions = ['.mp4', '.mov', '.avi', '.webm', '.mkv', '.flv', '.wmv']
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg']

  // Check for video extensions
  if (videoExtensions.some((ext) => url.includes(ext))) {
    return 'video'
  }

  // Check for image extensions
  if (imageExtensions.some((ext) => url.includes(ext))) {
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

    // Check if filters are active
    const hasFilters = filters.value.platforms.length > 0 || filters.value.brand_ids.length > 0

    // Fetch current month posts (with filters for calendar)
    const response = await api.getScheduledPosts({
      month,
      year,
      platforms: filters.value.platforms.length > 0 ? filters.value.platforms : undefined,
      brand_ids: filters.value.brand_ids.length > 0 ? filters.value.brand_ids : undefined,
    })

    // Also fetch adjacent months for calendar display (previous and next month days shown in grid)
    const prevMonth = month === 1 ? 12 : month - 1
    const prevYear = month === 1 ? year - 1 : year
    const nextMonth = month === 12 ? 1 : month + 1
    const nextYear = month === 12 ? year + 1 : year

    const [prevResponse, nextResponse] = await Promise.all([
      api.getScheduledPosts({
        month: prevMonth,
        year: prevYear,
        platforms: filters.value.platforms.length > 0 ? filters.value.platforms : undefined,
        brand_ids: filters.value.brand_ids.length > 0 ? filters.value.brand_ids : undefined,
      }),
      api.getScheduledPosts({
        month: nextMonth,
        year: nextYear,
        platforms: filters.value.platforms.length > 0 ? filters.value.platforms : undefined,
        brand_ids: filters.value.brand_ids.length > 0 ? filters.value.brand_ids : undefined,
      }),
    ])

    // If filters are active, also fetch unfiltered posts for "Upcoming" tab
    const unfilteredPosts: any[] = []
    if (hasFilters) {
      const [unfilteredCurrent, unfilteredPrev, unfilteredNext] = await Promise.all([
        api.getScheduledPosts({ month, year }),
        api.getScheduledPosts({ month: prevMonth, year: prevYear }),
        api.getScheduledPosts({ month: nextMonth, year: nextYear }),
      ])
      if (unfilteredCurrent.success) unfilteredPosts.push(...(unfilteredCurrent.data?.scheduled_posts || []))
      if (unfilteredPrev.success) unfilteredPosts.push(...(unfilteredPrev.data?.scheduled_posts || []))
      if (unfilteredNext.success) unfilteredPosts.push(...(unfilteredNext.data?.scheduled_posts || []))
    }

    // Combine posts from all three months (current, previous, next)
    const allPosts: any[] = []

    if (response.success) {
      allPosts.push(...(response.data?.scheduled_posts || []))
    }
    if (prevResponse.success) {
      allPosts.push(...(prevResponse.data?.scheduled_posts || []))
    }
    if (nextResponse.success) {
      allPosts.push(...(nextResponse.data?.scheduled_posts || []))
    }

    // Remove duplicates by post id
    const uniquePosts = allPosts.filter((post, index, self) =>
      index === self.findIndex((p) => p.id === post.id)
    )

    // Fix content_type based on media_url if it's incorrect
    scheduledPosts.value = uniquePosts.map((post: any) => {
        // Try to find the media URL from various possible fields
        let mediaUrl = post.media_url || post.image_url || post.video_url || post.content_url
        let postText = post.post_text || post.caption
        let contentType = post.content_type
        let platform = post.platform
        let businessName = post.business_name || post.brands?.name || post.brand?.name
        let brandName = post.brand_name

        // Check if this is a scheduled post with joined posts data
        if (!mediaUrl && post.posts) {
          mediaUrl =
            post.posts.image_url ||
            post.posts.video_url
          postText = postText || post.posts.caption
          contentType = contentType || post.posts.content_type
          platform = platform || post.posts.platform_targets?.[0]
          businessName = businessName || post.posts.brands?.name
        }

        // If content_type is still missing, detect from URL
        const detectedType = contentType || detectContentTypeFromUrl(mediaUrl || '')

        // Derive scheduled_date from scheduled_time (TIMESTAMPTZ)
        const scheduledDate = post.scheduled_time ? post.scheduled_time.split('T')[0] : post.scheduled_date

        return {
          ...post,
          scheduled_date: scheduledDate,
          media_url: mediaUrl,
          post_text: postText,
          content_type: detectedType,
          platform: platform,
          business_name: businessName || brandName,
          brand_name: brandName,
        }
      })

    // Process unfiltered posts for "Upcoming" tab (same normalization)
    if (unfilteredPosts.length > 0) {
      const uniqueUnfiltered = unfilteredPosts.filter((post, index, self) =>
        index === self.findIndex((p) => p.id === post.id)
      )
      allScheduledPosts.value = uniqueUnfiltered.map((post: any) => {
        let mediaUrl = post.media_url || post.image_url || post.video_url || post.content_url
        let postText = post.post_text || post.caption
        let contentType = post.content_type
        let platform = post.platform
        let businessName = post.business_name || post.brands?.name || post.brand?.name
        let brandName = post.brand_name

        if (!mediaUrl && post.posts) {
          mediaUrl = post.posts.image_url || post.posts.video_url
          postText = postText || post.posts.caption
          contentType = contentType || post.posts.content_type
          platform = platform || post.posts.platform_targets?.[0]
          businessName = businessName || post.posts.brands?.name
        }

        const detectedType = contentType || detectContentTypeFromUrl(mediaUrl || '')
        const scheduledDate = post.scheduled_time ? post.scheduled_time.split('T')[0] : post.scheduled_date

        return {
          ...post,
          scheduled_date: scheduledDate,
          media_url: mediaUrl,
          post_text: postText,
          content_type: detectedType,
          platform: platform,
          business_name: businessName || brandName,
          brand_name: brandName,
        }
      })
    } else {
      // No filters active, use the same posts
      allScheduledPosts.value = scheduledPosts.value
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
  postToEdit.value = post
  showEditModal.value = true
  // Close detail modal if open
  showPostDetailModal.value = false
}

const handleSaveEdit = async (updates: any) => {
  if (!postToEdit.value) return

  try {
    loading.value = true
    const response = await api.updateScheduledPost(postToEdit.value.id, updates)

    if (response.success) {
      // Close modal first
      showEditModal.value = false
      postToEdit.value = null

      // Then refresh the scheduled posts to update the calendar
      await fetchScheduledPosts()
    } else {
      throw new Error(response.error || 'Failed to update post')
    }
  } catch (error: any) {
    errorLog('Error updating post:', error)
    alert(error.message || 'Failed to update post')
  } finally {
    loading.value = false
  }
}

const showCancelConfirmation = (postId: string) => {
  postIdToCancel.value = postId
  confirmModalConfig.value = {
    title: 'Cancel Scheduled Post',
    message: 'Are you sure you want to cancel this scheduled post? This action cannot be undone.',
    confirmText: 'Yes, Cancel Post',
    cancelText: 'Keep Post',
    type: 'danger',
    onConfirm: confirmCancelPost,
  }
  showConfirmModal.value = true
}

// Retry a failed or partial post
const retryPost = async (postId: string) => {
  try {
    loading.value = true
    const response = await schedulerService.retryScheduledPost(postId)

    if (response.success) {
      toastMessage.value = 'Post queued for retry. It will be processed within 1 minute.'
      toastType.value = 'success'
      showToast.value = true

      // Refresh the scheduled posts
      await fetchScheduledPosts()
    } else {
      throw new Error(response.error || 'Failed to retry post')
    }
  } catch (error: any) {
    errorLog('Error retrying post:', error)
    toastMessage.value = error.message || 'Failed to retry post'
    toastType.value = 'error'
    showToast.value = true
  } finally {
    loading.value = false
  }
}

const confirmCancelPost = async () => {
  if (!postIdToCancel.value) return

  cancelLoading.value = true

  try {
    const response = await api.cancelScheduledPost(postIdToCancel.value)

    if (response.success) {
      // Keep the currently selected day to reload its posts
      const currentSelectedDay = selectedDay.value

      // Refresh posts
      await fetchScheduledPosts()

      // Re-select the same day if it was selected
      if (currentSelectedDay) {
        const year = currentSelectedDay.date.getFullYear()
        const month = String(currentSelectedDay.date.getMonth() + 1).padStart(2, '0')
        const day = String(currentSelectedDay.date.getDate()).padStart(2, '0')
        const formattedDate = `${year}-${month}-${day}`

        // Find and re-select the day
        const updatedDay = displayedCalendarDays.value.find(
          (d: any) => {
            const dYear = d.date.getFullYear()
            const dMonth = String(d.date.getMonth() + 1).padStart(2, '0')
            const dDay = String(d.date.getDate()).padStart(2, '0')
            return `${dYear}-${dMonth}-${dDay}` === formattedDate
          }
        )

        if (updatedDay) {
          selectedDay.value = updatedDay
        }
      }

      // Show success toast
      toastMessage.value = 'Post canceled successfully'
      toastType.value = 'success'
      showToast.value = true

      // Close the confirm modal
      showConfirmModal.value = false
      postIdToCancel.value = null
    } else {
      throw new Error(response.error || 'Failed to cancel post')
    }
  } catch (error: any) {
    toastMessage.value = error.message || 'Failed to cancel post'
    toastType.value = 'error'
    showToast.value = true
  } finally {
    cancelLoading.value = false
  }
}

const cancelPost = showCancelConfirmation

// Save edited scheduled post (from inline edit in SelectedDayDetail)
const saveScheduledPost = async (postId: string, data: any) => {
  try {
    const updatePayload: { scheduled_time?: string; timezone?: string; platform_status?: string } = {}

    // Backend accepts: scheduled_time (TIMESTAMPTZ), timezone, platform_status
    if (data.scheduled_time) updatePayload.scheduled_time = data.scheduled_time
    if (data.timezone) updatePayload.timezone = data.timezone
    if (data.platform_status) updatePayload.platform_status = data.platform_status

    const response = await schedulerService.updateScheduledPost(postId, updatePayload)

    if (response.success) {
      toastMessage.value = 'Post updated successfully'
      toastType.value = 'success'
      showToast.value = true

      // Refresh the posts to show updated data
      await fetchScheduledPosts()
    } else {
      throw new Error(response.error || 'Failed to update post')
    }
  } catch (error: any) {
    toastMessage.value = error.message || 'Failed to update post'
    toastType.value = 'error'
    showToast.value = true
  } finally {
    // Reset the saving state in the child component
    if (selectedDayDetailRef.value) {
      selectedDayDetailRef.value.savingPost = false
    }
  }
}

// Open the create post wizard - shows choice between saved posts or create new
const openCreatePostWizard = (day: any) => {
  const year = day.date.getFullYear()
  const month = String(day.date.getMonth() + 1).padStart(2, '0')
  const dayNum = String(day.date.getDate()).padStart(2, '0')
  const dateString = `${year}-${month}-${dayNum}`
  selectedDateForScheduling.value = dateString

  // Show the wizard to let user choose between saved posts or create new
  showCreatePostWizard.value = true
}

// Select creation method in wizard
const selectCreationMethod = (method: 'saved' | 'new') => {
  selectedCreationMethod.value = method
  showCreatePostWizard.value = false

  if (method === 'new') {
    const preferredBusinessId = filters.value.brand_ids.length === 1
      ? filters.value.brand_ids[0]
      : (preferencesStore.selectedBrandId || undefined)

    if (preferredBusinessId) {
      proceedWithCreationMethod(method, preferredBusinessId)
    } else if (brands.value.length === 1) {
      proceedWithCreationMethod(method, brands.value[0].id)
    } else {
      pendingCreationMethod.value = method
      showBusinessSelector.value = true
    }
    return
  }

  // Saved post flow uses brand selection
  if (filters.value.brand_ids.length === 1) {
    selectedBrandIdForPosts.value = filters.value.brand_ids[0]
  } else {
    selectedBrandIdForPosts.value = preferencesStore.selectedBrandId || undefined
  }
  showPickPostModal.value = true
}

// Proceed with the creation method after brand selection (or if only one brand)
const proceedWithCreationMethod = (method: 'saved' | 'new', brandId?: string) => {
  if (method === 'new') {
    // Always start in easy mode when creating new content
    preferencesStore.setCreationMode('easy', true)
    // Go to posts create page with optional brand ID
    const url = `/posts/create?scheduleDate=${selectedDateForScheduling.value}`
    if (brandId) {
      preferencesStore.setSelectedBrand(brandId)
    }
    router.push(url)
  }
}

// Handle brand selection from modal
const handleBusinessSelected = (brand: any) => {
  showBusinessSelector.value = false
  if (pendingCreationMethod.value) {
    proceedWithCreationMethod(pendingCreationMethod.value, brand.id)
    pendingCreationMethod.value = null
  }
}

const handlePostScheduled = async () => {
  // Keep the currently selected day to reload its posts
  const currentSelectedDate = selectedDateForScheduling.value

  // Refresh posts
  await fetchScheduledPosts()

  // Re-select the same day if it was selected to show the new post
  if (currentSelectedDate) {
    // Find and re-select the day from the updated calendar data
    const updatedDay = displayedCalendarDays.value.find(
      (d: any) => {
        const dYear = d.date.getFullYear()
        const dMonth = String(d.date.getMonth() + 1).padStart(2, '0')
        const dDay = String(d.date.getDate()).padStart(2, '0')
        return `${dYear}-${dMonth}-${dDay}` === currentSelectedDate
      }
    )

    if (updatedDay) {
      selectedDay.value = updatedDay
    }
  }

  showPickPostModal.value = false
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

// Handle edit from PostDetailModal
const handlePostDetailEdit = (post: any) => {
  closePostDetailModal()
  editScheduledPost(post)
}

// Handle delete from PostDetailModal
const handlePostDetailDelete = (post: any) => {
  cancelPost(post.id)
  closePostDetailModal()
}

// Handle retry failed/partial post
const handleRetryPost = async (post: any) => {
  postToRetry.value = post

  // Get only the failed platforms from platform_statuses
  const failedPlatforms: string[] = []
  if (post.platform_statuses) {
    Object.entries(post.platform_statuses).forEach(([platform, status]: [string, any]) => {
      if (status.status === 'failed') {
        failedPlatforms.push(platform)
      }
    })
  }

  if (failedPlatforms.length === 0) {
    toastMessage.value = 'No failed platforms to retry'
    toastType.value = 'error'
    showToast.value = true
    return
  }

  // Initialize publishing progress for failed platforms only
  retryPublishingProgress.value = failedPlatforms.map(platform => ({
    platform,
    status: 'pending' as const,
    url: undefined,
    error: undefined
  }))
  retryPublishingComplete.value = false
  showRetryModal.value = true

  // Get the post content details from joined posts data
  const postContent = post.posts
  if (!postContent) {
    toastMessage.value = 'Post content not found'
    toastType.value = 'error'
    showToast.value = true
    return
  }

  const message = postContent.caption || ''
  const results: Array<{ platform: string; success: boolean; url?: string; postId?: string; error?: string }> = []
  const postUrls: Record<string, string> = {}

  // Import stores
  const facebookStore = useFacebookStore()
  const instagramStore = useInstagramStore()
  const notificationStore = useNotificationStore()

  // Publish to each failed platform
  for (const platform of failedPlatforms) {
    const progressItem = retryPublishingProgress.value.find(p => p.platform === platform)
    if (progressItem) {
      progressItem.status = 'publishing'
    }

    if (platform === 'facebook') {
      // Get Facebook page IDs from platform_settings
      const pageIds = post.platform_settings?.facebook || []

      for (const pageId of pageIds) {
        const selectedPage = facebookStore.connectedPages.find(p => p.pageId === pageId)
        if (!selectedPage) continue

        try {
          const hasVideo = !!postContent.video_url
          const isVideo = hasVideo || postContent.content_type === 'video'
          const videoUrl = postContent.video_url || postContent.image_url
          const postType = (post.post_type_settings?.facebook || 'feed') as 'feed' | 'story' | 'reel' | 'carousel'
          const response = await api.postToFacebook(
            selectedPage.pageId,
            message,
            isVideo ? undefined : postContent.image_url,
            isVideo ? videoUrl : undefined,
            isVideo ? 'video' : 'image',
            postType
          )

          const postUrl = (response as any).postUrl || response.data?.postUrl
          if (response.success && postUrl) {
            results.push({ platform: 'facebook', success: true, url: postUrl })
            postUrls.facebook = postUrl
            if (progressItem) {
              progressItem.status = 'success'
              progressItem.url = postUrl
            }
          } else {
            const errorMsg = response.error || 'Failed to publish'
            results.push({ platform: 'facebook', success: false, error: errorMsg })
            if (progressItem) {
              progressItem.status = 'error'
              progressItem.error = errorMsg
            }
          }
        } catch (err: any) {
          const errorMsg = err.message || 'Failed to publish'
          results.push({ platform: 'facebook', success: false, error: errorMsg })
          if (progressItem) {
            progressItem.status = 'error'
            progressItem.error = errorMsg
          }
        }
      }
    } else if (platform === 'instagram') {
      // Get Instagram account IDs from platform_settings
      const accountIds = post.platform_settings?.instagram || []

      for (const accountId of accountIds) {
        const selectedAccount = instagramStore.connectedAccounts.find(a => a.instagramAccountId === accountId)
        if (!selectedAccount) continue

        try {
          const hasVideo = !!postContent.video_url
          const isVideo = hasVideo || postContent.content_type === 'video'
          const videoUrl = postContent.video_url || postContent.image_url
          const igPostType = (post.post_type_settings?.instagram || 'feed') as 'feed' | 'story' | 'reel' | 'carousel'
          const response = await api.postToInstagram(
            selectedAccount.instagramAccountId,
            message,
            isVideo ? undefined : postContent.image_url,
            isVideo ? videoUrl : undefined,
            isVideo ? 'video' : 'image',
            igPostType
          )

          const postUrl = (response as any).postUrl || response.data?.postUrl
          if (response.success && postUrl) {
            results.push({ platform: 'instagram', success: true, url: postUrl })
            postUrls.instagram = postUrl
            if (progressItem) {
              progressItem.status = 'success'
              progressItem.url = postUrl
            }
          } else {
            const errorMsg = response.error || 'Failed to publish'
            results.push({ platform: 'instagram', success: false, error: errorMsg })
            if (progressItem) {
              progressItem.status = 'error'
              progressItem.error = errorMsg
            }
          }
        } catch (err: any) {
          const errorMsg = err.message || 'Failed to publish'
          results.push({ platform: 'instagram', success: false, error: errorMsg })
          if (progressItem) {
            progressItem.status = 'error'
            progressItem.error = errorMsg
          }
        }
      }
    }
  }

  // Mark retry as complete
  retryPublishingComplete.value = true

  // Update the database with new platform_statuses
  try {
    // Merge old successful platforms with new retry results
    const allPlatforms = [...post.platforms]
    const platform_statuses = { ...post.platform_statuses }
    const updatedPlatformPostIds = { ...post.platform_post_ids }
    const updatedPlatformPostUrls = { ...post.platform_post_urls }

    // Update statuses for retried platforms
    for (const result of results) {
      platform_statuses[result.platform] = {
        status: result.success ? 'success' : 'failed',
        post_id: result.postId || null,
        url: result.url || null,
        error: result.error || null
      }

      if (result.success && result.url) {
        updatedPlatformPostUrls[result.platform] = result.url
        if (result.postId) {
          updatedPlatformPostIds[result.platform] = result.postId
        }
      }
    }

    // Determine overall status
    const successCount = Object.values(platform_statuses).filter((s: any) => s.status === 'success').length
    let overallStatus = 'published'
    if (successCount === 0) {
      overallStatus = 'failed'
    } else if (successCount < allPlatforms.length) {
      overallStatus = 'partial'
    }

    // Update the scheduled post
    await api.updateScheduledPost(post.id, {
      platform_statuses,
      platform_post_ids: updatedPlatformPostIds,
      platform_post_urls: updatedPlatformPostUrls,
      status: overallStatus,
      published_at: successCount > 0 ? new Date().toISOString() : post.published_at
    })

    // Refresh the calendar
    await fetchScheduledPosts()

  } catch (error: any) {
    console.error('Failed to update post after retry:', error)
    toastMessage.value = 'Published but failed to update status'
    toastType.value = 'warning'
    showToast.value = true
  }
}

const getMediaUrl = (url: string): string => {
  if (!url) return ''

  // Replace localhost URLs with production API URL
  if (url.includes('localhost:3000')) {
    return url.replace('http://localhost:3000', API_URL)
  }

  // If it's already a full URL (Supabase), return it
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }

  // If it's a relative path, construct the full URL
  return `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`
}

// Fetch brands for filters
const fetchBrands = async () => {
  await brandsStore.initialize()
}

// Apply filters
const applyFilters = () => {
  fetchScheduledPosts()
}

onMounted(async () => {
  await Promise.all([fetchScheduledPosts(), fetchHolidays(), fetchBrands()])

  // Auto-select today's date
  const todayDay = calendarDays.value.find((day) => !day.isOtherMonth && day.isToday)

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
  min-height: 100dvh;
  position: relative;
  padding: var(--space-md);
  width: 100%;
  max-width: 100vw;
  overflow-x: hidden;
  contain: inline-size;
}

.container {
  width: 100%;
  margin: 0 auto;
  position: relative;
  z-index: 1;
  overflow-x: hidden;
}

.header {
  text-align: center;
  margin-bottom: var(--space-xl);
}

.title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: 700;
  margin: 0 0 var(--space-xs) 0;
  background: linear-gradient(135deg, var(--text-primary) 0%, var(--gold-primary) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: 0;
}


/* Loading Overlay (subtle, doesn't hide calendar) */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--surface-alpha-85);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  border-radius: var(--radius-lg);
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--accent-alpha-20);
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
  padding: var(--space-lg);
  margin-bottom: var(--space-lg);
  position: relative;
  min-height: 400px;
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
  contain: inline-size;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: var(--space-sm);
  background: transparent;
  border-radius: var(--radius-lg);
  min-width: 0;
  width: 100%;
  max-width: 100%;
}

.calendar-grid.view-week {
  grid-template-columns: repeat(7, minmax(0, 1fr));
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
  background: var(--glass-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--glass-border);
  margin-bottom: var(--space-xl);
  border-radius: var(--radius-xl);
}

.day-view-title {
  font-family: var(--font-heading);
  font-size: var(--text-3xl);
  color: var(--text-primary);
  margin: 0 0 var(--space-xl) 0;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
  flex-wrap: wrap;
}

.post-count {
  font-size: var(--text-lg);
  color: var(--text-secondary);
  font-weight: var(--font-normal);
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
  background: var(--accent-alpha-10);
  border-color: var(--accent-alpha-40);
  color: var(--gold-primary);
}

.create-btn:hover {
  background: var(--gradient-gold);
  border-color: transparent;
  color: var(--text-on-gold);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.favorite-btn {
  background: var(--info-bg);
  border-color: var(--info-border);
  color: var(--info-text);
}

.favorite-btn:hover {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.4);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
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

/* Expandable Table Styles */
.day-view-table {
  background: var(--glass-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: var(--radius-xl);
  overflow: hidden;
  border: 1px solid var(--glass-border);
  margin: var(--space-lg);
}

.table-header {
  display: grid;
  grid-template-columns: 4fr 1.5fr 2fr 2fr 2fr 40px;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-lg);
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--glass-border);
}

.table-header > div {
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.table-body {
  background: var(--bg-secondary);
}

.table-row-wrapper {
  border-bottom: 1px solid var(--border-color);
}

.table-row-wrapper:last-child {
  border-bottom: none;
}

.table-row {
  display: grid;
  grid-template-columns: 4fr 1.5fr 2fr 2fr 2fr 40px;
  gap: var(--space-md);
  padding: var(--space-lg);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.table-row:hover {
  background: var(--accent-alpha-04);
}

.table-row.is-expanded {
  background: var(--accent-alpha-05);
}

/* Post Column */
.td-post {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  min-width: 0;
}

.post-thumb {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  object-fit: cover;
  flex-shrink: 0;
  background: var(--bg-tertiary);
}

.post-thumb-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-lg);
  color: var(--text-muted);
}

.post-info {
  min-width: 0;
  flex: 1;
}

.post-time-row {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: 4px;
}

.post-time {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--gold-primary);
}

.post-time-sep {
  color: var(--text-muted);
  font-size: var(--text-xs);
}

.post-time-ago {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.post-caption-preview {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Post Type Column */
.td-post-type {
  display: flex;
  align-items: center;
}

/* Platforms Column */
.td-platforms {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* Status Column */
.td-status {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.retry-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  background: transparent;
  border: 1px solid var(--gold-primary);
  border-radius: var(--radius-sm);
  color: var(--gold-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
  opacity: 0.7;
}

.retry-button:hover {
  opacity: 1;
  background: var(--accent-alpha-08);
  transform: scale(1.05);
}

.retry-button:active {
  transform: scale(0.95);
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.status-badge.status-published {
  background: var(--success-bg);
  color: var(--success-text);
}

.status-badge.status-published .status-dot {
  background: var(--success-text);
}

.status-badge.status-scheduled {
  background: var(--warning-bg);
  color: var(--warning-text);
}

.status-badge.status-scheduled .status-dot {
  background: #f59e0b;
}

.status-badge.status-failed {
  background: var(--error-bg);
  color: var(--error-text);
}

.status-badge.status-failed .status-dot {
  background: #ef4444;
}

.status-badge.status-partial {
  background: var(--warning-bg);
  color: var(--warning-text);
}

.status-badge.status-partial .status-dot {
  background: #f59e0b;
}

/* Restaurant Column */
.td-brand {
  display: flex;
  align-items: center;
}

.brand-name {
  font-size: var(--text-sm);
  color: var(--text-muted);
}

/* Expand Toggle */
.td-expand {
  display: flex;
  align-items: center;
  justify-content: center;
}

.expand-icon {
  color: var(--text-muted);
  font-size: var(--text-sm);
  transition: transform 0.2s ease;
}

.expand-icon.is-expanded {
  transform: rotate(180deg);
}

/* Expanded Details */
.expanded-details {
  background: var(--bg-tertiary);
  border-top: 1px solid var(--glass-border);
  padding: var(--space-xl);
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
  font-size: var(--text-xs);
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

.story-notice {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-top: var(--space-md);
  padding: var(--space-sm) var(--space-md);
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-radius: var(--radius-md);
}

.notice-icon {
  font-size: 18px;
  color: #f59e0b;
  flex-shrink: 0;
}

.notice-text {
  font-size: var(--text-sm);
  color: #d97706;
  font-weight: 500;
}

.detail-error {
  margin-top: var(--space-lg);
}

.error-label {
  color: #ef4444;
}

.error-message {
  font-size: var(--text-sm);
  color: #f87171;
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
  font-size: var(--text-xs);
  opacity: 0.7;
}

.day-view-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-lg);
  padding: var(--space-xl);
  border-top: 1px solid var(--accent-alpha-20);
}

.pagination-btn {
  padding: var(--space-sm) var(--space-lg);
  background: var(--accent-alpha-15);
  border: 1px solid var(--accent-alpha-30);
  border-radius: var(--radius-md);
  color: var(--gold-primary);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  cursor: pointer;
  transition: all 0.2s ease;
}

.pagination-btn:hover:not(:disabled) {
  background: var(--accent-alpha-25);
  border-color: var(--gold-primary);
  transform: translateY(-1px);
}

.pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pagination-info {
  color: var(--text-secondary);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
}

.post-time-mini {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--text-primary);
  flex: 1;
  text-overflow: ellipsis;
  overflow: hidden;
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
  background: transparent;
  padding: var(--space-sm) var(--space-md);
  text-align: center;
  font-weight: var(--font-semibold);
  color: var(--text-muted);
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.calendar-day {
  background: var(--glass-bg);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  min-height: 160px;
  padding: var(--space-md);
  cursor: pointer;
  transition: all var(--transition-base);
  position: relative;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  min-width: 0;
  overflow: hidden;
}

.calendar-day:hover {
  transform: translateY(-2px);
  border-color: var(--gold-primary);
  box-shadow: var(--shadow-md);
}

/* Other month days */
.calendar-day.other-month {
  opacity: 0.6;
  background: var(--surface-alpha-05);
}

/* Future dates from other months - selectable */
.calendar-day.other-month.future-date {
  opacity: 0.7;
  cursor: pointer;
}

.calendar-day.other-month.future-date:hover {
  opacity: 1;
  border-color: var(--gold-primary);
}

.calendar-day.other-month.future-date .day-number {
  color: var(--text-secondary);
}

/* Past dates from other months */
.calendar-day.other-month.past-date {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Past dates - disabled */
.calendar-day.past-date {
  opacity: 0.5;
  cursor: not-allowed;
  background: var(--surface-alpha-05);
}

.calendar-day.past-date:hover {
  transform: none;
  border-color: var(--glass-border);
  box-shadow: none;
}

.calendar-day.past-date .day-number {
  color: var(--text-muted);
  text-decoration: line-through;
  text-decoration-color: var(--text-muted);
}

/* Future dates - selectable */
.calendar-day.future-date {
  cursor: pointer;
}

.calendar-day.future-date .day-number {
  color: var(--text-primary);
  font-weight: var(--font-medium);
}

.calendar-day.today {
  background: var(--gold-subtle);
  border: 2px solid var(--gold-primary);
  box-shadow: var(--shadow-md);
}

.calendar-day.today::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--gold-primary), var(--gold-light));
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
}

.calendar-day.today .day-number {
  color: var(--gold-primary);
  font-weight: var(--font-bold);
}

.calendar-day.has-posts {
  background: var(--bg-secondary);
}

.day-number {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin-bottom: var(--space-sm);
}

/* Day Hover Overlay */
.day-hover-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--accent-alpha-35);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
  z-index: 10;
  border-radius: inherit;
}

.calendar-day:hover .day-hover-overlay {
  opacity: 1;
  pointer-events: all;
}

.day-hover-actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  padding: var(--space-sm);
}

.hover-action-btn {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.hover-action-btn .material-symbols-outlined {
  font-size: 18px;
}

.hover-action-btn.create-btn {
  background: var(--gold-primary);
  color: var(--text-on-gold);
}

.hover-action-btn.create-btn:hover {
  background: var(--gold-light);
  transform: scale(1.05);
  box-shadow: var(--glow-gold-sm);
}

.hover-action-btn.view-btn {
  background: var(--surface-alpha-70);
  color: var(--text-primary);
  border: 1px solid var(--accent-alpha-20);
}

.hover-action-btn.view-btn:hover {
  background: var(--surface-alpha-80);
  transform: scale(1.05);
}

.hover-action-btn .btn-label {
  font-size: var(--text-xs);
}

.day-holidays {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 0.5rem;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
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
  max-width: 100%;
  box-sizing: border-box;
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
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
}

.post-indicator {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.375rem;
  background: var(--surface-alpha-60);
  border-radius: var(--radius-md);
  border: 1px solid var(--accent-alpha-08);
  font-size: 0.75rem;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  max-width: 100%;
  box-sizing: border-box;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.post-indicator:hover {
  background: var(--surface-alpha-80);
  border-color: var(--gold-primary);
  box-shadow: var(--shadow-sm);
  transform: translateY(-1px);
}

.post-indicator-thumb {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  border-radius: 3px;
  overflow: hidden;
  background: var(--bg-elevated);
}

.post-indicator-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.post-indicator-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  background: var(--bg-elevated);
}

/* Platform colors - keep subtle since we now show thumbnails */
.post-indicator.platform-instagram {
  border-left-width: 3px;
  border-left-color: #e1306c;
}

.post-indicator.platform-facebook {
  border-left-width: 3px;
  border-left-color: #4267b2;
}

.post-indicator.platform-tiktok {
  border-left-width: 3px;
  border-left-color: #696969;
}

.post-indicator.platform-twitter {
  border-left-width: 3px;
  border-left-color: #1da1f2;
}

/* Status-based coloring for post indicators (overrides platform colors) */
.post-indicator.status-scheduled {
  border-left-width: 3px;
  border-left-color: #f59e0b;
  background: rgba(245, 158, 11, 0.08);
}

.post-indicator.status-scheduled:hover {
  background: rgba(245, 158, 11, 0.12);
  border-color: #f59e0b;
}

.post-indicator.status-published {
  border-left-width: 3px;
  border-left-color: var(--gold-primary);
  background: var(--accent-alpha-08);
}

.post-indicator.status-published:hover {
  background: var(--accent-alpha-12);
  border-color: var(--gold-primary);
}

.post-indicator.status-failed {
  border-left-width: 3px;
  border-left-color: #ef4444;
  background: rgba(239, 68, 68, 0.08);
}

.post-indicator.status-failed:hover {
  background: rgba(239, 68, 68, 0.12);
  border-color: #ef4444;
}

.more-posts {
  font-size: 0.75rem;
  color: var(--gold-primary);
  font-weight: 600;
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
  background: var(--surface-alpha-05);
  border: 2px dashed var(--accent-alpha-30);
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
  background: var(--accent-alpha-35);
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
  background: var(--accent-alpha-10);
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
  color: #e1306c;
}

.post-platform.platform-facebook {
  background: rgba(66, 103, 178, 0.2);
  color: #4267b2;
}

.post-text {
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
}

.post-brand {
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
  background: var(--surface-alpha-05);
  border: 1px solid var(--accent-alpha-30);
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
  background: rgba(245, 158, 11, 0.15);
  color: #d97706;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.status-badge.status-published {
  background: var(--success-bg);
  color: var(--success-text);
  border: 1px solid var(--success-border);
}

.status-badge.status-failed {
  background: var(--error-bg);
  color: var(--error-text);
  border: 1px solid var(--error-border);
}

.status-badge.status-partial {
  background: rgba(245, 158, 11, 0.2);
  color: #d97706;
  border: 1px solid rgba(245, 158, 11, 0.4);
}

.post-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

/* Published Post Styles */
.published-badge-compact {
  padding: var(--space-xs) var(--space-md);
  background: var(--success-bg);
  border: 1px solid var(--success-border);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--success-text);
  white-space: nowrap;
}

.published-info {
  color: var(--gold-primary) !important;
  font-weight: var(--font-medium);
}

/* Old full-width published styles (keeping for modal if needed) */
.post-published {
  margin-top: var(--space-md);
  padding: var(--space-md);
  background: var(--accent-alpha-08);
  border: 1px solid var(--accent-alpha-20);
  border-radius: var(--radius-md);
}

.published-badge {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--gold-primary);
  margin-bottom: var(--space-sm);
}

.published-details {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.published-time,
.published-platform {
  font-size: var(--text-xs);
  color: var(--text-secondary);
}

.published-section {
  background: var(--accent-alpha-08);
  border: 1px solid var(--accent-alpha-20);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
}

.published-badge-large {
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  color: #22c55e;
  margin-bottom: var(--space-md);
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.published-details-large {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.published-info-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.published-info-label {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  min-width: 100px;
}

.published-info-value {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.view-post-buttons-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  margin-top: var(--space-lg);
}

.view-post-button-modal {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-xl);
  background: var(--gradient-gold);
  border: none;
  border-radius: var(--radius-md);
  color: var(--text-on-gold);
  font-size: var(--text-base);
  font-weight: var(--font-bold);
  text-decoration: none;
  transition: var(--transition-base);
  cursor: pointer;
  box-shadow: var(--glow-gold-sm);
  width: 100%;
}

/* For standalone button (not in container) */
.view-post-button-modal:not(.view-post-buttons-container .view-post-button-modal) {
  margin-top: var(--space-lg);
}

.view-post-button-modal:hover {
  transform: translateY(-2px);
  box-shadow: var(--glow-gold-md);
}

.view-post-icon {
  font-size: var(--text-lg);
}

.external-icon {
  font-size: var(--text-sm);
  opacity: 0.8;
}

/* Responsive */
@media (max-width: 1024px) {
  .calendar-day {
    min-height: 140px;
  }

  .scheduled-post-card {
    grid-template-columns: 250px 1fr;
  }
}

@media (max-width: 768px) {
  .title {
    font-size: 2rem;
  }

  /* Reduce calendar complexity on mobile */
  .calendar-grid {
    gap: 2px;
  }

  .calendar-grid.view-month {
    gap: 2px;
  }

  .calendar-day {
    min-height: 80px;
    padding: var(--space-xs);
  }

  .day-number {
    font-size: var(--text-mobile-xs);
  }

  /* Hide hover overlays on touch */
  .day-hover-overlay {
    display: none;
  }

  .holiday-indicator {
    font-size: var(--text-mobile-xs);
    padding: 2px 4px;
  }

  .post-indicator {
    gap: 0.25rem;
    padding: 0.125rem 0.25rem;
  }

  .post-indicator-thumb {
    width: 22px;
    height: 22px;
  }

  .post-time-mini {
    font-size: var(--text-mobile-xs);
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

  .view-mode-selector {
    flex-direction: row;
  }

  .view-mode-btn {
    flex: 1;
    padding: var(--space-sm) var(--space-md);
    font-size: var(--text-sm);
  }

  /* Mobile Day View - clean layout */
  .hide-on-mobile-day {
    display: none;
  }

  .desktop-only {
    display: none;
  }

  .mobile-day-create {
    display: block;
    padding: var(--space-md);
  }

  .mobile-day-create .material-symbols-outlined {
    font-size: 20px;
    margin-right: var(--space-xs);
  }
}

/* Desktop - hide mobile elements */
@media (min-width: 769px) {
  .mobile-day-create {
    display: none;
  }
}

@media (max-width: 480px) {
  .scheduler-view {
    padding: var(--space-sm);
  }

  .title {
    font-size: var(--text-lg);
  }

  .subtitle {
    font-size: var(--text-xs);
    /* Keep visible but truncate if needed */
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .calendar-card {
    padding: var(--space-sm);
    min-height: auto;
  }

  .calendar-day {
    min-height: 48px;
    padding: 2px;
  }

  .day-number {
    font-size: var(--text-xs);
  }

  .calendar-day-header {
    padding: var(--space-xs);
    font-size: var(--text-mobile-xs);
  }

  /* Hover action buttons - icon only on mobile, stacked vertically */
  .day-hover-actions {
    flex-direction: column;
    gap: var(--space-xs);
    padding: var(--space-xs);
    align-items: center;
  }

  .hover-action-btn {
    padding: var(--space-xs) var(--space-sm);
    border-radius: var(--radius-md);
    min-width: 44px;
    min-height: 32px;
    justify-content: center;
    width: auto;
  }

  .hover-action-btn .btn-label {
    display: none;
  }

  .hover-action-btn .material-symbols-outlined {
    font-size: 20px;
  }

  .calendar-nav {
    flex-wrap: wrap;
    gap: var(--space-xs);
    padding: var(--space-sm);
  }

  .nav-button {
    min-height: var(--touch-target-min);
    padding: var(--space-xs) var(--space-sm);
    font-size: var(--text-xs);
  }

  .calendar-title {
    font-size: var(--text-base);
  }

  .view-mode-selector {
    width: 100%;
    order: -1;
  }

  .view-mode-btn {
    min-height: var(--touch-target-min);
    font-size: var(--text-mobile-xs);
    padding: var(--space-xs) var(--space-sm);
  }

  /* Hide holiday text, only show emoji */
  .holiday-indicator {
    padding: 2px;
    font-size: var(--text-mobile-xs);
    background: transparent;
    border: none;
  }

  /* Compact post indicators on mobile */
  .post-indicator {
    gap: 0.25rem;
    padding: 0.125rem;
  }

  .post-indicator-thumb {
    width: 20px;
    height: 20px;
  }

  .post-time-mini {
    font-size: 0.65rem;
  }

  .more-posts {
    font-size: var(--text-mobile-xs);
  }

  /* Day view mobile */
  .day-view-header {
    padding: var(--space-md);
  }

  .day-view-title {
    font-size: var(--text-lg);
  }

  .day-view-posts,
  .day-view-holidays {
    padding: var(--space-md);
  }

  .action-button {
    min-height: var(--touch-target-min);
  }

  /* Posts table */
  .post-thumbnail,
  .post-thumbnail-placeholder {
    height: 160px;
  }

  .scheduled-post-card {
    gap: var(--space-sm);
  }

  /* Day view table mobile - convert to cards */
  .day-view-table .table-header {
    display: none;
  }

  .day-view-table {
    display: block;
    width: 100%;
  }

  .table-row-wrapper {
    display: block;
    margin-bottom: var(--space-md);
  }

  .table-row {
    display: block;
    background: var(--bg-elevated);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    padding: var(--space-md);
    min-width: 0;
  }

  .table-row:hover {
    background: var(--bg-tertiary);
    border-color: var(--gold-primary);
  }

  /* Convert table cells to stacked layout */
  .table-row > * {
    display: flex;
    justify-content: space-between;
    padding: var(--space-sm) 0;
  }
}

@media (max-width: 390px) {
  .scheduler-view {
    padding: var(--space-xs);
  }

  .header {
    margin-bottom: var(--space-sm);
  }

  .title {
    font-size: var(--text-base);
  }

  .calendar-card {
    padding: var(--space-xs);
  }

  .calendar-day {
    min-height: 48px;
  }

  .day-number {
    font-size: var(--text-mobile-xs);
  }

  .calendar-day-header {
    font-size: var(--text-mobile-xs);
    padding: 4px 2px;
  }

  /* Compact hover buttons for 390px */
  .hover-action-btn {
    min-width: 40px;
    min-height: 28px;
    padding: 4px var(--space-xs);
  }

  .hover-action-btn .material-symbols-outlined {
    font-size: 16px;
  }

  .calendar-title {
    font-size: var(--text-sm);
  }

  .nav-button {
    padding: var(--space-xs);
    font-size: var(--text-mobile-xs);
  }

  .day-view-title {
    font-size: var(--text-base);
  }

  /* Compact holiday display */
  .holiday-indicator {
    font-size: 8px;
    padding: 1px;
    display: none; /* Hide text, we'll show via CSS content */
  }

  .day-holidays::before {
    content: attr(data-holidays);
    font-size: var(--text-mobile-xs);
  }

  /* Very compact post indicators on smallest screens */
  .post-indicator {
    padding: 0.125rem;
    gap: 0.125rem;
  }

  .post-indicator-thumb {
    width: 16px;
    height: 16px;
  }

  .post-time-mini {
    font-size: 0.6rem;
  }

  .more-posts {
    font-size: 8px;
  }
}

/* Post Detail Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 260px; /* Account for sidebar width */
  right: 0;
  bottom: 0;
  background: var(--accent-alpha-45);
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
  border: 1px solid var(--accent-alpha-30);
  border-radius: var(--radius-xl);
  max-width: min(1000px, calc(100vw - 260px - var(--space-3xl) * 2)); /* Account for sidebar */
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
  background: var(--surface-alpha-60);
  border: 1px solid var(--accent-alpha-30);
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
  background: var(--surface-alpha-05);
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
  background: var(--surface-alpha-05);
  border: 2px dashed var(--accent-alpha-30);
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
  border-bottom: 2px solid var(--accent-alpha-20);
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
  background: var(--surface-alpha-05);
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--accent-alpha-20);
}

.time-remaining-large {
  padding: var(--space-md) var(--space-lg);
  background: var(--accent-alpha-15);
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
  color: #e1306c;
  border: 1px solid rgba(225, 48, 108, 0.4);
}

.platform-badge-large.platform-facebook {
  background: rgba(66, 103, 178, 0.2);
  color: #4267b2;
  border: 1px solid rgba(66, 103, 178, 0.4);
}

.content-type-badge-large {
  padding: var(--space-sm) var(--space-lg);
  background: var(--surface-alpha-05);
  border: 1px solid var(--accent-alpha-30);
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
  background: rgba(245, 158, 11, 0.15);
  color: #d97706;
  border: 1px solid rgba(245, 158, 11, 0.4);
}

.status-badge-large.status-published {
  background: var(--success-bg);
  color: var(--success-text);
  border: 1px solid var(--success-border);
}

.status-badge-large.status-failed {
  background: var(--error-bg);
  color: var(--error-text);
  border: 1px solid rgba(239, 68, 68, 0.4);
}

.status-badge-large.status-partial {
  background: rgba(245, 158, 11, 0.2);
  color: #d97706;
  border: 1px solid rgba(245, 158, 11, 0.4);
}

.post-caption {
  white-space: pre-wrap;
  line-height: 1.8;
  padding: var(--space-lg);
  background: var(--surface-alpha-05);
  border-radius: var(--radius-md);
  border-left: 3px solid var(--gold-primary);
}

.modal-actions {
  display: flex;
  gap: var(--space-md);
  padding-top: var(--space-lg);
  border-top: 1px solid var(--accent-alpha-20);
  margin-top: auto;
}

/* Responsive Modal */
@media (max-width: 1024px) {
  .modal-overlay {
    left: 220px; /* Smaller sidebar on tablet */
  }

  .modal-content {
    max-width: min(900px, calc(100vw - 220px - var(--space-2xl) * 2));
  }

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
    left: 0; /* Sidebar hidden on mobile */
    padding: var(--space-md);
  }

  .modal-content {
    max-width: calc(100vw - var(--space-md) * 2);
    border-radius: var(--radius-lg);
  }

  .modal-body {
    padding: var(--space-xl) var(--space-lg);
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

  .modal-close {
    min-width: var(--touch-target-min);
    min-height: var(--touch-target-min);
  }
}

@media (max-width: 480px) {
  .modal-overlay {
    padding: var(--space-sm);
    align-items: flex-end;
  }

  .modal-content {
    max-width: 100%;
    max-height: 95vh;
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  }

  .modal-body {
    padding: var(--space-lg) var(--space-md);
  }

  .modal-close {
    top: var(--space-md);
    right: var(--space-md);
    width: 40px;
    height: 40px;
    font-size: 1.5rem;
  }

  .modal-title {
    font-size: var(--text-xl);
  }

  .modal-media {
    max-height: 200px;
  }

  .modal-actions button {
    min-height: var(--touch-target-min);
  }
}

@media (max-width: 390px) {
  .modal-overlay {
    padding: var(--space-xs);
  }

  .modal-body {
    padding: var(--space-md) var(--space-sm);
  }

  .modal-title {
    font-size: var(--text-lg);
  }

  .modal-close {
    width: 36px;
    height: 36px;
    font-size: 1.25rem;
    top: var(--space-sm);
    right: var(--space-sm);
  }
}

/* Error Message Styles */
.post-error {
  display: flex;
  gap: var(--space-md);
  padding: var(--space-md);
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-left: 3px solid #ef4444;
  border-radius: var(--radius-md);
  margin-top: var(--space-md);
}

.error-icon {
  font-size: var(--text-2xl);
  flex-shrink: 0;
}

.error-content {
  flex: 1;
}

.error-title {
  font-weight: var(--font-semibold);
  color: #ef4444;
  font-size: var(--text-sm);
  margin-bottom: var(--space-xs);
}

.error-message {
  color: var(--text-secondary);
  font-size: var(--text-sm);
  line-height: var(--leading-normal);
}

/* Error Section in Modal */
.error-section {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-left: 3px solid #ef4444;
  border-radius: var(--radius-md);
  padding: var(--space-lg);
}

.error-label {
  color: #ef4444 !important;
  font-weight: var(--font-semibold);
}

.error-text {
  color: var(--text-secondary);
  background: var(--surface-alpha-05);
  padding: var(--space-md);
  border-radius: var(--radius-sm);
  font-family: var(--font-body);
  line-height: var(--leading-normal);
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  .calendar-day,
  .post-indicator,
  .hover-action-btn {
    transition: none;
  }

  .calendar-day:hover,
  .post-indicator:hover {
    transform: none;
  }
}

/* Landscape: Reduce vertical padding and hide non-essential elements */
@media (max-height: 500px) and (orientation: landscape) {
  .scheduler-view {
    padding: var(--space-md) var(--space-lg);
  }

  .header {
    margin-bottom: var(--space-md);
  }

  .calendar-card {
    padding: var(--space-sm);
  }

  .calendar-day {
    min-height: 60px;
    padding: var(--space-xs);
  }

  .day-view-header {
    padding: var(--space-sm);
  }

  .day-view-posts,
  .day-view-holidays {
    padding: var(--space-sm);
  }

  .landscape-hide {
    display: none;
  }

  /* Landscape warning for month view */
  .landscape-warning {
    display: block;
    padding: var(--space-lg);
    text-align: center;
    color: var(--text-muted);
  }

  .calendar-grid.view-month {
    display: none;
  }
}
</style>

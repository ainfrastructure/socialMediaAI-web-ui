<script setup lang="ts">
import { debugLog, errorLog } from '@/utils/debug'

import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import { useBrandsStore } from '../stores/brands'
import { usePreferencesStore } from '../stores/preferences'
import { api } from '../services/api'
import { engagementService } from '../services/engagementService'
import DashboardLayout from '../components/DashboardLayout.vue'
import BaseCard from '../components/BaseCard.vue'
import BaseButton from '../components/BaseButton.vue'
import BaseModal from '../components/BaseModal.vue'
import MaterialIcon from '../components/MaterialIcon.vue'
import PlatformLogo from '../components/PlatformLogo.vue'
import PostDetailModal from '../components/PostDetailModal.vue'

const router = useRouter()
const authStore = useAuthStore()
const brandsStore = useBrandsStore()
const preferencesStore = usePreferencesStore()
const { t, locale } = useI18n()

// Navigation helper to always start in easy mode
function goToCreateContent() {
  preferencesStore.setCreationMode('easy', true)
  router.push('/posts')
}

// Real stats from API
const stats = ref({
  postsCreated: 0,
  postsSaved: 0,
  scheduledPosts: 0,
  restaurantsAdded: 0
})

// Restaurants for welcome modal check
const restaurants = computed(() => brandsStore.restaurants)

// Recent posts from API
const recentPosts = ref<any[]>([])
const loadingPosts = ref(false)
const loading = ref(true)

// Engagement data
const engagementData = ref<{ likes: number; comments: number; reach: number; shares: number }>({
  likes: 0,
  comments: 0,
  reach: 0,
  shares: 0
})
const hasEngagementData = computed(() =>
  engagementData.value.likes > 0 ||
  engagementData.value.comments > 0 ||
  engagementData.value.reach > 0 ||
  engagementData.value.shares > 0
)

const userName = computed(() => {
  const email = authStore.user?.email || ''
  return email.split('@')[0]
})

// Credits remaining
const creditsRemaining = computed(() => {
  return authStore.usageStats?.remaining_credits ?? 0
})

// Time-of-day greeting
const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return t('dashboardRedesign.goodMorning', { name: userName.value })
  if (hour < 18) return t('dashboardRedesign.goodAfternoon', { name: userName.value })
  return t('dashboardRedesign.goodEvening', { name: userName.value })
})

// Locale-formatted date
const formattedDate = computed(() => {
  const lang = locale.value === 'no' ? 'nb-NO' : 'en-US'
  return new Date().toLocaleDateString(lang, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

// Stats cards config
const statsCards = computed(() => [
  { key: 'totalPosts', icon: 'edit_note', value: stats.value.postsCreated, labelKey: 'dashboardRedesign.totalPosts', route: '/posts' },
  { key: 'scheduled', icon: 'calendar_month', value: stats.value.scheduledPosts, labelKey: 'dashboardRedesign.scheduledLabel', route: '/scheduler' },
  { key: 'saved', icon: 'bookmark', value: stats.value.postsSaved, labelKey: 'dashboardRedesign.savedContent', route: '/posts' },
  { key: 'credits', icon: 'toll', value: creditsRemaining.value, labelKey: 'dashboardRedesign.creditsLabel', route: '/profile' },
])

// Upcoming posts: future scheduled only, sorted ascending
const upcomingPosts = computed(() => {
  const now = new Date().getTime()
  return recentPosts.value
    .filter(p => p.scheduled_time && new Date(p.scheduled_time).getTime() > now && p.status !== 'published' && p.status !== 'failed' && p.status !== 'cancelled')
    .sort((a, b) => new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime())
    .slice(0, 5)
})

// Recent posts display: all posts sliced to 6
const recentPostsDisplay = computed(() => {
  return recentPosts.value.slice(0, 6)
})

// ─── Post helpers (kept from original) ───

function getStatusClass(status: string) {
  switch (status?.toLowerCase()) {
    case 'published': return 'status-published'
    case 'failed': return 'status-failed'
    case 'cancelled': return 'status-cancelled'
    case 'draft': return 'status-draft'
    case 'scheduled':
    default: return 'status-scheduled'
  }
}

function getStatusLabel(status: string) {
  switch (status?.toLowerCase()) {
    case 'published': return t('dashboardNew.published')
    case 'failed': return t('dashboardNew.failed')
    case 'cancelled': return t('dashboardNew.cancelled')
    case 'draft': return t('dashboardNew.draft')
    case 'scheduled':
    default: return t('dashboardNew.scheduled')
  }
}

function formatTimeAgo(dateString: string) {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

function getPostMediaUrl(post: any): string | null {
  if (post.media_url) return post.media_url
  if (post.image_url) return post.image_url
  if (post.video_url) return post.video_url
  if (post.favorite_posts?.media_url) return post.favorite_posts.media_url
  if (post.favorite_posts?.image_url) return post.favorite_posts.image_url
  if (post.favorite_posts?.video_url) return post.favorite_posts.video_url
  if (post.favorite_post?.media_url) return post.favorite_post.media_url
  if (post.favorite_post?.image_url) return post.favorite_post.image_url
  if (post.favorite_post?.video_url) return post.favorite_post.video_url
  if (post.favorite?.media_url) return post.favorite.media_url
  if (post.favorite?.image_url) return post.favorite.image_url
  if (post.favorite?.video_url) return post.favorite.video_url
  return null
}

function getPostText(post: any): string | null {
  if (post.post_text) return post.post_text
  if (post.caption) return post.caption
  if (post.favorite_posts?.post_text) return post.favorite_posts.post_text
  if (post.favorite_posts?.caption) return post.favorite_posts.caption
  if (post.favorite_post?.post_text) return post.favorite_post.post_text
  if (post.favorite_post?.caption) return post.favorite_post.caption
  if (post.favorite?.post_text) return post.favorite.post_text
  if (post.favorite?.caption) return post.favorite.caption
  return null
}

function getPostRestaurantName(post: any): string | null {
  if (post.restaurant_name) return post.restaurant_name
  if (post.favorite_posts?.restaurant_name) return post.favorite_posts.restaurant_name
  if (post.favorite_post?.restaurant_name) return post.favorite_post.restaurant_name
  if (post.favorite?.restaurant_name) return post.favorite.restaurant_name
  const restaurantId = post.restaurant_id || post.favorite_posts?.restaurant_id || post.favorite_post?.restaurant_id
  if (restaurantId) {
    const restaurant = restaurants.value.find(r => r.id === restaurantId)
    if (restaurant) return restaurant.name
  }
  return null
}

function getPostPlatforms(post: any): string[] {
  if (post.published_platforms && Array.isArray(post.published_platforms)) return post.published_platforms
  if (post.platform_post_urls && Object.keys(post.platform_post_urls).length > 0) return Object.keys(post.platform_post_urls)
  if (post.platforms && Array.isArray(post.platforms) && post.platforms.length > 0) return post.platforms
  const platforms: string[] = []
  if (post.platform) platforms.push(post.platform)
  if (post.favorite_posts?.platform && !platforms.includes(post.favorite_posts.platform)) platforms.push(post.favorite_posts.platform)
  if (post.favorite_post?.platform && !platforms.includes(post.favorite_post.platform)) platforms.push(post.favorite_post.platform)
  return platforms
}

// ─── New helpers ───

function truncateText(text: string | null, max: number): string {
  if (!text) return t('dashboardRedesign.untitledPost')
  if (text.length <= max) return text
  return text.substring(0, max) + '...'
}

function formatScheduledDate(post: any): string {
  if (!post.scheduled_time) return ''
  const date = new Date(post.scheduled_time)
  const now = new Date()
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)

  if (date.toDateString() === now.toDateString()) {
    return `${t('dashboardRedesign.today')}, ${date.toLocaleTimeString(locale.value === 'no' ? 'nb-NO' : 'en-US', { hour: '2-digit', minute: '2-digit' })}`
  }
  if (date.toDateString() === tomorrow.toDateString()) {
    return `${t('dashboardRedesign.tomorrow')}, ${date.toLocaleTimeString(locale.value === 'no' ? 'nb-NO' : 'en-US', { hour: '2-digit', minute: '2-digit' })}`
  }
  const lang = locale.value === 'no' ? 'nb-NO' : 'en-US'
  return date.toLocaleDateString(lang, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ─── Post detail modal ───

const showPostDetailModal = ref(false)
const selectedPost = ref<any>(null)

function viewPostDetail(post: any) {
  selectedPost.value = post
  showPostDetailModal.value = true
}

function closePostDetailModal() {
  showPostDetailModal.value = false
  selectedPost.value = null
}

function handlePostEdit(post: any) {
  closePostDetailModal()
  if (post.status === 'draft') {
    router.push('/posts')
  } else {
    router.push(`/scheduler?post=${post.id}`)
  }
}

function handlePostSchedule(post: any) {
  closePostDetailModal()
  router.push(`/scheduler?favorite=${post.id}`)
}

function handlePostDelete(_post: any) {
  closePostDetailModal()
}

// ─── Welcome modal ───

const showWelcomeModal = ref(false)
const WELCOME_DISMISSED_KEY = 'socialchef_welcome_dismissed'

function wasWelcomeDismissed(): boolean {
  return localStorage.getItem(WELCOME_DISMISSED_KEY) === 'true'
}

function dismissWelcome() {
  showWelcomeModal.value = false
  localStorage.setItem(WELCOME_DISMISSED_KEY, 'true')
}

function handleWelcomeLetsGo() {
  dismissWelcome()
  router.push('/posts')
}

// ─── Load recent posts ───

async function loadRecentPosts() {
  loadingPosts.value = true
  try {
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    const monthsToFetch: { month: number; year: number }[] = []
    for (let i = -2; i <= 1; i++) {
      let m = currentMonth + i
      let y = currentYear
      if (m <= 0) { m += 12; y -= 1 }
      else if (m > 12) { m -= 12; y += 1 }
      monthsToFetch.push({ month: m, year: y })
    }

    const [scheduledResponses, favoritesResponse] = await Promise.all([
      Promise.all(
        monthsToFetch.map(({ month, year }) =>
          api.getScheduledPosts({ month, year })
        )
      ),
      api.getFavorites({ limit: 10, sort: 'newest' })
    ])

    const scheduledPosts: any[] = []
    for (const response of scheduledResponses) {
      if (response.success && response.data?.scheduled_posts) {
        scheduledPosts.push(...response.data.scheduled_posts)
      }
    }

    const scheduledFavoriteIds = new Set(
      scheduledPosts.filter(p => p.favorite_post_id).map(p => p.favorite_post_id)
    )

    const drafts: any[] = []
    if (favoritesResponse.success && favoritesResponse.data?.favorites) {
      for (const fav of favoritesResponse.data.favorites) {
        if (!scheduledFavoriteIds.has(fav.id)) {
          drafts.push({
            ...fav,
            status: 'draft',
            post_text: fav.post_text,
            media_url: fav.media_url,
            restaurant_name: fav.restaurant_name || restaurants.value.find(r => r.id === fav.restaurant_id)?.name
          })
        }
      }
    }

    const allPosts = [...scheduledPosts, ...drafts]
    const uniquePosts = allPosts.filter((post, index, self) =>
      index === self.findIndex(p => p.id === post.id)
    )

    recentPosts.value = uniquePosts.sort((a: any, b: any) => {
      const dateA = new Date(a.scheduled_time || a.created_at).getTime()
      const dateB = new Date(b.scheduled_time || b.created_at).getTime()
      return dateB - dateA
    })
  } catch (error) {
    errorLog('Failed to load recent posts:', error)
    recentPosts.value = []
  } finally {
    loadingPosts.value = false
  }
}

// ─── Load engagement snapshot (fire-and-forget) ───

async function loadEngagementSnapshot() {
  try {
    const now = new Date()
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(now.getDate() - 30)

    const response = await engagementService.getAnalytics({
      start_date: thirtyDaysAgo.toISOString().split('T')[0],
      end_date: now.toISOString().split('T')[0]
    })

    if (response.success && response.data) {
      const data = response.data
      engagementData.value = {
        likes: data.total_likes ?? data.likes ?? 0,
        comments: data.total_comments ?? data.comments ?? 0,
        reach: data.total_reach ?? data.reach ?? 0,
        shares: data.total_shares ?? data.shares ?? 0
      }
    }
  } catch (error) {
    debugLog('Engagement data not available:', error)
  }
}

// ─── Mount ───

onMounted(async () => {
  try {
    await authStore.refreshProfile()
    await brandsStore.initialize()

    const statsResponse = await api.getStats()
    if (statsResponse.success && statsResponse.data) {
      stats.value = {
        postsCreated: statsResponse.data.postsCreated || 0,
        postsSaved: statsResponse.data.favoritesSaved || 0,
        scheduledPosts: statsResponse.data.scheduledPosts || 0,
        restaurantsAdded: statsResponse.data.restaurantsAdded || 0
      }
    }

    await loadRecentPosts()

    // Fire-and-forget engagement
    loadEngagementSnapshot()

    if (stats.value.restaurantsAdded === 0 && !wasWelcomeDismissed()) {
      showWelcomeModal.value = true
    }
  } catch (error) {
    errorLog('Failed to load dashboard data:', error)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <DashboardLayout>
    <!-- Header Left Slot -->
    <template #header-left>
      <div class="welcome-section">
        <span class="welcome-label">{{ formattedDate }}</span>
      </div>
    </template>

    <div class="dashboard-redesign">

      <!-- Section 1: Welcome Hero -->
      <section class="hero-section">
        <div class="hero-content">
          <div class="hero-text">
            <h1 class="hero-greeting">{{ greeting }}</h1>
            <p class="hero-subtitle">{{ $t('dashboardRedesign.heroSubtitle') }}</p>
          </div>
          <BaseButton variant="primary" @click="goToCreateContent" class="hero-cta">
            <MaterialIcon icon="add" size="sm" />
            {{ $t('dashboardRedesign.createContent') }}
          </BaseButton>
        </div>
        <div class="hero-divider"></div>
      </section>

      <!-- Section 2: Stats Row -->
      <section class="stats-row">
        <div
          v-for="(card, i) in statsCards"
          :key="card.key"
          class="stat-card"
          :style="{ '--stagger': i }"
          @click="router.push(card.route)"
        >
          <div class="stat-icon">
            <MaterialIcon :icon="card.icon" size="lg" />
          </div>
          <div class="stat-body">
            <div v-if="loading" class="stat-value skeleton-box"></div>
            <div v-else class="stat-value">{{ card.value }}</div>
            <div class="stat-label">{{ $t(card.labelKey) }}</div>
          </div>
        </div>
      </section>

      <!-- Section 3: Engagement Snapshot (moved up, conditional) -->
      <section v-if="hasEngagementData" class="engagement-section">
        <div class="section-header">
          <h2 class="section-title">{{ $t('dashboardRedesign.engagementSnapshot') }}</h2>
          <router-link to="/analytics" class="section-link">
            {{ $t('dashboardRedesign.viewAnalytics') }} →
          </router-link>
        </div>

        <div class="engagement-cards">
          <div class="engagement-card" :style="{ '--stagger': 0 }">
            <MaterialIcon icon="favorite" size="lg" class="engagement-icon" />
            <span class="engagement-value">{{ engagementData.likes }}</span>
            <span class="engagement-label">{{ $t('analytics.likes') }}</span>
          </div>
          <div class="engagement-card" :style="{ '--stagger': 1 }">
            <MaterialIcon icon="chat_bubble" size="lg" class="engagement-icon" />
            <span class="engagement-value">{{ engagementData.comments }}</span>
            <span class="engagement-label">{{ $t('analytics.comments') }}</span>
          </div>
          <div class="engagement-card" :style="{ '--stagger': 2 }">
            <MaterialIcon icon="visibility" size="lg" class="engagement-icon" />
            <span class="engagement-value">{{ engagementData.reach }}</span>
            <span class="engagement-label">{{ $t('analytics.reach') }}</span>
          </div>
          <div class="engagement-card" :style="{ '--stagger': 3 }">
            <MaterialIcon icon="share" size="lg" class="engagement-icon" />
            <span class="engagement-value">{{ engagementData.shares }}</span>
            <span class="engagement-label">{{ $t('analytics.shares') }}</span>
          </div>
        </div>
      </section>

      <!-- Section 4: Upcoming Posts (full-width, prominent) -->
      <section class="upcoming-section">
        <div class="section-header">
          <h2 class="section-title">{{ $t('dashboardRedesign.upcomingPosts') }}</h2>
          <router-link to="/scheduler" class="section-link">
            {{ $t('dashboardRedesign.viewCalendar') }} →
          </router-link>
        </div>

        <BaseCard variant="glass" class="upcoming-card">
          <div v-if="loading || loadingPosts" class="loading-state">
            <MaterialIcon icon="hourglass_empty" size="xl" color="var(--text-muted)" />
            <span>{{ $t('common.loading') }}</span>
          </div>

          <div v-else-if="upcomingPosts.length === 0" class="empty-state">
            <MaterialIcon icon="calendar_month" size="xl" color="var(--text-muted)" />
            <p class="empty-title">{{ $t('dashboardRedesign.noUpcomingTitle') }}</p>
            <p class="empty-desc">{{ $t('dashboardRedesign.noUpcomingDesc') }}</p>
            <BaseButton variant="secondary" size="small" @click="router.push('/scheduler')">
              {{ $t('dashboardRedesign.scheduleFirst') }}
            </BaseButton>
          </div>

          <div v-else class="upcoming-list">
            <div
              v-for="post in upcomingPosts"
              :key="post.id"
              class="upcoming-item"
              @click="viewPostDetail(post)"
            >
              <div v-if="getPostMediaUrl(post)" class="upcoming-thumb">
                <img :src="getPostMediaUrl(post)!" :alt="getPostText(post) || 'Post'" />
              </div>
              <div v-else class="upcoming-thumb placeholder">
                <MaterialIcon icon="image" size="sm" color="var(--text-muted)" />
              </div>
              <div class="upcoming-info">
                <span class="upcoming-text">{{ truncateText(getPostText(post), 70) }}</span>
                <span class="upcoming-time">{{ formatScheduledDate(post) }}</span>
              </div>
              <div class="upcoming-platforms">
                <div
                  v-for="platform in getPostPlatforms(post)"
                  :key="platform"
                  class="platform-icon-small"
                  :class="`platform-bg-${platform}`"
                >
                  <PlatformLogo :platform="platform as any" :size="14" />
                </div>
              </div>
              <span class="status-badge" :class="getStatusClass(post.status || 'scheduled')">
                {{ getStatusLabel(post.status || 'scheduled') }}
              </span>
            </div>
          </div>
        </BaseCard>
      </section>

      <!-- Section 5: Recent Activity -->
      <section v-if="!loading && recentPostsDisplay.length > 0" class="activity-section">
        <div class="section-header">
          <h2 class="section-title">{{ $t('dashboardRedesign.recentActivity') }}</h2>
          <router-link to="/posts" class="section-link">
            {{ $t('dashboardRedesign.viewAllPosts') }} →
          </router-link>
        </div>

        <div class="activity-grid">
          <div
            v-for="(post, i) in recentPostsDisplay"
            :key="post.id"
            class="activity-card"
            :style="{ '--stagger': i }"
            @click="viewPostDetail(post)"
          >
            <div class="activity-image-wrap">
              <img
                v-if="getPostMediaUrl(post)"
                :src="getPostMediaUrl(post)!"
                :alt="getPostText(post) || 'Post'"
                class="activity-image"
              />
              <div v-else class="activity-image activity-placeholder">
                <MaterialIcon icon="image" size="xl" color="var(--text-muted)" />
              </div>
              <span class="activity-status-badge" :class="getStatusClass(post.status || 'scheduled')">
                {{ getStatusLabel(post.status || 'scheduled') }}
              </span>
            </div>
            <div class="activity-body">
              <p class="activity-text">{{ truncateText(getPostText(post), 60) }}</p>
              <div class="activity-meta">
                <div class="activity-platforms">
                  <div
                    v-for="platform in getPostPlatforms(post)"
                    :key="platform"
                    class="platform-icon-tiny"
                    :class="`platform-bg-${platform}`"
                  >
                    <PlatformLogo :platform="platform as any" :size="12" />
                  </div>
                </div>
                <span class="activity-time">{{ formatTimeAgo(post.scheduled_time || post.created_at) }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Recent Activity Empty State -->
      <section v-if="!loading && !loadingPosts && recentPostsDisplay.length === 0" class="activity-section">
        <div class="section-header">
          <h2 class="section-title">{{ $t('dashboardRedesign.recentActivity') }}</h2>
        </div>
        <BaseCard variant="glass" class="empty-activity-card">
          <div class="empty-state">
            <MaterialIcon icon="auto_awesome" size="xl" color="var(--text-muted)" />
            <p class="empty-title">{{ $t('dashboardRedesign.noActivityTitle') }}</p>
            <p class="empty-desc">{{ $t('dashboardRedesign.noActivityDesc') }}</p>
            <BaseButton variant="primary" size="small" @click="goToCreateContent">
              {{ $t('dashboardRedesign.createContent') }}
            </BaseButton>
          </div>
        </BaseCard>
      </section>
    </div>

    <!-- Post Detail Modal -->
    <PostDetailModal
      v-model="showPostDetailModal"
      :post="selectedPost"
      @edit="handlePostEdit"
      @schedule="handlePostSchedule"
      @delete="handlePostDelete"
      @close="closePostDetailModal"
    />

    <!-- Welcome Modal for First-Time Users -->
    <Teleport to="body">
      <BaseModal v-model="showWelcomeModal" size="sm" @close="dismissWelcome">
        <div class="welcome-modal">
          <div class="welcome-icon">
            <MaterialIcon icon="restaurant" size="xl" />
          </div>
          <h2 class="welcome-title">{{ $t('dashboard.welcomeModalTitle') }}</h2>
          <p class="welcome-message">{{ $t('dashboard.welcomeModalMessage') }}</p>
          <BaseButton variant="primary" full-width @click="handleWelcomeLetsGo">
            {{ $t('dashboard.welcomeModalButton') }}
          </BaseButton>
        </div>
      </BaseModal>
    </Teleport>
  </DashboardLayout>
</template>

<style scoped>
/* ─── Layout Container ─── */
.dashboard-redesign {
  display: flex;
  flex-direction: column;
  gap: var(--space-3xl);
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  overflow-x: hidden;
}

/* ─── Welcome Section (header slot) ─── */
.welcome-section {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.welcome-label {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  text-transform: capitalize;
}

/* ─── Section 1: Hero ─── */
.hero-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.hero-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-xl);
}

.hero-text {
  flex: 1;
  min-width: 0;
}

.hero-greeting {
  font-family: var(--font-heading);
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  margin: 0 0 var(--space-xs) 0;
}

.hero-subtitle {
  font-size: var(--text-base);
  color: var(--text-secondary);
  margin: 0;
}

.hero-cta {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.hero-divider {
  height: 2px;
  background: linear-gradient(90deg, var(--gold-primary), transparent);
  border-radius: var(--radius-full);
}

/* ─── Section 2: Stats Row ─── */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-lg);
}

.stat-card {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: var(--radius-xl);
  padding: var(--space-xl);
  cursor: pointer;
  transition: var(--transition-base);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--space-md);
  animation: fadeSlideUp 0.5s ease both;
  animation-delay: calc(var(--stagger) * 80ms);
}

.stat-card:hover {
  transform: translateY(-2px);
  border-color: var(--gold-primary);
  box-shadow: 0 8px 24px rgba(15, 61, 46, 0.1);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  background: var(--gold-subtle);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--gold-primary);
}

.stat-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.stat-value {
  font-family: var(--font-heading);
  font-size: var(--text-4xl);
  font-weight: var(--font-bold);
  line-height: 1;
  background: var(--gradient-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-label {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  font-weight: var(--font-medium);
}

/* ─── Section Header (shared) ─── */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-lg);
}

.section-title {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0;
}

.section-link {
  font-size: var(--text-sm);
  color: var(--gold-primary);
  text-decoration: none;
  transition: var(--transition-fast);
  white-space: nowrap;
}

.section-link:hover {
  color: var(--gold-light);
}

/* ─── Upcoming Posts ─── */
.upcoming-section {
  min-width: 0;
}

.upcoming-card {
  padding: 0;
  overflow: hidden;
}

.upcoming-list {
  display: flex;
  flex-direction: column;
}

.upcoming-item {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-lg);
  cursor: pointer;
  transition: var(--transition-fast);
  border-bottom: 1px solid var(--border-color);
}

.upcoming-item:last-child {
  border-bottom: none;
}

.upcoming-item:hover {
  background: var(--bg-elevated);
  transform: translateX(4px);
}

.upcoming-thumb {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-md);
  overflow: hidden;
  flex-shrink: 0;
  background: var(--bg-tertiary);
}

.upcoming-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upcoming-thumb.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
}

.upcoming-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.upcoming-text {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.upcoming-time {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.upcoming-platforms {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

/* ─── Platform icon sizes (used in post cards) ─── */
.platform-icon-small {
  width: 24px;
  height: 24px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.platform-icon-tiny {
  width: 20px;
  height: 20px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* ─── Status badges ─── */
.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  text-transform: capitalize;
  white-space: nowrap;
  flex-shrink: 0;
}

.status-published {
  background: rgba(15, 61, 46, 0.12);
  color: var(--gold-primary);
}

.status-scheduled {
  background: rgba(245, 158, 11, 0.12);
  color: #f59e0b;
}

.status-failed {
  background: rgba(239, 68, 68, 0.12);
  color: #ef4444;
}

.status-cancelled {
  background: rgba(107, 114, 128, 0.12);
  color: #6b7280;
}

.status-draft {
  background: rgba(156, 163, 175, 0.12);
  color: #9ca3af;
}

/* ─── Section 4: Recent Activity Grid ─── */
.activity-section {
  min-width: 0;
}

.activity-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-lg);
}

.activity-card {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: var(--radius-xl);
  overflow: hidden;
  cursor: pointer;
  transition: var(--transition-base);
  animation: fadeSlideUp 0.5s ease both;
  animation-delay: calc(var(--stagger) * 80ms);
}

.activity-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(15, 61, 46, 0.1);
}

.activity-image-wrap {
  position: relative;
  overflow: hidden;
}

.activity-image {
  width: 100%;
  aspect-ratio: 16 / 10;
  object-fit: cover;
  display: block;
  transition: transform 0.3s ease;
}

.activity-card:hover .activity-image {
  transform: scale(1.03);
}

.activity-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-tertiary);
}

.activity-status-badge {
  position: absolute;
  top: var(--space-sm);
  right: var(--space-sm);
  display: inline-block;
  padding: 3px 8px;
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  text-transform: capitalize;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.activity-body {
  padding: var(--space-md);
}

.activity-text {
  font-size: var(--text-sm);
  color: var(--text-primary);
  margin: 0 0 var(--space-sm) 0;
  line-height: var(--leading-relaxed);
}

.activity-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.activity-platforms {
  display: flex;
  gap: 4px;
}

.activity-time {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.empty-activity-card {
  padding: 0;
}

/* ─── Section 5: Engagement Snapshot ─── */
.engagement-section {
  min-width: 0;
}

.engagement-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-lg);
}

.engagement-card {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: var(--radius-xl);
  padding: var(--space-xl);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--space-sm);
  animation: fadeSlideUp 0.5s ease both;
  animation-delay: calc(var(--stagger) * 80ms);
}

.engagement-icon {
  color: #b08a5a;
}

.engagement-value {
  font-family: var(--font-heading);
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  line-height: 1;
}

.engagement-label {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

/* ─── Shared: Loading & Empty States ─── */
.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
  padding: var(--space-3xl);
  color: var(--text-muted);
  text-align: center;
}

.empty-title {
  font-family: var(--font-heading);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0;
}

.empty-desc {
  font-size: var(--text-sm);
  color: var(--text-muted);
  margin: 0;
}

/* ─── Skeleton Loading ─── */
.skeleton-box {
  background: linear-gradient(
    90deg,
    var(--bg-tertiary) 0%,
    var(--bg-elevated) 50%,
    var(--bg-tertiary) 100%
  );
  background-size: 200% 100%;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
  border-radius: var(--radius-md);
  min-width: 60px;
  min-height: 2.5rem;
  display: inline-block;
}

@keyframes skeleton-pulse {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ─── Entrance Animation ─── */
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

/* ─── Welcome Modal ─── */
.welcome-modal {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--space-lg);
}

.welcome-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--gold-subtle);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-lg);
  color: var(--gold-primary);
}

.welcome-title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  color: var(--text-primary);
  margin: 0 0 var(--space-md) 0;
}

.welcome-message {
  font-size: var(--text-base);
  color: var(--text-secondary);
  margin: 0 0 var(--space-xl) 0;
  line-height: 1.5;
}

/* ─── Responsive: 1200px ─── */
@media (max-width: 1200px) {
  .activity-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* ─── Responsive: 768px ─── */
@media (max-width: 768px) {
  .dashboard-redesign {
    gap: var(--space-2xl);
  }

  .hero-content {
    flex-direction: column;
    align-items: flex-start;
  }

  .hero-greeting {
    font-size: var(--text-2xl);
  }

  .hero-cta {
    width: 100%;
    justify-content: center;
  }

  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }

  .engagement-cards {
    grid-template-columns: repeat(2, 1fr);
  }

  .upcoming-item {
    flex-wrap: wrap;
    gap: var(--space-sm);
  }

  .upcoming-platforms {
    order: 4;
  }
}

/* ─── Responsive: 540px ─── */
@media (max-width: 540px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-md);
  }

  .stat-card {
    padding: var(--space-md);
  }

  .stat-value {
    font-size: var(--text-2xl);
  }

  .stat-icon {
    width: 40px;
    height: 40px;
  }

  .activity-grid {
    grid-template-columns: 1fr;
  }

  .upcoming-thumb {
    width: 48px;
    height: 48px;
  }
}

/* ─── Responsive: 390px ─── */
@media (max-width: 390px) {
  .hero-greeting {
    font-size: var(--text-xl);
  }

  .hero-subtitle {
    font-size: var(--text-sm);
  }

  .stat-value {
    font-size: var(--text-xl);
  }

  .stat-label {
    font-size: var(--text-xs);
  }

  .section-title {
    font-size: var(--text-base);
  }

  .upcoming-thumb {
    width: 40px;
    height: 40px;
  }

  .engagement-value {
    font-size: var(--text-2xl);
  }
}

/* ─── Reduced Motion ─── */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }

  .skeleton-box {
    animation: none;
    background: var(--bg-tertiary);
  }
}

/* ─── Landscape ─── */
@media (max-height: 500px) and (orientation: landscape) {
  .dashboard-redesign {
    gap: var(--space-xl);
  }

  .hero-section {
    gap: var(--space-sm);
  }

  .stat-card {
    padding: var(--space-md);
  }
}
</style>

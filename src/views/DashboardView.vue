<script setup lang="ts">
import { debugLog, errorLog, warnLog } from '@/utils/debug'

import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import { useFacebookStore } from '../stores/facebook'
import { useInstagramStore } from '../stores/instagram'
import { useRestaurantsStore } from '../stores/restaurants'
import { usePreferencesStore } from '../stores/preferences'
import { api } from '../services/api'
import DashboardLayout from '../components/DashboardLayout.vue'
import BaseCard from '../components/BaseCard.vue'
import BaseButton from '../components/BaseButton.vue'
import BaseModal from '../components/BaseModal.vue'
import MaterialIcon from '../components/MaterialIcon.vue'
import PlatformLogo from '../components/PlatformLogo.vue'
import ConfirmModal from '../components/ConfirmModal.vue'
import PostDetailModal from '../components/PostDetailModal.vue'

const router = useRouter()
const authStore = useAuthStore()
const facebookStore = useFacebookStore()
const instagramStore = useInstagramStore()
const restaurantsStore = useRestaurantsStore()
const preferencesStore = usePreferencesStore()
const { t } = useI18n()

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

// Restaurants for filter - uses store
const restaurants = computed(() => restaurantsStore.restaurants)
const selectedRestaurantFilter = ref<string>('all')

// Recent posts from API
const recentPosts = ref<any[]>([])
const loadingPosts = ref(false)
const loading = ref(true)

const userName = computed(() => {
  const email = authStore.user?.email || ''
  return email.split('@')[0]
})

// Platform connection status
const isFacebookConnected = computed(() => facebookStore.connectedPages.length > 0)
const isInstagramConnected = computed(() => instagramStore.connectedAccounts.length > 0)

const connectedCount = computed(() => {
  let count = 0
  if (isFacebookConnected.value) count++
  if (isInstagramConnected.value) count++
  return count
})

// Disconnect modal state
const showDisconnectModal = ref(false)
const disconnectModalTitle = ref('')
const disconnectModalMessage = ref('')
const pendingDisconnect = ref<{ type: 'facebook' | 'instagram'; id: string; name: string } | null>(null)

async function handleConfirmDisconnect() {
  showDisconnectModal.value = false
  if (!pendingDisconnect.value) return

  const { type, id } = pendingDisconnect.value

  if (type === 'facebook') {
    await facebookStore.disconnectPage(id)
  } else if (type === 'instagram') {
    await instagramStore.disconnectAccount(id)
  }

  pendingDisconnect.value = null
}

function handleCancelDisconnect() {
  showDisconnectModal.value = false
  pendingDisconnect.value = null
}

// Direct connect functions for platforms
async function handleConnectFacebook() {
  try {
    await facebookStore.connectFacebook()
  } catch (error) {
    errorLog('Failed to connect Facebook:', error)
  }
}

async function handleConnectInstagram() {
  try {
    await instagramStore.connectInstagram()
  } catch (error) {
    errorLog('Failed to connect Instagram:', error)
  }
}

function handlePlatformClick(platform: 'facebook' | 'instagram') {
  if (platform === 'facebook') {
    if (isFacebookConnected.value) {
      router.push('/connect-accounts')
    } else {
      handleConnectFacebook()
    }
  } else if (platform === 'instagram') {
    if (isInstagramConnected.value) {
      router.push('/connect-accounts')
    } else {
      handleConnectInstagram()
    }
  }
}

function getStatusClass(status: string) {
  switch (status?.toLowerCase()) {
    case 'published':
      return 'status-published'
    case 'failed':
      return 'status-failed'
    case 'cancelled':
      return 'status-cancelled'
    case 'draft':
      return 'status-draft'
    case 'scheduled':
    default:
      return 'status-scheduled'
  }
}

function getStatusLabel(status: string) {
  switch (status?.toLowerCase()) {
    case 'published':
      return t('dashboardNew.published')
    case 'failed':
      return t('dashboardNew.failed')
    case 'cancelled':
      return t('dashboardNew.cancelled')
    case 'draft':
      return t('dashboardNew.draft')
    case 'scheduled':
    default:
      return t('dashboardNew.scheduled')
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

// Get media URL from post (handles both favorites and scheduled posts)
// Backend returns nested data in various formats: favorite_posts, favorite_post, favorite
function getPostMediaUrl(post: any): string | null {
  // Direct media_url (favorites/drafts have this)
  if (post.media_url) return post.media_url
  if (post.image_url) return post.image_url
  if (post.video_url) return post.video_url

  // Nested in favorite_posts (plural - backend join format)
  if (post.favorite_posts?.media_url) return post.favorite_posts.media_url
  if (post.favorite_posts?.image_url) return post.favorite_posts.image_url
  if (post.favorite_posts?.video_url) return post.favorite_posts.video_url

  // Nested in favorite_post (singular)
  if (post.favorite_post?.media_url) return post.favorite_post.media_url
  if (post.favorite_post?.image_url) return post.favorite_post.image_url
  if (post.favorite_post?.video_url) return post.favorite_post.video_url

  // Nested in favorite
  if (post.favorite?.media_url) return post.favorite.media_url
  if (post.favorite?.image_url) return post.favorite.image_url
  if (post.favorite?.video_url) return post.favorite.video_url

  return null
}

// Get post text from post (handles both favorites and scheduled posts)
function getPostText(post: any): string | null {
  // Direct post_text
  if (post.post_text) return post.post_text
  if (post.caption) return post.caption

  // Nested in favorite_posts (plural)
  if (post.favorite_posts?.post_text) return post.favorite_posts.post_text
  if (post.favorite_posts?.caption) return post.favorite_posts.caption

  // Nested in favorite_post (singular)
  if (post.favorite_post?.post_text) return post.favorite_post.post_text
  if (post.favorite_post?.caption) return post.favorite_post.caption

  // Nested in favorite
  if (post.favorite?.post_text) return post.favorite.post_text
  if (post.favorite?.caption) return post.favorite.caption

  return null
}

// Get restaurant name from post
function getPostRestaurantName(post: any): string | null {
  if (post.restaurant_name) return post.restaurant_name
  if (post.favorite_posts?.restaurant_name) return post.favorite_posts.restaurant_name
  if (post.favorite_post?.restaurant_name) return post.favorite_post.restaurant_name
  if (post.favorite?.restaurant_name) return post.favorite.restaurant_name

  // Try to find from restaurants list using restaurant_id
  const restaurantId = post.restaurant_id || post.favorite_posts?.restaurant_id || post.favorite_post?.restaurant_id
  if (restaurantId) {
    const restaurant = restaurants.value.find(r => r.id === restaurantId)
    if (restaurant) return restaurant.name
  }

  return null
}

// Get platforms a post was published to (returns array)
function getPostPlatforms(post: any): string[] {
  // Check if post has published_platforms array
  if (post.published_platforms && Array.isArray(post.published_platforms)) {
    return post.published_platforms
  }

  // Check platform_post_urls object
  if (post.platform_post_urls && Object.keys(post.platform_post_urls).length > 0) {
    return Object.keys(post.platform_post_urls)
  }

  // Check platforms array (scheduled posts have this)
  if (post.platforms && Array.isArray(post.platforms) && post.platforms.length > 0) {
    return post.platforms
  }

  // Fallback to single platform field
  const platforms: string[] = []

  if (post.platform) {
    platforms.push(post.platform)
  }

  // Check nested favorite_posts
  if (post.favorite_posts?.platform && !platforms.includes(post.favorite_posts.platform)) {
    platforms.push(post.favorite_posts.platform)
  }

  // Check nested favorite_post
  if (post.favorite_post?.platform && !platforms.includes(post.favorite_post.platform)) {
    platforms.push(post.favorite_post.platform)
  }

  return platforms
}

// Post detail modal state
const showPostDetailModal = ref(false)
const selectedPost = ref<any>(null)

// Welcome modal for first-time users
const showWelcomeModal = ref(false)
const WELCOME_DISMISSED_KEY = 'socialchef_welcome_dismissed'

// Check if welcome modal was already dismissed
function wasWelcomeDismissed(): boolean {
  return localStorage.getItem(WELCOME_DISMISSED_KEY) === 'true'
}

// Dismiss welcome modal and remember
function dismissWelcome() {
  showWelcomeModal.value = false
  localStorage.setItem(WELCOME_DISMISSED_KEY, 'true')
}

// Handle "Let's Go" action - navigate to posts hub
function handleWelcomeLetsGo() {
  dismissWelcome()
  router.push('/posts')
}

// Open post detail modal
function viewPostDetail(post: any) {
  selectedPost.value = post
  showPostDetailModal.value = true
}

// Close post detail modal
function closePostDetailModal() {
  showPostDetailModal.value = false
  selectedPost.value = null
}

// Handle edit action from modal
function handlePostEdit(post: any) {
  closePostDetailModal()
  if (post.status === 'draft') {
    // Navigate to posts hub to edit draft
    router.push('/posts')
  } else {
    // Navigate to scheduler with post ID
    router.push(`/scheduler?post=${post.id}`)
  }
}

// Handle schedule action from modal (for drafts)
function handlePostSchedule(post: any) {
  closePostDetailModal()
  router.push(`/scheduler?favorite=${post.id}`)
}

// Handle delete action from modal
function handlePostDelete(_post: any) {
  // For now, just close the modal - delete functionality can be implemented later
  closePostDetailModal()
  // TODO: Show delete confirmation modal and handle deletion
}

// Computed to check if showing all restaurants
const showRestaurantColumn = computed(() => selectedRestaurantFilter.value === 'all')


// User subscription tier display with price
const userTierDisplay = computed(() => {
  const tier = authStore.subscriptionTier
  if (tier === 'lifetime') return 'Lifetime'
  if (tier === 'yearly') return '$99/yr'
  return '$19/mo'
})

// Tier description and perks
const tierDescription = computed(() => {
  const tier = authStore.subscriptionTier
  if (tier === 'lifetime') return t('dashboardNew.tierLifetimeDesc')
  if (tier === 'yearly') return t('dashboardNew.tierYearlyDesc')
  return t('dashboardNew.tierMonthlyDesc')
})

// Credits remaining
const creditsRemaining = computed(() => {
  return authStore.usageStats?.remaining_credits ?? 0
})

// Load recent posts (scheduled/published + drafts) with optional restaurant filter
async function loadRecentPosts() {
  loadingPosts.value = true
  try {
    const restaurantFilter = selectedRestaurantFilter.value !== 'all'
      ? selectedRestaurantFilter.value
      : undefined

    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    // Build array of months to fetch: current, prev 2, next 1
    const monthsToFetch: { month: number; year: number }[] = []
    for (let i = -2; i <= 1; i++) {
      let m = currentMonth + i
      let y = currentYear
      if (m <= 0) {
        m += 12
        y -= 1
      } else if (m > 12) {
        m -= 12
        y += 1
      }
      monthsToFetch.push({ month: m, year: y })
    }

    // Fetch scheduled posts and favorites (drafts) in parallel
    const [scheduledResponses, favoritesResponse] = await Promise.all([
      // Fetch scheduled posts from multiple months
      Promise.all(
        monthsToFetch.map(({ month, year }) =>
          api.getScheduledPosts({
            month,
            year,
            restaurant_ids: restaurantFilter ? [restaurantFilter] : undefined
          })
        )
      ),
      // Fetch favorites (drafts) - these are saved but not scheduled
      api.getFavorites({
        restaurant_id: restaurantFilter,
        limit: 10,
        sort: 'newest'
      })
    ])

    // Combine all scheduled posts
    const scheduledPosts: any[] = []
    for (const response of scheduledResponses) {
      if (response.success && response.data?.scheduled_posts) {
        scheduledPosts.push(...response.data.scheduled_posts)
      }
    }

    // Get the favorite_post_ids that are already scheduled (to exclude from drafts)
    const scheduledFavoriteIds = new Set(
      scheduledPosts
        .filter(p => p.favorite_post_id)
        .map(p => p.favorite_post_id)
    )

    // Get favorites that are NOT scheduled (true drafts)
    const drafts: any[] = []
    if (favoritesResponse.success && favoritesResponse.data?.favorites) {
      for (const fav of favoritesResponse.data.favorites) {
        // Only include if not already scheduled
        if (!scheduledFavoriteIds.has(fav.id)) {
          drafts.push({
            ...fav,
            status: 'draft', // Mark as draft
            // Map favorite fields to match scheduled post structure
            post_text: fav.post_text,
            media_url: fav.media_url,
            restaurant_name: fav.restaurant_name || restaurants.value.find(r => r.id === fav.restaurant_id)?.name
          })
        }
      }
    }

    // Combine scheduled posts and drafts
    const allPosts = [...scheduledPosts, ...drafts]

    // Remove duplicates by id
    const uniquePosts = allPosts.filter((post, index, self) =>
      index === self.findIndex(p => p.id === post.id)
    )

    // Sort by date descending and take first 5
    const sortedPosts = uniquePosts
      .sort((a: any, b: any) => {
        const dateA = new Date(a.scheduled_time || a.created_at).getTime()
        const dateB = new Date(b.scheduled_time || b.created_at).getTime()
        return dateB - dateA
      })
      .slice(0, 5)

    recentPosts.value = sortedPosts
  } catch (error) {
    errorLog('Failed to load recent posts:', error)
    recentPosts.value = []
  } finally {
    loadingPosts.value = false
  }
}

// Handle restaurant filter change
function onRestaurantFilterChange() {
  loadRecentPosts()
}

// Load data on mount
onMounted(async () => {
  try {
    // Load profile and connected pages/accounts
    await authStore.refreshProfile()
    await Promise.all([
      facebookStore.loadConnectedPages(),
      instagramStore.loadConnectedAccounts()
    ])

    // Load real stats from API
    const statsResponse = await api.getStats()
    if (statsResponse.success && statsResponse.data) {
      stats.value = {
        postsCreated: statsResponse.data.postsCreated || 0,
        postsSaved: statsResponse.data.favoritesSaved || 0,
        scheduledPosts: statsResponse.data.scheduledPosts || 0,
        restaurantsAdded: statsResponse.data.restaurantsAdded || 0
      }
    }

    // Load restaurants for filter (uses store)
    await restaurantsStore.initialize()

    // Load recent posts (favorites)
    await loadRecentPosts()

    // Show welcome modal for first-time users (no restaurants and not dismissed)
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
    <!-- Header Left Slot: Welcome Message -->
    <template #header-left>
      <div class="welcome-section">
        <span class="welcome-label">{{ $t('dashboard.welcomeBack', { name: '' }).replace(', !', '') }}</span>
        <h1 class="welcome-name">{{ userName }}</h1>
      </div>
    </template>

    <div class="dashboard-content">
      <!-- Dashboard Cards Grid - 2x2 layout -->
      <section class="dashboard-cards-grid">
        <!-- Posts Created Card -->
        <div class="dashboard-card" @click="router.push('/posts')">
          <div class="card-header">
            <div class="card-icon-wrapper">
              <MaterialIcon icon="palette" size="lg" />
            </div>
          </div>
          <div class="card-body">
            <div class="card-value">{{ stats.postsCreated }}</div>
            <div class="card-label">{{ $t('dashboard.postsCreated') }}</div>
          </div>
          <div class="card-footer">
            <span class="card-link">{{ $t('dashboardNew.viewAll') }} →</span>
          </div>
        </div>

        <!-- Scheduled Posts Card -->
        <div class="dashboard-card" @click="router.push('/scheduler')">
          <div class="card-header">
            <div class="card-icon-wrapper">
              <MaterialIcon icon="calendar_month" size="lg" />
            </div>
          </div>
          <div class="card-body">
            <div class="card-value">{{ stats.scheduledPosts }}</div>
            <div class="card-label">{{ $t('dashboard.scheduledPosts') }}</div>
          </div>
          <div class="card-footer">
            <span class="card-link">{{ $t('dashboardNew.viewCalendar') }} →</span>
          </div>
        </div>

        <!-- Saved & Restaurants Card -->
        <div class="dashboard-card" @click="router.push('/posts')">
          <div class="card-header">
            <div class="card-icon-wrapper">
              <MaterialIcon icon="bookmark" size="lg" />
            </div>
          </div>
          <div class="card-body">
            <div class="card-stats-row">
              <div class="card-stat">
                <span class="card-stat-value">{{ stats.postsSaved }}</span>
                <span class="card-stat-label">{{ $t('dashboard.postsSaved') }}</span>
              </div>
              <div class="card-stat-divider"></div>
              <div class="card-stat">
                <span class="card-stat-value">{{ stats.restaurantsAdded }}</span>
                <span class="card-stat-label">{{ $t('dashboard.restaurants') }}</span>
              </div>
            </div>
          </div>
          <div class="card-footer">
            <span class="card-link">{{ $t('dashboardNew.manageSaved') }} →</span>
          </div>
        </div>

        <!-- Settings Card -->
        <div class="dashboard-card" @click="router.push('/profile')">
          <div class="card-header">
            <div class="card-icon-wrapper">
              <MaterialIcon icon="settings" size="lg" />
            </div>
            <span class="tier-badge" :class="`tier-${authStore.subscriptionTier}`">{{ userTierDisplay }}</span>
          </div>
          <div class="card-body">
            <div class="card-title">{{ $t('dashboardNew.settings') }}</div>
            <div class="tier-description">{{ tierDescription }}</div>
            <div class="card-mini-stats settings-stats">
              <span class="mini-stat">
                <span class="mini-stat-value">{{ creditsRemaining }}</span>
                <span class="mini-stat-label">{{ $t('dashboardNew.creditsLeft') }}</span>
              </span>
            </div>
          </div>
          <div class="card-footer">
            <span class="card-link">{{ $t('dashboardNew.openSettings') }} →</span>
          </div>
        </div>
      </section>

      <!-- Main Grid: Recent Posts + Platforms -->
      <div class="main-grid">
        <!-- Recent Posts Table -->
        <section class="recent-posts-section">
          <div class="section-header">
            <div class="section-header-left">
              <h2 class="section-title">{{ $t('dashboardNew.recentPosts') }}</h2>
              <!-- Restaurant Filter -->
              <select
                v-model="selectedRestaurantFilter"
                class="restaurant-filter"
                @change="onRestaurantFilterChange"
              >
                <option value="all">{{ $t('dashboardNew.allRestaurants') }}</option>
                <option
                  v-for="restaurant in restaurants"
                  :key="restaurant.id"
                  :value="restaurant.id"
                >
                  {{ restaurant.name }}
                </option>
              </select>
            </div>
            <router-link
              v-if="selectedRestaurantFilter !== 'all'"
              to="/posts"
              class="view-all-link"
            >
              {{ $t('dashboardNew.viewAll') }} →
            </router-link>
          </div>

          <BaseCard variant="glass" class="posts-table-card">
            <div v-if="loading || loadingPosts" class="loading-state">
              <MaterialIcon icon="hourglass_empty" size="xl" color="var(--text-muted)" />
              <span>{{ $t('common.loading') }}</span>
            </div>

            <div v-else-if="recentPosts.length === 0" class="empty-state">
              <p>{{ $t('dashboardNew.noRecentPosts') }}</p>
              <BaseButton variant="primary" size="small" @click="goToCreateContent">
                {{ $t('dashboardNew.createFirstPost') }}
              </BaseButton>
            </div>

            <table v-else class="posts-table" :class="{ 'hide-restaurant': !showRestaurantColumn }">
              <thead>
                <tr>
                  <th>{{ $t('dashboardNew.post') }}</th>
                  <th>{{ $t('dashboardNew.platforms') }}</th>
                  <th>{{ $t('dashboardNew.status') }}</th>
                  <th class="restaurant-header">{{ $t('dashboardNew.restaurant') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="post in recentPosts"
                  :key="post.id"
                  class="post-row"
                  @click="viewPostDetail(post)"
                >
                  <td class="post-cell">
                    <div class="post-info">
                      <div v-if="getPostMediaUrl(post)" class="post-thumbnail">
                        <img :src="getPostMediaUrl(post)" :alt="getPostText(post) || 'Post'" />
                      </div>
                      <div v-else class="post-thumbnail placeholder">
                        <MaterialIcon icon="image" size="sm" color="var(--text-muted)" />
                      </div>
                      <div class="post-details">
                        <span class="post-title">{{ getPostText(post)?.substring(0, 35) || 'Untitled Post' }}{{ getPostText(post)?.length > 35 ? '...' : '' }}</span>
                        <span class="post-time">{{ formatTimeAgo(post.created_at) }}</span>
                      </div>
                    </div>
                  </td>
                  <td class="platforms-cell">
                    <div class="platform-icons">
                      <div
                        v-for="platform in getPostPlatforms(post)"
                        :key="platform"
                        class="platform-icon-small"
                        :class="`platform-bg-${platform}`"
                        :title="platform"
                      >
                        <PlatformLogo :platform="platform as any" :size="14" />
                      </div>
                      <span v-if="getPostPlatforms(post).length === 0" class="muted">—</span>
                    </div>
                  </td>
                  <td>
                    <span class="status-badge" :class="getStatusClass(post.status || 'scheduled')">
                      {{ getStatusLabel(post.status || 'scheduled') }}
                    </span>
                  </td>
                  <td class="restaurant-cell">
                    <span v-if="getPostRestaurantName(post)" class="restaurant-name">
                      {{ getPostRestaurantName(post) }}
                    </span>
                    <span v-else class="muted">—</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </BaseCard>
        </section>

        <!-- Platforms Panel -->
        <section class="platforms-section">
          <div class="section-header">
            <h2 class="section-title">{{ $t('dashboardNew.platforms') }}</h2>
            <span class="platforms-count">{{ connectedCount }} {{ $t('dashboardNew.activeCount') }}</span>
          </div>

          <BaseCard variant="glass" class="platforms-card">
            <!-- Facebook -->
            <div class="platform-row platform-row-clickable" @click="handlePlatformClick('facebook')">
              <div class="platform-info">
                <div class="platform-icon-box platform-bg-facebook">
                  <PlatformLogo platform="facebook" :size="20" />
                </div>
                <div class="platform-details">
                  <span class="platform-name">Facebook</span>
                  <span v-if="isFacebookConnected" class="platform-followers">
                    {{ facebookStore.connectedPages[0]?.pageName || '' }}
                  </span>
                </div>
              </div>
              <div class="platform-status">
                <span v-if="isFacebookConnected" class="status-dot-online"></span>
                <span v-if="!isFacebookConnected" class="connect-btn">
                  {{ $t('dashboard.connect') }}
                </span>
              </div>
            </div>

            <!-- Instagram -->
            <div class="platform-row platform-row-clickable" @click="handlePlatformClick('instagram')">
              <div class="platform-info">
                <div class="platform-icon-box platform-bg-instagram">
                  <PlatformLogo platform="instagram" :size="20" />
                </div>
                <div class="platform-details">
                  <span class="platform-name">Instagram</span>
                  <span v-if="isInstagramConnected" class="platform-followers">
                    @{{ instagramStore.connectedAccounts[0]?.username || '' }}
                  </span>
                </div>
              </div>
              <div class="platform-status">
                <span v-if="isInstagramConnected" class="status-dot-online"></span>
                <span v-if="!isInstagramConnected" class="connect-btn">
                  {{ $t('dashboard.connect') }}
                </span>
              </div>
            </div>

            <!-- X/Twitter -->
            <div class="platform-row platform-disabled">
              <div class="platform-info">
                <div class="platform-icon-box platform-bg-twitter">
                  <PlatformLogo platform="twitter" :size="20" />
                </div>
                <div class="platform-details">
                  <span class="platform-name">X</span>
                </div>
              </div>
              <div class="platform-status">
                <span class="connect-btn disabled">{{ $t('dashboard.connect') }}</span>
              </div>
            </div>

            <!-- LinkedIn -->
            <div class="platform-row platform-disabled">
              <div class="platform-info">
                <div class="platform-icon-box platform-bg-linkedin">
                  <PlatformLogo platform="linkedin" :size="20" />
                </div>
                <div class="platform-details">
                  <span class="platform-name">LinkedIn</span>
                </div>
              </div>
              <div class="platform-status">
                <span class="connect-btn disabled">{{ $t('dashboard.connect') }}</span>
              </div>
            </div>

            <!-- TikTok -->
            <div class="platform-row platform-disabled">
              <div class="platform-info">
                <div class="platform-icon-box platform-bg-tiktok">
                  <PlatformLogo platform="tiktok" :size="20" />
                </div>
                <div class="platform-details">
                  <span class="platform-name">TikTok</span>
                </div>
              </div>
              <div class="platform-status">
                <span class="connect-btn disabled">{{ $t('dashboard.connect') }}</span>
              </div>
            </div>

            <!-- YouTube -->
            <div class="platform-row platform-disabled">
              <div class="platform-info">
                <div class="platform-icon-box platform-bg-youtube">
                  <PlatformLogo platform="youtube" :size="20" />
                </div>
                <div class="platform-details">
                  <span class="platform-name">YouTube</span>
                </div>
              </div>
              <div class="platform-status">
                <span class="connect-btn disabled">{{ $t('dashboard.connect') }}</span>
              </div>
            </div>
          </BaseCard>
        </section>
      </div>
    </div>

    <!-- Disconnect Confirm Modal -->
    <ConfirmModal
      v-model="showDisconnectModal"
      :title="disconnectModalTitle"
      :message="disconnectModalMessage"
      type="danger"
      :confirm-text="$t('connectAccounts.disconnect')"
      :cancel-text="$t('common.cancel')"
      :auto-close-seconds="0"
      @confirm="handleConfirmDisconnect"
      @cancel="handleCancelDisconnect"
    />

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
.dashboard-content {
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  overflow-x: hidden;
}

/* Welcome Section */
.welcome-section {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.welcome-label {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.welcome-name {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  margin: 0;
}

/* Dashboard Cards Grid - 2x2 layout */
.dashboard-cards-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-xl);
  margin-bottom: var(--space-3xl);
}

.dashboard-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  padding: var(--space-xl);
  cursor: pointer;
  transition: var(--transition-base);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  min-height: 180px;
}

.dashboard-card:hover {
  border-color: var(--gold-primary);
  box-shadow: var(--glow-gold-sm);
}

.dashboard-card:active {
  background: var(--bg-tertiary);
}

/* Card Header - Icon + Action Button */
.card-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-lg);
  width: 100%;
  position: relative;
}

.card-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  background: var(--gold-subtle);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--gold-primary);
}

/* Card Body */
.card-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

/* Mini Stats (for scheduled posts card) */
.card-mini-stats {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-top: var(--space-sm);
}

.mini-stat {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.mini-stat-value {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.mini-stat-label {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.mini-stat-divider {
  color: var(--text-muted);
  font-size: var(--text-xs);
}

.settings-stats {
  margin-top: var(--space-md);
}

/* Tier Badge */
.tier-badge {
  position: absolute;
  top: 0;
  right: 0;
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.tier-badge.tier-lifetime {
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.2), rgba(212, 175, 55, 0.1));
  color: var(--gold-primary);
  border: 1px solid var(--gold-primary);
}

.tier-badge.tier-yearly {
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.4);
}

.tier-badge.tier-monthly {
  background: rgba(156, 163, 175, 0.15);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}

.tier-description {
  font-size: var(--text-sm);
  color: var(--text-muted);
  line-height: var(--leading-relaxed);
  margin-bottom: var(--space-sm);
}

.card-value {
  font-family: var(--font-heading);
  font-size: var(--text-5xl);
  font-weight: var(--font-bold);
  line-height: 1;
  margin-bottom: var(--space-sm);
  background: var(--gradient-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.card-label {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  font-weight: var(--font-medium);
}

.card-title {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin-bottom: var(--space-xs);
}

.card-description {
  font-size: var(--text-sm);
  color: var(--text-muted);
  line-height: var(--leading-relaxed);
}

/* Card Footer */
.card-footer {
  margin-top: var(--space-lg);
  padding-top: var(--space-md);
  border-top: 1px solid var(--border-color);
}

.card-link {
  font-size: var(--text-sm);
  color: var(--gold-primary);
  font-weight: var(--font-medium);
  transition: var(--transition-fast);
}

.dashboard-card:hover .card-link {
  color: var(--gold-light);
}

/* Combined Stats Row (for Saved & Restaurants) */
.card-stats-row {
  display: flex;
  align-items: center;
  gap: var(--space-2xl);
}

.card-stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.card-stat-value {
  font-family: var(--font-heading);
  font-size: var(--text-4xl);
  font-weight: var(--font-bold);
  line-height: 1;
  background: var(--gradient-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.card-stat-label {
  font-size: var(--text-xs);
  color: var(--text-muted);
  font-weight: var(--font-medium);
}

.card-stat-divider {
  width: 1px;
  height: 50px;
  background: var(--border-color);
}

/* Section */
.section {
  margin-bottom: var(--space-3xl);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-lg);
  flex-wrap: wrap;
  gap: var(--space-md);
}

.section-header-left {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  flex-wrap: wrap;
}

.section-title {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0;
}

/* Restaurant Filter */
.restaurant-filter {
  appearance: none;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: var(--space-sm) var(--space-2xl) var(--space-sm) var(--space-md);
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: var(--transition-base);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23D4AF37' d='M6 8L2 4h8z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  min-width: 140px;
}

.restaurant-filter:hover {
  border-color: var(--gold-primary);
}

.restaurant-filter:focus {
  outline: none;
  border-color: var(--gold-primary);
  box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.15);
}

.restaurant-filter option {
  background: var(--bg-primary);
  color: var(--text-primary);
}

.view-all-link {
  font-size: var(--text-sm);
  color: var(--gold-primary);
  text-decoration: none;
  transition: var(--transition-fast);
}

.view-all-link:hover {
  color: var(--gold-light);
}


/* Main Grid: Posts + Platforms */
.main-grid {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: var(--space-xl);
  align-items: stretch;
}

/* Recent Posts Section */
.recent-posts-section {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.recent-posts-section .posts-table-card {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.recent-posts-section .posts-table {
  flex: 1;
}

.posts-table-card {
  padding: 0;
  overflow: hidden;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
  padding: var(--space-3xl);
  color: var(--text-muted);
}

.posts-table {
  width: 100%;
  border-collapse: collapse;
}

.posts-table th {
  text-align: left;
  padding: var(--space-md) var(--space-lg);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--border-color);
}

.posts-table td {
  padding: var(--space-md) var(--space-lg);
  border-bottom: 1px solid var(--border-color);
}

.posts-table tbody tr:last-child td {
  border-bottom: none;
}

.post-row {
  cursor: pointer;
  transition: var(--transition-fast);
}

.post-row:hover {
  background: var(--bg-elevated);
}

.post-cell {
  min-width: 200px;
}

.post-info {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

/* Post Thumbnail */
.post-thumbnail {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  overflow: hidden;
  flex-shrink: 0;
  background: var(--bg-tertiary);
}

.post-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.post-thumbnail.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
}

.post-platform-icon {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.post-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.post-title {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.post-time {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  text-transform: capitalize;
}

.status-published {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}

.status-scheduled {
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
}

.status-failed {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.status-cancelled {
  background: rgba(107, 114, 128, 0.15);
  color: #6b7280;
}

.status-draft {
  background: rgba(156, 163, 175, 0.15);
  color: #9ca3af;
}

/* Platform Icons in Table */
.platforms-cell {
  white-space: nowrap;
}

.platform-icons {
  display: flex;
  align-items: center;
  gap: 4px;
}

.platform-icon-small {
  width: 24px;
  height: 24px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* Restaurant Cell - Animated show/hide */
.restaurant-header,
.restaurant-cell {
  max-width: 150px;
  overflow: hidden;
  transition: max-width 0.3s ease, padding 0.3s ease, opacity 0.3s ease;
}

.posts-table.hide-restaurant .restaurant-header,
.posts-table.hide-restaurant .restaurant-cell {
  max-width: 0;
  padding-left: 0;
  padding-right: 0;
  opacity: 0;
}

.restaurant-name {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

.engagement-cell,
.reach-cell {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.muted {
  color: var(--text-muted);
}

/* Platforms Section */
.platforms-section {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.platforms-section .platforms-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.platforms-count {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: #22c55e;
  background: rgba(34, 197, 94, 0.15);
  padding: 4px 12px;
  border-radius: var(--radius-full);
}

.platforms-card {
  padding: var(--space-md);
}

.platform-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md);
  border-radius: var(--radius-md);
  transition: var(--transition-fast);
}

.platform-row:hover:not(.platform-disabled) {
  background: var(--bg-elevated);
}

.platform-row-clickable {
  cursor: pointer;
}

.platform-row.platform-disabled {
  opacity: 0.5;
}

.platform-info {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.platform-icon-box {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.platform-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.platform-name {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-primary);
}

.platform-followers {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.platform-status {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.status-dot-online {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 8px rgba(34, 197, 94, 0.5);
}

.connect-btn {
  font-size: var(--text-sm);
  color: var(--gold-primary);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: var(--transition-fast);
}

.connect-btn:hover:not(.disabled) {
  color: var(--gold-light);
}

.connect-btn.disabled {
  color: var(--text-muted);
  cursor: not-allowed;
}

/* Responsive */
@media (max-width: 1200px) {
  .main-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .dashboard-cards-grid {
    gap: var(--space-md);
  }

  .dashboard-card {
    min-height: 160px;
  }

  .posts-table th:nth-child(3),
  .posts-table th:nth-child(4),
  .posts-table td:nth-child(3),
  .posts-table td:nth-child(4) {
    display: none;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .section-header-left {
    flex-direction: column;
    width: 100%;
    gap: var(--space-sm);
    align-items: flex-start;
  }

  .restaurant-filter {
    width: 100%;
    min-height: var(--touch-target-min);
  }

  .posts-table-card {
    overflow-x: auto;
  }

  .posts-table {
    min-width: 500px;
  }
}

@media (max-width: 540px) {
  .dashboard-cards-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-md);
  }

  .dashboard-card {
    min-height: auto;
    padding: var(--space-md);
  }

  .card-header {
    margin-bottom: var(--space-md);
  }

  .card-icon-wrapper {
    width: 40px;
    height: 40px;
  }

  /* Hide mini stats on mobile */
  .card-mini-stats {
    display: none;
  }

  /* Hide tier badge on small screens */
  .tier-badge {
    display: none;
  }

  .card-value {
    font-size: var(--text-3xl);
  }

  .card-label {
    font-size: var(--text-xs);
  }

  .card-stat-value {
    font-size: var(--text-2xl);
  }

  .card-stat-label {
    font-size: 10px;
  }

  .card-stats-row {
    gap: var(--space-lg);
  }

  .card-stat-divider {
    height: 36px;
  }

  .card-footer {
    margin-top: var(--space-md);
    padding-top: var(--space-sm);
  }

  .card-link {
    font-size: var(--text-xs);
  }

  .card-title {
    font-size: var(--text-base);
  }

  .card-description {
    font-size: var(--text-xs);
  }
}

@media (max-width: 480px) {
  .dashboard-content {
    padding: var(--space-md);
  }

  .welcome-name {
    font-size: var(--text-xl);
  }

  .section {
    margin-bottom: var(--space-2xl);
  }

  .section-title {
    font-size: var(--text-base);
  }

  .main-grid {
    gap: var(--space-lg);
  }

  .platforms-card {
    padding: var(--space-sm);
  }

  .platform-row {
    padding: var(--space-sm);
  }

  .platform-icon-box {
    width: 32px;
    height: 32px;
  }

  .connect-btn {
    min-height: var(--touch-target-min);
    padding: var(--space-sm) var(--space-md);
  }

  .loading-state,
  .empty-state {
    padding: var(--space-2xl);
  }

  .posts-table th,
  .posts-table td {
    padding: var(--space-sm) var(--space-md);
  }

  .post-thumbnail {
    width: 36px;
    height: 36px;
  }
}

@media (max-width: 390px) {
  .welcome-name {
    font-size: var(--text-lg);
  }

  .card-value {
    font-size: var(--text-2xl);
  }

  .card-stat-value {
    font-size: var(--text-xl);
  }

  .card-stat-label {
    font-size: 9px;
  }

  .card-stats-row {
    gap: var(--space-md);
  }

  .card-stat-divider {
    height: 30px;
  }

  .section-title {
    font-size: var(--text-sm);
  }

  .platforms-count {
    font-size: var(--text-xs);
    padding: 3px 8px;
  }

  .platform-name {
    font-size: var(--text-xs);
  }

  .post-title {
    font-size: var(--text-xs);
  }
}

/* Welcome Modal */
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
</style>

<script setup lang="ts">
import { debugLog, errorLog, warnLog } from '@/utils/debug'

import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { Line, Doughnut, Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import DashboardLayout from '../components/DashboardLayout.vue'
import BaseCard from '../components/BaseCard.vue'
import BaseModal from '../components/BaseModal.vue'
import BaseAlert from '../components/BaseAlert.vue'
import MaterialIcon from '../components/MaterialIcon.vue'
import PlatformLogo from '../components/PlatformLogo.vue'
import Toast from '../components/Toast.vue'
import { api } from '../services/api'
import { useAuthStore } from '../stores/auth'
import { useRestaurantsStore } from '../stores/restaurants'
import { useThemeStore } from '../stores/theme'
import { useEngagementStore } from '../stores/engagement'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const restaurantsStore = useRestaurantsStore()
const themeStore = useThemeStore()
const engagementStore = useEngagementStore()

// Theme-aware colors for charts
const isDark = computed(() => themeStore.theme === 'dark')

// Subscription tier display
const subscriptionTierDisplay = computed(() => {
  if (authStore.isAdmin) {
    return 'Admin'
  }
  const tier = authStore.user?.subscription?.tier
  // Skip free tier - we don't have a free tier
  if (!tier || tier === 'free') {
    return 'Monthly' // Default to monthly
  }
  return tier.charAt(0).toUpperCase() + tier.slice(1)
})

// State
const loading = ref(true)
const refreshingEngagement = ref(false)
const stats = ref({
  postsCreated: 0,
  favoritesSaved: 0,
  scheduledPosts: 0,
  restaurantsAdded: 0
})
const scheduledPosts = ref<any[]>([])
const favorites = ref<any[]>([])
const selectedTimeRange = ref<'7d' | '30d' | '90d' | 'all'>('30d')
const selectedStatusFilter = ref<'all' | 'published' | 'scheduled' | 'cancelled' | 'failed' | 'pending' | 'draft'>('all')
const selectedPlatform = ref<'all' | 'facebook' | 'instagram' | 'tiktok' | 'twitter' | 'linkedin'>('all')
const selectedPost = ref<any | null>(null)
const showPostModal = ref(false)
const currentPage = ref(1)
const itemsPerPage = 10
const sortBy = ref<'date' | 'views' | 'likes' | 'engagement'>('date')
const sortDirection = ref<'asc' | 'desc'>('desc')

// Toast notifications
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref<'success' | 'error' | 'info' | 'warning'>('info')

// Engagement sync status
const lastEngagementSync = ref<Date | null>(null)
const engagementDataAvailable = ref(false)

// Diagnostic info
const diagnosticInfo = ref({
  publishedPostsCount: 0,
  apiResponseReceived: false,
  apiResponseSuccess: false,
  engagementPostsReturned: 0,
  backendIssue: false,
  lastApiCall: null as Date | null
})

// Helper to show toast notifications
function displayToast(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') {
  toastMessage.value = message
  toastType.value = type
  showToast.value = true
}

// Helper to get time since last sync
const timeSinceLastSync = computed(() => {
  if (!lastEngagementSync.value) return null
  const now = new Date()
  const diff = now.getTime() - lastEngagementSync.value.getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return t('analytics.justNow', 'Just now')
  if (minutes === 1) return t('analytics.oneMinuteAgo', '1 minute ago')
  if (minutes < 60) return t('analytics.minutesAgo', { minutes }, `${minutes} minutes ago`)
  const hours = Math.floor(minutes / 60)
  if (hours === 1) return t('analytics.oneHourAgo', '1 hour ago')
  if (hours < 24) return t('analytics.hoursAgo', { hours }, `${hours} hours ago`)
  const days = Math.floor(hours / 24)
  if (days === 1) return t('analytics.oneDayAgo', '1 day ago')
  return t('analytics.daysAgo', { days }, `${days} days ago`)
})

// Fetch data
async function fetchAnalyticsData() {
  loading.value = true
  try {
    const [statsResponse, postsResponse, favoritesResponse] = await Promise.all([
      api.getStats(),
      api.getScheduledPosts({}),
      api.getFavorites({ limit: 1000 }) // Fetch all favorites for filtering
    ])

    if (statsResponse.success && statsResponse.data) {
      stats.value = statsResponse.data
    }

    if (postsResponse.success && postsResponse.data) {
      scheduledPosts.value = postsResponse.data.scheduled_posts || []
    }

    if (favoritesResponse.success && favoritesResponse.data) {
      favorites.value = favoritesResponse.data.favorites || []
    }

    // Fetch engagement for published posts
    debugLog('[Analytics] ===== ENGAGEMENT DATA FETCH STARTING =====')

    const publishedPosts = scheduledPosts.value.filter(p => p.status === 'published')
    const publishedPostIds = publishedPosts.map(p => p.id)

    debugLog(`[Analytics] Total posts fetched: ${scheduledPosts.value.length}`)
    debugLog(`[Analytics] Published posts count: ${publishedPosts.length}`)
    debugLog(`[Analytics] Published post IDs being sent to bulk endpoint:`, publishedPostIds)

    // Update diagnostic info
    diagnosticInfo.value.publishedPostsCount = publishedPosts.length

    if (publishedPostIds.length === 0) {
      warnLog('[Analytics] No published posts found - engagement metrics will be zero')
      displayToast(t('analytics.noPublishedPosts', 'No published posts yet. Publish posts to see engagement metrics!'), 'info')
      engagementDataAvailable.value = false
      diagnosticInfo.value.backendIssue = false
    } else {
      try {
        debugLog(`[Analytics] Calling API.getBulkEngagement with ${publishedPostIds.length} post IDs`)
        diagnosticInfo.value.lastApiCall = new Date()
        const engagementResponse = await api.getBulkEngagement(publishedPostIds)

        // Update diagnostic info
        diagnosticInfo.value.apiResponseReceived = true
        diagnosticInfo.value.apiResponseSuccess = engagementResponse.success

        debugLog('[Analytics] Raw API response from /api/engagement/bulk:', {
          success: engagementResponse.success,
          hasData: !!engagementResponse.data,
          dataKeys: engagementResponse.data ? Object.keys(engagementResponse.data) : [],
          fullResponse: engagementResponse
        })

        if (engagementResponse.success && engagementResponse.data) {
          const postsData = engagementResponse.data.posts || []
          diagnosticInfo.value.engagementPostsReturned = postsData.length

          debugLog(`[Analytics] Engagement data structure:`, {
            postsCount: postsData.length,
            samplePost: postsData[0] || null
          })

          if (postsData.length === 0) {
            warnLog('[Analytics] API returned success but empty posts array')
            diagnosticInfo.value.backendIssue = true
            displayToast(
              t('analytics.engagementNotSynced', 'Engagement data not synced yet. Click "Refresh Metrics" to sync from social platforms.'),
              'warning'
            )
            engagementDataAvailable.value = false
          } else {
            // Store engagement data
            const totalEngagement = { likes: 0, comments: 0, shares: 0 }
            postsData.forEach((post: any) => {
              debugLog(`[Analytics] Processing post ${post.scheduled_post_id}:`, post.platforms)
              engagementStore.setPostEngagement(post.scheduled_post_id, post.platforms)

              // Calculate totals for logging
              Object.values(post.platforms || {}).forEach((metrics: any) => {
                totalEngagement.likes += metrics.likes || 0
                totalEngagement.comments += metrics.comments || 0
                totalEngagement.shares += metrics.shares || 0
              })
            })

            debugLog('[Analytics] Successfully stored engagement for all posts. Totals:', totalEngagement)
            lastEngagementSync.value = new Date()
            engagementDataAvailable.value = true

            // Verify data was stored correctly
            debugLog('[Analytics] Verifying stored engagement data:')
            publishedPostIds.forEach(postId => {
              const stored = engagementStore.getPostEngagement(postId)
              debugLog(`  - Post ${postId}:`, stored ? 'HAS DATA' : 'NO DATA', stored)
            })
          }
        } else {
          errorLog('[Analytics] Engagement API call failed or returned no data:', {
            success: engagementResponse.success,
            error: engagementResponse.error,
            message: engagementResponse.message
          })
          displayToast(
            t('analytics.engagementFetchFailed', 'Failed to fetch engagement data. Please try refreshing.'),
            'error'
          )
          engagementDataAvailable.value = false
        }
      } catch (error) {
        errorLog('[Analytics] Exception while fetching engagement:', error)
        displayToast(
          t('analytics.engagementError', 'Error loading engagement data. Please check console for details.'),
          'error'
        )
        engagementDataAvailable.value = false
      }
    }

    debugLog('[Analytics] ===== ENGAGEMENT DATA FETCH COMPLETE =====')
    debugLog('')

    await restaurantsStore.fetchRestaurants()
  } catch (error) {
    errorLog('Failed to fetch analytics:', error)
  } finally {
    loading.value = false
  }
}

// Helper to check if a date is within the selected range
function isWithinTimeRange(dateStr: string | undefined): boolean {
  if (!dateStr) return false
  if (selectedTimeRange.value === 'all') return true

  const date = new Date(dateStr)
  const now = new Date()
  const days = selectedTimeRange.value === '7d' ? 7 : selectedTimeRange.value === '30d' ? 30 : 90
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

  return date >= cutoff
}

// Posts filtered by time range only (for charts and stats cards)
const timeRangeFilteredPosts = computed(() => {
  if (selectedTimeRange.value === 'all') return scheduledPosts.value

  return scheduledPosts.value.filter(post => {
    const postDate = post.scheduled_date || post.published_date
    return isWithinTimeRange(postDate)
  })
})

// Platform tabs with counts
const platformTabs = computed(() => {
  const tabs: Array<{
    key: 'all' | 'facebook' | 'instagram' | 'tiktok' | 'twitter' | 'linkedin'
    label: string
    icon: string | null
    count: number
  }> = [
    {
      key: 'all',
      label: t('analytics.allPlatforms'),
      icon: null,
      count: timeRangeFilteredPosts.value.length
    }
  ]

  const platforms: Array<'facebook' | 'instagram' | 'tiktok' | 'twitter' | 'linkedin'> =
    ['facebook', 'instagram', 'tiktok', 'twitter', 'linkedin']

  platforms.forEach(platform => {
    const count = timeRangeFilteredPosts.value.filter(post =>
      post.platforms?.includes(platform)
    ).length

    // Only show tabs for platforms with posts
    if (count > 0) {
      tabs.push({
        key: platform,
        label: t(`platforms.${platform}`),
        icon: platform,
        count
      })
    }
  })

  return tabs
})

// Posts filtered by time range AND platform
const platformFilteredPosts = computed(() => {
  if (selectedPlatform.value === 'all') {
    return timeRangeFilteredPosts.value
  }

  // Filter posts that include the selected platform
  return timeRangeFilteredPosts.value.filter(post =>
    post.platforms?.includes(selectedPlatform.value)
  )
})

// Posts filtered by both time range, platform AND status (for Recent Activity table only)
const filteredPosts = computed(() => {
  let posts = platformFilteredPosts.value

  // Filter by status (only affects the activity table)
  if (selectedStatusFilter.value !== 'all') {
    posts = posts.filter(post => post.status === selectedStatusFilter.value)
  }

  return posts
})

// Posts sorted and filtered for table display
const sortedAndFilteredPosts = computed(() => {
  const posts = [...filteredPosts.value]

  if (sortBy.value === 'date') {
    return posts.sort((a, b) => {
      const dateA = new Date(a.scheduled_date || a.published_date).getTime()
      const dateB = new Date(b.scheduled_date || b.published_date).getTime()
      return sortDirection.value === 'desc' ? dateB - dateA : dateA - dateB
    })
  }

  // Sort by engagement metrics
  return posts.sort((a, b) => {
    let valueA = 0, valueB = 0

    const engagementA = engagementStore.getPostEngagement(a.id)
    const engagementB = engagementStore.getPostEngagement(b.id)

    if (sortBy.value === 'views') {
      valueA = engagementA ? Object.values(engagementA).reduce((sum: number, m: any) => sum + (m.reach || 0), 0) : 0
      valueB = engagementB ? Object.values(engagementB).reduce((sum: number, m: any) => sum + (m.reach || 0), 0) : 0
    } else if (sortBy.value === 'likes') {
      valueA = engagementA ? Object.values(engagementA).reduce((sum: number, m: any) => sum + (m.likes || 0), 0) : 0
      valueB = engagementB ? Object.values(engagementB).reduce((sum: number, m: any) => sum + (m.likes || 0), 0) : 0
    } else if (sortBy.value === 'engagement') {
      // Calculate engagement rate
      if (engagementA) {
        let totalEngagement = 0, totalReach = 0
        Object.values(engagementA).forEach((m: any) => {
          totalEngagement += (m.likes || 0) + (m.comments || 0) + (m.shares || 0)
          totalReach += m.reach || 0
        })
        valueA = totalReach > 0 ? (totalEngagement / totalReach) * 100 : 0
      }
      if (engagementB) {
        let totalEngagement = 0, totalReach = 0
        Object.values(engagementB).forEach((m: any) => {
          totalEngagement += (m.likes || 0) + (m.comments || 0) + (m.shares || 0)
          totalReach += m.reach || 0
        })
        valueB = totalReach > 0 ? (totalEngagement / totalReach) * 100 : 0
      }
    }

    return sortDirection.value === 'desc' ? valueB - valueA : valueA - valueB
  })
})

// Filtered favorites based on time range
const filteredFavorites = computed(() => {
  if (selectedTimeRange.value === 'all') return favorites.value

  return favorites.value.filter(fav => {
    const favDate = fav.created_at || fav.saved_at
    return isWithinTimeRange(favDate)
  })
})

// Computed stats - based on time range AND platform filtered data (not affected by status filter)
const publishedPosts = computed(() =>
  platformFilteredPosts.value.filter(p => p.status === 'published').length
)

const pendingPosts = computed(() =>
  platformFilteredPosts.value.filter(p => p.status === 'scheduled').length
)

const totalPostsInRange = computed(() => platformFilteredPosts.value.length)

const savedContentInRange = computed(() => filteredFavorites.value.length)

const platformBreakdown = computed(() => {
  const breakdown: Record<string, number> = {}
  timeRangeFilteredPosts.value.forEach(post => {
    const platforms = post.platforms || []
    platforms.forEach((platform: string) => {
      breakdown[platform] = (breakdown[platform] || 0) + 1
    })
  })
  return breakdown
})

// Chart configurations
const goldColor = '#D4AF37'
const goldLight = '#E8C96D'
const goldDark = '#B8941F'

// Activity chart data (posts over time)
const activityChartData = computed(() => {
  const labels: string[] = []
  const data: number[] = []

  if (selectedTimeRange.value === 'all') {
    // Group by month for all-time view
    const monthlyData: Record<string, number> = {}

    platformFilteredPosts.value.forEach(post => {
      const postDate = post.scheduled_date || post.published_date
      if (postDate) {
        const date = new Date(postDate)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1
      }
    })

    // Sort months and create chart data
    const sortedMonths = Object.keys(monthlyData).sort()
    sortedMonths.forEach(monthKey => {
      const [year, month] = monthKey.split('-')
      const date = new Date(parseInt(year), parseInt(month) - 1)
      labels.push(date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }))
      data.push(monthlyData[monthKey])
    })

    // If no data, show last 6 months with 0s
    if (labels.length === 0) {
      for (let i = 5; i >= 0; i--) {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        labels.push(date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }))
        data.push(0)
      }
    }
  } else {
    // Daily view for specific time ranges
    const days = selectedTimeRange.value === '7d' ? 7 : selectedTimeRange.value === '30d' ? 30 : 90

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]

      // Format label based on range
      if (days <= 7) {
        labels.push(date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }))
      } else if (days <= 30) {
        labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
      } else {
        // For 90 days, show weekly intervals
        if (i % 7 === 0 || i === days - 1) {
          labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
        } else {
          labels.push('')
        }
      }

      const postsOnDay = platformFilteredPosts.value.filter(p => {
        const postDate = p.scheduled_date || p.published_date
        return postDate?.startsWith(dateStr)
      }).length
      data.push(postsOnDay)
    }
  }

  return {
    labels,
    datasets: [{
      label: t('analytics.postsActivity'),
      data,
      borderColor: goldColor,
      backgroundColor: isDark.value ? 'rgba(194, 163, 107, 0.15)' : 'rgba(15, 61, 46, 0.1)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: goldColor,
      pointBorderColor: isDark.value ? '#0c0c0c' : '#f6f1e7',
      pointBorderWidth: 2,
      pointRadius: selectedTimeRange.value === '90d' ? 2 : 4,
      pointHoverRadius: 6
    }]
  }
})

const activityChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      backgroundColor: isDark.value ? 'rgba(21, 21, 21, 0.95)' : 'rgba(255, 255, 255, 0.95)',
      titleColor: goldColor,
      bodyColor: isDark.value ? '#B8B8B8' : '#0f3d2e',
      borderColor: goldColor,
      borderWidth: 1,
      padding: 12,
      cornerRadius: 8
    }
  },
  scales: {
    x: {
      grid: {
        color: isDark.value ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 61, 46, 0.05)'
      },
      ticks: {
        color: isDark.value ? 'rgba(255, 255, 255, 0.5)' : 'rgba(15, 61, 46, 0.5)',
        maxRotation: 0
      }
    },
    y: {
      beginAtZero: true,
      grid: {
        color: isDark.value ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 61, 46, 0.05)'
      },
      ticks: {
        color: isDark.value ? 'rgba(255, 255, 255, 0.5)' : 'rgba(15, 61, 46, 0.5)',
        stepSize: 1
      }
    }
  }
}))

// Platform distribution chart
const platformChartData = computed(() => {
  const platforms = Object.keys(platformBreakdown.value)
  const colors: Record<string, string> = {
    facebook: '#1877F2',
    instagram: '#E4405F',
    tiktok: '#000000',
    twitter: '#1DA1F2',
    linkedin: '#0A66C2'
  }

  return {
    labels: platforms.map(p => p.charAt(0).toUpperCase() + p.slice(1)),
    datasets: [{
      data: platforms.map(p => platformBreakdown.value[p]),
      backgroundColor: platforms.map(p => colors[p] || goldColor),
      borderColor: isDark.value ? '#0c0c0c' : '#f6f1e7',
      borderWidth: 3,
      hoverBorderWidth: 4
    }]
  }
})

const platformChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: '70%',
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        color: isDark.value ? 'rgba(255, 255, 255, 0.8)' : 'rgba(15, 61, 46, 0.8)',
        padding: 20,
        usePointStyle: true,
        pointStyle: 'circle'
      }
    },
    tooltip: {
      backgroundColor: isDark.value ? 'rgba(21, 21, 21, 0.95)' : 'rgba(255, 255, 255, 0.95)',
      titleColor: goldColor,
      bodyColor: isDark.value ? '#B8B8B8' : '#0f3d2e',
      borderColor: goldColor,
      borderWidth: 1,
      padding: 12,
      cornerRadius: 8
    }
  }
}))

// Post status chart - uses time range filtered posts (not affected by status filter)
const statusChartData = computed(() => ({
  labels: [t('analytics.published'), t('analytics.scheduled'), t('analytics.cancelled')],
  datasets: [{
    data: [
      platformFilteredPosts.value.filter(p => p.status === 'published').length,
      platformFilteredPosts.value.filter(p => p.status === 'scheduled').length,
      platformFilteredPosts.value.filter(p => p.status === 'cancelled').length
    ],
    backgroundColor: ['#4ade80', goldColor, '#ef4444'],
    borderColor: isDark.value ? '#0c0c0c' : '#f6f1e7',
    borderWidth: 2,
    borderRadius: 6
  }]
}))

const statusChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      backgroundColor: isDark.value ? 'rgba(21, 21, 21, 0.95)' : 'rgba(255, 255, 255, 0.95)',
      titleColor: goldColor,
      bodyColor: isDark.value ? '#B8B8B8' : '#0f3d2e',
      borderColor: goldColor,
      borderWidth: 1,
      padding: 12,
      cornerRadius: 8
    }
  },
  scales: {
    x: {
      grid: {
        display: false
      },
      ticks: {
        color: isDark.value ? 'rgba(255, 255, 255, 0.7)' : 'rgba(15, 61, 46, 0.7)'
      }
    },
    y: {
      beginAtZero: true,
      grid: {
        color: isDark.value ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 61, 46, 0.05)'
      },
      ticks: {
        color: isDark.value ? 'rgba(255, 255, 255, 0.5)' : 'rgba(15, 61, 46, 0.5)',
        stepSize: 1
      }
    }
  }
}))

// Helper to get media URL from post
function getMediaUrl(post: any): string | null {
  return post.media_url ||
         post.image_url ||
         post.favorite_posts?.media_url ||
         post.favorite_post?.media_url ||
         post.favorite?.media_url ||
         null
}

function getVideoUrl(post: any): string | null {
  return post.video_url ||
         post.favorite_posts?.video_url ||
         post.favorite_post?.video_url ||
         post.favorite?.video_url ||
         null
}

function hasVideo(post: any): boolean {
  return !!getVideoUrl(post)
}

// Helper to get post text/caption
function getPostText(post: any): string {
  return post.post_text ||
         post.caption ||
         post.text ||
         post.favorite_posts?.post_text ||
         post.favorite_posts?.caption ||
         post.favorite_post?.post_text ||
         post.favorite_post?.caption ||
         ''
}

// Helper to get restaurant name
function getRestaurantName(post: any): string {
  // Try direct restaurant name fields
  if (post.restaurant_name) return post.restaurant_name
  if (post.favorite_posts?.restaurant_name) return post.favorite_posts.restaurant_name
  if (post.favorite_post?.restaurant_name) return post.favorite_post.restaurant_name
  if (post.favorite?.restaurant_name) return post.favorite.restaurant_name
  if (post.restaurant?.name) return post.restaurant.name

  // Try to find from restaurants list using restaurant_id
  const restaurantId = post.restaurant_id ||
                       post.favorite_posts?.restaurant_id ||
                       post.favorite_post?.restaurant_id ||
                       post.favorite?.restaurant_id

  if (restaurantId && restaurantsStore.restaurants.length > 0) {
    const restaurant = restaurantsStore.restaurants.find((r: any) => r.id === restaurantId)
    if (restaurant) return restaurant.name
  }

  return '—'
}

// Format date nicely
function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

// Get engagement metric for a specific post
function getPostEngagementMetric(
  postId: string,
  metric: 'likes' | 'comments' | 'shares',
  platform?: string
): string {
  const engagement = engagementStore.getPostEngagement(postId)
  if (!engagement) return '—'

  let total = 0
  if (platform && platform !== 'all') {
    const platformMetrics = engagement[platform]
    total = platformMetrics?.[metric] || 0
  } else {
    total = Object.values(engagement).reduce((sum: number, m: any) => sum + (m[metric] || 0), 0)
  }

  return total > 0 ? total.toLocaleString() : '—'
}

// Get total views/reach for a specific post
function getPostViews(postId: string, platform?: string): string {
  const engagement = engagementStore.getPostEngagement(postId)
  if (!engagement) return '—'

  let totalReach = 0
  if (platform && platform !== 'all') {
    const platformMetrics = engagement[platform]
    totalReach = platformMetrics?.reach || 0
  } else {
    totalReach = Object.values(engagement).reduce((sum: number, m: any) => sum + (m.reach || 0), 0)
  }

  return totalReach > 0 ? totalReach.toLocaleString() : '—'
}

// Get engagement rate for a specific post
function getPostEngagementRate(postId: string, platform?: string): string {
  const engagement = engagementStore.getPostEngagement(postId)
  if (!engagement) return '—'

  let totalLikes = 0, totalComments = 0, totalShares = 0, totalReach = 0

  if (platform && platform !== 'all') {
    const platformMetrics = engagement[platform]
    if (platformMetrics) {
      totalLikes = platformMetrics.likes || 0
      totalComments = platformMetrics.comments || 0
      totalShares = platformMetrics.shares || 0
      totalReach = platformMetrics.reach || 0
    }
  } else {
    Object.values(engagement).forEach((m: any) => {
      totalLikes += m.likes || 0
      totalComments += m.comments || 0
      totalShares += m.shares || 0
      totalReach += m.reach || 0
    })
  }

  if (totalReach === 0) return '—'
  const rate = ((totalLikes + totalComments + totalShares) / totalReach) * 100
  return `${rate.toFixed(1)}%`
}

// Credits usage percentage
const creditsUsagePercent = computed(() => {
  if (!authStore.user?.usage) return 0
  const { credits_this_month, monthly_limit } = authStore.user.usage
  if (monthly_limit === 0) return 0
  return Math.round((credits_this_month / monthly_limit) * 100)
})

// Check if user has meaningful stats to display
const hasMeaningfulStats = computed(() => {
  return stats.value.postsCreated > 0 ||
         stats.value.scheduledPosts > 0 ||
         scheduledPosts.value.length > 0 ||
         favorites.value.length > 0
})

// Total engagement metrics across all published posts
const totalEngagementMetrics = computed(() => {
  let likes = 0, comments = 0, shares = 0, reach = 0, impressions = 0

  platformFilteredPosts.value.forEach(post => {
    if (post.status === 'published') {
      const engagement = engagementStore.getPostEngagement(post.id)
      if (engagement) {
        // If specific platform selected, only count that platform's engagement
        if (selectedPlatform.value === 'all') {
          Object.values(engagement).forEach((metrics: any) => {
            likes += metrics.likes || 0
            comments += metrics.comments || 0
            shares += metrics.shares || 0
            reach += metrics.reach || 0
            impressions += metrics.impressions || 0
          })
        } else {
          // Only sum the selected platform's metrics
          const platformMetrics = engagement[selectedPlatform.value]
          if (platformMetrics) {
            likes += platformMetrics.likes || 0
            comments += platformMetrics.comments || 0
            shares += platformMetrics.shares || 0
            reach += platformMetrics.reach || 0
            impressions += platformMetrics.impressions || 0
          }
        }
      }
    }
  })

  debugLog('[Analytics] Total engagement:', { likes, comments, shares, reach, impressions, timeRange: selectedTimeRange.value, platform: selectedPlatform.value })
  return { likes, comments, shares, reach, impressions }
})

// Top performing posts by engagement rate
const topPerformingPosts = computed(() => {
  return platformFilteredPosts.value
    .filter(post => post.status === 'published')
    .map(post => {
      const engagement = engagementStore.getPostEngagement(post.id)
      if (!engagement) return null

      let totalLikes = 0, totalComments = 0, totalShares = 0, totalReach = 0

      if (selectedPlatform.value === 'all') {
        // Aggregate across all platforms
        Object.values(engagement).forEach((m: any) => {
          totalLikes += m.likes || 0
          totalComments += m.comments || 0
          totalShares += m.shares || 0
          totalReach += m.reach || 0
        })
      } else {
        // Only use selected platform's metrics
        const platformMetrics = engagement[selectedPlatform.value]
        if (platformMetrics) {
          totalLikes = platformMetrics.likes || 0
          totalComments = platformMetrics.comments || 0
          totalShares = platformMetrics.shares || 0
          totalReach = platformMetrics.reach || 0
        }
      }

      const engagementRate = totalReach > 0
        ? ((totalLikes + totalComments + totalShares) / totalReach) * 100
        : 0

      return {
        post,
        totalLikes,
        totalComments,
        totalReach,
        engagementRate
      }
    })
    .filter(item => item !== null && item.totalReach > 0)
    .sort((a, b) => b!.engagementRate - a!.engagementRate)
    .slice(0, 5)
})

// Average engagement rate across all published posts
const averageEngagementRate = computed(() => {
  const publishedPosts = platformFilteredPosts.value.filter(p => p.status === 'published')
  if (publishedPosts.length === 0) return 0

  let totalEngagement = 0
  let totalReach = 0

  publishedPosts.forEach(post => {
    const engagement = engagementStore.getPostEngagement(post.id)
    if (engagement) {
      if (selectedPlatform.value === 'all') {
        Object.values(engagement).forEach((m: any) => {
          totalEngagement += (m.likes || 0) + (m.comments || 0) + (m.shares || 0)
          totalReach += m.reach || 0
        })
      } else {
        const platformMetrics = engagement[selectedPlatform.value]
        if (platformMetrics) {
          totalEngagement += (platformMetrics.likes || 0) + (platformMetrics.comments || 0) + (platformMetrics.shares || 0)
          totalReach += platformMetrics.reach || 0
        }
      }
    }
  })

  return totalReach > 0 ? (totalEngagement / totalReach) * 100 : 0
})

// Check if there are Instagram posts with engagement but no views
const hasInstagramPostsWithNoViews = computed(() => {
  return timeRangeFilteredPosts.value.some(post => {
    if (post.status !== 'published') return false
    if (!post.platforms?.includes('instagram')) return false

    const engagement = engagementStore.getPostEngagement(post.id)
    if (!engagement?.instagram) return false

    return engagement.instagram.reach === 0 && (engagement.instagram.likes > 0 || engagement.instagram.comments > 0)
  })
})

// Pagination
const totalPages = computed(() => Math.ceil(sortedAndFilteredPosts.value.length / itemsPerPage))
const paginatedPosts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return sortedAndFilteredPosts.value.slice(start, end)
})

function goToPage(page: number) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

// Reset to page 1 when time range changes
function handleTimeRangeChange(range: '7d' | '30d' | '90d' | 'all') {
  selectedTimeRange.value = range
  currentPage.value = 1
}

// Reset to page 1 when status filter changes
function handleStatusFilterChange(status: 'all' | 'published' | 'scheduled' | 'cancelled' | 'failed' | 'pending' | 'draft') {
  selectedStatusFilter.value = status
  currentPage.value = 1
}

// Handle platform filter change
function handlePlatformChange(platform: typeof selectedPlatform.value) {
  selectedPlatform.value = platform
  currentPage.value = 1 // Reset pagination

  // Update URL (remove platform param if 'all' to keep URL clean)
  router.replace({
    query: {
      ...route.query,
      platform: platform === 'all' ? undefined : platform
    }
  })
}

// Open external links
function openInstagramApiDocs() {
  window.open('https://developers.facebook.com/docs/instagram-api/guides/insights', '_blank')
}

function openFacebookApiDocs() {
  window.open('https://developers.facebook.com/docs/graph-api/reference/post/', '_blank')
}

// Handle table sorting
function handleSort(column: 'date' | 'views' | 'likes' | 'engagement') {
  if (sortBy.value === column) {
    sortDirection.value = sortDirection.value === 'desc' ? 'asc' : 'desc'
  } else {
    sortBy.value = column
    sortDirection.value = 'desc'
  }
}

// Refresh engagement for all published posts
async function refreshAllEngagement() {
  refreshingEngagement.value = true
  try {
    const publishedPosts = scheduledPosts.value.filter(p => p.status === 'published')

    if (publishedPosts.length === 0) {
      warnLog('[Analytics] No published posts to refresh')
      displayToast(t('analytics.noPublishedPosts', 'No published posts to refresh'), 'info')
      return
    }

    debugLog(`[Analytics] ===== MANUAL ENGAGEMENT REFRESH STARTING =====`)
    debugLog(`[Analytics] Refreshing engagement for ${publishedPosts.length} published posts`)

    // Refresh each post (with rate limiting handled by backend)
    let successCount = 0
    let errorCount = 0
    const totalEngagement = { likes: 0, comments: 0, shares: 0 }

    for (const post of publishedPosts) {
      try {
        debugLog(`[Analytics] Refreshing post ${post.id}...`)
        const response = await api.refreshEngagement(post.id)

        debugLog(`[Analytics] Refresh response for post ${post.id}:`, {
          success: response.success,
          hasData: !!response.data,
          data: response.data
        })

        if (response.success && response.data) {
          engagementStore.setPostEngagement(response.data.scheduled_post_id, response.data.platforms)
          successCount++

          // Calculate totals
          Object.values(response.data.platforms || {}).forEach((metrics: any) => {
            totalEngagement.likes += metrics.likes || 0
            totalEngagement.comments += metrics.comments || 0
            totalEngagement.shares += metrics.shares || 0
          })

          debugLog(`[Analytics] ✓ Refreshed engagement for post ${post.id}`)
        } else {
          errorCount++
          warnLog(`[Analytics] ✗ No data returned for post ${post.id}`)
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error: any) {
        errorCount++
        errorLog(`[Analytics] ✗ Failed to refresh post ${post.id}:`, error)
      }
    }

    debugLog(`[Analytics] Refresh complete: ${successCount} success, ${errorCount} errors`)
    debugLog(`[Analytics] Total engagement after refresh:`, totalEngagement)
    debugLog(`[Analytics] ===== MANUAL ENGAGEMENT REFRESH COMPLETE =====`)
    debugLog('')

    lastEngagementSync.value = new Date()
    engagementDataAvailable.value = successCount > 0

    if (successCount > 0) {
      displayToast(
        t('analytics.refreshSuccess', { count: successCount }, `Successfully refreshed ${successCount} post${successCount !== 1 ? 's' : ''}`),
        'success'
      )
    } else {
      displayToast(
        t('analytics.refreshFailed', 'Failed to refresh engagement data. The backend may not be syncing from social platforms yet.'),
        'warning'
      )
    }
  } catch (error) {
    errorLog('[Analytics] Error refreshing engagement:', error)
    displayToast(t('analytics.refreshError', 'Error refreshing engagement data'), 'error')
  } finally {
    refreshingEngagement.value = false
  }
}

// Modal functions
function viewPost(post: any) {
  selectedPost.value = post
  showPostModal.value = true
}

function closeModal() {
  showPostModal.value = false
  selectedPost.value = null
}

// Auto-sync engagement data if stale
async function autoSyncEngagementIfNeeded() {
  const publishedPosts = scheduledPosts.value.filter(p => p.status === 'published')

  // Don't auto-sync if no published posts
  if (publishedPosts.length === 0) {
    debugLog('[Analytics] No published posts, skipping auto-sync')
    return
  }

  // Check if data is stale (older than 5 minutes or never synced)
  const STALE_THRESHOLD_MS = 5 * 60 * 1000 // 5 minutes
  const now = Date.now()
  const lastSync = lastEngagementSync.value?.getTime() || 0
  const isStale = (now - lastSync) > STALE_THRESHOLD_MS

  if (isStale) {
    debugLog('[Analytics] Engagement data is stale, auto-syncing...')
    await refreshAllEngagement()
  } else {
    debugLog('[Analytics] Engagement data is fresh, skipping auto-sync')
  }
}

onMounted(async () => {
  // Initialize platform filter from URL
  const platformParam = route.query.platform as string
  if (platformParam && ['all', 'facebook', 'instagram', 'tiktok', 'twitter', 'linkedin'].includes(platformParam)) {
    selectedPlatform.value = platformParam as typeof selectedPlatform.value
  }

  await fetchAnalyticsData()
  // Auto-sync engagement data after initial data load
  await autoSyncEngagementIfNeeded()
})
</script>

<template>
  <DashboardLayout>
    <div class="analytics-view">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h1 class="page-title">{{ t('analytics.title') }}</h1>
          <p class="page-subtitle">{{ t('analytics.subtitle') }}</p>
        </div>

        <div class="header-actions">
          <!-- Time Range Selector -->
          <div class="time-range-selector">
            <button
              :class="['range-btn', { active: selectedTimeRange === '7d' }]"
              @click="handleTimeRangeChange('7d')"
            >
              7 {{ t('analytics.days') }}
            </button>
            <button
              :class="['range-btn', { active: selectedTimeRange === '30d' }]"
              @click="handleTimeRangeChange('30d')"
            >
              30 {{ t('analytics.days') }}
            </button>
            <button
              :class="['range-btn', { active: selectedTimeRange === '90d' }]"
              @click="handleTimeRangeChange('90d')"
            >
              90 {{ t('analytics.days') }}
            </button>
            <button
              :class="['range-btn', { active: selectedTimeRange === 'all' }]"
              @click="handleTimeRangeChange('all')"
            >
              {{ t('analytics.allTime') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>{{ t('common.loading') }}</p>
      </div>

      <!-- Empty State - No meaningful stats -->
      <div v-else-if="!hasMeaningfulStats" class="empty-analytics-state">
        <div class="empty-illustration">
          <MaterialIcon icon="restaurant" size="xl" />
        </div>
        <h2 class="empty-title">{{ t('analytics.emptyStateTitle') }}</h2>
        <p class="empty-description">{{ t('analytics.emptyStateDescription') }}</p>
        <button class="create-post-btn" @click="$router.push('/create')">
          <MaterialIcon icon="add" size="sm" />
          {{ t('analytics.createFirstPost') }}
        </button>
      </div>

      <template v-else>
        <!-- Diagnostic Banner -->
        <div v-if="diagnosticInfo.backendIssue && diagnosticInfo.publishedPostsCount > 0" class="diagnostic-banner">
          <div class="diagnostic-icon">
            <MaterialIcon icon="bug_report" size="lg" />
          </div>
          <div class="diagnostic-content">
            <h3 class="diagnostic-title">⚠️ Backend Issue Detected</h3>
            <p class="diagnostic-message">
              You have <strong>{{ diagnosticInfo.publishedPostsCount }} published post{{ diagnosticInfo.publishedPostsCount !== 1 ? 's' : '' }}</strong>,
              but the backend is returning <strong>zero engagement data</strong>.
            </p>
            <div class="diagnostic-details">
              <p><strong>What this means:</strong> The backend server is not fetching engagement metrics (likes, comments, shares) from social platforms like Instagram and Facebook.</p>
              <p><strong>What needs to be fixed:</strong></p>
              <ul>
                <li>Backend needs to implement Instagram Graph API integration</li>
                <li>Backend needs to implement Facebook Graph API integration</li>
                <li>Backend needs to periodically sync engagement data from these APIs</li>
              </ul>
              <p class="diagnostic-note">
                <MaterialIcon icon="info" size="sm" />
                This is a <strong>backend/server issue</strong>, not a frontend issue. The API endpoint exists but returns empty data.
              </p>
            </div>
            <div class="diagnostic-actions">
              <button class="diagnostic-btn" @click="openInstagramApiDocs">
                <MaterialIcon icon="open_in_new" size="sm" />
                Instagram API Docs
              </button>
              <button class="diagnostic-btn" @click="openFacebookApiDocs">
                <MaterialIcon icon="open_in_new" size="sm" />
                Facebook API Docs
              </button>
              <button class="diagnostic-btn-secondary" @click="diagnosticInfo.backendIssue = false">
                <MaterialIcon icon="close" size="sm" />
                Dismiss
              </button>
            </div>
          </div>
        </div>

        <!-- Platform Tabs -->
        <div class="platform-tabs-wrapper">
          <div class="platform-tabs" role="tablist" aria-label="Platform filter">
            <button
              v-for="tab in platformTabs"
              :key="tab.key"
              :class="['platform-tab', { active: selectedPlatform === tab.key }]"
              @click="handlePlatformChange(tab.key)"
              role="tab"
              :aria-selected="selectedPlatform === tab.key"
              :tabindex="0"
            >
              <PlatformLogo
                v-if="tab.icon"
                :platform="tab.icon as 'facebook' | 'instagram' | 'tiktok' | 'twitter' | 'linkedin'"
                :size="20"
                :show-background="false"
              />
              <MaterialIcon v-else icon="dashboard" size="sm" />
              <span>{{ tab.label }}</span>
              <span class="platform-tab-count">({{ tab.count }})</span>
            </button>
          </div>
        </div>

        <!-- Platform Empty State -->
        <div v-if="platformFilteredPosts.length === 0 && selectedPlatform !== 'all'" class="platform-empty-state">
          <PlatformLogo
            :platform="selectedPlatform as 'facebook' | 'instagram' | 'tiktok' | 'twitter' | 'linkedin'"
            :size="64"
          />
          <h3>{{ t('analytics.noPlatformPosts', { platform: t(`platforms.${selectedPlatform}`) }) }}</h3>
          <p>{{ t('analytics.noPlatformPostsDesc') }}</p>
          <button class="create-post-btn" @click="$router.push('/posts/create')">
            <MaterialIcon icon="add" size="sm" />
            {{ t('analytics.createPost') }}
          </button>
        </div>

        <!-- Instagram Views Info Banner -->
        <BaseAlert
          v-if="hasInstagramPostsWithNoViews && platformFilteredPosts.length > 0"
          type="info"
          :dismissible="true"
          class="instagram-info-banner"
        >
          <div class="info-content">
            <strong>{{ t('analytics.instagramViewsLimited') }}</strong>
            <p>{{ t('analytics.instagramViewsInfo') }}</p>
            <a href="https://developers.facebook.com/docs/instagram-api/guides/insights" target="_blank" class="learn-more-link">
              {{ t('analytics.learnMore') }}
              <MaterialIcon icon="open_in_new" size="xs" />
            </a>
          </div>
        </BaseAlert>

        <!-- Key Metrics Cards -->
        <div class="metrics-grid">
          <BaseCard variant="glass" class="metric-card">
            <div class="metric-icon gold">
              <MaterialIcon icon="edit_note" size="lg" />
            </div>
            <div class="metric-content">
              <span class="metric-value">{{ totalPostsInRange }}</span>
              <span class="metric-label">{{ t('analytics.totalPosts') }}</span>
            </div>
          </BaseCard>

          <BaseCard variant="glass" class="metric-card">
            <div class="metric-icon gold">
              <MaterialIcon icon="bookmark" size="lg" />
            </div>
            <div class="metric-content">
              <span class="metric-value">{{ savedContentInRange }}</span>
              <span class="metric-label">{{ t('analytics.savedPosts') }}</span>
            </div>
          </BaseCard>

          <BaseCard variant="glass" class="metric-card">
            <div class="metric-icon gold">
              <MaterialIcon icon="schedule" size="lg" />
            </div>
            <div class="metric-content">
              <span class="metric-value">{{ pendingPosts }}</span>
              <span class="metric-label">{{ t('analytics.scheduledPosts') }}</span>
            </div>
          </BaseCard>

          <BaseCard variant="glass" class="metric-card">
            <div class="metric-icon gold">
              <MaterialIcon icon="check_circle" size="lg" />
            </div>
            <div class="metric-content">
              <span class="metric-value">{{ publishedPosts }}</span>
              <span class="metric-label">{{ t('analytics.publishedPosts') }}</span>
            </div>
          </BaseCard>

          <!-- Engagement Metrics -->
          <BaseCard variant="glass" class="metric-card">
            <div class="metric-icon gold">
              <MaterialIcon icon="thumb_up" size="lg" />
            </div>
            <div class="metric-content">
              <span class="metric-value">{{ totalEngagementMetrics.likes.toLocaleString() }}</span>
              <span class="metric-label">{{ t('analytics.likes') }}</span>
            </div>
          </BaseCard>

          <BaseCard variant="glass" class="metric-card">
            <div class="metric-icon gold">
              <MaterialIcon icon="visibility" size="lg" />
            </div>
            <div class="metric-content">
              <span class="metric-value">{{ totalEngagementMetrics.reach.toLocaleString() }}</span>
              <span class="metric-label">{{ t('analytics.reach') }}</span>
            </div>
          </BaseCard>

          <BaseCard variant="glass" class="metric-card">
            <div class="metric-icon gold">
              <MaterialIcon icon="comment" size="lg" />
            </div>
            <div class="metric-content">
              <span class="metric-value">{{ totalEngagementMetrics.comments.toLocaleString() }}</span>
              <span class="metric-label">{{ t('analytics.comments') }}</span>
            </div>
          </BaseCard>

          <BaseCard variant="glass" class="metric-card">
            <div class="metric-icon gold">
              <MaterialIcon icon="share" size="lg" />
            </div>
            <div class="metric-content">
              <span class="metric-value">{{ totalEngagementMetrics.shares.toLocaleString() }}</span>
              <span class="metric-label">{{ t('analytics.shares') }}</span>
            </div>
          </BaseCard>
        </div>

        <!-- Performance Insights Section -->
        <div class="performance-section">
          <BaseCard variant="glass" class="performance-card">
            <div class="chart-header">
              <h3 class="chart-title">{{ t('analytics.topPerforming') }}</h3>
              <span class="chart-subtitle">{{ t('analytics.highestEngagement') }}</span>
            </div>

            <!-- Average Engagement Rate -->
            <div class="average-engagement">
              <span class="average-label">{{ t('analytics.averageEngagementRate') }}:</span>
              <span class="average-value">{{ averageEngagementRate.toFixed(1) }}%</span>
            </div>

            <!-- Top Posts List -->
            <div v-if="topPerformingPosts.length > 0" class="top-posts-list">
              <div
                v-for="(item, index) in topPerformingPosts"
                :key="item.post.id"
                class="top-post-item"
                @click="viewPost(item.post)"
              >
                <div class="post-rank">{{ index + 1 }}</div>
                <div class="post-preview">
                  <div v-if="getMediaUrl(item.post)" class="post-thumb">
                    <img :src="getMediaUrl(item.post)" :alt="item.post.post_text || 'Post'" />
                  </div>
                  <div class="post-info">
                    <p class="post-text">{{ getPostText(item.post).substring(0, 60) }}{{ getPostText(item.post).length > 60 ? '...' : '' }}</p>
                    <span class="post-restaurant">{{ getRestaurantName(item.post) }}</span>
                  </div>
                </div>
                <div class="post-performance">
                  <div class="performance-stat">
                    <MaterialIcon icon="visibility" size="xs" />
                    <span>{{ item.totalReach.toLocaleString() }}</span>
                  </div>
                  <div class="performance-stat">
                    <MaterialIcon icon="thumb_up" size="xs" />
                    <span>{{ item.totalLikes.toLocaleString() }}</span>
                  </div>
                  <div class="performance-stat engagement-rate-stat">
                    <MaterialIcon icon="trending_up" size="xs" />
                    <span class="engagement-rate-value">{{ item.engagementRate.toFixed(1) }}%</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div v-else class="empty-performance">
              <MaterialIcon icon="trending_up" size="lg" color="var(--text-muted)" />
              <p>{{ t('analytics.noPerformanceData') }}</p>
            </div>
          </BaseCard>
        </div>

        <!-- Charts Row -->
        <div class="charts-grid">
          <!-- Activity Chart -->
          <BaseCard variant="glass" class="chart-card activity-chart">
            <div class="chart-header">
              <h3 class="chart-title">{{ t('analytics.postingActivity') }}</h3>
              <span class="chart-subtitle">{{ t('analytics.postsOverTime') }}</span>
            </div>
            <div class="chart-container">
              <Line :data="activityChartData" :options="activityChartOptions" />
            </div>
          </BaseCard>

          <!-- Platform Distribution (only shown on "All" tab) -->
          <BaseCard
            v-if="selectedPlatform === 'all'"
            variant="glass"
            class="chart-card platform-chart"
          >
            <div class="chart-header">
              <h3 class="chart-title">{{ t('analytics.platformDistribution') }}</h3>
              <span class="chart-subtitle">{{ t('analytics.postsByPlatform') }}</span>
            </div>
            <div class="chart-container doughnut-container">
              <Doughnut
                v-if="Object.keys(platformBreakdown).length > 0"
                :data="platformChartData"
                :options="platformChartOptions"
              />
              <div v-else class="empty-chart">
                <MaterialIcon icon="pie_chart" size="xl" color="var(--text-muted)" />
                <p>{{ t('analytics.noDataYet') }}</p>
              </div>
            </div>
          </BaseCard>
        </div>

        <!-- Second Row -->
        <div class="charts-grid">
          <!-- Post Status -->
          <BaseCard variant="glass" class="chart-card status-chart">
            <div class="chart-header">
              <h3 class="chart-title">{{ t('analytics.postStatus') }}</h3>
              <span class="chart-subtitle">{{ t('analytics.byStatus') }}</span>
            </div>
            <div class="chart-container">
              <Bar :data="statusChartData" :options="statusChartOptions" />
            </div>
          </BaseCard>

          <!-- Usage & Subscription -->
          <BaseCard variant="glass" class="chart-card usage-card">
            <div class="chart-header">
              <h3 class="chart-title">{{ t('analytics.usageOverview') }}</h3>
              <span class="chart-subtitle">{{ t('analytics.monthlyUsage') }}</span>
            </div>

            <div class="usage-content">
              <!-- Credits Usage -->
              <div class="usage-item">
                <div class="usage-header">
                  <span class="usage-label">{{ t('analytics.creditsUsed') }}</span>
                  <span class="usage-value">
                    {{ authStore.user?.usage?.credits_this_month || 0 }} /
                    {{ authStore.user?.usage?.monthly_limit || 0 }}
                  </span>
                </div>
                <div class="progress-bar">
                  <div
                    class="progress-fill"
                    :style="{ width: `${creditsUsagePercent}%` }"
                    :class="{ warning: creditsUsagePercent > 80 }"
                  ></div>
                </div>
                <span class="usage-percent">{{ creditsUsagePercent }}% {{ t('analytics.used') }}</span>
              </div>

              <!-- Subscription Info -->
              <div class="subscription-info">
                <div class="sub-item">
                  <MaterialIcon icon="workspace_premium" size="md" color="var(--gold-primary)" />
                  <div class="sub-details">
                    <span class="sub-label">{{ t('analytics.subscription') }}</span>
                    <span class="sub-value">{{ subscriptionTierDisplay }}</span>
                  </div>
                </div>
                <div class="sub-item">
                  <MaterialIcon icon="storefront" size="md" color="var(--gold-primary)" />
                  <div class="sub-details">
                    <span class="sub-label">{{ t('analytics.restaurants') }}</span>
                    <span class="sub-value">{{ stats.restaurantsAdded }}</span>
                  </div>
                </div>
              </div>
            </div>
          </BaseCard>
        </div>

        <!-- Recent Activity -->
        <BaseCard variant="glass" class="recent-activity-card">
          <div class="chart-header">
            <div>
              <h3 class="chart-title">{{ t('analytics.recentActivity') }}</h3>
              <span class="chart-subtitle">{{ t('analytics.latestPosts') }}</span>
            </div>

            <!-- Status Filter -->
            <div class="status-filter">
              <button
                :class="['filter-btn', { active: selectedStatusFilter === 'all' }]"
                @click="handleStatusFilterChange('all')"
              >
                {{ t('analytics.allStatuses') }}
              </button>
              <button
                :class="['filter-btn', { active: selectedStatusFilter === 'published' }]"
                @click="handleStatusFilterChange('published')"
              >
                {{ t('analytics.published') }}
              </button>
              <button
                :class="['filter-btn', { active: selectedStatusFilter === 'scheduled' }]"
                @click="handleStatusFilterChange('scheduled')"
              >
                {{ t('analytics.scheduled') }}
              </button>
              <button
                :class="['filter-btn', { active: selectedStatusFilter === 'failed' }]"
                @click="handleStatusFilterChange('failed')"
              >
                {{ t('analytics.failed') }}
              </button>
            </div>
          </div>

          <div v-if="filteredPosts.length === 0" class="empty-activity">
            <MaterialIcon icon="inbox" size="xl" color="var(--text-muted)" />
            <p>{{ t('analytics.noRecentActivity') }}</p>
          </div>

          <table v-else class="activity-table">
            <thead>
              <tr>
                <th>{{ t('analytics.post') }}</th>
                <th>{{ t('analytics.restaurant') }}</th>
                <th>{{ t('analytics.status') }}</th>
                <th class="sortable" @click="handleSort('date')">
                  {{ t('analytics.date') }}
                  <MaterialIcon
                    v-if="sortBy === 'date'"
                    :icon="sortDirection === 'desc' ? 'arrow_downward' : 'arrow_upward'"
                    size="xs"
                  />
                </th>
                <th class="sortable" @click="handleSort('views')">
                  {{ t('analytics.views') }}
                  <MaterialIcon
                    v-if="sortBy === 'views'"
                    :icon="sortDirection === 'desc' ? 'arrow_downward' : 'arrow_upward'"
                    size="xs"
                  />
                </th>
                <th class="sortable" @click="handleSort('likes')">
                  {{ t('analytics.engagement') }}
                  <MaterialIcon
                    v-if="sortBy === 'likes'"
                    :icon="sortDirection === 'desc' ? 'arrow_downward' : 'arrow_upward'"
                    size="xs"
                  />
                </th>
                <th>{{ t('analytics.links') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="post in paginatedPosts"
                :key="post.id"
                class="activity-row"
                @click="viewPost(post)"
              >
                <!-- Post Cell -->
                <td class="post-cell">
                  <div class="post-info">
                    <div v-if="getMediaUrl(post)" class="post-thumbnail">
                      <img
                        :src="getMediaUrl(post)"
                        :alt="post.post_text || 'Post'"
                        @error="(e: Event) => (e.target as HTMLImageElement).style.display = 'none'"
                      />
                    </div>
                    <div v-else class="post-thumbnail placeholder">
                      <MaterialIcon icon="image" size="sm" color="var(--text-muted)" />
                    </div>
                    <div v-if="!getMediaUrl(post)" class="post-details">
                      <span class="post-title">{{ getPostText(post).substring(0, 40) || t('analytics.noText') }}{{ getPostText(post).length > 40 ? '...' : '' }}</span>
                      <span v-if="hasVideo(post)" class="post-type">
                        <MaterialIcon icon="videocam" size="xs" /> {{ t('analytics.video') }}
                      </span>
                    </div>
                  </div>
                </td>

                <!-- Restaurant Cell -->
                <td class="restaurant-cell">
                  <span class="restaurant-name">{{ getRestaurantName(post) }}</span>
                </td>

                <!-- Status Cell -->
                <td>
                  <div class="status-cell">
                    <span class="status-badge" :class="post.status">
                      {{ post.status && t(`analytics.${post.status}`, post.status) }}
                    </span>
                  </div>
                </td>

                <!-- Date Cell -->
                <td class="date-cell">
                  <span class="post-date">{{ formatDate(post.scheduled_date || post.published_date) }}</span>
                </td>

                <!-- Views Cell -->
                <td class="views-cell">
                  <div v-if="post.status === 'published'" class="views-metric">
                    <MaterialIcon icon="visibility" size="xs" />
                    <span class="views-value">{{ getPostViews(post.id, selectedPlatform === 'all' ? undefined : selectedPlatform) }}</span>
                  </div>
                  <span v-else class="muted">—</span>
                </td>

                <!-- Engagement Cell -->
                <td class="engagement-cell">
                  <div v-if="post.status === 'published'" class="engagement-metrics">
                    <span class="metric-badge">
                      <MaterialIcon icon="thumb_up" size="xs" />
                      {{ getPostEngagementMetric(post.id, 'likes', selectedPlatform === 'all' ? undefined : selectedPlatform) }}
                    </span>
                    <span class="metric-badge">
                      <MaterialIcon icon="comment" size="xs" />
                      {{ getPostEngagementMetric(post.id, 'comments', selectedPlatform === 'all' ? undefined : selectedPlatform) }}
                    </span>
                  </div>
                  <span v-else class="muted">—</span>
                </td>

                <!-- Links Cell -->
                <td class="links-cell">
                  <div v-if="post.status === 'published' && post.platform_post_urls && Object.keys(post.platform_post_urls).length > 0" class="post-links">
                    <a
                      v-for="(url, platform) in (post.platform_post_urls as Record<string, string>)"
                      :key="platform"
                      :href="url"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="platform-link"
                      :class="`platform-link-${platform}`"
                      :title="t('analytics.viewOn', { platform })"
                      @click.stop
                    >
                      <PlatformLogo :platform="(platform as 'facebook' | 'instagram' | 'tiktok' | 'twitter' | 'linkedin')" :size="20" />
                    </a>
                  </div>
                  <span v-else class="muted">—</span>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Pagination Controls -->
          <div v-if="filteredPosts.length > itemsPerPage" class="pagination">
            <button
              class="pagination-btn"
              :disabled="currentPage === 1"
              @click="goToPage(currentPage - 1)"
            >
              <MaterialIcon icon="chevron_left" size="sm" />
            </button>

            <div class="pagination-info">
              {{ t('analytics.page') }} {{ currentPage }} {{ t('analytics.of') }} {{ totalPages }}
            </div>

            <button
              class="pagination-btn"
              :disabled="currentPage === totalPages"
              @click="goToPage(currentPage + 1)"
            >
              <MaterialIcon icon="chevron_right" size="sm" />
            </button>
          </div>
        </BaseCard>

        <!-- Post Detail Modal -->
        <Teleport to="body">
          <BaseModal v-model="showPostModal" size="lg">
            <div v-if="selectedPost" class="post-modal">
              <div class="post-modal-header">
                <h2 class="modal-title">{{ t('analytics.postDetails') }}</h2>
                <button class="close-btn" @click="closeModal">
                  <MaterialIcon icon="close" size="md" />
                </button>
              </div>

              <div class="post-modal-content">
                <!-- Media Preview - Show video if video_url exists, otherwise image -->
                <div v-if="getMediaUrl(selectedPost) || getVideoUrl(selectedPost)" class="media-preview">
                  <video
                    v-if="hasVideo(selectedPost)"
                    :src="getVideoUrl(selectedPost)!"
                    controls
                    class="media-video"
                  ></video>
                  <img
                    v-else
                    :src="getMediaUrl(selectedPost)!"
                    :alt="selectedPost.post_text || selectedPost.caption || 'Post'"
                    class="media-image"
                  />
                </div>

                <!-- Post Details -->
                <div class="post-details-section">
                  <!-- Text Content -->
                  <div class="detail-group">
                    <h3 class="detail-label">{{ t('analytics.postContent') }}</h3>
                    <p class="post-text">{{ getPostText(selectedPost) || t('analytics.noText') }}</p>
                  </div>

                  <!-- Platforms -->
                  <div class="detail-group">
                    <h3 class="detail-label">{{ t('analytics.platforms') }}</h3>
                    <div class="platform-badges">
                      <div
                        v-for="platform in (selectedPost.platforms || [])"
                        :key="platform"
                        class="platform-badge"
                        :class="`platform-bg-${platform}`"
                      >
                        <PlatformLogo :platform="(platform as 'facebook' | 'instagram' | 'tiktok' | 'twitter' | 'linkedin')" :size="16" />
                        <span>{{ platform.charAt(0).toUpperCase() + platform.slice(1) }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Engagement Metrics (for published posts) -->
                  <div v-if="selectedPost.status === 'published'" class="detail-group">
                    <h3 class="detail-label">{{ t('analytics.engagement') }}</h3>
                    <div class="engagement-details">
                      <template v-if="engagementStore.getPostEngagement(selectedPost.id)">
                        <div
                          v-for="(metrics, platform) in engagementStore.getPostEngagement(selectedPost.id)"
                          :key="platform"
                          class="platform-engagement-card"
                        >
                          <div class="platform-engagement-header">
                            <PlatformLogo :platform="(platform as 'facebook' | 'instagram' | 'tiktok' | 'twitter' | 'linkedin')" :size="20" />
                            <span class="platform-engagement-name">{{ platform.charAt(0).toUpperCase() + platform.slice(1) }}</span>
                          </div>
                          <div class="platform-engagement-stats">
                            <div class="engagement-stat">
                              <MaterialIcon icon="thumb_up" size="xs" />
                              <span class="stat-value">{{ (metrics.likes || 0).toLocaleString() }}</span>
                              <span class="stat-label">{{ t('analytics.likes') }}</span>
                            </div>
                            <div class="engagement-stat">
                              <MaterialIcon icon="comment" size="xs" />
                              <span class="stat-value">{{ (metrics.comments || 0).toLocaleString() }}</span>
                              <span class="stat-label">{{ t('analytics.comments') }}</span>
                            </div>
                            <div class="engagement-stat">
                              <MaterialIcon icon="share" size="xs" />
                              <span class="stat-value">{{ (metrics.shares || 0).toLocaleString() }}</span>
                              <span class="stat-label">{{ t('analytics.shares') }}</span>
                            </div>
                            <div v-if="metrics.reach" class="engagement-stat">
                              <MaterialIcon icon="visibility" size="xs" />
                              <span class="stat-value">{{ (metrics.reach || 0).toLocaleString() }}</span>
                              <span class="stat-label">{{ t('analytics.reach') }}</span>
                            </div>
                            <div v-if="metrics.impressions" class="engagement-stat">
                              <MaterialIcon icon="bar_chart" size="xs" />
                              <span class="stat-value">{{ (metrics.impressions || 0).toLocaleString() }}</span>
                              <span class="stat-label">{{ t('analytics.impressions') }}</span>
                            </div>
                          </div>
                        </div>
                      </template>
                      <div v-else class="no-engagement-data">
                        <MaterialIcon icon="info" size="sm" color="var(--text-muted)" />
                        <p>{{ t('analytics.noEngagementData', 'No engagement data available. Click "Refresh Metrics" to sync from social platforms.') }}</p>
                      </div>
                    </div>
                  </div>

                  <!-- Status & Date -->
                  <div class="detail-row">
                    <div class="detail-group">
                      <h3 class="detail-label">{{ t('analytics.status') }}</h3>
                      <span class="status-badge" :class="selectedPost.status">
                        {{ selectedPost.status && t(`analytics.${selectedPost.status}`, selectedPost.status) }}
                      </span>
                    </div>

                    <div class="detail-group">
                      <h3 class="detail-label">{{ t('analytics.date') }}</h3>
                      <span class="detail-text">{{ formatDate(selectedPost.scheduled_date || selectedPost.published_date) }}</span>
                    </div>
                  </div>

                  <!-- Error Message (for failed posts) -->
                  <div v-if="selectedPost.status === 'failed'" class="error-section">
                    <h3 class="detail-label">{{ t('analytics.errorReason', 'Error') }}</h3>
                    <div class="error-message-box">
                      {{ selectedPost.error_message || t('analytics.unknownError', 'Post failed to publish. Please try again or contact support.') }}
                    </div>
                  </div>

                  <!-- Platform Links -->
                  <div v-if="selectedPost.status === 'published' && selectedPost.platform_post_urls && Object.keys(selectedPost.platform_post_urls).length > 0" class="detail-group">
                    <h3 class="detail-label">{{ t('analytics.viewOnPlatforms') }}</h3>
                    <div class="platform-links">
                      <a
                        v-for="(url, platform) in (selectedPost.platform_post_urls as Record<string, string>)"
                        :key="platform"
                        :href="url"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="platform-link-btn"
                        @click.stop
                      >
                        <PlatformLogo :platform="(platform as 'facebook' | 'instagram' | 'tiktok' | 'twitter' | 'linkedin')" :size="16" />
                        {{ platform.charAt(0).toUpperCase() + platform.slice(1) }}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </BaseModal>
        </Teleport>
      </template>
    </div>

    <!-- Toast Notification -->
    <Toast
      v-model="showToast"
      :message="toastMessage"
      :type="toastType"
    />
  </DashboardLayout>
</template>

<style scoped>
.analytics-view {
  padding: var(--space-lg);
  max-width: 1600px;
  margin: 0 auto;
}

/* Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-2xl);
  flex-wrap: wrap;
  gap: var(--space-lg);
}

.page-title {
  font-family: var(--font-heading);
  font-size: var(--text-3xl);
  background: var(--gradient-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}

.page-subtitle {
  color: var(--text-secondary);
  margin: var(--space-xs) 0 0 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  flex-wrap: wrap;
}

.refresh-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  align-items: flex-start;
}

.refresh-engagement-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-lg);
  background: var(--gradient-gold);
  color: var(--text-on-gold);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: var(--transition-base);
  white-space: nowrap;
}

.refresh-engagement-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: var(--glow-gold-md);
}

.refresh-engagement-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.sync-status {
  font-size: var(--text-xs);
  color: var(--text-muted);
  padding-left: var(--space-xs);
}

.sync-status.warning {
  color: #f59e0b;
  font-weight: var(--font-medium);
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.time-range-selector {
  display: flex;
  gap: var(--space-xs);
  background: var(--bg-tertiary);
  padding: 4px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
}

.range-btn {
  padding: var(--space-sm) var(--space-lg);
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: var(--transition-base);
}

.range-btn:hover {
  color: var(--text-primary);
}

.range-btn.active {
  background: var(--gradient-gold);
  color: var(--text-on-gold);
}

/* Loading */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-5xl);
  color: var(--text-muted);
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 3px solid var(--border-color);
  border-top-color: var(--gold-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: var(--space-lg);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Diagnostic Banner */
.diagnostic-banner {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.05));
  border: 2px solid rgba(245, 158, 11, 0.3);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
  margin-bottom: var(--space-2xl);
  display: flex;
  gap: var(--space-lg);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.15);
}

.diagnostic-icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  background: rgba(245, 158, 11, 0.15);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f59e0b;
}

.diagnostic-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.diagnostic-title {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  color: var(--text-primary);
  margin: 0;
}

.diagnostic-message {
  font-size: var(--text-base);
  color: var(--text-primary);
  margin: 0;
  line-height: var(--leading-relaxed);
}

.diagnostic-details {
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  margin: var(--space-sm) 0;
}

.diagnostic-details p {
  margin: 0 0 var(--space-sm) 0;
  color: var(--text-secondary);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
}

.diagnostic-details ul {
  margin: var(--space-xs) 0 var(--space-md) var(--space-lg);
  padding: 0;
  list-style: disc;
}

.diagnostic-details li {
  margin: var(--space-xs) 0;
  color: var(--text-secondary);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
}

.diagnostic-note {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md);
  background: rgba(59, 130, 246, 0.1);
  border-left: 3px solid #3b82f6;
  border-radius: var(--radius-sm);
  margin-top: var(--space-md);
  color: var(--text-primary) !important;
  font-weight: var(--font-medium);
}

.diagnostic-actions {
  display: flex;
  gap: var(--space-sm);
  flex-wrap: wrap;
}

.diagnostic-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-md);
  background: var(--gradient-gold);
  color: var(--text-on-gold);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: var(--transition-base);
}

.diagnostic-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--glow-gold-md);
}

.diagnostic-btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: var(--transition-base);
}

.diagnostic-btn-secondary:hover {
  background: var(--bg-elevated);
  color: var(--text-primary);
}

/* Empty Analytics State */
.empty-analytics-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-5xl) var(--space-xl);
  text-align: center;
  min-height: 400px;
}

.empty-illustration {
  width: 120px;
  height: 120px;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, rgba(15, 61, 46, 0.15), rgba(15, 61, 46, 0.05));
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-xl);
  color: var(--gold-primary);
}

.empty-title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  color: var(--text-primary);
  margin: 0 0 var(--space-md) 0;
}

.empty-description {
  color: var(--text-secondary);
  font-size: var(--text-base);
  max-width: 400px;
  margin: 0 0 var(--space-xl) 0;
  line-height: var(--leading-relaxed);
}

.create-post-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-xl);
  background: var(--gradient-gold);
  color: var(--text-on-gold);
  border: none;
  border-radius: var(--radius-lg);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  cursor: pointer;
  transition: var(--transition-base);
}

.create-post-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--glow-gold-md);
}

/* Metrics Grid */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-lg);
  margin-bottom: var(--space-2xl);
}

.metric-card {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  padding: var(--space-xl);
  position: relative;
  overflow: hidden;
}

.metric-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--gradient-gold);
  opacity: 0.5;
}

.metric-icon {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.metric-icon.gold {
  background: linear-gradient(135deg, rgba(15, 61, 46, 0.2), rgba(15, 61, 46, 0.1));
  color: var(--gold-primary);
}

.metric-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  flex: 1;
}

.metric-value {
  font-family: var(--font-heading);
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  line-height: 1;
}

.metric-label {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

/* Charts Grid */
.charts-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--space-lg);
  margin-bottom: var(--space-2xl);
}

.chart-card {
  padding: var(--space-xl);
}

.chart-header {
  margin-bottom: var(--space-xl);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: var(--space-md);
}

.chart-title {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  color: var(--text-primary);
  margin: 0;
}

.chart-subtitle {
  font-size: var(--text-sm);
  color: var(--text-muted);
}

/* Status Filter */
.status-filter {
  display: flex;
  gap: var(--space-xs);
  background: var(--bg-tertiary);
  padding: 4px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  flex-wrap: wrap;
}

.filter-btn {
  padding: var(--space-xs) var(--space-md);
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: var(--transition-base);
  white-space: nowrap;
}

.filter-btn:hover {
  color: var(--text-primary);
}

.filter-btn.active {
  background: var(--gradient-gold);
  color: var(--text-on-gold);
}

.chart-container {
  height: 280px;
  position: relative;
}

.doughnut-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-chart {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-muted);
  gap: var(--space-md);
}

/* Usage Card */
.usage-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

.usage-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.usage-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.usage-label {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.usage-value {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.progress-bar {
  height: 8px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--gradient-gold);
  border-radius: var(--radius-full);
  transition: width 0.5s ease;
}

.progress-fill.warning {
  background: linear-gradient(90deg, #f97316, #ef4444);
}

.usage-percent {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.subscription-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  padding-top: var(--space-lg);
  border-top: 1px solid var(--border-color);
}

.sub-item {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.sub-details {
  display: flex;
  flex-direction: column;
}

.sub-label {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.sub-value {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  text-transform: capitalize;
}

/* Recent Activity */
.recent-activity-card {
  padding: 0;
  overflow: hidden;
}

.recent-activity-card .chart-header {
  padding: var(--space-lg) var(--space-xl);
  border-bottom: 1px solid var(--border-color);
}

.activity-table {
  width: 100%;
  border-collapse: collapse;
}

.activity-table th {
  text-align: left;
  padding: var(--space-md) var(--space-lg);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--border-color);
}

.activity-table td {
  padding: var(--space-md) var(--space-lg);
  border-bottom: 1px solid var(--border-color);
  vertical-align: middle;
}

.activity-table tbody tr:last-child td {
  border-bottom: none;
}

.activity-row {
  transition: var(--transition-fast);
  cursor: pointer;
}

.activity-row:hover {
  background: var(--bg-elevated);
}

.post-cell {
  min-width: 250px;
}

.post-info {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.post-thumbnail {
  width: 48px;
  height: 48px;
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

.post-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.post-title {
  font-size: var(--text-sm);
  color: var(--text-primary);
  font-weight: var(--font-medium);
}

.post-type {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.restaurant-cell {
  min-width: 120px;
}

.restaurant-name {
  font-size: var(--text-sm);
  color: var(--text-primary);
  font-weight: var(--font-medium);
}

.status-cell {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  justify-content: center;
}

.status-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  text-transform: capitalize;
  width: fit-content;
}

.failed-reason {
  font-size: var(--text-xs);
  color: var(--text-muted);
  max-width: 150px;
  line-height: 1.3;
}

.error-section {
  margin-top: var(--space-md);
}

.error-message-box {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: var(--radius-md);
  padding: var(--space-sm) var(--space-md);
  color: #ef4444;
  font-size: var(--text-sm);
  line-height: 1.4;
}

.status-badge.published {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}

.status-badge.scheduled {
  background: rgba(212, 175, 55, 0.15);
  color: var(--gold-primary);
}

.status-badge.cancelled {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.status-badge.failed {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.status-badge.pending {
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
}

.status-badge.draft {
  background: rgba(156, 163, 175, 0.15);
  color: #9ca3af;
}

.date-cell {
  white-space: nowrap;
}

.post-date {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.links-cell {
  min-width: 80px;
}

.post-links {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.platform-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  text-decoration: none;
  transition: var(--transition-base);
  cursor: pointer;
}

.platform-link:hover {
  opacity: 0.8;
}

.muted {
  color: var(--text-muted);
}

.empty-activity {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-3xl);
  color: var(--text-muted);
  gap: var(--space-md);
}

/* Pagination */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-lg);
  padding: var(--space-lg);
  border-top: 1px solid var(--border-color);
}

.pagination-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition-base);
}

.pagination-btn:hover:not(:disabled) {
  background: var(--gold-primary);
  color: var(--text-on-gold);
  border-color: var(--gold-primary);
}

.pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pagination-info {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  font-weight: var(--font-medium);
}

/* Post Modal */
.post-modal {
  display: flex;
  flex-direction: column;
  max-height: 85vh;
}

.post-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-xl);
  border-bottom: 1px solid var(--border-color);
}

.modal-title {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  color: var(--text-primary);
  margin: 0;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: var(--bg-tertiary);
  border: none;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition-base);
}

.close-btn:hover {
  background: var(--gold-primary);
  color: var(--text-on-gold);
}

.post-modal-content {
  padding: var(--space-xl);
  overflow-y: auto;
  flex: 1;
}

.media-preview {
  margin-bottom: var(--space-xl);
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--bg-tertiary);
}

.media-image,
.media-video {
  width: 100%;
  height: auto;
  max-height: 400px;
  object-fit: contain;
  display: block;
}

.post-details-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.detail-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.detail-label {
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0;
}

.post-text {
  font-size: var(--text-base);
  color: var(--text-primary);
  line-height: 1.6;
  margin: 0;
  white-space: pre-wrap;
}

.detail-text {
  font-size: var(--text-sm);
  color: var(--text-primary);
}

.detail-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-lg);
}

.platform-badges {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.platform-badge {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: #fff;
  font-weight: var(--font-medium);
}

.platform-links {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.platform-link-btn {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-lg);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  text-decoration: none;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  transition: var(--transition-base);
}

.platform-link-btn:hover {
  background: var(--gold-primary);
  color: var(--text-on-gold);
  border-color: var(--gold-primary);
}

/* Engagement Detail View in Modal */
.engagement-details {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.platform-engagement-card {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.platform-engagement-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding-bottom: var(--space-sm);
  border-bottom: 1px solid var(--border-color);
}

.platform-engagement-name {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  text-transform: capitalize;
}

.platform-engagement-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: var(--space-md);
}

.engagement-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  text-align: center;
}

.engagement-stat .stat-value {
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  color: var(--gold-primary);
  line-height: 1;
}

.engagement-stat .stat-label {
  font-size: var(--text-xs);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.no-engagement-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  padding: var(--space-xl);
  text-align: center;
  background: var(--bg-tertiary);
  border-radius: var(--radius-lg);
  border: 1px dashed var(--border-color);
}

.no-engagement-data p {
  margin: 0;
  color: var(--text-secondary);
  font-size: var(--text-sm);
  max-width: 300px;
  line-height: var(--leading-relaxed);
}

/* Views Cell */
.views-cell {
  text-align: center;
  min-width: 100px;
}

.views-metric {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
  color: var(--text-primary);
}

.views-value {
  font-weight: 500;
  font-size: var(--text-sm);
}

/* Engagement Metrics */
.engagement-cell {
  min-width: 180px;
}

.engagement-metrics {
  display: flex;
  gap: var(--space-sm);
  align-items: center;
  flex-wrap: wrap;
}

.metric-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: 4px var(--space-sm);
  background: rgba(15, 61, 46, 0.08);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
  white-space: nowrap;
}

.metric-badge:hover {
  background: rgba(15, 61, 46, 0.12);
}

.metric-badge.engagement-rate {
  background: linear-gradient(135deg, var(--gold-primary), var(--gold-light));
  color: var(--text-on-gold);
  font-weight: 600;
}

.metric-badge.engagement-rate .material-icon {
  color: var(--text-on-gold);
}

/* Sortable Table Headers */
.activity-table th.sortable {
  cursor: pointer;
  user-select: none;
  transition: var(--transition-base);
}

.activity-table th.sortable:hover {
  background: var(--bg-elevated);
  color: var(--gold-primary);
}

.activity-table th.sortable .material-icon {
  margin-left: var(--space-xs);
  vertical-align: middle;
}

/* Performance Section */
.performance-section {
  margin-bottom: var(--space-2xl);
}

.performance-card {
  padding: var(--space-xl);
}

.average-engagement {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-lg);
}

.average-label {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.average-value {
  font-size: var(--text-xl);
  font-weight: 700;
  background: var(--gradient-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Top Posts List */
.top-posts-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.top-post-item {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-base);
}

.top-post-item:hover {
  background: var(--bg-elevated);
  transform: translateY(-2px);
}

.post-rank {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: var(--gradient-gold);
  color: var(--text-on-gold);
  border-radius: var(--radius-full);
  font-weight: 700;
  font-size: var(--text-sm);
  flex-shrink: 0;
}

.post-preview {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex: 1;
  min-width: 0;
}

.post-thumb {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  flex-shrink: 0;
}

.post-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.post-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  min-width: 0;
}

.post-info .post-text {
  font-size: var(--text-sm);
  color: var(--text-primary);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.post-info .post-restaurant {
  font-size: var(--text-xs);
  color: var(--text-secondary);
}

.post-performance {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.performance-stat {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.performance-stat.engagement-rate-stat {
  padding: var(--space-xs) var(--space-sm);
  background: linear-gradient(135deg, var(--gold-primary), var(--gold-light));
  border-radius: var(--radius-sm);
  color: var(--text-on-gold);
}

.engagement-rate-value {
  font-weight: 700;
  color: var(--text-on-gold);
}

.empty-performance {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-2xl);
  text-align: center;
  color: var(--text-muted);
}

/* Instagram Info Banner */
.instagram-info-banner {
  margin-bottom: var(--space-xl);
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.info-content strong {
  font-size: var(--text-base);
}

.info-content p {
  margin: 0;
  font-size: var(--text-sm);
}

.learn-more-link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  color: var(--gold-primary);
  text-decoration: none;
  font-weight: 500;
  font-size: var(--text-sm);
  transition: var(--transition-base);
}

.learn-more-link:hover {
  text-decoration: underline;
}

/* Platform Tabs */
.platform-tabs-wrapper {
  margin-top: var(--space-lg);
  margin-bottom: var(--space-2xl);
}

.platform-tabs {
  display: flex;
  gap: var(--space-sm);
  border-bottom: 2px solid rgba(15, 61, 46, 0.1);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.platform-tabs::-webkit-scrollbar {
  display: none;
}

.platform-tab {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-lg);
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition-base);
  margin-bottom: -2px;
  white-space: nowrap;
  min-height: 44px;
}

.platform-tab:hover:not(.active) {
  color: var(--text-primary);
  background: var(--bg-tertiary);
}

.platform-tab.active {
  color: var(--gold-primary);
  border-bottom-color: var(--gold-primary);
  font-weight: 700;
}

.platform-tab-count {
  font-size: var(--text-xs);
  color: var(--text-muted);
  font-weight: 400;
}

.platform-tab.active .platform-tab-count {
  color: var(--gold-primary);
  font-weight: 600;
}

/* Platform Empty State */
.platform-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-lg);
  padding: var(--space-5xl) var(--space-2xl);
  text-align: center;
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-2xl);
}

.platform-empty-state h3 {
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.platform-empty-state p {
  font-size: var(--text-base);
  color: var(--text-secondary);
  margin: 0;
  max-width: 500px;
}

/* Chart Grid Adjustment */
.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: var(--space-xl);
  margin-bottom: var(--space-2xl);
}

/* Responsive */
@media (max-width: 1200px) {
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .charts-grid {
    grid-template-columns: 1fr;
  }

  /* Hide restaurant, engagement and links columns on tablet */
  .activity-table .restaurant-cell,
  .activity-table th:nth-child(2),
  .activity-table .engagement-cell,
  .activity-table th:nth-child(5),
  .activity-table .links-cell,
  .activity-table th:nth-child(6) {
    display: none;
  }

  /* Stack status filter on smaller screens */
  .status-filter {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .analytics-view {
    padding: var(--space-md);
  }

  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  /* Diagnostic banner mobile */
  .diagnostic-banner {
    flex-direction: column;
    padding: var(--space-lg);
  }

  .diagnostic-icon {
    width: 40px;
    height: 40px;
  }

  .diagnostic-title {
    font-size: var(--text-lg);
  }

  .diagnostic-message {
    font-size: var(--text-sm);
  }

  .diagnostic-details {
    padding: var(--space-md);
  }

  .diagnostic-actions {
    flex-direction: column;
  }

  .diagnostic-btn,
  .diagnostic-btn-secondary {
    width: 100%;
    justify-content: center;
  }

  .time-range-selector {
    justify-content: center;
    flex-wrap: wrap;
  }

  .range-btn {
    padding: var(--space-sm) var(--space-md);
    font-size: var(--text-xs);
  }

  .platform-tab {
    font-size: var(--text-sm);
    padding: var(--space-sm) var(--space-md);
  }

  .platform-tab-count {
    font-size: var(--text-mobile-xs);
  }

  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .metric-card {
    padding: var(--space-lg);
  }

  .metric-icon {
    width: 48px;
    height: 48px;
  }

  .metric-value {
    font-size: var(--text-2xl);
  }

  .chart-container {
    height: 220px;
  }

  /* Table becomes more compact on mobile */
  .activity-table th,
  .activity-table td {
    padding: var(--space-sm) var(--space-md);
  }

  .post-cell {
    min-width: 180px;
  }

  .post-thumbnail {
    width: 40px;
    height: 40px;
  }

  .post-title {
    font-size: var(--text-xs);
  }

  /* Hide restaurant, date, views, engagement and links columns on mobile - show only post and status */
  .activity-table .restaurant-cell,
  .activity-table th:nth-child(2),
  .activity-table .date-cell,
  .activity-table th:nth-child(4),
  .activity-table .views-cell,
  .activity-table th:nth-child(5),
  .activity-table .engagement-cell,
  .activity-table th:nth-child(6),
  .activity-table .links-cell,
  .activity-table th:nth-child(7) {
    display: none;
  }

  /* Performance section mobile */
  .top-post-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .post-performance {
    width: 100%;
    justify-content: space-between;
  }

  /* Make status filter more compact on mobile */
  .status-filter {
    justify-content: center;
  }

  .filter-btn {
    padding: var(--space-xs) var(--space-sm);
    font-size: var(--text-mobile-xs);
  }

  /* Chart horizontal scroll on mobile */
  .chart-container {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    padding-bottom: var(--space-sm);
  }

  .chart-container canvas {
    min-width: 600px; /* Ensure readability */
  }

  /* Time range selector mobile */
  .time-range-selector {
    width: 100%;
    justify-content: space-between;
  }

  .range-btn {
    flex: 1;
    min-height: var(--touch-target-min);
    padding: var(--space-sm);
    font-size: var(--text-xs);
  }
}

@media (max-width: 480px) {
  .platform-tab span:not(.platform-tab-count) {
    display: none; /* Hide text labels on very small screens */
  }

  .platform-tab {
    padding: var(--space-sm);
  }

  /* Compact filters on small screens */
  .time-range-selector {
    gap: 2px;
    padding: 2px;
  }

  .range-btn {
    padding: var(--space-xs) var(--space-sm);
    font-size: var(--text-mobile-xs);
  }
}

/* ===== DARK MODE OVERRIDES ===== */
:root[data-theme="dark"] .stat-card-inner {
  background: var(--bg-secondary);
}

:root[data-theme="dark"] .chart-card {
  background: var(--bg-secondary);
}

:root[data-theme="dark"] .metric-icon {
  background: var(--accent-alpha-15);
}

:root[data-theme="dark"] .activity-table th {
  background: var(--bg-tertiary);
}

:root[data-theme="dark"] .activity-table td {
  border-bottom-color: var(--border-color);
}

:root[data-theme="dark"] .activity-table tbody tr:hover {
  background: var(--bg-tertiary);
}

:root[data-theme="dark"] .filter-btn {
  background: var(--bg-tertiary);
  border-color: var(--border-color);
}

:root[data-theme="dark"] .filter-btn:hover {
  background: var(--bg-elevated);
  border-color: var(--accent-alpha-30);
}

:root[data-theme="dark"] .filter-btn.active {
  background: var(--gold-primary);
  border-color: var(--gold-primary);
  color: var(--bg-primary);
}

:root[data-theme="dark"] .time-range-btn {
  background: var(--bg-tertiary);
  border-color: var(--border-color);
}

:root[data-theme="dark"] .time-range-btn:hover {
  background: var(--bg-elevated);
}

:root[data-theme="dark"] .time-range-btn.active {
  background: var(--gold-primary);
  color: var(--bg-primary);
}

/* Landscape: Reduce vertical padding */
@media (max-height: 500px) and (orientation: landscape) {
  .analytics-view {
    padding: var(--space-md) var(--space-lg);
  }

  .stats-grid {
    margin-bottom: var(--space-lg);
  }

  .stat-card {
    min-height: auto;
    padding: var(--space-md);
  }

  .chart-card {
    padding: var(--space-md);
  }

  .section-header {
    margin-bottom: var(--space-md);
  }

  .landscape-hide {
    display: none;
  }
}
</style>

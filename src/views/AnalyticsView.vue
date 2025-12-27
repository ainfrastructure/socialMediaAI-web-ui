<script setup lang="ts">
import { debugLog, errorLog, warnLog } from '@/utils/debug'

import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
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
import MaterialIcon from '../components/MaterialIcon.vue'
import PlatformLogo from '../components/PlatformLogo.vue'
import { api } from '../services/api'
import { useAuthStore } from '../stores/auth'
import { useRestaurantsStore } from '../stores/restaurants'

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
const authStore = useAuthStore()
const restaurantsStore = useRestaurantsStore()

// State
const loading = ref(true)
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
const selectedPost = ref<any | null>(null)
const showPostModal = ref(false)
const currentPage = ref(1)
const itemsPerPage = 10

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

// Posts filtered by both time range AND status (for Recent Activity table only)
const filteredPosts = computed(() => {
  let posts = timeRangeFilteredPosts.value

  // Filter by status (only affects the activity table)
  if (selectedStatusFilter.value !== 'all') {
    posts = posts.filter(post => post.status === selectedStatusFilter.value)
  }

  return posts
})

// Filtered favorites based on time range
const filteredFavorites = computed(() => {
  if (selectedTimeRange.value === 'all') return favorites.value

  return favorites.value.filter(fav => {
    const favDate = fav.created_at || fav.saved_at
    return isWithinTimeRange(favDate)
  })
})

// Computed stats - based on time range filtered data (not affected by status filter)
const publishedPosts = computed(() =>
  timeRangeFilteredPosts.value.filter(p => p.status === 'published').length
)

const pendingPosts = computed(() =>
  timeRangeFilteredPosts.value.filter(p => p.status === 'scheduled').length
)

const totalPostsInRange = computed(() => timeRangeFilteredPosts.value.length)

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

    scheduledPosts.value.forEach(post => {
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

      const postsOnDay = timeRangeFilteredPosts.value.filter(p => {
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
      backgroundColor: 'rgba(212, 175, 55, 0.1)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: goldColor,
      pointBorderColor: '#1a1a1a',
      pointBorderWidth: 2,
      pointRadius: selectedTimeRange.value === '90d' ? 2 : 4,
      pointHoverRadius: 6
    }]
  }
})

const activityChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      backgroundColor: 'rgba(26, 26, 26, 0.95)',
      titleColor: goldColor,
      bodyColor: '#fff',
      borderColor: goldColor,
      borderWidth: 1,
      padding: 12,
      cornerRadius: 8
    }
  },
  scales: {
    x: {
      grid: {
        color: 'rgba(255, 255, 255, 0.05)'
      },
      ticks: {
        color: 'rgba(255, 255, 255, 0.5)',
        maxRotation: 0
      }
    },
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(255, 255, 255, 0.05)'
      },
      ticks: {
        color: 'rgba(255, 255, 255, 0.5)',
        stepSize: 1
      }
    }
  }
}

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
      borderColor: '#1a1a1a',
      borderWidth: 3,
      hoverBorderWidth: 4
    }]
  }
})

const platformChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '70%',
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        color: 'rgba(255, 255, 255, 0.8)',
        padding: 20,
        usePointStyle: true,
        pointStyle: 'circle'
      }
    },
    tooltip: {
      backgroundColor: 'rgba(26, 26, 26, 0.95)',
      titleColor: goldColor,
      bodyColor: '#fff',
      borderColor: goldColor,
      borderWidth: 1,
      padding: 12,
      cornerRadius: 8
    }
  }
}

// Post status chart - uses time range filtered posts (not affected by status filter)
const statusChartData = computed(() => ({
  labels: [t('analytics.published'), t('analytics.scheduled'), t('analytics.cancelled')],
  datasets: [{
    data: [
      timeRangeFilteredPosts.value.filter(p => p.status === 'published').length,
      timeRangeFilteredPosts.value.filter(p => p.status === 'scheduled').length,
      timeRangeFilteredPosts.value.filter(p => p.status === 'cancelled').length
    ],
    backgroundColor: ['#4ade80', goldColor, '#ef4444'],
    borderColor: '#1a1a1a',
    borderWidth: 2,
    borderRadius: 6
  }]
}))

const statusChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      backgroundColor: 'rgba(26, 26, 26, 0.95)',
      titleColor: goldColor,
      bodyColor: '#fff',
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
        color: 'rgba(255, 255, 255, 0.7)'
      }
    },
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(255, 255, 255, 0.05)'
      },
      ticks: {
        color: 'rgba(255, 255, 255, 0.5)',
        stepSize: 1
      }
    }
  }
}

// Helper to get media URL from post
function getMediaUrl(post: any): string | null {
  return post.media_url ||
         post.image_url ||
         post.video_url ||
         post.favorite_posts?.media_url ||
         post.favorite_post?.media_url ||
         post.favorite?.media_url ||
         null
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

// Pagination
const totalPages = computed(() => Math.ceil(filteredPosts.value.length / itemsPerPage))
const paginatedPosts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredPosts.value.slice(start, end)
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

// Modal functions
function viewPost(post: any) {
  selectedPost.value = post
  showPostModal.value = true
}

function closeModal() {
  showPostModal.value = false
  selectedPost.value = null
}

onMounted(() => {
  fetchAnalyticsData()
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

          <!-- Platform Distribution -->
          <BaseCard variant="glass" class="chart-card platform-chart">
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
                    <span class="sub-value">{{ authStore.user?.subscription?.tier || 'Free' }}</span>
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
                <th>{{ t('analytics.date') }}</th>
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
                    <div class="post-details">
                      <span class="post-title">{{ getPostText(post).substring(0, 40) || t('analytics.noText') }}{{ getPostText(post).length > 40 ? '...' : '' }}</span>
                      <span v-if="post.content_type === 'video'" class="post-type">
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
                    <span v-if="post.status === 'failed' && post.error_message" class="failed-reason">
                      {{ post.error_message }}
                    </span>
                  </div>
                </td>

                <!-- Date Cell -->
                <td class="date-cell">
                  <span class="post-date">{{ formatDate(post.scheduled_date || post.published_date) }}</span>
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
                <!-- Media Preview -->
                <div v-if="getMediaUrl(selectedPost)" class="media-preview">
                  <img
                    v-if="selectedPost.content_type !== 'video'"
                    :src="getMediaUrl(selectedPost)"
                    :alt="selectedPost.post_text || selectedPost.caption || 'Post'"
                    class="media-image"
                  />
                  <video
                    v-else
                    :src="getMediaUrl(selectedPost)"
                    controls
                    class="media-video"
                  ></video>
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
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.15), rgba(212, 175, 55, 0.05));
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
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.2), rgba(212, 175, 55, 0.1));
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

/* Responsive */
@media (max-width: 1200px) {
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .charts-grid {
    grid-template-columns: 1fr;
  }

  /* Hide restaurant and links columns on tablet */
  .activity-table .restaurant-cell,
  .activity-table th:nth-child(2),
  .activity-table .links-cell,
  .activity-table th:nth-child(5) {
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

  .time-range-selector {
    justify-content: center;
    flex-wrap: wrap;
  }

  .range-btn {
    padding: var(--space-sm) var(--space-md);
    font-size: var(--text-xs);
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

  /* Hide restaurant and date columns on mobile - show only post and status */
  .activity-table .restaurant-cell,
  .activity-table th:nth-child(2),
  .activity-table .date-cell,
  .activity-table th:nth-child(4) {
    display: none;
  }

  /* Make status filter more compact on mobile */
  .status-filter {
    justify-content: center;
  }

  .filter-btn {
    padding: var(--space-xs) var(--space-sm);
    font-size: 10px;
  }
}
</style>

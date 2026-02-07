import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { errorLog } from '@/utils/debug'
import { api } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { useBrandsStore } from '@/stores/brands'
import { usePreferencesStore } from '@/stores/preferences'
import { useEngagementStore } from '@/stores/engagement'

export type TimeRange = '7d' | '30d' | '90d' | 'all'
export type StatusFilter = 'all' | 'published' | 'scheduled' | 'cancelled' | 'failed' | 'pending' | 'draft'
export type PlatformFilter = 'all' | 'facebook' | 'instagram' | 'tiktok' | 'twitter' | 'linkedin'
export type SortColumn = 'date' | 'views' | 'likes' | 'engagement'
export type SortDir = 'asc' | 'desc'

export interface TrendData {
  direction: 'up' | 'down' | 'flat'
  percentage: number
}

export interface TopPostItem {
  post: any
  totalLikes: number
  totalComments: number
  totalReach: number
  engagementRate: number
}

export function useAnalyticsData() {
  const { t } = useI18n()
  const route = useRoute()
  const router = useRouter()
  const authStore = useAuthStore()
  const brandsStore = useBrandsStore()
  const preferencesStore = usePreferencesStore()
  const engagementStore = useEngagementStore()

  // ─── State ───────────────────────────────────────────────
  const loading = ref(true)
  const refreshingEngagement = ref(false)
  const stats = ref({ postsCreated: 0, favoritesSaved: 0, scheduledPosts: 0, restaurantsAdded: 0 })
  const scheduledPosts = ref<any[]>([])
  const favorites = ref<any[]>([])
  const selectedTimeRange = ref<TimeRange>('30d')
  const selectedStatusFilter = ref<StatusFilter>('all')
  const selectedPlatform = ref<PlatformFilter>('all')
  const selectedPost = ref<any | null>(null)
  const showPostModal = ref(false)
  const currentPage = ref(1)
  const itemsPerPage = 10
  const sortBy = ref<SortColumn>('date')
  const sortDirection = ref<SortDir>('desc')

  // Toast
  const showToast = ref(false)
  const toastMessage = ref('')
  const toastType = ref<'success' | 'error' | 'info' | 'warning'>('info')

  // Engagement
  const lastEngagementSync = ref<Date | null>(null)
  const engagementDataAvailable = ref(false)

  // Window
  const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 768)
  const isMobile = computed(() => windowWidth.value <= 768)

  // Diagnostics
  const diagnosticInfo = ref({
    publishedPostsCount: 0,
    apiResponseReceived: false,
    apiResponseSuccess: false,
    engagementPostsReturned: 0,
    backendIssue: false,
    lastApiCall: null as Date | null
  })

  // ─── Brand selection ──────────────────────────────────
  const selectedBrandId = computed({
    get: () => preferencesStore.selectedBrandId,
    set: (value: string | null) => preferencesStore.setSelectedBrand(value),
  })

  const selectedBrand = computed(() =>
    brandsStore.brands.find(b => b.id === selectedBrandId.value) || null
  )

  // ─── Toast helper ────────────────────────────────────────
  function displayToast(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') {
    toastMessage.value = message
    toastType.value = type
    showToast.value = true
  }

  // ─── Time helpers ────────────────────────────────────────
  const timeSinceLastSync = computed(() => {
    if (!lastEngagementSync.value) return null
    const diff = Date.now() - lastEngagementSync.value.getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return t('analytics.justNow')
    if (minutes === 1) return t('analytics.oneMinuteAgo')
    if (minutes < 60) return t('analytics.minutesAgo', { minutes })
    const hours = Math.floor(minutes / 60)
    if (hours === 1) return t('analytics.oneHourAgo')
    if (hours < 24) return t('analytics.hoursAgo', { hours })
    const days = Math.floor(hours / 24)
    if (days === 1) return t('analytics.oneDayAgo')
    return t('analytics.daysAgo', { days })
  })

  function isWithinTimeRange(dateStr: string | undefined): boolean {
    if (!dateStr) return false
    if (selectedTimeRange.value === 'all') return true
    const date = new Date(dateStr)
    const days = selectedTimeRange.value === '7d' ? 7 : selectedTimeRange.value === '30d' ? 30 : 90
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    return date >= cutoff
  }

  function getDaysForRange(range: TimeRange): number {
    return range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 0
  }

  // ─── Subscription display ────────────────────────────────
  const subscriptionTierDisplay = computed(() => {
    if (authStore.isAdmin) return 'Admin'
    const tier = authStore.user?.subscription?.tier
    if (!tier || tier === 'free') return 'Monthly'
    return tier.charAt(0).toUpperCase() + tier.slice(1)
  })

  // ─── Filtered posts (pipeline) ──────────────────────────
  const brandFilteredScheduledPosts = computed(() => {
    if (!selectedBrandId.value) return scheduledPosts.value
    return scheduledPosts.value.filter(post =>
      post.brand_id === selectedBrandId.value ||
      post.brands?.id === selectedBrandId.value ||
      post.brand?.id === selectedBrandId.value ||
      post.restaurant_id === selectedBrandId.value ||
      post.favorite_posts?.brand_id === selectedBrandId.value ||
      post.favorite_post?.brand_id === selectedBrandId.value ||
      post.favorite?.brand_id === selectedBrandId.value
    )
  })

  const brandFilteredFavorites = computed(() => {
    if (!selectedBrandId.value) return favorites.value
    return favorites.value.filter(fav =>
      fav.brand_id === selectedBrandId.value ||
      fav.brands?.id === selectedBrandId.value ||
      fav.brand?.id === selectedBrandId.value ||
      fav.restaurant_id === selectedBrandId.value
    )
  })

  const timeRangeFilteredPosts = computed(() => {
    if (selectedTimeRange.value === 'all') return brandFilteredScheduledPosts.value
    return brandFilteredScheduledPosts.value.filter(post => {
      const postDate = post.scheduled_date || post.published_at
      return isWithinTimeRange(postDate)
    })
  })

  const platformFilteredPosts = computed(() => {
    if (selectedPlatform.value === 'all') return timeRangeFilteredPosts.value
    return timeRangeFilteredPosts.value.filter(post =>
      post.platforms?.includes(selectedPlatform.value)
    )
  })

  const filteredPosts = computed(() => {
    let posts = platformFilteredPosts.value
    if (selectedStatusFilter.value !== 'all') {
      posts = posts.filter(post => post.status === selectedStatusFilter.value)
    }
    return posts
  })

  const sortedAndFilteredPosts = computed(() => {
    const posts = [...filteredPosts.value]
    if (sortBy.value === 'date') {
      return posts.sort((a, b) => {
        const dateA = new Date(a.scheduled_date || a.published_at).getTime()
        const dateB = new Date(b.scheduled_date || b.published_at).getTime()
        return sortDirection.value === 'desc' ? dateB - dateA : dateA - dateB
      })
    }
    return posts.sort((a, b) => {
      let valueA = 0, valueB = 0
      const engA = engagementStore.getPostEngagement(a.id)
      const engB = engagementStore.getPostEngagement(b.id)
      if (sortBy.value === 'views') {
        valueA = engA ? Object.values(engA).reduce((s: number, m: any) => s + (m.reach || 0), 0) : 0
        valueB = engB ? Object.values(engB).reduce((s: number, m: any) => s + (m.reach || 0), 0) : 0
      } else if (sortBy.value === 'likes') {
        valueA = engA ? Object.values(engA).reduce((s: number, m: any) => s + (m.likes || 0), 0) : 0
        valueB = engB ? Object.values(engB).reduce((s: number, m: any) => s + (m.likes || 0), 0) : 0
      } else if (sortBy.value === 'engagement') {
        valueA = calcEngagementRate(engA)
        valueB = calcEngagementRate(engB)
      }
      return sortDirection.value === 'desc' ? valueB - valueA : valueA - valueB
    })
  })

  const filteredFavorites = computed(() => {
    if (selectedTimeRange.value === 'all') return brandFilteredFavorites.value
    return brandFilteredFavorites.value.filter(fav => {
      const favDate = fav.created_at || fav.saved_at
      return isWithinTimeRange(favDate)
    })
  })

  // ─── KPI values ──────────────────────────────────────────
  const publishedPostsCount = computed(() =>
    platformFilteredPosts.value.filter(p => p.status === 'published').length
  )
  const scheduledPostsCount = computed(() =>
    platformFilteredPosts.value.filter(p => p.status === 'scheduled').length
  )
  const totalPostsInRange = computed(() => platformFilteredPosts.value.length)
  const savedContentInRange = computed(() => filteredFavorites.value.length)

  const totalEngagementMetrics = computed(() => {
    let likes = 0, comments = 0, shares = 0, reach = 0, impressions = 0
    platformFilteredPosts.value.forEach(post => {
      if (post.status !== 'published') return
      const engagement = engagementStore.getPostEngagement(post.id)
      if (!engagement) return
      if (selectedPlatform.value === 'all') {
        Object.values(engagement).forEach((m: any) => {
          likes += m.likes || 0; comments += m.comments || 0
          shares += m.shares || 0; reach += m.reach || 0; impressions += m.impressions || 0
        })
      } else {
        const pm = engagement[selectedPlatform.value]
        if (pm) {
          likes += pm.likes || 0; comments += pm.comments || 0
          shares += pm.shares || 0; reach += pm.reach || 0; impressions += pm.impressions || 0
        }
      }
    })
    return { likes, comments, shares, reach, impressions }
  })

  // ─── Trend computation (period-over-period) ──────────────
  function getPostsInPeriod(posts: any[], startMs: number, endMs: number) {
    return posts.filter(post => {
      const dateStr = post.scheduled_date || post.published_at
      if (!dateStr) return false
      const t = new Date(dateStr).getTime()
      return t >= startMs && t < endMs
    })
  }

  function sumEngagementForPosts(posts: any[], metric: 'likes' | 'comments' | 'shares' | 'reach'): number {
    let total = 0
    posts.forEach(post => {
      if (post.status !== 'published') return
      const eng = engagementStore.getPostEngagement(post.id)
      if (!eng) return
      if (selectedPlatform.value === 'all') {
        Object.values(eng).forEach((m: any) => { total += m[metric] || 0 })
      } else {
        const pm = eng[selectedPlatform.value]
        if (pm) total += pm[metric] || 0
      }
    })
    return total
  }

  function computeTrend(current: number, previous: number): TrendData {
    if (previous === 0 && current === 0) return { direction: 'flat', percentage: 0 }
    if (previous === 0) return { direction: 'up', percentage: 100 }
    const change = ((current - previous) / previous) * 100
    if (Math.abs(change) < 0.5) return { direction: 'flat', percentage: 0 }
    return { direction: change > 0 ? 'up' : 'down', percentage: Math.abs(change) }
  }

  const trendData = computed(() => {
    if (selectedTimeRange.value === 'all') return null
    const days = getDaysForRange(selectedTimeRange.value)
    const now = Date.now()
    const currentStart = now - days * 86400000
    const prevStart = currentStart - days * 86400000
    const allPosts = brandFilteredScheduledPosts.value

    const currentPosts = getPostsInPeriod(allPosts, currentStart, now)
    const prevPosts = getPostsInPeriod(allPosts, prevStart, currentStart)

    const currentFavs = brandFilteredFavorites.value.filter(f => {
      const d = f.created_at || f.saved_at
      if (!d) return false
      const t = new Date(d).getTime()
      return t >= currentStart && t < now
    })
    const prevFavs = brandFilteredFavorites.value.filter(f => {
      const d = f.created_at || f.saved_at
      if (!d) return false
      const t = new Date(d).getTime()
      return t >= prevStart && t < currentStart
    })

    return {
      totalPosts: computeTrend(currentPosts.length, prevPosts.length),
      savedContent: computeTrend(currentFavs.length, prevFavs.length),
      scheduled: computeTrend(
        currentPosts.filter(p => p.status === 'scheduled').length,
        prevPosts.filter(p => p.status === 'scheduled').length
      ),
      published: computeTrend(
        currentPosts.filter(p => p.status === 'published').length,
        prevPosts.filter(p => p.status === 'published').length
      ),
      likes: computeTrend(sumEngagementForPosts(currentPosts, 'likes'), sumEngagementForPosts(prevPosts, 'likes')),
      reach: computeTrend(sumEngagementForPosts(currentPosts, 'reach'), sumEngagementForPosts(prevPosts, 'reach')),
      comments: computeTrend(sumEngagementForPosts(currentPosts, 'comments'), sumEngagementForPosts(prevPosts, 'comments')),
      shares: computeTrend(sumEngagementForPosts(currentPosts, 'shares'), sumEngagementForPosts(prevPosts, 'shares')),
    }
  })

  // ─── Sparkline data (daily values) ──────────────────────
  function getDailyValues(metric: 'count' | 'likes' | 'reach' | 'comments' | 'shares' | 'saved'): number[] {
    const days = selectedTimeRange.value === 'all' ? 30 : getDaysForRange(selectedTimeRange.value)
    const values: number[] = []

    for (let i = days - 1; i >= 0; i--) {
      const dayStart = new Date()
      dayStart.setHours(0, 0, 0, 0)
      dayStart.setDate(dayStart.getDate() - i)
      const dayEnd = new Date(dayStart)
      dayEnd.setDate(dayEnd.getDate() + 1)

      if (metric === 'count') {
        values.push(getPostsInPeriod(platformFilteredPosts.value, dayStart.getTime(), dayEnd.getTime()).length)
      } else if (metric === 'saved') {
        const count = filteredFavorites.value.filter(f => {
          const d = f.created_at || f.saved_at
          if (!d) return false
          const t = new Date(d).getTime()
          return t >= dayStart.getTime() && t < dayEnd.getTime()
        }).length
        values.push(count)
      } else {
        const dayPosts = getPostsInPeriod(platformFilteredPosts.value, dayStart.getTime(), dayEnd.getTime())
        values.push(sumEngagementForPosts(dayPosts, metric))
      }
    }
    return values
  }

  const kpiSparklineData = computed(() => ({
    totalPosts: getDailyValues('count'),
    savedContent: getDailyValues('saved'),
    scheduled: getDailyValues('count'), // approximation - shows total post count
    published: getDailyValues('count'),
    likes: getDailyValues('likes'),
    reach: getDailyValues('reach'),
    comments: getDailyValues('comments'),
    shares: getDailyValues('shares'),
  }))

  // ─── Platform breakdown ──────────────────────────────────
  const platformBreakdown = computed(() => {
    const breakdown: Record<string, number> = {}
    timeRangeFilteredPosts.value.forEach(post => {
      (post.platforms || []).forEach((platform: string) => {
        breakdown[platform] = (breakdown[platform] || 0) + 1
      })
    })
    return breakdown
  })

  const platformTabs = computed(() => {
    const tabs: Array<{ key: PlatformFilter; label: string; icon: string | null; count: number }> = [
      { key: 'all', label: t('analytics.allPlatforms'), icon: null, count: timeRangeFilteredPosts.value.length }
    ]
    const platforms: PlatformFilter[] = ['facebook', 'instagram', 'tiktok', 'twitter', 'linkedin']
    platforms.forEach(p => {
      const count = timeRangeFilteredPosts.value.filter(post => post.platforms?.includes(p)).length
      if (count > 0) tabs.push({ key: p, label: t(`platforms.${p}`), icon: p, count })
    })
    return tabs
  })

  // ─── Top performing posts ────────────────────────────────
  const topPerformingPosts = computed<TopPostItem[]>(() => {
    return platformFilteredPosts.value
      .filter(post => post.status === 'published')
      .map(post => {
        const engagement = engagementStore.getPostEngagement(post.id)
        if (!engagement) return null
        let totalLikes = 0, totalComments = 0, totalShares = 0, totalReach = 0
        if (selectedPlatform.value === 'all') {
          Object.values(engagement).forEach((m: any) => {
            totalLikes += m.likes || 0; totalComments += m.comments || 0
            totalShares += m.shares || 0; totalReach += m.reach || 0
          })
        } else {
          const pm = engagement[selectedPlatform.value]
          if (pm) {
            totalLikes = pm.likes || 0; totalComments = pm.comments || 0
            totalShares = pm.shares || 0; totalReach = pm.reach || 0
          }
        }
        const engagementRate = totalReach > 0
          ? ((totalLikes + totalComments + totalShares) / totalReach) * 100 : 0
        return { post, totalLikes, totalComments, totalReach, engagementRate }
      })
      .filter((item): item is TopPostItem => item !== null && item.totalReach > 0)
      .sort((a, b) => b.engagementRate - a.engagementRate)
      .slice(0, 5)
  })

  const averageEngagementRate = computed(() => {
    const published = platformFilteredPosts.value.filter(p => p.status === 'published')
    if (published.length === 0) return 0
    let totalEng = 0, totalReach = 0
    published.forEach(post => {
      const engagement = engagementStore.getPostEngagement(post.id)
      if (!engagement) return
      if (selectedPlatform.value === 'all') {
        Object.values(engagement).forEach((m: any) => {
          totalEng += (m.likes || 0) + (m.comments || 0) + (m.shares || 0)
          totalReach += m.reach || 0
        })
      } else {
        const pm = engagement[selectedPlatform.value]
        if (pm) {
          totalEng += (pm.likes || 0) + (pm.comments || 0) + (pm.shares || 0)
          totalReach += pm.reach || 0
        }
      }
    })
    return totalReach > 0 ? (totalEng / totalReach) * 100 : 0
  })

  // ─── Credits ─────────────────────────────────────────────
  const creditsUsagePercent = computed(() => {
    if (!authStore.user?.usage) return 0
    const { credits_this_month, monthly_limit } = authStore.user.usage
    if (monthly_limit === 0) return 0
    return Math.round((credits_this_month / monthly_limit) * 100)
  })

  const hasMeaningfulStats = computed(() =>
    brandFilteredScheduledPosts.value.length > 0 || brandFilteredFavorites.value.length > 0
  )

  // ─── Pagination ──────────────────────────────────────────
  const totalPages = computed(() => Math.ceil(sortedAndFilteredPosts.value.length / itemsPerPage))
  const paginatedPosts = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage
    return sortedAndFilteredPosts.value.slice(start, start + itemsPerPage)
  })

  // ─── Post helpers ────────────────────────────────────────
  function getMediaUrl(post: any): string | null {
    return post.media_url || post.image_url || post.favorite_posts?.media_url ||
      post.favorite_post?.media_url || post.favorite?.media_url || null
  }

  function getVideoUrl(post: any): string | null {
    return post.video_url || post.favorite_posts?.video_url ||
      post.favorite_post?.video_url || post.favorite?.video_url || null
  }

  function hasVideo(post: any): boolean { return !!getVideoUrl(post) }

  function getPostText(post: any): string {
    return post.post_text || post.caption || post.text ||
      post.favorite_posts?.post_text || post.favorite_posts?.caption ||
      post.favorite_post?.post_text || post.favorite_post?.caption || ''
  }

  function getBrandName(post: any): string {
    if (post.business_name) return post.business_name
    if (post.brands?.name) return post.brands.name
    if (post.brand?.name) return post.brand.name
    if (post.favorite_posts?.business_name) return post.favorite_posts.business_name
    if (post.favorite_post?.business_name) return post.favorite_post.business_name
    if (post.favorite?.business_name) return post.favorite.business_name
    if (post.restaurant_name) return post.restaurant_name
    if (post.favorite_posts?.restaurant_name) return post.favorite_posts.restaurant_name
    if (post.favorite_post?.restaurant_name) return post.favorite_post.restaurant_name
    if (post.favorite?.restaurant_name) return post.favorite.restaurant_name
    if (post.restaurant?.name) return post.restaurant.name
    const brandId = post.brand_id || post.favorite_posts?.brand_id ||
      post.favorite_post?.brand_id || post.favorite?.brand_id
    if (brandId && brandsStore.brands.length > 0) {
      const brand = brandsStore.brands.find((b: any) => b.id === brandId)
      if (brand) return brand.name
    }
    return '—'
  }

  function formatDate(dateStr: string): string {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
    })
  }

  function getPostEngagementMetric(postId: string, metric: 'likes' | 'comments' | 'shares', platform?: string): string {
    const engagement = engagementStore.getPostEngagement(postId)
    if (!engagement) return '—'
    let total = 0
    if (platform && platform !== 'all') {
      total = engagement[platform]?.[metric] || 0
    } else {
      total = Object.values(engagement).reduce((sum: number, m: any) => sum + (m[metric] || 0), 0)
    }
    return total > 0 ? total.toLocaleString() : '—'
  }

  function getPostViews(postId: string, platform?: string): string {
    const engagement = engagementStore.getPostEngagement(postId)
    if (!engagement) return '—'
    let totalReach = 0
    if (platform && platform !== 'all') {
      totalReach = engagement[platform]?.reach || 0
    } else {
      totalReach = Object.values(engagement).reduce((sum: number, m: any) => sum + (m.reach || 0), 0)
    }
    return totalReach > 0 ? totalReach.toLocaleString() : '—'
  }

  function getPostEngagementRate(postId: string, platform?: string): string {
    const engagement = engagementStore.getPostEngagement(postId)
    if (!engagement) return '—'
    let totalLikes = 0, totalComments = 0, totalShares = 0, totalReach = 0
    if (platform && platform !== 'all') {
      const pm = engagement[platform]
      if (pm) {
        totalLikes = pm.likes || 0; totalComments = pm.comments || 0
        totalShares = pm.shares || 0; totalReach = pm.reach || 0
      }
    } else {
      Object.values(engagement).forEach((m: any) => {
        totalLikes += m.likes || 0; totalComments += m.comments || 0
        totalShares += m.shares || 0; totalReach += m.reach || 0
      })
    }
    if (totalReach === 0) return '—'
    return `${(((totalLikes + totalComments + totalShares) / totalReach) * 100).toFixed(1)}%`
  }

  function calcEngagementRate(engagement: any): number {
    if (!engagement) return 0
    let totalEng = 0, totalReach = 0
    Object.values(engagement).forEach((m: any) => {
      totalEng += (m.likes || 0) + (m.comments || 0) + (m.shares || 0)
      totalReach += m.reach || 0
    })
    return totalReach > 0 ? (totalEng / totalReach) * 100 : 0
  }

  // ─── Actions ─────────────────────────────────────────────
  function handleTimeRangeChange(range: TimeRange) {
    selectedTimeRange.value = range
    currentPage.value = 1
  }

  function handleStatusFilterChange(status: StatusFilter) {
    selectedStatusFilter.value = status
    currentPage.value = 1
  }

  function handlePlatformChange(platform: PlatformFilter) {
    selectedPlatform.value = platform
    currentPage.value = 1
    router.replace({ query: { ...route.query, platform: platform === 'all' ? undefined : platform } })
  }

  function handleSort(column: SortColumn) {
    if (sortBy.value === column) {
      sortDirection.value = sortDirection.value === 'desc' ? 'asc' : 'desc'
    } else {
      sortBy.value = column
      sortDirection.value = 'desc'
    }
  }

  function goToPage(page: number) {
    if (page >= 1 && page <= totalPages.value) currentPage.value = page
  }

  function viewPost(post: any) {
    selectedPost.value = post
    showPostModal.value = true
  }

  function closeModal() {
    showPostModal.value = false
    selectedPost.value = null
  }

  // ─── Fetch data ──────────────────────────────────────────
  async function fetchAnalyticsData() {
    loading.value = true
    try {
      const [statsResponse, postsResponse, favoritesResponse] = await Promise.all([
        api.getStats(),
        api.getScheduledPosts({}),
        api.getFavorites({ limit: 1000 })
      ])

      if (statsResponse.success && statsResponse.data) stats.value = statsResponse.data
      if (postsResponse.success && postsResponse.data) scheduledPosts.value = postsResponse.data.scheduled_posts || []
      if (favoritesResponse.success && favoritesResponse.data) favorites.value = favoritesResponse.data.favorites || []

      // Fetch engagement for published posts
      const published = brandFilteredScheduledPosts.value.filter(p => p.status === 'published')
      const publishedPostIds = published.map(p => p.id)
      diagnosticInfo.value.publishedPostsCount = published.length

      if (publishedPostIds.length === 0) {
        engagementDataAvailable.value = false
        diagnosticInfo.value.backendIssue = false
        lastEngagementSync.value = new Date()
      } else {
        try {
          diagnosticInfo.value.lastApiCall = new Date()
          const engagementResponse = await api.getBulkEngagement(publishedPostIds)
          diagnosticInfo.value.apiResponseReceived = true
          diagnosticInfo.value.apiResponseSuccess = engagementResponse.success

          // Always mark sync time to prevent autoSyncEngagementIfNeeded from
          // immediately re-fetching per-post (which spams the backend)
          lastEngagementSync.value = new Date()

          if (engagementResponse.success && engagementResponse.data) {
            const postsData = engagementResponse.data.posts || []
            diagnosticInfo.value.engagementPostsReturned = postsData.length
            if (postsData.length === 0) {
              diagnosticInfo.value.backendIssue = true
              engagementDataAvailable.value = false
            } else {
              postsData.forEach((post: any) => {
                engagementStore.setPostEngagement(post.scheduled_post_id, post.platforms)
              })
              engagementDataAvailable.value = true
            }
          } else {
            engagementDataAvailable.value = false
          }
        } catch {
          engagementDataAvailable.value = false
          lastEngagementSync.value = new Date()
        }
      }
    } catch (error) {
      errorLog('Failed to fetch analytics:', error)
    } finally {
      loading.value = false
    }
  }

  async function refreshAllEngagement() {
    refreshingEngagement.value = true
    try {
      const published = scheduledPosts.value.filter(p => p.status === 'published')
      if (published.length === 0) {
        displayToast(t('analytics.noPublishedPosts'), 'info')
        return
      }
      let successCount = 0
      for (const post of published) {
        try {
          const response = await api.refreshEngagement(post.id)
          if (response.success && response.data) {
            engagementStore.setPostEngagement(response.data.scheduled_post_id, response.data.platforms)
            successCount++
          }
          await new Promise(resolve => setTimeout(resolve, 1000))
        } catch { /* skip */ }
      }
      lastEngagementSync.value = new Date()
      engagementDataAvailable.value = successCount > 0
      if (successCount > 0) {
        displayToast(t('analytics.refreshSuccess', { count: successCount }), 'success')
      } else {
        displayToast(t('analytics.refreshFailed'), 'warning')
      }
    } catch {
      displayToast(t('analytics.refreshError'), 'error')
    } finally {
      refreshingEngagement.value = false
    }
  }

  async function handleRetryPost(post: any) {
    if (!post?.id) return
    try {
      const response = await api.retryScheduledPost(post.id)
      if (response.success) {
        displayToast(t('scheduler.retrySuccess'), 'success')
        closeModal()
        await fetchAnalyticsData()
      } else {
        displayToast(response.error || t('scheduler.retryError'), 'error')
      }
    } catch {
      displayToast(t('scheduler.retryError'), 'error')
    }
  }

  async function autoSyncEngagementIfNeeded() {
    const published = brandFilteredScheduledPosts.value.filter(p => p.status === 'published')
    if (published.length === 0) return
    const STALE_MS = 5 * 60 * 1000
    const lastSync = lastEngagementSync.value?.getTime() || 0
    if (Date.now() - lastSync > STALE_MS) await refreshAllEngagement()
  }

  // ─── Chart data ──────────────────────────────────────────
  const activityChartData = computed(() => {
    const labels: string[] = []
    const data: number[] = []

    if (selectedTimeRange.value === 'all') {
      const monthlyData: Record<string, number> = {}
      platformFilteredPosts.value.forEach(post => {
        const postDate = post.scheduled_date || post.published_at
        if (postDate) {
          const date = new Date(postDate)
          const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          monthlyData[key] = (monthlyData[key] || 0) + 1
        }
      })
      const sorted = Object.keys(monthlyData).sort()
      sorted.forEach(key => {
        const [year, month] = key.split('-')
        labels.push(new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }))
        data.push(monthlyData[key])
      })
      if (labels.length === 0) {
        for (let i = 5; i >= 0; i--) {
          const d = new Date(); d.setMonth(d.getMonth() - i)
          labels.push(d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }))
          data.push(0)
        }
      }
    } else {
      const days = getDaysForRange(selectedTimeRange.value)
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(); date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        if (days <= 7) labels.push(date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }))
        else if (days <= 30) labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
        else labels.push(i % 7 === 0 || i === days - 1 ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '')
        data.push(platformFilteredPosts.value.filter(p => (p.scheduled_date || p.published_at)?.startsWith(dateStr)).length)
      }
    }

    return {
      labels,
      datasets: [{
        label: t('analytics.postsActivity'),
        data,
        borderColor: '#0f3d2e',
        backgroundColor: 'rgba(15, 61, 46, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#0f3d2e',
        pointBorderColor: '#f6f1e7',
        pointBorderWidth: 2,
        pointRadius: selectedTimeRange.value === '90d' ? 2 : 4,
        pointHoverRadius: 6
      }]
    }
  })

  // Shared tooltip config for all charts
  const sharedTooltip = computed(() => ({
    backgroundColor: '#faf6ed',
    titleColor: '#2d2d2d',
    bodyColor: '#5a5a5a',
    borderColor: 'rgba(176, 138, 90, 0.25)',
    borderWidth: 1,
    padding: isMobile.value ? 14 : 12,
    cornerRadius: 8,
    titleFont: { size: isMobile.value ? 14 : 12, family: "'Playfair Display', serif" },
    bodyFont: { size: isMobile.value ? 13 : 11 }
  }))

  const activityChartOptions = computed(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: sharedTooltip.value
    },
    scales: {
      x: {
        grid: { display: !isMobile.value, color: 'rgba(15, 61, 46, 0.05)' },
        ticks: {
          color: 'rgba(15, 61, 46, 0.5)',
          maxRotation: isMobile.value ? 45 : 0,
          maxTicksLimit: isMobile.value ? 8 : undefined,
          font: { size: isMobile.value ? 11 : 12 }
        }
      },
      y: {
        beginAtZero: true,
        grid: { display: !isMobile.value, color: 'rgba(15, 61, 46, 0.05)' },
        ticks: { color: 'rgba(15, 61, 46, 0.5)', stepSize: 1, font: { size: isMobile.value ? 11 : 12 } }
      }
    }
  }))

  const platformChartData = computed(() => {
    const platforms = Object.keys(platformBreakdown.value)
    const colors: Record<string, string> = {
      facebook: '#1877F2', instagram: '#E4405F', tiktok: '#000000',
      twitter: '#1DA1F2', linkedin: '#0A66C2'
    }
    return {
      labels: platforms.map(p => p.charAt(0).toUpperCase() + p.slice(1)),
      datasets: [{
        data: platforms.map(p => platformBreakdown.value[p]),
        backgroundColor: platforms.map(p => colors[p] || '#0f3d2e'),
        borderColor: '#f6f1e7',
        borderWidth: 3,
        hoverBorderWidth: 4
      }]
    }
  })

  const platformChartOptions = computed(() => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: { display: false },
      tooltip: {
        ...sharedTooltip.value,
        displayColors: true,
        boxPadding: 4
      }
    }
  }))

  const statusChartData = computed(() => ({
    labels: [t('analytics.published'), t('analytics.scheduled'), t('analytics.cancelled')],
    datasets: [{
      data: [
        platformFilteredPosts.value.filter(p => p.status === 'published').length,
        platformFilteredPosts.value.filter(p => p.status === 'scheduled').length,
        platformFilteredPosts.value.filter(p => p.status === 'cancelled').length
      ],
      backgroundColor: ['#4ade80', '#0f3d2e', '#ef4444'],
      borderColor: '#f6f1e7',
      borderWidth: 2,
      borderRadius: 6
    }]
  }))

  const statusChartOptions = computed(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: sharedTooltip.value
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: 'rgba(15, 61, 46, 0.7)', font: { size: isMobile.value ? 11 : 12 } }
      },
      y: {
        beginAtZero: true,
        grid: { display: !isMobile.value, color: 'rgba(15, 61, 46, 0.05)' },
        ticks: { color: 'rgba(15, 61, 46, 0.5)', stepSize: 1, font: { size: isMobile.value ? 11 : 12 } }
      }
    }
  }))

  return {
    // State
    loading,
    refreshingEngagement,
    stats,
    scheduledPosts,
    favorites,
    selectedTimeRange,
    selectedStatusFilter,
    selectedPlatform,
    selectedPost,
    showPostModal,
    currentPage,
    itemsPerPage,
    sortBy,
    sortDirection,
    showToast,
    toastMessage,
    toastType,
    lastEngagementSync,
    engagementDataAvailable,
    windowWidth,
    isMobile,
    diagnosticInfo,

    // Computed
    selectedBrandId,
    selectedBrand,
    timeSinceLastSync,
    subscriptionTierDisplay,
    brandFilteredScheduledPosts,
    brandFilteredFavorites,
    timeRangeFilteredPosts,
    platformFilteredPosts,
    filteredPosts,
    sortedAndFilteredPosts,
    filteredFavorites,
    publishedPostsCount,
    scheduledPostsCount,
    totalPostsInRange,
    savedContentInRange,
    totalEngagementMetrics,
    trendData,
    kpiSparklineData,
    platformBreakdown,
    platformTabs,
    topPerformingPosts,
    averageEngagementRate,
    creditsUsagePercent,
    hasMeaningfulStats,
    totalPages,
    paginatedPosts,

    // Chart data
    activityChartData,
    activityChartOptions,
    platformChartData,
    platformChartOptions,
    statusChartData,
    statusChartOptions,

    // Methods
    displayToast,
    handleTimeRangeChange,
    handleStatusFilterChange,
    handlePlatformChange,
    handleSort,
    goToPage,
    viewPost,
    closeModal,
    fetchAnalyticsData,
    refreshAllEngagement,
    handleRetryPost,
    autoSyncEngagementIfNeeded,

    // Post helpers
    getMediaUrl,
    getVideoUrl,
    hasVideo,
    getPostText,
    getBrandName,
    formatDate,
    getPostEngagementMetric,
    getPostViews,
    getPostEngagementRate,

    // Stores (exposed for sub-components)
    authStore,
    brandsStore,
    preferencesStore,
    engagementStore,
  }
}

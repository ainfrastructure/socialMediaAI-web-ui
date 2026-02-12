/**
 * Composable for analyzing 90 days of posting data and generating
 * an optimal weekly schedule with confidence intervals.
 *
 * Correlates impressions and engagement with:
 * - Posting time (hour of day)
 * - Day of week
 * - Content type (platform, post type)
 * - Content length (caption/text character count)
 */
import { ref, computed } from 'vue'
import { api } from '@/services/api'
import { useBrandsStore } from '@/stores/brands'
import { usePreferencesStore } from '@/stores/preferences'
import { useEngagementStore } from '@/stores/engagement'
import {
  mean,
  confidenceInterval95,
  coefficientOfVariation,
  getConfidenceLevel,
} from '@/utils/statistics'
import { errorLog } from '@/utils/debug'
import type {
  DayPerformance,
  HourPerformance,
  ContentTypePerformance,
  ContentLengthPerformance,
  ScheduleSlot,
  WeeklySchedule,
  HeatmapCell,
  AnalysisSummary,
} from '@/types/scheduleAnalysis'

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const LENGTH_BUCKETS = [
  { label: 'Short (0–100)', min: 0, max: 100 },
  { label: 'Medium (101–250)', min: 101, max: 250 },
  { label: 'Long (251–500)', min: 251, max: 500 },
  { label: 'Very Long (500+)', min: 501, max: Infinity },
]

function formatHour(hour: number): string {
  if (hour === 0) return '12 AM'
  if (hour === 12) return '12 PM'
  if (hour < 12) return `${hour} AM`
  return `${hour - 12} PM`
}

interface PostWithEngagement {
  id: string
  scheduledDate: Date
  hour: number
  dayOfWeek: number
  platforms: string[]
  textLength: number
  postType: string
  engagementRate: number
  impressions: number
  reach: number
  likes: number
  comments: number
  shares: number
}

export function useScheduleAnalysis() {
  const brandsStore = useBrandsStore()
  const preferencesStore = usePreferencesStore()
  const engagementStore = useEngagementStore()

  // ── State ─────────────────────────────────────────────
  const loading = ref(false)
  const error = ref<string | null>(null)
  const postsWithEngagement = ref<PostWithEngagement[]>([])
  const rawPosts = ref<any[]>([])

  // ── Brand selection ───────────────────────────────────
  const selectedBrandId = computed({
    get: () => preferencesStore.selectedBrandId,
    set: (value: string | null) => preferencesStore.setSelectedBrand(value),
  })

  const selectedBrand = computed(() =>
    brandsStore.brands.find(b => b.id === selectedBrandId.value) || null
  )

  // ── Fetch & process data ──────────────────────────────
  async function fetchAndAnalyze(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      // Fetch brands if needed
      if (brandsStore.brands.length === 0) {
        await brandsStore.fetchBrands()
      }
      if (!selectedBrandId.value && brandsStore.brands.length > 0) {
        preferencesStore.setSelectedBrand(brandsStore.brands[0].id)
      }

      // Fetch all scheduled posts
      const postsResponse = await api.getScheduledPosts({})
      if (!postsResponse.success || !postsResponse.data) {
        error.value = 'Failed to fetch posts data'
        return
      }

      const allPosts: any[] = postsResponse.data.scheduled_posts || []

      // Filter to published posts in the last 90 days with the selected brand
      const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      const published = allPosts.filter(post => {
        if (post.status !== 'published') return false
        const postDate = post.published_at || post.scheduled_date
        if (!postDate) return false
        if (new Date(postDate) < cutoff) return false
        if (selectedBrandId.value) {
          return (
            post.brand_id === selectedBrandId.value ||
            post.brands?.id === selectedBrandId.value ||
            post.posts?.brand_id === selectedBrandId.value
          )
        }
        return true
      })

      rawPosts.value = published

      // Fetch engagement data for published posts
      const publishedIds = published.map(p => p.id)
      if (publishedIds.length > 0) {
        try {
          const engagementResponse = await api.getBulkEngagement(publishedIds)
          if (engagementResponse.success && engagementResponse.data) {
            const postsData = engagementResponse.data.posts || []
            postsData.forEach((post: any) => {
              engagementStore.setPostEngagement(post.scheduled_post_id, post.platforms)
            })
          }
        } catch {
          // Continue without engagement data — we'll show a warning
        }
      }

      // Build enriched post records
      const enriched: PostWithEngagement[] = []
      for (const post of published) {
        const dateStr = post.published_at || post.scheduled_date
        if (!dateStr) continue

        const date = new Date(dateStr)
        const engagement = engagementStore.getPostEngagement(post.id)

        let totalLikes = 0
        let totalComments = 0
        let totalShares = 0
        let totalReach = 0
        let totalImpressions = 0

        if (engagement) {
          Object.values(engagement).forEach((m: any) => {
            totalLikes += m.likes || 0
            totalComments += m.comments || 0
            totalShares += m.shares || 0
            totalReach += m.reach || 0
            totalImpressions += m.impressions || 0
          })
        }

        const engagementRate = totalReach > 0
          ? ((totalLikes + totalComments + totalShares) / totalReach) * 100
          : 0

        const text = post.post_text || post.caption || post.text || post.posts?.caption || ''
        const platforms = post.platforms || []

        enriched.push({
          id: post.id,
          scheduledDate: date,
          hour: date.getHours(),
          dayOfWeek: date.getDay(),
          platforms,
          textLength: text.length,
          postType: platforms.length > 0 ? platforms[0] : 'unknown',
          engagementRate,
          impressions: totalImpressions,
          reach: totalReach,
          likes: totalLikes,
          comments: totalComments,
          shares: totalShares,
        })
      }

      postsWithEngagement.value = enriched
    } catch (err) {
      errorLog('Schedule analysis failed:', err)
      error.value = 'An error occurred while analyzing data. Please try again.'
    } finally {
      loading.value = false
    }
  }

  // ── Analysis: By Day of Week ──────────────────────────
  const dayPerformance = computed<DayPerformance[]>(() => {
    const days: DayPerformance[] = []
    for (let d = 0; d < 7; d++) {
      const dayPosts = postsWithEngagement.value.filter(p => p.dayOfWeek === d)
      const rates = dayPosts.map(p => p.engagementRate)
      const impressions = dayPosts.map(p => p.impressions)

      days.push({
        dayOfWeek: d,
        dayLabel: DAY_LABELS[d],
        avgEngagementRate: mean(rates),
        avgImpressions: mean(impressions),
        postCount: dayPosts.length,
        confidenceInterval: confidenceInterval95(rates),
      })
    }
    return days
  })

  // ── Analysis: By Hour of Day ──────────────────────────
  const hourPerformance = computed<HourPerformance[]>(() => {
    const hours: HourPerformance[] = []
    for (let h = 0; h < 24; h++) {
      const hourPosts = postsWithEngagement.value.filter(p => p.hour === h)
      const rates = hourPosts.map(p => p.engagementRate)
      const impressions = hourPosts.map(p => p.impressions)

      hours.push({
        hour: h,
        hourLabel: formatHour(h),
        avgEngagementRate: mean(rates),
        avgImpressions: mean(impressions),
        postCount: hourPosts.length,
        confidenceInterval: confidenceInterval95(rates),
      })
    }
    return hours
  })

  // ── Analysis: By Content Type (platform) ──────────────
  const contentTypePerformance = computed<ContentTypePerformance[]>(() => {
    const platformMap = new Map<string, PostWithEngagement[]>()

    for (const post of postsWithEngagement.value) {
      for (const platform of post.platforms) {
        const existing = platformMap.get(platform) || []
        existing.push(post)
        platformMap.set(platform, existing)
      }
    }

    const results: ContentTypePerformance[] = []
    for (const [platform, posts] of platformMap) {
      const rates = posts.map(p => p.engagementRate)
      const impressions = posts.map(p => p.impressions)

      results.push({
        contentType: platform,
        label: platform.charAt(0).toUpperCase() + platform.slice(1),
        avgEngagementRate: mean(rates),
        avgImpressions: mean(impressions),
        postCount: posts.length,
        confidenceInterval: confidenceInterval95(rates),
      })
    }

    return results.sort((a, b) => b.avgEngagementRate - a.avgEngagementRate)
  })

  // ── Analysis: By Content Length ────────────────────────
  const contentLengthPerformance = computed<ContentLengthPerformance[]>(() => {
    return LENGTH_BUCKETS.map(bucket => {
      const posts = postsWithEngagement.value.filter(
        p => p.textLength >= bucket.min && p.textLength <= bucket.max
      )
      const rates = posts.map(p => p.engagementRate)
      const impressions = posts.map(p => p.impressions)

      return {
        bucket: bucket.label,
        minLength: bucket.min,
        maxLength: bucket.max,
        avgEngagementRate: mean(rates),
        avgImpressions: mean(impressions),
        postCount: posts.length,
        confidenceInterval: confidenceInterval95(rates),
      }
    })
  })

  // ── Heatmap Data (Day × Hour) ─────────────────────────
  const heatmapData = computed<HeatmapCell[]>(() => {
    const cells: HeatmapCell[] = []
    let maxRate = 0

    // First pass: compute raw values
    const rawCells: Array<{ day: number; hour: number; rate: number; count: number }> = []
    for (let d = 0; d < 7; d++) {
      for (let h = 0; h < 24; h++) {
        const posts = postsWithEngagement.value.filter(
          p => p.dayOfWeek === d && p.hour === h
        )
        const rate = mean(posts.map(p => p.engagementRate))
        if (rate > maxRate) maxRate = rate
        rawCells.push({ day: d, hour: h, rate, count: posts.length })
      }
    }

    // Second pass: normalize
    for (const cell of rawCells) {
      cells.push({
        day: cell.day,
        hour: cell.hour,
        value: maxRate > 0 ? cell.rate / maxRate : 0,
        engagementRate: cell.rate,
        postCount: cell.count,
      })
    }

    return cells
  })

  // ── Generate Weekly Schedule ──────────────────────────
  const weeklySchedule = computed<WeeklySchedule>(() => {
    const posts = postsWithEngagement.value
    const warnings: string[] = []

    if (posts.length === 0) {
      return {
        generatedAt: new Date().toISOString(),
        analysisPeriod: 90,
        totalPostsAnalyzed: 0,
        slots: [],
        dataQualityScore: 0,
        warnings: ['No published posts with engagement data found in the last 90 days.'],
      }
    }

    if (posts.length < 10) {
      warnings.push(
        `Only ${posts.length} posts analyzed. Recommendations have wider confidence intervals. 20+ posts recommended for reliable scheduling.`
      )
    }

    // Find best time slots per day
    const slots: ScheduleSlot[] = []

    for (let d = 0; d < 7; d++) {
      const dayPosts = posts.filter(p => p.dayOfWeek === d)
      if (dayPosts.length === 0) {
        // Use overall best hour if no data for this day
        const allRates = posts.map(p => p.engagementRate)
        const bestHourOverall = getBestHourForPosts(posts)
        const bestContentType = getBestContentType(posts)
        const bestLength = getBestLengthBucket(posts)

        slots.push({
          dayOfWeek: d,
          dayLabel: DAY_LABELS[d],
          hour: bestHourOverall,
          timeLabel: formatHour(bestHourOverall),
          expectedEngagementRate: mean(allRates),
          confidenceInterval: confidenceInterval95(allRates),
          confidenceLevel: 'low',
          recommendedContentType: bestContentType,
          recommendedLength: bestLength,
          basedOnPosts: posts.length,
        })
        continue
      }

      // Group by hour for this day
      const hourBuckets = new Map<number, PostWithEngagement[]>()
      for (const post of dayPosts) {
        const bucket = hourBuckets.get(post.hour) || []
        bucket.push(post)
        hourBuckets.set(post.hour, bucket)
      }

      // Find best hour
      let bestHour = 12 // Default to noon
      let bestRate = -1

      for (const [hour, hourPosts] of hourBuckets) {
        const avgRate = mean(hourPosts.map(p => p.engagementRate))
        if (avgRate > bestRate) {
          bestRate = avgRate
          bestHour = hour
        }
      }

      // If no specific hour data, use the overall best hour
      if (hourBuckets.size === 0) {
        bestHour = getBestHourForPosts(posts)
      }

      const rates = dayPosts.map(p => p.engagementRate)
      const cv = coefficientOfVariation(rates)
      const confidenceLevel = getConfidenceLevel(dayPosts.length, cv)

      const bestContentType = getBestContentType(dayPosts.length >= 3 ? dayPosts : posts)
      const bestLength = getBestLengthBucket(dayPosts.length >= 3 ? dayPosts : posts)

      slots.push({
        dayOfWeek: d,
        dayLabel: DAY_LABELS[d],
        hour: bestHour,
        timeLabel: formatHour(bestHour),
        expectedEngagementRate: mean(rates),
        confidenceInterval: confidenceInterval95(rates),
        confidenceLevel,
        recommendedContentType: bestContentType,
        recommendedLength: bestLength,
        basedOnPosts: dayPosts.length,
      })
    }

    // Data quality score (0-100)
    const dataQualityScore = calculateDataQuality(posts)

    if (dataQualityScore < 30) {
      warnings.push('Low data quality. Consider posting more consistently to improve recommendations.')
    }

    // Check engagement data availability
    const postsWithEngData = posts.filter(p => p.reach > 0 || p.impressions > 0)
    if (postsWithEngData.length < posts.length * 0.5) {
      warnings.push(
        `Only ${postsWithEngData.length} of ${posts.length} posts have engagement data. Sync your platforms for better analysis.`
      )
    }

    return {
      generatedAt: new Date().toISOString(),
      analysisPeriod: 90,
      totalPostsAnalyzed: posts.length,
      slots: slots.sort((a, b) => a.dayOfWeek - b.dayOfWeek),
      dataQualityScore,
      warnings,
    }
  })

  // ── Summary Statistics ────────────────────────────────
  const summary = computed<AnalysisSummary>(() => {
    const posts = postsWithEngagement.value
    const allRates = posts.map(p => p.engagementRate)
    const allImpressions = posts.map(p => p.impressions)

    const dates = posts.map(p => p.scheduledDate.getTime())
    const minDate = dates.length > 0 ? new Date(Math.min(...dates)).toISOString() : ''
    const maxDate = dates.length > 0 ? new Date(Math.max(...dates)).toISOString() : ''

    const bestDay = dayPerformance.value
      .filter(d => d.postCount > 0)
      .sort((a, b) => b.avgEngagementRate - a.avgEngagementRate)[0] || null

    const bestHour = hourPerformance.value
      .filter(h => h.postCount > 0)
      .sort((a, b) => b.avgEngagementRate - a.avgEngagementRate)[0] || null

    const bestContentType = contentTypePerformance.value[0] || null

    const optimalLength = contentLengthPerformance.value
      .filter(l => l.postCount > 0)
      .sort((a, b) => b.avgEngagementRate - a.avgEngagementRate)[0] || null

    return {
      totalPostsAnalyzed: posts.length,
      dateRange: { start: minDate, end: maxDate },
      bestDay,
      bestHour,
      bestContentType,
      optimalLength,
      avgEngagementRate: mean(allRates),
      avgImpressions: mean(allImpressions),
      dataQualityScore: calculateDataQuality(posts),
    }
  })

  // ── Helper functions ──────────────────────────────────
  function getBestHourForPosts(posts: PostWithEngagement[]): number {
    const hourMap = new Map<number, number[]>()
    for (const p of posts) {
      const existing = hourMap.get(p.hour) || []
      existing.push(p.engagementRate)
      hourMap.set(p.hour, existing)
    }

    let bestHour = 12
    let bestRate = -1
    for (const [hour, rates] of hourMap) {
      const avg = mean(rates)
      if (avg > bestRate) {
        bestRate = avg
        bestHour = hour
      }
    }
    return bestHour
  }

  function getBestContentType(posts: PostWithEngagement[]): string | null {
    const platformMap = new Map<string, number[]>()
    for (const p of posts) {
      for (const platform of p.platforms) {
        const existing = platformMap.get(platform) || []
        existing.push(p.engagementRate)
        platformMap.set(platform, existing)
      }
    }

    let bestType: string | null = null
    let bestRate = -1
    for (const [type, rates] of platformMap) {
      const avg = mean(rates)
      if (avg > bestRate) {
        bestRate = avg
        bestType = type
      }
    }
    return bestType
  }

  function getBestLengthBucket(posts: PostWithEngagement[]): { min: number; max: number } | null {
    let bestBucket: { min: number; max: number } | null = null
    let bestRate = -1

    for (const bucket of LENGTH_BUCKETS) {
      const bucketPosts = posts.filter(
        p => p.textLength >= bucket.min && p.textLength <= bucket.max
      )
      if (bucketPosts.length === 0) continue

      const avg = mean(bucketPosts.map(p => p.engagementRate))
      if (avg > bestRate) {
        bestRate = avg
        bestBucket = { min: bucket.min, max: bucket.max === Infinity ? 1000 : bucket.max }
      }
    }

    return bestBucket
  }

  function calculateDataQuality(posts: PostWithEngagement[]): number {
    if (posts.length === 0) return 0

    let score = 0

    // Volume score (0-30): 30+ posts = full score
    score += Math.min(30, (posts.length / 30) * 30)

    // Day coverage (0-20): posts on all 7 days
    const daysWithPosts = new Set(posts.map(p => p.dayOfWeek)).size
    score += (daysWithPosts / 7) * 20

    // Hour diversity (0-15): posts across many hours
    const hoursWithPosts = new Set(posts.map(p => p.hour)).size
    score += Math.min(15, (hoursWithPosts / 12) * 15)

    // Engagement data available (0-20)
    const withEngagement = posts.filter(p => p.reach > 0 || p.impressions > 0).length
    score += (withEngagement / posts.length) * 20

    // Recency bonus (0-15): recent posts are more valuable
    const now = Date.now()
    const recentPosts = posts.filter(
      p => now - p.scheduledDate.getTime() < 30 * 24 * 60 * 60 * 1000
    )
    score += Math.min(15, (recentPosts.length / Math.max(1, posts.length)) * 15)

    return Math.round(Math.min(100, score))
  }

  return {
    // State
    loading,
    error,
    postsWithEngagement,
    rawPosts,

    // Brand
    selectedBrandId,
    selectedBrand,

    // Analysis results
    dayPerformance,
    hourPerformance,
    contentTypePerformance,
    contentLengthPerformance,
    heatmapData,
    weeklySchedule,
    summary,

    // Actions
    fetchAndAnalyze,

    // Stores
    brandsStore,
    preferencesStore,
    engagementStore,
  }
}

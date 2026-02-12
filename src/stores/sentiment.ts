import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  Mention,
  MentionSource,
  SentimentLabel,
  SentimentBucket,
  VolumeSpike,
  SentimentAlert,
  SentimentSummary,
  PlatformBreakdown,
  SentimentTimeRange,
  SentimentConfig,
} from '@/types/sentiment'
import { sentimentService } from '@/services/sentimentService'

export const useSentimentStore = defineStore('sentiment', () => {
  // ─── State ──────────────────────────────────────────────────────────────────
  const loading = ref(false)
  const error = ref<string | null>(null)

  const mentions = ref<Mention[]>([])
  const mentionsTotal = ref(0)
  const mentionsPage = ref(1)

  const timeSeries = ref<SentimentBucket[]>([])
  const summary = ref<SentimentSummary | null>(null)
  const platformBreakdown = ref<PlatformBreakdown[]>([])
  const volumeSpikes = ref<VolumeSpike[]>([])
  const alerts = ref<SentimentAlert[]>([])
  const influentialMentions = ref<Mention[]>([])
  const config = ref<SentimentConfig | null>(null)

  // Filters
  const timeRange = ref<SentimentTimeRange>('24h')
  const sourceFilter = ref<MentionSource | 'all'>('all')
  const sentimentFilter = ref<SentimentLabel | 'all'>('all')

  // Real-time
  const isLive = ref(true)
  const lastUpdated = ref<string | null>(null)
  const refreshIntervalId = ref<ReturnType<typeof setInterval> | null>(null)

  // ─── Computed ───────────────────────────────────────────────────────────────
  const unacknowledgedAlerts = computed(() =>
    alerts.value.filter(a => !a.acknowledged)
  )

  const criticalAlerts = computed(() =>
    alerts.value.filter(a => a.severity === 'critical' && !a.acknowledged)
  )

  const sentimentTrend = computed(() => {
    if (!summary.value) return null
    return {
      direction: summary.value.trendDirection,
      percent: summary.value.trendPercent,
      isPositive: summary.value.trendDirection === 'up' && summary.value.averageScore > 0,
    }
  })

  // ─── Actions ────────────────────────────────────────────────────────────────

  async function fetchAll() {
    loading.value = true
    error.value = null

    try {
      const [summaryData, timeSeriesData, platformData, spikesData, alertsData, influentialData, mentionsData] =
        await Promise.all([
          sentimentService.getSummary(timeRange.value),
          sentimentService.getSentimentTimeSeries(timeRange.value),
          sentimentService.getPlatformBreakdown(timeRange.value),
          sentimentService.getVolumeSpikes(timeRange.value),
          sentimentService.getAlerts(),
          sentimentService.getInfluentialMentions({ timeRange: timeRange.value, limit: 5 }),
          sentimentService.getMentions({
            timeRange: timeRange.value,
            source: sourceFilter.value,
            sentiment: sentimentFilter.value,
            page: mentionsPage.value,
            limit: 20,
          }),
        ])

      summary.value = summaryData
      timeSeries.value = timeSeriesData
      platformBreakdown.value = platformData
      volumeSpikes.value = spikesData
      alerts.value = alertsData
      influentialMentions.value = influentialData
      mentions.value = mentionsData.mentions
      mentionsTotal.value = mentionsData.total
      lastUpdated.value = new Date().toISOString()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch sentiment data'
      console.error('[SentimentStore] fetchAll error:', err)
    } finally {
      loading.value = false
    }
  }

  async function fetchMentions() {
    try {
      const data = await sentimentService.getMentions({
        timeRange: timeRange.value,
        source: sourceFilter.value,
        sentiment: sentimentFilter.value,
        page: mentionsPage.value,
        limit: 20,
      })
      mentions.value = data.mentions
      mentionsTotal.value = data.total
    } catch (err) {
      console.error('[SentimentStore] fetchMentions error:', err)
    }
  }

  async function acknowledgeAlert(alertId: string) {
    try {
      await sentimentService.acknowledgeAlert(alertId)
      const alert = alerts.value.find(a => a.id === alertId)
      if (alert) {
        alert.acknowledged = true
      }
    } catch (err) {
      console.error('[SentimentStore] acknowledgeAlert error:', err)
    }
  }

  async function acknowledgeAllAlerts() {
    const unacked = alerts.value.filter(a => !a.acknowledged)
    for (const alert of unacked) {
      await acknowledgeAlert(alert.id)
    }
  }

  async function loadConfig() {
    try {
      config.value = await sentimentService.getConfig()
    } catch (err) {
      console.error('[SentimentStore] loadConfig error:', err)
    }
  }

  async function updateConfig(updates: Partial<SentimentConfig>) {
    try {
      await sentimentService.updateConfig(updates)
      if (config.value) {
        config.value = { ...config.value, ...updates }
      }
    } catch (err) {
      console.error('[SentimentStore] updateConfig error:', err)
    }
  }

  function setTimeRange(range: SentimentTimeRange) {
    timeRange.value = range
    mentionsPage.value = 1
  }

  function setSourceFilter(source: MentionSource | 'all') {
    sourceFilter.value = source
    mentionsPage.value = 1
  }

  function setSentimentFilter(sentiment: SentimentLabel | 'all') {
    sentimentFilter.value = sentiment
    mentionsPage.value = 1
  }

  function startAutoRefresh(intervalSeconds = 30) {
    stopAutoRefresh()
    isLive.value = true
    refreshIntervalId.value = setInterval(() => {
      if (isLive.value) {
        fetchAll()
      }
    }, intervalSeconds * 1000)
  }

  function stopAutoRefresh() {
    isLive.value = false
    if (refreshIntervalId.value) {
      clearInterval(refreshIntervalId.value)
      refreshIntervalId.value = null
    }
  }

  function toggleLive() {
    if (isLive.value) {
      stopAutoRefresh()
    } else {
      startAutoRefresh(config.value?.autoRefreshInterval ?? 30)
    }
  }

  return {
    // State
    loading,
    error,
    mentions,
    mentionsTotal,
    mentionsPage,
    timeSeries,
    summary,
    platformBreakdown,
    volumeSpikes,
    alerts,
    influentialMentions,
    config,
    timeRange,
    sourceFilter,
    sentimentFilter,
    isLive,
    lastUpdated,

    // Computed
    unacknowledgedAlerts,
    criticalAlerts,
    sentimentTrend,

    // Actions
    fetchAll,
    fetchMentions,
    acknowledgeAlert,
    acknowledgeAllAlerts,
    loadConfig,
    updateConfig,
    setTimeRange,
    setSourceFilter,
    setSentimentFilter,
    startAutoRefresh,
    stopAutoRefresh,
    toggleLive,
  }
})

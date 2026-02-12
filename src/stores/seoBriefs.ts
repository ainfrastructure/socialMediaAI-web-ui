import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { seoTrendsService } from '@/services/seoTrendsService'
import type {
  SEOBriefBatch,
  ContentBrief,
  TrendingKeyword,
  SEOBriefFilters,
} from '@/types/seoBriefs'
import { debugLog, errorLog } from '@/utils/debug'

export const useSEOBriefsStore = defineStore('seoBriefs', () => {
  // State
  const batches = ref<SEOBriefBatch[]>([])
  const currentBatch = ref<SEOBriefBatch | null>(null)
  const trendingKeywords = ref<TrendingKeyword[]>([])
  const totalBatches = ref(0)
  const loading = ref(false)
  const generating = ref(false)
  const error = ref<string | null>(null)

  // Schedule config
  const scheduleConfig = ref<{
    enabled: boolean
    dayOfWeek: number
    hour: number
    niche: string
    count: number
  }>({
    enabled: false,
    dayOfWeek: 1, // Monday
    hour: 6,
    niche: '',
    count: 5,
  })
  const scheduleLoading = ref(false)

  // Computed
  const hasBatches = computed(() => batches.value.length > 0)

  const latestBatch = computed(() => {
    if (batches.value.length === 0) return null
    return batches.value.reduce((latest, batch) =>
      new Date(batch.generatedAt) > new Date(latest.generatedAt) ? batch : latest
    )
  })

  const activeBriefs = computed(() => {
    if (!currentBatch.value) return []
    return currentBatch.value.briefs.filter(
      (b) => b.status !== 'archived'
    )
  })

  const briefsByStatus = computed(() => {
    if (!currentBatch.value) {
      return { draft: [], in_progress: [], completed: [], archived: [] }
    }
    return {
      draft: currentBatch.value.briefs.filter((b) => b.status === 'draft'),
      in_progress: currentBatch.value.briefs.filter((b) => b.status === 'in_progress'),
      completed: currentBatch.value.briefs.filter((b) => b.status === 'completed'),
      archived: currentBatch.value.briefs.filter((b) => b.status === 'archived'),
    }
  })

  // Actions
  async function fetchBatches(filters?: SEOBriefFilters) {
    loading.value = true
    error.value = null

    try {
      const result = await seoTrendsService.getBatches(filters)
      if (result.success && result.data) {
        batches.value = result.data.batches
        totalBatches.value = result.data.total
        debugLog('[SEOBriefs] Fetched batches:', result.data.batches.length)
      } else {
        error.value = result.error || 'Failed to fetch briefs'
        errorLog('[SEOBriefs] Fetch error:', result.error)
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Network error'
      errorLog('[SEOBriefs] Fetch exception:', err)
    } finally {
      loading.value = false
    }
  }

  async function fetchBatch(batchId: string) {
    loading.value = true
    error.value = null

    try {
      const result = await seoTrendsService.getBatch(batchId)
      if (result.success && result.data) {
        currentBatch.value = result.data.batch
        debugLog('[SEOBriefs] Fetched batch:', batchId)
      } else {
        error.value = result.error || 'Failed to fetch batch'
        errorLog('[SEOBriefs] Fetch batch error:', result.error)
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Network error'
      errorLog('[SEOBriefs] Fetch batch exception:', err)
    } finally {
      loading.value = false
    }
  }

  async function generateBriefs(niche: string, count = 5, language = 'en') {
    generating.value = true
    error.value = null

    try {
      const result = await seoTrendsService.generateBriefs({ niche, count, language })
      if (result.success && result.data) {
        const newBatch = result.data.batch
        batches.value.unshift(newBatch)
        currentBatch.value = newBatch
        totalBatches.value += 1
        debugLog('[SEOBriefs] Generated batch:', newBatch.id, 'cached:', result.data.cached)
        return newBatch
      } else {
        error.value = result.error || 'Failed to generate briefs'
        errorLog('[SEOBriefs] Generate error:', result.error)
        return null
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Network error'
      errorLog('[SEOBriefs] Generate exception:', err)
      return null
    } finally {
      generating.value = false
    }
  }

  async function updateBriefStatus(
    batchId: string,
    briefId: string,
    status: ContentBrief['status']
  ) {
    error.value = null

    try {
      const result = await seoTrendsService.updateBriefStatus(batchId, briefId, status)
      if (result.success && result.data) {
        // Update local state
        if (currentBatch.value?.id === batchId) {
          const idx = currentBatch.value.briefs.findIndex((b) => b.id === briefId)
          if (idx !== -1) {
            currentBatch.value.briefs[idx] = result.data.brief
          }
        }
        // Also update in batches list
        const batchIdx = batches.value.findIndex((b) => b.id === batchId)
        if (batchIdx !== -1) {
          const briefIdx = batches.value[batchIdx].briefs.findIndex((b) => b.id === briefId)
          if (briefIdx !== -1) {
            batches.value[batchIdx].briefs[briefIdx] = result.data.brief
          }
        }
        debugLog('[SEOBriefs] Updated brief status:', briefId, status)
      } else {
        error.value = result.error || 'Failed to update brief'
        errorLog('[SEOBriefs] Update error:', result.error)
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Network error'
      errorLog('[SEOBriefs] Update exception:', err)
    }
  }

  async function deleteBatch(batchId: string) {
    error.value = null

    try {
      const result = await seoTrendsService.deleteBatch(batchId)
      if (result.success) {
        batches.value = batches.value.filter((b) => b.id !== batchId)
        if (currentBatch.value?.id === batchId) {
          currentBatch.value = null
        }
        totalBatches.value = Math.max(0, totalBatches.value - 1)
        debugLog('[SEOBriefs] Deleted batch:', batchId)
      } else {
        error.value = result.error || 'Failed to delete batch'
        errorLog('[SEOBriefs] Delete error:', result.error)
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Network error'
      errorLog('[SEOBriefs] Delete exception:', err)
    }
  }

  async function fetchTrendingKeywords(niche: string) {
    error.value = null

    try {
      const result = await seoTrendsService.getTrendingKeywords(niche)
      if (result.success && result.data) {
        trendingKeywords.value = result.data.keywords
        debugLog('[SEOBriefs] Fetched trending keywords:', result.data.keywords.length)
      } else {
        error.value = result.error || 'Failed to fetch trending keywords'
        errorLog('[SEOBriefs] Trending keywords error:', result.error)
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Network error'
      errorLog('[SEOBriefs] Trending keywords exception:', err)
    }
  }

  async function fetchScheduleConfig() {
    scheduleLoading.value = true

    try {
      const result = await seoTrendsService.getScheduleConfig()
      if (result.success && result.data) {
        scheduleConfig.value = result.data
        debugLog('[SEOBriefs] Fetched schedule config')
      }
    } catch (err) {
      errorLog('[SEOBriefs] Schedule config exception:', err)
    } finally {
      scheduleLoading.value = false
    }
  }

  async function updateScheduleConfig(config: typeof scheduleConfig.value) {
    scheduleLoading.value = true
    error.value = null

    try {
      const result = await seoTrendsService.updateScheduleConfig(config)
      if (result.success) {
        scheduleConfig.value = config
        debugLog('[SEOBriefs] Updated schedule config')
      } else {
        error.value = result.error || 'Failed to update schedule'
        errorLog('[SEOBriefs] Schedule update error:', result.error)
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Network error'
      errorLog('[SEOBriefs] Schedule update exception:', err)
    } finally {
      scheduleLoading.value = false
    }
  }

  function clearError() {
    error.value = null
  }

  function setCurrentBatch(batch: SEOBriefBatch | null) {
    currentBatch.value = batch
  }

  return {
    // State
    batches,
    currentBatch,
    trendingKeywords,
    totalBatches,
    loading,
    generating,
    error,
    scheduleConfig,
    scheduleLoading,

    // Computed
    hasBatches,
    latestBatch,
    activeBriefs,
    briefsByStatus,

    // Actions
    fetchBatches,
    fetchBatch,
    generateBriefs,
    updateBriefStatus,
    deleteBatch,
    fetchTrendingKeywords,
    fetchScheduleConfig,
    updateScheduleConfig,
    clearError,
    setCurrentBatch,
  }
})

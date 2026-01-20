import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { EngagementMetrics } from '@/types/engagement'
import { debugLog } from '@/utils/debug'

export const useEngagementStore = defineStore('engagement', () => {
  // State: Map of scheduled_post_id -> engagement data by platform
  const engagementData = ref<Map<string, Record<string, EngagementMetrics>>>(new Map())

  // Loading states
  const loadingPosts = ref<Set<string>>(new Set())

  // Actions
  function updatePostEngagement(
    scheduledPostId: string,
    platform: string,
    metrics: EngagementMetrics
  ) {
    const current = engagementData.value.get(scheduledPostId) || {}
    current[platform] = metrics
    engagementData.value.set(scheduledPostId, current)

    debugLog('[EngagementStore] Updated:', scheduledPostId, platform, metrics)
  }

  function setPostEngagement(scheduledPostId: string, platforms: Record<string, EngagementMetrics>) {
    engagementData.value.set(scheduledPostId, platforms)
  }

  function getPostEngagement(scheduledPostId: string): Record<string, EngagementMetrics> | null {
    return engagementData.value.get(scheduledPostId) || null
  }

  function setLoading(scheduledPostId: string, loading: boolean) {
    if (loading) {
      loadingPosts.value.add(scheduledPostId)
    } else {
      loadingPosts.value.delete(scheduledPostId)
    }
  }

  function isLoading(scheduledPostId: string): boolean {
    return loadingPosts.value.has(scheduledPostId)
  }

  function clearEngagement() {
    engagementData.value.clear()
    loadingPosts.value.clear()
  }

  return {
    // State
    engagementData,
    loadingPosts,

    // Actions
    updatePostEngagement,
    setPostEngagement,
    getPostEngagement,
    setLoading,
    isLoading,
    clearEngagement,
  }
})

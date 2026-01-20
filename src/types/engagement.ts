export interface EngagementMetrics {
  likes: number
  comments: number
  shares: number
  reach: number
  impressions: number
  engagement_rate: number
  last_synced_at: string | null
  sync_status: 'pending' | 'syncing' | 'success' | 'error'
  sync_error?: string
}

export interface PlatformEngagement {
  platform: 'facebook' | 'instagram' | 'tiktok' | 'twitter' | 'linkedin'
  metrics: EngagementMetrics
}

export interface PostEngagement {
  scheduled_post_id: string
  platforms: Record<string, EngagementMetrics>
}

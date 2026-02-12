/** Sentiment classification */
export type SentimentLabel = 'positive' | 'neutral' | 'negative'

/** Source platform for mentions */
export type MentionSource = 'x' | 'reddit'

/** A single mention from X or Reddit */
export interface Mention {
  id: string
  source: MentionSource
  author: string
  authorFollowers: number
  text: string
  sentiment: SentimentLabel
  sentimentScore: number // -1.0 to 1.0
  url: string
  createdAt: string // ISO date
  engagementScore: number // likes + retweets + comments weighted
  subreddit?: string // Reddit only
  hashtags?: string[]
}

/** Aggregated sentiment data for a time bucket */
export interface SentimentBucket {
  timestamp: string // ISO date
  positive: number
  neutral: number
  negative: number
  total: number
  averageScore: number
}

/** Volume spike detection result */
export interface VolumeSpike {
  id: string
  timestamp: string
  source: MentionSource
  volumeIncrease: number // percentage above baseline
  mentionCount: number
  topMention: Mention
  sentiment: SentimentLabel
  severity: 'info' | 'warning' | 'critical'
}

/** Alert configuration for negative sentiment */
export interface SentimentAlert {
  id: string
  type: 'negative_threshold' | 'volume_spike' | 'influential_negative'
  message: string
  timestamp: string
  severity: 'info' | 'warning' | 'critical'
  acknowledged: boolean
  relatedMentions: Mention[]
}

/** Overall sentiment summary stats */
export interface SentimentSummary {
  totalMentions: number
  positivePercent: number
  neutralPercent: number
  negativePercent: number
  averageScore: number
  mentionsToday: number
  trendDirection: 'up' | 'down' | 'stable'
  trendPercent: number
}

/** Platform breakdown */
export interface PlatformBreakdown {
  source: MentionSource
  totalMentions: number
  positivePercent: number
  neutralPercent: number
  negativePercent: number
  topHashtags: string[]
}

/** Time range filter options */
export type SentimentTimeRange = '1h' | '6h' | '24h' | '7d' | '30d'

/** Sentiment dashboard configuration */
export interface SentimentConfig {
  brandKeywords: string[]
  negativeThreshold: number // percentage threshold for alerts (e.g., 30)
  spikeThreshold: number // percentage above baseline to trigger spike alert
  alertChannels: ('dashboard' | 'email' | 'slack')[]
  autoRefreshInterval: number // seconds
}

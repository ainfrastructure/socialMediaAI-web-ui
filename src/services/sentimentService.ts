/**
 * Sentiment Service
 *
 * Handles API calls for sentiment data. Uses mock data generator
 * for demo purposes. In production, this would connect to the
 * backend sentiment analysis pipeline.
 */
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

// ─── Mock Data Generation ───────────────────────────────────────────────────────

const MOCK_AUTHORS_X = [
  { name: '@techcritic', followers: 45200 },
  { name: '@startupfan', followers: 12800 },
  { name: '@devjane', followers: 8300 },
  { name: '@marketingpro', followers: 67500 },
  { name: '@digitaltrends', followers: 125000 },
  { name: '@saastoolbox', followers: 34100 },
  { name: '@growthhacker', followers: 22600 },
  { name: '@aireviewer', followers: 91200 },
  { name: '@productdev_io', followers: 18700 },
  { name: '@smm_daily', followers: 55000 },
]

const MOCK_AUTHORS_REDDIT = [
  { name: 'u/tech_enthusiast', followers: 5200 },
  { name: 'u/startup_watcher', followers: 3100 },
  { name: 'u/socialmedianerd', followers: 7800 },
  { name: 'u/marketing_guru_99', followers: 2400 },
  { name: 'u/content_creator_hub', followers: 1800 },
  { name: 'u/saas_daily', followers: 9500 },
  { name: 'u/growth_mindset_22', followers: 4100 },
  { name: 'u/honest_reviewer', followers: 6700 },
]

const SUBREDDITS = [
  'r/socialmedia',
  'r/marketing',
  'r/startups',
  'r/SaaS',
  'r/ContentCreation',
  'r/Entrepreneur',
  'r/smallbusiness',
]

const POSITIVE_TEXTS = [
  'Just tried this social media tool and it\'s amazing! The AI-generated content is spot on 🔥',
  'Best investment for our marketing team this year. Content quality is through the roof.',
  'The scheduling feature saves us hours every week. Highly recommend!',
  'Incredible platform! Our engagement metrics doubled since we started using it.',
  'Love the new analytics dashboard. Finally, actionable insights!',
  'This tool has completely transformed our social media workflow. 10/10',
  'The AI understands our brand voice perfectly. Game changer for content creation.',
  'Just onboarded our entire team. The collaboration features are excellent.',
  'ROI is insane. We\'re seeing 3x engagement compared to our old process.',
  'The multi-platform publishing is seamless. No more manual posting!',
]

const NEUTRAL_TEXTS = [
  'Interesting new social media management tool. Will test it out this week.',
  'Does anyone have experience with this platform? Looking for reviews.',
  'Comparing social media tools for our team. This one looks decent.',
  'New update released. Several bug fixes and minor UI improvements.',
  'The free tier is pretty limited but the concept is solid.',
  'Anyone know the pricing for enterprise plans?',
  'Seems like a standard social media scheduler with some AI features.',
  'The onboarding process takes about 15 minutes. Nothing special.',
]

const NEGATIVE_TEXTS = [
  'The AI-generated content feels too generic. Needs more customization options.',
  'Having issues with the Twitter integration. Posts not going through.',
  'Price increase with the latest plan changes is disappointing.',
  'The analytics are surface-level. Need deeper insights for enterprise use.',
  'Support response time is too slow. 48+ hours for a critical issue.',
  'Instagram scheduling has been buggy since the last update.',
  'The content suggestions don\'t match our industry at all.',
  'Free plan is basically useless. Feels like a bait-and-switch.',
]

const HASHTAGS = [
  '#socialmedia', '#marketing', '#contentcreation', '#AI',
  '#SaaS', '#digitalmarketing', '#automation', '#SMM',
  '#growthhacking', '#startups', '#martech', '#brand',
]

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generateMockMention(index: number, hoursAgo: number): Mention {
  const source: MentionSource = Math.random() > 0.45 ? 'x' : 'reddit'
  const sentimentRoll = Math.random()
  let sentiment: SentimentLabel
  let sentimentScore: number
  let text: string

  if (sentimentRoll < 0.45) {
    sentiment = 'positive'
    sentimentScore = 0.3 + Math.random() * 0.7
    text = randomChoice(POSITIVE_TEXTS)
  } else if (sentimentRoll < 0.75) {
    sentiment = 'neutral'
    sentimentScore = -0.2 + Math.random() * 0.4
    text = randomChoice(NEUTRAL_TEXTS)
  } else {
    sentiment = 'negative'
    sentimentScore = -0.3 - Math.random() * 0.7
    text = randomChoice(NEGATIVE_TEXTS)
  }

  const author = source === 'x'
    ? randomChoice(MOCK_AUTHORS_X)
    : randomChoice(MOCK_AUTHORS_REDDIT)

  const createdAt = new Date(Date.now() - hoursAgo * 3600000 - randomInt(0, 3600000))

  return {
    id: `mention-${index}-${Date.now()}`,
    source,
    author: author.name,
    authorFollowers: author.followers,
    text,
    sentiment,
    sentimentScore: parseFloat(sentimentScore.toFixed(3)),
    url: source === 'x'
      ? `https://x.com/${author.name.slice(1)}/status/${randomInt(1000000000, 9999999999)}`
      : `https://reddit.com/${randomChoice(SUBREDDITS)}/comments/${randomInt(100000, 999999)}`,
    createdAt: createdAt.toISOString(),
    engagementScore: randomInt(1, source === 'x' ? 500 : 200),
    subreddit: source === 'reddit' ? randomChoice(SUBREDDITS) : undefined,
    hashtags: source === 'x'
      ? Array.from({ length: randomInt(0, 3) }, () => randomChoice(HASHTAGS))
      : undefined,
  }
}

function generateTimeBuckets(timeRange: SentimentTimeRange): SentimentBucket[] {
  const buckets: SentimentBucket[] = []
  let totalHours: number
  let intervalHours: number

  switch (timeRange) {
    case '1h': totalHours = 1; intervalHours = 1 / 12; break
    case '6h': totalHours = 6; intervalHours = 0.5; break
    case '24h': totalHours = 24; intervalHours = 1; break
    case '7d': totalHours = 168; intervalHours = 6; break
    case '30d': totalHours = 720; intervalHours = 24; break
    default: totalHours = 24; intervalHours = 1
  }

  const steps = Math.floor(totalHours / intervalHours)
  for (let i = steps; i >= 0; i--) {
    const timestamp = new Date(Date.now() - i * intervalHours * 3600000)
    const positive = randomInt(2, 25)
    const neutral = randomInt(1, 15)
    const negative = randomInt(0, 12)
    const total = positive + neutral + negative

    buckets.push({
      timestamp: timestamp.toISOString(),
      positive,
      neutral,
      negative,
      total,
      averageScore: parseFloat(((positive - negative) / total * 0.8).toFixed(3)),
    })
  }

  return buckets
}

function generateSpikes(): VolumeSpike[] {
  const spikes: VolumeSpike[] = []
  const spikeCount = randomInt(1, 4)

  for (let i = 0; i < spikeCount; i++) {
    const hoursAgo = randomInt(1, 72)
    const source: MentionSource = Math.random() > 0.5 ? 'x' : 'reddit'
    const volumeIncrease = randomInt(50, 400)
    const severity = volumeIncrease > 200 ? 'critical' : volumeIncrease > 100 ? 'warning' : 'info'
    const sentiment = volumeIncrease > 200 ? 'negative' : Math.random() > 0.5 ? 'positive' : 'neutral'

    spikes.push({
      id: `spike-${i}-${Date.now()}`,
      timestamp: new Date(Date.now() - hoursAgo * 3600000).toISOString(),
      source,
      volumeIncrease,
      mentionCount: randomInt(20, 150),
      topMention: generateMockMention(1000 + i, hoursAgo),
      sentiment: sentiment as SentimentLabel,
      severity,
    })
  }

  return spikes.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

function generateAlerts(): SentimentAlert[] {
  const alerts: SentimentAlert[] = [
    {
      id: 'alert-1',
      type: 'negative_threshold',
      message: 'Negative sentiment exceeded 30% threshold in the last hour',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      severity: 'warning',
      acknowledged: false,
      relatedMentions: [generateMockMention(2000, 0.5), generateMockMention(2001, 0.8)],
    },
    {
      id: 'alert-2',
      type: 'volume_spike',
      message: 'Unusual mention volume detected on Reddit (+250% above baseline)',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      severity: 'critical',
      acknowledged: false,
      relatedMentions: [generateMockMention(2002, 2)],
    },
    {
      id: 'alert-3',
      type: 'influential_negative',
      message: 'Negative mention from high-follower account @digitaltrends (125K followers)',
      timestamp: new Date(Date.now() - 14400000).toISOString(),
      severity: 'warning',
      acknowledged: true,
      relatedMentions: [generateMockMention(2003, 4)],
    },
  ]

  return alerts
}

// ─── Service Class ──────────────────────────────────────────────────────────────

class SentimentService {
  /**
   * Fetch live mentions feed
   */
  async getMentions(params: {
    timeRange: SentimentTimeRange
    source?: MentionSource | 'all'
    sentiment?: SentimentLabel | 'all'
    page?: number
    limit?: number
  }): Promise<{ mentions: Mention[]; total: number }> {
    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 400))

    const totalHours = { '1h': 1, '6h': 6, '24h': 24, '7d': 168, '30d': 720 }[params.timeRange] ?? 24
    const totalMentions = Math.floor(totalHours * (3 + Math.random() * 5))
    const limit = params.limit ?? 20
    const page = params.page ?? 1

    let mentions: Mention[] = []
    for (let i = 0; i < totalMentions; i++) {
      mentions.push(generateMockMention(i, Math.random() * totalHours))
    }

    // Apply filters
    if (params.source && params.source !== 'all') {
      mentions = mentions.filter(m => m.source === params.source)
    }
    if (params.sentiment && params.sentiment !== 'all') {
      mentions = mentions.filter(m => m.sentiment === params.sentiment)
    }

    // Sort by recency
    mentions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    const start = (page - 1) * limit
    return {
      mentions: mentions.slice(start, start + limit),
      total: mentions.length,
    }
  }

  /**
   * Fetch sentiment time series data
   */
  async getSentimentTimeSeries(timeRange: SentimentTimeRange): Promise<SentimentBucket[]> {
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300))
    return generateTimeBuckets(timeRange)
  }

  /**
   * Fetch sentiment summary stats
   */
  async getSummary(_timeRange: SentimentTimeRange): Promise<SentimentSummary> {
    await new Promise(resolve => setTimeout(resolve, 150 + Math.random() * 200))

    const positivePercent = 35 + randomInt(0, 25)
    const negativePercent = 10 + randomInt(0, 20)
    const neutralPercent = 100 - positivePercent - negativePercent

    return {
      totalMentions: randomInt(50, 500),
      positivePercent,
      neutralPercent,
      negativePercent,
      averageScore: parseFloat(((positivePercent - negativePercent) / 100).toFixed(3)),
      mentionsToday: randomInt(10, 80),
      trendDirection: Math.random() > 0.5 ? 'up' : Math.random() > 0.3 ? 'stable' : 'down',
      trendPercent: randomInt(1, 25),
    }
  }

  /**
   * Fetch platform breakdown
   */
  async getPlatformBreakdown(_timeRange: SentimentTimeRange): Promise<PlatformBreakdown[]> {
    await new Promise(resolve => setTimeout(resolve, 150 + Math.random() * 200))

    return [
      {
        source: 'x',
        totalMentions: randomInt(30, 300),
        positivePercent: 40 + randomInt(0, 20),
        neutralPercent: 25 + randomInt(0, 15),
        negativePercent: 15 + randomInt(0, 15),
        topHashtags: ['#socialmedia', '#AI', '#marketing', '#SaaS'],
      },
      {
        source: 'reddit',
        totalMentions: randomInt(20, 200),
        positivePercent: 35 + randomInt(0, 20),
        neutralPercent: 30 + randomInt(0, 15),
        negativePercent: 15 + randomInt(0, 20),
        topHashtags: ['r/socialmedia', 'r/marketing', 'r/SaaS'],
      },
    ]
  }

  /**
   * Fetch volume spikes
   */
  async getVolumeSpikes(_timeRange: SentimentTimeRange): Promise<VolumeSpike[]> {
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 200))
    return generateSpikes()
  }

  /**
   * Fetch active alerts
   */
  async getAlerts(): Promise<SentimentAlert[]> {
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 150))
    return generateAlerts()
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(_alertId: string): Promise<{ success: boolean }> {
    await new Promise(resolve => setTimeout(resolve, 100))
    return { success: true }
  }

  /**
   * Fetch most influential mentions
   */
  async getInfluentialMentions(params: {
    timeRange: SentimentTimeRange
    limit?: number
  }): Promise<Mention[]> {
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300))

    const totalHours = { '1h': 1, '6h': 6, '24h': 24, '7d': 168, '30d': 720 }[params.timeRange] ?? 24
    const count = params.limit ?? 5
    const mentions: Mention[] = []

    for (let i = 0; i < count * 3; i++) {
      mentions.push(generateMockMention(3000 + i, Math.random() * totalHours))
    }

    // Sort by engagement and follower count
    mentions.sort((a, b) => (b.engagementScore + b.authorFollowers) - (a.engagementScore + a.authorFollowers))

    return mentions.slice(0, count)
  }

  /**
   * Get or update sentiment configuration
   */
  async getConfig(): Promise<SentimentConfig> {
    await new Promise(resolve => setTimeout(resolve, 100))
    return {
      brandKeywords: ['SocialChef', 'socialchef', '@socialchef_ai'],
      negativeThreshold: 30,
      spikeThreshold: 150,
      alertChannels: ['dashboard'],
      autoRefreshInterval: 30,
    }
  }

  async updateConfig(_config: Partial<SentimentConfig>): Promise<{ success: boolean }> {
    await new Promise(resolve => setTimeout(resolve, 200))
    return { success: true }
  }
}

export const sentimentService = new SentimentService()

/**
 * Instagram Reels Caption Types
 *
 * Type definitions for the 30-day Reels caption content system.
 * Follows the 4-Pillar Framework with Hook-Value-CTA structure.
 */

// Content pillar categories with recommended distribution
export type ContentPillar =
  | 'educational'    // 40% — AI insights, social media tips, industry knowledge
  | 'behind-the-scenes' // 25% — Team, process, platform development
  | 'community'      // 20% — Success stories, customer spotlights
  | 'promotional'    // 15% — Features, updates, calls-to-action

// Hashtag tiers for the 3-tier strategy
export type HashtagTier = 'broad' | 'targeted' | 'niche'

export interface HashtagSet {
  /** Tier 1: Broad reach, 500K+ posts (2-3 tags) */
  broad: string[]
  /** Tier 2: Targeted, 50K-500K posts (5-8 tags) */
  targeted: string[]
  /** Tier 3: Niche, under 50K posts (4-7 tags) */
  niche: string[]
}

// Call-to-action types
export type CTAType =
  | 'engagement'     // "Double tap if...", "Comment below..."
  | 'share'          // "Share with someone who...", "Tag a friend..."
  | 'save'           // "Save this for later", "Bookmark this..."
  | 'follow'         // "Follow for more...", "Turn on notifications..."
  | 'link'           // "Link in bio", "Check out..."
  | 'ugc'            // "Show us your...", "DM us your..."

export interface ReelCaption {
  /** Day number (1-30) */
  day: number
  /** Content pillar this caption belongs to */
  pillar: ContentPillar
  /** Caption hook — first 3-7 words that appear before "...more" */
  hook: string
  /** Full caption body with value content */
  body: string
  /** Call-to-action text */
  cta: string
  /** CTA type for categorization */
  ctaType: CTAType
  /** Hashtag set using 3-tier strategy */
  hashtags: HashtagSet
  /** Suggested Reel topic/concept */
  reelConcept: string
  /** Optimal posting day of week */
  scheduledDayOfWeek: DayOfWeek
  /** Optimal posting time (HH:mm in 24h format, audience local time) */
  scheduledTime: string
  /** Optional seasonal/trending hook */
  trendHook?: string
}

export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'

// Scheduling configuration
export interface SchedulingConfig {
  /** Target timezone for the audience (IANA format) */
  timezone: string
  /** Optimal posting windows per day of week */
  optimalWindows: Record<DayOfWeek, PostingWindow[]>
  /** Buffer queue slot configuration */
  bufferSlots: BufferSlotConfig
}

export interface PostingWindow {
  /** Start time in HH:mm format */
  start: string
  /** End time in HH:mm format */
  end: string
  /** Engagement multiplier (1.0 = baseline) */
  engagementMultiplier: number
}

export interface BufferSlotConfig {
  /** Number of posts per day */
  postsPerDay: number
  /** Preferred time slots */
  timeSlots: string[]
  /** Whether to auto-optimize based on audience activity */
  autoOptimize: boolean
}

// Brand voice configuration specific to captions
export interface CaptionBrandVoice {
  /** Brand tone (e.g., "authoritative yet approachable") */
  tone: string
  /** Personality traits */
  traits: string[]
  /** Words/phrases to use */
  vocabularyInclude: string[]
  /** Words/phrases to avoid */
  vocabularyExclude: string[]
  /** Emoji usage level */
  emojiUsage: 'none' | 'minimal' | 'moderate' | 'heavy'
  /** Preferred emoji set */
  preferredEmojis: string[]
  /** Caption length preference */
  lengthPreference: 'short' | 'medium' | 'long'
}

// Content calendar entry (combines caption + scheduling)
export interface ContentCalendarEntry {
  /** The reel caption data */
  caption: ReelCaption
  /** Scheduled date (ISO 8601) */
  scheduledDate: string
  /** Scheduled time in target timezone */
  scheduledTime: string
  /** Status of this entry */
  status: 'draft' | 'scheduled' | 'published' | 'skipped'
  /** Buffer post ID (if scheduled via Buffer) */
  bufferPostId?: string
}

// Full 30-day content plan
export interface ReelsContentPlan {
  /** Plan metadata */
  name: string
  /** Date range */
  startDate: string
  endDate: string
  /** Brand voice configuration */
  brandVoice: CaptionBrandVoice
  /** Scheduling configuration */
  scheduling: SchedulingConfig
  /** Content pillar distribution (should sum to 1.0) */
  pillarDistribution: Record<ContentPillar, number>
  /** The 30 captions */
  captions: ReelCaption[]
  /** Calendar entries with scheduling */
  calendar: ContentCalendarEntry[]
}

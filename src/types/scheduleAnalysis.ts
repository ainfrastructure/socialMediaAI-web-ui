/**
 * Types for the 90-day posting schedule analysis feature.
 * Provides statistical analysis of post performance by time, day, content type, and length.
 */

export interface TimeSlotPerformance {
  /** Hour of day (0-23) */
  hour: number
  /** Day of week (0=Sunday, 6=Saturday) */
  dayOfWeek: number
  /** Average engagement rate for this slot */
  avgEngagementRate: number
  /** Average impressions for this slot */
  avgImpressions: number
  /** Average reach for this slot */
  avgReach: number
  /** Average likes for this slot */
  avgLikes: number
  /** Number of posts in this sample */
  sampleSize: number
  /** 95% confidence interval for engagement rate [lower, upper] */
  confidenceInterval: [number, number]
  /** Statistical significance level (0-1) */
  significance: number
}

export interface DayPerformance {
  /** Day of week (0=Sunday, 6=Saturday) */
  dayOfWeek: number
  /** Day label (e.g. "Monday") */
  dayLabel: string
  /** Average engagement rate */
  avgEngagementRate: number
  /** Average impressions */
  avgImpressions: number
  /** Total posts analyzed */
  postCount: number
  /** 95% confidence interval [lower, upper] */
  confidenceInterval: [number, number]
}

export interface HourPerformance {
  /** Hour of day (0-23) */
  hour: number
  /** Display label (e.g. "9 AM") */
  hourLabel: string
  /** Average engagement rate */
  avgEngagementRate: number
  /** Average impressions */
  avgImpressions: number
  /** Total posts analyzed */
  postCount: number
  /** 95% confidence interval [lower, upper] */
  confidenceInterval: [number, number]
}

export interface ContentTypePerformance {
  /** Content type identifier */
  contentType: string
  /** Display label */
  label: string
  /** Average engagement rate */
  avgEngagementRate: number
  /** Average impressions */
  avgImpressions: number
  /** Total posts analyzed */
  postCount: number
  /** 95% confidence interval [lower, upper] */
  confidenceInterval: [number, number]
}

export interface ContentLengthPerformance {
  /** Length bucket label (e.g. "Short (0-100)") */
  bucket: string
  /** Min character count */
  minLength: number
  /** Max character count */
  maxLength: number
  /** Average engagement rate */
  avgEngagementRate: number
  /** Average impressions */
  avgImpressions: number
  /** Total posts analyzed */
  postCount: number
  /** 95% confidence interval [lower, upper] */
  confidenceInterval: [number, number]
}

export interface ScheduleSlot {
  /** Day of week (0=Sunday, 6=Saturday) */
  dayOfWeek: number
  /** Day label */
  dayLabel: string
  /** Recommended hour (0-23) */
  hour: number
  /** Display time (e.g. "10:00 AM") */
  timeLabel: string
  /** Expected engagement rate */
  expectedEngagementRate: number
  /** 95% confidence interval [lower, upper] */
  confidenceInterval: [number, number]
  /** Confidence level: 'high' | 'medium' | 'low' */
  confidenceLevel: 'high' | 'medium' | 'low'
  /** Recommended content type */
  recommendedContentType: string | null
  /** Recommended post length range */
  recommendedLength: { min: number; max: number } | null
  /** Number of posts that informed this recommendation */
  basedOnPosts: number
}

export interface WeeklySchedule {
  /** Generated timestamp */
  generatedAt: string
  /** Analysis period in days */
  analysisPeriod: number
  /** Total posts analyzed */
  totalPostsAnalyzed: number
  /** Recommended weekly schedule slots */
  slots: ScheduleSlot[]
  /** Overall data quality score (0-100) */
  dataQualityScore: number
  /** Warnings about data quality */
  warnings: string[]
}

export interface HeatmapCell {
  /** Day index (0-6) */
  day: number
  /** Hour index (0-23) */
  hour: number
  /** Normalized value (0-1) for color intensity */
  value: number
  /** Raw engagement rate */
  engagementRate: number
  /** Number of posts */
  postCount: number
}

export interface AnalysisSummary {
  totalPostsAnalyzed: number
  dateRange: { start: string; end: string }
  bestDay: DayPerformance | null
  bestHour: HourPerformance | null
  bestContentType: ContentTypePerformance | null
  optimalLength: ContentLengthPerformance | null
  avgEngagementRate: number
  avgImpressions: number
  dataQualityScore: number
}

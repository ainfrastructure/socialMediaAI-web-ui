export interface NotificationPreferences {
  // Post Events
  notify_post_published: boolean
  notify_post_failed: boolean
  notify_post_scheduled: boolean

  // Digest Reports
  digest_frequency: 'never' | 'daily' | 'weekly' | 'monthly'
  digest_day_of_week: number // 0-6, 0 = Sunday
  digest_time_utc: string // HH:mm:ss format

  // Account & Billing
  notify_subscription_changes: boolean
  notify_payment_issues: boolean
  notify_credits_low: boolean
  credits_low_threshold: number

  // Product Updates
  notify_new_features: boolean
  notify_announcements: boolean

  // Metadata
  created_at?: string
  updated_at?: string
}

export interface DigestTimeOption {
  value: string
  label: string
}

export interface DigestDayOption {
  value: number
  label: string
}

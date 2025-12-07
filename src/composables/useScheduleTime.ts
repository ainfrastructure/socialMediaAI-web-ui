import { computed } from 'vue'

/**
 * Composable for schedule time utilities
 * Consolidates time/timezone constants and formatting functions used across scheduling components
 */
export function useScheduleTime() {
  // Generate hours 1-12 for 12-hour format
  const hours12 = computed(() =>
    Array.from({ length: 12 }, (_, i) => ({
      value: String(i + 1).padStart(2, '0'),
      label: String(i + 1).padStart(2, '0')
    }))
  )

  // Generate hours 00-23 for 24-hour format
  const hours24 = computed(() =>
    Array.from({ length: 24 }, (_, i) => ({
      value: String(i).padStart(2, '0'),
      label: String(i).padStart(2, '0')
    }))
  )

  // Generate minutes 00-59
  const minutes = computed(() =>
    Array.from({ length: 60 }, (_, i) => ({
      value: String(i).padStart(2, '0'),
      label: String(i).padStart(2, '0')
    }))
  )

  // Generate minutes in 15-minute increments (00, 15, 30, 45)
  const minutes15 = computed(() =>
    [0, 15, 30, 45].map(i => ({
      value: String(i).padStart(2, '0'),
      label: String(i).padStart(2, '0')
    }))
  )

  // Common timezones with labels
  const timezoneOptions = [
    { value: 'Europe/Oslo', label: 'Oslo (CET/CEST)' },
    { value: 'Europe/Stockholm', label: 'Stockholm (CET/CEST)' },
    { value: 'Europe/Copenhagen', label: 'Copenhagen (CET/CEST)' },
    { value: 'Europe/London', label: 'London (GMT/BST)' },
    { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
    { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },
    { value: 'Europe/Amsterdam', label: 'Amsterdam (CET/CEST)' },
    { value: 'Europe/Rome', label: 'Rome (CET/CEST)' },
    { value: 'Europe/Madrid', label: 'Madrid (CET/CEST)' },
    { value: 'America/New_York', label: 'New York (EST/EDT)' },
    { value: 'America/Chicago', label: 'Chicago (CST/CDT)' },
    { value: 'America/Denver', label: 'Denver (MST/MDT)' },
    { value: 'America/Los_Angeles', label: 'Los Angeles (PST/PDT)' },
    { value: 'America/Phoenix', label: 'Phoenix (MST)' },
    { value: 'America/Anchorage', label: 'Anchorage (AKST/AKDT)' },
    { value: 'Pacific/Honolulu', label: 'Honolulu (HST)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
    { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
    { value: 'Asia/Dubai', label: 'Dubai (GST)' },
    { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
    { value: 'Pacific/Auckland', label: 'Auckland (NZST/NZDT)' },
    { value: 'UTC', label: 'UTC' },
  ]

  // Simple timezone list (just values, for backward compatibility)
  const timezones = timezoneOptions.map(tz => tz.value)

  /**
   * Format time from 24-hour to 12-hour format
   * @param hour - Hour in 24-hour format (0-23)
   * @param minute - Minute (0-59)
   * @returns Formatted time string like "2:30 PM"
   */
  const formatTime12 = (hour: number, minute: number): string => {
    const period = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    return `${hour12}:${String(minute).padStart(2, '0')} ${period}`
  }

  /**
   * Format time in 24-hour format
   * @param hour - Hour (0-23)
   * @param minute - Minute (0-59)
   * @returns Formatted time string like "14:30"
   */
  const formatTime24 = (hour: number, minute: number): string => {
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
  }

  /**
   * Parse time string to components
   * @param timeString - Time string like "14:30:00" or "2:30 PM"
   * @returns Object with hour (24-hour), minute, and period
   */
  const parseTime = (timeString: string): { hour: number; minute: number; period: 'AM' | 'PM' } | null => {
    if (!timeString) return null

    // Try 24-hour format first (14:30:00 or 14:30)
    const match24 = timeString.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/)
    if (match24) {
      const hour = parseInt(match24[1])
      const minute = parseInt(match24[2])
      const period = hour >= 12 ? 'PM' : 'AM'
      return { hour, minute, period }
    }

    // Try 12-hour format (2:30 PM)
    const match12 = timeString.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
    if (match12) {
      let hour = parseInt(match12[1])
      const minute = parseInt(match12[2])
      const period = match12[3].toUpperCase() as 'AM' | 'PM'

      // Convert to 24-hour
      if (period === 'PM' && hour !== 12) hour += 12
      if (period === 'AM' && hour === 12) hour = 0

      return { hour, minute, period }
    }

    return null
  }

  /**
   * Convert 12-hour format to 24-hour format
   * @param hour12 - Hour in 12-hour format (1-12)
   * @param period - AM or PM
   * @returns Hour in 24-hour format (0-23)
   */
  const to24Hour = (hour12: number, period: 'AM' | 'PM'): number => {
    if (period === 'AM') {
      return hour12 === 12 ? 0 : hour12
    } else {
      return hour12 === 12 ? 12 : hour12 + 12
    }
  }

  /**
   * Convert 24-hour format to 12-hour format
   * @param hour24 - Hour in 24-hour format (0-23)
   * @returns Object with hour12 (1-12) and period (AM/PM)
   */
  const to12Hour = (hour24: number): { hour12: number; period: 'AM' | 'PM' } => {
    const period = hour24 >= 12 ? 'PM' : 'AM'
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24
    return { hour12, period }
  }

  /**
   * Get time remaining until a scheduled date/time
   * @param scheduledDate - Date string (YYYY-MM-DD)
   * @param scheduledTime - Time string (HH:MM:SS or HH:MM)
   * @param timezone - Optional timezone
   * @returns Human-readable time remaining string
   */
  const getTimeRemaining = (scheduledDate: string, scheduledTime: string, timezone?: string): string => {
    if (!scheduledDate || !scheduledTime) return ''

    try {
      const dateTimeString = `${scheduledDate}T${scheduledTime}`
      const scheduledDateTime = new Date(dateTimeString)
      const now = new Date()
      const diff = scheduledDateTime.getTime() - now.getTime()

      if (diff <= 0) return 'Past due'

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

      if (days > 0) {
        return `${days}d ${hours}h remaining`
      } else if (hours > 0) {
        return `${hours}h ${minutes}m remaining`
      } else {
        return `${minutes}m remaining`
      }
    } catch {
      return ''
    }
  }

  /**
   * Get default timezone based on browser
   * @returns Timezone string
   */
  const getDefaultTimezone = (): string => {
    try {
      const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone
      // Check if browser timezone is in our list
      if (timezones.includes(browserTz)) {
        return browserTz
      }
    } catch {
      // Fallback if Intl is not supported
    }
    return 'Europe/Oslo' // Default fallback
  }

  return {
    // Time options
    hours12,
    hours24,
    minutes,
    minutes15,

    // Timezone options
    timezoneOptions,
    timezones,

    // Formatting functions
    formatTime12,
    formatTime24,
    parseTime,

    // Conversion functions
    to24Hour,
    to12Hour,

    // Utility functions
    getTimeRemaining,
    getDefaultTimezone,
  }
}

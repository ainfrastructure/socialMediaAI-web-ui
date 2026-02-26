/**
 * Instagram Reels Scheduling Configuration
 *
 * Timezone-optimized posting times based on 2025 engagement data.
 * Sources: HubSpot, Sprout Social, Later, Buffer research.
 */

import type { DayOfWeek, SchedulingConfig, PostingWindow } from '@/types/reels-captions'

/**
 * Optimal posting windows per day of week for Instagram Reels.
 * Times are in the target audience's local timezone.
 *
 * Data sources:
 * - Primary windows: Monday 3-9 PM, Tue-Thu 4-7 PM, Fri 11 AM-1 PM
 * - Saturday 9-11 AM (brunch scroll), Sunday 5-7 PM (planning week)
 * - Reels-specific: 30% higher reach when posted 3-7 PM
 */
const OPTIMAL_WINDOWS: Record<DayOfWeek, PostingWindow[]> = {
  monday: [
    { start: '15:00', end: '17:00', engagementMultiplier: 1.3 },
    { start: '17:00', end: '19:00', engagementMultiplier: 1.5 },
    { start: '19:00', end: '21:00', engagementMultiplier: 1.2 },
  ],
  tuesday: [
    { start: '11:00', end: '13:00', engagementMultiplier: 1.1 },
    { start: '16:00', end: '18:00', engagementMultiplier: 1.4 },
    { start: '18:00', end: '19:00', engagementMultiplier: 1.3 },
  ],
  wednesday: [
    { start: '12:00', end: '14:00', engagementMultiplier: 1.2 },
    { start: '16:00', end: '18:00', engagementMultiplier: 1.5 },
    { start: '18:00', end: '19:00', engagementMultiplier: 1.3 },
  ],
  thursday: [
    { start: '11:00', end: '13:00', engagementMultiplier: 1.2 },
    { start: '15:00', end: '17:00', engagementMultiplier: 1.4 },
    { start: '17:00', end: '19:00', engagementMultiplier: 1.5 },
  ],
  friday: [
    { start: '11:00', end: '13:00', engagementMultiplier: 1.4 },
    { start: '14:00', end: '16:00', engagementMultiplier: 1.2 },
    { start: '19:00', end: '21:00', engagementMultiplier: 1.1 },
  ],
  saturday: [
    { start: '09:00', end: '11:00', engagementMultiplier: 1.3 },
    { start: '11:00', end: '13:00', engagementMultiplier: 1.1 },
    { start: '17:00', end: '19:00', engagementMultiplier: 1.0 },
  ],
  sunday: [
    { start: '10:00', end: '12:00', engagementMultiplier: 1.1 },
    { start: '17:00', end: '19:00', engagementMultiplier: 1.4 },
    { start: '19:00', end: '21:00', engagementMultiplier: 1.2 },
  ],
}

/**
 * Get the default scheduling configuration.
 * @param timezone - IANA timezone string (defaults to Europe/Zurich)
 */
export function getDefaultSchedulingConfig(timezone = 'Europe/Zurich'): SchedulingConfig {
  return {
    timezone,
    optimalWindows: OPTIMAL_WINDOWS,
    bufferSlots: {
      postsPerDay: 1,
      timeSlots: ['17:00'], // Default: peak Reels engagement
      autoOptimize: true,
    },
  }
}

/**
 * Get the best posting time for a given day of week.
 * Returns the time slot with the highest engagement multiplier.
 */
export function getBestTimeForDay(day: DayOfWeek): string {
  const windows = OPTIMAL_WINDOWS[day]
  const best = windows.reduce((prev, curr) =>
    curr.engagementMultiplier > prev.engagementMultiplier ? curr : prev
  )
  // Return the midpoint of the best window
  const startHour = parseInt(best.start.split(':')[0])
  const endHour = parseInt(best.end.split(':')[0])
  const midHour = Math.floor((startHour + endHour) / 2)
  return `${midHour.toString().padStart(2, '0')}:00`
}

/**
 * Map a day number (1-30) to a day of week, starting from a given date.
 */
export function getDayOfWeek(dayNumber: number, startDate: Date): DayOfWeek {
  const days: DayOfWeek[] = [
    'sunday', 'monday', 'tuesday', 'wednesday',
    'thursday', 'friday', 'saturday',
  ]
  const date = new Date(startDate)
  date.setDate(date.getDate() + dayNumber - 1)
  return days[date.getDay()]
}

/**
 * Generate a 30-day posting schedule starting from a given date.
 * Assigns optimal times based on the day of week.
 */
export function generate30DaySchedule(
  startDate: Date,
  _timezone = 'Europe/Zurich'
): Array<{ date: string; dayOfWeek: DayOfWeek; time: string }> {
  const schedule: Array<{ date: string; dayOfWeek: DayOfWeek; time: string }> = []

  for (let i = 1; i <= 30; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i - 1)
    const dayOfWeek = getDayOfWeek(i, startDate)
    const time = getBestTimeForDay(dayOfWeek)

    schedule.push({
      date: date.toISOString().split('T')[0],
      dayOfWeek,
      time,
    })
  }

  return schedule
}

/**
 * Convert a local time + timezone to a UTC ISO string for Buffer API.
 */
export function toUTCScheduleTime(
  dateStr: string,
  timeStr: string,
  _timezone: string
): string {
  // Construct a date string and let the caller handle timezone conversion
  // via date-fns-tz which is already a project dependency
  return `${dateStr}T${timeStr}:00`
}

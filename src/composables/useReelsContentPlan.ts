/**
 * Composable for managing the 30-day Instagram Reels content plan.
 *
 * Provides reactive access to captions, scheduling, and content calendar
 * with brand voice integration.
 */

import { ref, computed } from 'vue'
import type {
  ReelCaption,
  ContentCalendarEntry,
  ReelsContentPlan,
  ContentPillar,
  CaptionBrandVoice,
} from '@/types/reels-captions'
import {
  REELS_CAPTIONS,
  DEFAULT_BRAND_VOICE,
  formatFullCaption,
  getCaptionsByPillar,
  getPillarDistribution,
} from '@/config/reelsCaptions'
import {
  getDefaultSchedulingConfig,
  generate30DaySchedule,
  getBestTimeForDay,
} from '@/config/reelsScheduling'

export function useReelsContentPlan(timezone = 'Europe/Zurich') {
  // --- State ---
  const startDate = ref<Date>(new Date())
  const brandVoice = ref<CaptionBrandVoice>({ ...DEFAULT_BRAND_VOICE })
  const captions = ref<ReelCaption[]>([...REELS_CAPTIONS])
  const schedulingConfig = ref(getDefaultSchedulingConfig(timezone))

  // --- Computed ---

  /** All 30 captions as full formatted text */
  const formattedCaptions = computed(() =>
    captions.value.map(caption => ({
      day: caption.day,
      pillar: caption.pillar,
      text: formatFullCaption(caption),
      concept: caption.reelConcept,
    }))
  )

  /** Content calendar with dates assigned */
  const calendar = computed<ContentCalendarEntry[]>(() => {
    const schedule = generate30DaySchedule(startDate.value, schedulingConfig.value.timezone)

    return captions.value.map((caption, index) => {
      const slot = schedule[index]
      return {
        caption,
        scheduledDate: slot.date,
        scheduledTime: slot.time,
        status: 'draft' as const,
      }
    })
  })

  /** Pillar distribution breakdown */
  const pillarStats = computed(() => getPillarDistribution())

  /** Captions grouped by pillar */
  const captionsByPillar = computed(() => {
    const pillars: ContentPillar[] = ['educational', 'behind-the-scenes', 'community', 'promotional']
    return Object.fromEntries(
      pillars.map(p => [p, getCaptionsByPillar(p)])
    ) as Record<ContentPillar, ReelCaption[]>
  })

  /** Complete content plan object */
  const contentPlan = computed<ReelsContentPlan>(() => {
    const end = new Date(startDate.value)
    end.setDate(end.getDate() + 29)

    return {
      name: '30-Day Instagram Reels Content Plan',
      startDate: startDate.value.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      brandVoice: brandVoice.value,
      scheduling: schedulingConfig.value,
      pillarDistribution: {
        educational: 0.4,
        'behind-the-scenes': 0.25,
        community: 0.2,
        promotional: 0.15,
      },
      captions: captions.value,
      calendar: calendar.value,
    }
  })

  // --- Actions ---

  /** Update the start date and recalculate schedule */
  function setStartDate(date: Date) {
    startDate.value = date
  }

  /** Update brand voice settings */
  function updateBrandVoice(updates: Partial<CaptionBrandVoice>) {
    brandVoice.value = { ...brandVoice.value, ...updates }
  }

  /** Update timezone and recalculate schedule */
  function setTimezone(tz: string) {
    schedulingConfig.value = getDefaultSchedulingConfig(tz)
  }

  /** Get the optimal posting time for a specific day */
  function getOptimalTime(dayOfWeek: ReelCaption['scheduledDayOfWeek']): string {
    return getBestTimeForDay(dayOfWeek)
  }

  /** Export the content plan as JSON (for Buffer import or backup) */
  function exportPlan(): string {
    return JSON.stringify(contentPlan.value, null, 2)
  }

  /** Export captions as CSV for spreadsheet use */
  function exportAsCSV(): string {
    const headers = [
      'Day', 'Date', 'Time', 'Pillar', 'Hook', 'Body', 'CTA',
      'CTA Type', 'Hashtags (Broad)', 'Hashtags (Targeted)',
      'Hashtags (Niche)', 'Reel Concept',
    ]

    const rows = calendar.value.map(entry => {
      const c = entry.caption
      return [
        c.day,
        entry.scheduledDate,
        entry.scheduledTime,
        c.pillar,
        `"${c.hook.replace(/"/g, '""')}"`,
        `"${c.body.replace(/"/g, '""')}"`,
        `"${c.cta.replace(/"/g, '""')}"`,
        c.ctaType,
        `"${c.hashtags.broad.join(' ')}"`,
        `"${c.hashtags.targeted.join(' ')}"`,
        `"${c.hashtags.niche.join(' ')}"`,
        `"${c.reelConcept.replace(/"/g, '""')}"`,
      ].join(',')
    })

    return [headers.join(','), ...rows].join('\n')
  }

  return {
    // State
    startDate,
    brandVoice,
    captions,
    schedulingConfig,

    // Computed
    formattedCaptions,
    calendar,
    pillarStats,
    captionsByPillar,
    contentPlan,

    // Actions
    setStartDate,
    updateBrandVoice,
    setTimezone,
    getOptimalTime,
    exportPlan,
    exportAsCSV,
  }
}

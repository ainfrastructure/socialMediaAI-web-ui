import { ref, computed } from 'vue'

export type ViewMode = 'month' | 'week' | 'day'

export interface CalendarDay {
  date: Date
  dateString: string
  dayNum: number
  isCurrentMonth: boolean
  isToday: boolean
  isPast: boolean
  posts: any[]
  holidays: any[]
}

export function useCalendar() {
  const currentDate = ref(new Date())
  const viewMode = ref<ViewMode>('month')
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  // Get the Monday of the week containing the given date
  const getWeekStart = (date: Date): Date => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust for Sunday
    d.setDate(diff)
    d.setHours(0, 0, 0, 0)
    return d
  }

  // Get the Sunday of the week containing the given date
  const getWeekEnd = (date: Date): Date => {
    const start = getWeekStart(date)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    return end
  }

  const currentMonthYear = computed(() => {
    return currentDate.value.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    })
  })

  const currentPeriodLabel = computed(() => {
    if (viewMode.value === 'month') {
      return currentMonthYear.value
    } else if (viewMode.value === 'week') {
      const start = getWeekStart(currentDate.value)
      const end = getWeekEnd(currentDate.value)
      const startMonth = start.toLocaleDateString('en-US', { month: 'short' })
      const endMonth = end.toLocaleDateString('en-US', { month: 'short' })
      if (startMonth === endMonth) {
        return `${start.getDate()} - ${end.getDate()} ${startMonth} ${start.getFullYear()}`
      }
      return `${start.getDate()} ${startMonth} - ${end.getDate()} ${endMonth} ${start.getFullYear()}`
    } else {
      return currentDate.value.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    }
  })

  const displayedWeekDays = computed(() => {
    if (viewMode.value === 'day') {
      const dayIndex = currentDate.value.getDay()
      return [weekDays[dayIndex === 0 ? 6 : dayIndex - 1]]
    }
    return weekDays
  })

  const formatDateString = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const normalizeDate = (dateStr: string | undefined): string => {
    if (!dateStr) return ''
    const [year, month, day] = dateStr.split('-')
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }

  const isToday = (date: Date): boolean => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const isPastDate = (date: Date): boolean => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const checkDate = new Date(date)
    checkDate.setHours(0, 0, 0, 0)
    return checkDate < today
  }

  const previousPeriod = () => {
    const newDate = new Date(currentDate.value)
    if (viewMode.value === 'month') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else if (viewMode.value === 'week') {
      newDate.setDate(newDate.getDate() - 7)
    } else {
      newDate.setDate(newDate.getDate() - 1)
    }
    currentDate.value = newDate
  }

  const nextPeriod = () => {
    const newDate = new Date(currentDate.value)
    if (viewMode.value === 'month') {
      newDate.setMonth(newDate.getMonth() + 1)
    } else if (viewMode.value === 'week') {
      newDate.setDate(newDate.getDate() + 7)
    } else {
      newDate.setDate(newDate.getDate() + 1)
    }
    currentDate.value = newDate
  }

  const goToToday = () => {
    currentDate.value = new Date()
  }

  const setViewMode = (mode: ViewMode) => {
    viewMode.value = mode
  }

  // Generate calendar days for the current view
  const generateCalendarDays = (
    posts: any[] = [],
    holidays: any[] = []
  ): CalendarDay[] => {
    const days: CalendarDay[] = []
    const year = currentDate.value.getFullYear()
    const month = currentDate.value.getMonth()

    if (viewMode.value === 'day') {
      // Single day view
      const date = new Date(currentDate.value)
      date.setHours(0, 0, 0, 0)
      const dateStr = formatDateString(date)

      days.push({
        date,
        dateString: dateStr,
        dayNum: date.getDate(),
        isCurrentMonth: true,
        isToday: isToday(date),
        isPast: isPastDate(date),
        posts: posts.filter(p => normalizeDate(p.scheduled_date) === dateStr),
        holidays: holidays.filter(h => normalizeDate(h.date) === dateStr)
      })
    } else if (viewMode.value === 'week') {
      // Week view - 7 days starting from Monday
      const weekStart = getWeekStart(currentDate.value)

      for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart)
        date.setDate(weekStart.getDate() + i)
        date.setHours(0, 0, 0, 0)
        const dateStr = formatDateString(date)

        days.push({
          date,
          dateString: dateStr,
          dayNum: date.getDate(),
          isCurrentMonth: date.getMonth() === month,
          isToday: isToday(date),
          isPast: isPastDate(date),
          posts: posts.filter(p => normalizeDate(p.scheduled_date) === dateStr),
          holidays: holidays.filter(h => normalizeDate(h.date) === dateStr)
        })
      }
    } else {
      // Month view
      const firstDay = new Date(year, month, 1)
      const lastDay = new Date(year, month + 1, 0)

      // Get the Monday of the first week
      let startDate = new Date(firstDay)
      const dayOfWeek = firstDay.getDay()
      const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1
      startDate.setDate(firstDay.getDate() - daysToSubtract)

      // Generate 6 weeks (42 days) to fill the calendar
      for (let i = 0; i < 42; i++) {
        const date = new Date(startDate)
        date.setDate(startDate.getDate() + i)
        date.setHours(0, 0, 0, 0)
        const dateStr = formatDateString(date)

        days.push({
          date,
          dateString: dateStr,
          dayNum: date.getDate(),
          isCurrentMonth: date.getMonth() === month,
          isToday: isToday(date),
          isPast: isPastDate(date),
          posts: posts.filter(p => normalizeDate(p.scheduled_date) === dateStr),
          holidays: holidays.filter(h => normalizeDate(h.date) === dateStr)
        })
      }
    }

    return days
  }

  return {
    // State
    currentDate,
    viewMode,
    weekDays,

    // Computed
    currentMonthYear,
    currentPeriodLabel,
    displayedWeekDays,

    // Methods
    getWeekStart,
    getWeekEnd,
    formatDateString,
    normalizeDate,
    isToday,
    isPastDate,
    previousPeriod,
    nextPeriod,
    goToToday,
    setViewMode,
    generateCalendarDays
  }
}

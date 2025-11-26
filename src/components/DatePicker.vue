<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Props {
  modelValue: string // ISO date string (YYYY-MM-DD)
  minDate?: string // Minimum selectable date
}

const props = withDefaults(defineProps<Props>(), {
  minDate: () => new Date().toISOString().split('T')[0]
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

// Initialize current month - default to today or selected date
const initializeMonth = () => {
  if (props.modelValue) {
    try {
      return new Date(props.modelValue)
    } catch {
      return new Date()
    }
  }
  return new Date()
}

const currentMonth = ref(initializeMonth())

// Watch for external changes to modelValue
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    try {
      const newDate = new Date(newValue)
      // Only update if it's a different month/year
      if (
        newDate.getMonth() !== currentMonth.value.getMonth() ||
        newDate.getFullYear() !== currentMonth.value.getFullYear()
      ) {
        currentMonth.value = newDate
      }
    } catch (error) {
      console.error('Invalid date:', newValue)
    }
  }
})

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const monthYear = computed(() => {
  return currentMonth.value.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  })
})

const calendarDays = computed(() => {
  if (!currentMonth.value) {
    return []
  }

  const year = currentMonth.value.getFullYear()
  const month = currentMonth.value.getMonth()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const prevMonthLastDay = new Date(year, month, 0)

  const days: Array<{
    date: Date
    isCurrentMonth: boolean
    isToday: boolean
    isSelected: boolean
    isDisabled: boolean
    dateString: string
  }> = []

  const minDateValue = props.minDate || new Date().toISOString().split('T')[0]

  // Previous month days
  const firstDayOfWeek = firstDay.getDay()
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(year, month - 1, prevMonthLastDay.getDate() - i)
    const dateString = date.toISOString().split('T')[0]
    days.push({
      date,
      isCurrentMonth: false,
      isToday: false,
      isSelected: dateString === props.modelValue,
      isDisabled: dateString < minDateValue,
      dateString
    })
  }

  // Current month days
  const today = new Date().toISOString().split('T')[0]
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = new Date(year, month, day)
    const dateString = date.toISOString().split('T')[0]

    days.push({
      date,
      isCurrentMonth: true,
      isToday: dateString === today,
      isSelected: dateString === props.modelValue,
      isDisabled: dateString < minDateValue,
      dateString
    })
  }

  // Next month days
  const remainingDays = 42 - days.length // 6 rows * 7 days
  for (let day = 1; day <= remainingDays; day++) {
    const date = new Date(year, month + 1, day)
    const dateString = date.toISOString().split('T')[0]
    days.push({
      date,
      isCurrentMonth: false,
      isToday: false,
      isSelected: dateString === props.modelValue,
      isDisabled: dateString < minDateValue,
      dateString
    })
  }

  return days
})

const selectDate = (day: any) => {
  if (day.isDisabled) return
  emit('update:modelValue', day.dateString)
}

const previousMonth = () => {
  currentMonth.value = new Date(
    currentMonth.value.getFullYear(),
    currentMonth.value.getMonth() - 1,
    1
  )
}

const nextMonth = () => {
  currentMonth.value = new Date(
    currentMonth.value.getFullYear(),
    currentMonth.value.getMonth() + 1,
    1
  )
}

const goToToday = () => {
  currentMonth.value = new Date()
  const today = new Date().toISOString().split('T')[0]
  emit('update:modelValue', today)
}
</script>

<template>
  <div class="date-picker">
    <div class="picker-header">
      <button class="nav-button" @click="previousMonth" type="button">
        ←
      </button>
      <div class="month-year">{{ monthYear }}</div>
      <button class="nav-button" @click="nextMonth" type="button">
        →
      </button>
    </div>

    <div class="weekday-labels">
      <div v-for="day in weekDays" :key="day" class="weekday-label">
        {{ day }}
      </div>
    </div>

    <div class="calendar-grid">
      <button
        v-for="day in calendarDays"
        :key="day.dateString"
        type="button"
        :class="[
          'calendar-day',
          {
            'other-month': !day.isCurrentMonth,
            'today': day.isToday,
            'selected': day.isSelected,
            'disabled': day.isDisabled
          }
        ]"
        @click="selectDate(day)"
        :disabled="day.isDisabled"
      >
        {{ day.date.getDate() }}
      </button>
    </div>

    <div class="picker-footer">
      <button class="today-button" @click="goToToday" type="button">
        Today
      </button>
    </div>
  </div>
</template>

<style scoped>
.date-picker {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
}

.picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-lg);
  padding-bottom: var(--space-md);
  border-bottom: 1px solid rgba(212, 175, 55, 0.1);
}

.nav-button {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
  font-size: var(--text-lg);
  cursor: pointer;
  transition: var(--transition-base);
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-button:hover {
  background: var(--gold-primary);
  border-color: var(--gold-primary);
  color: var(--text-on-gold);
}

.month-year {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.weekday-labels {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: var(--space-xs);
  margin-bottom: var(--space-sm);
}

.weekday-label {
  text-align: center;
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: var(--space-xs) 0;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: var(--space-xs);
  margin-bottom: var(--space-md);
}

.calendar-day {
  aspect-ratio: 1;
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  color: var(--text-primary);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: var(--transition-base);
  display: flex;
  align-items: center;
  justify-content: center;
}

.calendar-day:hover:not(.disabled) {
  background: rgba(212, 175, 55, 0.1);
  border-color: var(--gold-primary);
  transform: scale(1.05);
}

.calendar-day.other-month {
  color: var(--text-muted);
  opacity: 0.4;
}

.calendar-day.today {
  background: rgba(212, 175, 55, 0.15);
  border-color: var(--gold-primary);
  font-weight: var(--font-bold);
}

.calendar-day.selected {
  background: var(--gold-primary);
  border-color: var(--gold-primary);
  color: var(--text-on-gold);
  font-weight: var(--font-bold);
  box-shadow: 0 0 12px rgba(212, 175, 55, 0.4);
}

.calendar-day.disabled {
  opacity: 0.3;
  cursor: not-allowed;
  background: rgba(0, 0, 0, 0.2);
}

.picker-footer {
  display: flex;
  justify-content: center;
  padding-top: var(--space-md);
  border-top: 1px solid rgba(212, 175, 55, 0.1);
}

.today-button {
  padding: var(--space-sm) var(--space-lg);
  background: rgba(212, 175, 55, 0.1);
  border: 1px solid var(--gold-primary);
  border-radius: var(--radius-md);
  color: var(--gold-primary);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  cursor: pointer;
  transition: var(--transition-base);
}

.today-button:hover {
  background: var(--gold-primary);
  color: var(--text-on-gold);
}

/* Responsive */
@media (max-width: 480px) {
  .calendar-day {
    font-size: var(--text-xs);
  }

  .month-year {
    font-size: var(--text-base);
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .calendar-day,
  .nav-button,
  .today-button {
    transition: none;
  }

  .calendar-day:hover:not(.disabled) {
    transform: none;
  }
}
</style>

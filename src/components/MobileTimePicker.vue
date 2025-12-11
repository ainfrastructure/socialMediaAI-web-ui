<script setup lang="ts">
import { ref, watch, computed } from 'vue'

interface Props {
  modelValue: { hours: number; minutes: number }
  minutesIncrement?: number
}

const props = withDefaults(defineProps<Props>(), {
  minutesIncrement: 5
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: { hours: number; minutes: number }): void
}>()

const hours = ref(props.modelValue.hours)
const minutes = ref(props.modelValue.minutes)

// Sync with modelValue
watch(() => props.modelValue, (newVal) => {
  hours.value = newVal.hours
  minutes.value = newVal.minutes
}, { deep: true })

// Emit changes
watch([hours, minutes], () => {
  emit('update:modelValue', { hours: hours.value, minutes: minutes.value })
})

// Generate hour options (0-23)
const hourOptions = computed(() => {
  return Array.from({ length: 24 }, (_, i) => i)
})

// Generate minute options based on increment
const minuteOptions = computed(() => {
  const options: number[] = []
  for (let i = 0; i < 60; i += props.minutesIncrement) {
    options.push(i)
  }
  return options
})

// Format display
const formatNumber = (n: number) => String(n).padStart(2, '0')

// Increment/decrement functions
const incrementHours = () => {
  hours.value = (hours.value + 1) % 24
}

const decrementHours = () => {
  hours.value = (hours.value - 1 + 24) % 24
}

const incrementMinutes = () => {
  const currentIdx = minuteOptions.value.indexOf(minutes.value)
  const nextIdx = (currentIdx + 1) % minuteOptions.value.length
  minutes.value = minuteOptions.value[nextIdx]
}

const decrementMinutes = () => {
  const currentIdx = minuteOptions.value.indexOf(minutes.value)
  const prevIdx = (currentIdx - 1 + minuteOptions.value.length) % minuteOptions.value.length
  minutes.value = minuteOptions.value[prevIdx]
}

// Direct input handling
const handleHoursInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  let val = parseInt(target.value)
  if (isNaN(val)) val = 0
  if (val < 0) val = 0
  if (val > 23) val = 23
  hours.value = val
}

const handleMinutesInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  let val = parseInt(target.value)
  if (isNaN(val)) val = 0
  if (val < 0) val = 0
  if (val > 59) val = 59
  // Snap to nearest increment
  const closest = minuteOptions.value.reduce((prev, curr) =>
    Math.abs(curr - val) < Math.abs(prev - val) ? curr : prev
  )
  minutes.value = closest
}
</script>

<template>
  <div class="mobile-time-picker">
    <!-- Hours -->
    <div class="time-column">
      <button
        type="button"
        class="time-btn up"
        @click="incrementHours"
        aria-label="Increase hours"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="18 15 12 9 6 15"></polyline>
        </svg>
      </button>
      <input
        type="number"
        :value="formatNumber(hours)"
        @change="handleHoursInput"
        @focus="($event.target as HTMLInputElement).select()"
        class="time-input"
        min="0"
        max="23"
        inputmode="numeric"
        aria-label="Hours"
      />
      <button
        type="button"
        class="time-btn down"
        @click="decrementHours"
        aria-label="Decrease hours"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
    </div>

    <!-- Separator -->
    <div class="time-separator">:</div>

    <!-- Minutes -->
    <div class="time-column">
      <button
        type="button"
        class="time-btn up"
        @click="incrementMinutes"
        aria-label="Increase minutes"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="18 15 12 9 6 15"></polyline>
        </svg>
      </button>
      <input
        type="number"
        :value="formatNumber(minutes)"
        @change="handleMinutesInput"
        @focus="($event.target as HTMLInputElement).select()"
        class="time-input"
        min="0"
        max="59"
        inputmode="numeric"
        aria-label="Minutes"
      />
      <button
        type="button"
        class="time-btn down"
        @click="decrementMinutes"
        aria-label="Decrease minutes"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.mobile-time-picker {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
  padding: var(--space-md);
}

.time-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
}

.time-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 36px;
  background: rgba(212, 175, 55, 0.1);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: var(--radius-sm);
  color: var(--gold-primary);
  cursor: pointer;
  transition: var(--transition-fast);
  -webkit-tap-highlight-color: transparent;
}

.time-btn svg {
  width: 18px;
  height: 18px;
}

.time-btn:hover {
  background: rgba(212, 175, 55, 0.2);
  border-color: var(--gold-primary);
}

.time-btn:active {
  background: var(--gold-primary);
  color: var(--text-on-gold);
  transform: scale(0.95);
}

.time-input {
  width: 56px;
  height: 52px;
  background: rgba(212, 175, 55, 0.15);
  border: 1px solid rgba(212, 175, 55, 0.4);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  text-align: center;
  -moz-appearance: textfield;
  appearance: textfield;
}

.time-input::-webkit-outer-spin-button,
.time-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.time-input:focus {
  outline: none;
  border-color: var(--gold-primary);
  background: rgba(212, 175, 55, 0.25);
  box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.2);
}

.time-separator {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--gold-primary);
  padding-bottom: var(--space-sm);
}
</style>

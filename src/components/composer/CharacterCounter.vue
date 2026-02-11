<template>
  <div
    :class="['char-counter', { 'over-limit': isOverLimit, 'near-limit': isNearLimit }]"
    role="status"
    :aria-label="`${current} of ${max} characters used`"
  >
    <svg class="counter-ring" :width="size" :height="size" viewBox="0 0 36 36">
      <circle
        class="ring-bg"
        cx="18"
        cy="18"
        r="15.5"
        fill="none"
        stroke-width="3"
      />
      <circle
        class="ring-fill"
        cx="18"
        cy="18"
        r="15.5"
        fill="none"
        stroke-width="3"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="dashOffset"
        stroke-linecap="round"
      />
    </svg>
    <span class="counter-text">
      <span class="counter-current">{{ current }}</span>
      <span class="counter-separator">/</span>
      <span class="counter-max">{{ max }}</span>
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  current: number
  max: number
  size?: number
}

const props = withDefaults(defineProps<Props>(), {
  size: 32,
})

const circumference = 2 * Math.PI * 15.5
const percentage = computed(() => Math.min(props.current / props.max, 1))
const dashOffset = computed(() => circumference * (1 - percentage.value))
const isOverLimit = computed(() => props.current > props.max)
const isNearLimit = computed(() => !isOverLimit.value && props.current > props.max * 0.9)
</script>

<style scoped>
.char-counter {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
}

.counter-ring {
  transform: rotate(-90deg);
  flex-shrink: 0;
}

.ring-bg {
  stroke: var(--border-color);
}

.ring-fill {
  stroke: var(--gold-primary);
  transition: stroke-dashoffset 0.3s ease, stroke 0.3s ease;
}

.near-limit .ring-fill {
  stroke: var(--warning-text);
}

.over-limit .ring-fill {
  stroke: var(--error-text);
}

.counter-text {
  font-family: var(--font-body);
  font-size: var(--text-xs);
  color: var(--text-muted);
  white-space: nowrap;
}

.near-limit .counter-text {
  color: var(--warning-text);
}

.over-limit .counter-text {
  color: var(--error-text);
  font-weight: var(--font-medium);
}

.counter-current {
  font-variant-numeric: tabular-nums;
}

.counter-max {
  font-variant-numeric: tabular-nums;
}

.counter-separator {
  opacity: 0.5;
  margin: 0 1px;
}
</style>

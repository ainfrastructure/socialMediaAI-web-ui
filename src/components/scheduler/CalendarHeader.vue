<template>
  <div :class="['calendar-header-new', { 'day-view-mode': viewMode === 'day' }]">
    <button
      class="nav-arrow"
      @click="$emit('previous')"
      :title="`Previous ${viewMode}`"
    >
      <span class="arrow-icon">←</span>
      <span class="arrow-tooltip">Previous {{ viewMode }}</span>
    </button>

    <div class="calendar-center">
      <h2 class="current-month">{{ periodLabel }}</h2>
      <div class="view-mode-toggle">
        <div class="toggle-slider" :class="`position-${viewMode}`"></div>
        <button
          v-for="mode in viewModes"
          :key="mode"
          :class="['view-btn', { active: viewMode === mode }]"
          @click="$emit('update:viewMode', mode)"
        >
          {{ capitalizeFirst(mode) }}
        </button>
      </div>
    </div>

    <button
      class="nav-arrow"
      @click="$emit('next')"
      :title="`Next ${viewMode}`"
    >
      <span class="arrow-icon">→</span>
      <span class="arrow-tooltip">Next {{ viewMode }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
export type ViewMode = 'month' | 'week' | 'day'

defineProps<{
  viewMode: ViewMode
  periodLabel: string
}>()

defineEmits<{
  (e: 'update:viewMode', mode: ViewMode): void
  (e: 'previous'): void
  (e: 'next'): void
}>()

const viewModes: ViewMode[] = ['month', 'week', 'day']

const capitalizeFirst = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
</script>

<style scoped>
.calendar-header-new {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md) 0;
  margin-bottom: var(--space-md);
  max-width: 100%;
  overflow: hidden;
}

.nav-arrow {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-md) var(--space-lg);
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(15, 61, 46, 0.1);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-base);
  color: var(--text-primary);
}

.nav-arrow:hover {
  background: rgba(15, 61, 46, 0.08);
  border-color: rgba(15, 61, 46, 0.15);
  transform: scale(1.05);
}

.arrow-icon {
  font-size: var(--text-xl);
}

.arrow-tooltip {
  font-size: var(--text-xs);
  color: var(--text-muted);
  opacity: 0;
  transition: opacity var(--transition-base);
  position: absolute;
  bottom: -20px;
  white-space: nowrap;
}

.nav-arrow:hover .arrow-tooltip {
  opacity: 1;
}

.calendar-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
}

.current-month {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  color: var(--text-primary);
  margin: 0;
}

.view-mode-toggle {
  position: relative;
  display: flex;
  background: rgba(255, 255, 255, 0.8);
  border-radius: var(--radius-full);
  padding: 4px;
  gap: 0;
}

.toggle-slider {
  position: absolute;
  height: calc(100% - 8px);
  width: calc((100% - 8px) / 3);
  background: var(--gold-primary);
  border-radius: var(--radius-full);
  transition: transform var(--transition-base);
  top: 4px;
  left: 4px;
  transform: translateX(0);
}

.toggle-slider.position-month {
  transform: translateX(0);
}

.toggle-slider.position-week {
  transform: translateX(100%);
}

.toggle-slider.position-day {
  transform: translateX(200%);
}

.view-btn {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--space-sm) var(--space-lg);
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: color var(--transition-base);
  border-radius: var(--radius-full);
  min-width: 60px;
}

.view-btn.active {
  color: var(--text-on-gold);
}

.view-btn:hover:not(.active) {
  color: var(--text-primary);
}

@media (max-width: 768px) {
  .calendar-header-new {
    gap: var(--space-sm);
  }

  .nav-arrow {
    padding: var(--space-sm) var(--space-md);
  }

  .arrow-tooltip {
    display: none;
  }

  .current-month {
    font-size: var(--text-xl);
  }
}

@media (max-width: 480px) {
  .calendar-header-new {
    gap: var(--space-sm);
    padding: var(--space-sm) 0;
  }

  .nav-arrow {
    padding: var(--space-sm) var(--space-md);
  }

  .current-month {
    font-size: var(--text-lg);
  }

  .view-btn {
    padding: var(--space-xs) var(--space-md);
    font-size: var(--text-xs);
  }
}

@media (max-width: 390px) {
  .calendar-header-new {
    gap: var(--space-xs);
  }

  .nav-arrow {
    padding: var(--space-xs) var(--space-sm);
  }

  .arrow-icon {
    font-size: var(--text-base);
  }

  .current-month {
    font-size: var(--text-base);
  }

  .view-mode-toggle {
    padding: 3px;
  }

  .view-btn {
    padding: var(--space-xs) var(--space-sm);
    font-size: var(--text-xs);
    min-width: 50px;
  }

  .toggle-slider {
    height: calc(100% - 6px);
    width: calc((100% - 6px) / 3);
    top: 3px;
    left: 3px;
  }
}

/* Mobile Day View - keep view toggle visible so user can switch views */
@media (max-width: 768px) {
  .calendar-header-new.day-view-mode {
    padding: var(--space-sm) 0;
  }

  .calendar-header-new.day-view-mode .current-month {
    font-size: var(--text-base);
  }
}
</style>

<script setup lang="ts">
import { ref } from 'vue'
import type { HeatmapCell } from '@/types/scheduleAnalysis'

interface Props {
  data: HeatmapCell[]
}

const props = defineProps<Props>()

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const HOUR_LABELS = Array.from({ length: 24 }, (_, i) => {
  if (i === 0) return '12a'
  if (i === 12) return '12p'
  if (i < 12) return `${i}a`
  return `${i - 12}p`
})

// Show only business hours by default (6am-11pm)
const DISPLAY_HOURS = Array.from({ length: 18 }, (_, i) => i + 6)

const hoveredCell = ref<HeatmapCell | null>(null)
const tooltipPosition = ref({ x: 0, y: 0 })

function getCell(day: number, hour: number): HeatmapCell | undefined {
  return props.data.find(c => c.day === day && c.hour === hour)
}

function cellColor(value: number): string {
  if (value === 0) return 'var(--bg-tertiary)'
  // Green gradient: from light to saturated forest green
  const alpha = 0.1 + value * 0.8
  return `rgba(15, 61, 46, ${alpha})`
}

function handleCellHover(cell: HeatmapCell | undefined, event: MouseEvent) {
  if (!cell) {
    hoveredCell.value = null
    return
  }
  hoveredCell.value = cell
  const rect = (event.target as HTMLElement).getBoundingClientRect()
  tooltipPosition.value = {
    x: rect.left + rect.width / 2,
    y: rect.top - 8,
  }
}

function formatRate(rate: number): string {
  return rate > 0 ? `${rate.toFixed(2)}%` : 'No data'
}
</script>

<template>
  <div class="heatmap-container">
    <div class="heatmap-scroll">
      <div class="heatmap-grid">
        <!-- Corner spacer -->
        <div class="heatmap-corner" />

        <!-- Hour labels -->
        <div
          v-for="hour in DISPLAY_HOURS"
          :key="`h-${hour}`"
          class="heatmap-hour-label"
        >
          {{ HOUR_LABELS[hour] }}
        </div>

        <!-- Rows: one per day -->
        <template v-for="day in 7" :key="`day-${day - 1}`">
          <!-- Day label -->
          <div class="heatmap-day-label">{{ DAY_LABELS[day - 1] }}</div>

          <!-- Cells -->
          <div
            v-for="hour in DISPLAY_HOURS"
            :key="`cell-${day - 1}-${hour}`"
            class="heatmap-cell"
            :style="{
              backgroundColor: cellColor(getCell(day - 1, hour)?.value ?? 0),
            }"
            @mouseenter="handleCellHover(getCell(day - 1, hour), $event)"
            @mouseleave="hoveredCell = null"
          >
            <span
              v-if="(getCell(day - 1, hour)?.postCount ?? 0) > 0"
              class="cell-count"
            >
              {{ getCell(day - 1, hour)?.postCount }}
            </span>
          </div>
        </template>
      </div>
    </div>

    <!-- Legend -->
    <div class="heatmap-legend">
      <span class="legend-label">Low</span>
      <div class="legend-gradient" />
      <span class="legend-label">High</span>
      <span class="legend-hint">· Number = post count</span>
    </div>

    <!-- Tooltip -->
    <Teleport to="body">
      <div
        v-if="hoveredCell"
        class="heatmap-tooltip"
        :style="{
          left: `${tooltipPosition.x}px`,
          top: `${tooltipPosition.y}px`,
        }"
      >
        <strong>{{ DAY_LABELS[hoveredCell.day] }} {{ HOUR_LABELS[hoveredCell.hour] }}</strong>
        <span>Engagement: {{ formatRate(hoveredCell.engagementRate) }}</span>
        <span>Posts: {{ hoveredCell.postCount }}</span>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.heatmap-container {
  background: var(--bg-secondary);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  padding: var(--space-xl);
  overflow: hidden;
}

.heatmap-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.heatmap-grid {
  display: grid;
  grid-template-columns: 48px repeat(18, 1fr);
  gap: 3px;
  min-width: 600px;
}

.heatmap-corner {
  /* Empty top-left corner */
}

.heatmap-hour-label {
  font-size: 10px;
  color: var(--text-muted);
  text-align: center;
  padding-bottom: var(--space-xs);
  font-weight: var(--font-medium);
}

.heatmap-day-label {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  font-weight: var(--font-semibold);
  display: flex;
  align-items: center;
  padding-right: var(--space-sm);
}

.heatmap-cell {
  aspect-ratio: 1;
  min-height: 32px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: var(--transition-fast);
  position: relative;
}

.heatmap-cell:hover {
  outline: 2px solid var(--gold-primary);
  outline-offset: -1px;
  z-index: 1;
}

.cell-count {
  font-size: 9px;
  font-weight: var(--font-bold);
  color: var(--text-on-gold);
  opacity: 0.9;
}

/* Legend */
.heatmap-legend {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-top: var(--space-lg);
  justify-content: center;
}

.legend-label {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.legend-gradient {
  width: 120px;
  height: 12px;
  border-radius: var(--radius-sm);
  background: linear-gradient(90deg, var(--bg-tertiary), rgba(15, 61, 46, 0.9));
}

.legend-hint {
  font-size: var(--text-xs);
  color: var(--text-muted);
  opacity: 0.7;
}

/* Tooltip */
.heatmap-tooltip {
  position: fixed;
  transform: translate(-50%, -100%);
  background: var(--glass-intense-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  padding: var(--space-sm) var(--space-md);
  box-shadow: var(--shadow-lg);
  z-index: var(--z-tooltip);
  pointer-events: none;
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: var(--text-xs);
  color: var(--text-secondary);
  white-space: nowrap;
}

.heatmap-tooltip strong {
  color: var(--text-primary);
  font-size: var(--text-sm);
}

/* Responsive */
@media (max-width: 768px) {
  .heatmap-container {
    padding: var(--space-md);
  }

  .heatmap-grid {
    gap: 2px;
  }

  .heatmap-cell {
    min-height: 24px;
  }

  .cell-count {
    font-size: 8px;
  }
}
</style>

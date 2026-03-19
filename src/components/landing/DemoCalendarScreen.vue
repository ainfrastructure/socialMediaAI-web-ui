<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import MaterialIcon from '@/components/MaterialIcon.vue'
const { t } = useI18n()

const dayLabels = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

const row1 = [
  { day: 16, dots: ['orange'] },
  { day: 17, dots: ['orange', 'violet'] },
  { day: 18, dots: ['cyan'], today: true },
  { day: 19, dots: ['violet'] },
  { day: 20, dots: ['violet', 'orange'] },
  { day: 21, dots: ['cyan'] },
  { day: 22, dots: [] },
]

const row2 = [
  { day: 23, dots: ['orange'] },
  { day: 24, dots: ['violet', 'cyan'] },
  { day: 25, dots: ['orange', 'violet', 'cyan'] },
  { day: 26, dots: ['violet', 'cyan'] },
  { day: 27, dots: ['orange'] },
  { day: 28, dots: ['orange', 'violet'] },
  { day: 29, dots: [] },
]
</script>

<template>
  <div class="demo-calendar-screen" data-demo-calendar-screen>
    <!-- Header -->
    <div class="dcal-header" data-demo-cal-header>
      <div class="dcal-header-left">
        <MaterialIcon icon="arrow_back" size="xs" />
        <div class="dcal-header-titles">
          <span class="dcal-title">{{ t('appLanding.cinematic.calTitle') }}</span>
          <span class="dcal-brand">{{ t('appLanding.cinematic.calBrand') }}</span>
        </div>
      </div>
      <div class="dcal-filter" data-demo-cal-filter>
        <span>All</span>
        <MaterialIcon icon="arrow_drop_down" size="xs" />
      </div>
    </div>

    <!-- Platform filter row -->
    <div class="dcal-platforms" data-demo-cal-platforms>
      <div class="dcal-platform dcal-platform-active">
        <span>All</span>
      </div>
      <div class="dcal-platform">
        <MaterialIcon icon="facebook" size="xs" />
      </div>
      <div class="dcal-platform">
        <MaterialIcon icon="photo_camera" size="xs" />
      </div>
      <div class="dcal-platform">
        <MaterialIcon icon="tag" size="xs" />
      </div>
      <div class="dcal-platform">
        <MaterialIcon icon="work" size="xs" />
      </div>
    </div>

    <!-- Month navigation -->
    <div class="dcal-month-nav" data-demo-cal-month>
      <MaterialIcon icon="chevron_left" size="xs" />
      <span class="dcal-month-label">{{ t('appLanding.cinematic.calMonth') }}</span>
      <MaterialIcon icon="chevron_right" size="xs" />
    </div>

    <!-- Day labels -->
    <div class="dcal-day-labels" data-demo-cal-day-labels>
      <span v-for="label in dayLabels" :key="label" class="dcal-day-label">{{ label }}</span>
    </div>

    <!-- Calendar grid -->
    <div class="dcal-grid" data-demo-cal-grid>
      <!-- Row 1 -->
      <div
        v-for="cell in row1"
        :key="cell.day"
        class="dcal-cell"
        :class="{
          'dcal-today': cell.today,
          'dcal-has-post': cell.dots.length > 0,
        }"
      >
        <span class="dcal-cell-num">{{ cell.day }}</span>
        <div v-if="cell.dots.length" class="dcal-dots">
          <span
            v-for="(dot, i) in cell.dots"
            :key="i"
            class="dcal-dot"
            :class="`dcal-dot-${dot}`"
          />
        </div>
      </div>
      <!-- Row 2 -->
      <div
        v-for="cell in row2"
        :key="cell.day"
        class="dcal-cell"
        :class="{
          'dcal-has-post': cell.dots.length > 0,
        }"
      >
        <span class="dcal-cell-num">{{ cell.day }}</span>
        <div v-if="cell.dots.length" class="dcal-dots">
          <span
            v-for="(dot, i) in cell.dots"
            :key="i"
            class="dcal-dot"
            :class="`dcal-dot-${dot}`"
          />
        </div>
      </div>
    </div>

    <!-- Selected day detail -->
    <div class="dcal-detail" data-demo-cal-detail>
      <div class="dcal-detail-header">
        <span class="dcal-detail-day">{{ t('appLanding.cinematic.calSelectedDay') }}</span>
        <span class="dcal-detail-badge">1</span>
      </div>

      <div class="dcal-post-card">
        <img src="/example/vetted-wave-flow.png" alt="" class="dcal-post-img" loading="lazy" />
        <div class="dcal-post-body">
          <span class="dcal-post-label">WEDNESDAY &rarr; FACEBOOK</span>
          <span class="dcal-post-title">{{ t('appLanding.cinematic.calPostTitle') }}</span>
          <div class="dcal-post-meta">
            <span class="dcal-post-platform-pill">{{ t('appLanding.cinematic.calPostPlatform') }}</span>
            <span class="dcal-post-status">
              <span class="dcal-status-dot" />
              {{ t('appLanding.cinematic.calPostStatus') }}
            </span>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.demo-calendar-screen {
  position: absolute;
  inset: 0;
  z-index: 35;
  background: var(--lp-bg-primary, #09090B);
  display: flex;
  flex-direction: column;
  opacity: 0;
  pointer-events: none;
}

/* Header */
.dcal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-sm) var(--space-md);
  border-bottom: 1px solid var(--lp-border, rgba(255, 255, 255, 0.08));
  flex-shrink: 0;
  opacity: 0;
}

.dcal-header-left {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  color: var(--lp-text-primary);
}

.dcal-header-titles {
  display: flex;
  flex-direction: column;
}

.dcal-title {
  font-size: 9px;
  font-weight: var(--font-semibold);
  color: var(--lp-text-primary);
  line-height: 1.2;
}

.dcal-brand {
  font-size: 7px;
  color: var(--lp-text-muted);
  line-height: 1.2;
}

.dcal-filter {
  display: flex;
  align-items: center;
  gap: 1px;
  font-size: 8px;
  color: var(--lp-text-secondary);
  background: var(--lp-bg-surface, rgba(255, 255, 255, 0.06));
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--lp-border, rgba(255, 255, 255, 0.08));
}

/* Platform filter */
.dcal-platforms {
  display: flex;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-md);
  flex-shrink: 0;
  opacity: 0;
}

.dcal-platform {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 7px;
  font-weight: var(--font-semibold);
  color: var(--lp-text-muted);
  background: var(--lp-bg-surface, rgba(255, 255, 255, 0.06));
  border: 1px solid var(--lp-border, rgba(255, 255, 255, 0.08));
}

.dcal-platform-active {
  background: var(--lp-accent-orange);
  color: #fff;
  border-color: var(--lp-accent-orange);
}

.dcal-platform .material-icon {
  font-size: 11px;
}

/* Month navigation */
.dcal-month-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  padding: var(--space-xs) var(--space-md);
  flex-shrink: 0;
  opacity: 0;
}

.dcal-month-nav .material-icon {
  font-size: 12px;
  color: var(--lp-text-muted);
}

.dcal-month-label {
  font-size: 9px;
  font-weight: var(--font-semibold);
  color: var(--lp-text-primary);
}

/* Day labels */
.dcal-day-labels {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  padding: 0 var(--space-sm);
  flex-shrink: 0;
  opacity: 0;
}

.dcal-day-label {
  font-size: 6px;
  font-weight: var(--font-semibold);
  color: var(--lp-text-muted);
  text-align: center;
  text-transform: uppercase;
  padding: 2px 0;
}

/* Calendar grid */
.dcal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  padding: 0 var(--space-sm);
  gap: 2px;
  flex-shrink: 0;
}

.dcal-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3px 0;
  border-radius: var(--radius-sm);
  min-height: 24px;
  opacity: 0;
}

.dcal-cell-num {
  font-size: 8px;
  color: var(--lp-text-primary);
  line-height: 1;
}

.dcal-today {
  border: 1px solid var(--lp-accent-orange);
  background: color-mix(in srgb, var(--lp-accent-orange) 10%, transparent);
}

.dcal-today .dcal-cell-num {
  color: var(--lp-accent-orange);
  font-weight: var(--font-bold);
}

.dcal-dots {
  display: flex;
  gap: 2px;
  margin-top: 2px;
}

.dcal-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
}

.dcal-dot-orange {
  background: var(--lp-accent-orange);
}

.dcal-dot-violet {
  background: var(--lp-accent-violet);
}

.dcal-dot-cyan {
  background: var(--lp-accent-cyan);
}

/* Detail section */
.dcal-detail {
  flex: 1;
  padding: var(--space-sm) var(--space-md);
  border-top: 1px solid var(--lp-border, rgba(255, 255, 255, 0.08));
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  overflow: hidden;
  opacity: 0;
}

.dcal-detail-header {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.dcal-detail-day {
  font-size: 8px;
  font-weight: var(--font-semibold);
  color: var(--lp-text-primary);
}

.dcal-detail-badge {
  font-size: 7px;
  font-weight: var(--font-bold);
  color: #fff;
  background: var(--lp-accent-orange);
  width: 14px;
  height: 14px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

/* Post card */
.dcal-post-card {
  background: var(--lp-bg-surface, rgba(255, 255, 255, 0.06));
  border: 1px solid var(--lp-border, rgba(255, 255, 255, 0.08));
  border-radius: var(--radius-md);
  overflow: hidden;
  opacity: 0;
}

.dcal-post-img {
  width: 100%;
  height: 56px;
  object-fit: cover;
  display: block;
}

.dcal-post-body {
  padding: var(--space-xs) var(--space-sm);
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.dcal-post-label {
  font-size: 6px;
  font-weight: var(--font-semibold);
  color: var(--lp-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.dcal-post-title {
  font-size: 9px;
  font-weight: var(--font-semibold);
  color: var(--lp-text-primary);
  line-height: 1.3;
}

.dcal-post-meta {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  margin-top: 2px;
}

.dcal-post-platform-pill {
  font-size: 7px;
  font-weight: var(--font-medium);
  padding: 1px 6px;
  border-radius: var(--radius-full);
  background: color-mix(in srgb, var(--lp-accent-violet) 15%, transparent);
  color: var(--lp-accent-violet);
}

.dcal-post-status {
  font-size: 7px;
  color: var(--lp-accent-orange);
  display: flex;
  align-items: center;
  gap: 3px;
  font-weight: var(--font-medium);
}

.dcal-status-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--lp-accent-orange);
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
</style>

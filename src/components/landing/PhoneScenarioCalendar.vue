<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import MaterialIcon from '@/components/MaterialIcon.vue'

const { t } = useI18n()

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const weekPosts = [
  { day: 0, platform: 'linkedin', title: 'Traditional credentials...', color: '#0a66c2' },
  { day: 0, platform: 'facebook', title: 'Traditional credentials...', color: '#1877f2' },
  { day: 1, platform: 'twitter', title: 'On Vetted, domain experts...', color: '#000' },
  { day: 1, platform: 'facebook', title: 'On Vetted...', color: '#1877f2' },
  { day: 2, platform: 'linkedin', title: 'Why is Web3...', color: '#0a66c2' },
  { day: 2, platform: 'facebook', title: 'Why is Web3...', color: '#1877f2' },
]

const monthDays = Array.from({ length: 31 }, (_, i) => i + 1)

// Which days have posts (for month view dots)
const activeDays = [1, 3, 5, 7, 8, 10, 12, 14, 15, 17, 19, 21, 22, 24, 26, 28, 29, 31]
</script>

<template>
  <div class="scenario-calendar">
    <!-- Week View -->
    <div class="scal-week">
      <div class="scal-week-header">
        <span v-for="d in weekDays" :key="d" class="scal-day-label">{{ d }}</span>
      </div>
      <div class="scal-week-body">
        <div v-for="(d, di) in weekDays" :key="d" class="scal-day-col">
          <div
            v-for="post in weekPosts.filter(p => p.day === di)"
            :key="post.title + post.platform"
            class="scal-post"
            :style="{ '--post-color': post.color }"
          >
            <span class="scal-post-platform">{{ post.platform }}</span>
            <span class="scal-post-title">{{ post.title }}</span>
          </div>
        </div>
      </div>
      <div class="scal-view-link">
        {{ t('appLanding.cinematic.calViewFull') }}
        <MaterialIcon icon="arrow_forward" size="xs" />
      </div>
    </div>

    <!-- Month View -->
    <div class="scal-month">
      <div class="scal-month-header">
        <MaterialIcon icon="chevron_left" size="xs" />
        <span>{{ t('appLanding.cinematic.calMonthLabel') }}</span>
        <MaterialIcon icon="chevron_right" size="xs" />
      </div>
      <div class="scal-month-days-header">
        <span v-for="d in ['M', 'T', 'W', 'T', 'F', 'S', 'S']" :key="d + Math.random()">{{ d }}</span>
      </div>
      <div class="scal-month-grid">
        <!-- Leading empty cells (March 2026 starts on Sunday, so 6 empty) -->
        <div v-for="i in 6" :key="'empty-' + i" class="scal-month-cell empty" />
        <div
          v-for="day in monthDays"
          :key="day"
          class="scal-month-cell"
          :class="{ 'has-post': activeDays.includes(day) }"
        >
          <span class="scal-month-num">{{ day }}</span>
          <span v-if="activeDays.includes(day)" class="scal-month-dot" />
        </div>
      </div>

      <!-- Detail card -->
      <div class="scal-detail-card">
        <div class="scal-detail-dot" />
        <div class="scal-detail-text">
          <span class="scal-detail-title">{{ t('appLanding.cinematic.calDetailTitle') }}</span>
          <span class="scal-detail-time">10:00 AM - LinkedIn</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scenario-calendar {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--lp-bg-primary, #0d0d12);
  position: relative;
  overflow: hidden;
}

/* Week View */
.scal-week {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: var(--space-sm);
  position: absolute;
  inset: 0;
}

.scal-week-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  padding-bottom: var(--space-xs);
  border-bottom: 1px solid var(--lp-border, rgba(255,255,255,0.08));
}

.scal-day-label {
  font-size: 8px;
  font-weight: var(--font-semibold);
  color: var(--lp-text-muted);
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0;
}

.scal-week-body {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  flex: 1;
  padding-top: var(--space-xs);
}

.scal-day-col {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.scal-post {
  background: color-mix(in srgb, var(--post-color) 15%, transparent);
  border-left: 2px solid var(--post-color);
  border-radius: 3px;
  padding: 2px 4px;
  opacity: 0;
  transform: translateY(-20px);
}

.scal-post-platform {
  font-size: 7px;
  font-weight: var(--font-bold);
  color: var(--post-color);
  text-transform: uppercase;
  display: block;
}

.scal-post-title {
  font-size: 7px;
  color: var(--lp-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

.scal-view-link {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  justify-content: center;
  font-size: 9px;
  color: var(--lp-accent-orange);
  font-weight: var(--font-medium);
  padding: var(--space-xs) 0;
  opacity: 0;
}

/* Month View */
.scal-month {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  padding: var(--space-sm);
  opacity: 0;
}

.scal-month-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: var(--space-xs);
  font-size: 10px;
  font-weight: var(--font-semibold);
  color: var(--lp-text-primary);
}

.scal-month-days-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  padding-bottom: 4px;
}

.scal-month-days-header span {
  font-size: 7px;
  font-weight: var(--font-semibold);
  color: var(--lp-text-muted);
  text-align: center;
}

.scal-month-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  flex: 1;
}

.scal-month-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  padding: 2px;
}

.scal-month-cell.empty {
  visibility: hidden;
}

.scal-month-num {
  font-size: 8px;
  color: var(--lp-text-secondary);
}

.scal-month-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--lp-accent-orange);
  opacity: 0;
  transform: scale(0);
}

/* Detail card */
.scal-detail-card {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  background: var(--lp-bg-surface, rgba(255,255,255,0.06));
  border: 1px solid var(--lp-border-light, rgba(255,255,255,0.1));
  border-radius: var(--radius-md);
  padding: var(--space-sm) var(--space-md);
  margin-top: var(--space-xs);
  opacity: 0;
  transform: translateY(20px);
}

.scal-detail-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--lp-accent-orange);
  flex-shrink: 0;
}

.scal-detail-text {
  display: flex;
  flex-direction: column;
}

.scal-detail-title {
  font-size: 9px;
  font-weight: var(--font-semibold);
  color: var(--lp-text-primary);
}

.scal-detail-time {
  font-size: 8px;
  color: var(--lp-text-muted);
}
</style>

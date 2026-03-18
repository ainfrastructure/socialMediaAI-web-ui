<script setup lang="ts">
import { useI18n } from 'vue-i18n'

defineProps<{ visible: boolean }>()

const { t } = useI18n()

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const posts = [
  { day: 0, time: '09:00', title: 'Product Launch', color: '#E1306C' },
  { day: 1, time: '12:00', title: 'Behind the Scenes', color: '#1877f2' },
  { day: 2, time: '10:00', title: 'Industry Insights', color: '#0a66c2' },
  { day: 3, time: '14:00', title: 'Customer Story', color: '#E1306C' },
  { day: 4, time: '11:00', title: 'Quick Tip', color: '#000' },
  { day: 5, time: '09:00', title: 'Weekend Sale', color: '#1877f2' },
]
</script>

<template>
  <div class="lp-cal-mockup">
    <div class="lp-cal-header">
      <span class="lp-cal-month">{{ t('appLanding.calendar.thisWeek') }}</span>
      <div class="lp-cal-nav">
        <span class="lp-cal-arrow">&lsaquo;</span>
        <span class="lp-cal-arrow">&rsaquo;</span>
      </div>
    </div>

    <div class="lp-cal-grid">
      <div v-for="(day, di) in days" :key="day" class="lp-cal-column">
        <div class="lp-cal-day-label">{{ day.toUpperCase() }}</div>
        <div class="lp-cal-day-body">
          <div
            v-for="post in posts.filter(p => p.day === di)"
            :key="post.title"
            class="lp-cal-post"
            :class="{ 'is-visible': visible }"
            :style="{ '--post-color': post.color }"
          >
            <span class="lp-cal-post-time">{{ post.time }}</span>
            <span class="lp-cal-post-title">{{ post.title }}</span>
            <span class="lp-cal-post-dot" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lp-cal-mockup {
  background: var(--lp-bg-surface);
  border: 1px solid var(--lp-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
}

.lp-cal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md) var(--space-lg);
  border-bottom: 1px solid var(--lp-border);
}

.lp-cal-month {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--lp-text-primary);
}

.lp-cal-nav {
  display: flex;
  gap: var(--space-sm);
}

.lp-cal-arrow {
  font-size: var(--text-lg);
  color: var(--lp-text-muted);
  line-height: 1;
}

.lp-cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}

.lp-cal-column {
  border-right: 1px solid var(--lp-border);
}

.lp-cal-column:last-child {
  border-right: none;
}

.lp-cal-day-label {
  font-size: 9px;
  font-weight: var(--font-semibold);
  color: var(--lp-text-muted);
  letter-spacing: 0.05em;
  padding: var(--space-sm);
  border-bottom: 1px solid var(--lp-border);
  text-align: center;
}

.lp-cal-day-body {
  min-height: 90px;
  padding: 4px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.lp-cal-post {
  background: color-mix(in srgb, var(--post-color, var(--lp-accent-orange)) 12%, transparent);
  border-left: 2px solid var(--post-color, var(--lp-accent-orange));
  border-radius: var(--radius-sm);
  padding: 4px 6px;
  display: flex;
  flex-direction: column;
  gap: 1px;
  opacity: 0;
  transform: translateY(-10px);
  transition: opacity 0.4s ease, transform 0.4s ease;
}

.lp-cal-post.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.lp-cal-post:nth-child(1) { transition-delay: 0.1s; }
.lp-cal-post:nth-child(2) { transition-delay: 0.2s; }

.lp-cal-post-time {
  font-size: 8px;
  color: var(--lp-text-muted);
}

.lp-cal-post-title {
  font-size: 10px;
  font-weight: var(--font-medium);
  color: var(--lp-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lp-cal-post-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--post-color);
  align-self: flex-end;
}

@media (max-width: 768px) {
  .lp-cal-grid {
    grid-template-columns: repeat(5, 1fr);
  }

  .lp-cal-column:nth-child(n+6) {
    display: none;
  }
}
</style>

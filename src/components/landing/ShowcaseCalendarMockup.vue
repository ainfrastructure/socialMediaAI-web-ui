<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { gsap } from 'gsap'
import PlatformLogo from '@/components/PlatformLogo.vue'

const props = defineProps<{ visible: boolean }>()
const { t } = useI18n()

const containerRef = ref<HTMLElement | null>(null)

const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
const dates = [16, 17, 18, 19, 20, 21, 22]
const todayIndex = 2

const posts = [
  { platform: 'instagram' as const, type: 'reel',     day: 'Mon 10:00', titleKey: 'post1', image: '/example/cal-thumb-1.png' },
  { platform: 'facebook' as const,  type: 'feed',     day: 'Mon 14:00', titleKey: 'post2', image: '/example/cal-thumb-2.png' },
  { platform: 'instagram' as const, type: 'carousel', day: 'Tue 11:00', titleKey: 'post3', image: '/example/cal-thumb-3.png' },
  { platform: 'tiktok' as const,    type: 'reel',     day: 'Tue 18:00', titleKey: 'post4', image: '/example/cal-thumb-4.png' },
  { platform: 'facebook' as const,  type: 'feed',     day: 'Wed 10:00', titleKey: 'post5', image: '/example/cal-thumb-5.png' },
  { platform: 'instagram' as const, type: 'story',    day: 'Wed 16:00', titleKey: 'post6', image: '/example/cal-thumb-6.png' },
]

let tl: gsap.core.Timeline | null = null

function runEntrance() {
  if (!containerRef.value) return
  tl?.kill()
  tl = gsap.timeline()

  tl.fromTo(containerRef.value, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.2, ease: 'power2.out' })

  const rows = containerRef.value.querySelectorAll('.lp-cal-post')
  if (rows.length) {
    tl.fromTo(rows, { opacity: 0, x: -8 }, { opacity: 1, x: 0, duration: 0.15, stagger: 0.02, ease: 'power2.out' }, '-=0.1')
  }
}

watch(() => props.visible, (val) => {
  if (val) setTimeout(runEntrance, 60)
}, { immediate: true })

onUnmounted(() => { tl?.kill() })
</script>

<template>
  <div ref="containerRef" class="lp-cal-mockup" style="opacity: 0">
    <!-- Header -->
    <div class="lp-cal-header">
      <div class="lp-cal-header-left">
        <svg class="lp-cal-icon" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z" />
        </svg>
        <span class="lp-cal-title">{{ t('appLanding.calendar.weekSchedule') }}</span>
      </div>
      <span class="lp-cal-count">{{ posts.length }}</span>
    </div>

    <!-- Day strip -->
    <div class="lp-cal-days">
      <div
        v-for="(day, i) in days"
        :key="day"
        class="lp-cal-day"
        :class="{ 'lp-cal-day-active': i === todayIndex }"
      >
        <span class="lp-cal-day-name">{{ day }}</span>
        <span v-if="i === todayIndex" class="lp-cal-today">{{ dates[i] }}</span>
        <span v-else class="lp-cal-date">{{ dates[i] }}</span>
      </div>
    </div>

    <!-- Post list -->
    <div class="lp-cal-posts">
      <div v-for="(post, i) in posts" :key="i" class="lp-cal-post">
        <div class="lp-cal-thumb">
          <img :src="post.image" alt="" class="lp-cal-thumb-img" loading="lazy" />
        </div>
        <div class="lp-cal-post-info">
          <div class="lp-cal-post-meta">
            <PlatformLogo :platform="post.platform" :size="18" />
            <span class="lp-cal-post-type">{{ t(`appLanding.calendar.types.${post.type}`) }}</span>
            <span class="lp-cal-post-time">{{ post.day }}</span>
          </div>
          <span class="lp-cal-post-title">{{ t(`appLanding.calendar.${post.titleKey}`) }}</span>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="lp-cal-footer">
      <span>{{ t('appLanding.calendar.viewFull') }}</span>
      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z" />
      </svg>
    </div>
  </div>
</template>

<style scoped>
.lp-cal-mockup {
  background: var(--lp-bg-surface);
  border: 1px solid var(--lp-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
  max-width: 460px;
}

/* Header */
.lp-cal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-lg) var(--space-xl);
  border-bottom: 1px solid var(--lp-border);
}

.lp-cal-header-left {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.lp-cal-icon {
  color: var(--lp-text-muted);
}

.lp-cal-title {
  font-size: var(--text-sm);
  font-weight: var(--font-bold);
  color: var(--lp-text-primary);
}

.lp-cal-count {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: rgba(249, 115, 22, 0.15);
  color: var(--lp-accent-orange);
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Day strip */
.lp-cal-days {
  display: flex;
  justify-content: space-between;
  padding: var(--space-lg) var(--space-xl);
  border-bottom: 1px solid var(--lp-border);
}

.lp-cal-day {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex: 1;
}

.lp-cal-day-name {
  font-size: 10px;
  font-weight: var(--font-semibold);
  color: var(--lp-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.lp-cal-day-active .lp-cal-day-name {
  color: var(--lp-accent-orange);
}

.lp-cal-date {
  font-size: var(--text-sm);
  color: var(--lp-text-secondary);
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lp-cal-today {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--lp-accent-orange);
  color: #fff;
  font-size: var(--text-sm);
  font-weight: var(--font-bold);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 12px rgba(249, 115, 22, 0.35);
}

/* Post list */
.lp-cal-posts {
  padding: var(--space-md) var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.lp-cal-post {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-sm) var(--space-sm);
  border-radius: var(--radius-lg);
  transition: background 0.2s ease;
}

.lp-cal-post:hover {
  background: var(--lp-bg-elevated);
}

.lp-cal-thumb {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  overflow: hidden;
  flex-shrink: 0;
}

.lp-cal-thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.lp-cal-post-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.lp-cal-post-meta {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.lp-cal-post-type {
  font-size: var(--text-xs);
  color: var(--lp-text-secondary);
  font-weight: var(--font-medium);
}

.lp-cal-post-time {
  font-size: var(--text-xs);
  color: var(--lp-text-muted);
  margin-left: auto;
}

.lp-cal-post-title {
  font-size: var(--text-xs);
  color: var(--lp-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Footer */
.lp-cal-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
  padding: var(--space-lg) var(--space-xl);
  border-top: 1px solid var(--lp-border);
  color: var(--lp-accent-orange);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.lp-cal-footer:hover {
  opacity: 0.8;
}

@media (max-width: 768px) {
  .lp-cal-mockup {
    max-width: 100%;
  }
}
</style>

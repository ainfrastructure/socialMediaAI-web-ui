<template>
  <div class="content-calendar">
    <!-- Week Navigation Header -->
    <div class="calendar-nav">
      <button class="nav-btn" @click="navigateWeek(-1)" aria-label="Previous week">
        <span class="nav-icon">←</span>
      </button>
      <div class="nav-center">
        <h2 class="nav-title">{{ weekLabel }}</h2>
        <button class="today-btn" @click="goToToday" aria-label="Go to today">
          Today
        </button>
      </div>
      <button class="nav-btn" @click="navigateWeek(1)" aria-label="Next week">
        <span class="nav-icon">→</span>
      </button>
    </div>

    <!-- Time Grid -->
    <div class="calendar-grid" role="grid" aria-label="Weekly content calendar">
      <!-- Day Headers Row -->
      <div class="grid-header">
        <div class="time-gutter-header" aria-hidden="true"></div>
        <div
          v-for="day in weekDays"
          :key="day.dateKey"
          :class="['day-header', { 'is-today': day.isToday }]"
          role="columnheader"
        >
          <span class="day-name">{{ day.shortName }}</span>
          <span :class="['day-number', { 'today-badge': day.isToday }]">
            {{ day.dayNumber }}
          </span>
        </div>
      </div>

      <!-- Scrollable Time Slots Area -->
      <div class="grid-body" ref="gridBodyRef">
        <div
          v-for="hour in visibleHours"
          :key="hour"
          class="time-row"
          role="row"
        >
          <!-- Time Label -->
          <div class="time-gutter" aria-hidden="true">
            <span class="time-label">{{ formatHourLabel(hour) }}</span>
          </div>

          <!-- Day Cells for this hour -->
          <div
            v-for="day in weekDays"
            :key="`${day.dateKey}-${hour}`"
            :class="['time-cell', { 'is-today-col': day.isToday }]"
            role="gridcell"
            :aria-label="`${day.shortName} ${day.dayNumber}, ${formatHourLabel(hour)}`"
          >
            <!-- Scheduled Posts -->
            <div
              v-for="post in getPostsForSlot(day.dateKey, hour)"
              :key="post.id"
              :class="['post-block', `platform-${post.platform}`]"
              :style="{ borderLeftColor: platformColors[post.platform] }"
              @click="$emit('post-click', post)"
              :tabindex="0"
              role="button"
              :aria-label="`${post.platform} post at ${formatPostTime(post.scheduledTime)}: ${post.previewText}`"
              @keydown.enter="$emit('post-click', post)"
            >
              <div class="post-block-header">
                <PlatformLogo
                  :platform="post.platform"
                  :size="20"
                  :show-background="true"
                />
                <span class="post-time">{{ formatPostTime(post.scheduledTime) }}</span>
              </div>
              <p class="post-preview">{{ truncateText(post.previewText, 60) }}</p>
            </div>

            <!-- Add Post Button (shown on empty slots) -->
            <button
              v-if="getPostsForSlot(day.dateKey, hour).length === 0"
              class="add-post-btn"
              @click="$emit('add-post', { date: day.dateKey, hour })"
              :aria-label="`Add post on ${day.shortName} ${day.dayNumber} at ${formatHourLabel(hour)}`"
            >
              <span class="add-icon">+</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Legend -->
    <div class="calendar-legend" aria-label="Platform legend">
      <div
        v-for="platform in platforms"
        :key="platform.key"
        class="legend-item"
      >
        <span
          class="legend-dot"
          :style="{ background: platformColors[platform.key] }"
        ></span>
        <span class="legend-label">{{ platform.label }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import PlatformLogo from '../PlatformLogo.vue'
import { useScheduleTime } from '@/composables/useScheduleTime'

// ── Types ──────────────────────────────────────────────────

type SupportedPlatform = 'instagram' | 'facebook' | 'twitter' | 'linkedin'

interface ScheduledPost {
  id: string
  platform: SupportedPlatform
  previewText: string
  scheduledTime: Date
  status: 'scheduled' | 'published' | 'failed'
}

interface WeekDay {
  date: Date
  dateKey: string
  shortName: string
  dayNumber: number
  isToday: boolean
}

interface PlatformInfo {
  key: SupportedPlatform
  label: string
}

// ── Emits ──────────────────────────────────────────────────

defineEmits<{
  (e: 'post-click', post: ScheduledPost): void
  (e: 'add-post', slot: { date: string; hour: number }): void
}>()

// ── Composables ────────────────────────────────────────────

const { formatTime12 } = useScheduleTime()

// ── State ──────────────────────────────────────────────────

const currentWeekStart = ref<Date>(getMonday(new Date()))
const gridBodyRef = ref<HTMLElement | null>(null)

// ── Constants ──────────────────────────────────────────────

const platformColors: Record<SupportedPlatform, string> = {
  instagram: '#dd2a7b',
  facebook: '#1877f2',
  twitter: '#000000',
  linkedin: '#0a66c2',
}

const platforms: PlatformInfo[] = [
  { key: 'instagram', label: 'Instagram' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'twitter', label: 'X / Twitter' },
  { key: 'linkedin', label: 'LinkedIn' },
]

/** Business hours: 6 AM – 10 PM */
const visibleHours = Array.from({ length: 17 }, (_, i) => i + 6)

// Scroll to current hour on mount
onMounted(async () => {
  await nextTick()
  if (gridBodyRef.value) {
    const now = new Date()
    const currentHour = now.getHours()
    // Find the index of the current hour in visible range, or closest
    const hourIndex = Math.max(0, Math.min(currentHour - 6, visibleHours.length - 1))
    // Each row is ~72px min-height
    const scrollTarget = Math.max(0, (hourIndex - 1) * 72)
    gridBodyRef.value.scrollTop = scrollTarget
  }
})

// ── Mock Data ──────────────────────────────────────────────

const mockPosts = computed<ScheduledPost[]>(() => {
  const monday = currentWeekStart.value
  return [
    {
      id: 'post-1',
      platform: 'instagram',
      previewText: '🌅 Rise and grind! New product launch coming this week. Stay tuned for something special…',
      scheduledTime: createDateTime(monday, 0, 9, 0),
      status: 'scheduled',
    },
    {
      id: 'post-2',
      platform: 'facebook',
      previewText: 'Behind the scenes of our latest photoshoot 📸 Check out the full gallery on our website!',
      scheduledTime: createDateTime(monday, 0, 11, 30),
      status: 'scheduled',
    },
    {
      id: 'post-3',
      platform: 'twitter',
      previewText: 'Just shipped v2.0 of our app! Faster, cleaner, and packed with new features. Thread 🧵👇',
      scheduledTime: createDateTime(monday, 1, 10, 0),
      status: 'scheduled',
    },
    {
      id: 'post-4',
      platform: 'linkedin',
      previewText: 'Excited to announce we\'re hiring! Looking for talented engineers to join our growing team.',
      scheduledTime: createDateTime(monday, 1, 14, 0),
      status: 'scheduled',
    },
    {
      id: 'post-5',
      platform: 'instagram',
      previewText: 'Midweek motivation 💪 Our team at the annual offsite. Culture is everything.',
      scheduledTime: createDateTime(monday, 2, 12, 0),
      status: 'scheduled',
    },
    {
      id: 'post-6',
      platform: 'facebook',
      previewText: 'Customer spotlight: How @AcmeCorp increased engagement by 300% using our platform.',
      scheduledTime: createDateTime(monday, 3, 9, 0),
      status: 'published',
    },
    {
      id: 'post-7',
      platform: 'twitter',
      previewText: 'Hot take: Consistency beats virality every single time. Here\'s why…',
      scheduledTime: createDateTime(monday, 3, 16, 0),
      status: 'scheduled',
    },
    {
      id: 'post-8',
      platform: 'linkedin',
      previewText: 'Q1 results are in and we\'re thrilled. Revenue up 40% YoY. Here\'s what we learned.',
      scheduledTime: createDateTime(monday, 4, 8, 0),
      status: 'scheduled',
    },
    {
      id: 'post-9',
      platform: 'instagram',
      previewText: 'Weekend vibes incoming 🏖️ What are your plans? Drop a comment below!',
      scheduledTime: createDateTime(monday, 5, 15, 0),
      status: 'scheduled',
    },
    {
      id: 'post-10',
      platform: 'facebook',
      previewText: 'Sunday reading list: 5 articles every marketer should read this month 📚',
      scheduledTime: createDateTime(monday, 6, 10, 0),
      status: 'scheduled',
    },
  ]
})

// ── Computed ───────────────────────────────────────────────

const weekDays = computed<WeekDay[]>(() => {
  const days: WeekDay[] = []
  const today = new Date()
  const todayStr = toDateKey(today)
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  for (let i = 0; i < 7; i++) {
    const date = new Date(currentWeekStart.value)
    date.setDate(date.getDate() + i)
    const dateKey = toDateKey(date)
    days.push({
      date,
      dateKey,
      shortName: dayNames[i],
      dayNumber: date.getDate(),
      isToday: dateKey === todayStr,
    })
  }
  return days
})

const weekLabel = computed(() => {
  const start = weekDays.value[0]
  const end = weekDays.value[6]
  const startMonth = start.date.toLocaleString('default', { month: 'short' })
  const endMonth = end.date.toLocaleString('default', { month: 'short' })
  const year = end.date.getFullYear()

  if (startMonth === endMonth) {
    return `${start.dayNumber} – ${end.dayNumber} ${startMonth} ${year}`
  }
  return `${start.dayNumber} ${startMonth} – ${end.dayNumber} ${endMonth} ${year}`
})

// ── Post Lookup (indexed by slot key) ──────────────────────

const postsBySlot = computed(() => {
  const map = new Map<string, ScheduledPost[]>()
  for (const post of mockPosts.value) {
    const dateKey = toDateKey(post.scheduledTime)
    const hour = post.scheduledTime.getHours()
    const key = `${dateKey}-${hour}`
    if (!map.has(key)) {
      map.set(key, [])
    }
    map.get(key)!.push(post)
  }
  return map
})

// ── Methods ────────────────────────────────────────────────

function getPostsForSlot(dateKey: string, hour: number): ScheduledPost[] {
  return postsBySlot.value.get(`${dateKey}-${hour}`) ?? []
}

function navigateWeek(direction: number): void {
  const next = new Date(currentWeekStart.value)
  next.setDate(next.getDate() + direction * 7)
  currentWeekStart.value = next
}

function goToToday(): void {
  currentWeekStart.value = getMonday(new Date())
}

function formatHourLabel(hour: number): string {
  return formatTime12(hour, 0)
}

function formatPostTime(date: Date): string {
  return formatTime12(date.getHours(), date.getMinutes())
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength).trimEnd() + '…'
}

// ── Helpers ────────────────────────────────────────────────

function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  // JS getDay: 0=Sun, 1=Mon ... 6=Sat → offset to Monday
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function createDateTime(monday: Date, dayOffset: number, hour: number, minute: number): Date {
  const d = new Date(monday)
  d.setDate(d.getDate() + dayOffset)
  d.setHours(hour, minute, 0, 0)
  return d
}
</script>

<style scoped>
/* ===== Container ===== */
.content-calendar {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  font-family: var(--font-body);
}

/* ===== Navigation ===== */
.calendar-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md) 0;
}

.nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: var(--glass-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--text-primary);
}

.nav-btn:hover {
  background: rgba(15, 61, 46, 0.08);
  border-color: var(--border-hover);
  transform: scale(1.05);
}

.nav-btn:focus-visible {
  outline: 2px solid var(--gold-primary);
  outline-offset: 2px;
}

.nav-icon {
  font-size: var(--text-lg);
}

.nav-center {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
}

.nav-title {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0;
}

.today-btn {
  padding: var(--space-xs) var(--space-lg);
  background: var(--gold-subtle);
  color: var(--gold-primary);
  border: 1px solid rgba(26, 77, 58, 0.2);
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: all 0.2s ease;
}

.today-btn:hover {
  background: var(--gold-primary);
  color: var(--text-on-gold);
}

.today-btn:focus-visible {
  outline: 2px solid var(--gold-primary);
  outline-offset: 2px;
}

/* ===== Grid Container ===== */
.calendar-grid {
  background: var(--glass-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-md);
}

/* ===== Grid Header (Day Names) ===== */
.grid-header {
  display: grid;
  grid-template-columns: 64px repeat(7, 1fr);
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: 2;
  background: var(--glass-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.time-gutter-header {
  border-right: 1px solid var(--border-color);
}

.day-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-md) var(--space-sm);
  border-right: 1px solid var(--border-color);
  transition: background 0.2s ease;
}

.day-header:last-child {
  border-right: none;
}

.day-header.is-today {
  background: var(--gold-subtle);
}

.day-name {
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.day-number {
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
}

.today-badge {
  background: var(--gold-primary);
  color: var(--text-on-gold);
}

/* ===== Grid Body (Time Rows) ===== */
.grid-body {
  max-height: 600px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--border-color) transparent;
}

.grid-body::-webkit-scrollbar {
  width: 6px;
}

.grid-body::-webkit-scrollbar-track {
  background: transparent;
}

.grid-body::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: var(--radius-full);
}

.time-row {
  display: grid;
  grid-template-columns: 64px repeat(7, 1fr);
  min-height: 72px;
  border-bottom: 1px solid var(--border-color);
}

.time-row:last-child {
  border-bottom: none;
}

/* ===== Time Gutter ===== */
.time-gutter {
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  padding: var(--space-xs) var(--space-sm) 0 0;
  border-right: 1px solid var(--border-color);
  position: relative;
}

.time-label {
  font-size: var(--text-xs);
  color: var(--text-muted);
  font-weight: var(--font-medium);
  transform: translateY(-50%);
  white-space: nowrap;
}

/* ===== Time Cells ===== */
.time-cell {
  position: relative;
  border-right: 1px solid var(--border-color);
  padding: var(--space-xs);
  min-height: 72px;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  transition: background 0.15s ease;
}

.time-cell:last-child {
  border-right: none;
}

.time-cell.is-today-col {
  background: rgba(26, 77, 58, 0.03);
}

.time-cell:hover {
  background: rgba(26, 77, 58, 0.04);
}

/* ===== Post Blocks ===== */
.post-block {
  background: var(--bg-secondary);
  border-left: 3px solid transparent;
  border-radius: var(--radius-md);
  padding: var(--space-xs) var(--space-sm);
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.post-block:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.post-block:focus-visible {
  outline: 2px solid var(--gold-primary);
  outline-offset: 1px;
}

/* Platform-specific subtle backgrounds */
.post-block.platform-instagram {
  background: linear-gradient(135deg, rgba(221, 42, 123, 0.08), rgba(129, 52, 175, 0.06));
}

.post-block.platform-facebook {
  background: linear-gradient(135deg, rgba(24, 119, 242, 0.08), rgba(13, 93, 191, 0.06));
}

.post-block.platform-twitter {
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.06), rgba(0, 0, 0, 0.04));
}

.post-block.platform-linkedin {
  background: linear-gradient(135deg, rgba(10, 102, 194, 0.08), rgba(10, 102, 194, 0.06));
}

.post-block-header {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  margin-bottom: 2px;
}

.post-time {
  font-size: 10px;
  font-weight: var(--font-semibold);
  color: var(--text-secondary);
  white-space: nowrap;
}

.post-preview {
  font-size: 11px;
  line-height: 1.3;
  color: var(--text-muted);
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ===== Add Post Button ===== */
.add-post-btn {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.time-cell:hover .add-post-btn {
  opacity: 1;
}

.add-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-full);
  background: var(--gold-subtle);
  color: var(--gold-primary);
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  transition: all 0.2s ease;
}

.add-post-btn:hover .add-icon {
  background: var(--gold-primary);
  color: var(--text-on-gold);
  transform: scale(1.1);
}

.add-post-btn:focus-visible .add-icon {
  outline: 2px solid var(--gold-primary);
  outline-offset: 2px;
}

/* ===== Legend ===== */
.calendar-legend {
  display: flex;
  align-items: center;
  gap: var(--space-xl);
  padding: var(--space-sm) 0;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: var(--radius-full);
  flex-shrink: 0;
}

.legend-label {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  font-weight: var(--font-medium);
}

/* ===== Responsive ===== */
@media (max-width: 768px) {
  .grid-header,
  .time-row {
    grid-template-columns: 48px repeat(7, 1fr);
  }

  .nav-title {
    font-size: var(--text-base);
  }

  .time-label {
    font-size: 10px;
  }

  .day-name {
    font-size: 10px;
  }

  .day-number {
    font-size: var(--text-base);
    width: 28px;
    height: 28px;
  }

  .post-preview {
    display: none;
  }

  .post-time {
    font-size: 9px;
  }

  .calendar-legend {
    flex-wrap: wrap;
    gap: var(--space-md);
  }
}

@media (max-width: 480px) {
  .grid-header,
  .time-row {
    grid-template-columns: 40px repeat(7, 1fr);
  }

  .time-cell {
    padding: 2px;
    min-height: 56px;
  }

  .post-block {
    padding: 2px 3px;
  }

  .post-block-header {
    gap: 2px;
  }
}

/* ===== Reduced Motion ===== */
@media (prefers-reduced-motion: reduce) {
  .post-block,
  .nav-btn,
  .today-btn,
  .add-icon,
  .time-cell,
  .add-post-btn {
    transition: none;
  }

  .post-block:hover {
    transform: none;
  }

  .nav-btn:hover {
    transform: none;
  }

  .add-post-btn:hover .add-icon {
    transform: none;
  }
}

/* ===== Dark Mode ===== */
:root[data-theme="dark"] .calendar-grid {
  background: var(--glass-bg);
  border-color: var(--border-color);
}

:root[data-theme="dark"] .grid-header {
  background: var(--bg-tertiary);
}

:root[data-theme="dark"] .nav-btn {
  background: var(--bg-tertiary);
  border-color: var(--border-color);
}

:root[data-theme="dark"] .nav-btn:hover {
  background: var(--bg-elevated);
  border-color: var(--border-hover);
}

:root[data-theme="dark"] .post-block {
  background: var(--bg-tertiary);
}

:root[data-theme="dark"] .post-block.platform-instagram {
  background: linear-gradient(135deg, rgba(221, 42, 123, 0.15), rgba(129, 52, 175, 0.1));
}

:root[data-theme="dark"] .post-block.platform-facebook {
  background: linear-gradient(135deg, rgba(24, 119, 242, 0.15), rgba(13, 93, 191, 0.1));
}

:root[data-theme="dark"] .post-block.platform-twitter {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.06));
}

:root[data-theme="dark"] .post-block.platform-linkedin {
  background: linear-gradient(135deg, rgba(10, 102, 194, 0.15), rgba(10, 102, 194, 0.1));
}

:root[data-theme="dark"] .today-btn {
  background: var(--gold-subtle);
  border-color: rgba(26, 77, 58, 0.3);
}
</style>

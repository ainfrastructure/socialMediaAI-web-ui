<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import MaterialIcon from '@/components/MaterialIcon.vue'
import SocialChefMark from '@/components/SocialChefMark.vue'
import PlatformLogo from '@/components/PlatformLogo.vue'

const { t } = useI18n()

/* ── Steps data ─────────────────────────────────────── */
interface Step {
  num: string
  icon: string
  titleKey: string
  descKey: string
  tabLabelKey: string
  pillKeys: string[]
}

const steps: Step[] = [
  {
    num: '01', icon: 'chat',
    titleKey: 'appLanding.aiCreation.promptTitle',
    descKey: 'appLanding.aiCreation.promptDesc',
    tabLabelKey: 'appLanding.aiCreation.promptTab',
    pillKeys: ['appLanding.aiCreation.promptPill1', 'appLanding.aiCreation.promptPill2', 'appLanding.aiCreation.promptPill3'],
  },
  {
    num: '02', icon: 'auto_awesome',
    titleKey: 'appLanding.aiCreation.generateTitle',
    descKey: 'appLanding.aiCreation.generateDesc',
    tabLabelKey: 'appLanding.aiCreation.generateTab',
    pillKeys: ['appLanding.aiCreation.generatePill1', 'appLanding.aiCreation.generatePill2', 'appLanding.aiCreation.generatePill3'],
  },
  {
    num: '03', icon: 'devices',
    titleKey: 'appLanding.aiCreation.adaptTitle',
    descKey: 'appLanding.aiCreation.adaptDesc',
    tabLabelKey: 'appLanding.aiCreation.adaptTab',
    pillKeys: ['appLanding.aiCreation.adaptPill1', 'appLanding.aiCreation.adaptPill2', 'appLanding.aiCreation.adaptPill3', 'appLanding.aiCreation.adaptPill4'],
  },
  {
    num: '04', icon: 'calendar_month',
    titleKey: 'appLanding.aiCreation.scheduleTitle',
    descKey: 'appLanding.aiCreation.scheduleDesc',
    tabLabelKey: 'appLanding.aiCreation.scheduleTab',
    pillKeys: ['appLanding.aiCreation.schedulePill1', 'appLanding.aiCreation.schedulePill2', 'appLanding.aiCreation.schedulePill3'],
  },
]

/* ── State ──────────────────────────────────────────── */
const DURATION = 6000
const current = ref(0)
const progress = ref(0)
const paused = ref(false)
const leftKey = ref(0)
const calFilled = ref([false, false, false, false, false])
const badgeScheduled = ref(false)
const badgePublished = ref(false)
const fanOpen = ref(false)
const sectionRef = ref<HTMLElement | null>(null)
const typedText = ref('')

/* ── rAF engine ─────────────────────────────────────── */
let rafId = 0
let startTs = 0
let accumulated = 0
let pauseStart = 0

function tick(ts: number) {
  if (paused.value) { rafId = requestAnimationFrame(tick); return }
  const elapsed = ts - startTs - accumulated
  const pct = Math.min((elapsed / DURATION) * 100, 100)
  progress.value = pct
  if (pct >= 100) activate((current.value + 1) % steps.length)
  else rafId = requestAnimationFrame(tick)
}

function startTimer() {
  cancelAnimationFrame(rafId)
  startTs = performance.now()
  accumulated = 0
  progress.value = 0
  rafId = requestAnimationFrame(tick)
}

let fanTimeout: ReturnType<typeof setTimeout> | null = null

function activate(i: number, manual = false) {
  if (i === current.value && !manual) return
  current.value = i
  leftKey.value++
  progress.value = 0
  clearCalAnim()
  clearTypeAnim()
  clearFanAnim()
  if (i === 0) startTypeAnim()
  if (i === 2) startFanAnim()
  if (i === 3) startCalAnim()
  startTimer()
}

function startFanAnim() {
  fanOpen.value = false
  // Wait for out-in transition: leave (180ms) + enter (300ms) before fanning
  fanTimeout = setTimeout(() => { fanOpen.value = true }, 550)
}

function clearFanAnim() {
  if (fanTimeout) { clearTimeout(fanTimeout); fanTimeout = null }
  fanOpen.value = false
}

/* ── Hover pause ────────────────────────────────────── */
function onEnter() { paused.value = true; pauseStart = performance.now() }
function onLeave() {
  if (pauseStart) { accumulated += performance.now() - pauseStart; pauseStart = 0 }
  paused.value = false
  rafId = requestAnimationFrame(tick)
}

/* ── Typing animation (step 0) ──────────────────────── */
let typeInterval: ReturnType<typeof setInterval> | null = null

function startTypeAnim() {
  typedText.value = ''
  const fullText = t('appLanding.aiCreation.chatTyping')
  let idx = 0
  typeInterval = setInterval(() => {
    if (idx < fullText.length) { typedText.value = fullText.slice(0, ++idx) }
    else { clearInterval(typeInterval!); typeInterval = null }
  }, 45)
}

function clearTypeAnim() {
  if (typeInterval) { clearInterval(typeInterval); typeInterval = null }
  typedText.value = ''
}

/* ── Calendar animation (step 3) ────────────────────── */
let calInterval: ReturnType<typeof setInterval> | null = null
let badgeTimeout1: ReturnType<typeof setTimeout> | null = null
let badgeTimeout2: ReturnType<typeof setTimeout> | null = null

function startCalAnim() {
  calFilled.value = [false, false, false, false, false]
  badgeScheduled.value = false
  badgePublished.value = false
  let idx = 0
  calInterval = setInterval(() => {
    if (idx < 5) { calFilled.value[idx] = true; idx++ }
    else {
      clearInterval(calInterval!); calInterval = null
      badgeTimeout1 = setTimeout(() => { badgeScheduled.value = true }, 200)
      badgeTimeout2 = setTimeout(() => { badgePublished.value = true }, 600)
    }
  }, 280)
}

function clearCalAnim() {
  if (calInterval) { clearInterval(calInterval); calInterval = null }
  if (badgeTimeout1) { clearTimeout(badgeTimeout1); badgeTimeout1 = null }
  if (badgeTimeout2) { clearTimeout(badgeTimeout2); badgeTimeout2 = null }
  calFilled.value = [false, false, false, false, false]
  badgeScheduled.value = false
  badgePublished.value = false
}

/* ── Intersection + visibility ──────────────────────── */
let observer: IntersectionObserver | null = null
let isVisible = true

function onVisChange() {
  if (document.hidden) { paused.value = true; pauseStart = performance.now() }
  else if (isVisible) {
    if (pauseStart) { accumulated += performance.now() - pauseStart; pauseStart = 0 }
    paused.value = false
    rafId = requestAnimationFrame(tick)
  }
}

onMounted(() => {
  activate(0, true)
  observer = new IntersectionObserver(([entry]) => {
    isVisible = entry.isIntersecting
    if (!isVisible) { paused.value = true; pauseStart = performance.now() }
    else if (!document.hidden) {
      if (pauseStart) { accumulated += performance.now() - pauseStart; pauseStart = 0 }
      paused.value = false
      rafId = requestAnimationFrame(tick)
    }
  }, { threshold: 0.15 })
  if (sectionRef.value) observer.observe(sectionRef.value)
  document.addEventListener('visibilitychange', onVisChange)
})

onUnmounted(() => {
  cancelAnimationFrame(rafId)
  clearCalAnim()
  clearTypeAnim()
  clearFanAnim()
  observer?.disconnect()
  document.removeEventListener('visibilitychange', onVisChange)
})

const dayKeys = [
  'appLanding.aiCreation.dayMon', 'appLanding.aiCreation.dayTue',
  'appLanding.aiCreation.dayWed', 'appLanding.aiCreation.dayThu',
  'appLanding.aiCreation.dayFri',
]
</script>

<template>
  <section ref="sectionRef" class="cp-section">
    <!-- Header -->
    <p class="cp-eyebrow">{{ t('appLanding.aiCreation.eyebrow') }}</p>
    <h2 class="cp-title">{{ t('appLanding.aiCreation.title') }}</h2>
    <p class="cp-subtitle">{{ t('appLanding.aiCreation.subtitle') }}</p>

    <!-- Tab nav -->
    <nav class="cp-tabs" role="tablist">
      <button
        v-for="(step, i) in steps"
        :key="step.num"
        class="cp-tab"
        :class="{ active: current === i }"
        role="tab"
        :aria-selected="current === i"
        :aria-label="t(step.tabLabelKey)"
        @click="activate(i, true)"
      >
        <span class="cp-tab-num">{{ step.num }}</span>
        <MaterialIcon :icon="step.icon" size="sm" />
        <span class="cp-tab-label">{{ t(step.tabLabelKey) }}</span>
        <span v-if="current === i" class="cp-tab-bar" :style="{ width: progress + '%' }" />
      </button>
    </nav>

    <!-- Stage: contained left text + right mockup -->
    <div class="cp-stage" @mouseenter="onEnter" @mouseleave="onLeave">
      <div class="cp-orb cp-orb-1" />
      <div class="cp-orb cp-orb-2" />
      <span class="cp-pause-hint" :class="{ visible: paused }">
        &#x23F8; {{ t('appLanding.aiCreation.pauseHint') }}
      </span>

      <!-- Left panel — re-animated via :key -->
      <div class="cp-left" :key="leftKey" aria-live="polite">
        <div class="cp-step-num">{{ steps[current].num }}</div>
        <h3 class="cp-step-h">{{ t(steps[current].titleKey) }}</h3>
        <p class="cp-step-p">{{ t(steps[current].descKey) }}</p>
        <div class="cp-pills">
          <span v-for="pill in steps[current].pillKeys" :key="pill" class="cp-pill">
            {{ t(pill) }}
          </span>
        </div>
      </div>

      <!-- Right panel — mockup with Vue Transition -->
      <div class="cp-right">
        <Transition name="mock" mode="out-in">
          <!-- ═══ Step 0: Chat ═══ -->
          <div v-if="current === 0" key="s0" class="cp-mock cp-mock-chat">
            <div class="cp-chat-header">
              <SocialChefMark :size="22" />
              <span class="cp-chat-name">SocialChef</span>
            </div>
            <div class="cp-chat-body">
              <div class="cp-chat-msg">
                <div class="cp-chat-avatar">
                  <SocialChefMark :size="14" />
                </div>
                <div class="cp-chat-bubble">
                  {{ t('appLanding.aiCreation.promptGreeting') }}
                </div>
              </div>
              <div class="cp-suggestion">
                <img src="/example/example-pizza.jpg" alt="" class="cp-suggestion-img" loading="lazy" />
                <div class="cp-suggestion-body">
                  <p class="cp-suggestion-text">{{ t('appLanding.aiCreation.promptSuggestionCaption') }}</p>
                  <span class="cp-tone-badge">
                    <MaterialIcon icon="verified" size="xs" />
                    {{ t('appLanding.aiCreation.promptToneBadge') }}
                  </span>
                </div>
              </div>
              <div class="cp-chat-actions">
                <button class="cp-btn cp-btn-accent" tabindex="-1">{{ t('appLanding.aiCreation.chatUseThis') }}</button>
                <button class="cp-btn" tabindex="-1">{{ t('appLanding.aiCreation.chatRegenerate') }}</button>
                <button class="cp-btn" tabindex="-1">{{ t('appLanding.aiCreation.postEdit') }}</button>
              </div>
            </div>
            <div class="cp-chat-input-row">
              <span v-if="typedText" class="cp-input-typed">{{ typedText }}</span>
              <span v-else class="cp-input-text">{{ t('appLanding.aiCreation.postInputPlaceholder') }}</span>
              <span class="cp-cursor-blink" />
            </div>
          </div>

          <!-- ═══ Step 1: Post Editor ═══ -->
          <div v-else-if="current === 1" key="s1" class="cp-mock cp-gen-container">
            <div class="cp-gen-header">
              <span class="cp-mac-dot" /><span class="cp-mac-dot" /><span class="cp-mac-dot" />
              <span class="cp-gen-title">{{ t('appLanding.aiCreation.genEditorTitle') }}</span>
            </div>
            <div class="cp-gen-tabs">
              <span class="cp-gen-tab active">{{ t('appLanding.aiCreation.postTabFeed') }}</span>
              <span class="cp-gen-tab">{{ t('appLanding.aiCreation.postTabReel') }}</span>
              <span class="cp-gen-tab">{{ t('appLanding.aiCreation.postTabStory') }}</span>
              <span class="cp-gen-tab">{{ t('appLanding.aiCreation.postTabCarousel') }}</span>
            </div>
            <div class="cp-gen-brand">
              <img src="/example/jungelpizza-logo.jpeg" alt="" class="cp-brand-avatar" loading="lazy" />
              <div>
                <span class="cp-brand-name">Jungel Pizza</span>
                <span class="cp-brand-time">{{ t('appLanding.aiCreation.postTimestamp') }}</span>
              </div>
            </div>
            <img src="/example/example-pizza.jpg" alt="" class="cp-gen-image" loading="lazy" />
            <div class="cp-gen-caption">
              <span class="cp-tone-badge sm">
                <MaterialIcon icon="verified" size="xs" />
                {{ t('appLanding.aiCreation.postToneBadge') }}
              </span>
              <p>{{ t('appLanding.aiCreation.postCaption') }}</p>
              <div class="cp-hashtags">
                <span class="cp-hashtag">#Pizza</span>
                <span class="cp-hashtag">#FridayVibes</span>
                <span class="cp-hashtag">#JungelPizza</span>
                <span class="cp-hashtag">#Foodie</span>
              </div>
            </div>
            <div class="cp-gen-actions">
              <button class="cp-btn cp-btn-accent" tabindex="-1">{{ t('appLanding.aiCreation.postPublishNow') }}</button>
              <button class="cp-btn" tabindex="-1">{{ t('appLanding.aiCreation.postSchedule') }}</button>
              <button class="cp-btn" tabindex="-1">{{ t('appLanding.aiCreation.postEdit') }}</button>
            </div>
          </div>

          <!-- ═══ Step 2: Platform Fan ═══ -->
          <div v-else-if="current === 2" key="s2" class="cp-mock-center">
            <div class="cp-platform-fan" :class="{ open: fanOpen }">
              <div class="cp-platform-card">
                <PlatformLogo platform="instagram" :size="20" />
                <img src="/example/example-pizza.jpg" alt="" class="cp-platform-img" loading="lazy" />
                <div class="cp-platform-lines"><span class="cp-line w60" /><span class="cp-line w40" /></div>
                <span class="cp-platform-label">Instagram</span>
              </div>
              <div class="cp-platform-card center">
                <PlatformLogo platform="facebook" :size="20" />
                <img src="/example/example-pizza.jpg" alt="" class="cp-platform-img" loading="lazy" />
                <div class="cp-platform-lines"><span class="cp-line w80" /><span class="cp-line w50" /></div>
                <span class="cp-platform-label">Facebook</span>
                <span class="cp-check-badge">&#x2713;</span>
              </div>
              <div class="cp-platform-card">
                <PlatformLogo platform="linkedin" :size="20" />
                <img src="/example/example-pizza.jpg" alt="" class="cp-platform-img" loading="lazy" />
                <div class="cp-platform-lines"><span class="cp-line w70" /><span class="cp-line w45" /></div>
                <span class="cp-platform-label">LinkedIn</span>
              </div>
            </div>
            <div class="cp-adapt-footer" :class="{ open: fanOpen }">
              <p class="cp-adapt-text">{{ t('appLanding.aiCreation.adaptFooter') }}</p>
              <div class="cp-adapt-chips">
                <span class="cp-adapt-chip">{{ t('appLanding.aiCreation.adaptChip1') }}</span>
                <span class="cp-adapt-chip">{{ t('appLanding.aiCreation.adaptChip2') }}</span>
                <span class="cp-adapt-chip">{{ t('appLanding.aiCreation.adaptChip3') }}</span>
                <span class="cp-adapt-chip">{{ t('appLanding.aiCreation.adaptChip4') }}</span>
              </div>
            </div>
          </div>

          <!-- ═══ Step 3: Calendar ═══ -->
          <div v-else key="s3" class="cp-mock-center">
            <div class="cp-cal-header">
              <MaterialIcon icon="calendar_month" size="sm" color="var(--lp-accent-orange)" />
              <span class="cp-cal-title">{{ t('appLanding.aiCreation.calTitle') }}</span>
            </div>
            <p class="cp-cal-sub">{{ t('appLanding.aiCreation.calSubtitle') }}</p>
            <div class="cp-cal-pills">
              <span class="cp-cal-pill">{{ t('appLanding.aiCreation.postTabFeed') }}</span>
              <span class="cp-cal-pill">{{ t('appLanding.aiCreation.postTabReel') }}</span>
              <span class="cp-cal-pill">{{ t('appLanding.aiCreation.postTabStory') }}</span>
            </div>
            <div class="cp-cal-grid">
              <div v-for="(dayKey, di) in dayKeys" :key="dayKey" class="cp-cal-slot">
                <span class="cp-cal-day">{{ t(dayKey) }}</span>
                <span class="cp-cal-dot" :class="{ filled: calFilled[di] }" />
              </div>
            </div>
            <div class="cp-cal-badges">
              <span class="cp-cal-badge scheduled" :class="{ visible: badgeScheduled }">
                <MaterialIcon icon="schedule" size="xs" />
                {{ t('appLanding.aiCreation.badgeScheduled') }}
              </span>
              <span class="cp-cal-badge published" :class="{ visible: badgePublished }">
                <MaterialIcon icon="check_circle" size="xs" />
                {{ t('appLanding.aiCreation.badgePublished') }}
              </span>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* ═══════════════════════════════════════════════════════ */
/* Section & Header                                       */
/* ═══════════════════════════════════════════════════════ */
.cp-section {
  padding: 80px 24px;
  max-width: 980px;
  margin: 0 auto;
  text-align: center;
}

.cp-eyebrow {
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: var(--lp-accent-orange);
  margin: 0 0 12px;
}

.cp-title {
  font-family: var(--font-heading);
  font-size: clamp(28px, 4vw, 42px);
  font-weight: 700;
  color: var(--lp-text-primary);
  margin: 0 0 12px;
  line-height: 1.15;
}

.cp-subtitle {
  font-size: 16px;
  color: var(--lp-text-secondary);
  margin: 0 0 32px;
  max-width: 560px;
  margin-inline: auto;
  line-height: 1.5;
}

/* ═══════════════════════════════════════════════════════ */
/* Tab Nav                                                */
/* ═══════════════════════════════════════════════════════ */
.cp-tabs {
  display: flex;
  gap: 6px;
  margin: 0 auto 24px;
  max-width: 720px;
  background: color-mix(in srgb, var(--lp-bg-surface) 70%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 14px;
  padding: 6px;
}

.cp-tab {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 12px;
  border: none;
  background: transparent;
  color: var(--lp-text-muted);
  font-size: 13px;
  font-family: var(--font-body);
  border-radius: 10px;
  cursor: pointer;
  transition: color 0.2s, background 0.2s;
  overflow: hidden;
}

.cp-tab:hover { color: var(--lp-text-secondary); }

.cp-tab.active {
  color: var(--lp-text-primary);
  background: var(--lp-bg-surface);
}

.cp-tab-num {
  font-weight: 700;
  font-size: 11px;
  opacity: 0.5;
}

.cp-tab-label { font-weight: 500; }

.cp-tab-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 2.5px;
  background: var(--lp-accent-orange);
  box-shadow: 0 0 8px color-mix(in srgb, var(--lp-accent-orange) 50%, transparent);
  border-radius: 2px;
  /* Width driven by JS — no CSS transition */
}

/* ═══════════════════════════════════════════════════════ */
/* Stage                                                  */
/* ═══════════════════════════════════════════════════════ */
.cp-stage {
  position: relative;
  display: flex;
  border: 1px solid var(--lp-border);
  border-radius: 16px;
  background: var(--lp-bg-surface);
  overflow: hidden;
  min-height: 440px;
  box-shadow: var(--lp-shadow-card), 0 0 60px rgba(139, 92, 246, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.cp-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(70px);
  opacity: 0.12;
  pointer-events: none;
}
.cp-orb-1 {
  width: 260px;
  height: 260px;
  top: -60px;
  right: -40px;
  background: var(--lp-accent-orange);
}
.cp-orb-2 {
  width: 200px;
  height: 200px;
  bottom: -40px;
  left: -30px;
  background: var(--lp-accent-violet);
}

.cp-pause-hint {
  position: absolute;
  top: 12px;
  right: 16px;
  font-size: 12px;
  color: var(--lp-text-muted);
  opacity: 0;
  transition: opacity 0.2s;
  z-index: 10;
  pointer-events: none;
}
.cp-pause-hint.visible { opacity: 1; }

/* ═══════════════════════════════════════════════════════ */
/* Left Panel                                             */
/* ═══════════════════════════════════════════════════════ */
.cp-left {
  width: 270px;
  flex-shrink: 0;
  padding: 32px 28px;
  border-right: 1px solid var(--lp-border);
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: left;
}

.cp-left > * {
  animation: leftIn 450ms cubic-bezier(0.32, 0.72, 0, 1) both;
}
.cp-left > :nth-child(1) { animation-delay: 0s; }
.cp-left > :nth-child(2) { animation-delay: 0.04s; }
.cp-left > :nth-child(3) { animation-delay: 0.1s; }
.cp-left > :nth-child(4) { animation-delay: 0.17s; }

@keyframes leftIn {
  from { opacity: 0; transform: translateX(-16px); }
  to { opacity: 1; transform: translateX(0); }
}

.cp-step-num {
  font-size: 13px;
  font-weight: 700;
  color: var(--lp-accent-orange);
  margin-bottom: 8px;
  letter-spacing: 0.5px;
}

.cp-step-h {
  font-family: var(--font-heading);
  font-size: 22px;
  font-weight: 700;
  color: var(--lp-text-primary);
  margin: 0 0 10px;
  line-height: 1.25;
}

.cp-step-p {
  font-size: 14px;
  line-height: 1.6;
  color: var(--lp-text-secondary);
  margin: 0 0 16px;
}

.cp-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.cp-pill {
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 20px;
  background: color-mix(in srgb, var(--lp-accent-orange) 12%, transparent);
  color: var(--lp-accent-orange);
  font-weight: 500;
  white-space: nowrap;
}

/* ═══════════════════════════════════════════════════════ */
/* Right Panel                                            */
/* ═══════════════════════════════════════════════════════ */
.cp-right {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  position: relative;
  overflow: hidden;
}

/* Vue <Transition> keyframes */
.mock-enter-active { animation: mockIn 300ms cubic-bezier(0.32, 0.72, 0, 1) both; }
.mock-leave-active { animation: mockOut 180ms ease both; }

@keyframes mockIn {
  from { opacity: 0; transform: translateX(16px) scale(0.97); filter: blur(3px); }
  to { opacity: 1; transform: translateX(0) scale(1); filter: blur(0); }
}
@keyframes mockOut {
  from { opacity: 1; transform: translateX(0) scale(1); }
  to { opacity: 0; transform: translateX(-10px) scale(0.98); }
}

/* ═══════════════════════════════════════════════════════ */
/* Shared Mockup Styles                                   */
/* ═══════════════════════════════════════════════════════ */
.cp-mock {
  width: 100%;
  max-width: 380px;
  border-radius: 12px;
  background: var(--lp-bg-card, var(--lp-bg-surface));
  border: 1px solid var(--lp-border-light);
  overflow: hidden;
}

.cp-mock-center {
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.cp-tone-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--lp-accent-orange) 15%, transparent);
  color: var(--lp-accent-orange);
}
.cp-tone-badge.sm { font-size: 10px; padding: 2px 6px; }

.cp-btn {
  font-size: 11px;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid var(--lp-border-light);
  background: transparent;
  color: var(--lp-text-secondary);
  cursor: default;
  font-family: var(--font-body);
}
.cp-btn-accent {
  background: var(--lp-accent-orange);
  color: #fff;
  border-color: var(--lp-accent-orange);
}

/* ═══════════════════════════════════════════════════════ */
/* Step 0: Chat Mockup                                    */
/* ═══════════════════════════════════════════════════════ */
.cp-chat-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--lp-border);
}

.cp-chat-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--lp-text-primary);
}

.cp-chat-body { padding: 16px; }

.cp-chat-msg {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
}

.cp-chat-avatar {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--lp-accent-orange) 15%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.cp-chat-bubble {
  font-size: 13px;
  line-height: 1.5;
  color: var(--lp-text-primary);
  background: color-mix(in srgb, var(--lp-bg-primary) 50%, transparent);
  padding: 10px 14px;
  border-radius: 12px 12px 12px 4px;
}

.cp-suggestion {
  display: flex;
  gap: 12px;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid var(--lp-border-light);
  margin-bottom: 14px;
}

.cp-suggestion-img {
  width: 64px;
  height: 64px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
}

.cp-suggestion-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.cp-suggestion-text {
  font-size: 12px;
  line-height: 1.4;
  color: var(--lp-text-primary);
  margin: 0;
}

.cp-chat-actions { display: flex; gap: 6px; }

.cp-chat-input-row {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  border-top: 1px solid var(--lp-border-light);
  gap: 2px;
}

.cp-input-text {
  font-size: 13px;
  color: var(--lp-text-muted);
}

.cp-input-typed {
  font-size: 13px;
  color: var(--lp-text-primary);
}

.cp-cursor-blink {
  width: 1.5px;
  height: 14px;
  background: var(--lp-accent-orange);
  border-radius: 1px;
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* ═══════════════════════════════════════════════════════ */
/* Step 1: Post Editor Mockup                             */
/* ═══════════════════════════════════════════════════════ */
.cp-gen-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--lp-border);
}

.cp-mac-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--lp-text-muted);
  opacity: 0.3;
}
.cp-mac-dot:first-child { background: #ff5f57; opacity: 0.8; }
.cp-mac-dot:nth-child(2) { background: #febc2e; opacity: 0.8; }
.cp-mac-dot:nth-child(3) { background: #28c840; opacity: 0.8; }

.cp-gen-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--lp-text-secondary);
  margin-left: 6px;
}

.cp-gen-tabs {
  display: flex;
  gap: 0;
  padding: 0 14px;
  border-bottom: 1px solid var(--lp-border-light);
}

.cp-gen-tab {
  font-size: 12px;
  font-weight: 500;
  color: var(--lp-text-muted);
  padding: 8px 12px;
  cursor: default;
  border-bottom: 2px solid transparent;
}
.cp-gen-tab.active {
  color: var(--lp-accent-orange);
  border-bottom-color: var(--lp-accent-orange);
}

.cp-gen-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px 8px;
}

.cp-brand-avatar {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  object-fit: cover;
}

.cp-brand-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--lp-text-primary);
  display: block;
}

.cp-brand-time {
  font-size: 11px;
  color: var(--lp-text-muted);
}

.cp-gen-image {
  width: 100%;
  aspect-ratio: 16 / 10;
  object-fit: cover;
  display: block;
  border-top: 1px solid var(--lp-border-light);
  border-bottom: 1px solid var(--lp-border-light);
}

.cp-gen-caption { padding: 12px 14px; }

.cp-gen-caption p {
  font-size: 13px;
  line-height: 1.5;
  color: var(--lp-text-primary);
  margin: 6px 0 8px;
}

.cp-hashtags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.cp-hashtag {
  font-size: 11px;
  color: var(--lp-accent-orange);
  font-weight: 500;
}

.cp-gen-actions {
  display: flex;
  gap: 6px;
  padding: 0 14px 14px;
}

/* ═══════════════════════════════════════════════════════ */
/* Step 2: Platform Fan                                   */
/* ═══════════════════════════════════════════════════════ */
.cp-platform-fan {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  position: relative;
}

.cp-platform-card {
  width: 110px;
  border-radius: 10px;
  border: 1px solid var(--lp-border-light);
  background: var(--lp-bg-card, var(--lp-bg-surface));
  padding: 8px;
  position: relative;
  opacity: 0.6;
  transform: translateX(0) scale(0.92);
  transition: transform 0.75s cubic-bezier(0.32, 0.72, 0, 1),
    box-shadow 0.75s cubic-bezier(0.32, 0.72, 0, 1),
    opacity 0.5s ease;
}

/* Stacked state — all cards overlapping at center */
.cp-platform-card:first-child { transform: translateX(60px) scale(0.85) rotate(-4deg); z-index: 1; }
.cp-platform-card:nth-child(2) { transform: translateX(0) scale(0.95); z-index: 3; }
.cp-platform-card:last-child { transform: translateX(-60px) scale(0.85) rotate(4deg); z-index: 1; }

/* Fan-out state */
.cp-platform-fan.open .cp-platform-card {
  opacity: 1;
}
.cp-platform-fan.open .cp-platform-card:first-child {
  transform: translateX(0) scale(1) rotate(0deg);
  transition-delay: 0.1s;
}
.cp-platform-fan.open .cp-platform-card:nth-child(2) {
  transform: translateX(0) scale(1.08);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  z-index: 3;
  transition-delay: 0s;
}
.cp-platform-fan.open .cp-platform-card:last-child {
  transform: translateX(0) scale(1) rotate(0deg);
  transition-delay: 0.2s;
}

/* Check badge — hidden until fan opens */
.cp-check-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--lp-accent-orange);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px color-mix(in srgb, var(--lp-accent-orange) 50%, transparent);
  opacity: 0;
  transform: scale(0);
  transition: opacity 0.3s, transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
  transition-delay: 0s;
}
.cp-platform-fan.open .cp-check-badge {
  opacity: 1;
  transform: scale(1);
  transition-delay: 0.45s;
}

.cp-platform-card :deep(.platform-logo) {
  margin-bottom: 6px;
}

.cp-platform-img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 6px;
  display: block;
  margin-bottom: 8px;
}

.cp-platform-lines {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 6px;
}

.cp-line {
  height: 4px;
  border-radius: 2px;
  background: var(--lp-border);
}
.cp-line.w40 { width: 40%; }
.cp-line.w45 { width: 45%; }
.cp-line.w50 { width: 50%; }
.cp-line.w60 { width: 60%; }
.cp-line.w70 { width: 70%; }
.cp-line.w80 { width: 80%; }

.cp-platform-label {
  font-size: 10px;
  font-weight: 600;
  color: var(--lp-text-muted);
}

/* .cp-check-badge positioning + animation defined above in fan section */

.cp-adapt-footer {
  text-align: center;
  opacity: 0;
  transform: translateY(8px);
  transition: opacity 0.4s ease 0.5s, transform 0.4s ease 0.5s;
}
.cp-adapt-footer.open {
  opacity: 1;
  transform: translateY(0);
}

.cp-adapt-text {
  font-size: 13px;
  color: var(--lp-text-secondary);
  margin: 0 0 10px;
}

.cp-adapt-chips {
  display: flex;
  gap: 6px;
  justify-content: center;
  flex-wrap: wrap;
}

.cp-adapt-chip {
  font-size: 10px;
  padding: 3px 8px;
  border-radius: 12px;
  border: 1px solid var(--lp-border-light);
  color: var(--lp-text-muted);
  font-weight: 500;
}

/* ═══════════════════════════════════════════════════════ */
/* Step 3: Calendar                                       */
/* ═══════════════════════════════════════════════════════ */
.cp-cal-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.cp-cal-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--lp-text-primary);
}

.cp-cal-sub {
  font-size: 13px;
  color: var(--lp-text-secondary);
  margin: 0 0 14px;
}

.cp-cal-pills {
  display: flex;
  gap: 6px;
  margin-bottom: 18px;
}

.cp-cal-pill {
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 12px;
  border: 1px solid var(--lp-border-light);
  color: var(--lp-text-muted);
  font-weight: 500;
}

.cp-cal-grid {
  display: flex;
  gap: 12px;
  margin-bottom: 18px;
}

.cp-cal-slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid var(--lp-border-light);
  background: var(--lp-bg-card, var(--lp-bg-surface));
}

.cp-cal-day {
  font-size: 11px;
  font-weight: 600;
  color: var(--lp-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.cp-cal-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--lp-border);
  transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1), background 0.35s;
  transform: scale(0);
}
.cp-cal-dot.filled {
  background: var(--lp-accent-orange);
  transform: scale(1);
  box-shadow: 0 0 8px color-mix(in srgb, var(--lp-accent-orange) 50%, transparent);
}

.cp-cal-badges {
  display: flex;
  gap: 10px;
}

.cp-cal-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 12px;
  opacity: 0;
  transform: translateY(6px) scale(0.9);
  transition: opacity 0.35s, transform 0.35s cubic-bezier(0.32, 0.72, 0, 1);
}
.cp-cal-badge.visible {
  opacity: 1;
  transform: translateY(0) scale(1);
}
.cp-cal-badge.scheduled {
  background: color-mix(in srgb, #f59e0b 15%, transparent);
  color: #f59e0b;
}
.cp-cal-badge.published {
  background: color-mix(in srgb, #10b981 15%, transparent);
  color: #10b981;
}

/* ═══════════════════════════════════════════════════════ */
/* Mobile                                                 */
/* ═══════════════════════════════════════════════════════ */
@media (max-width: 768px) {
  .cp-section { padding: 48px 16px; }

  .cp-tabs { margin-bottom: 16px; gap: 4px; padding: 4px; }
  .cp-tab { padding: 8px 6px; font-size: 12px; }
  .cp-tab-num { display: none; }
  .cp-tab-label { font-size: 11px; }

  .cp-stage {
    flex-direction: column;
    min-height: auto;
  }

  .cp-left {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid var(--lp-border);
    padding: 24px 20px;
  }

  .cp-step-h { font-size: 18px; }
  .cp-right { padding: 20px 16px; min-height: 300px; }
  .cp-platform-card { width: 90px; }
  .cp-platform-card.center { transform: scale(1.05); }
  .cp-cal-grid { gap: 6px; }
  .cp-cal-slot { padding: 8px 10px; }
}

@media (max-width: 480px) {
  .cp-tabs { flex-wrap: wrap; }
  .cp-tab { min-width: calc(50% - 4px); }
}

/* ═══════════════════════════════════════════════════════ */
/* Reduced Motion                                         */
/* ═══════════════════════════════════════════════════════ */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-delay: 0ms !important;
    transition-duration: 0.01ms !important;
  }
}
</style>

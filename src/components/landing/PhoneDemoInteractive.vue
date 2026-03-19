<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { gsap } from '@/composables/useGsapSection'
import DemoCursor from './DemoCursor.vue'
import DemoChatScreen from './DemoChatScreen.vue'
import DemoDesignStudio from './DemoDesignStudio.vue'
import DemoAnalyticsScreen from './DemoAnalyticsScreen.vue'
import DemoAdsScreen from './DemoAdsScreen.vue'
import DemoCalendarScreen from './DemoCalendarScreen.vue'
import DemoCtaScreen from './DemoCtaScreen.vue'

const emit = defineEmits<{ (e: 'phase', index: number): void }>()

const rootRef = ref<HTMLElement | null>(null)
const cursorRef = ref<InstanceType<typeof DemoCursor> | null>(null)
const currentPhase = ref(0)

const phases = [
  { label: 'chat', autoDelay: 1800 },
  { label: 'strategy', autoDelay: 2500 },
  { label: 'design-studio', autoDelay: 2500 },
  { label: 'publish', autoDelay: 3500 },
  { label: 'calendar', autoDelay: 2500 },
  { label: 'analytics', autoDelay: 2500 },
  { label: 'ads', autoDelay: 5000 },
  { label: 'cta', autoDelay: 6000 },
]

let masterTl: gsap.core.Timeline | null = null
let autoTimer: ReturnType<typeof setTimeout> | null = null
const phaseStartTimes: number[] = []
const prefersReducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
const isMob = typeof window !== 'undefined' && window.innerWidth < 768

// ── Swipe gesture support (mobile) ──
let touchStartX = 0
let touchStartY = 0
let touchStartTime = 0

function onTouchStart(e: TouchEvent) {
  touchStartX = e.touches[0].clientX
  touchStartY = e.touches[0].clientY
  touchStartTime = Date.now()
}

function onTouchEnd(e: TouchEvent) {
  const dx = e.changedTouches[0].clientX - touchStartX
  const dy = e.changedTouches[0].clientY - touchStartY
  const dt = Date.now() - touchStartTime

  // Must be a horizontal swipe: fast enough, far enough, more horizontal than vertical
  if (dt > 400 || Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.2) return

  if (dx < 0) {
    // Swipe left → next
    skipToNext()
  } else {
    // Swipe right → previous
    const prev = currentPhase.value - 1
    if (prev >= 0) jumpToPhase(prev)
  }
}

function q(selector: string): HTMLElement | null {
  return rootRef.value?.querySelector(selector) ?? null
}

function qa(selector: string): NodeListOf<Element> {
  return rootRef.value?.querySelectorAll(selector) ?? document.querySelectorAll('.___none')
}

// Phase 0: Chat — AI greeting with suggestion card
function buildPhase0(tl: gsap.core.Timeline) {
  const cursorEl = cursorRef.value?.cursorRef
  if (cursorEl) tl.set(cursorEl, { opacity: 1 })

  // Show greeting bubble (small — just typing dots)
  const aiGreeting = q('[data-demo-ai-greeting]')
  tl.to(aiGreeting, { opacity: 1, y: 0, duration: 0.3, ease: 'back.out(1.7)' }, 0.2)

  // Typing dots visible for a beat, then fade out
  const typing = q('[data-demo-typing]')
  tl.to(typing, { opacity: 0, height: 0, duration: 0.15 }, 0.8)

  // AI text reveals (bubble grows with content)
  const aiText = q('[data-demo-ai-text]')
  tl.to(aiText, { opacity: 1, maxHeight: 100, duration: 0.3, ease: 'none' }, 0.95)

  // Suggestion card scales in
  const suggestion = q('[data-demo-suggestion]')
  tl.fromTo(suggestion,
    { opacity: 0, scale: 0.92 },
    { opacity: 1, scale: 1, duration: 0.25, ease: 'power2.out' },
    1.3,
  )

  // Tone badge pops in
  const tone = q('[data-demo-tone]')
  tl.fromTo(tone,
    { opacity: 0, scale: 0.7 },
    { opacity: 1, scale: 1, duration: 0.15, ease: 'back.out(3)' },
    1.6,
  )

  tl.call(() => { cursorRef.value?.show() }, undefined, 1.9)

  tl.call(() => scheduleAutoAdvance(), undefined, 2.2)
  tl.addPause(2.2)
}

// Phase 1: User replies, then AI responds with strategy
function buildPhase1(tl: gsap.core.Timeline) {
  const offset = tl.duration()

  // User reply slides in
  const userReply = q('[data-demo-user-reply-1]')
  tl.fromTo(userReply,
    { opacity: 0, y: 8 },
    { opacity: 1, y: 0, duration: 0.25, ease: 'back.out(1.5)' },
    offset + 0.1,
  )

  // Scroll messages up to make room
  const messages = q('[data-demo-messages]')
  const isMob = typeof window !== 'undefined' && window.innerWidth < 768
  tl.to(messages, { y: isMob ? -55 : -80, duration: 0.4, ease: 'power2.out' }, offset + 0.5)

  // AI strategy message appears
  const strategy = q('[data-demo-strategy]')
  tl.to(strategy, { opacity: 1, duration: 0.25 }, offset + 0.7)

  const stratText = q('[data-demo-strategy-text]')
  tl.to(stratText, { opacity: 1, maxHeight: 80, duration: 0.3 }, offset + 0.8)

  const calendar = q('[data-demo-calendar]')
  tl.fromTo(calendar,
    { opacity: 0, y: 10 },
    { opacity: 1, y: 0, duration: 0.3, ease: 'back.out(1.5)' },
    offset + 1.2,
  )

  const planItems = qa('[data-demo-calendar] .dc-plan-item')
  if (planItems.length) {
    tl.fromTo(planItems,
      { opacity: 0, x: -6 },
      { opacity: 1, x: 0, duration: 0.2, stagger: 0.08, ease: 'power2.out' },
      offset + 1.5,
    )
  }

  tl.call(() => scheduleAutoAdvance(), undefined, offset + 2.5)
  tl.addPause(offset + 2.5)
}

// Phase 2: Design Studio — cursor clicks attach, popup appears, clicks Design Studio, studio slides in
function buildPhase2(tl: gsap.core.Timeline) {
  const offset = tl.duration()

  // Move cursor to clip icon and click
  tl.call(() => {
    const clipEl = q('[data-demo-clip]')
    cursorRef.value?.moveToElement(clipEl, rootRef.value, 0.5)
  }, undefined, offset + 0.1)

  tl.call(() => {
    cursorRef.value?.click()
  }, undefined, offset + 0.7)

  // Attach menu popup slides up
  const attachMenu = q('[data-demo-attach-menu]')
  tl.fromTo(attachMenu,
    { opacity: 0, y: 8 },
    { opacity: 1, y: 0, duration: 0.2, ease: 'back.out(1.5)' },
    offset + 0.8,
  )

  // Move cursor to Design Studio option
  tl.call(() => {
    const studioOption = q('[data-demo-attach-studio]')
    cursorRef.value?.moveToElement(studioOption, rootRef.value, 0.4)
  }, undefined, offset + 1.2)

  // Click Design Studio
  tl.call(() => {
    cursorRef.value?.click()
  }, undefined, offset + 1.7)

  // Hide attach menu
  tl.to(attachMenu, { opacity: 0, y: 8, duration: 0.15 }, offset + 1.8)

  // Slide in studio
  const studio = q('[data-demo-studio]')
  tl.to(studio, { x: 0, duration: 0.4, ease: 'power3.out' }, offset + 1.9)

  const textOverlay = q('[data-demo-studio-text-overlay]')
  if (textOverlay) {
    tl.fromTo(textOverlay, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.25, ease: 'back.out(1.5)' }, offset + 2.4)
  }

  const tools = qa('[data-demo-studio-toolbar] .dst-tool')
  tl.to(tools, { opacity: 1, duration: 0.15, stagger: 0.04, ease: 'back.out(1.5)' }, offset + 2.3)

  const colors = qa('[data-demo-studio-colors] .dst-color')
  tl.to(colors, { opacity: 1, duration: 0.15, stagger: 0.03 }, offset + 2.9)

  const promptText = q('[data-demo-studio-prompt]')
  if (promptText) {
    tl.to(promptText, { maxWidth: '100%', duration: 0.4, ease: 'steps(25)' }, offset + 3.1)
  }

  tl.call(() => scheduleAutoAdvance(), undefined, offset + 4.0)
  tl.addPause(offset + 4.0)
}

// Phase 3: Publish — slide out studio, user reply, inline post preview + published confirmation
function buildPhase3(tl: gsap.core.Timeline) {
  const offset = tl.duration()

  // Slide out studio
  const studio = q('[data-demo-studio]')
  tl.to(studio, { x: '100%', duration: 0.3, ease: 'power2.in' }, offset + 0.1)

  // User reply 2 slides in
  const userReply2 = q('[data-demo-user-reply-2]')
  tl.fromTo(userReply2,
    { opacity: 0, y: 8 },
    { opacity: 1, y: 0, duration: 0.25, ease: 'back.out(1.5)' },
    offset + 0.4,
  )

  // Scroll messages up to make room for publish card
  const messages = q('[data-demo-messages]')
  const isMob = typeof window !== 'undefined' && window.innerWidth < 768
  tl.to(messages, { y: isMob ? -155 : -220, duration: 0.4, ease: 'power2.out' }, offset + 0.7)

  // Post preview card fades in
  const publishCard = q('[data-demo-publish-card]')
  tl.fromTo(publishCard,
    { opacity: 0, y: 10 },
    { opacity: 1, y: 0, duration: 0.3, ease: 'back.out(1.5)' },
    offset + 1.0,
  )

  // Publish intro text
  const publishIntro = q('[data-demo-publish-intro]')
  if (publishIntro) tl.to(publishIntro, { opacity: 1, duration: 0.2 }, offset + 1.1)

  // Preview card cascades in
  const publishPreview = q('[data-demo-publish-preview]')
  if (publishPreview) {
    tl.fromTo(publishPreview,
      { opacity: 0, scale: 0.92 },
      { opacity: 1, scale: 1, duration: 0.25, ease: 'power2.out' },
      offset + 1.3,
    )
  }

  // Action buttons fade in
  const publishActions = q('[data-demo-publish-actions]')
  if (publishActions) {
    tl.fromTo(publishActions,
      { opacity: 0, y: 6 },
      { opacity: 1, y: 0, duration: 0.2, ease: 'power2.out' },
      offset + 1.6,
    )
  }

  // Cursor moves to "Publish Now" button and clicks
  tl.call(() => {
    const publishBtn = q('[data-demo-publish-now]')
    cursorRef.value?.moveToElement(publishBtn, rootRef.value, 0.4)
  }, undefined, offset + 2.0)

  tl.call(() => {
    cursorRef.value?.click()
  }, undefined, offset + 2.5)

  // Fade out action buttons after click
  if (publishActions) {
    tl.to(publishActions, { opacity: 0, duration: 0.2 }, offset + 2.6)
  }

  // Scroll messages further up to reveal confirmation
  tl.to(messages, { y: isMob ? -240 : -340, duration: 0.4, ease: 'power2.out' }, offset + 2.8)

  // Published confirmation fades in
  const confirmed = q('[data-demo-published-confirm]')
  tl.fromTo(confirmed,
    { opacity: 0, y: 10 },
    { opacity: 1, y: 0, duration: 0.3, ease: 'back.out(1.5)' },
    offset + 3.0,
  )

  // Green badge scales in
  const badge = q('[data-demo-published-badge]')
  if (badge) {
    tl.fromTo(badge,
      { opacity: 0, scale: 0.7 },
      { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(3)' },
      offset + 3.2,
    )
  }

  // Date, platform, feedback stagger in
  const time = q('[data-demo-published-time]')
  if (time) tl.to(time, { opacity: 1, duration: 0.2 }, offset + 3.5)

  const platform = q('[data-demo-published-platform]')
  if (platform) tl.to(platform, { opacity: 1, duration: 0.2 }, offset + 3.7)

  const feedback = q('[data-demo-published-feedback]')
  if (feedback) tl.to(feedback, { opacity: 1, duration: 0.2 }, offset + 3.9)

  // Hide cursor
  if (cursorRef.value?.cursorRef) {
    tl.to(cursorRef.value.cursorRef, { opacity: 0, duration: 0.2 }, offset + 2.6)
  }

  tl.call(() => scheduleAutoAdvance(), undefined, offset + 4.5)
  tl.addPause(offset + 4.5)
}

// Phase 4: Calendar — slide/fade in calendar
function buildPhase4(tl: gsap.core.Timeline) {
  const offset = tl.duration()

  // Slide in calendar screen from right on mobile, cross-fade on desktop
  const cal = q('[data-demo-calendar-screen]')
  if (isMob) {
    tl.fromTo(cal,
      { x: '30%', opacity: 0, scale: 0.96 },
      { x: '0%', opacity: 1, scale: 1, pointerEvents: 'auto', duration: 0.6, ease: 'power3.out' },
      offset + 0.1,
    )
  } else {
    tl.to(cal, { opacity: 1, pointerEvents: 'auto', duration: 0.5, ease: 'power2.out' }, offset + 0.1)
  }

  const header = q('[data-demo-cal-header]')
  if (header) tl.to(header, { opacity: 1, duration: 0.2 }, offset + 0.3)

  const platforms = qa('[data-demo-cal-platforms] .dcal-platform')
  if (platforms.length) {
    tl.fromTo(platforms,
      { opacity: 0, scale: 0.8 },
      { opacity: 1, scale: 1, duration: 0.15, stagger: 0.04, ease: 'back.out(1.5)' },
      offset + 0.4,
    )
  }

  const monthNav = q('[data-demo-cal-month]')
  if (monthNav) tl.to(monthNav, { opacity: 1, duration: 0.2 }, offset + 0.5)

  const dayLabels = q('[data-demo-cal-day-labels]')
  if (dayLabels) tl.to(dayLabels, { opacity: 1, duration: 0.2 }, offset + 0.55)

  const cells = qa('[data-demo-calendar-screen] .dcal-cell')
  if (cells.length) {
    tl.fromTo(cells,
      { opacity: 0 },
      { opacity: 1, duration: 0.1, stagger: 0.015, ease: 'none' },
      offset + 0.6,
    )
  }

  const detail = q('[data-demo-cal-detail]')
  if (detail) {
    tl.fromTo(detail,
      { opacity: 0, y: 15 },
      { opacity: 1, y: 0, duration: 0.3, ease: 'back.out(1.5)' },
      offset + 1.2,
    )
  }

  const postCards = qa('[data-demo-calendar-screen] .dcal-post-card')
  if (postCards.length) {
    tl.fromTo(postCards,
      { opacity: 0 },
      { opacity: 1, duration: 0.25, stagger: 0.15 },
      offset + 1.4,
    )
  }

  tl.call(() => scheduleAutoAdvance(), undefined, offset + 2.2)
  tl.addPause(offset + 2.2)
}

// Phase 5: Analytics — slide calendar out, analytics in
function buildPhase5(tl: gsap.core.Timeline) {
  const offset = tl.duration()

  const cal = q('[data-demo-calendar-screen]')
  const analytics = q('[data-demo-analytics]')
  if (isMob) {
    // Calendar slides out left
    tl.to(cal, { x: '-20%', opacity: 0, pointerEvents: 'none', duration: 0.5, ease: 'power3.inOut' }, offset + 0.1)
    // Analytics slides in from right
    tl.fromTo(analytics,
      { x: '30%', opacity: 0, scale: 0.96 },
      { x: '0%', opacity: 1, scale: 1, pointerEvents: 'auto', duration: 0.6, ease: 'power3.out' },
      offset + 0.15,
    )
  } else {
    tl.to(cal, { opacity: 0, pointerEvents: 'none', duration: 0.35, ease: 'power2.in' }, offset + 0.1)
    tl.to(analytics, { opacity: 1, pointerEvents: 'auto', duration: 0.5, ease: 'power2.out' }, offset + 0.25)
  }

  const platformFilters = qa('[data-demo-analytics] .da-platform-filter')
  tl.fromTo(platformFilters,
    { opacity: 0, scale: 0.8 },
    { opacity: 1, scale: 1, duration: 0.15, stagger: 0.04, ease: 'back.out(1.5)' },
    offset + 0.4,
  )

  const dateFilters = qa('[data-demo-analytics] .da-date-filter')
  tl.fromTo(dateFilters,
    { opacity: 0 },
    { opacity: 1, duration: 0.15, stagger: 0.05 },
    offset + 0.5,
  )

  const stats = qa('[data-demo-analytics] .da-stat')
  tl.fromTo(stats,
    { opacity: 0, y: 8 },
    { opacity: 1, y: 0, duration: 0.2, stagger: 0.08, ease: 'power2.out' },
    offset + 0.7,
  )

  const chartSvg = q('[data-demo-analytics] .da-chart-svg')
  if (chartSvg) {
    tl.to(chartSvg, { opacity: 1, duration: 0.4, ease: 'power2.out' }, offset + 1.2)
  }

  const tableRows = qa('[data-demo-analytics] .da-table-row')
  tl.fromTo(tableRows,
    { opacity: 0 },
    { opacity: 1, duration: 0.15, stagger: 0.04, ease: 'power2.out' },
    offset + 1.6,
  )

  tl.call(() => scheduleAutoAdvance(), undefined, offset + 2.5)
  tl.addPause(offset + 2.5)
}

// Phase 6: Ads — slide analytics out, ads in + success with stats
function buildPhase6(tl: gsap.core.Timeline) {
  const offset = tl.duration()

  const analytics = q('[data-demo-analytics]')
  const ads = q('[data-demo-ads]')
  if (isMob) {
    tl.to(analytics, { x: '-20%', opacity: 0, pointerEvents: 'none', duration: 0.5, ease: 'power3.inOut' }, offset + 0.1)
    tl.fromTo(ads,
      { x: '30%', opacity: 0, scale: 0.96 },
      { x: '0%', opacity: 1, scale: 1, pointerEvents: 'auto', duration: 0.6, ease: 'power3.out' },
      offset + 0.15,
    )
  } else {
    tl.to(analytics, { opacity: 0, pointerEvents: 'none', duration: 0.35, ease: 'power2.in' }, offset + 0.1)
    tl.to(ads, { opacity: 1, pointerEvents: 'auto', duration: 0.5, ease: 'power2.out' }, offset + 0.25)
  }

  const preview = q('[data-demo-ads-preview]')
  if (preview) {
    tl.fromTo(preview, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out' }, offset + 0.4)
  }

  const platform = q('[data-demo-ads-platform]')
  if (platform) {
    tl.fromTo(platform, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.2, ease: 'power2.out' }, offset + 0.6)
  }

  const objective = q('[data-demo-ads-objective]')
  if (objective) {
    tl.fromTo(objective, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.2, ease: 'power2.out' }, offset + 0.8)
  }

  const budget = q('[data-demo-ads-budget]')
  if (budget) {
    tl.fromTo(budget, { opacity: 0, x: -8 }, { opacity: 1, x: 0, duration: 0.2, ease: 'power2.out' }, offset + 1.0)
  }

  const duration = q('[data-demo-ads-duration]')
  if (duration) {
    tl.fromTo(duration, { opacity: 0, x: -8 }, { opacity: 1, x: 0, duration: 0.2, ease: 'power2.out' }, offset + 1.15)
  }

  const launch = q('[data-demo-ads-launch]')
  if (launch) {
    tl.fromTo(launch, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.25, ease: 'back.out(1.5)' }, offset + 1.4)
  }

  // Button click pulse
  const launchBtn = q('[data-demo-ads-launch] .da-launch-btn')
  if (launchBtn) {
    tl.to(launchBtn, { scale: 0.95, duration: 0.08 }, offset + 2.0)
    tl.to(launchBtn, { scale: 1, duration: 0.12, ease: 'back.out(2)' }, offset + 2.08)
  }

  // Success overlay
  const adsSuccess = q('[data-demo-ads-success]')
  if (adsSuccess) tl.to(adsSuccess, { opacity: 1, duration: 0.25 }, offset + 2.3)

  const adsCheck = q('[data-demo-ads-success] .da-success-check')
  if (adsCheck) tl.to(adsCheck, { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(3)' }, offset + 2.4)

  const adsStats = q('[data-demo-ads-stats]')
  if (adsStats) {
    tl.fromTo(adsStats, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }, offset + 2.7)
  }

  tl.call(() => scheduleAutoAdvance(), undefined, offset + 3.5)
  tl.addPause(offset + 3.5)
}

// Phase 7: CTA — slide ads out, CTA slide in
function buildPhase7(tl: gsap.core.Timeline) {
  const offset = tl.duration()

  const ads = q('[data-demo-ads]')
  const cta = q('[data-demo-cta]')
  if (isMob) {
    tl.to(ads, { x: '-20%', opacity: 0, pointerEvents: 'none', duration: 0.5, ease: 'power3.inOut' }, offset + 0.1)
    tl.fromTo(cta,
      { x: '30%', opacity: 0, scale: 0.96 },
      { x: '0%', opacity: 1, scale: 1, pointerEvents: 'auto', duration: 0.6, ease: 'power3.out' },
      offset + 0.15,
    )
  } else {
    tl.to(ads, { opacity: 0, pointerEvents: 'none', duration: 0.35, ease: 'power2.in' }, offset + 0.1)
    tl.to(cta, { opacity: 1, pointerEvents: 'auto', duration: 0.5, ease: 'power2.out' }, offset + 0.25)
  }

  // Headline slides up
  const headline = q('[data-demo-cta-headline]')
  if (headline) {
    tl.fromTo(headline,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.4, ease: 'back.out(1.5)' },
      offset + 0.5,
    )
  }

  // Subtext slides up
  const subtext = q('[data-demo-cta-subtext]')
  if (subtext) {
    tl.fromTo(subtext,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' },
      offset + 0.8,
    )
  }

  // Button scales in
  const btn = q('[data-demo-cta-btn]')
  if (btn) {
    tl.fromTo(btn,
      { opacity: 0, scale: 0.9 },
      { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(2)' },
      offset + 1.1,
    )
  }

  tl.call(() => scheduleAutoAdvance(), undefined, offset + 1.8)
  tl.addPause(offset + 1.8)
}

function resetAll() {
  if (!rootRef.value) return

  // Reset chat messages
  qa('[data-demo-ai-greeting], [data-demo-strategy], [data-demo-user-reply-1], [data-demo-user-reply-2]').forEach((el) => {
    gsap.set(el, { opacity: 0, y: 10 })
  })
  gsap.set(q('[data-demo-typing]'), { opacity: 1, height: 'auto' })
  gsap.set(q('[data-demo-ai-text]'), { opacity: 0, maxHeight: 0 })
  gsap.set(q('[data-demo-suggestion]'), { opacity: 0, scale: 0.92 })
  gsap.set(q('[data-demo-tone]'), { opacity: 0, scale: 0.7 })
  gsap.set(q('[data-demo-strategy-text]'), { opacity: 0, maxHeight: 0 })
  gsap.set(q('[data-demo-send]'), { opacity: 0.5, scale: 1 })
  gsap.set(q('[data-demo-messages]'), { y: 0 })

  // Reset attach menu
  gsap.set(q('[data-demo-attach-menu]'), { opacity: 0, y: 8 })

  // Reset calendar card (inside chat strategy bubble)
  gsap.set(q('[data-demo-calendar]'), { opacity: 0, y: 10 })
  qa('[data-demo-calendar] .dc-plan-item').forEach((el) => gsap.set(el, { opacity: 0, x: -6 }))

  // Reset studio
  gsap.set(q('[data-demo-studio]'), { x: '100%' })
  gsap.set(q('[data-demo-studio-text-overlay]'), { opacity: 0, y: 8 })
  gsap.set(q('[data-demo-studio-prompt]'), { maxWidth: '0%' })
  qa('[data-demo-studio-toolbar] .dst-tool').forEach((el) => gsap.set(el, { opacity: 0 }))
  qa('[data-demo-studio-colors] .dst-color').forEach((el) => gsap.set(el, { opacity: 0 }))

  // Reset inline publish cards
  gsap.set(q('[data-demo-publish-card]'), { opacity: 0, y: 10 })
  gsap.set(q('[data-demo-publish-intro]'), { opacity: 0 })
  gsap.set(q('[data-demo-publish-preview]'), { opacity: 0, scale: 0.92 })
  gsap.set(q('[data-demo-publish-actions]'), { opacity: 0, y: 6 })
  gsap.set(q('[data-demo-published-confirm]'), { opacity: 0, y: 10 })
  gsap.set(q('[data-demo-published-badge]'), { opacity: 0, scale: 0.7 })
  gsap.set(q('[data-demo-published-time]'), { opacity: 0 })
  gsap.set(q('[data-demo-published-platform]'), { opacity: 0 })
  gsap.set(q('[data-demo-published-feedback]'), { opacity: 0 })

  // Reset calendar screen
  gsap.set(q('[data-demo-calendar-screen]'), { opacity: 0, x: '0%', scale: 1, pointerEvents: 'none' })
  gsap.set(q('[data-demo-cal-header]'), { opacity: 0 })
  qa('[data-demo-cal-platforms] .dcal-platform').forEach((el) => gsap.set(el, { opacity: 0, scale: 0.8 }))
  gsap.set(q('[data-demo-cal-month]'), { opacity: 0 })
  gsap.set(q('[data-demo-cal-day-labels]'), { opacity: 0 })
  qa('[data-demo-calendar-screen] .dcal-cell').forEach((el) => gsap.set(el, { opacity: 0 }))
  const detail = q('[data-demo-cal-detail]')
  if (detail) gsap.set(detail, { opacity: 0, y: 15 })
  qa('[data-demo-calendar-screen] .dcal-post-card').forEach((el) => gsap.set(el, { opacity: 0 }))

  // Reset analytics
  gsap.set(q('[data-demo-analytics]'), { opacity: 0, x: '0%', scale: 1, pointerEvents: 'none' })
  qa('[data-demo-analytics] .da-stat').forEach((el) => gsap.set(el, { opacity: 0, y: 8 }))
  qa('[data-demo-analytics] .da-platform-filter').forEach((el) => gsap.set(el, { opacity: 0, scale: 0.8 }))
  qa('[data-demo-analytics] .da-date-filter').forEach((el) => gsap.set(el, { opacity: 0 }))
  const chartSvg = q('[data-demo-analytics] .da-chart-svg')
  if (chartSvg) gsap.set(chartSvg, { opacity: 0 })
  qa('[data-demo-analytics] .da-table-row').forEach((el) => gsap.set(el, { opacity: 0 }))

  // Reset ads
  gsap.set(q('[data-demo-ads]'), { opacity: 0, x: '0%', scale: 1, pointerEvents: 'none' })
  gsap.set(q('[data-demo-ads-preview]'), { opacity: 0, y: 8 })
  gsap.set(q('[data-demo-ads-platform]'), { opacity: 0, y: 6 })
  gsap.set(q('[data-demo-ads-objective]'), { opacity: 0, y: 6 })
  gsap.set(q('[data-demo-ads-budget]'), { opacity: 0, x: -8 })
  gsap.set(q('[data-demo-ads-duration]'), { opacity: 0, x: -8 })
  gsap.set(q('[data-demo-ads-launch]'), { opacity: 0, y: 10 })
  gsap.set(q('[data-demo-ads-success]'), { opacity: 0 })
  const adsCheck = q('[data-demo-ads-success] .da-success-check')
  if (adsCheck) gsap.set(adsCheck, { opacity: 0, scale: 0 })
  gsap.set(q('[data-demo-ads-stats]'), { opacity: 0, y: 10 })

  // Reset CTA
  gsap.set(q('[data-demo-cta]'), { opacity: 0, x: '0%', scale: 1, pointerEvents: 'none' })
  gsap.set(q('[data-demo-cta-headline]'), { opacity: 0, y: 12 })
  gsap.set(q('[data-demo-cta-subtext]'), { opacity: 0, y: 10 })
  gsap.set(q('[data-demo-cta-btn]'), { opacity: 0, scale: 0.9 })

  // Reset cursor
  if (cursorRef.value?.cursorRef) {
    gsap.set(cursorRef.value.cursorRef, { x: 150, y: 300, opacity: 0 })
  }
}

function buildTimeline() {
  if (masterTl) {
    masterTl.kill()
    masterTl = null
  }

  masterTl = gsap.timeline({
    defaults: { ease: 'power2.out' },
    onComplete: () => {
      resetAll()
      currentPhase.value = 0
      emit('phase', 0)
      if (masterTl) masterTl.restart()
    },
  })

  phaseStartTimes.length = 0

  // Phase 0: Chat
  phaseStartTimes.push(masterTl.duration())
  buildPhase0(masterTl)

  // Phase 1: Strategy
  masterTl.call(() => { currentPhase.value = 1; emit('phase', 1) })
  phaseStartTimes.push(masterTl.duration())
  buildPhase1(masterTl)

  // Phase 2: Design Studio
  masterTl.call(() => { currentPhase.value = 2; emit('phase', 2) })
  phaseStartTimes.push(masterTl.duration())
  buildPhase2(masterTl)

  // Phase 3: Publish
  masterTl.call(() => { currentPhase.value = 3; emit('phase', 3) })
  phaseStartTimes.push(masterTl.duration())
  buildPhase3(masterTl)

  // Phase 4: Calendar
  masterTl.call(() => { currentPhase.value = 4; emit('phase', 4) })
  phaseStartTimes.push(masterTl.duration())
  buildPhase4(masterTl)

  // Phase 5: Analytics
  masterTl.call(() => { currentPhase.value = 5; emit('phase', 5) })
  phaseStartTimes.push(masterTl.duration())
  buildPhase5(masterTl)

  // Phase 6: Ads
  masterTl.call(() => { currentPhase.value = 6; emit('phase', 6) })
  phaseStartTimes.push(masterTl.duration())
  buildPhase6(masterTl)

  // Phase 7: CTA
  masterTl.call(() => { currentPhase.value = 7; emit('phase', 7) })
  phaseStartTimes.push(masterTl.duration())
  buildPhase7(masterTl)
}

function scheduleAutoAdvance() {
  if (autoTimer) clearTimeout(autoTimer)
  const delay = phases[currentPhase.value]?.autoDelay ?? 2500
  autoTimer = setTimeout(() => {
    masterTl?.resume()
  }, delay)
}

function skipToNext() {
  if (!masterTl) return
  if (autoTimer) clearTimeout(autoTimer)
  masterTl.resume()
}

function jumpToPhase(targetIndex: number) {
  if (targetIndex < 0 || targetIndex >= phases.length) return
  if (autoTimer) { clearTimeout(autoTimer); autoTimer = null }
  if (masterTl) { masterTl.kill(); masterTl = null }

  resetAll()
  currentPhase.value = targetIndex
  emit('phase', targetIndex)

  buildTimeline()
  if (!masterTl) return

  if (targetIndex > 0) {
    masterTl.seek(phaseStartTimes[targetIndex] + 0.01)
  }
  masterTl.play()
}

onMounted(async () => {
  await nextTick()
  if (!rootRef.value || prefersReducedMotion) return

  resetAll()
  buildTimeline()

  setTimeout(() => {
    emit('phase', 0)
    masterTl?.play()
  }, 500)
})

onUnmounted(() => {
  if (masterTl) {
    masterTl.kill()
    masterTl = null
  }
  if (autoTimer) {
    clearTimeout(autoTimer)
    autoTimer = null
  }
})

defineExpose({ skipToNext, jumpToPhase })
</script>

<template>
  <div
    ref="rootRef"
    class="phone-demo-interactive"
    @pointerup="(e: PointerEvent) => { if (e.pointerType !== 'touch') skipToNext() }"
    @touchstart.passive="onTouchStart"
    @touchend="onTouchEnd"
  >
    <DemoChatScreen />
    <DemoDesignStudio />
    <DemoAnalyticsScreen />
    <DemoAdsScreen />
    <DemoCalendarScreen />
    <DemoCtaScreen />
    <DemoCursor ref="cursorRef" />
  </div>
</template>

<style scoped>
.phone-demo-interactive {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  cursor: pointer;
}

/* GPU-accelerate overlay screens for smooth mobile slide transitions */
@media (max-width: 768px) {
  .phone-demo-interactive :deep([data-demo-calendar-screen]),
  .phone-demo-interactive :deep([data-demo-analytics]),
  .phone-demo-interactive :deep([data-demo-ads]),
  .phone-demo-interactive :deep([data-demo-cta]) {
    will-change: transform, opacity;
  }
}
</style>

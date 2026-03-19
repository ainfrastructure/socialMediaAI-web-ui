<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGsapSection, gsap } from '@/composables/useGsapSection'
import MaterialIcon from '@/components/MaterialIcon.vue'
import SocialChefMark from '@/components/SocialChefMark.vue'

const { t } = useI18n()
const sectionRef = ref<HTMLElement | null>(null)
const stepsNavRef = ref<HTMLElement | null>(null)
const activeStep = ref(0)

const steps = [
  { key: 'prompt', icon: 'chat', color: 'var(--lp-accent-orange)', number: '01' },
  { key: 'generate', icon: 'auto_awesome', color: 'var(--lp-accent-violet)', number: '02' },
  { key: 'adapt', icon: 'devices', color: 'var(--lp-accent-blue)', number: '03' },
  { key: 'schedule', icon: 'schedule', color: 'var(--lp-accent-orange)', number: '04' },
]

// 3D entrance configs per step — simplified on mobile
const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

// Auto-scroll step tabs to keep active tab visible on mobile
// Use manual container scroll instead of scrollIntoView to avoid page-level scroll jumps
// during the pinned ScrollTrigger animation
if (isMobile) {
  watch(activeStep, (i) => {
    const nav = stepsNavRef.value
    if (!nav) return
    const tab = nav.children[i] as HTMLElement | undefined
    if (!tab) return
    const tabRect = tab.getBoundingClientRect()
    const navRect = nav.getBoundingClientRect()
    const scrollLeft = nav.scrollLeft + (tabRect.left - navRect.left) - (navRect.width - tabRect.width) / 2
    nav.scrollTo({ left: scrollLeft, behavior: 'smooth' })
  })
}

const stepEntrance = isMobile
  ? [{ y: 30 }, { y: 30 }, { y: 30 }, { y: 30 }]
  : [
    { rotateY: -8, z: -50 },
    { rotateY: 8, z: -50 },
    { rotateX: 5, z: -80 },
    { scale: 0.9, z: -60 },
  ]
const stepEntranceTo = isMobile
  ? [{ y: 0 }, { y: 0 }, { y: 0 }, { y: 0 }]
  : [
    { rotateY: 0, z: 0 },
    { rotateY: 0, z: 0 },
    { rotateX: 0, z: 0 },
    { scale: 1, z: 0 },
  ]

// Mobile carousel state
let mobileStepTls: ReturnType<typeof gsap.timeline>[] = []
let mobileDelayCall: ReturnType<typeof gsap.delayedCall> | null = null
let mobileProgressTween: gsap.core.Tween | null = null
let mobileObserver: IntersectionObserver | null = null
let mobileStarted = false
let mobilePlayStep: ((i: number) => void) | null = null
const STEP_DURATION = 4.5

function buildStepTimeline(
  i: number,
  container: Element,
  g: typeof gsap,
  progressBar: Element | null,
  forMobile: boolean,
): ReturnType<typeof gsap.timeline> {
  const tl = g.timeline({ paused: forMobile })
  const fanX = isMobile ? 50 : 120

  // Entrance: on mobile ALL steps get entrance (carousel loops); on desktop only steps 1+
  if (forMobile || i > 0) {
    tl.set(container, { visibility: 'visible' }, 0)
    tl.fromTo(container,
      { opacity: 0, y: 30, ...stepEntrance[i] },
      { opacity: 1, y: 0, ...stepEntranceTo[i], duration: 0.3, ease: 'power2.out', immediateRender: false },
      0,
    )
  }

  // Progress bar fill — only on desktop (mobile handles separately)
  if (!forMobile && progressBar) {
    tl.fromTo(progressBar,
      { scaleX: 0 },
      { scaleX: 1, duration: 0.8, ease: 'none', immediateRender: i === 0 ? undefined : false },
      i === 0 ? 0 : 0.3,
    )
  }

  // Step-specific animations
  if (i === 0) {
    const aiBubble = container.querySelector('[data-ai-bubble]')
    const suggestionCard = container.querySelector('[data-suggestion-card]')
    const toneBadge = container.querySelector('[data-tone-badge]')
    const chatActions = container.querySelectorAll('[data-chat-actions] .lp-chat-action-btn')

    if (aiBubble) {
      tl.fromTo(aiBubble,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out', immediateRender: false },
        0.1,
      )
    }
    if (suggestionCard) {
      tl.fromTo(suggestionCard,
        { opacity: 0, scale: 0.92 },
        { opacity: 1, scale: 1, duration: 0.25, ease: 'power2.out', immediateRender: false },
        0.35,
      )
    }
    if (toneBadge) {
      tl.fromTo(toneBadge,
        { opacity: 0, scale: 0.7 },
        { opacity: 1, scale: 1, duration: 0.15, ease: 'back.out(3)', immediateRender: false },
        0.55,
      )
    }
    if (chatActions.length) {
      tl.fromTo(chatActions,
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.12, stagger: 0.05, ease: 'power2.out', immediateRender: false },
        0.65,
      )
    }
  } else if (i === 1) {
    const shimmers = container.querySelectorAll('.lp-gen-shimmer')
    const appHeader = container.querySelector('[data-post-header]')
    const tabs = container.querySelectorAll('[data-post-tabs] .lp-post-tab')
    const brandRow = container.querySelector('[data-post-brand]')
    const imgPlaceholder = container.querySelector('[data-post-image]')
    const captionArea = container.querySelector('[data-post-caption]')
    const tags = container.querySelectorAll('[data-post-tags] .lp-gen-tag')
    const actionBtns = container.querySelectorAll('[data-post-actions] .lp-post-btn')
    const bottomBar = container.querySelector('[data-post-bottom]')

    tl.fromTo(shimmers, { opacity: 1 }, { opacity: 0, duration: 0.25, stagger: 0.05, immediateRender: false }, 0.3)
    if (appHeader) tl.fromTo(appHeader, { opacity: 0 }, { opacity: 1, duration: 0.2, immediateRender: false }, 0.35)
    tl.fromTo(tabs, { opacity: 0, x: 20 }, { opacity: 1, x: 0, duration: 0.15, stagger: 0.05, immediateRender: false }, 0.4)
    if (brandRow) tl.fromTo(brandRow, { opacity: 0 }, { opacity: 1, duration: 0.2, immediateRender: false }, 0.5)
    const toneBadge = container.querySelector('[data-post-tone]')
    if (toneBadge) tl.fromTo(toneBadge, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.15, ease: 'back.out(1.5)', immediateRender: false }, 0.52)
    if (imgPlaceholder) {
      tl.fromTo(imgPlaceholder,
        { scale: 0.85, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.25, ease: 'power2.out', immediateRender: false },
        0.55,
      )
    }
    if (captionArea) tl.fromTo(captionArea, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.2, immediateRender: false }, 0.6)
    tl.fromTo(tags, { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.15, stagger: 0.06, immediateRender: false }, 0.65)
    tl.fromTo(actionBtns, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.15, stagger: 0.05, ease: 'back.out(1.5)', immediateRender: false }, 0.72)
    if (bottomBar) tl.fromTo(bottomBar, { opacity: 0 }, { opacity: 1, duration: 0.15, immediateRender: false }, 0.8)
  } else if (i === 2) {
    const cards = container.querySelectorAll('.lp-platform-card')
    const singleCheck = container.querySelector('.lp-fan-check')

    if (cards.length === 3) {
      tl.fromTo(cards[0], { x: 0, rotation: 0 }, { x: -fanX, rotation: -5, duration: 0.35, ease: 'power2.out', immediateRender: false }, 0.3)
      tl.fromTo(cards[2], { x: 0, rotation: 0 }, { x: fanX, rotation: 5, duration: 0.35, ease: 'power2.out', immediateRender: false }, 0.3)
    }
    if (singleCheck) {
      tl.fromTo(singleCheck, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.25, ease: 'back.out(3)', immediateRender: false }, 0.6)
    }
  } else if (i === 3) {
    const scheduleHeader = container.querySelector('[data-schedule-header]')
    const formatPills = container.querySelectorAll('.lp-format-pill')
    const calGrid = container.querySelector('.lp-cal-grid')
    const badgeScheduled = container.querySelector('.lp-badge-scheduled')
    const badgePublished = container.querySelector('.lp-badge-published')

    if (scheduleHeader) tl.fromTo(scheduleHeader, { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.2, immediateRender: false }, 0.15)
    if (formatPills.length) tl.fromTo(formatPills, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.1, stagger: 0.04, immediateRender: false }, 0.25)
    if (calGrid) {
      tl.fromTo(calGrid, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.15, immediateRender: false }, 0.3)
      const dots = calGrid.querySelectorAll('.lp-cal-dot')
      if (dots.length) tl.fromTo(dots, { opacity: 0, scale: 0 }, { opacity: 1, scale: 1, duration: 0.08, stagger: 0.03, ease: 'back.out(3)', immediateRender: false }, 0.38)
    }
    if (badgeScheduled) {
      tl.fromTo(badgeScheduled, { x: '-120%', opacity: 0 }, { x: 0, opacity: 1, duration: 0.18, ease: 'power2.out', immediateRender: false }, 0.45)
      tl.to(badgeScheduled, { x: '120%', opacity: 0, duration: 0.15, ease: 'power2.in' }, 0.60)
    }
    if (badgePublished) {
      tl.fromTo(badgePublished, { x: '-120%', opacity: 0 }, { x: 0, opacity: 1, duration: 0.18, ease: 'power2.out', immediateRender: false }, 0.60)
      tl.to(badgePublished, { x: '120%', opacity: 0, duration: 0.15, ease: 'power2.in' }, 0.76)
    }
  }

  // Exit animation: only on desktop (mobile hides instantly before next step plays)
  if (!forMobile && i < 3) {
    tl.to(container, { opacity: 0, y: -20, duration: 0.2 }, 0.9)
    tl.set(container, { visibility: 'hidden' }, 1.1)
  }

  return tl
}

useGsapSection(sectionRef, (el, g) => {
  const stageContainers = el.querySelectorAll('.lp-stage-step')
  const progressBars = el.querySelectorAll('.lp-step-progress-fill')

  // Hard-set initial states
  stageContainers.forEach((c, i) => {
    if (i === 0 && !isMobile) {
      g.set(c, { visibility: 'visible', opacity: 1, y: 0, rotateX: 0, rotateY: 0, z: 0, scale: 1 })
    } else {
      g.set(c, { visibility: 'hidden', opacity: 0, y: 30, scale: 1 })
    }
  })

  if (isMobile) {
    // ── MOBILE: Timer-based auto-advancing carousel ──
    mobileStepTls = []
    for (let i = 0; i < 4; i++) {
      const container = stageContainers[i]
      if (!container) continue
      mobileStepTls.push(buildStepTimeline(i, container, g, progressBars[i] || null, true))
    }

    function playStep(i: number) {
      if (mobileDelayCall) { mobileDelayCall.kill(); mobileDelayCall = null }
      if (mobileProgressTween) { mobileProgressTween.kill(); mobileProgressTween = null }

      activeStep.value = i

      // Hide all containers, reset all step timelines
      stageContainers.forEach((c, idx) => {
        g.set(c, { visibility: 'hidden', opacity: 0 })
        mobileStepTls[idx]?.progress(0).pause()
      })
      // Reset all progress bars
      progressBars.forEach(bar => g.set(bar, { scaleX: 0 }))

      // Play target step
      mobileStepTls[i].restart()

      // Animate progress bar fill over STEP_DURATION
      if (progressBars[i]) {
        mobileProgressTween = g.fromTo(progressBars[i],
          { scaleX: 0 },
          { scaleX: 1, duration: STEP_DURATION, ease: 'none' },
        )
      }

      // Schedule next step
      mobileDelayCall = g.delayedCall(STEP_DURATION, () => {
        playStep((i + 1) % 4)
      })
    }

    mobilePlayStep = playStep

    // IntersectionObserver: start/pause based on visibility
    mobileObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry.isIntersecting) {
          if (!mobileStarted) {
            mobileStarted = true
            playStep(0)
          } else {
            mobileStepTls[activeStep.value]?.resume()
            mobileProgressTween?.resume()
            mobileDelayCall?.resume()
          }
        } else {
          mobileStepTls[activeStep.value]?.pause()
          mobileProgressTween?.pause()
          mobileDelayCall?.pause()
        }
      },
      { threshold: 0.2 },
    )
    mobileObserver.observe(el)

  } else {
    // ── DESKTOP: Scroll-pinned scrub (unchanged) ──
    const master = g.timeline({
      scrollTrigger: {
        trigger: el,
        start: 'top 10%',
        end: '+=200%',
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
        onUpdate(self: { progress: number }) {
          const p = self.progress
          activeStep.value = p >= 0.75 ? 3 : p >= 0.5 ? 2 : p >= 0.25 ? 1 : 0
        },
      },
    })

    for (let i = 0; i < 4; i++) {
      const container = stageContainers[i]
      if (!container) continue
      master.add(buildStepTimeline(i, container, g, progressBars[i] || null, false), i)
    }

    master.progress(0, true)
  }
})

// Mobile: handle tab clicks
function onStepClick(i: number) {
  if (!isMobile || !mobilePlayStep) return
  mobilePlayStep(i)
}

// Cleanup on unmount
onUnmounted(() => {
  mobileDelayCall?.kill()
  mobileProgressTween?.kill()
  mobileStepTls.forEach(tl => tl.kill())
  mobileStepTls = []
  mobileObserver?.disconnect()
  mobileObserver = null
})
</script>

<template>
  <section ref="sectionRef" class="lp-ai-creation">
    <div class="lp-section-inner">
      <span class="lp-eyebrow">{{ t('appLanding.aiCreation.eyebrow') }}</span>
      <h2 class="lp-section-title">{{ t('appLanding.aiCreation.title') }}</h2>
      <p class="lp-section-sub">{{ t('appLanding.aiCreation.subtitle') }}</p>

      <div class="lp-split-panel">
        <!-- Left: Step Nav -->
        <div ref="stepsNavRef" class="lp-steps-nav">
          <div
            v-for="(step, i) in steps"
            :key="step.key"
            class="lp-step-indicator"
            :class="{ active: activeStep === i, done: activeStep > i }"
            :style="{ '--step-color': step.color }"
            @click="onStepClick(i)"
          >
            <div class="lp-step-head">
              <span class="lp-step-num">{{ step.number }}</span>
              <div class="lp-step-icon">
                <MaterialIcon :icon="step.icon" size="md" />
              </div>
              <div class="lp-step-text">
                <h3>{{ t(`appLanding.aiCreation.${step.key}Title`) }}</h3>
                <p>{{ t(`appLanding.aiCreation.${step.key}Desc`) }}</p>
              </div>
            </div>
            <div class="lp-step-progress">
              <div class="lp-step-progress-fill" />
            </div>
          </div>
        </div>

        <!-- Right: Animation Stage -->
        <div class="lp-stage">
          <div class="lp-stage-orb lp-stage-orb-1" />
          <div class="lp-stage-orb lp-stage-orb-2" />
          <div class="lp-stage-grain" />

          <!-- Step 1: AI Suggests Ideas -->
          <div class="lp-stage-step lp-stage-prompt">
            <div class="lp-mock-chat">
              <div class="lp-chat-header">
                <SocialChefMark :size="20" class="lp-chat-logo" />
                <span>SocialChef</span>
              </div>
              <div class="lp-chat-messages">
                <div class="lp-chat-msg-ai" data-ai-bubble>
                  <div class="lp-chat-avatar">
                    <SocialChefMark :size="20" />
                  </div>
                  <div class="lp-chat-bubble">
                    <p>{{ t('appLanding.aiCreation.promptGreeting') }}</p>
                    <div class="lp-chat-suggestion" data-suggestion-card>
                      <div class="lp-suggestion-img">
                        <img src="/example/example-pizza.jpg" alt="" loading="lazy" />
                      </div>
                      <div class="lp-suggestion-body">
                        <p class="lp-suggestion-caption">{{ t('appLanding.aiCreation.promptSuggestionCaption') }}</p>
                        <span class="lp-suggestion-tone" data-tone-badge>{{ t('appLanding.aiCreation.promptToneBadge') }}</span>
                      </div>
                    </div>
                    <div class="lp-chat-actions" data-chat-actions>
                      <button class="lp-chat-action-btn lp-chat-action-primary">{{ t('appLanding.aiCreation.postPublishNow') }}</button>
                      <button class="lp-chat-action-btn">{{ t('appLanding.aiCreation.postSchedule') }}</button>
                      <button class="lp-chat-action-btn">{{ t('appLanding.aiCreation.postEdit') }}</button>
                    </div>
                  </div>
                </div>
              </div>
              <div class="lp-chat-input-bar">
                <MaterialIcon icon="attach_file" size="xs" />
                <span class="lp-chat-input-placeholder">{{ t('appLanding.aiCreation.postInputPlaceholder') }}</span>
                <MaterialIcon icon="send" size="xs" />
              </div>
            </div>
          </div>

          <!-- Step 2: AI Generates — In-App Post View Mockup -->
          <div class="lp-stage-step lp-stage-generate">
            <div class="lp-post-mockup">
              <!-- Shimmers (fade out on reveal) -->
              <div class="lp-gen-shimmer" />
              <div class="lp-gen-shimmer short" />
              <div class="lp-gen-shimmer shorter" />

              <!-- App header bar -->
              <div class="lp-post-app-header" data-post-header>
                <MaterialIcon icon="settings" size="xs" />
                <div class="lp-post-brand-selector">
                  <span>Jungel Pizza</span>
                  <MaterialIcon icon="expand_more" size="xs" />
                </div>
                <MaterialIcon icon="tune" size="xs" />
              </div>

              <!-- Post type tabs -->
              <div class="lp-post-tabs" data-post-tabs>
                <span class="lp-post-tab lp-post-tab-active">
                  <MaterialIcon icon="grid_view" size="xs" />
                  {{ t('appLanding.aiCreation.postTabFeed') }}
                </span>
                <span class="lp-post-tab">
                  <MaterialIcon icon="slow_motion_video" size="xs" />
                  {{ t('appLanding.aiCreation.postTabReel') }}
                </span>
                <span class="lp-post-tab">
                  <MaterialIcon icon="amp_stories" size="xs" />
                  {{ t('appLanding.aiCreation.postTabStory') }}
                </span>
                <span class="lp-post-tab">
                  <MaterialIcon icon="view_carousel" size="xs" />
                  {{ t('appLanding.aiCreation.postTabCarousel') }}
                </span>
                <span class="lp-post-tab">
                  <MaterialIcon icon="text_fields" size="xs" />
                  {{ t('appLanding.aiCreation.postTabText') }}
                </span>
              </div>

              <!-- Brand row -->
              <div class="lp-post-brand-row" data-post-brand>
                <img src="/example/jungelpizza-logo.jpeg" alt="" class="lp-post-avatar-img" loading="lazy" />
                <div class="lp-post-brand-info">
                  <span class="lp-post-brand-name">Jungel Pizza</span>
                  <span class="lp-post-timestamp">{{ t('appLanding.aiCreation.postTimestamp') }}</span>
                </div>
              </div>

              <!-- Image -->
              <div class="lp-gen-image" data-post-image>
                <img src="/example/example-pizza.jpg" alt="" class="lp-gen-real-img" loading="lazy" />
              </div>

              <!-- Tone badge -->
              <div class="lp-post-tone-row" data-post-tone>
                <span class="lp-tone-badge">{{ t('appLanding.aiCreation.postToneBadge') }}</span>
              </div>

              <!-- Caption -->
              <div class="lp-post-caption-area" data-post-caption>
                <p class="lp-post-caption-text">{{ t('appLanding.aiCreation.postCaption') }}</p>
                <p class="lp-post-caption-more">{{ t('appLanding.aiCreation.postCaptionMore') }}</p>
              </div>

              <!-- Hashtags -->
              <div class="lp-gen-tags" data-post-tags>
                <span class="lp-gen-tag">#Pizza</span>
                <span class="lp-gen-tag">#JungelPizza</span>
                <span class="lp-gen-tag">#Foodie</span>
              </div>

              <!-- Action buttons -->
              <div class="lp-post-actions" data-post-actions>
                <button class="lp-post-btn lp-post-btn-publish">{{ t('appLanding.aiCreation.postPublishNow') }}</button>
                <button class="lp-post-btn lp-post-btn-outline">{{ t('appLanding.aiCreation.postSchedule') }}</button>
                <button class="lp-post-btn lp-post-btn-outline">{{ t('appLanding.aiCreation.postEdit') }}</button>
              </div>

              <!-- Bottom bar -->
              <div class="lp-post-bottom-bar" data-post-bottom>
                <MaterialIcon icon="attach_file" size="xs" />
                <span class="lp-post-input-placeholder">{{ t('appLanding.aiCreation.postInputPlaceholder') }}</span>
                <MaterialIcon icon="mic" size="xs" />
              </div>
            </div>
          </div>

          <!-- Step 3: Multi-Platform -->
          <div class="lp-stage-step lp-stage-adapt">
            <div class="lp-platforms-fan">
              <div class="lp-fan-check">
                <MaterialIcon icon="check_circle" size="lg" />
              </div>
              <div class="lp-platform-card" style="--brand: var(--gradient-instagram, #E4405F)">
                <span class="lp-platform-label">Instagram</span>
                <div class="lp-platform-preview">
                  <img src="/example/example-pizza.jpg" alt="" class="lp-preview-img" loading="lazy" />
                  <div class="lp-preview-lines">
                    <div /><div class="short" />
                  </div>
                </div>
              </div>
              <div class="lp-platform-card" style="--brand: var(--gradient-linkedin, #0A66C2)">
                <span class="lp-platform-label">LinkedIn</span>
                <div class="lp-platform-preview">
                  <img src="/example/example-pizza.jpg" alt="" class="lp-preview-img" loading="lazy" />
                  <div class="lp-preview-lines">
                    <div /><div class="short" />
                  </div>
                </div>
              </div>
              <div class="lp-platform-card" style="--brand: var(--gradient-facebook, #1877F2)">
                <span class="lp-platform-label">Facebook</span>
                <div class="lp-platform-preview">
                  <img src="/example/example-pizza.jpg" alt="" class="lp-preview-img" loading="lazy" />
                  <div class="lp-preview-lines">
                    <div /><div class="short" />
                  </div>
                </div>
              </div>
            </div>
            <div class="lp-adapt-footer">
              <h4 class="lp-adapt-footer-title">{{ t('appLanding.aiCreation.adaptPublishAnywhere') }}</h4>
              <div class="lp-adapt-footer-types">
                <span v-for="tab in ['postTabFeed','postTabReel','postTabStory','postTabCarousel']" :key="tab" class="lp-adapt-type-pill">
                  {{ t(`appLanding.aiCreation.${tab}`) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Step 4: Schedule & Publish -->
          <div class="lp-stage-step lp-stage-schedule">
            <div class="lp-schedule-container">
              <div class="lp-schedule-header" data-schedule-header>
                <h3 class="lp-schedule-stage-title">
                  <MaterialIcon icon="calendar_month" size="md" />
                  {{ t('appLanding.aiCreation.scheduleTitle') }}
                </h3>
                <p class="lp-schedule-stage-desc">{{ t('appLanding.aiCreation.scheduleStageDesc') }}</p>
                <div class="lp-schedule-formats">
                  <span class="lp-format-pill" v-for="tab in ['postTabFeed','postTabReel','postTabStory','postTabCarousel']" :key="tab">
                    {{ t(`appLanding.aiCreation.${tab}`) }}
                  </span>
                </div>
              </div>
              <div class="lp-cal-grid">
                <div v-for="d in ['dayMon', 'dayTue', 'dayWed', 'dayThu', 'dayFri']" :key="d" class="lp-cal-day">
                  <span class="lp-cal-label">{{ t(`appLanding.aiCreation.${d}`) }}</span>
                  <div class="lp-cal-slot"><div class="lp-cal-dot" /></div>
                </div>
              </div>
              <div class="lp-badge-stack">
                <div class="lp-cal-badge lp-badge-scheduled">
                  <MaterialIcon icon="schedule" size="sm" />
                  {{ t('appLanding.aiCreation.badgeScheduled') }}
                </div>
                <div class="lp-cal-badge lp-badge-published">
                  <MaterialIcon icon="check_circle" size="sm" />
                  {{ t('appLanding.aiCreation.badgePublished') }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.lp-ai-creation {
  padding: var(--lp-section-gap) var(--space-xl);
  min-height: 100vh;
  background: transparent;
}

.lp-section-inner {
  max-width: var(--lp-max-width);
  margin: 0 auto;
  text-align: center;
}

.lp-eyebrow {
  display: inline-block;
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--lp-accent-orange);
  text-transform: uppercase;
  letter-spacing: 0.15em;
  margin-bottom: var(--space-lg);
}

.lp-section-title {
  font-family: var(--font-heading);
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: var(--font-bold);
  color: var(--lp-text-primary);
  margin: 0 0 var(--space-lg);
  letter-spacing: -0.02em;
}

.lp-section-sub {
  font-size: var(--text-lg);
  color: var(--lp-text-secondary);
  max-width: 600px;
  margin: 0 auto var(--space-3xl);
  line-height: 1.6;
}

/* Split Panel Layout */
.lp-split-panel {
  display: grid;
  grid-template-columns: 2fr 3fr;
  gap: var(--space-3xl);
  text-align: left;
  align-items: start;
  min-height: 500px;
}

/* Left: Step Nav */
.lp-steps-nav {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  padding-top: var(--space-xl);
}

.lp-step-indicator {
  padding: var(--space-lg);
  border-radius: var(--radius-lg);
  border: 1px solid var(--lp-border);
  background: var(--lp-bg-surface);
  opacity: 0.5;
  transition: opacity 0.4s ease, border-color 0.4s ease;
}

.lp-step-indicator.active {
  opacity: 1;
  border-color: var(--step-color);
}

.lp-step-indicator.done {
  opacity: 0.7;
}

.lp-step-head {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.lp-step-num {
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
  color: var(--step-color);
  letter-spacing: 0.1em;
  min-width: 24px;
}

.lp-step-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--step-color) 15%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--step-color);
  flex-shrink: 0;
}

.lp-step-text h3 {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--lp-text-primary);
  margin: 0 0 2px;
}

.lp-step-text p {
  font-size: var(--text-xs);
  color: var(--lp-text-muted);
  margin: 0;
  line-height: 1.4;
  display: none;
}

.lp-step-indicator.active .lp-step-text p {
  display: block;
}

.lp-step-progress {
  height: 3px;
  background: var(--lp-border);
  border-radius: 2px;
  margin-top: var(--space-sm);
  overflow: hidden;
}

.lp-step-progress-fill {
  height: 100%;
  background: var(--step-color);
  border-radius: 2px;
  transform-origin: left;
  transform: scaleX(0);
}

/* Right: Stage */
.lp-stage {
  position: relative;
  height: 480px;
  border-radius: var(--radius-xl);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--lp-border);
  overflow: hidden;
  perspective: 1200px;
  box-shadow: var(--lp-shadow-card), 0 0 60px rgba(139,92,246,0.08),
              inset 0 1px 0 rgba(255,255,255,0.05);
}

/* Aurora orbs */
.lp-stage-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.2;
  pointer-events: none;
  will-change: transform;
}

.lp-stage-orb-1 {
  width: 300px;
  height: 300px;
  background: var(--lp-accent-violet);
  top: -10%;
  right: -5%;
  animation: stage-orb-drift-1 18s ease-in-out infinite;
}

.lp-stage-orb-2 {
  width: 250px;
  height: 250px;
  background: var(--lp-accent-cyan);
  bottom: -10%;
  left: -5%;
  animation: stage-orb-drift-2 22s ease-in-out infinite;
}

@keyframes stage-orb-drift-1 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(-20px, 15px) scale(1.05); }
  66% { transform: translate(10px, -10px) scale(0.95); }
}

@keyframes stage-orb-drift-2 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(15px, -12px) scale(1.08); }
}

/* Grain texture */
.lp-stage-grain {
  position: absolute;
  inset: 0;
  opacity: 0.03;
  pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  background-repeat: repeat;
  background-size: 256px 256px;
}

.lp-stage-step {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-2xl);
  visibility: hidden;
  opacity: 0;
  transform-style: preserve-3d;
}

.lp-stage-step.lp-stage-prompt {
  visibility: visible;
  opacity: 1;
}

/* ===== Step 1: Prompt — AI Chat ===== */
.lp-mock-chat {
  width: 100%;
  max-width: 400px;
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--lp-border-light);
  overflow: hidden;
  transform: rotateY(-2deg);
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
  position: relative;
  display: flex;
  flex-direction: column;
}

.lp-mock-chat::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--lp-accent-orange), transparent);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
}

.lp-chat-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-lg);
  border-bottom: 1px solid var(--lp-border);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--lp-text-primary);
}

.lp-chat-logo {
  width: 20px;
  height: 25px;
}

.lp-chat-messages {
  flex: 1;
  padding: var(--space-md) var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.lp-chat-msg-ai {
  display: flex;
  gap: var(--space-sm);
  opacity: 0;
}

.lp-chat-avatar {
  width: 20px;
  height: 25px;
  flex-shrink: 0;
  margin-top: 2px;
}

.lp-chat-bubble {
  flex: 1;
  min-width: 0;
}

.lp-chat-bubble > p {
  font-size: var(--text-sm);
  color: var(--lp-text-primary);
  line-height: 1.5;
  margin: 0 0 var(--space-sm);
}

.lp-chat-suggestion {
  display: flex;
  gap: var(--space-sm);
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--lp-border);
  border-radius: var(--radius-md);
  padding: var(--space-sm);
  margin-bottom: var(--space-sm);
  opacity: 0;
}

.lp-suggestion-img {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  flex-shrink: 0;
}

.lp-suggestion-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.lp-suggestion-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.lp-suggestion-caption {
  font-size: var(--text-xs);
  color: var(--lp-text-primary);
  line-height: 1.4;
  margin: 0;
}

.lp-suggestion-tone {
  display: inline-block;
  align-self: flex-start;
  font-size: 10px;
  font-weight: var(--font-semibold);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  background: color-mix(in srgb, var(--lp-accent-orange) 15%, transparent);
  color: var(--lp-accent-orange);
  opacity: 0;
}

.lp-chat-actions {
  display: flex;
  gap: var(--space-xs);
}

.lp-chat-action-btn {
  flex: 1;
  border: 1px solid var(--lp-border-light);
  background: transparent;
  color: var(--lp-text-secondary);
  font-family: var(--font-body);
  font-size: 10px;
  font-weight: var(--font-semibold);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-md);
  cursor: pointer;
  opacity: 0;
}

.lp-chat-action-primary {
  background: var(--lp-accent-orange);
  border-color: var(--lp-accent-orange);
  color: #fff;
}

.lp-chat-input-bar {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  border-top: 1px solid var(--lp-border);
  color: var(--lp-text-muted);
}

.lp-chat-input-placeholder {
  flex: 1;
  font-size: var(--text-xs);
  color: var(--lp-text-muted);
}

/* ===== Step 2: Generate — In-App Post Mockup ===== */
.lp-post-mockup {
  width: 100%;
  max-width: 380px;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--lp-border-light);
  border-radius: var(--radius-lg);
  overflow: hidden;
  position: relative;
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
}

.lp-post-mockup::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--lp-accent-violet), transparent);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  z-index: 1;
}

.lp-post-app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-sm) var(--space-md);
  border-bottom: 1px solid var(--lp-border);
  color: var(--lp-text-secondary);
  opacity: 0;
}

.lp-post-brand-selector {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--lp-text-primary);
}

.lp-post-tabs {
  display: flex;
  gap: 2px;
  padding: var(--space-xs) var(--space-sm);
  border-bottom: 1px solid var(--lp-border);
}

.lp-post-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: var(--space-xs);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--lp-text-muted);
  opacity: 0;
}

.lp-post-tab-active {
  background: color-mix(in srgb, var(--lp-accent-orange) 15%, transparent);
  color: var(--lp-accent-orange);
}

.lp-post-brand-row {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  opacity: 0;
}

.lp-post-avatar-img {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.lp-post-brand-info {
  display: flex;
  flex-direction: column;
}

.lp-post-brand-name {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--lp-text-primary);
}

.lp-post-timestamp {
  font-size: var(--text-xs);
  color: var(--lp-text-muted);
}

.lp-post-tone-row {
  padding: var(--space-xs) var(--space-md);
  opacity: 0;
}

.lp-tone-badge {
  display: inline-block;
  font-size: 10px;
  font-weight: var(--font-semibold);
  padding: 2px 10px;
  border-radius: var(--radius-full);
  background: color-mix(in srgb, var(--lp-accent-orange) 15%, transparent);
  color: var(--lp-accent-orange);
}

.lp-post-caption-area {
  padding: var(--space-xs) var(--space-md);
  opacity: 0;
}

.lp-post-caption-text {
  font-size: var(--text-sm);
  color: var(--lp-text-primary);
  line-height: 1.5;
  margin: 0;
}

.lp-post-caption-more {
  font-size: var(--text-xs);
  color: var(--lp-text-secondary);
  line-height: 1.5;
  margin: var(--space-xs) 0 0;
}

.lp-post-actions {
  display: flex;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-md);
}

.lp-post-btn {
  flex: 1;
  border: none;
  font-family: var(--font-body);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  padding: var(--space-sm);
  border-radius: var(--radius-md);
  cursor: pointer;
  opacity: 0;
}

.lp-post-btn-publish {
  background: var(--lp-accent-orange);
  color: #fff;
}

.lp-post-btn-outline {
  background: transparent;
  border: 1px solid var(--lp-border-light);
  color: var(--lp-text-secondary);
}

.lp-post-bottom-bar {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  border-top: 1px solid var(--lp-border);
  color: var(--lp-text-muted);
  opacity: 0;
}

.lp-post-input-placeholder {
  flex: 1;
  font-size: var(--text-xs);
  color: var(--lp-text-muted);
}

.lp-gen-shimmer {
  height: 12px;
  border-radius: 6px;
  background: linear-gradient(90deg, var(--lp-bg-elevated) 25%, var(--lp-bg-card) 50%, var(--lp-bg-elevated) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

.lp-gen-shimmer.short { width: 75%; }
.lp-gen-shimmer.shorter { width: 50%; }

/* Shimmers inside post mockup need padding */
.lp-post-mockup .lp-gen-shimmer {
  margin: var(--space-xs) var(--space-md);
  width: auto;
}

.lp-post-mockup .lp-gen-shimmer.short { width: 60%; }
.lp-post-mockup .lp-gen-shimmer.shorter { width: 40%; }

/* Image inside post mockup: no border-radius, full width */
.lp-post-mockup .lp-gen-image {
  border-radius: 0;
  border: none;
  height: 140px;
}

/* Tags inside post mockup */
.lp-post-mockup .lp-gen-tags {
  padding: 0 var(--space-md) var(--space-xs);
}

@keyframes shimmer {
  from { background-position: 200% 0; }
  to { background-position: -200% 0; }
}

.lp-gen-image {
  width: 100%;
  height: 120px;
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 2px solid var(--lp-border-light);
  opacity: 0;
}

.lp-gen-real-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.lp-gen-tags {
  display: flex;
  gap: var(--space-xs);
  margin-top: var(--space-xs);
}

.lp-gen-tag {
  font-size: var(--text-xs);
  padding: 4px 12px;
  border-radius: var(--radius-full);
  background: color-mix(in srgb, var(--lp-accent-violet) 15%, transparent);
  color: var(--lp-accent-violet);
  font-weight: var(--font-medium);
  opacity: 0;
}

/* ===== Step 3: Adapt ===== */
.lp-stage-adapt {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
}

.lp-platforms-fan {
  position: relative;
  width: 100%;
  height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lp-adapt-footer {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
}

.lp-adapt-footer-title {
  font-family: var(--font-heading);
  font-size: var(--text-base);
  color: rgba(255, 255, 255, 0.9);
  font-weight: var(--font-semibold);
  margin: 0;
}

.lp-adapt-footer-types {
  display: flex;
  gap: var(--space-xs);
  flex-wrap: wrap;
  justify-content: center;
}

.lp-adapt-type-pill {
  font-size: var(--text-xs);
  padding: 4px 12px;
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid var(--lp-border-light);
  color: rgba(255, 255, 255, 0.7);
  font-weight: var(--font-medium);
  letter-spacing: 0.02em;
}

.lp-platform-card {
  position: absolute;
  width: 180px;
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--lp-border-light);
  padding: var(--space-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  transition: box-shadow 0.3s ease;
  box-shadow: 0 8px 32px rgba(0,0,0,0.3), 0 0 20px color-mix(in srgb, var(--brand) 15%, transparent);
}


.lp-platform-label {
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
  color: var(--brand);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.lp-platform-preview {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

img.lp-preview-img {
  width: 100%;
  height: 80px;
  border-radius: var(--radius-sm);
  object-fit: cover;
  display: block;
}

.lp-preview-lines div {
  height: 8px;
  border-radius: 4px;
  background: var(--lp-bg-card);
  margin-top: var(--space-xs);
}

.lp-preview-lines div.short {
  width: 60%;
}

.lp-fan-check {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  color: #22c55e;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
  opacity: 0;
}

/* ===== Step 4: Schedule ===== */
.lp-schedule-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xl);
  position: relative;
  overflow: visible;
}

.lp-schedule-header {
  text-align: center;
  opacity: 0;
}

.lp-schedule-stage-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--lp-text-primary);
  margin: 0 0 var(--space-xs);
}

.lp-schedule-stage-title .material-symbols-rounded {
  color: var(--lp-accent-orange);
}

.lp-schedule-stage-desc {
  font-size: var(--text-xs);
  color: var(--lp-text-muted);
  margin: 0 0 var(--space-sm);
}

.lp-schedule-formats {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
}

.lp-format-pill {
  font-size: 10px;
  font-weight: var(--font-medium);
  padding: 2px 10px;
  border-radius: var(--radius-full);
  border: 1px solid var(--lp-border-light);
  color: var(--lp-text-secondary);
  opacity: 0;
}

.lp-cal-grid {
  display: flex;
  gap: var(--space-md);
  opacity: 0;
}

.lp-cal-day {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
}

.lp-cal-label {
  font-size: var(--text-xs);
  color: var(--lp-text-muted);
  font-weight: var(--font-medium);
}

.lp-cal-slot {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--lp-border);
  display: flex;
  align-items: center;
  justify-content: center;
}

.lp-badge-stack {
  position: relative;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.lp-cal-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--lp-accent-orange);
  opacity: 0;
  scale: 0;
}

.lp-cal-badge {
  position: absolute;
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-lg);
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  white-space: nowrap;
  opacity: 0;
}

.lp-badge-scheduled {
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid color-mix(in srgb, var(--lp-accent-orange) 30%, transparent);
  color: var(--lp-accent-orange);
  box-shadow: 0 0 16px color-mix(in srgb, var(--lp-accent-orange) 20%, transparent);
}

.lp-badge-published {
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid color-mix(in srgb, var(--lp-accent-orange) 30%, transparent);
  color: var(--lp-accent-orange);
  box-shadow: 0 0 16px color-mix(in srgb, var(--lp-accent-orange) 20%, transparent);
}



/* ===== Mobile ===== */
@media (max-width: 768px) {
  .lp-ai-creation {
    min-height: auto;
    padding: var(--space-3xl) var(--space-lg);
  }

  .lp-split-panel {
    grid-template-columns: 1fr;
    gap: var(--space-xl);
  }

  .lp-steps-nav {
    flex-direction: row;
    overflow-x: auto;
    gap: var(--space-sm);
    padding-top: 0;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }
  .lp-steps-nav::-webkit-scrollbar { display: none; }

  .lp-step-indicator {
    flex-shrink: 0;
    padding: var(--space-sm) var(--space-md);
    min-height: 44px;
    cursor: pointer;
  }

  .lp-step-text p {
    display: none !important;
  }

  .lp-step-text h3 {
    font-size: var(--text-xs);
    white-space: nowrap;
  }

  .lp-stage {
    height: 380px;
    perspective: none;
  }

  .lp-stage-step {
    /* inherits position: absolute; inset: 0 from base rule */
    transform-style: flat;
    padding: var(--space-lg);
  }

  .lp-platform-card {
    width: 140px;
  }

  .lp-cal-slot {
    width: 44px;
    height: 44px;
  }

  .lp-stage-orb {
    animation: none;
  }

  .lp-stage-orb-1 {
    width: 150px;
    height: 150px;
  }

  .lp-stage-orb-2 {
    width: 120px;
    height: 120px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .lp-stage-orb { animation: none; }
}
</style>

<style>
/* Non-scoped: GSAP pin-spacer is injected outside Vue scoped styles */
.pin-spacer:has(.lp-ai-creation) {
  background: transparent !important;
}
</style>

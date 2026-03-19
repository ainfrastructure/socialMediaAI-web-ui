<script setup lang="ts">
/**
 * Variant D — "3D Flip"
 * Content rotates out on Y-axis (like a card flip), new content rotates in from the other side
 * Floating pill indicator stretches between tabs
 */
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { gsap } from 'gsap'
import MaterialIcon from '@/components/MaterialIcon.vue'
import ShowcaseAnalyticsMockup from './ShowcaseAnalyticsMockup.vue'
import ShowcaseCompetitorMockup from './ShowcaseCompetitorMockup.vue'
import ShowcaseDesignMockup from './ShowcaseDesignMockup.vue'
import ShowcaseCalendarMockup from './ShowcaseCalendarMockup.vue'
import ShowcaseAIMockup from './ShowcaseAIMockup.vue'
import ShowcaseAdsMockup from './ShowcaseAdsMockup.vue'
import ShowcasePublishingMockup from './ShowcasePublishingMockup.vue'

const { t } = useI18n()
const sectionRef = ref<HTMLElement | null>(null)
const textPanelRef = ref<HTMLElement | null>(null)
const mockupPanelRef = ref<HTMLElement | null>(null)
const tabsRef = ref<HTMLElement | null>(null)
const tabIndicatorRef = ref<HTMLElement | null>(null)
const stepperLabelRef = ref<HTMLElement | null>(null)
const segmentRefs = ref<(HTMLElement | null)[]>([])

interface Feature {
  id: string
  icon: string
  tabKey: string
  eyebrowKey: string
  titleKey: string
  subtitleKey: string
}

const features: Feature[] = [
  { id: 'analytics', icon: 'insights', tabKey: 'appLanding.featureShowcase.tabAnalytics', eyebrowKey: 'appLanding.analytics.eyebrow', titleKey: 'appLanding.analytics.title', subtitleKey: 'appLanding.analytics.subtitle' },
  { id: 'competitor', icon: 'radar', tabKey: 'appLanding.featureShowcase.tabCompetitor', eyebrowKey: 'appLanding.competitor.eyebrow', titleKey: 'appLanding.competitor.title', subtitleKey: 'appLanding.competitor.subtitle' },
  { id: 'designBuilder', icon: 'palette', tabKey: 'appLanding.featureShowcase.tabDesignBuilder', eyebrowKey: 'appLanding.designBuilder.eyebrow', titleKey: 'appLanding.designBuilder.title', subtitleKey: 'appLanding.designBuilder.subtitle' },
  { id: 'ads', icon: 'campaign', tabKey: 'appLanding.featureShowcase.tabAds', eyebrowKey: 'appLanding.adsManager.eyebrow', titleKey: 'appLanding.adsManager.title', subtitleKey: 'appLanding.adsManager.subtitle' },
  { id: 'calendar', icon: 'calendar_month', tabKey: 'appLanding.featureShowcase.tabCalendar', eyebrowKey: 'appLanding.calendar.eyebrow', titleKey: 'appLanding.calendar.title', subtitleKey: 'appLanding.calendar.subtitle' },
  { id: 'aiAssistant', icon: 'smart_toy', tabKey: 'appLanding.featureShowcase.tabAI', eyebrowKey: 'appLanding.aiAssistant.eyebrow', titleKey: 'appLanding.aiAssistant.title', subtitleKey: 'appLanding.aiAssistant.subtitle' },
  { id: 'publishing', icon: 'rocket_launch', tabKey: 'appLanding.featureShowcase.tabPublishing', eyebrowKey: 'appLanding.publishing.eyebrow', titleKey: 'appLanding.publishing.title', subtitleKey: 'appLanding.publishing.subtitle' },
]

const activeIndex = ref(0)
const activeFeature = computed(() => features[activeIndex.value])
const isTransitioning = ref(false)

const AUTO_INTERVAL = 6000
const IDLE_RESUME = 10000
let idleTimer: ReturnType<typeof setTimeout> | null = null
const progressRef = ref<HTMLElement | null>(null)
let progressTween: gsap.core.Tween | null = null

const kpis = [
  { key: 'followers', value: '12.4K', change: '+18%', icon: 'group' },
  { key: 'engagement', value: '4.8%', change: '+32%', icon: 'favorite' },
  { key: 'reach', value: '89.2K', change: '+24%', icon: 'visibility' },
  { key: 'posts', value: '142', change: '+45%', icon: 'article' },
]

const adsStats = [
  { key: 'roas', value: '4.2x', icon: 'trending_up' },
  { key: 'cpc', value: '$0.43', icon: 'ads_click' },
  { key: 'conversions', value: '1,284', icon: 'shopping_cart' },
  { key: 'spend', value: '$2,450', icon: 'payments' },
]

const layers = [
  { key: 'background', icon: 'wallpaper', color: 'var(--lp-accent-blue)' },
  { key: 'image', icon: 'image', color: 'var(--lp-accent-violet)' },
  { key: 'video', icon: 'videocam', color: 'var(--lp-accent-cyan)' },
  { key: 'text', icon: 'title', color: 'var(--lp-accent-orange)' },
  { key: 'branding', icon: 'palette', color: 'var(--lp-accent-violet)' },
]

const competitorFeatures = [
  { key: 'benchmarking', icon: 'compare_arrows', color: 'var(--lp-accent-orange)' },
  { key: 'contentGaps', icon: 'search_insights', color: 'var(--lp-accent-blue)' },
  { key: 'trendAlerts', icon: 'notifications_active', color: 'var(--lp-accent-violet)' },
  { key: 'shareOfVoice', icon: 'pie_chart', color: 'var(--lp-accent-cyan)' },
]

const calendarFeatures = [
  { key: 'autoSchedule', icon: 'schedule', color: 'var(--lp-accent-orange)' },
  { key: 'multiPlatform', icon: 'device_hub', color: 'var(--lp-accent-blue)' },
  { key: 'contentGoals', icon: 'flag', color: 'var(--lp-accent-violet)' },
  { key: 'bulkImport', icon: 'upload_file', color: 'var(--lp-accent-cyan)' },
]

const aiFeatures = [
  { key: 'smartCreation', icon: 'auto_awesome', color: 'var(--lp-accent-orange)' },
  { key: 'brandVoice', icon: 'record_voice_over', color: 'var(--lp-accent-blue)' },
  { key: 'multiFormat', icon: 'dashboard', color: 'var(--lp-accent-cyan)' },
  { key: 'refinement', icon: 'tune', color: 'var(--lp-accent-violet)' },
]

const publishFeatures = [
  { key: 'oneClick', icon: 'touch_app', color: 'var(--lp-accent-orange)' },
  { key: 'platformOptimize', icon: 'tune', color: 'var(--lp-accent-blue)' },
  { key: 'sixPlatforms', icon: 'hub', color: 'var(--lp-accent-cyan)' },
  { key: 'smartTiming', icon: 'schedule', color: 'var(--lp-accent-violet)' },
]

const SLIDE_DURATION = 0.4

function positionIndicator(index: number, animate = false, onComplete?: () => void) {
  if (window.innerWidth < 768) { onComplete?.(); return }
  if (!tabsRef.value || !tabIndicatorRef.value) return
  const tabs = tabsRef.value.querySelectorAll('.lp-showcase-tab')
  const tab = tabs[index] as HTMLElement
  if (!tab) return

  const tabsRect = tabsRef.value.getBoundingClientRect()
  const tabRect = tab.getBoundingClientRect()
  const targetLeft = tabRect.left - tabsRect.left + tabsRef.value.scrollLeft
  const targetWidth = tabRect.width

  if (!animate) {
    gsap.set(tabIndicatorRef.value, { left: targetLeft, width: targetWidth })
    onComplete?.()
    return
  }

  gsap.to(tabIndicatorRef.value, {
    left: targetLeft,
    width: targetWidth,
    duration: SLIDE_DURATION,
    ease: 'power2.inOut',
    onComplete,
  })
}

function startProgress(delay = 0) {
  stopProgress(false)
  const isMobile = window.innerWidth < 768

  if (isMobile) {
    const segIdx = activeIndex.value
    const segEl = segmentRefs.value[segIdx]
    if (segEl) {
      gsap.set(segEl, { scaleX: 0 })
      progressTween = gsap.to(segEl, {
        scaleX: 1,
        duration: AUTO_INTERVAL / 1000,
        delay,
        ease: 'none',
        onComplete() {
          switchTo((activeIndex.value + 1) % features.length, false)
        },
      })
    } else {
      // Last node (index 6) has no segment after it — use delayed call
      progressTween = gsap.to({}, {
        duration: (AUTO_INTERVAL / 1000) + delay,
        onComplete() {
          switchTo((activeIndex.value + 1) % features.length, false)
        },
      })
    }
  } else {
    if (!progressRef.value) return
    gsap.set(progressRef.value, { scaleX: 0 })
    progressTween = gsap.to(progressRef.value, {
      scaleX: 1,
      duration: AUTO_INTERVAL / 1000,
      delay,
      ease: 'none',
      onComplete() {
        switchTo((activeIndex.value + 1) % features.length, false)
      },
    })
  }
}

function stopProgress(resetBar = true) {
  if (progressTween) { progressTween.kill(); progressTween = null }
  if (resetBar) {
    if (progressRef.value) gsap.set(progressRef.value, { scaleX: 0 })
    segmentRefs.value.forEach(el => { if (el) gsap.set(el, { scaleX: 0 }) })
  }
}

function startAutoPlay() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  stopAutoPlay()
  startProgress()
}

function stopAutoPlay() {
  stopProgress(true)
}

function scheduleResume() {
  if (idleTimer) clearTimeout(idleTimer)
  idleTimer = setTimeout(() => startAutoPlay(), IDLE_RESUME)
}

async function switchTo(index: number, userInitiated = true) {
  if (index === activeIndex.value || isTransitioning.value) return
  isTransitioning.value = true

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const isMobile = window.innerWidth < 768
  const isWrap = activeIndex.value === features.length - 1 && index === 0

  if (userInitiated) {
    stopAutoPlay()
    scheduleResume()
    positionIndicator(index, false)
  } else {
    // Auto-play: keep progress bar full during slide, animate indicator
    stopProgress(false)
    positionIndicator(index, !reducedMotion, () => {
      // After slide completes, reset progress bar
      if (progressRef.value) gsap.set(progressRef.value, { scaleX: 0 })
    })
  }

  const goingForward = isWrap || index > activeIndex.value

  // Mobile stepper: update segment fills
  if (isMobile) {
    if (isWrap) {
      const segs = segmentRefs.value.slice().reverse().filter((el): el is HTMLElement => !!el)
      if (segs.length) gsap.to(segs, { scaleX: 0, duration: 0.25, stagger: 0.05, ease: 'power2.inOut' })
    } else {
      segmentRefs.value.forEach((el, i) => {
        if (!el) return
        gsap.to(el, { scaleX: i < index ? 1 : 0, duration: 0.3, ease: 'power2.out' })
      })
    }
  }

  // Reduced motion — instant swap
  if (reducedMotion) {
    activeIndex.value = index
    isTransitioning.value = false
    if (!userInitiated) startProgress()
    return
  }

  if (isMobile) {
    // ── MOBILE: Crossfade + slide with stepper animations ──
    const fadeOuts: gsap.core.Tween[] = [
      gsap.to(textPanelRef.value, {
        opacity: 0, x: goingForward ? -30 : 30,
        duration: 0.3, ease: 'power2.in',
      }),
      gsap.to(mockupPanelRef.value, {
        opacity: 0, x: goingForward ? -30 : 30,
        duration: 0.3, ease: 'power2.in',
      }),
    ]
    if (stepperLabelRef.value) {
      fadeOuts.push(gsap.to(stepperLabelRef.value, { opacity: 0, y: -6, duration: 0.2, ease: 'power2.in' }))
    }
    await Promise.all(fadeOuts)

    activeIndex.value = index
    await nextTick()

    // Label crossfade in
    if (stepperLabelRef.value) {
      gsap.fromTo(stepperLabelRef.value, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' })
    }
    // Active node bounce
    const activeNode = sectionRef.value?.querySelector('.lp-stepper-node.active') as HTMLElement | null
    if (activeNode) {
      gsap.fromTo(activeNode, { scale: 1.3 }, { scale: 1.15, duration: 0.5, ease: 'elastic.out(1, 0.5)' })
    }

    if (textPanelRef.value) {
      gsap.fromTo(textPanelRef.value,
        { opacity: 0, x: goingForward ? 30 : -30 },
        { opacity: 1, x: 0, duration: 0.4, ease: 'power2.out',
          onComplete() { gsap.set(textPanelRef.value, { clearProps: 'all' }) } },
      )
    }
    if (mockupPanelRef.value) {
      gsap.fromTo(mockupPanelRef.value,
        { opacity: 0, x: goingForward ? 30 : -30 },
        { opacity: 1, x: 0, duration: 0.4, ease: 'power2.out',
          onComplete() { gsap.set(mockupPanelRef.value, { clearProps: 'all' }); isTransitioning.value = false; if (!userInitiated) startProgress() } },
      )
    } else {
      isTransitioning.value = false
      if (!userInitiated) startProgress()
    }
  } else {
    // ── DESKTOP: 3D flip ──
    const rotateOut = goingForward ? -45 : 45

    await Promise.all([
      gsap.to(textPanelRef.value, {
        opacity: 0, rotationY: rotateOut, x: goingForward ? -60 : 60, scale: 0.85,
        duration: 0.45, ease: 'power2.in',
      }),
      gsap.to(mockupPanelRef.value, {
        opacity: 0, rotationY: rotateOut * 0.7, x: goingForward ? -40 : 40, scale: 0.9,
        duration: 0.45, ease: 'power2.in',
      }),
    ])

    activeIndex.value = index
    await nextTick()

    const rotateIn = goingForward ? 45 : -45

    if (textPanelRef.value) {
      gsap.fromTo(textPanelRef.value,
        { opacity: 0, rotationY: rotateIn, x: goingForward ? 60 : -60, scale: 0.85 },
        {
          opacity: 1, rotationY: 0, x: 0, scale: 1,
          duration: 0.7, ease: 'power2.out',
          onComplete() { gsap.set(textPanelRef.value, { clearProps: 'all' }) },
        },
      )
    }

    if (mockupPanelRef.value) {
      gsap.fromTo(mockupPanelRef.value,
        { opacity: 0, rotationY: rotateIn * 0.7, x: goingForward ? 40 : -40, scale: 0.9 },
        {
          opacity: 1, rotationY: 0, x: 0, scale: 1,
          duration: 0.8, ease: 'power2.out',
          onComplete() {
            gsap.set(mockupPanelRef.value, { clearProps: 'all' })
            isTransitioning.value = false
            if (!userInitiated) startProgress()
          },
        },
      )
    } else {
      isTransitioning.value = false
      if (!userInitiated) startProgress()
    }
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
    e.preventDefault(); switchTo((activeIndex.value + 1) % features.length)
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
    e.preventDefault(); switchTo((activeIndex.value - 1 + features.length) % features.length)
  }
}

function onVisibilityChange() {
  if (document.hidden) {
    stopAutoPlay()
  } else {
    startAutoPlay()
  }
}

onMounted(() => {
  nextTick(() => positionIndicator(0))
  startAutoPlay()
  document.addEventListener('visibilitychange', onVisibilityChange)
})
onUnmounted(() => {
  stopAutoPlay()
  if (idleTimer) clearTimeout(idleTimer)
  document.removeEventListener('visibilitychange', onVisibilityChange)
})
</script>

<template>
  <section ref="sectionRef" class="lp-feature-showcase">
    <div class="lp-section-inner">
      <div ref="tabsRef" class="lp-showcase-tabs" role="tablist" @keydown="handleKeydown">
        <div ref="tabIndicatorRef" class="lp-tab-indicator">
          <div ref="progressRef" class="lp-tab-progress" />
        </div>
        <button
          v-for="(feature, i) in features"
          :key="feature.id"
          role="tab"
          :aria-selected="i === activeIndex"
          :tabindex="i === activeIndex ? 0 : -1"
          class="lp-showcase-tab"
          :class="{ active: i === activeIndex }"
          @click="switchTo(i)"
        >
          <MaterialIcon :icon="feature.icon" size="sm" />
          <span class="lp-tab-label">{{ t(feature.tabKey) }}</span>
        </button>
      </div>

      <div class="lp-mobile-stepper">
        <div class="lp-stepper-track">
          <template v-for="(feature, i) in features" :key="feature.id">
            <button
              class="lp-stepper-node"
              :class="{ active: i === activeIndex, completed: i < activeIndex }"
              @click="switchTo(i)"
            >
              <MaterialIcon :icon="feature.icon" size="sm" />
              <div v-if="i === activeIndex" class="lp-stepper-glow" />
            </button>
            <div
              v-if="i < features.length - 1"
              class="lp-stepper-segment"
            >
              <div
                class="lp-stepper-segment-fill"
                :ref="(el) => { segmentRefs[i] = el as HTMLElement | null }"
              />
            </div>
          </template>
        </div>
        <div ref="stepperLabelRef" class="lp-stepper-label">
          {{ t(activeFeature.tabKey) }}
        </div>
      </div>

      <div class="lp-showcase-content" role="tabpanel">
        <div ref="textPanelRef" class="lp-showcase-text">
          <span class="lp-eyebrow">{{ t(activeFeature.eyebrowKey) }}</span>
          <h2 class="lp-section-title-left">{{ t(activeFeature.titleKey) }}</h2>
          <p class="lp-section-sub-left">{{ t(activeFeature.subtitleKey) }}</p>

          <div v-if="activeFeature.id === 'analytics'" class="lp-kpi-grid">
            <div v-for="kpi in kpis" :key="kpi.key" class="lp-kpi-card">
              <div class="lp-kpi-icon"><MaterialIcon :icon="kpi.icon" size="sm" /></div>
              <div class="lp-kpi-content">
                <span class="lp-kpi-value">{{ kpi.value }}</span>
                <span class="lp-kpi-label">{{ t(`appLanding.analytics.${kpi.key}`) }}</span>
              </div>
              <span class="lp-kpi-change">{{ kpi.change }}</span>
            </div>
          </div>

          <div v-if="activeFeature.id === 'competitor'" class="lp-layers">
            <div v-for="(feat, i) in competitorFeatures" :key="feat.key" class="lp-layer-item" :style="{ '--layer-color': feat.color }">
              <div class="lp-layer-icon"><MaterialIcon :icon="feat.icon" size="sm" /></div>
              <div class="lp-layer-info">
                <span class="lp-layer-name">{{ t(`appLanding.competitor.${feat.key}`) }}</span>
                <span class="lp-layer-desc">{{ t(`appLanding.competitor.${feat.key}Desc`) }}</span>
              </div>
              <span class="lp-layer-num">{{ String(i + 1).padStart(2, '0') }}</span>
            </div>
          </div>

          <div v-if="activeFeature.id === 'ads'" class="lp-kpi-grid">
            <div v-for="stat in adsStats" :key="stat.key" class="lp-kpi-card">
              <div class="lp-kpi-icon"><MaterialIcon :icon="stat.icon" size="sm" /></div>
              <div class="lp-kpi-content">
                <span class="lp-kpi-value">{{ stat.value }}</span>
                <span class="lp-kpi-label">{{ t(`appLanding.adsManager.${stat.key}`) }}</span>
              </div>
            </div>
          </div>

          <div v-if="activeFeature.id === 'designBuilder'" class="lp-layers">
            <div v-for="(layer, i) in layers" :key="layer.key" class="lp-layer-item" :style="{ '--layer-color': layer.color }">
              <div class="lp-layer-icon"><MaterialIcon :icon="layer.icon" size="sm" /></div>
              <div class="lp-layer-info">
                <span class="lp-layer-name">{{ t(`appLanding.designBuilder.${layer.key}`) }}</span>
                <span class="lp-layer-desc">{{ t(`appLanding.designBuilder.${layer.key}Desc`) }}</span>
              </div>
              <span class="lp-layer-num">{{ String(i + 1).padStart(2, '0') }}</span>
            </div>
          </div>

          <div v-if="activeFeature.id === 'calendar'" class="lp-layers">
            <div v-for="(feat, i) in calendarFeatures" :key="feat.key" class="lp-layer-item" :style="{ '--layer-color': feat.color }">
              <div class="lp-layer-icon"><MaterialIcon :icon="feat.icon" size="sm" /></div>
              <div class="lp-layer-info">
                <span class="lp-layer-name">{{ t(`appLanding.calendar.${feat.key}`) }}</span>
                <span class="lp-layer-desc">{{ t(`appLanding.calendar.${feat.key}Desc`) }}</span>
              </div>
              <span class="lp-layer-num">{{ String(i + 1).padStart(2, '0') }}</span>
            </div>
          </div>

          <div v-if="activeFeature.id === 'aiAssistant'" class="lp-layers">
            <div v-for="(item, i) in aiFeatures" :key="item.key" class="lp-layer-item" :style="{ '--layer-color': item.color }">
              <div class="lp-layer-icon"><MaterialIcon :icon="item.icon" size="sm" /></div>
              <div class="lp-layer-info">
                <span class="lp-layer-name">{{ t(`appLanding.aiAssistant.${item.key}`) }}</span>
                <span class="lp-layer-desc">{{ t(`appLanding.aiAssistant.${item.key}Desc`) }}</span>
              </div>
              <span class="lp-layer-num">{{ String(i + 1).padStart(2, '0') }}</span>
            </div>
          </div>

          <div v-if="activeFeature.id === 'publishing'" class="lp-layers">
            <div v-for="(item, i) in publishFeatures" :key="item.key" class="lp-layer-item" :style="{ '--layer-color': item.color }">
              <div class="lp-layer-icon"><MaterialIcon :icon="item.icon" size="sm" /></div>
              <div class="lp-layer-info">
                <span class="lp-layer-name">{{ t(`appLanding.publishing.${item.key}`) }}</span>
                <span class="lp-layer-desc">{{ t(`appLanding.publishing.${item.key}Desc`) }}</span>
              </div>
              <span class="lp-layer-num">{{ String(i + 1).padStart(2, '0') }}</span>
            </div>
          </div>
        </div>

        <div ref="mockupPanelRef" class="lp-showcase-mockup">
          <ShowcaseAnalyticsMockup v-if="activeFeature.id === 'analytics'" :visible="activeFeature.id === 'analytics'" />
          <ShowcaseCompetitorMockup v-if="activeFeature.id === 'competitor'" :visible="activeFeature.id === 'competitor'" />
          <ShowcaseDesignMockup v-if="activeFeature.id === 'designBuilder'" :visible="activeFeature.id === 'designBuilder'" />
          <ShowcaseAdsMockup v-if="activeFeature.id === 'ads'" :visible="activeFeature.id === 'ads'" />
          <ShowcaseCalendarMockup v-if="activeFeature.id === 'calendar'" :visible="activeFeature.id === 'calendar'" />
          <ShowcaseAIMockup v-if="activeFeature.id === 'aiAssistant'" :visible="activeFeature.id === 'aiAssistant'" />
          <ShowcasePublishingMockup v-if="activeFeature.id === 'publishing'" :visible="activeFeature.id === 'publishing'" />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.lp-feature-showcase { padding: var(--lp-section-gap) var(--space-xl); }
.lp-section-inner { max-width: var(--lp-max-width); margin: 0 auto; }

.lp-showcase-tabs {
  display: flex; gap: var(--space-sm); justify-content: center;
  margin-bottom: var(--space-4xl); flex-wrap: nowrap; position: relative;
  overflow-x: auto; scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}
.lp-showcase-tabs::-webkit-scrollbar { display: none; }

.lp-tab-indicator {
  position: absolute; top: 0; height: 100%;
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.04);
  border: 1.5px solid var(--lp-border-light);
  pointer-events: none; z-index: 0;
  overflow: hidden;
}

.lp-tab-progress {
  position: absolute;
  inset: 0;
  background: var(--lp-accent-blue);
  border-radius: inherit;
  transform-origin: left;
  transform: scaleX(0);
}

.lp-showcase-tab {
  display: flex; align-items: center; gap: var(--space-xs);
  padding: var(--space-sm) var(--space-lg);
  border: 1px solid transparent; border-radius: var(--radius-full);
  background: transparent; color: var(--lp-text-secondary);
  font-size: var(--text-sm); font-weight: var(--font-semibold);
  cursor: pointer; transition: color 0.3s ease;
  position: relative; z-index: 1; flex-shrink: 0;
}
@media (hover: hover) { .lp-showcase-tab:hover { color: var(--lp-text-primary); } }
@media (hover: none) { .lp-showcase-tab:active { color: var(--lp-text-primary); } }
.lp-showcase-tab.active { color: #fff; }
.lp-tab-label { white-space: nowrap; }

.lp-showcase-content {
  display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-5xl);
  align-items: center; min-height: 420px; overflow: visible;
  perspective: 1200px;
}

.lp-showcase-text { will-change: transform, opacity; transform-style: preserve-3d; }
.lp-showcase-mockup { will-change: transform, opacity; transform-style: preserve-3d; }

.lp-eyebrow {
  display: inline-block; font-size: var(--text-xs); font-weight: var(--font-semibold);
  color: var(--lp-accent-orange); text-transform: uppercase; letter-spacing: 0.15em;
  margin-bottom: var(--space-lg);
}
.lp-section-title-left {
  font-family: var(--font-heading); font-size: clamp(2rem, 4vw, 2.75rem);
  font-weight: var(--font-bold); color: var(--lp-text-primary);
  margin: 0 0 var(--space-lg); letter-spacing: -0.02em;
}
.lp-section-sub-left {
  font-size: var(--text-lg); color: var(--lp-text-secondary);
  margin: 0 0 var(--space-3xl); line-height: 1.6;
}

.lp-kpi-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-lg); }
.lp-kpi-card {
  display: flex; align-items: center; gap: var(--space-md);
  background: var(--lp-bg-surface); border: 1px solid var(--lp-border);
  border-radius: var(--radius-lg); padding: var(--space-lg); transition: border-color 0.3s ease;
}
@media (hover: hover) { .lp-kpi-card:hover { border-color: var(--lp-border-light); } }
.lp-kpi-icon {
  width: 36px; height: 36px; border-radius: var(--radius-md);
  background: rgba(249, 115, 22, 0.1); display: flex; align-items: center;
  justify-content: center; color: var(--lp-accent-orange); flex-shrink: 0;
}
.lp-kpi-content { display: flex; flex-direction: column; flex: 1; min-width: 0; }
.lp-kpi-value { font-size: var(--text-lg); font-weight: var(--font-bold); color: var(--lp-text-primary); }
.lp-kpi-label { font-size: var(--text-xs); color: var(--lp-text-muted); }
.lp-kpi-change { font-size: var(--text-xs); font-weight: var(--font-semibold); color: #22c55e; flex-shrink: 0; }

.lp-layers { display: flex; flex-direction: column; gap: var(--space-md); }
.lp-layer-item {
  display: flex; align-items: center; gap: var(--space-md);
  padding: var(--space-md) var(--space-lg); background: var(--lp-bg-surface);
  border: 1px solid var(--lp-border); border-radius: var(--radius-lg); transition: border-color 0.3s ease;
}
@media (hover: hover) { .lp-layer-item:hover { border-color: var(--layer-color, var(--lp-border-light)); } }
.lp-layer-icon {
  width: 36px; height: 36px; border-radius: var(--radius-md);
  background: rgba(128, 128, 128, 0.1); display: flex; align-items: center;
  justify-content: center; color: var(--layer-color); flex-shrink: 0;
}
.lp-layer-info { flex: 1; display: flex; flex-direction: column; }
.lp-layer-name { font-size: var(--text-sm); font-weight: var(--font-semibold); color: var(--lp-text-primary); }
.lp-layer-desc { font-size: var(--text-xs); color: var(--lp-text-muted); }
.lp-layer-num { font-size: var(--text-xs); font-weight: var(--font-bold); color: var(--lp-text-muted); letter-spacing: 0.1em; }

.lp-mobile-stepper { display: none; }

@keyframes stepper-pulse {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 0.2; transform: scale(1.2); }
}

@media (max-width: 768px) {
  .lp-feature-showcase { padding: var(--space-2xl) var(--space-lg); overflow-x: clip; }
  .lp-showcase-tabs { display: none; }

  .lp-mobile-stepper {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-md);
    margin-bottom: var(--space-xl);
  }
  .lp-stepper-track {
    display: flex;
    align-items: center;
    width: 100%;
    padding: 0 var(--space-xs);
  }
  .lp-stepper-node {
    position: relative;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 1.5px solid var(--lp-border-light);
    background: var(--lp-bg-surface);
    color: var(--lp-text-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex-shrink: 0;
    transition: all 0.3s ease;
    padding: 0;
    z-index: 1;
  }
  .lp-stepper-node::before {
    content: '';
    position: absolute;
    inset: -4px;
    border-radius: 50%;
  }
  .lp-stepper-node.active {
    background: var(--lp-accent-blue);
    border-color: var(--lp-accent-blue);
    color: #fff;
    transform: scale(1.15);
    box-shadow: 0 0 16px rgba(99, 102, 241, 0.4);
  }
  .lp-stepper-node.completed {
    border-color: rgba(99, 102, 241, 0.4);
    background: rgba(99, 102, 241, 0.1);
    color: var(--lp-accent-blue);
  }
  .lp-stepper-glow {
    position: absolute;
    inset: -4px;
    border-radius: 50%;
    border: 2px solid var(--lp-accent-blue);
    opacity: 0.5;
    animation: stepper-pulse 2s ease-in-out infinite;
    pointer-events: none;
  }
  .lp-stepper-segment {
    flex: 1;
    height: 2px;
    background: var(--lp-border);
    position: relative;
    overflow: hidden;
    border-radius: 1px;
  }
  .lp-stepper-segment-fill {
    position: absolute;
    inset: 0;
    background: var(--lp-accent-blue);
    border-radius: inherit;
    transform: scaleX(0);
    transform-origin: left;
  }
  .lp-stepper-label {
    font-size: var(--text-sm);
    font-weight: var(--font-semibold);
    color: var(--lp-text-primary);
    text-align: center;
    min-height: 1.4em;
  }
  .lp-showcase-content { grid-template-columns: 1fr; gap: var(--space-xl); min-height: auto; perspective: none; align-items: start; }
  .lp-showcase-text { transform-style: flat; }
  .lp-showcase-mockup { transform-style: flat; overflow: visible; }
  .lp-kpi-grid { grid-template-columns: 1fr 1fr; }
  .lp-eyebrow { margin-bottom: var(--space-sm); }
  .lp-section-title-left { font-size: clamp(1.5rem, 5vw, 2rem); margin-bottom: var(--space-sm); }
  .lp-section-sub-left { font-size: var(--text-sm); margin-bottom: var(--space-md); }
  .lp-layers { display: none; }
  .lp-kpi-grid { display: none; }
}

@media (max-width: 768px) and (prefers-reduced-motion: reduce) {
  .lp-stepper-glow { animation: none; }
}
</style>

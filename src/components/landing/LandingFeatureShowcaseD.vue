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

function positionIndicator(index: number, animate = false) {
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
    return
  }

  gsap.to(tabIndicatorRef.value, {
    left: targetLeft,
    width: targetWidth,
    duration: 0.4,
    ease: 'power2.inOut',
  })
}

function startProgress() {
  stopProgress()
  if (!progressRef.value) return
  gsap.set(progressRef.value, { scaleX: 0 })
  progressTween = gsap.to(progressRef.value, {
    scaleX: 1,
    duration: AUTO_INTERVAL / 1000,
    ease: 'none',
    onComplete() {
      switchTo((activeIndex.value + 1) % features.length, false)
    },
  })
}

function stopProgress() {
  if (progressTween) { progressTween.kill(); progressTween = null }
  if (progressRef.value) gsap.set(progressRef.value, { scaleX: 0 })
}

function startAutoPlay() {
  stopAutoPlay()
  startProgress()
}

function stopAutoPlay() {
  stopProgress()
}

function scheduleResume() {
  if (idleTimer) clearTimeout(idleTimer)
  idleTimer = setTimeout(() => startAutoPlay(), IDLE_RESUME)
}

async function switchTo(index: number, userInitiated = true) {
  if (index === activeIndex.value || isTransitioning.value) return
  isTransitioning.value = true

  if (userInitiated) { stopAutoPlay(); scheduleResume() }

  // Instantly jump indicator to new tab (no slide animation)
  positionIndicator(index, false)

  const goingForward = index > activeIndex.value
  const isMobile = window.innerWidth < 768
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // Scroll active tab into view on mobile
  if (isMobile && tabsRef.value) {
    const tabs = tabsRef.value.querySelectorAll('.lp-showcase-tab')
    const tab = tabs[index] as HTMLElement
    if (tab) {
      await nextTick()
      tab.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
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
    // ── MOBILE: Simple crossfade + slide ──
    await Promise.all([
      gsap.to(textPanelRef.value, {
        opacity: 0, x: goingForward ? -30 : 30,
        duration: 0.3, ease: 'power2.in',
      }),
      gsap.to(mockupPanelRef.value, {
        opacity: 0, x: goingForward ? -30 : 30,
        duration: 0.3, ease: 'power2.in',
      }),
    ])

    activeIndex.value = index
    await nextTick()

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

onMounted(() => {
  nextTick(() => positionIndicator(0))
  startAutoPlay()
})
onUnmounted(() => {
  stopAutoPlay()
  if (idleTimer) clearTimeout(idleTimer)
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
  background: rgba(139, 92, 246, 0.15);
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
.lp-showcase-tab.active { color: var(--lp-accent-orange); }
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

@media (max-width: 768px) {
  .lp-showcase-tabs { justify-content: flex-start; padding-bottom: var(--space-sm); }
  .lp-tab-indicator { display: none; }
  .lp-showcase-tab { border: 1px solid var(--lp-border); background: var(--lp-bg-surface); }
  .lp-showcase-tab.active { border-color: var(--lp-accent-orange); background: rgba(249, 115, 22, 0.06); }
  .lp-showcase-content { grid-template-columns: 1fr; gap: var(--space-3xl); min-height: auto; perspective: none; }
  .lp-showcase-text, .lp-showcase-mockup { transform-style: flat; }
  .lp-showcase-tab { min-height: 44px; }
  .lp-kpi-grid { grid-template-columns: 1fr; }
}
</style>

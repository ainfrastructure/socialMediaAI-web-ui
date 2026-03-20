<script setup lang="ts">
import { ref, reactive, onMounted, type Component } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGsapSection, ScrollTrigger } from '@/composables/useGsapSection'
import ShowcaseAIMockup from './ShowcaseAIMockup.vue'
import ShowcaseDesignMockup from './ShowcaseDesignMockup.vue'
import ShowcaseCalendarMockup from './ShowcaseCalendarMockup.vue'
import ShowcasePublishingMockup from './ShowcasePublishingMockup.vue'
import ShowcaseAnalyticsMockup from './ShowcaseAnalyticsMockup.vue'
import ShowcaseCompetitorMockup from './ShowcaseCompetitorMockup.vue'
import ShowcaseAdsMockup from './ShowcaseAdsMockup.vue'

const { t } = useI18n()
const sectionRef = ref<HTMLElement | null>(null)
const visibleRows = reactive(new Set<number>())

interface Feature {
  id: string
  eyebrowKey: string
  titleKey: string
  subtitleKey: string
  mockup: Component
}

const features: Feature[] = [
  { id: 'aiAssistant', eyebrowKey: 'appLanding.aiAssistant.eyebrow', titleKey: 'appLanding.aiAssistant.title', subtitleKey: 'appLanding.aiAssistant.subtitle', mockup: ShowcaseAIMockup },
  { id: 'designBuilder', eyebrowKey: 'appLanding.designBuilder.eyebrow', titleKey: 'appLanding.designBuilder.title', subtitleKey: 'appLanding.designBuilder.subtitle', mockup: ShowcaseDesignMockup },
  { id: 'calendar', eyebrowKey: 'appLanding.calendar.eyebrow', titleKey: 'appLanding.calendar.title', subtitleKey: 'appLanding.calendar.subtitle', mockup: ShowcaseCalendarMockup },
  { id: 'publishing', eyebrowKey: 'appLanding.publishing.eyebrow', titleKey: 'appLanding.publishing.title', subtitleKey: 'appLanding.publishing.subtitle', mockup: ShowcasePublishingMockup },
  { id: 'analytics', eyebrowKey: 'appLanding.analytics.eyebrow', titleKey: 'appLanding.analytics.title', subtitleKey: 'appLanding.analytics.subtitle', mockup: ShowcaseAnalyticsMockup },
  { id: 'competitor', eyebrowKey: 'appLanding.competitor.eyebrow', titleKey: 'appLanding.competitor.title', subtitleKey: 'appLanding.competitor.subtitle', mockup: ShowcaseCompetitorMockup },
  { id: 'ads', eyebrowKey: 'appLanding.adsManager.eyebrow', titleKey: 'appLanding.adsManager.title', subtitleKey: 'appLanding.adsManager.subtitle', mockup: ShowcaseAdsMockup },
]

// Reduced motion: show all mockups immediately (useGsapSection skips animations)
onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    features.forEach((_, i) => visibleRows.add(i))
  }
})

useGsapSection(sectionRef, (el, gsap) => {
  const isMobile = window.innerWidth < 768
  const rows = el.querySelectorAll('.lp-zigzag-row')

  rows.forEach((row, i) => {
    const text = row.querySelector('.lp-zigzag-text') as HTMLElement | null
    const mockup = row.querySelector('.lp-zigzag-mockup') as HTMLElement | null
    const isReversed = i % 2 === 1

    if (isMobile) {
      // Mobile: bidirectional zigzag animation with smaller offsets for narrow screens
      if (text) gsap.set(text, { opacity: 0, x: isReversed ? 40 : -40, scale: 0.95, filter: 'blur(4px)' })
      if (mockup) gsap.set(mockup, { opacity: 0, x: isReversed ? -40 : 40, scale: 0.95, filter: 'blur(4px)' })

      const enterProps = { opacity: 1, x: 0, y: 0, scale: 1, filter: 'blur(0px)' }
      const leaveText = { opacity: 0, x: isReversed ? 40 : -40, scale: 0.95, filter: 'blur(4px)' }
      const leaveMockup = { opacity: 0, x: isReversed ? -40 : 40, scale: 0.95, filter: 'blur(4px)' }

      ScrollTrigger.create({
        trigger: row as HTMLElement,
        start: 'top 85%',
        end: 'bottom 15%',
        onEnter: () => {
          visibleRows.add(i)
          if (text) gsap.to(text, { ...enterProps, duration: 0.6, ease: 'power4.out' })
          if (mockup) gsap.to(mockup, { ...enterProps, duration: 0.6, delay: 0.1, ease: 'power4.out' })
        },
        onLeave: () => {
          visibleRows.delete(i)
          if (text) gsap.to(text, { ...leaveText, duration: 0.4, ease: 'power2.in' })
          if (mockup) gsap.to(mockup, { ...leaveMockup, duration: 0.4, ease: 'power2.in' })
        },
        onEnterBack: () => {
          visibleRows.add(i)
          if (text) gsap.to(text, { ...enterProps, duration: 0.6, ease: 'power4.out' })
          if (mockup) gsap.to(mockup, { ...enterProps, duration: 0.6, delay: 0.1, ease: 'power4.out' })
        },
        onLeaveBack: () => {
          visibleRows.delete(i)
          if (text) gsap.to(text, { ...leaveText, duration: 0.4, ease: 'power2.in' })
          if (mockup) gsap.to(mockup, { ...leaveMockup, duration: 0.4, ease: 'power2.in' })
        },
      })
    } else {
      // Desktop: bidirectional zigzag animation
      if (text) gsap.set(text, { opacity: 0, x: isReversed ? 60 : -60, scale: 0.95, filter: 'blur(4px)' })
      if (mockup) gsap.set(mockup, { opacity: 0, x: isReversed ? -60 : 60, scale: 0.95, filter: 'blur(4px)' })

      const enterProps = { opacity: 1, x: 0, y: 0, scale: 1, filter: 'blur(0px)' }
      const leaveText = { opacity: 0, x: isReversed ? 60 : -60, scale: 0.95, filter: 'blur(4px)' }
      const leaveMockup = { opacity: 0, x: isReversed ? -60 : 60, scale: 0.95, filter: 'blur(4px)' }

      ScrollTrigger.create({
        trigger: row as HTMLElement,
        start: 'top 70%',
        end: 'bottom 20%',
        onEnter: () => {
          visibleRows.add(i)
          if (text) gsap.to(text, { ...enterProps, duration: 0.6, ease: 'power4.out' })
          if (mockup) gsap.to(mockup, { ...enterProps, duration: 0.6, delay: 0.1, ease: 'power4.out' })
        },
        onLeave: () => {
          visibleRows.delete(i)
          if (text) gsap.to(text, { ...leaveText, duration: 0.4, ease: 'power2.in' })
          if (mockup) gsap.to(mockup, { ...leaveMockup, duration: 0.4, ease: 'power2.in' })
        },
        onEnterBack: () => {
          visibleRows.add(i)
          if (text) gsap.to(text, { ...enterProps, duration: 0.6, ease: 'power4.out' })
          if (mockup) gsap.to(mockup, { ...enterProps, duration: 0.6, delay: 0.1, ease: 'power4.out' })
        },
        onLeaveBack: () => {
          visibleRows.delete(i)
          if (text) gsap.to(text, { ...leaveText, duration: 0.4, ease: 'power2.in' })
          if (mockup) gsap.to(mockup, { ...leaveMockup, duration: 0.4, ease: 'power2.in' })
        },
      })
    }
  })
})
</script>

<template>
  <section ref="sectionRef" class="lp-feature-showcase">
    <div class="lp-section-inner">
      <div
        v-for="(feature, i) in features"
        :key="feature.id"
        class="lp-zigzag-row"
        :class="{ 'lp-zigzag-row--reversed': i % 2 === 1 }"
      >
        <div class="lp-zigzag-text">
          <span class="lp-feature-number">{{ String(i + 1).padStart(2, '0') }}</span>
          <span class="lp-eyebrow">{{ t(feature.eyebrowKey) }}</span>
          <h2 class="lp-section-title-left">{{ t(feature.titleKey) }}</h2>
          <p class="lp-section-sub-left">{{ t(feature.subtitleKey) }}</p>
        </div>
        <div class="lp-zigzag-mockup">
          <component :is="feature.mockup" :visible="visibleRows.has(i)" />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.lp-feature-showcase {
  padding: var(--lp-section-gap) var(--space-xl);
}

.lp-section-inner {
  max-width: var(--lp-max-width);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--lp-section-gap);
}

.lp-zigzag-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-5xl);
  align-items: center;
}

.lp-zigzag-row--reversed .lp-zigzag-text {
  order: 2;
}

.lp-zigzag-row--reversed .lp-zigzag-mockup {
  order: 1;
}

.lp-zigzag-text {
  position: relative;
}

.lp-feature-number {
  position: absolute;
  top: -0.5em;
  left: -0.1em;
  font-family: var(--font-heading);
  font-size: clamp(4rem, 8vw, 7rem);
  font-weight: var(--font-bold);
  color: var(--lp-text-primary);
  opacity: 0.12;
  line-height: 1;
  pointer-events: none;
  user-select: none;
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

.lp-section-title-left {
  font-family: var(--font-heading);
  font-size: clamp(2rem, 4vw, 2.75rem);
  font-weight: var(--font-bold);
  color: var(--lp-text-primary);
  margin: 0 0 var(--space-lg);
  letter-spacing: -0.02em;
}

.lp-section-sub-left {
  font-size: var(--text-lg);
  color: var(--lp-text-secondary);
  margin: 0;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .lp-feature-showcase {
    padding: var(--space-2xl) var(--space-lg);
  }

  .lp-section-inner {
    gap: var(--space-4xl);
  }

  .lp-zigzag-row {
    grid-template-columns: 1fr;
    gap: var(--space-xl);
  }

  .lp-zigzag-row--reversed .lp-zigzag-text,
  .lp-zigzag-row--reversed .lp-zigzag-mockup {
    order: unset;
  }

  .lp-section-title-left {
    font-size: clamp(1.5rem, 5vw, 2rem);
    margin-bottom: var(--space-sm);
  }

  .lp-section-sub-left {
    font-size: var(--text-sm);
  }

  .lp-eyebrow {
    margin-bottom: var(--space-sm);
  }

  .lp-feature-number {
    font-size: clamp(3rem, 10vw, 4rem);
  }
}
</style>

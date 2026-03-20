<script setup lang="ts">
import { ref, defineAsyncComponent, onMounted, onUnmounted } from 'vue'
import { useCursorGlow } from '@/composables/useCursorGlow'
import LandingBackground from '@/components/landing/LandingBackground.vue'
import LandingNav from '@/components/landing/LandingNav.vue'
import LandingPhoneCinematic from '@/components/landing/LandingPhoneCinematic.vue'
import LazySectionWrapper from '@/components/landing/LazySectionWrapper.vue'

const LandingPlatformMarquee = defineAsyncComponent(() => import('@/components/landing/LandingPlatformMarquee.vue'))
const LandingAICreation = defineAsyncComponent(() => import('@/components/landing/LandingAICreation.vue'))
const LandingFeatureShowcase = defineAsyncComponent(() => import('@/components/landing/LandingFeatureShowcaseD.vue'))
const LandingBuiltFor = defineAsyncComponent(() => import('@/components/landing/LandingBuiltFor.vue'))
const LandingTestimonials = defineAsyncComponent(() => import('@/components/landing/LandingTestimonials.vue'))
const LandingPricing = defineAsyncComponent(() => import('@/components/landing/LandingPricing.vue'))
const LandingFinalCTA = defineAsyncComponent(() => import('@/components/landing/LandingFinalCTA.vue'))
const LandingFooter = defineAsyncComponent(() => import('@/components/landing/LandingFooter.vue'))

const wrapperRef = ref<HTMLElement | null>(null)

useCursorGlow(wrapperRef)

const originalBodyBg = document.body.style.backgroundColor
const originalHtmlBg = document.documentElement.style.backgroundColor

onMounted(() => {
  document.documentElement.style.backgroundColor = '#081418'
  document.body.style.backgroundColor = '#081418'
  if (wrapperRef.value) {
    wrapperRef.value.style.colorScheme = 'dark'
  }
})

onUnmounted(() => {
  document.documentElement.style.backgroundColor = originalHtmlBg
  document.body.style.backgroundColor = originalBodyBg
})
</script>

<template>
  <div ref="wrapperRef" class="landing-dark bg-active">
    <!-- Interactive canvas background (z-index: 0, behind everything) -->
    <LandingBackground mode="particles" accent-color="#3A9BC0" :intensity="3" :particle-density="4" particle-color-mode="vortex" particle-style="flow" :particle-speed="1" />

    <!-- Cursor glow -->
    <div class="lp-cursor-glow" />

    <LandingNav />
    <LandingPhoneCinematic />

    <LazySectionWrapper min-height="120px" root-margin="100px 0px">
      <LandingPlatformMarquee />
    </LazySectionWrapper>

    <LazySectionWrapper min-height="500px" root-margin="200px 0px">
      <LandingBuiltFor />
    </LazySectionWrapper>

    <LazySectionWrapper min-height="700px" root-margin="300px 0px" id="lp-how-it-works">
      <LandingAICreation />
    </LazySectionWrapper>

    <LazySectionWrapper min-height="700px" root-margin="300px 0px">
      <LandingFeatureShowcase />
    </LazySectionWrapper>

    <LazySectionWrapper min-height="600px" root-margin="200px 0px">
      <LandingTestimonials />
    </LazySectionWrapper>

    <LazySectionWrapper min-height="800px" root-margin="200px 0px" id="lp-pricing">
      <LandingPricing />
    </LazySectionWrapper>

    <LazySectionWrapper min-height="400px" root-margin="200px 0px" id="lp-final-cta">
      <LandingFinalCTA />
    </LazySectionWrapper>

    <LazySectionWrapper min-height="100px" root-margin="200px 0px">
      <LandingFooter />
    </LazySectionWrapper>
  </div>
</template>

<style scoped>
.landing-dark {
  /* Landing page CSS variables (formerly from useLandingTheme) */
  --lp-bg-primary: #081418;
  --lp-bg-surface: #0E2230;
  --lp-bg-card: #163040;
  --lp-bg-elevated: #163040;
  --lp-accent-orange: #3A9BC0;
  --lp-accent-orange-hover: #2D7F9E;
  --lp-accent-orange-glow: #3A9BC040;
  --lp-accent-violet: #2D7F9E;
  --lp-accent-blue: #6EC0DE;
  --lp-accent-cyan: #6EC0DE;
  --lp-gradient-aurora: linear-gradient(135deg, #3A9BC0, #6EC0DE, #2D7F9E);
  --lp-gradient-orange: linear-gradient(135deg, #3A9BC0, #2D7F9E);
  --lp-text-primary: #F4F4F5;
  --lp-text-secondary: #A1A1AA;
  --lp-text-muted: #71717A;
  --lp-border: rgba(255,255,255,0.06);
  --lp-border-light: rgba(255,255,255,0.1);
  --lp-glass-bg: rgba(255,255,255,0.03);
  --lp-glass-border: rgba(255,255,255,0.06);
  --lp-shadow-card: 0 4px 24px rgba(0,0,0,0.4);
  --lp-shadow-glow: 0 0 40px #3A9BC026;
  --lp-nav-scrolled-bg: rgba(8,20,24,0.8);
  --lp-nav-mobile-bg: rgba(8,20,24,0.95);
  --lp-hover-overlay: rgba(255,255,255,0.06);

  min-height: 100vh;
  min-height: 100dvh;
  font-family: var(--font-body);
  overflow-x: clip;
  position: relative;
  background: var(--lp-bg-primary);
  color: var(--lp-text-primary);
}

.lp-cursor-glow {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  background: radial-gradient(
    600px circle at var(--cursor-x, 50%) var(--cursor-y, 50%),
    rgba(249, 115, 22, 0.06),
    transparent 60%
  );
  transition: background 0.15s ease-out;
}

@media (hover: none) {
  .lp-cursor-glow { display: none; }
}

@media (prefers-reduced-motion: reduce) {
  .lp-cursor-glow { display: none; }
}

@media (max-width: 768px) {
  .landing-dark { overflow-x: visible; overflow-y: visible; }
}
</style>

<style>
/* Non-scoped: guaranteed to reach every element regardless of component boundaries */
.bg-active {
  background: transparent !important;
}

.bg-active *,
.bg-active *::before,
.bg-active *::after {
  border: 0 !important;
  box-shadow: none !important;
  outline: none !important;
}

/* Restore stage container and internal borders (revert doesn't work — goes to UA, not component CSS) */
.bg-active .cp-stage { border: 1px solid var(--lp-border) !important; }
.bg-active .cp-stage .cp-mock-chat,
.bg-active .cp-stage .cp-gen-container,
.bg-active .cp-stage .cp-platform-card,
.bg-active .cp-stage .cp-cal-slot,
.bg-active .cp-stage .cp-gen-image,
.bg-active .cp-stage .cp-chat-input-row,
.bg-active .cp-stage .cp-suggestion,
.bg-active .cp-stage .cp-cal-badge { border: 1px solid var(--lp-border-light) !important; }
.bg-active .cp-stage .cp-chat-header { border-bottom: 1px solid var(--lp-border) !important; }
.bg-active .cp-stage .cp-left { border-right: 1px solid var(--lp-border) !important; }
.bg-active .cp-stage {
  box-shadow: var(--lp-shadow-card), 0 0 60px rgba(139,92,246,0.08),
              inset 0 1px 0 rgba(255,255,255,0.05) !important;
}
.bg-active .cp-stage .cp-mock-chat,
.bg-active .cp-stage .cp-gen-container,
.bg-active .cp-stage .cp-platform-card,
.bg-active .cp-stage .cp-cal-slot { box-shadow: 0 8px 32px rgba(0,0,0,0.3) !important; }

.bg-active section,
.bg-active footer,
.bg-active header,
.bg-active .lp-hero,
.bg-active .cine-section,
.bg-active .lp-marquee {
  background: transparent !important;
  position: relative;
}

/* Cards/mockups keep backgrounds for readability */
.bg-active .lp-persona-card,
.bg-active .lp-pricing-card,
.bg-active .lp-step-indicator,
.bg-active .cp-stage,
.bg-active .lp-kpi-card,
.bg-active .lp-testimonial-card,
.bg-active .lp-brief-chat,
.bg-active .lp-cal-mockup,
.bg-active .lp-chart-mockup,
.bg-active .lp-ai-chat,
.bg-active .lp-publish-card,
.bg-active .lp-spy-dashboard,
.bg-active .lp-ads-card,
.bg-active .lp-design-card,
.bg-active .lp-canvas,
.bg-active .lp-template-card,
.bg-active .lp-layer-item,
.bg-active .lp-showcase-tab {
  background-color: var(--lp-bg-surface) !important;
}
.bg-active .lp-showcase-tab { border: 1px solid var(--lp-border) !important; }
.bg-active .lp-showcase-tab.active {
  border-color: var(--lp-accent-blue) !important;
  box-shadow: 0 0 12px color-mix(in srgb, var(--lp-accent-blue) 30%, transparent) !important;
  background-color: var(--lp-accent-blue) !important;
  color: #fff !important;
}
</style>

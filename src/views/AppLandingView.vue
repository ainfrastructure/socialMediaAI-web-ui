<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useCursorGlow } from '@/composables/useCursorGlow'
import { useLandingTheme } from '@/composables/useLandingTheme'
import LandingBackground from '@/components/landing/LandingBackground.vue'
import LandingScrollProgress from '@/components/landing/LandingScrollProgress.vue'
import LandingThemeSwitcher from '@/components/landing/LandingThemeSwitcher.vue'
import LandingNav from '@/components/landing/LandingNav.vue'
import LandingPhoneCinematic from '@/components/landing/LandingPhoneCinematic.vue'
import LandingPlatformMarquee from '@/components/landing/LandingPlatformMarquee.vue'
import LandingAICreation from '@/components/landing/LandingAICreation.vue'
import LandingFeatureShowcase from '@/components/landing/LandingFeatureShowcaseD.vue'
import LandingMultiBrand from '@/components/landing/LandingMultiBrand.vue'
import LandingTestimonials from '@/components/landing/LandingTestimonials.vue'
import LandingPricing from '@/components/landing/LandingPricing.vue'
import LandingFinalCTA from '@/components/landing/LandingFinalCTA.vue'
import LandingFooter from '@/components/landing/LandingFooter.vue'

const wrapperRef = ref<HTMLElement | null>(null)

useCursorGlow(wrapperRef)

const { activeTheme, isDarkMode, bgMode, bgIntensity, bgParticleCount, bgParticleColorMode, bgParticleStyle, applyTheme } = useLandingTheme()

const hasBgEffect = computed(() => bgMode.value !== 'none')

function applyCurrentTheme() {
  applyTheme(wrapperRef.value)
}

watch([activeTheme, isDarkMode], () => {
  applyCurrentTheme()
})

let originalBg = ''

onMounted(() => {
  originalBg = document.body.style.backgroundColor
  nextTick(() => applyCurrentTheme())
})

onUnmounted(() => {
  document.body.style.backgroundColor = originalBg
})
</script>

<template>
  <div ref="wrapperRef" class="landing-dark" :class="{ 'bg-active': hasBgEffect }">
    <!-- Interactive canvas background (z-index: 0, behind everything) -->
    <LandingBackground :mode="bgMode" :accent-color="activeTheme.accent" :intensity="bgIntensity" :particle-density="bgParticleCount" :particle-color-mode="bgParticleColorMode" :particle-style="bgParticleStyle" />

    <!-- Cursor glow -->
    <div class="lp-cursor-glow" />

    <LandingScrollProgress />
    <LandingNav />
    <LandingPhoneCinematic />
    <LandingPlatformMarquee />
    <LandingAICreation />
    <LandingFeatureShowcase />

    <LandingMultiBrand />
    <LandingTestimonials />
    <LandingPricing />
    <LandingFinalCTA />
    <LandingFooter />
  </div>

  <Teleport to="body">
    <LandingThemeSwitcher @theme-changed="applyCurrentTheme" />
  </Teleport>
</template>

<style scoped>
.landing-dark {
  min-height: 100vh;
  min-height: 100dvh;
  font-family: var(--font-body);
  overflow-x: clip;
  position: relative;
  background: var(--lp-bg-primary);
  color: var(--lp-text-primary);
  transition: background 0.4s ease, color 0.4s ease;
}

/* bg-active overrides moved to non-scoped <style> block below */

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
.bg-active .lp-stage { border: 1px solid var(--lp-border) !important; }
.bg-active .lp-stage .lp-mock-chat,
.bg-active .lp-stage .lp-gen-container,
.bg-active .lp-stage .lp-platform-card,
.bg-active .lp-stage .lp-cal-slot,
.bg-active .lp-stage .lp-gen-image,
.bg-active .lp-stage .lp-chat-input-row,
.bg-active .lp-stage .lp-published-badge { border: 1px solid var(--lp-border-light) !important; }
.bg-active .lp-stage .lp-chat-header { border-bottom: 1px solid var(--lp-border) !important; }
.bg-active .lp-stage {
  box-shadow: var(--lp-shadow-card), 0 0 60px rgba(139,92,246,0.08),
              inset 0 1px 0 rgba(255,255,255,0.05) !important;
}
.bg-active .lp-stage .lp-mock-chat,
.bg-active .lp-stage .lp-gen-container,
.bg-active .lp-stage .lp-platform-card,
.bg-active .lp-stage .lp-cal-slot { box-shadow: 0 8px 32px rgba(0,0,0,0.3) !important; }

.bg-active section,
.bg-active footer,
.bg-active header,
.bg-active .lp-hero,
.bg-active .cine-section,
.bg-active .lp-marquee {
  background: transparent !important;
  position: relative;
  z-index: 2;
}

/* Cards/mockups keep backgrounds for readability */
.bg-active .lp-pricing-card,
.bg-active .lp-step-indicator,
.bg-active .lp-stage,
.bg-active .lp-kpi-card,
.bg-active .lp-testimonial-card,
.bg-active .lp-brand-card,
.bg-active .lp-competitor-row,
.bg-active .lp-spy-dashboard,
.bg-active .lp-brief-chat,
.bg-active .lp-cal-mockup,
.bg-active .lp-ads-card,
.bg-active .lp-chart-mockup,
.bg-active .lp-canvas,
.bg-active .lp-template-card,
.bg-active .lp-cta-card,
.bg-active .lp-layer-item,
.bg-active .lp-showcase-tab {
  background-color: var(--lp-bg-surface) !important;
}
</style>

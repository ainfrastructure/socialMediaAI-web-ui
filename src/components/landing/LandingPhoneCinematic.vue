<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { gsap } from '@/composables/useGsapSection'
import { useMagneticButton } from '@/composables/useMagneticButton'
import PhoneMockup from '@/components/PhoneMockup.vue'
import MaterialIcon from '@/components/MaterialIcon.vue'
import PhoneDemoInteractive from './PhoneDemoInteractive.vue'

const { t } = useI18n()
const sectionRef = ref<HTMLElement | null>(null)
const heroCta = ref<HTMLElement | null>(null)
const demoRef = ref<InstanceType<typeof PhoneDemoInteractive> | null>(null)
const activeScenario = ref(0)

useMagneticButton(heroCta, 0.25)

function scrollToSection(sectionId: string) {
  document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' })
}

const scenarioLabels = [
  { key: 'chat' },
  { key: 'strategy' },
  { key: 'design' },
  { key: 'publish' },
  { key: 'calendar' },
  { key: 'analytics' },
  { key: 'ads' },
  { key: 'cta' },
]

const currentTitle = computed(() =>
  t(`appLanding.cinematic.featureTitle${scenarioLabels[activeScenario.value].key.charAt(0).toUpperCase() + scenarioLabels[activeScenario.value].key.slice(1)}`),
)

const currentDesc = computed(() =>
  t(`appLanding.cinematic.featureDesc${scenarioLabels[activeScenario.value].key.charAt(0).toUpperCase() + scenarioLabels[activeScenario.value].key.slice(1)}`),
)

function onPhaseChange(index: number) {
  activeScenario.value = index
}

onMounted(async () => {
  await nextTick()
  const el = sectionRef.value
  if (!el) return

  const isMobile = window.innerWidth < 768
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // Reduced motion — show everything statically
  if (reducedMotion) {
    const heroEls = ['.cine-hero-badge', '.cine-hero-headline', '.cine-hero-sub', '.cine-hero-ctas', '.cine-phone-wrap', '.cine-feature-desc']
    heroEls.forEach(sel => { const e = el.querySelector(sel) as HTMLElement; if (e) { e.style.opacity = '1'; e.style.transform = 'none' } })
    return
  }

  // Hero entrance animation
  const entrance = gsap.timeline({ defaults: { ease: 'power3.out' }, delay: isMobile ? 0.5 : 0.1 })
  if (isMobile) {
    // Text first, then phone (natural DOM order on mobile)
    entrance
      .fromTo(el.querySelector('.cine-hero-badge'), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 })
      .fromTo(el.querySelector('.cine-hero-headline'), { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7 }, '-=0.3')
      .fromTo(el.querySelector('.cine-hero-sub'), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 }, '-=0.3')
      .fromTo(el.querySelector('.cine-hero-ctas'), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 }, '-=0.2')
      .fromTo(el.querySelector('.cine-phone-wrap'), { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8 }, '-=0.3')
      .fromTo(el.querySelector('.cine-feature-desc'), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4 }, '-=0.4')
  } else {
    entrance
      .fromTo(el.querySelector('.cine-hero-badge'), { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8 })
      .fromTo(el.querySelector('.cine-hero-headline'), { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.9 }, '-=0.5')
      .fromTo(el.querySelector('.cine-hero-sub'), { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7 }, '-=0.5')
      .fromTo(el.querySelector('.cine-hero-ctas'), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 }, '-=0.3')
      .fromTo(el.querySelector('.cine-phone-wrap'), { opacity: 0, x: 60 }, { opacity: 1, x: 0, duration: 1 }, '-=1.2')
      .fromTo(el.querySelector('.cine-feature-desc'), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 }, '-=0.5')
  }
})
</script>

<template>
  <section id="lp-hero" ref="sectionRef" class="cine-section">

    <div class="cine-content">
      <!-- Hero text -->
      <div class="cine-hero-text">
        <span class="cine-hero-badge">
          <span class="cine-badge-dot" />
          {{ t('appLanding.hero.badge') }}
        </span>

        <h1 class="cine-hero-headline">
          {{ t('appLanding.hero.headline') }}
          <span class="cine-accent-gradient">{{ t('appLanding.hero.headlineAccent') }}</span>
        </h1>

        <p class="cine-hero-sub">{{ t('appLanding.hero.subheadline') }}</p>

        <div class="cine-hero-ctas">
          <button ref="heroCta" class="cine-cta-primary" @click="scrollToSection('lp-final-cta')">
            {{ t('appLanding.hero.ctaPrimary') }}
          </button>
          <button class="cine-cta-ghost" @click="scrollToSection('lp-how-it-works')">
            <MaterialIcon icon="play_circle" size="sm" />
            {{ t('appLanding.hero.ctaSecondary') }}
          </button>
        </div>

      </div>

      <!-- Phone -->
      <div class="cine-phone-wrap">
        <div class="cine-phone-glow" />
        <PhoneMockup size="lg" show-buttons>
          <PhoneDemoInteractive ref="demoRef" @phase="onPhaseChange" />
        </PhoneMockup>

        <!-- Feature description + progress dots -->
        <div class="cine-feature-desc">
          <div class="cine-feature-text">
            <Transition name="cine-slide" mode="out-in">
              <div :key="activeScenario" class="cine-feature-inner">
                <span class="cine-feature-title">{{ currentTitle }}</span>
                <span class="cine-feature-detail">{{ currentDesc }}</span>
              </div>
            </Transition>
          </div>
          <div class="cine-progress-dots">
            <button
              v-for="(s, i) in scenarioLabels"
              :key="s.key"
              class="cine-dot"
              :class="{ active: activeScenario === i }"
              :aria-label="t(`appLanding.cinematic.featureTitle${s.key.charAt(0).toUpperCase() + s.key.slice(1)}`)"
              @click="demoRef?.jumpToPhase(i)"
            />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.cine-section {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  padding: 120px var(--space-xl) var(--space-3xl);
  position: relative;
  overflow: hidden;
}

/* Layout */
.cine-content {
  max-width: var(--lp-max-width);
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: var(--space-5xl);
  align-items: center;
  width: 100%;
  position: relative;
  z-index: 1;
}

/* Hero text */
.cine-hero-text {
  min-width: 0;
}

.cine-hero-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  background: var(--lp-glass-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--lp-glass-border);
  color: var(--lp-accent-orange);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  padding: var(--space-sm) var(--space-lg);
  border-radius: var(--radius-full);
  margin-bottom: var(--space-2xl);
  letter-spacing: 0.02em;
}

.cine-badge-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--lp-accent-orange);
  animation: cine-pulse 2s ease-in-out infinite;
}

@keyframes cine-pulse {
  0%, 100% { opacity: 1; box-shadow: 0 0 0 0 var(--lp-accent-orange); }
  50% { opacity: 0.7; box-shadow: 0 0 0 6px transparent; }
}

.cine-hero-headline {
  font-family: var(--font-heading);
  font-size: clamp(2.75rem, 5.5vw, 4.25rem);
  font-weight: var(--font-bold);
  line-height: 1.1;
  color: var(--lp-text-primary);
  margin: 0 0 var(--space-xl);
  letter-spacing: -0.02em;
  overflow-wrap: break-word;
}

.cine-accent-gradient {
  display: block;
  background: var(--lp-gradient-aurora);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.cine-hero-sub {
  font-size: var(--text-lg);
  color: var(--lp-text-secondary);
  line-height: 1.7;
  margin: 0 0 var(--space-3xl);
  max-width: 480px;
}

/* CTAs */
.cine-hero-ctas {
  display: flex;
  gap: var(--space-lg);
  align-items: center;
  flex-wrap: wrap;
}

.cine-cta-primary {
  background: var(--lp-accent-orange);
  color: #fff;
  border: none;
  font-family: var(--font-body);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  padding: var(--space-md) var(--space-2xl);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: background 0.3s ease, box-shadow 0.3s ease, transform 0.2s ease;
  position: relative;
  overflow: hidden;
}

@media (hover: hover) {
  .cine-cta-primary:hover {
    background: var(--lp-accent-orange-hover);
    box-shadow: 0 0 30px var(--lp-accent-orange-glow);
    transform: translateY(-1px);
  }
}

.cine-cta-primary:active {
  transform: scale(0.97);
}

.cine-cta-primary::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.2) 50%, transparent 60%);
  background-size: 200% 100%;
  animation: cine-shimmer-btn 3s ease-in-out infinite;
  pointer-events: none;
}

@keyframes cine-shimmer-btn {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.cine-cta-ghost {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  background: var(--lp-glass-bg);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid var(--lp-glass-border);
  color: var(--lp-text-secondary);
  font-family: var(--font-body);
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  padding: var(--space-md) var(--space-xl);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: border-color 0.3s ease, color 0.3s ease;
}

@media (hover: hover) {
  .cine-cta-ghost:hover {
    border-color: var(--lp-border-light);
    color: var(--lp-text-primary);
  }
}

/* Phone wrapper */
.cine-phone-wrap {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xl);
}

.cine-phone-glow {
  position: absolute;
  width: 350px;
  height: 350px;
  border-radius: 50%;
  background: var(--lp-accent-orange);
  filter: blur(120px);
  opacity: 0.15;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

/* Feature description area */
.cine-feature-desc {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  min-height: 70px;
  padding: var(--space-md) var(--space-xl);
  background: var(--lp-glass-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--lp-glass-border);
  border-radius: var(--radius-xl);
  margin-top: calc(-1 * var(--space-sm));
}

.cine-feature-text {
  text-align: center;
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cine-feature-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.cine-feature-title {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--lp-text-primary);
  letter-spacing: 0.01em;
}

.cine-feature-detail {
  font-size: 12px;
  color: var(--lp-text-muted);
  line-height: 1.4;
}

/* Slide-up-fade transition */
.cine-slide-enter-active,
.cine-slide-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.cine-slide-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.cine-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* Progress dots */
.cine-progress-dots {
  display: flex;
  gap: 6px;
  align-items: center;
}

.cine-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: none;
  padding: 0;
  background: var(--lp-border);
  cursor: pointer;
  transition: all 0.3s ease;
}

.cine-dot.active {
  background: var(--lp-accent-orange);
  box-shadow: 0 0 6px color-mix(in srgb, var(--lp-accent-orange) 40%, transparent);
  transform: scale(1.25);
}

@media (hover: hover) {
  .cine-dot:hover:not(.active) {
    background: var(--lp-text-muted);
    transform: scale(1.15);
  }
}

/* Mobile */
@media (max-width: 768px) {
  .cine-section {
    min-height: auto;
    padding: calc(80px + env(safe-area-inset-top)) var(--space-lg) var(--space-xl);
  }

  .cine-content {
    grid-template-columns: 1fr;
    gap: var(--space-lg);
    text-align: center;
  }

  .cine-hero-text {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .cine-hero-sub {
    max-width: 100%;
    margin-bottom: var(--space-xl);
  }

  .cine-hero-ctas {
    justify-content: center;
  }

  .cine-phone-wrap {
    gap: var(--space-sm);
  }

  .cine-phone-glow {
    width: 250px;
    height: 250px;
    filter: blur(80px);
  }

  .cine-feature-desc {
    padding: var(--space-sm) var(--space-md);
    min-height: 56px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .cine-badge-dot { animation: none; }
  .cine-cta-primary::after { animation: none; }
  .cine-slide-enter-active,
  .cine-slide-leave-active {
    transition-duration: 0.01ms !important;
  }
}
</style>

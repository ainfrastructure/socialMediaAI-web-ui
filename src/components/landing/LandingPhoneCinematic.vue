<script setup lang="ts">
import { ref, nextTick, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { gsap } from '@/composables/useGsapSection'
import { useMagneticButton } from '@/composables/useMagneticButton'
import PhoneMockup from '@/components/PhoneMockup.vue'
import MaterialIcon from '@/components/MaterialIcon.vue'
import PhoneScenarioChat from './PhoneScenarioChat.vue'
import PhoneScenarioCalendar from './PhoneScenarioCalendar.vue'
import PhoneScenarioAds from './PhoneScenarioAds.vue'

const { t } = useI18n()
const sectionRef = ref<HTMLElement | null>(null)
const heroCta = ref<HTMLElement | null>(null)
const activeScenario = ref(0)

useMagneticButton(heroCta, 0.25)

function scrollToSection(sectionId: string) {
  document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' })
}

const scenarioLabels = [
  { key: 'chat', icon: 'chat' },
  { key: 'calendar', icon: 'calendar_month' },
  { key: 'ads', icon: 'campaign' },
]

let masterTl: gsap.core.Timeline | null = null

onMounted(async () => {
  await nextTick()
  const el = sectionRef.value
  if (!el) return

  const scenarioChat = el.querySelector('.cine-scenario-chat')
  const scenarioCal = el.querySelector('.cine-scenario-calendar')
  const scenarioAds = el.querySelector('.cine-scenario-ads')
  const shimmer = el.querySelector('.cine-shimmer')

  // Set initial states
  gsap.set(scenarioCal, { opacity: 0, visibility: 'hidden' })
  gsap.set(scenarioAds, { opacity: 0, visibility: 'hidden' })
  gsap.set(scenarioChat, { opacity: 1, visibility: 'visible' })

  // Hero entrance animation
  const entrance = gsap.timeline({ defaults: { ease: 'power3.out' }, delay: 0.1 })
  entrance
    .fromTo(el.querySelector('.cine-hero-badge'), { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8 })
    .fromTo(el.querySelector('.cine-hero-headline'), { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.9 }, '-=0.5')
    .fromTo(el.querySelector('.cine-hero-sub'), { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7 }, '-=0.5')
    .fromTo(el.querySelector('.cine-hero-ctas'), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 }, '-=0.3')
    .fromTo(el.querySelector('.cine-hero-trust'), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 }, '-=0.2')
    .fromTo(el.querySelector('.cine-phone-wrap'), { opacity: 0, x: 60 }, { opacity: 1, x: 0, duration: 1 }, '-=1.2')
    .fromTo(el.querySelector('.cine-pills'), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 }, '-=0.5')

  // Helper: build reset timeline to clear a scenario back to initial state
  function resetChat() {
    gsap.set(scenarioChat!.querySelector('.sc-user'), { opacity: 0 })
    gsap.set(scenarioChat!.querySelector('.sc-ai'), { opacity: 0 })
    gsap.set(scenarioChat!.querySelector('.sc-typing-dots'), { opacity: 1, height: 'auto' })
    gsap.set(scenarioChat!.querySelector('.sc-ai-text'), { opacity: 0, maxHeight: 0 })
    gsap.set(scenarioChat!.querySelector('.sc-post-card'), { opacity: 0, scale: 0.9, y: 0, rotation: 0 })
    gsap.set(scenarioChat!.querySelector('.sc-btn-publish'), { boxShadow: 'none' })
    gsap.set(scenarioChat!.querySelectorAll('.sc-confetti-dot'), { opacity: 0, x: 0, y: 0, scale: 1 })
    gsap.set(scenarioChat!.querySelector('.sc-success-badge'), { opacity: 0 })
  }

  function resetCalendar() {
    gsap.set(scenarioCal!.querySelectorAll('.scal-day-label'), { opacity: 0 })
    gsap.set(scenarioCal!.querySelectorAll('.scal-post'), { opacity: 0, y: -20 })
    gsap.set(scenarioCal!.querySelector('.scal-view-link'), { opacity: 0 })
    gsap.set(scenarioCal!.querySelector('.scal-week'), { x: '0%', opacity: 1 })
    gsap.set(scenarioCal!.querySelector('.scal-month'), { opacity: 0 })
    gsap.set(scenarioCal!.querySelectorAll('.scal-month-dot'), { opacity: 0, scale: 0 })
    gsap.set(scenarioCal!.querySelector('.scal-detail-card'), { opacity: 0, y: 20 })
  }

  function resetAds() {
    gsap.set(scenarioAds!.querySelector('.sads-search'), { opacity: 0 })
    gsap.set(scenarioAds!.querySelector('.sads-search-text'), { maxWidth: 0 })
    gsap.set(scenarioAds!.querySelector('.sads-campaign'), { opacity: 0, y: 20 })
    const sparkLine = scenarioAds!.querySelector('.sads-spark-line')
    if (sparkLine) gsap.set(sparkLine, { strokeDashoffset: 400 })
    gsap.set(scenarioAds!.querySelectorAll('.sads-kpi'), { opacity: 0 })
    // Reset KPI text
    const kpiDefaults: Record<string, string> = { roas: '0x', cpc: '$0.00', conversions: '0', spend: '$0' }
    Object.entries(kpiDefaults).forEach(([key, val]) => {
      const kpiEl = scenarioAds!.querySelector(`[data-kpi="${key}"]`) as HTMLElement | null
      if (kpiEl) kpiEl.textContent = val
    })
    gsap.set(scenarioAds!.querySelector('.sads-kpi-highlight'), { boxShadow: 'none' })
  }

  // Initialize all to reset state
  resetChat()
  resetCalendar()
  resetAds()

  // ============================================
  // Build the auto-playing master timeline (loops)
  // ============================================
  masterTl = gsap.timeline({
    repeat: -1,
    delay: 1.5, // wait for entrance to finish
    defaults: { ease: 'power2.out' },
  })

  // ------------------------------------------
  // SCENARIO 1: AI CHAT & PUBLISH (~0s – 6s)
  // ------------------------------------------
  // Set active pill
  masterTl.call(() => { activeScenario.value = 0 })

  // User message slides in
  masterTl.to(scenarioChat!.querySelector('.sc-user'), { opacity: 1, duration: 0.4 }, 0.2)

  // AI bubble appears with typing dots
  masterTl.to(scenarioChat!.querySelector('.sc-ai'), { opacity: 1, duration: 0.3 }, 0.8)

  // Typing dots fade out, AI text streams in
  masterTl.to(scenarioChat!.querySelector('.sc-typing-dots'), { opacity: 0, height: 0, duration: 0.2 }, 1.8)
  masterTl.to(scenarioChat!.querySelector('.sc-ai-text'), { opacity: 1, maxHeight: 100, duration: 0.6, ease: 'none' }, 2.0)

  // Post card scales up
  masterTl.to(scenarioChat!.querySelector('.sc-post-card'), { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.5)' }, 2.8)

  // Publish button glows
  masterTl.to(scenarioChat!.querySelector('.sc-btn-publish'), {
    boxShadow: '0 0 16px var(--lp-accent-orange)',
    duration: 0.4,
    yoyo: true,
    repeat: 1,
  }, 3.5)

  // Post flies away
  masterTl.to(scenarioChat!.querySelector('.sc-post-card'), { y: -200, rotation: -5, opacity: 0, duration: 0.5, ease: 'power2.in' }, 4.5)

  // Confetti burst
  const confettiDots = scenarioChat!.querySelectorAll('.sc-confetti-dot')
  const angles = [0, 36, 72, 108, 144, 180, 216, 252, 288, 324]
  confettiDots.forEach((dot, i) => {
    const angle = angles[i] * (Math.PI / 180)
    const dist = 40 + Math.random() * 30
    masterTl!.to(dot, {
      opacity: 1,
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist,
      scale: 1.5,
      duration: 0.4,
      ease: 'power2.out',
    }, 5.0)
    masterTl!.to(dot, { opacity: 0, duration: 0.3 }, 5.4)
  })

  // Success badge
  masterTl.to(scenarioChat!.querySelector('.sc-success-badge'), { opacity: 1, duration: 0.4 }, 5.2)

  // ------------------------------------------
  // TRANSITION 1 → Calendar (~6.5s – 7.5s)
  // ------------------------------------------
  const t1Start = 7
  masterTl.to(scenarioChat, { opacity: 0, scale: 0.95, duration: 0.4 }, t1Start)
  masterTl.set(scenarioChat, { visibility: 'hidden' }, t1Start + 0.4)
  masterTl.call(() => resetChat(), undefined, t1Start + 0.4)
  masterTl.fromTo(shimmer,
    { opacity: 0, x: '-100%' },
    { opacity: 0.6, x: '100%', duration: 0.5, ease: 'power2.inOut' },
    t1Start + 0.1,
  )
  masterTl.to(shimmer, { opacity: 0, duration: 0.1 }, t1Start + 0.6)
  masterTl.set(scenarioCal, { visibility: 'visible' }, t1Start + 0.4)
  masterTl.fromTo(scenarioCal,
    { opacity: 0, scale: 1.02 },
    { opacity: 1, scale: 1, duration: 0.4 },
    t1Start + 0.4,
  )

  // ------------------------------------------
  // SCENARIO 2: CALENDAR (~7.5s – 14s)
  // ------------------------------------------
  const s2Start = t1Start + 1
  masterTl.call(() => { activeScenario.value = 1 }, undefined, s2Start)

  // Week header day labels stagger in
  masterTl.to(scenarioCal!.querySelectorAll('.scal-day-label'), { opacity: 1, stagger: 0.06, duration: 0.2 }, s2Start + 0.2)

  // Posts bounce in
  masterTl.to(scenarioCal!.querySelectorAll('.scal-post'), {
    opacity: 1, y: 0, stagger: 0.1, duration: 0.4, ease: 'bounce.out',
  }, s2Start + 0.8)

  // View link fades in
  masterTl.to(scenarioCal!.querySelector('.scal-view-link'), { opacity: 1, duration: 0.3 }, s2Start + 2)

  // Week view slides left, month slides in
  masterTl.to(scenarioCal!.querySelector('.scal-week'), { x: '-100%', opacity: 0, duration: 0.6 }, s2Start + 3)
  masterTl.to(scenarioCal!.querySelector('.scal-month'), { opacity: 1, duration: 0.4 }, s2Start + 3.4)

  // Month dots stagger in
  masterTl.to(scenarioCal!.querySelectorAll('.scal-month-dot'), {
    opacity: 1, scale: 1, stagger: 0.03, duration: 0.15, ease: 'back.out(3)',
  }, s2Start + 3.8)

  // Detail card slides up
  masterTl.to(scenarioCal!.querySelector('.scal-detail-card'), { opacity: 1, y: 0, duration: 0.4 }, s2Start + 5)

  // ------------------------------------------
  // TRANSITION 2 → Ads (~14.5s – 15.5s)
  // ------------------------------------------
  const t2Start = s2Start + 6
  masterTl.to(scenarioCal, { opacity: 0, scale: 0.95, duration: 0.4 }, t2Start)
  masterTl.set(scenarioCal, { visibility: 'hidden' }, t2Start + 0.4)
  masterTl.call(() => resetCalendar(), undefined, t2Start + 0.4)
  masterTl.fromTo(shimmer,
    { opacity: 0, x: '-100%' },
    { opacity: 0.6, x: '100%', duration: 0.5, ease: 'power2.inOut' },
    t2Start + 0.1,
  )
  masterTl.to(shimmer, { opacity: 0, duration: 0.1 }, t2Start + 0.6)
  masterTl.set(scenarioAds, { visibility: 'visible' }, t2Start + 0.4)
  masterTl.fromTo(scenarioAds,
    { opacity: 0, scale: 1.02 },
    { opacity: 1, scale: 1, duration: 0.4 },
    t2Start + 0.4,
  )

  // ------------------------------------------
  // SCENARIO 3: ADS MANAGER (~15.5s – 22s)
  // ------------------------------------------
  const s3Start = t2Start + 1
  masterTl.call(() => { activeScenario.value = 2 }, undefined, s3Start)

  // Search bar appears
  masterTl.to(scenarioAds!.querySelector('.sads-search'), { opacity: 1, duration: 0.3 }, s3Start + 0.2)

  // Typing in search
  masterTl.to(scenarioAds!.querySelector('.sads-search-text'), { maxWidth: 200, duration: 0.8, ease: 'steps(20)' }, s3Start + 0.5)

  // Campaign card slides up
  masterTl.to(scenarioAds!.querySelector('.sads-campaign'), { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, s3Start + 1.5)

  // Sparkline draws
  const sparkLine = scenarioAds!.querySelector('.sads-spark-line')
  if (sparkLine) {
    masterTl.to(sparkLine, { strokeDashoffset: 0, duration: 1.2, ease: 'power2.inOut' }, s3Start + 2)
  }

  // KPI cards stagger in
  masterTl.to(scenarioAds!.querySelectorAll('.sads-kpi'), { opacity: 1, stagger: 0.15, duration: 0.3 }, s3Start + 3)

  // KPI number counting
  const kpiTargets = [
    { selector: '[data-kpi="roas"]', target: 4.2, suffix: 'x', decimals: 1 },
    { selector: '[data-kpi="cpc"]', target: 0.42, prefix: '$', decimals: 2 },
    { selector: '[data-kpi="conversions"]', target: 1847, decimals: 0, comma: true },
    { selector: '[data-kpi="spend"]', target: 2340, prefix: '$', decimals: 0, comma: true },
  ]
  kpiTargets.forEach((kpi) => {
    const kpiEl = scenarioAds!.querySelector(kpi.selector) as HTMLElement | null
    if (!kpiEl) return
    const proxy = { value: 0 }
    masterTl!.to(proxy, {
      value: kpi.target,
      duration: 1,
      ease: 'power2.out',
      onUpdate() {
        let formatted = proxy.value.toFixed(kpi.decimals)
        if (kpi.comma) {
          formatted = Number(formatted).toLocaleString('en-US')
        }
        kpiEl.textContent = (kpi.prefix || '') + formatted + (kpi.suffix || '')
      },
    }, s3Start + 3.5)
  })

  // Conversions pulse green
  masterTl.to(scenarioAds!.querySelector('.sads-kpi-highlight'), {
    boxShadow: '0 0 20px rgba(34, 197, 94, 0.3)',
    duration: 0.4,
    yoyo: true,
    repeat: 1,
  }, s3Start + 5)

  // ------------------------------------------
  // TRANSITION 3 → Back to Chat (~22s – 23s)
  // ------------------------------------------
  const t3Start = s3Start + 6
  masterTl.to(scenarioAds, { opacity: 0, scale: 0.95, duration: 0.4 }, t3Start)
  masterTl.set(scenarioAds, { visibility: 'hidden' }, t3Start + 0.4)
  masterTl.call(() => resetAds(), undefined, t3Start + 0.4)
  masterTl.fromTo(shimmer,
    { opacity: 0, x: '-100%' },
    { opacity: 0.6, x: '100%', duration: 0.5, ease: 'power2.inOut' },
    t3Start + 0.1,
  )
  masterTl.to(shimmer, { opacity: 0, duration: 0.1 }, t3Start + 0.6)
  // Re-show chat for the loop restart
  masterTl.set(scenarioChat, { visibility: 'visible', opacity: 1, scale: 1 }, t3Start + 0.4)
  // Small buffer before loop repeats
  masterTl.to({}, { duration: 0.5 }, t3Start + 1)
})

onUnmounted(() => {
  if (masterTl) {
    masterTl.kill()
    masterTl = null
  }
})
</script>

<template>
  <section id="lp-how-it-works" ref="sectionRef" class="cine-section">
    <!-- Background orbs -->
    <div class="cine-orb cine-orb-1" />
    <div class="cine-orb cine-orb-2" />
    <div class="cine-orb cine-orb-3" />
    <div class="cine-grain" />

    <div class="cine-content">
      <!-- Hero text (fades out on scroll) -->
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

        <div class="cine-hero-trust">
          <div class="cine-trust-avatars">
            <div class="cine-trust-avatar">JK</div>
            <div class="cine-trust-avatar">ML</div>
            <div class="cine-trust-avatar">RS</div>
            <div class="cine-trust-avatar">+</div>
          </div>
          <span class="cine-trust-text">{{ t('appLanding.hero.trustSignal') }}</span>
        </div>
      </div>

      <!-- Phone -->
      <div class="cine-phone-wrap">
        <div class="cine-phone-glow" />
        <PhoneMockup size="lg" show-buttons>
          <div class="cine-phone-inner">
            <!-- Shimmer overlay for transitions -->
            <div class="cine-shimmer" />

            <!-- Scenario 1: Chat -->
            <div class="cine-scenario cine-scenario-chat">
              <PhoneScenarioChat />
            </div>

            <!-- Scenario 2: Calendar -->
            <div class="cine-scenario cine-scenario-calendar">
              <PhoneScenarioCalendar />
            </div>

            <!-- Scenario 3: Ads -->
            <div class="cine-scenario cine-scenario-ads">
              <PhoneScenarioAds />
            </div>
          </div>
        </PhoneMockup>

        <!-- Scenario pills -->
        <div class="cine-pills">
          <div
            v-for="(s, i) in scenarioLabels"
            :key="s.key"
            class="cine-pill"
            :class="{ active: activeScenario === i }"
          >
            <MaterialIcon :icon="s.icon" size="xs" />
            {{ t(`appLanding.cinematic.pill${s.key.charAt(0).toUpperCase() + s.key.slice(1)}`) }}
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

/* Background orbs */
.cine-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.3;
  pointer-events: none;
  will-change: transform;
}

.cine-orb-1 {
  width: 600px;
  height: 600px;
  background: var(--lp-accent-violet);
  top: -15%;
  right: -10%;
  animation: cine-orb-1 20s ease-in-out infinite;
}

.cine-orb-2 {
  width: 400px;
  height: 400px;
  background: var(--lp-accent-blue);
  bottom: 0;
  left: -10%;
  animation: cine-orb-2 25s ease-in-out infinite;
}

.cine-orb-3 {
  width: 300px;
  height: 300px;
  background: var(--lp-accent-cyan);
  top: 40%;
  left: 40%;
  animation: cine-orb-3 18s ease-in-out infinite;
  opacity: 0.15;
}

@keyframes cine-orb-1 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(-40px, 30px) scale(1.05); }
  66% { transform: translate(20px, -20px) scale(0.95); }
}

@keyframes cine-orb-2 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -25px) scale(1.08); }
  66% { transform: translate(-20px, 15px) scale(0.92); }
}

@keyframes cine-orb-3 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(-30px, 20px) scale(1.1); }
}

.cine-grain {
  position: absolute;
  inset: 0;
  opacity: 0.03;
  pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  background-repeat: repeat;
  background-size: 256px 256px;
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

.cine-cta-primary:hover {
  background: var(--lp-accent-orange-hover);
  box-shadow: 0 0 30px var(--lp-accent-orange-glow);
  transform: translateY(-1px);
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

.cine-cta-ghost:hover {
  border-color: var(--lp-border-light);
  color: var(--lp-text-primary);
}

/* Trust */
.cine-hero-trust {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-top: var(--space-3xl);
}

.cine-trust-avatars {
  display: flex;
}

.cine-trust-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--lp-bg-elevated);
  border: 2px solid var(--lp-bg-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: var(--font-semibold);
  color: var(--lp-text-secondary);
  margin-left: -8px;
}

.cine-trust-avatar:first-child { margin-left: 0; }

.cine-trust-text {
  font-size: var(--text-sm);
  color: var(--lp-text-muted);
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

/* Phone inner content — stacking scenarios */
.cine-phone-inner {
  width: 100%;
  height: 100%;
  position: relative;
}

.cine-scenario {
  position: absolute;
  inset: 0;
}

/* Shimmer transition overlay */
.cine-shimmer {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
  z-index: 5;
  pointer-events: none;
  opacity: 0;
}

/* Scenario pills */
.cine-pills {
  display: flex;
  gap: var(--space-sm);
}

.cine-pill {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--lp-text-muted);
  background: var(--lp-glass-bg);
  border: 1px solid var(--lp-border);
  transition: all 0.4s ease;
}

.cine-pill.active {
  color: var(--lp-accent-orange);
  border-color: var(--lp-accent-orange);
  background: color-mix(in srgb, var(--lp-accent-orange) 10%, transparent);
}

/* Mobile */
@media (max-width: 768px) {
  .cine-section {
    padding: 100px var(--space-lg) var(--space-3xl);
  }

  .cine-content {
    grid-template-columns: 1fr;
    gap: var(--space-3xl);
    text-align: center;
  }

  .cine-hero-text {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .cine-hero-sub {
    max-width: 100%;
  }

  .cine-hero-ctas {
    justify-content: center;
  }

  .cine-hero-trust {
    justify-content: center;
  }

  .cine-phone-wrap {
    order: -1;
  }

  .cine-pills {
    flex-wrap: wrap;
    justify-content: center;
  }
}

@media (prefers-reduced-motion: reduce) {
  .cine-orb { animation: none; }
  .cine-badge-dot { animation: none; }
  .cine-cta-primary::after { animation: none; }
}
</style>

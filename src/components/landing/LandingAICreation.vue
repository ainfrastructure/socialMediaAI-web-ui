<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGsapSection, gsap } from '@/composables/useGsapSection'
import MaterialIcon from '@/components/MaterialIcon.vue'

const { t } = useI18n()
const sectionRef = ref<HTMLElement | null>(null)
const activeStep = ref(0)

function scrollToFinalCta() {
  document.getElementById('lp-final-cta')?.scrollIntoView({ behavior: 'smooth' })
}

const steps = [
  { key: 'prompt', icon: 'chat', color: 'var(--lp-accent-orange)', number: '01' },
  { key: 'generate', icon: 'auto_awesome', color: 'var(--lp-accent-violet)', number: '02' },
  { key: 'adapt', icon: 'devices', color: 'var(--lp-accent-blue)', number: '03' },
  { key: 'schedule', icon: 'schedule', color: 'var(--lp-accent-orange)', number: '04' },
]

// 3D entrance configs per step
const stepEntrance = [
  { rotateY: -8, z: -50 },
  { rotateY: 8, z: -50 },
  { rotateX: 5, z: -80 },
  { scale: 0.9, z: -60 },
]
const stepEntranceTo = [
  { rotateY: 0, z: 0 },
  { rotateY: 0, z: 0 },
  { rotateX: 0, z: 0 },
  { scale: 1, z: 0 },
]

useGsapSection(sectionRef, (el, g) => {
  const stageContainers = el.querySelectorAll('.lp-stage-step')
  const progressBars = el.querySelectorAll('.lp-step-progress-fill')

  // Hard-set initial states including all transform properties
  stageContainers.forEach((c, i) => {
    if (i === 0) {
      g.set(c, { visibility: 'visible', opacity: 1, y: 0, rotateX: 0, rotateY: 0, z: 0, scale: 1 })
    } else {
      g.set(c, { visibility: 'hidden', opacity: 0, y: 30, scale: 1 })
    }
  })

  const master = g.timeline({
    scrollTrigger: {
      trigger: el,
      start: 'top 10%',
      end: '+=200%',
      pin: true,
      scrub: 1,
      onUpdate(self: { progress: number }) {
        const p = self.progress
        activeStep.value = p >= 0.75 ? 3 : p >= 0.5 ? 2 : p >= 0.25 ? 1 : 0
      },
    },
  })

  // Each step occupies 25% of master timeline
  for (let i = 0; i < 4; i++) {
    const container = stageContainers[i]
    if (!container) continue
    const stepTl = g.timeline()

    // Entrance: visibility as instant set(), visual as fromTo()
    if (i > 0) {
      stepTl.set(container, { visibility: 'visible' }, 0)
      stepTl.fromTo(container,
        { opacity: 0, y: 30, ...stepEntrance[i] },
        { opacity: 1, y: 0, ...stepEntranceTo[i], duration: 0.3, ease: 'power2.out', immediateRender: false },
        0,
      )
    }

    // Progress bar fill
    if (progressBars[i]) {
      stepTl.fromTo(progressBars[i],
        { scaleX: 0 },
        { scaleX: 1, duration: 0.8, ease: 'none', immediateRender: i === 0 ? undefined : false },
        i === 0 ? 0 : 0.3,
      )
    }

    // Step-specific animations
    if (i === 0) {
      const typingText = container.querySelector('.lp-typing-text')
      const cursor = container.querySelector('.lp-typing-cursor')
      const sendBtn = container.querySelector('.lp-send-btn')
      if (typingText) {
        stepTl.fromTo(typingText,
          { maxWidth: '0%' },
          { maxWidth: '100%', duration: 0.6, ease: 'steps(30)' },
          0.1,
        )
      }
      if (cursor) {
        stepTl.to(cursor, { opacity: 0, duration: 0.05 }, 0.75)
      }
      if (sendBtn) {
        stepTl.fromTo(sendBtn,
          { scale: 0.8, opacity: 0.5 },
          { scale: 1, opacity: 1, duration: 0.15, ease: 'back.out(2)' },
          0.7,
        )
      }
    } else if (i === 1) {
      const shimmers = container.querySelectorAll('.lp-gen-shimmer')
      const lines = container.querySelectorAll('.lp-gen-line')
      const imgPlaceholder = container.querySelector('.lp-gen-image')
      const tags = container.querySelectorAll('.lp-gen-tag')

      stepTl.fromTo(shimmers, { opacity: 1 }, { opacity: 0, duration: 0.25, stagger: 0.05, immediateRender: false }, 0.3)
      stepTl.fromTo(lines, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.2, stagger: 0.08, immediateRender: false }, 0.4)
      if (imgPlaceholder) {
        stepTl.fromTo(imgPlaceholder,
          { scale: 0.85, opacity: 0, borderWidth: 0 },
          { scale: 1, opacity: 1, borderWidth: 2, duration: 0.25, ease: 'power2.out', immediateRender: false },
          0.5,
        )
      }
      stepTl.fromTo(tags, { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.15, stagger: 0.06, immediateRender: false }, 0.65)
    } else if (i === 2) {
      const cards = container.querySelectorAll('.lp-platform-card')
      const singleCheck = container.querySelector('.lp-fan-check')

      if (cards.length === 3) {
        stepTl.fromTo(cards[0],
          { x: 0, rotation: 0 },
          { x: -120, rotation: -5, duration: 0.35, ease: 'power2.out', immediateRender: false },
          0.3,
        )
        stepTl.fromTo(cards[2],
          { x: 0, rotation: 0 },
          { x: 120, rotation: 5, duration: 0.35, ease: 'power2.out', immediateRender: false },
          0.3,
        )
      }
      if (singleCheck) {
        stepTl.fromTo(singleCheck,
          { scale: 0, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.25, ease: 'back.out(3)', immediateRender: false },
          0.6,
        )
      }
    } else if (i === 3) {
      const calGrid = container.querySelector('.lp-cal-grid')
      const badgeScheduled = container.querySelector('.lp-badge-scheduled')
      const badgePublished = container.querySelector('.lp-badge-published')
      const badgeCta = container.querySelector('.lp-badge-cta')

      if (calGrid) {
        stepTl.fromTo(calGrid, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.15, immediateRender: false }, 0.3)

        // Animate dots filling in with stagger
        const dots = calGrid.querySelectorAll('.lp-cal-dot')
        if (dots.length) {
          stepTl.fromTo(dots,
            { opacity: 0, scale: 0 },
            { opacity: 1, scale: 1, duration: 0.08, stagger: 0.03, ease: 'back.out(3)', immediateRender: false },
            0.38,
          )
        }
      }

      // Badge 1: "Scheduled" — enter from left
      if (badgeScheduled) {
        stepTl.fromTo(badgeScheduled,
          { x: '-100vw', opacity: 0 },
          { x: 0, opacity: 1, duration: 0.18, ease: 'power2.out', immediateRender: false },
          0.45,
        )
        // Badge 1: exit — pushed right off-screen
        stepTl.to(badgeScheduled,
          { x: '100vw', opacity: 0, duration: 0.15, ease: 'power2.in' },
          0.60,
        )
      }

      // Badge 2: "Published" — enter from left, pushes Scheduled right
      if (badgePublished) {
        stepTl.fromTo(badgePublished,
          { x: '-100vw', opacity: 0 },
          { x: 0, opacity: 1, duration: 0.18, ease: 'power2.out', immediateRender: false },
          0.60,
        )
        // Badge 2: exit — pushed right off-screen
        stepTl.to(badgePublished,
          { x: '100vw', opacity: 0, duration: 0.15, ease: 'power2.in' },
          0.76,
        )
      }

      // Badge 3: "Get Started" CTA — enter from left, stays visible
      if (badgeCta) {
        stepTl.fromTo(badgeCta,
          { x: '-100vw', opacity: 0 },
          { x: 0, opacity: 1, duration: 0.18, ease: 'power2.out', immediateRender: false },
          0.76,
        )
      }
    }

    // Exit: opacity tween then instant visibility hide (except last step)
    if (i < 3) {
      stepTl.to(container, { opacity: 0, y: -20, duration: 0.2 }, 0.9)
      stepTl.set(container, { visibility: 'hidden' }, 1.1)
    }

    master.add(stepTl, i)
  }

  // Force-render at position 0 to lock in initial states
  master.progress(0, true)
})
</script>

<template>
  <section id="lp-how-it-works" ref="sectionRef" class="lp-ai-creation">
    <div class="lp-section-inner">
      <span class="lp-eyebrow">{{ t('appLanding.aiCreation.eyebrow') }}</span>
      <h2 class="lp-section-title">{{ t('appLanding.aiCreation.title') }}</h2>
      <p class="lp-section-sub">{{ t('appLanding.aiCreation.subtitle') }}</p>

      <div class="lp-split-panel">
        <!-- Left: Step Nav -->
        <div class="lp-steps-nav">
          <div
            v-for="(step, i) in steps"
            :key="step.key"
            class="lp-step-indicator"
            :class="{ active: activeStep === i, done: activeStep > i }"
            :style="{ '--step-color': step.color }"
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

          <!-- Step 1: Describe Your Idea -->
          <div class="lp-stage-step lp-stage-prompt">
            <div class="lp-mock-chat">
              <div class="lp-chat-header">
                <img src="@/assets/socialchef_logo.svg" alt="" class="lp-chat-logo" />
                <span>SocialChef</span>
              </div>
              <div class="lp-chat-input-area">
                <div class="lp-chat-input-row">
                  <span class="lp-typing-text">{{ t('appLanding.aiCreation.promptExample') }}</span>
                  <span class="lp-typing-cursor">|</span>
                </div>
                <button class="lp-send-btn">
                  <MaterialIcon icon="send" size="sm" />
                </button>
              </div>
            </div>
          </div>

          <!-- Step 2: AI Generates -->
          <div class="lp-stage-step lp-stage-generate">
            <div class="lp-gen-container">
              <div class="lp-gen-shimmer" />
              <div class="lp-gen-shimmer short" />
              <div class="lp-gen-shimmer shorter" />
              <div class="lp-gen-line">Embrace the sunshine with our new Summer Collection</div>
              <div class="lp-gen-line">Light fabrics, bold colors, effortless style</div>
              <div class="lp-gen-image">
                <img src="/example/example5-enhanced.jpg" alt="" class="lp-gen-real-img" />
              </div>
              <div class="lp-gen-tags">
                <span class="lp-gen-tag">Playful</span>
                <span class="lp-gen-tag">Summer</span>
                <span class="lp-gen-tag">Collection</span>
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
                  <img src="/example/example5-enhanced.jpg" alt="" class="lp-preview-img" />
                  <div class="lp-preview-lines">
                    <div /><div class="short" />
                  </div>
                </div>
              </div>
              <div class="lp-platform-card" style="--brand: var(--gradient-linkedin, #0A66C2)">
                <span class="lp-platform-label">LinkedIn</span>
                <div class="lp-platform-preview">
                  <img src="/example/example5-enhanced.jpg" alt="" class="lp-preview-img" />
                  <div class="lp-preview-lines">
                    <div /><div class="short" />
                  </div>
                </div>
              </div>
              <div class="lp-platform-card" style="--brand: var(--gradient-facebook, #1877F2)">
                <span class="lp-platform-label">Facebook</span>
                <div class="lp-platform-preview">
                  <img src="/example/example5-enhanced.jpg" alt="" class="lp-preview-img" />
                  <div class="lp-preview-lines">
                    <div /><div class="short" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Step 4: Schedule & Publish -->
          <div class="lp-stage-step lp-stage-schedule">
            <div class="lp-schedule-container">
              <div class="lp-cal-grid">
                <div v-for="d in ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']" :key="d" class="lp-cal-day">
                  <span class="lp-cal-label">{{ d }}</span>
                  <div class="lp-cal-slot"><div class="lp-cal-dot" /></div>
                </div>
              </div>
              <div class="lp-badge-stack">
                <div class="lp-cal-badge lp-badge-scheduled">
                  <MaterialIcon icon="schedule" size="sm" />
                  Scheduled
                </div>
                <div class="lp-cal-badge lp-badge-published">
                  <MaterialIcon icon="check_circle" size="sm" />
                  Published
                </div>
                <div class="lp-cal-badge lp-badge-cta" @click="scrollToFinalCta">
                  <MaterialIcon icon="arrow_forward" size="sm" />
                  {{ t('appLanding.hero.ctaPrimary') }}
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

/* ===== Step 1: Prompt ===== */
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
  height: 20px;
  border-radius: 4px;
}

.lp-chat-input-area {
  padding: var(--space-lg);
  display: flex;
  align-items: flex-end;
  gap: var(--space-sm);
  overflow: hidden;
}

.lp-chat-input-row {
  flex: 1;
  min-width: 0;
  background: var(--lp-bg-primary);
  border: 1px solid var(--lp-border-light);
  border-radius: var(--radius-md);
  padding: var(--space-sm) var(--space-md);
  font-size: var(--text-sm);
  color: var(--lp-text-primary);
  line-height: 1.5;
  min-height: 44px;
  display: flex;
  align-items: center;
  overflow: hidden;
}

.lp-typing-text {
  display: inline-block;
  overflow: hidden;
  white-space: nowrap;
  max-width: 0;
}

.lp-typing-cursor {
  color: var(--lp-accent-orange);
  animation: blink 0.8s step-end infinite;
  font-weight: var(--font-bold);
}

@keyframes blink {
  50% { opacity: 0; }
}

.lp-send-btn {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  background: var(--lp-accent-orange);
  color: #fff;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  opacity: 0.5;
  box-shadow: 0 0 0 0 var(--lp-accent-orange-glow);
  transition: box-shadow 0.3s ease;
}

/* ===== Step 2: Generate ===== */
.lp-gen-container {
  width: 100%;
  max-width: 380px;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--lp-border-light);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  transform: rotateY(2deg);
  position: relative;
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
}

.lp-gen-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--lp-accent-violet), transparent);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
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

@keyframes shimmer {
  from { background-position: 200% 0; }
  to { background-position: -200% 0; }
}

.lp-gen-line {
  font-size: var(--text-sm);
  color: var(--lp-text-primary);
  line-height: 1.6;
  opacity: 0;
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
.lp-platforms-fan {
  position: relative;
  width: 100%;
  height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
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

.lp-badge-cta {
  cursor: pointer;
  background: var(--lp-accent-orange);
  color: #fff;
  border: 1px solid var(--lp-accent-orange);
  box-shadow: 0 0 20px var(--lp-accent-orange-glow);
}

.lp-badge-cta:hover {
  filter: brightness(1.1);
}


/* ===== Mobile ===== */
@media (max-width: 768px) {
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
  }

  .lp-step-indicator {
    flex-shrink: 0;
    padding: var(--space-sm) var(--space-md);
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
  }

  .lp-platform-card {
    width: 140px;
  }

  .lp-platforms-fan .lp-platform-card:first-child {
    transform: translateX(-60px) rotate(-5deg) !important;
  }

  .lp-platforms-fan .lp-platform-card:last-child {
    transform: translateX(60px) rotate(5deg) !important;
  }

  .lp-cal-slot {
    width: 44px;
    height: 44px;
  }
}
</style>

<style>
/* Non-scoped: GSAP pin-spacer is injected outside Vue scoped styles */
.pin-spacer:has(.lp-ai-creation) {
  background: transparent !important;
}
</style>

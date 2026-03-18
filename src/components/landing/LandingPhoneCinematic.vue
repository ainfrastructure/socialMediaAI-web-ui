<script setup lang="ts">
import { ref, nextTick, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { gsap } from '@/composables/useGsapSection'
import { useMagneticButton } from '@/composables/useMagneticButton'
import PhoneMockup from '@/components/PhoneMockup.vue'
import MaterialIcon from '@/components/MaterialIcon.vue'
import PhoneScenario7Steps from './PhoneScenario7Steps.vue'

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
  { key: 'strategy', icon: 'lightbulb' },
  { key: 'design', icon: 'palette' },
  { key: 'create', icon: 'auto_awesome' },
  { key: 'adapt', icon: 'devices' },
  { key: 'schedule', icon: 'calendar_month' },
  { key: 'analytics', icon: 'insights' },
]

// Step accent colors for orb tinting
const stepColors = [
  'var(--lp-accent-orange)',
  'var(--lp-accent-violet)',
  'var(--lp-accent-cyan)',
  'var(--lp-accent-violet)',
  'var(--lp-accent-blue)',
  'var(--lp-accent-orange)',
  '#22c55e',
]

let masterTl: gsap.core.Timeline | null = null

onMounted(async () => {
  await nextTick()
  const el = sectionRef.value
  if (!el) return

  // Query all 7 step containers
  const steps = [
    el.querySelector('.ps-step-chat'),
    el.querySelector('.ps-step-strategy'),
    el.querySelector('.ps-step-design'),
    el.querySelector('.ps-step-create'),
    el.querySelector('.ps-step-adapt'),
    el.querySelector('.ps-step-schedule'),
    el.querySelector('.ps-step-analytics'),
  ]
  const shimmer = el.querySelector('.cine-shimmer')
  const orb1 = el.querySelector('.cine-orb-1')
  const orb2 = el.querySelector('.cine-orb-2')

  // Set initial states
  steps.forEach((s, i) => {
    if (i === 0) {
      gsap.set(s, { visibility: 'visible', opacity: 1 })
    } else {
      gsap.set(s, { visibility: 'hidden', opacity: 0 })
    }
  })

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

  // ============ RESET HELPERS ============
  function resetChat() {
    const s = steps[0]!
    gsap.set(s.querySelector('.ps-chat-ai'), { opacity: 0, y: 15 })
    gsap.set(s.querySelector('.ps-typing-dots'), { opacity: 1, height: 'auto' })
    gsap.set(s.querySelector('.ps-chat-ai-text'), { opacity: 0, maxHeight: 0 })
    gsap.set(s.querySelector('.ps-chat-user'), { opacity: 0, y: 10 })
    gsap.set(s.querySelector('.ps-chat-user-text'), { maxWidth: '0%' })
    gsap.set(s.querySelector('.ps-chat-send'), { opacity: 0, scale: 0.8 })
  }

  function resetStrategy() {
    const s = steps[1]!
    gsap.set(s.querySelector('.ps-strategy-response'), { opacity: 0, clipPath: 'inset(0 100% 0 0)' })
    gsap.set(s.querySelectorAll('.ps-strategy-card'), { opacity: 0, x: -20 })
    gsap.set(s.querySelector('.ps-strategy-cta'), { opacity: 0, y: 10, boxShadow: 'none' })
  }

  function resetDesign() {
    const s = steps[2]!
    gsap.set(s.querySelectorAll('.ps-design-card'), { opacity: 0, y: 30, rotation: -3 })
    gsap.set(s.querySelectorAll('.ps-design-layer'), { opacity: 0, y: 12 })
    gsap.set(s.querySelector('.ps-premium-tag'), { opacity: 0, x: -10 })
  }

  function resetCreate() {
    const s = steps[3]!
    gsap.set(s.querySelectorAll('.ps-shimmer'), { opacity: 1 })
    gsap.set(s.querySelector('.ps-ring'), { opacity: 0 })
    gsap.set(s.querySelector('.ps-ring-arc'), { strokeDashoffset: 100 })
    gsap.set(s.querySelector('.ps-create-post'), { opacity: 0, clipPath: 'inset(0 0 100% 0)' })
    gsap.set(s.querySelector('.ps-create-accent-bar'), { scaleX: 0 })
    gsap.set(s.querySelector('.ps-create-tag'), { opacity: 0, scale: 0.5 })
    gsap.set(s.querySelector('.ps-create-headline'), { opacity: 0, y: 8 })
    gsap.set(s.querySelectorAll('.ps-hashtag'), { opacity: 0, y: 10 })
    gsap.set(s.querySelector('.ps-sparkle-badge'), { opacity: 0, scale: 0 })
    gsap.set(s.querySelectorAll('.ps-sparkle-dot'), { opacity: 0, x: 0, y: 0, scale: 1 })
  }

  function resetAdapt() {
    const s = steps[4]!
    gsap.set(s.querySelectorAll('.ps-adapt-card'), { opacity: 0, x: 0, rotation: 0, scale: 0.8 })
    gsap.set(s.querySelectorAll('.ps-adapt-check'), { opacity: 0, scale: 0 })
    gsap.set(s.querySelectorAll('.ps-confetti-dot'), { opacity: 0, x: 0, y: 0, scale: 1 })
    const cc = s.querySelector('[data-charcount]') as HTMLElement | null
    if (cc) cc.textContent = '0 / 3,000'
  }

  function resetSchedule() {
    const s = steps[5]!
    gsap.set(s.querySelector('.ps-schedule-grid'), { opacity: 0, y: 20 })
    gsap.set(s.querySelectorAll('.ps-schedule-dot'), { opacity: 0 })
    gsap.set(s.querySelector('.ps-schedule-highlight'), { opacity: 0, y: 15 })
    gsap.set(s.querySelector('.ps-schedule-hl-time'), { opacity: 0 })
    gsap.set(s.querySelectorAll('.ps-badge'), { x: 0, opacity: 0 })
  }

  function resetAnalytics() {
    const s = steps[6]!
    gsap.set(s.querySelectorAll('.ps-kpi'), { opacity: 0, y: 20 })
    gsap.set(s.querySelectorAll('.ps-kpi-pct'), { opacity: 0, scale: 0 })
    const sparkLine = s.querySelector('.ps-spark-line')
    if (sparkLine) gsap.set(sparkLine, { strokeDashoffset: 400 })
    gsap.set(s.querySelector('.ps-top-post'), { opacity: 0, scale: 0 })
    gsap.set(s.querySelector('.ps-analytics-cta'), { opacity: 0, y: 10 })
    // Reset KPI values
    const kpiDefaults: Record<string, string> = { likes: '0', comments: '0', reach: '0', shares: '0' }
    Object.entries(kpiDefaults).forEach(([key, val]) => {
      const kpiEl = s.querySelector(`[data-kpi="${key}"]`) as HTMLElement | null
      if (kpiEl) kpiEl.textContent = val
    })
  }

  const resets = [resetChat, resetStrategy, resetDesign, resetCreate, resetAdapt, resetSchedule, resetAnalytics]
  resets.forEach((r) => r())

  // Helper: transition between steps
  function addTransition(tl: gsap.core.Timeline, fromStep: number, toStep: number, time: number) {
    tl.to(steps[fromStep], { opacity: 0, scale: 0.95, duration: 0.4 }, time)
    tl.set(steps[fromStep], { visibility: 'hidden' }, time + 0.4)
    tl.call(() => resets[fromStep](), undefined, time + 0.4)
    tl.fromTo(shimmer,
      { opacity: 0, x: '-100%' },
      { opacity: 0.6, x: '100%', duration: 0.5, ease: 'power2.inOut' },
      time + 0.1,
    )
    tl.to(shimmer, { opacity: 0, duration: 0.1 }, time + 0.6)
    tl.set(steps[toStep], { visibility: 'visible' }, time + 0.4)
    tl.fromTo(steps[toStep],
      { opacity: 0, scale: 1.02 },
      { opacity: 1, scale: 1, duration: 0.4 },
      time + 0.4,
    )
    // Tint orbs to match step color
    if (orb1) tl.to(orb1, { background: stepColors[toStep], duration: 0.5 }, time)
    if (orb2) tl.to(orb2, { background: stepColors[toStep], duration: 0.5 }, time + 0.2)
  }

  // ============ BUILD MASTER TIMELINE ============
  masterTl = gsap.timeline({
    repeat: -1,
    delay: 1.5,
    defaults: { ease: 'power2.out' },
  })

  // ---- STEP 1: AI CHAT (0s – 4.5s) ----
  masterTl.call(() => { activeScenario.value = 0 })
  const s1 = steps[0]!

  // AI bubble slides up
  masterTl.to(s1.querySelector('.ps-chat-ai'), {
    opacity: 1, y: 0, duration: 0.25, ease: 'back.out(1.7)',
  }, 0.2)

  // Typing dots pulse then fade
  masterTl.to(s1.querySelector('.ps-typing-dots'), {
    opacity: 0, height: 0, duration: 0.2,
  }, 1.0)

  // AI text reveals via clip-path
  masterTl.to(s1.querySelector('.ps-chat-ai-text'), {
    opacity: 1, maxHeight: 100, duration: 0.5, ease: 'none',
  }, 1.2)

  // User bubble fades in
  masterTl.to(s1.querySelector('.ps-chat-user'), {
    opacity: 1, y: 0, duration: 0.15,
  }, 1.9)

  // User text types
  masterTl.to(s1.querySelector('.ps-chat-user-text'), {
    maxWidth: '100%', duration: 0.6, ease: 'steps(40)',
  }, 2.1)

  // Send button bounces in
  masterTl.to(s1.querySelector('.ps-chat-send'), {
    opacity: 1, scale: 1, duration: 0.2, ease: 'back.out(2)',
  }, 2.8)

  // Transition 1→2
  addTransition(masterTl, 0, 1, 4.0)

  // ---- STEP 2: STRATEGY (4.8s – 9s) ----
  const s2Start = 4.8
  masterTl.call(() => { activeScenario.value = 1 }, undefined, s2Start)
  const s2 = steps[1]!

  // Response text wipe
  masterTl.to(s2.querySelector('.ps-strategy-response'), {
    opacity: 1, clipPath: 'inset(0 0% 0 0)', duration: 0.3, ease: 'power3.out',
  }, s2Start + 0.2)

  // Strategy cards stagger
  masterTl.to(s2.querySelectorAll('.ps-strategy-card'), {
    opacity: 1, x: 0, duration: 0.25, stagger: 0.12, ease: 'back.out(1.5)',
  }, s2Start + 0.6)

  // CTA button with glow pulse
  masterTl.to(s2.querySelector('.ps-strategy-cta'), {
    opacity: 1, y: 0, duration: 0.2,
  }, s2Start + 1.4)
  masterTl.to(s2.querySelector('.ps-strategy-cta'), {
    boxShadow: '0 0 16px rgba(139,92,246,0.4)',
    duration: 0.3, yoyo: true, repeat: 1,
  }, s2Start + 1.7)

  // Transition 2→3
  addTransition(masterTl, 1, 2, 8.5)

  // ---- STEP 3: DESIGN (9.3s – 13.5s) ----
  const s3Start = 9.3
  masterTl.call(() => { activeScenario.value = 2 }, undefined, s3Start)
  const s3 = steps[2]!

  // Template cards fan in from stacked
  masterTl.to(s3.querySelectorAll('.ps-design-card'), {
    opacity: 1, y: 0, rotation: 0, duration: 0.3, stagger: 0.1, ease: 'back.out(1.5)',
  }, s3Start + 0.2)

  // Selection ring pulses on middle card
  masterTl.to(s3.querySelector('.ps-design-selected'), {
    scale: 1.04, duration: 0.2, yoyo: true, repeat: 1, ease: 'power2.inOut',
  }, s3Start + 0.9)

  // Layer items stagger
  masterTl.to(s3.querySelectorAll('.ps-design-layer'), {
    opacity: 1, y: 0, duration: 0.2, stagger: 0.08, ease: 'power3.out',
  }, s3Start + 1.2)

  // Premium badge slides in
  masterTl.to(s3.querySelector('.ps-premium-tag'), {
    opacity: 1, x: 0, duration: 0.2, ease: 'power2.out',
  }, s3Start + 1.8)

  // Transition 3→4
  addTransition(masterTl, 2, 3, 13.0)

  // ---- STEP 4: CREATE (13.8s – 18s) ----
  const s4Start = 13.8
  masterTl.call(() => { activeScenario.value = 3 }, undefined, s4Start)
  const s4 = steps[3]!

  // Shimmers fade out
  masterTl.to(s4.querySelectorAll('.ps-shimmer'), {
    opacity: 0, y: -5, duration: 0.2, stagger: 0.15,
  }, s4Start + 0.3)

  // Processing ring appears and fills
  masterTl.to(s4.querySelector('.ps-ring'), { opacity: 1, duration: 0.15 }, s4Start + 0.8)
  masterTl.to(s4.querySelector('.ps-ring-arc'), {
    strokeDashoffset: 0, duration: 0.4, ease: 'none',
  }, s4Start + 0.9)
  masterTl.to(s4.querySelector('.ps-ring'), { opacity: 0, duration: 0.15 }, s4Start + 1.4)

  // Post card clip-path wipe from bottom
  masterTl.to(s4.querySelector('.ps-create-post'), {
    opacity: 1, clipPath: 'inset(0 0 0% 0)', duration: 0.35, ease: 'power3.out',
  }, s4Start + 1.5)

  // Accent bar, tag, headline
  masterTl.to(s4.querySelector('.ps-create-accent-bar'), {
    scaleX: 1, duration: 0.25, ease: 'power3.out',
  }, s4Start + 1.8)
  masterTl.to(s4.querySelector('.ps-create-tag'), {
    opacity: 1, scale: 1, duration: 0.15, ease: 'back.out(2)',
  }, s4Start + 2.0)
  masterTl.to(s4.querySelector('.ps-create-headline'), {
    opacity: 1, y: 0, duration: 0.2, ease: 'power2.out',
  }, s4Start + 2.1)

  // Hashtag pills elastic stagger
  masterTl.to(s4.querySelectorAll('.ps-hashtag'), {
    opacity: 1, y: 0, duration: 0.3, stagger: 0.06, ease: 'elastic.out(1, 0.5)',
  }, s4Start + 2.4)

  // Sparkle badge pops
  masterTl.to(s4.querySelector('.ps-sparkle-badge'), {
    opacity: 1, scale: 1, duration: 0.2, ease: 'back.out(3)',
  }, s4Start + 2.8)

  // Sparkle dots burst
  const sparkleDots = s4.querySelectorAll('.ps-sparkle-dot')
  sparkleDots.forEach((dot, i) => {
    const angle = (i / 5) * 360 * (Math.PI / 180)
    const dist = 40 + Math.random() * 20
    masterTl!.to(dot, {
      opacity: 1, x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, scale: 1.5,
      duration: 0.4, ease: 'power2.out',
    }, s4Start + 3.0)
    masterTl!.to(dot, { opacity: 0, duration: 0.2 }, s4Start + 3.4)
  })

  // Transition 4→5
  addTransition(masterTl, 3, 4, 17.5)

  // ---- STEP 5: ADAPT (18.3s – 22.5s) ----
  const s5Start = 18.3
  masterTl.call(() => { activeScenario.value = 4 }, undefined, s5Start)
  const s5 = steps[4]!

  // Cards fan out from center
  const adaptCards = s5.querySelectorAll('.ps-adapt-card')
  if (adaptCards.length === 3) {
    masterTl.to(adaptCards[0], {
      opacity: 1, x: -80, rotation: -6, scale: 1, duration: 0.35, ease: 'back.out(1.5)',
    }, s5Start + 0.2)
    masterTl.to(adaptCards[1], {
      opacity: 1, x: 0, scale: 1, duration: 0.35, ease: 'back.out(1.5)',
    }, s5Start + 0.2)
    masterTl.to(adaptCards[2], {
      opacity: 1, x: 80, rotation: 6, scale: 1, duration: 0.35, ease: 'back.out(1.5)',
    }, s5Start + 0.2)
  }

  // LinkedIn center card glow
  masterTl.to(adaptCards[1], {
    boxShadow: '0 0 20px rgba(10,102,194,0.4)',
    duration: 0.3, yoyo: true, repeat: 1,
  }, s5Start + 0.8)

  // Checkmarks stagger
  masterTl.to(s5.querySelectorAll('.ps-adapt-check'), {
    opacity: 1, scale: 1, duration: 0.2, stagger: 0.2, ease: 'back.out(3)',
  }, s5Start + 1.2)

  // Character count proxy
  const ccEl = s5.querySelector('[data-charcount]') as HTMLElement | null
  if (ccEl) {
    const ccProxy = { value: 0 }
    masterTl.to(ccProxy, {
      value: 2847, duration: 0.8, ease: 'power2.out',
      onUpdate() {
        ccEl.textContent = Math.round(ccProxy.value).toLocaleString('en-US') + ' / 3,000'
      },
    }, s5Start + 1.5)
  }

  // Confetti burst
  const confettiDots = s5.querySelectorAll('.ps-confetti-dot')
  const confettiAngles = [0, 36, 72, 108, 144, 180, 216, 252, 288, 324]
  confettiDots.forEach((dot, i) => {
    const angle = confettiAngles[i] * (Math.PI / 180)
    const dist = 40 + Math.random() * 30
    masterTl!.to(dot, {
      opacity: 1, x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, scale: 1.5,
      duration: 0.5, ease: 'power2.out',
    }, s5Start + 2.5)
    masterTl!.to(dot, { opacity: 0, duration: 0.3 }, s5Start + 3.0)
  })

  // Transition 5→6
  addTransition(masterTl, 4, 5, 22.0)

  // ---- STEP 6: SCHEDULE (22.8s – 27s) ----
  const s6Start = 22.8
  masterTl.call(() => { activeScenario.value = 5 }, undefined, s6Start)
  const s6 = steps[5]!

  // Calendar grid fades in
  masterTl.to(s6.querySelector('.ps-schedule-grid'), {
    opacity: 1, y: 0, duration: 0.3, ease: 'power2.out',
  }, s6Start + 0.2)

  // Dots stagger
  masterTl.to(s6.querySelectorAll('.ps-schedule-dot'), {
    opacity: 1, duration: 0.15, stagger: 0.06, ease: 'back.out(3)',
  }, s6Start + 0.6)

  // Highlight card slides in
  masterTl.to(s6.querySelector('.ps-schedule-highlight'), {
    opacity: 1, y: 0, duration: 0.25, ease: 'back.out(2)',
  }, s6Start + 1.1)

  // Best time label fades in
  masterTl.to(s6.querySelector('.ps-schedule-hl-time'), {
    opacity: 1, duration: 0.2,
  }, s6Start + 1.5)

  // Badge carousel
  const bScheduled = s6.querySelector('.ps-badge-scheduled')
  const bPublished = s6.querySelector('.ps-badge-published')
  const bCta = s6.querySelector('.ps-badge-cta-pill')

  if (bScheduled) {
    masterTl.fromTo(bScheduled,
      { x: '-100vw', opacity: 0 },
      { x: 0, opacity: 1, duration: 0.18, ease: 'power2.out', immediateRender: false },
      s6Start + 1.8,
    )
    masterTl.to(bScheduled, { x: '100vw', opacity: 0, duration: 0.15, ease: 'power2.in' }, s6Start + 2.3)
  }
  if (bPublished) {
    masterTl.fromTo(bPublished,
      { x: '-100vw', opacity: 0 },
      { x: 0, opacity: 1, duration: 0.18, ease: 'power2.out', immediateRender: false },
      s6Start + 2.3,
    )
    masterTl.to(bPublished, { x: '100vw', opacity: 0, duration: 0.15, ease: 'power2.in' }, s6Start + 2.8)
  }
  if (bCta) {
    masterTl.fromTo(bCta,
      { x: '-100vw', opacity: 0 },
      { x: 0, opacity: 1, duration: 0.18, ease: 'power2.out', immediateRender: false },
      s6Start + 2.8,
    )
  }

  // Transition 6→7
  addTransition(masterTl, 5, 6, 26.5)

  // ---- STEP 7: ANALYTICS (27.3s – 32s) ----
  const s7Start = 27.3
  masterTl.call(() => { activeScenario.value = 6 }, undefined, s7Start)
  const s7 = steps[6]!

  // KPI cards stagger
  masterTl.to(s7.querySelectorAll('.ps-kpi'), {
    opacity: 1, y: 0, duration: 0.25, stagger: 0.12, ease: 'back.out(1.7)',
  }, s7Start + 0.2)

  // KPI numbers count up
  const kpiTargets = [
    { selector: '[data-kpi="likes"]', target: 2400, format: (v: number) => v >= 1000 ? (v / 1000).toFixed(1) + 'K' : String(Math.round(v)) },
    { selector: '[data-kpi="comments"]', target: 847, format: (v: number) => String(Math.round(v)) },
    { selector: '[data-kpi="reach"]', target: 12400, format: (v: number) => v >= 1000 ? (v / 1000).toFixed(1) + 'K' : String(Math.round(v)) },
    { selector: '[data-kpi="shares"]', target: 392, format: (v: number) => String(Math.round(v)) },
  ]
  kpiTargets.forEach((kpi) => {
    const kpiEl = s7.querySelector(kpi.selector) as HTMLElement | null
    if (!kpiEl) return
    const proxy = { value: 0 }
    masterTl!.to(proxy, {
      value: kpi.target, duration: 1, ease: 'power2.out',
      onUpdate() { kpiEl.textContent = kpi.format(proxy.value) },
    }, s7Start + 0.5)
  })

  // Percentage badges pop
  masterTl.to(s7.querySelectorAll('.ps-kpi-pct'), {
    opacity: 1, scale: 1, duration: 0.2, stagger: 0.1, ease: 'back.out(2)',
  }, s7Start + 1.3)

  // Sparkline draws
  const sparkLine = s7.querySelector('.ps-spark-line')
  if (sparkLine) {
    masterTl.to(sparkLine, {
      strokeDashoffset: 0, duration: 0.5, ease: 'power2.inOut',
    }, s7Start + 1.5)
  }

  // Top post badge
  masterTl.to(s7.querySelector('.ps-top-post'), {
    opacity: 1, scale: 1, duration: 0.2, ease: 'back.out(2)',
  }, s7Start + 2.2)

  // CTA button fades up + persistent glow
  masterTl.to(s7.querySelector('.ps-analytics-cta'), {
    opacity: 1, y: 0, duration: 0.2,
  }, s7Start + 2.5)
  masterTl.set(s7.querySelector('.ps-analytics-cta'), {
    animation: 'ps-cta-glow 2s ease-in-out infinite',
  }, s7Start + 2.7)

  // NO EXIT for last step — hold, then transition back to chat
  // Transition 7→1 (loop restart)
  const loopEnd = s7Start + 5
  masterTl.to(steps[6], { opacity: 0, scale: 0.95, duration: 0.4 }, loopEnd)
  masterTl.set(steps[6], { visibility: 'hidden' }, loopEnd + 0.4)
  masterTl.call(() => resetAnalytics(), undefined, loopEnd + 0.4)
  masterTl.fromTo(shimmer,
    { opacity: 0, x: '-100%' },
    { opacity: 0.6, x: '100%', duration: 0.5, ease: 'power2.inOut' },
    loopEnd + 0.1,
  )
  masterTl.to(shimmer, { opacity: 0, duration: 0.1 }, loopEnd + 0.6)
  masterTl.set(steps[0], { visibility: 'visible', opacity: 1, scale: 1 }, loopEnd + 0.4)
  if (orb1) masterTl.to(orb1, { background: stepColors[0], duration: 0.5 }, loopEnd)
  if (orb2) masterTl.to(orb2, { background: stepColors[0], duration: 0.5 }, loopEnd + 0.2)
  masterTl.to({}, { duration: 0.5 }, loopEnd + 1)
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
            <div class="cine-shimmer" />
            <PhoneScenario7Steps />
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

/* Phone inner content */
.cine-phone-inner {
  width: 100%;
  height: 100%;
  position: relative;
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

/* Scenario pills — 7 items */
.cine-pills {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  justify-content: center;
}

.cine-pill {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 4px 8px;
  border-radius: var(--radius-full);
  font-size: 10px;
  font-weight: var(--font-medium);
  color: var(--lp-text-muted);
  background: var(--lp-glass-bg);
  border: 1px solid var(--lp-border);
  transition: all 0.4s ease;
  white-space: nowrap;
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
    gap: 3px;
    max-width: 100%;
    overflow-x: auto;
    flex-wrap: nowrap;
    justify-content: flex-start;
    -webkit-overflow-scrolling: touch;
    padding-bottom: var(--space-xs);
  }

  .cine-pill {
    flex-shrink: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .cine-orb { animation: none; }
  .cine-badge-dot { animation: none; }
  .cine-cta-primary::after { animation: none; }
}
</style>

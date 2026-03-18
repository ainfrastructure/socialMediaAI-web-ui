<script setup lang="ts">
import { ref, watch, onUnmounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{ visible: boolean }>()

const { t } = useI18n()
const activeTemplate = ref(0)
let rotationInterval: ReturnType<typeof setInterval> | null = null

interface TemplatePreview {
  key: string
  bg: string
  pattern: string
  patternType: 'topography' | 'flow' | 'halftone'
  text: string
  accent: string
}

const templates: TemplatePreview[] = [
  {
    key: 'ocean',
    bg: '#0E2230',
    pattern: '#3A9BC0',
    patternType: 'topography',
    text: '#FFFFFF',
    accent: '#3A9BC0',
  },
  {
    key: 'coastal',
    bg: '#0E2230',
    pattern: '#B08A5A',
    patternType: 'flow',
    text: '#FFFFFF',
    accent: '#B08A5A',
  },
  {
    key: 'premium',
    bg: '#0A0A0A',
    pattern: '#D4A053',
    patternType: 'halftone',
    text: '#FFFFFF',
    accent: '#D4A053',
  },
]

// ── Topography rings (ported from mazeTemplateService.ts topoRings) ──
// 14 concentric irregular closed rings, Catmull-Rom splines, centered upper-right
// Scaled from 1080→320 viewBox (factor ≈ 0.296)
function catmullRomClosed(pts: [number, number][], tension = 0.4): string {
  const n = pts.length
  if (n < 3) return ''
  const t = tension
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n]
    const p1 = pts[i]
    const p2 = pts[(i + 1) % n]
    const p3 = pts[(i + 2) % n]
    const c1x = p1[0] + (p2[0] - p0[0]) * t
    const c1y = p1[1] + (p2[1] - p0[1]) * t
    const c2x = p2[0] - (p3[0] - p1[0]) * t
    const c2y = p2[1] - (p3[1] - p1[1]) * t
    d += ` C${c1x.toFixed(1)} ${c1y.toFixed(1)},${c2x.toFixed(1)} ${c2y.toFixed(1)},${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`
  }
  d += ' Z'
  return d
}

const topoRingPaths = computed(() => {
  const scale = 320 / 1080
  const cx = 820 * scale // ~243
  const cy = 180 * scale // ~53
  const numRings = 14
  const numPts = 20
  const color = templates[activeTemplate.value].pattern
  const paths: { d: string; opacity: number; sw: number }[] = []

  for (let i = 0; i < numRings; i++) {
    const baseRadius = (60 + i * 52) * scale
    const opacity = 0.35 - (0.35 - 0.1) * (i / (numRings - 1))
    const sw = (2.2 - (2.2 - 1.0) * (i / (numRings - 1))) * scale

    const pts: [number, number][] = []
    for (let j = 0; j < numPts; j++) {
      const angle = (j / numPts) * Math.PI * 2
      const noise = Math.sin(angle * 7 + i * 1.3) * 38 * scale
      const r = baseRadius + noise
      pts.push([cx + Math.cos(angle) * r, cy + Math.sin(angle) * r])
    }

    paths.push({ d: catmullRomClosed(pts, 0.4), opacity, sw })
  }
  return { paths, color }
})

// ── Flow dunes (ported from mazeTemplateService.ts dunePath) ──
// 4 layered sine-wave dune shapes painted back-to-front
// Scaled from 1080→320 viewBox
function blendHex(c1: string, c2: string, t: number): string {
  const h1 = c1.replace('#', ''), h2 = c2.replace('#', '')
  const r = Math.round(parseInt(h1.slice(0, 2), 16) * (1 - t) + parseInt(h2.slice(0, 2), 16) * t)
  const g = Math.round(parseInt(h1.slice(2, 4), 16) * (1 - t) + parseInt(h2.slice(2, 4), 16) * t)
  const b = Math.round(parseInt(h1.slice(4, 6), 16) * (1 - t) + parseInt(h2.slice(4, 6), 16) * t)
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

const flowDunePaths = computed(() => {
  const S = 320
  const W = S
  const H = S
  const tpl = templates[activeTemplate.value]
  const accent = tpl.pattern
  const bg = tpl.bg

  function dunePath(topY: number, amp: number, phase: number): string {
    const steps = 80
    const tension = 0.28
    const pts: [number, number][] = []
    for (let i = 0; i <= steps; i++) {
      const x = (i / steps) * W
      const y = topY + amp * Math.sin((i / steps) * Math.PI * 1.6 + phase)
      pts.push([x, y])
    }
    let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)]
      const p1 = pts[i]
      const p2 = pts[i + 1]
      const p3 = pts[Math.min(pts.length - 1, i + 2)]
      const c1x = p1[0] + (p2[0] - p0[0]) * tension
      const c1y = p1[1] + (p2[1] - p0[1]) * tension
      const c2x = p2[0] - (p3[0] - p1[0]) * tension
      const c2y = p2[1] - (p3[1] - p1[1]) * tension
      d += `C${c1x.toFixed(1)} ${c1y.toFixed(1)},${c2x.toFixed(1)} ${c2y.toFixed(1)},${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`
    }
    d += `L${W} ${H} L0 ${H} Z`
    return d
  }

  const duneColors = [
    blendHex(accent, bg, 0.88),
    blendHex(accent, bg, 0.74),
    blendHex(accent, bg, 0.58),
    blendHex(accent, bg, 0.4),
  ]

  // Scale dune configs from 1080 to 320
  const scale = 320 / 1080
  const duneConfigs = [
    { topY: 100 * scale, amp: 65 * scale, phase: 0.4 },
    { topY: 185 * scale, amp: 62 * scale, phase: -0.3 },
    { topY: 272 * scale, amp: 58 * scale, phase: 0.9 },
    { topY: 355 * scale, amp: 54 * scale, phase: -0.1 },
  ]

  const dunes = duneConfigs.map((cfg, i) => ({
    d: dunePath(cfg.topY, cfg.amp, cfg.phase),
    fill: duneColors[i],
  }))

  // Lower fade gradient y positions
  const fadeY = Math.round(480 * scale)

  return { dunes, bg, fadeY }
})

// ── Halftone dots (ported from mazeTemplateService.ts halftoneDotsPattern) ──
// Dots radiate from top-right corner, larger closer to corner
const halftoneDots = computed(() => {
  const S = 320
  const color = templates[activeTemplate.value].pattern
  const spacing = 13
  const maxR = 3.3
  const minR = 0.6
  const dots: { cx: number; cy: number; r: number }[] = []

  for (let x = spacing / 2; x < S; x += spacing) {
    for (let y = spacing / 2; y < S * 0.88; y += spacing) {
      const dx = S - x
      const dy = y
      const dist = Math.sqrt(dx * dx + dy * dy)
      const maxDist = Math.sqrt(S * S + (S * 0.88) * (S * 0.88))
      const t = 1 - dist / maxDist
      if (t < 0.04) continue
      const r = minR + (maxR - minR) * t
      dots.push({ cx: x, cy: y, r })
    }
  }
  return { dots, color }
})

function startRotation() {
  stopRotation()
  rotationInterval = setInterval(() => {
    activeTemplate.value = (activeTemplate.value + 1) % templates.length
  }, 5000)
}

function stopRotation() {
  if (rotationInterval) {
    clearInterval(rotationInterval)
    rotationInterval = null
  }
}

function setTemplate(index: number) {
  activeTemplate.value = index
  if (props.visible) startRotation()
}

watch(() => props.visible, (v) => {
  if (v) {
    activeTemplate.value = 0
    startRotation()
  } else {
    stopRotation()
  }
}, { immediate: true })

onUnmounted(() => stopRotation())
</script>

<template>
  <div class="lp-canvas-container">
    <div class="lp-template-showcase">
      <div class="lp-template-stage">
        <Transition name="tpl-fade" mode="out-in">
          <div
            :key="templates[activeTemplate].key"
            class="lp-template-card"
            :style="{
              '--tpl-bg': templates[activeTemplate].bg,
              '--tpl-pattern': templates[activeTemplate].pattern,
              '--tpl-text': templates[activeTemplate].text,
              '--tpl-accent': templates[activeTemplate].accent,
            }"
          >
            <div class="lp-tpl-bg" />

            <!-- Topography pattern: concentric irregular rings (from topoRings) -->
            <svg
              v-if="templates[activeTemplate].patternType === 'topography'"
              class="lp-tpl-pattern"
              viewBox="0 0 320 320"
              preserveAspectRatio="none"
            >
              <path
                v-for="(ring, i) in topoRingPaths.paths"
                :key="'topo' + i"
                :d="ring.d"
                fill="none"
                :stroke="topoRingPaths.color"
                :stroke-width="ring.sw"
                :opacity="ring.opacity"
              />
            </svg>

            <!-- Flow/Dunes pattern: layered sine-wave dunes back-to-front -->
            <svg
              v-if="templates[activeTemplate].patternType === 'flow'"
              class="lp-tpl-pattern"
              viewBox="0 0 320 320"
              preserveAspectRatio="none"
            >
              <path
                v-for="(dune, i) in flowDunePaths.dunes"
                :key="'dune' + i"
                :d="dune.d"
                :fill="dune.fill"
              />
              <!-- Fade dunes back to bg in lower portion -->
              <defs>
                <linearGradient id="flowFade" x1="0" :y1="flowDunePaths.fadeY" x2="0" :y2="flowDunePaths.fadeY + 60" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" :stop-color="flowDunePaths.bg" stop-opacity="0" />
                  <stop offset="100%" :stop-color="flowDunePaths.bg" stop-opacity="1" />
                </linearGradient>
              </defs>
              <rect x="0" :y="flowDunePaths.fadeY" width="320" height="60" fill="url(#flowFade)" />
              <rect x="0" :y="flowDunePaths.fadeY + 60" width="320" :height="320 - flowDunePaths.fadeY - 60" :fill="flowDunePaths.bg" />
            </svg>

            <!-- Halftone pattern: dots radiating from top-right corner -->
            <svg
              v-if="templates[activeTemplate].patternType === 'halftone'"
              class="lp-tpl-pattern"
              viewBox="0 0 320 320"
              preserveAspectRatio="none"
            >
              <circle
                v-for="(dot, i) in halftoneDots.dots"
                :key="'ht' + i"
                :cx="dot.cx"
                :cy="dot.cy"
                :r="dot.r"
                :fill="halftoneDots.color"
                opacity="0.25"
              />
            </svg>

            <!-- Content -->
            <div class="lp-tpl-content">
              <span class="lp-tpl-eyebrow">{{ t(`appLanding.designBuilder.tpl${templates[activeTemplate].key}Eyebrow`) }}</span>
              <span class="lp-tpl-headline">{{ t(`appLanding.designBuilder.tpl${templates[activeTemplate].key}Headline`) }}</span>
              <span class="lp-tpl-subline">{{ t(`appLanding.designBuilder.tpl${templates[activeTemplate].key}Subline`) }}</span>
            </div>

            <!-- Template label -->
            <div class="lp-tpl-label">
              <span>{{ t(`appLanding.designBuilder.tpl${templates[activeTemplate].key}Name`) }}</span>
            </div>
          </div>
        </Transition>
      </div>

      <!-- Navigation dots -->
      <div class="lp-template-nav">
        <button
          v-for="(tpl, i) in templates"
          :key="tpl.key"
          class="lp-nav-dot"
          :class="{ active: i === activeTemplate }"
          :aria-label="t(`appLanding.designBuilder.tpl${tpl.key}Name`)"
          @click="setTemplate(i)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.lp-canvas-container {
  display: flex;
  justify-content: center;
}

.lp-template-showcase {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-lg);
}

.lp-template-stage {
  width: 340px;
  height: 340px;
  position: relative;
}

/* Transition */
.tpl-fade-enter-active,
.tpl-fade-leave-active {
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.tpl-fade-enter-from {
  opacity: 0;
  transform: scale(0.95) translateY(8px);
}

.tpl-fade-leave-to {
  opacity: 0;
  transform: scale(1.03) translateY(-6px);
}

/* Template card */
.lp-template-card {
  position: absolute;
  inset: 0;
  border-radius: var(--radius-xl);
  overflow: hidden;
  border: 1px solid var(--lp-border);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.3),
    0 2px 8px rgba(0, 0, 0, 0.2);
}

.lp-tpl-bg {
  position: absolute;
  inset: 0;
  background: var(--tpl-bg);
}

.lp-tpl-pattern {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.lp-tpl-content {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  padding: var(--space-3xl) var(--space-2xl);
  z-index: 2;
}

.lp-tpl-eyebrow {
  font-size: 9px;
  font-weight: var(--font-bold);
  color: var(--tpl-accent);
  text-transform: uppercase;
  letter-spacing: 0.2em;
  margin-bottom: var(--space-md);
  opacity: 0.85;
}

.lp-tpl-headline {
  font-family: var(--font-heading);
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  color: var(--tpl-text);
  line-height: 1.15;
  margin-bottom: var(--space-sm);
  letter-spacing: -0.01em;
}

.lp-tpl-subline {
  font-size: var(--text-sm);
  color: var(--tpl-text);
  opacity: 0.6;
  line-height: 1.5;
  max-width: 220px;
}

.lp-tpl-label {
  position: absolute;
  top: var(--space-md);
  right: var(--space-md);
  padding: 3px 10px;
  border-radius: var(--radius-full);
  background: rgba(128, 128, 128, 0.1);
  border: 1px solid rgba(128, 128, 128, 0.12);
  z-index: 3;
}

.lp-tpl-label span {
  font-size: 10px;
  font-weight: var(--font-semibold);
  color: var(--tpl-accent);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

/* Navigation dots */
.lp-template-nav {
  display: flex;
  gap: var(--space-sm);
  align-items: center;
}

.lp-nav-dot {
  width: 28px;
  height: 6px;
  padding: 0;
  border: none;
  background: var(--lp-bg-elevated);
  border-radius: var(--radius-full);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: background 0.3s ease;
}

.lp-nav-dot:hover {
  background: var(--lp-border-light);
}

.lp-nav-dot::after {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--lp-accent-orange);
  border-radius: inherit;
  transform: scaleX(0);
  transform-origin: left;
}

.lp-nav-dot.active::after {
  transform: scaleX(1);
  animation: dot-progress 5s linear;
}

@keyframes dot-progress {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}

@media (max-width: 768px) {
  .lp-template-stage {
    width: 280px;
    height: 280px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .tpl-fade-enter-active,
  .tpl-fade-leave-active {
    transition-duration: 0.01ms !important;
  }

  .lp-nav-dot.active::after {
    animation: none;
    transform: scaleX(1);
  }
}
</style>

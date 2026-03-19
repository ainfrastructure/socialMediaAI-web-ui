<script setup lang="ts">
/**
 * Interactive background effects — ported directly from the working
 * socialchef-background-previewer.html demo. Uses raw canvas with
 * window dimensions (not offsetWidth) and no blend mode.
 */
import { ref, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  mode: 'none' | 'wave' | 'particles'
  accentColor?: string
  intensity?: number
  particleDensity?: number
  particleColorMode?: 'default' | 'adapt' | 'vortex'
  particleStyle?: 'flow' | 'swarm'
  particleSpeed?: number
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
let W = 0, H = 0
let raf = 0
let generation = 0
let mx = 0.5, my = 0.5, pressing = false
let targetMx = 0.5, targetMy = 0.5
let isMobileDevice = false
let burstStrength = 0
let meshTime = 0
let flowTime = 0
let frameCount = 0
let paused = false
let flowParts: { x: number; y: number; px: number; py: number; age: number; speed: number; vx: number; vy: number; seed: number }[] = []

const defaultFlowColors = [[139, 92, 246], [59, 130, 246], [6, 182, 212], [249, 115, 22]]

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

function shiftColor(rgb: [number, number, number], lighten: number): [number, number, number] {
  return rgb.map(c => Math.max(0, Math.min(255, Math.round(c + lighten)))) as [number, number, number]
}

function getAdaptiveColors(accent: string): { base: number[][]; hot: number[][] } {
  const rgb = hexToRgb(accent)
  return {
    // Cool / calm base colors (shown normally and after burst)
    base: [
      shiftColor(rgb, 80),
      shiftColor(rgb, 40),
      [rgb[0], rgb[1], rgb[2]],
      shiftColor(rgb, -30),
    ],
    // Hot / intense colors (shown in vortex)
    hot: [
      [rgb[0], rgb[1], rgb[2]],
      shiftColor(rgb, -40),
      shiftColor(rgb, -70),
      shiftColor(rgb, -100),
    ],
  }
}

// ── Resize ──
function resize() {
  if (!canvasRef.value) return
  W = canvasRef.value.width = window.innerWidth
  H = canvasRef.value.height = window.innerHeight
  if (props.mode === 'particles') {
    initFlow()
    if (ctx) { ctx.clearRect(0, 0, W, H) }
  }
}

// ── Wave Mesh (from demo drawMesh) ──
function drawMesh() {
  if (!ctx) return
  const speed = props.particleSpeed ?? 1
  meshTime += 0.012 * speed
  ctx.clearRect(0, 0, W, H)

  const cols = 80, rows = 50
  const cw = W / cols, ch = H / rows

  function getZ(nx: number, ny: number) {
    const dx = nx - mx, dy = ny - my
    const dist = Math.sqrt(dx * dx + dy * dy)
    const amp = pressing ? 50 : 22
    return Math.sin(nx * 6 + meshTime * 1.5) * Math.cos(ny * 4 + meshTime) * 12
      + Math.sin(nx * 3 + meshTime * 0.7) * 6
      + Math.exp(-dist * 4) * amp * Math.sin(dist * 20 - meshTime * 4)
  }

  for (let j = 0; j < rows; j++) {
    ctx.beginPath()
    for (let i = 0; i <= cols; i++) {
      const nx = i / cols, ny = j / rows
      const z = getZ(nx, ny)
      const x = i * cw, y = j * ch + z
      if (i === 0) { ctx.moveTo(x, y) } else { ctx.lineTo(x, y) }
    }
    const t = j / rows
    ctx.strokeStyle = `rgba(139,92,246,${0.04 + t * 0.12})`
    ctx.lineWidth = 0.7
    ctx.stroke()
  }

  for (let i = 0; i < cols; i += 3) {
    ctx.beginPath()
    for (let j = 0; j <= rows; j++) {
      const nx = i / cols, ny = j / rows
      const z = getZ(nx, ny)
      const x = i * cw, y = j * ch + z
      if (j === 0) { ctx.moveTo(x, y) } else { ctx.lineTo(x, y) }
    }
    ctx.strokeStyle = `rgba(59,130,246,${0.02 + (i / cols) * 0.06})`
    ctx.lineWidth = 0.5
    ctx.stroke()
  }
}

// ── Particle Flow (from demo drawFlow) ──
function flowNoise(x: number, y: number) {
  return Math.sin(x * 0.8 + flowTime) * Math.cos(y * 0.6 + flowTime * 0.7)
    + Math.sin((x + y) * 0.5 + flowTime * 1.3) * 0.5
    + Math.cos(x * 0.3 - flowTime * 0.5) * Math.sin(y * 0.4 + flowTime * 0.9) * 0.3
}

function initFlow() {
  const density = props.particleDensity ?? 1
  const base = window.innerWidth < 768 ? 400 : 1500
  flowParts = Array.from({ length: Math.round(base * density) }, () => {
    const x = Math.random() * W, y = Math.random() * H
    return { x, y, px: x, py: y, age: Math.random() * 120, speed: 0.8, vx: 0, vy: 0, seed: Math.random() * 1000 }
  })
}

function drawFlow() {
  if (!ctx) return
  const density = props.particleDensity ?? 1
  const speed = props.particleSpeed ?? 1
  flowTime += 0.008 * speed
  burstStrength *= 0.88
  ctx.clearRect(0, 0, W, H)

  const burstActive = burstStrength > 0.01
  const colorMode = props.particleColorMode ?? 'default'
  const isAdapt = colorMode === 'adapt' && props.accentColor
  const isVortex = colorMode === 'vortex' && props.accentColor
  const adaptColors = (isAdapt || isVortex) ? getAdaptiveColors(props.accentColor!) : null
  // Vortex mode: orange hot palette for the spinning center
  const orangeHot: number[][] | null = isVortex ? [
    [249, 115, 22],  // orange
    [234, 88, 12],   // darker orange
    [194, 65, 12],   // deep orange
    [154, 52, 18],   // burnt orange
  ] : null

  for (const p of flowParts) {
    p.px = p.x; p.py = p.y

    // Flow angle — swarm mode adds per-particle jitter to break up lines
    const swarm = props.particleStyle === 'swarm'
    let angle = swarm
      ? flowNoise(p.x * 0.004 + p.seed, p.y * 0.004 + p.seed * 0.7) * Math.PI * 2
      : flowNoise(p.x * 0.004, p.y * 0.004) * Math.PI * 2
    if (swarm) angle += Math.sin(flowTime * 2.3 + p.seed) * 0.3

    const dx = p.x / W - mx, dy = p.y / H - my
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < 0.18) {
      const vortex = Math.atan2(dy, dx) + Math.PI / 2
      const bl = 1 - dist / 0.18, sb = bl * bl * (3 - 2 * bl)
      angle = angle * (1 - sb) + vortex * sb
      p.speed = (0.8 + sb * (pressing ? 5 : 2.5)) * speed
    } else {
      p.speed *= 0.995; p.speed = Math.max(0.8 * speed, p.speed)
    }

    // Burst impulse — only on vortex particles
    if (burstActive && dist < 0.18) {
      const proximity = 1 - dist / 0.18
      const force = proximity * proximity * burstStrength * 4
      const pushAngle = Math.atan2(dy, dx)
      p.vx += Math.cos(pushAngle) * force
      p.vy += Math.sin(pushAngle) * force
    }

    // Decay burst velocity smoothly back to zero
    p.vx *= 0.96
    p.vy *= 0.96

    // Move: normal flow + burst residual
    p.x += Math.cos(angle) * p.speed + p.vx
    p.y += Math.sin(angle) * p.speed + p.vy

    if (p.x < -10 || p.x > W + 10 || p.y < -10 || p.y > H + 10) {
      p.x = Math.random() * W; p.y = Math.random() * H; p.px = p.x; p.py = p.y; p.age = 0; p.vx = 0; p.vy = 0
    }
    p.age++

    // Color selection
    const nv = (flowNoise(p.x * 0.003, p.y * 0.003) + 1.5) / 3
    let c: number[]
    if (orangeHot && adaptColors) {
      // Vortex: theme accent colors normally, shifts to orange in the vortex, back on burst
      const idx = ((Math.floor(nv * 4) % 4) + 4) % 4
      const burstGlowVal = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
      // Only show orange in the very tight center of the vortex
      const vortexBlend = dist < 0.04 ? Math.pow(1 - dist / 0.04, 0.8) : 0
      const heat = Math.max(0, Math.min(1, vortexBlend * 1.5 - burstGlowVal * 0.2))
      const base = adaptColors.base[idx]
      const hot = orangeHot[idx]
      c = [
        Math.round(base[0] + (hot[0] - base[0]) * heat),
        Math.round(base[1] + (hot[1] - base[1]) * heat),
        Math.round(base[2] + (hot[2] - base[2]) * heat),
      ]
    } else if (adaptColors) {
      // Adapt: theme accent colors, vortex intensifies, burst cools down
      const idx = ((Math.floor(nv * 4) % 4) + 4) % 4
      const burstGlowVal = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
      const vortexBlend = dist < 0.18 ? (1 - dist / 0.18) : 0
      const heat = Math.max(0, Math.min(1, vortexBlend - burstGlowVal * 0.15))
      const base = adaptColors.base[idx]
      const hot = adaptColors.hot[idx]
      c = [
        Math.round(base[0] + (hot[0] - base[0]) * heat),
        Math.round(base[1] + (hot[1] - base[1]) * heat),
        Math.round(base[2] + (hot[2] - base[2]) * heat),
      ]
    } else {
      // Default: original purple/blue/cyan/orange
      const idx = ((Math.floor(nv * defaultFlowColors.length) % defaultFlowColors.length) + defaultFlowColors.length) % defaultFlowColors.length
      c = defaultFlowColors[idx]
    }
    const fadeIn = Math.min(1, p.age / 40)
    const prox = dist < 0.18 ? 1 + (1 - dist / 0.18) * 0.5 : 1
    const burstGlow = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
    const alpha = Math.min(1, fadeIn * 0.3 * density * prox * (1 + burstGlow * 0.12))
    ctx.beginPath()
    ctx.moveTo(p.px, p.py)
    ctx.lineTo(p.x, p.y)
    ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${alpha})`
    ctx.lineWidth = Math.min(2.5, (0.8 + burstGlow * 0.06) * Math.min(density, 2))
    ctx.stroke()
  }
}

// ── Main loop ──
function startEffect() {
  cancelAnimationFrame(raf)
  raf = 0
  generation++
  const myGen = generation
  const mode = props.mode

  if (!canvasRef.value || mode === 'none') return
  ctx = canvasRef.value.getContext('2d')
  if (!ctx) return

  resize()

  if (mode === 'wave') {
    meshTime = 0
  } else {
    flowTime = 0
    initFlow()
    ctx.clearRect(0, 0, W, H)
  }

  isMobileDevice = window.innerWidth < 768

  function loop() {
    if (myGen !== generation || paused) {
      if (paused) raf = requestAnimationFrame(loop)
      return
    }
    // Frame throttling on mobile — draw every 2nd frame
    if (isMobileDevice) {
      frameCount++
      if (frameCount % 2 !== 0) {
        raf = requestAnimationFrame(loop)
        return
      }
      // Smoothly interpolate vortex center toward tap position
      mx += (targetMx - mx) * 0.08
      my += (targetMy - my) * 0.08
    }
    if (mode === 'wave') drawMesh()
    else drawFlow()
    raf = requestAnimationFrame(loop)
  }
  loop()
}

// ── Watchers ──
watch(() => props.mode, () => {
  setTimeout(startEffect, 20)
})

watch(() => props.particleDensity, () => {
  if (props.mode === 'particles') initFlow()
})

// ── Mouse/Touch ──
function onMM(e: MouseEvent) { mx = e.clientX / innerWidth; my = e.clientY / innerHeight }
function onMD() { pressing = true; burstStrength = 1 }
function onMU() { pressing = false }
function onTS(e: TouchEvent) {
  const t = e.touches[0]
  targetMx = t.clientX / innerWidth
  targetMy = t.clientY / innerHeight
  pressing = true
  burstStrength = 1
}
function onTM(e: TouchEvent) {
  const t = e.touches[0]
  targetMx = t.clientX / innerWidth
  targetMy = t.clientY / innerHeight
  pressing = true
}
function onTE() { pressing = false }

// ── Visibility ──
function onVisibility() {
  paused = document.hidden
}

onMounted(() => {
  // Reduced motion — skip animation entirely
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  addEventListener('mousemove', onMM)
  addEventListener('mousedown', onMD)
  addEventListener('mouseup', onMU)
  addEventListener('touchstart', onTS, { passive: true })
  addEventListener('touchmove', onTM, { passive: true })
  addEventListener('touchend', onTE)
  addEventListener('resize', resize)
  document.addEventListener('visibilitychange', onVisibility)
  if (props.mode !== 'none') {
    // Defer canvas animation to idle time so the hero can render first
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => startEffect(), { timeout: 2000 })
    } else {
      setTimeout(startEffect, 2000)
    }
  }
})

onUnmounted(() => {
  cancelAnimationFrame(raf)
  removeEventListener('mousemove', onMM)
  removeEventListener('mousedown', onMD)
  removeEventListener('mouseup', onMU)
  removeEventListener('touchstart', onTS)
  removeEventListener('touchmove', onTM)
  removeEventListener('touchend', onTE)
  removeEventListener('resize', resize)
  document.removeEventListener('visibilitychange', onVisibility)
})
</script>

<template>
  <div class="lp-bg-layer" :class="{ active: mode !== 'none' }" :style="mode !== 'none' ? { opacity: intensity ?? 0.7 } : undefined">
    <canvas ref="canvasRef" />
  </div>
</template>

<style scoped>
.lp-bg-layer {
  position: fixed;
  inset: 0;
  z-index: 0;
  opacity: 0;
  transition: opacity 0.5s ease;
}
.lp-bg-layer.active {
  opacity: 0.7; /* overridden by inline style when intensity prop is set */
}
.lp-bg-layer canvas {
  width: 100%;
  height: 100%;
  display: block;
}
</style>

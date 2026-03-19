<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface Props {
  markSize?: number
  showWordmark?: boolean
  speed?: 'slow' | 'normal' | 'fast'
}

const props = withDefaults(defineProps<Props>(), {
  markSize: 48,
  showWordmark: true,
  speed: 'normal',
})

const svgRef = ref<SVGSVGElement | null>(null)
const p7gRef = ref<SVGGElement | null>(null)

const SPEED_MAP = { slow: 0.0012, normal: 0.002, fast: 0.0035 } as const

// Ring distances from center pixel (p5) — normalized Euclidean
const RING: Record<string, number> = {
  p5: 0,
  p4: 0.41, p6: 0.41,
  p3: 0.70, p7: 0.70,
  p1: 0.81, p10: 0.81,
  p0: 1.00, p2: 1.00, p9: 1.00, p11: 1.00,
}

const SPREAD = 1.6
const OP_LO = 0.06
const SC_LO = 0.38
const MORPH_SPEED = 0.032
const ACCENT = '#3A9BC0'

const ALL_PX = ['p0', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p9', 'p10', 'p11'] as const

const markW = Math.round((props.markSize * 96) / 120)

onMounted(() => {
  const svg = svgRef.value
  const p7g = p7gRef.value
  if (!svg || !p7g) return

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const spd = SPEED_MAP[props.speed]

  const st = {
    t0: 0,
    isS: true,
    morphing: false,
    morphProgress: 0,
    p7slid: false,
    lastTroughSign: 1,
    rafId: 0,
  }

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t
  const px = (id: string) => svg.querySelector<SVGRectElement>(`#${id}`)

  function checkMorphTrigger(t: number) {
    if (st.morphing) return
    const sin = Math.sin(t * spd)
    if (st.lastTroughSign < 0 && sin >= 0) {
      st.morphing = true
      st.p7slid = false
    }
    st.lastTroughSign = Math.sign(sin) || 1
  }

  function maybeSlideP7(t: number) {
    if (st.p7slid) return
    if (st.morphProgress < 0.38 || st.morphProgress > 0.97) return
    const p7wave = (Math.sin(t * spd - RING.p7 * SPREAD) + 1) / 2
    if (p7wave > 0.22) return

    st.p7slid = true
    const targetX = st.isS ? -44 : 0
    p7g.style.transition = 'transform 700ms cubic-bezier(.22, 1.4, .36, 1)'
    p7g.style.transform = `translateX(${targetX}px)`
  }

  function frame(ts: number) {
    if (!st.t0) st.t0 = ts
    const t = ts - st.t0

    checkMorphTrigger(t)
    if (st.morphing) {
      const target = st.isS ? 1 : 0
      st.morphProgress += (target - st.morphProgress) * MORPH_SPEED
      if (Math.abs(st.morphProgress - target) < 0.008) {
        st.morphProgress = target
        st.morphing = false
        st.isS = !st.isS
      }
      maybeSlideP7(t)
    }

    ALL_PX.forEach((id) => {
      const el = px(id)
      if (!el) return

      const dist = RING[id] ?? 1
      const wv = (Math.sin(t * spd - dist * SPREAD) + 1) / 2

      let opCeil = 1.0
      if (id === 'p5' || id === 'p6') {
        opCeil = lerp(1, 0, st.morphProgress)
        if (opCeil < 0.015) {
          el.style.opacity = '0'
          el.style.transform = 'scale(0.08)'
          return
        }
      }

      el.style.transition = 'none'
      el.style.opacity = lerp(OP_LO, opCeil, wv).toFixed(3)
      el.style.transform = `scale(${lerp(SC_LO, 1, wv).toFixed(3)})`
    })

    st.rafId = requestAnimationFrame(frame)
  }

  st.rafId = requestAnimationFrame(frame)

  onUnmounted(() => cancelAnimationFrame(st.rafId))
})
</script>

<template>
  <div class="sc-logo">
    <svg
      ref="svgRef"
      viewBox="0 0 96 120"
      :width="markW"
      :height="markSize"
      aria-label="SocialChef mark"
      class="sc-mark"
    >
      <rect id="p0" x="18" y="8" width="16" height="16" rx="3.5" :fill="ACCENT" class="sc-px" />
      <rect id="p1" x="40" y="8" width="16" height="16" rx="3.5" :fill="ACCENT" class="sc-px" />
      <rect id="p2" x="62" y="8" width="16" height="16" rx="3.5" :fill="ACCENT" class="sc-px" />
      <rect id="p3" x="18" y="30" width="16" height="16" rx="3.5" :fill="ACCENT" class="sc-px" />
      <rect id="p4" x="18" y="52" width="16" height="16" rx="3.5" :fill="ACCENT" class="sc-px" />
      <rect id="p5" x="40" y="52" width="16" height="16" rx="3.5" :fill="ACCENT" class="sc-px" />
      <rect id="p6" x="62" y="52" width="16" height="16" rx="3.5" :fill="ACCENT" class="sc-px" />
      <g id="p7g" ref="p7gRef" class="sc-p7g">
        <rect id="p7" x="62" y="74" width="16" height="16" rx="3.5" :fill="ACCENT" class="sc-px" />
      </g>
      <rect id="p9" x="18" y="96" width="16" height="16" rx="3.5" :fill="ACCENT" class="sc-px" />
      <rect id="p10" x="40" y="96" width="16" height="16" rx="3.5" :fill="ACCENT" class="sc-px" />
      <rect id="p11" x="62" y="96" width="16" height="16" rx="3.5" :fill="ACCENT" class="sc-px" />
    </svg>

    <span v-if="showWordmark" class="sc-wordmark">
      <span class="sc-word-social">social</span><span class="sc-word-chef">chef</span>
    </span>
  </div>
</template>

<style scoped>
.sc-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  user-select: none;
}

.sc-mark {
  overflow: visible;
  flex-shrink: 0;
}

.sc-px {
  transform-box: fill-box;
  transform-origin: center;
}

.sc-p7g {
  transform: translateX(0px);
  will-change: transform;
}

.sc-wordmark {
  font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
  font-weight: 700;
  font-size: 1.125rem;
  letter-spacing: -0.02em;
  line-height: 1;
  white-space: nowrap;
}

.sc-word-social {
  color: #3A9BC0;
}

.sc-word-chef {
  color: #D4EAF5;
}

@media (prefers-reduced-motion: reduce) {
  .sc-px {
    opacity: 1 !important;
    transform: none !important;
  }
  .sc-p7g {
    transition: none !important;
  }
}
</style>

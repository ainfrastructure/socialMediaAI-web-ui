<script setup lang="ts">
import { computed, ref, onMounted, watch, nextTick } from 'vue'

interface Props {
  data: number[]
  color?: string
  fillColor?: string
  width?: number
  height?: number
}

const props = withDefaults(defineProps<Props>(), {
  color: 'var(--gold-primary)',
  fillColor: 'rgba(15, 61, 46, 0.1)',
  width: 80,
  height: 32,
})

const canvas = ref<HTMLCanvasElement | null>(null)

const normalizedData = computed(() => {
  if (!props.data.length) return []
  const max = Math.max(...props.data, 1)
  return props.data.map(v => v / max)
})

function draw() {
  const ctx = canvas.value?.getContext('2d')
  if (!ctx || normalizedData.value.length < 2) return

  const w = props.width * 2 // retina
  const h = props.height * 2
  canvas.value!.width = w
  canvas.value!.height = h

  const points = normalizedData.value
  const padding = 2
  const stepX = (w - padding * 2) / (points.length - 1)

  ctx.clearRect(0, 0, w, h)

  // Resolve CSS variable color
  const resolvedColor = getComputedStyle(canvas.value!).getPropertyValue('--sparkline-color').trim() || '#0f3d2e'
  const resolvedFill = getComputedStyle(canvas.value!).getPropertyValue('--sparkline-fill').trim() || 'rgba(15, 61, 46, 0.1)'

  // Draw fill
  ctx.beginPath()
  ctx.moveTo(padding, h - padding - points[0] * (h - padding * 2))
  for (let i = 1; i < points.length; i++) {
    const x = padding + i * stepX
    const y = h - padding - points[i] * (h - padding * 2)
    const prevX = padding + (i - 1) * stepX
    const prevY = h - padding - points[i - 1] * (h - padding * 2)
    const cpx = (prevX + x) / 2
    ctx.bezierCurveTo(cpx, prevY, cpx, y, x, y)
  }
  ctx.lineTo(w - padding, h - padding)
  ctx.lineTo(padding, h - padding)
  ctx.closePath()
  ctx.fillStyle = resolvedFill
  ctx.fill()

  // Draw line
  ctx.beginPath()
  ctx.moveTo(padding, h - padding - points[0] * (h - padding * 2))
  for (let i = 1; i < points.length; i++) {
    const x = padding + i * stepX
    const y = h - padding - points[i] * (h - padding * 2)
    const prevX = padding + (i - 1) * stepX
    const prevY = h - padding - points[i - 1] * (h - padding * 2)
    const cpx = (prevX + x) / 2
    ctx.bezierCurveTo(cpx, prevY, cpx, y, x, y)
  }
  ctx.strokeStyle = resolvedColor
  ctx.lineWidth = 2
  ctx.stroke()
}

onMounted(() => nextTick(draw))
watch(() => props.data, () => nextTick(draw), { deep: true })
</script>

<template>
  <canvas
    ref="canvas"
    class="analytics-sparkline"
    :style="{
      width: `${width}px`,
      height: `${height}px`,
      '--sparkline-color': color,
      '--sparkline-fill': fillColor,
    }"
  />
</template>

<style scoped>
.analytics-sparkline {
  display: block;
  flex-shrink: 0;
}

@media (prefers-reduced-motion: reduce) {
  .analytics-sparkline {
    opacity: 0.8;
  }
}
</style>

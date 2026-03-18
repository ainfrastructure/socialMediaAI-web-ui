<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { gsap } from '@/composables/useGsapSection'

const cursorRef = ref<HTMLElement | null>(null)
const rippleRef = ref<HTMLElement | null>(null)
const isVisible = ref(false)

const prefersReducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

let currentTween: gsap.core.Tween | null = null

function show() {
  isVisible.value = true
}

function hide() {
  isVisible.value = false
}

function moveTo(x: number, y: number, duration = 0.8): gsap.core.Tween | null {
  if (!cursorRef.value) return null
  show()
  if (prefersReducedMotion) {
    gsap.set(cursorRef.value, { x, y })
    return null
  }
  if (currentTween) currentTween.kill()
  currentTween = gsap.to(cursorRef.value, {
    x,
    y,
    duration,
    ease: 'power2.inOut',
  })
  return currentTween
}

function moveToElement(
  target: HTMLElement | null,
  container: HTMLElement | null,
  duration = 0.8,
): gsap.core.Tween | null {
  if (!target || !container) return null
  const containerRect = container.getBoundingClientRect()
  const targetRect = target.getBoundingClientRect()
  const x = targetRect.left - containerRect.left + targetRect.width / 2
  const y = targetRect.top - containerRect.top + targetRect.height / 2
  return moveTo(x, y, duration)
}

function click() {
  if (!rippleRef.value) return
  gsap.fromTo(
    rippleRef.value,
    { scale: 0, opacity: 0.6 },
    { scale: 1.4, opacity: 0, duration: 0.5, ease: 'power2.out' },
  )
}

onUnmounted(() => {
  if (currentTween) currentTween.kill()
})

defineExpose({ show, hide, moveTo, moveToElement, click, cursorRef })
</script>

<template>
  <div
    ref="cursorRef"
    class="demo-cursor"
    :class="{ visible: isVisible }"
  >
    <div class="demo-cursor-dot" />
    <div ref="rippleRef" class="demo-cursor-ripple" />
  </div>
</template>

<style scoped>
.demo-cursor {
  position: absolute;
  width: 0;
  height: 0;
  z-index: 50;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.demo-cursor.visible {
  opacity: 1;
}

.demo-cursor-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--lp-accent-orange);
  box-shadow: 0 0 8px var(--lp-accent-orange-glow, rgba(255, 140, 50, 0.4));
  transform: translate(-50%, -50%);
}

.demo-cursor-ripple {
  position: absolute;
  top: 0;
  left: 0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid var(--lp-accent-orange);
  transform: translate(-50%, -50%) scale(0);
  opacity: 0;
  pointer-events: none;
}

@media (prefers-reduced-motion: reduce) {
  .demo-cursor {
    display: none;
  }
}
</style>

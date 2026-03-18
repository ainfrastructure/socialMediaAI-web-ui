import { onMounted, onUnmounted, type Ref } from 'vue'

export function useCursorGlow(containerRef: Ref<HTMLElement | null>) {
  let rafId: number | null = null

  function handleMouseMove(e: MouseEvent) {
    if (!containerRef.value) return
    if (rafId) return

    rafId = requestAnimationFrame(() => {
      rafId = null
      if (!containerRef.value) return
      containerRef.value.style.setProperty('--cursor-x', `${e.clientX}px`)
      containerRef.value.style.setProperty('--cursor-y', `${e.clientY}px`)
    })
  }

  onMounted(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
  })

  onUnmounted(() => {
    window.removeEventListener('mousemove', handleMouseMove)
    if (rafId) cancelAnimationFrame(rafId)
  })
}

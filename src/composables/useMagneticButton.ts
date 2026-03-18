import { onMounted, onUnmounted, type Ref } from 'vue'

export function useMagneticButton(buttonRef: Ref<HTMLElement | null>, strength = 0.3) {
  let rafId: number | null = null

  function handleMouseMove(e: MouseEvent) {
    if (!buttonRef.value) return
    if (rafId) return

    rafId = requestAnimationFrame(() => {
      rafId = null
      if (!buttonRef.value) return

      const rect = buttonRef.value.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      const distX = e.clientX - centerX
      const distY = e.clientY - centerY
      const distance = Math.sqrt(distX * distX + distY * distY)
      const maxDist = 150

      if (distance < maxDist) {
        const pull = (1 - distance / maxDist) * strength
        buttonRef.value.style.transform = `translate(${distX * pull}px, ${distY * pull}px)`
      } else {
        buttonRef.value.style.transform = ''
      }
    })
  }

  function handleMouseLeave() {
    if (buttonRef.value) {
      buttonRef.value.style.transform = ''
    }
  }

  onMounted(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    const hoverQuery = window.matchMedia('(hover: hover)')
    if (!hoverQuery.matches) return

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    buttonRef.value?.addEventListener('mouseleave', handleMouseLeave)
  })

  onUnmounted(() => {
    window.removeEventListener('mousemove', handleMouseMove)
    buttonRef.value?.removeEventListener('mouseleave', handleMouseLeave)
    if (rafId) cancelAnimationFrame(rafId)
  })
}

import { onMounted, onUnmounted, type Ref } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function useGsapSection(
  sectionRef: Ref<HTMLElement | null>,
  setup: (el: HTMLElement, gsapInstance: typeof gsap) => void
) {
  const triggers: ScrollTrigger[] = []

  onMounted(() => {
    if (!sectionRef.value) return

    // Reduced motion: make everything visible, skip animations
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const el = sectionRef.value
      el.querySelectorAll('[style*="visibility: hidden"], [style*="opacity: 0"]').forEach((child) => {
        ;(child as HTMLElement).style.visibility = 'visible'
        ;(child as HTMLElement).style.opacity = '1'
      })
      el.setAttribute('data-gsap', 'reduced-motion')
      return
    }

    setup(sectionRef.value, gsap)
    sectionRef.value.setAttribute('data-gsap', 'initialized')

    ScrollTrigger.getAll().forEach((st) => {
      if (sectionRef.value?.contains(st.trigger as Element)) {
        triggers.push(st)
      }
    })

    // Recalculate trigger positions after layout settles (fixes HMR / late-mount)
    requestAnimationFrame(() => ScrollTrigger.refresh())
  })

  onUnmounted(() => {
    triggers.forEach((st) => st.kill())
  })
}

export { gsap, ScrollTrigger }

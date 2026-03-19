import { onMounted, onUnmounted, type Ref } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

let refreshTimer: ReturnType<typeof setTimeout> | null = null
let loadRefreshScheduled = false

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

    // Kill stale ScrollTrigger instances (HMR / re-mount safety)
    ScrollTrigger.getAll().forEach((st) => {
      if (
        st.trigger === sectionRef.value ||
        sectionRef.value!.contains(st.trigger as Element)
      ) {
        st.kill()
      }
    })

    setup(sectionRef.value, gsap)
    sectionRef.value.setAttribute('data-gsap', 'initialized')

    ScrollTrigger.getAll().forEach((st) => {
      if (sectionRef.value?.contains(st.trigger as Element)) {
        triggers.push(st)
      }
    })

    // Debounced refresh: only runs once after all sections have mounted,
    // preventing multiple refresh() calls that cause scroll jumps on mobile
    if (refreshTimer) clearTimeout(refreshTimer)
    refreshTimer = setTimeout(() => {
      ScrollTrigger.refresh()
      refreshTimer = null
    }, 100)

    // One-time: if page resources haven't loaded yet, schedule a single
    // post-load refresh to fix pin calculations after layout stabilizes
    if (!loadRefreshScheduled && document.readyState !== 'complete') {
      loadRefreshScheduled = true
      window.addEventListener('load', () => {
        // Double-rAF ensures refresh happens after the browser has painted final layout
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            ScrollTrigger.refresh()
          })
        })
      }, { once: true })
    }
  })

  onUnmounted(() => {
    triggers.forEach((st) => st.kill())
  })
}

export { gsap, ScrollTrigger }

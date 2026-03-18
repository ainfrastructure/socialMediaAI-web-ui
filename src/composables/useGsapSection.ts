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

    setup(sectionRef.value, gsap)
    sectionRef.value.setAttribute('data-gsap', 'initialized')

    ScrollTrigger.getAll().forEach((st) => {
      if (sectionRef.value?.contains(st.trigger as Element)) {
        triggers.push(st)
      }
    })
  })

  onUnmounted(() => {
    triggers.forEach((st) => st.kill())
  })
}

export { gsap, ScrollTrigger }

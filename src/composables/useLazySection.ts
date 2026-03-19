import { ref, onUnmounted, type Ref } from 'vue'

export function useLazySection(
  sentinelRef: Ref<HTMLElement | null>,
  rootMargin = '200px 0px'
) {
  const isVisible = ref(false)
  let observer: IntersectionObserver | null = null

  function start() {
    if (!sentinelRef.value || isVisible.value) return

    observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          isVisible.value = true
          observer?.disconnect()
          observer = null
        }
      },
      { rootMargin }
    )

    observer.observe(sentinelRef.value)
  }

  onUnmounted(() => {
    observer?.disconnect()
    observer = null
  })

  return { isVisible, start }
}

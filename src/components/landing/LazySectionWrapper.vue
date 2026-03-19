<script setup lang="ts">
import { ref, watch, nextTick, onMounted } from 'vue'
import { useLazySection } from '@/composables/useLazySection'

const props = withDefaults(defineProps<{
  minHeight?: string
  rootMargin?: string
  id?: string
}>(), {
  minHeight: '200px',
  rootMargin: '200px 0px',
})

const sentinelRef = ref<HTMLElement | null>(null)
const { isVisible, start } = useLazySection(sentinelRef, props.rootMargin)

onMounted(() => {
  start()
})

watch(isVisible, (visible) => {
  if (!visible) return
  nextTick(() => {
    requestAnimationFrame(() => {
      // Refresh ScrollTrigger after lazy content mounts so pin calculations stay correct
      import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
        ScrollTrigger.refresh()
      })
    })
  })
})
</script>

<template>
  <div
    ref="sentinelRef"
    :id="id"
    :style="!isVisible ? { minHeight: props.minHeight } : undefined"
  >
    <slot v-if="isVisible" />
  </div>
</template>

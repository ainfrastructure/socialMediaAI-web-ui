<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const progress = ref(0)

function updateProgress() {
  const scrollTop = window.scrollY
  const docHeight = document.documentElement.scrollHeight - window.innerHeight
  progress.value = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0
}

onMounted(() => {
  window.addEventListener('scroll', updateProgress, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', updateProgress)
})
</script>

<template>
  <div class="lp-scroll-progress" :style="{ width: `${progress}%` }" />
</template>

<style scoped>
.lp-scroll-progress {
  position: fixed;
  top: 0;
  left: 0;
  height: 2px;
  background: var(--lp-accent-orange);
  z-index: calc(var(--z-fixed) + 1);
  transition: width 0.05s linear;
  pointer-events: none;
}

@media (prefers-reduced-motion: reduce) {
  .lp-scroll-progress {
    transition: none;
  }
}
</style>

<script setup lang="ts">
interface Props {
  size?: number | string
}

const props = withDefaults(defineProps<Props>(), {
  size: 24
})

const sizeValue = typeof props.size === 'number' ? `${props.size}px` : props.size
</script>

<template>
  <svg :width="sizeValue" :height="sizeValue" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="goldGrad-grid" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#C9B896"/>
        <stop offset="50%" style="stop-color:#A89968"/>
        <stop offset="100%" style="stop-color:#8B7D4A"/>
      </linearGradient>
    </defs>
    <!-- 3x3 Grid -->
    <rect x="3" y="3" width="18" height="18" rx="2" stroke="url(#goldGrad-grid)" stroke-width="2" fill="none"/>
    <!-- Vertical lines -->
    <path d="M9 3V21" stroke="url(#goldGrad-grid)" stroke-width="2"/>
    <path d="M15 3V21" stroke="url(#goldGrad-grid)" stroke-width="2"/>
    <!-- Horizontal lines -->
    <path d="M3 9H21" stroke="url(#goldGrad-grid)" stroke-width="2"/>
    <path d="M3 15H21" stroke="url(#goldGrad-grid)" stroke-width="2"/>
  </svg>
</template>

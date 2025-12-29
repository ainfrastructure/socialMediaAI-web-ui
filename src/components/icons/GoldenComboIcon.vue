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
      <linearGradient id="goldGrad-combo" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#C9B896"/>
        <stop offset="50%" style="stop-color:#A89968"/>
        <stop offset="100%" style="stop-color:#8B7D4A"/>
      </linearGradient>
    </defs>
    <!-- Two overlapping dishes -->
    <circle cx="9" cy="10" r="6" fill="url(#goldGrad-combo)" opacity="0.7"/>
    <circle cx="15" cy="14" r="6" fill="url(#goldGrad-combo)"/>
    <circle cx="9" cy="10" r="3" fill="rgba(10, 10, 10, 0.3)"/>
    <circle cx="15" cy="14" r="3" fill="rgba(10, 10, 10, 0.3)"/>
  </svg>
</template>

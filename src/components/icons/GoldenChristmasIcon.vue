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
      <linearGradient id="goldGrad-christmas" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#C9B896"/>
        <stop offset="50%" style="stop-color:#A89968"/>
        <stop offset="100%" style="stop-color:#8B7D4A"/>
      </linearGradient>
    </defs>
    <!-- Christmas tree -->
    <path d="M12 2L8 8H10L7 13H9L6 19H18L15 13H17L14 8H16L12 2Z" stroke="url(#goldGrad-christmas)" stroke-width="2" fill="none" stroke-linejoin="round"/>
    <!-- Tree trunk -->
    <rect x="10" y="19" width="4" height="3" stroke="url(#goldGrad-christmas)" stroke-width="2" fill="none"/>
    <!-- Star on top -->
    <circle cx="12" cy="3" r="1" fill="url(#goldGrad-christmas)"/>
  </svg>
</template>

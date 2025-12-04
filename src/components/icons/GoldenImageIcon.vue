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
      <linearGradient id="goldGrad-image" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#E5C775"/>
        <stop offset="50%" style="stop-color:#D4AF37"/>
        <stop offset="100%" style="stop-color:#B8943D"/>
      </linearGradient>
    </defs>
    <!-- Image frame -->
    <rect x="3" y="4" width="18" height="16" rx="2" stroke="url(#goldGrad-image)" stroke-width="2" fill="none"/>
    <!-- Mountain/landscape -->
    <path d="M3 16L8 11L11 14L16 8L21 14" stroke="url(#goldGrad-image)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <!-- Sun -->
    <circle cx="17" cy="8" r="2" fill="url(#goldGrad-image)"/>
  </svg>
</template>

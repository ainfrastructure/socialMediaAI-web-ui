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
      <linearGradient id="goldGrad-easter" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#E5C775"/>
        <stop offset="50%" style="stop-color:#D4AF37"/>
        <stop offset="100%" style="stop-color:#B8943D"/>
      </linearGradient>
    </defs>
    <!-- Easter egg -->
    <ellipse cx="12" cy="13" rx="6" ry="8" stroke="url(#goldGrad-easter)" stroke-width="2" fill="none"/>
    <!-- Decorative stripes -->
    <path d="M7 10C8 9.5 10 9.5 12 9.5C14 9.5 16 9.5 17 10" stroke="url(#goldGrad-easter)" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M7 16C8 15.5 10 15.5 12 15.5C14 15.5 16 15.5 17 16" stroke="url(#goldGrad-easter)" stroke-width="1.5" stroke-linecap="round"/>
    <!-- Zigzag pattern -->
    <path d="M9 13L10.5 11.5L12 13L13.5 11.5L15 13" stroke="url(#goldGrad-easter)" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
</template>

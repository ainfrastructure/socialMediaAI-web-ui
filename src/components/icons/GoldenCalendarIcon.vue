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
      <linearGradient id="goldGrad-calendar" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#C9B896"/>
        <stop offset="50%" style="stop-color:#A89968"/>
        <stop offset="100%" style="stop-color:#8B7D4A"/>
      </linearGradient>
    </defs>
    <rect x="3" y="4" width="18" height="18" rx="2" stroke="url(#goldGrad-calendar)" stroke-width="2" fill="none"/>
    <path d="M3 10H21" stroke="url(#goldGrad-calendar)" stroke-width="2"/>
    <path d="M7 2V6" stroke="url(#goldGrad-calendar)" stroke-width="2" stroke-linecap="round"/>
    <path d="M17 2V6" stroke="url(#goldGrad-calendar)" stroke-width="2" stroke-linecap="round"/>
    <!-- Week dots -->
    <circle cx="7" cy="14" r="1" fill="url(#goldGrad-calendar)"/>
    <circle cx="12" cy="14" r="1" fill="url(#goldGrad-calendar)"/>
    <circle cx="17" cy="14" r="1" fill="url(#goldGrad-calendar)"/>
    <circle cx="7" cy="18" r="1" fill="url(#goldGrad-calendar)"/>
    <circle cx="12" cy="18" r="1" fill="url(#goldGrad-calendar)"/>
    <circle cx="17" cy="18" r="1" fill="url(#goldGrad-calendar)"/>
  </svg>
</template>

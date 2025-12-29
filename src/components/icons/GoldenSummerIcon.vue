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
      <linearGradient id="goldGrad-summer" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#C9B896"/>
        <stop offset="50%" style="stop-color:#A89968"/>
        <stop offset="100%" style="stop-color:#8B7D4A"/>
      </linearGradient>
    </defs>
    <!-- Sun center -->
    <circle cx="12" cy="12" r="4" stroke="url(#goldGrad-summer)" stroke-width="2" fill="none"/>
    <!-- Sun rays -->
    <path d="M12 2V6" stroke="url(#goldGrad-summer)" stroke-width="2" stroke-linecap="round"/>
    <path d="M12 18V22" stroke="url(#goldGrad-summer)" stroke-width="2" stroke-linecap="round"/>
    <path d="M2 12H6" stroke="url(#goldGrad-summer)" stroke-width="2" stroke-linecap="round"/>
    <path d="M18 12H22" stroke="url(#goldGrad-summer)" stroke-width="2" stroke-linecap="round"/>
    <path d="M4.93 4.93L7.76 7.76" stroke="url(#goldGrad-summer)" stroke-width="2" stroke-linecap="round"/>
    <path d="M16.24 16.24L19.07 19.07" stroke="url(#goldGrad-summer)" stroke-width="2" stroke-linecap="round"/>
    <path d="M4.93 19.07L7.76 16.24" stroke="url(#goldGrad-summer)" stroke-width="2" stroke-linecap="round"/>
    <path d="M16.24 7.76L19.07 4.93" stroke="url(#goldGrad-summer)" stroke-width="2" stroke-linecap="round"/>
  </svg>
</template>

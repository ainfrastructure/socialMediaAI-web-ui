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
      <linearGradient id="goldGrad-restaurant" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#E5C775"/>
        <stop offset="50%" style="stop-color:#D4AF37"/>
        <stop offset="100%" style="stop-color:#B8943D"/>
      </linearGradient>
    </defs>
    <!-- Plate/Dome -->
    <circle cx="12" cy="12" r="8" fill="url(#goldGrad-restaurant)" opacity="0.2"/>
    <path d="M4 12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12" stroke="url(#goldGrad-restaurant)" stroke-width="2" stroke-linecap="round"/>
    <!-- Chef Hat Top -->
    <path d="M8 9C8 6.79086 9.79086 5 12 5C14.2091 5 16 6.79086 16 9L15 12H9L8 9Z" fill="url(#goldGrad-restaurant)"/>
    <!-- Plate Base -->
    <ellipse cx="12" cy="18" rx="7" ry="2" fill="url(#goldGrad-restaurant)" opacity="0.6"/>
    <!-- Accent Line -->
    <path d="M6 18H18" stroke="url(#goldGrad-restaurant)" stroke-width="2.5" stroke-linecap="round"/>
  </svg>
</template>

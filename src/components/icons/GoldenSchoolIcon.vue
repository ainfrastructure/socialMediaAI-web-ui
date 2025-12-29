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
      <linearGradient id="goldGrad-school" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#C9B896"/>
        <stop offset="50%" style="stop-color:#A89968"/>
        <stop offset="100%" style="stop-color:#8B7D4A"/>
      </linearGradient>
    </defs>
    <!-- Graduation cap -->
    <path d="M2 10L12 5L22 10L12 15L2 10Z" stroke="url(#goldGrad-school)" stroke-width="2" fill="none" stroke-linejoin="round"/>
    <path d="M6 12V16C6 16 8 18 12 18C16 18 18 16 18 16V12" stroke="url(#goldGrad-school)" stroke-width="2" stroke-linecap="round"/>
    <path d="M12 15V19" stroke="url(#goldGrad-school)" stroke-width="2" stroke-linecap="round"/>
    <!-- Tassel -->
    <circle cx="12" cy="20" r="1.5" fill="url(#goldGrad-school)"/>
  </svg>
</template>

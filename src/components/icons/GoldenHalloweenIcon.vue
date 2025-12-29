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
      <linearGradient id="goldGrad-halloween" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#C9B896"/>
        <stop offset="50%" style="stop-color:#A89968"/>
        <stop offset="100%" style="stop-color:#8B7D4A"/>
      </linearGradient>
    </defs>
    <!-- Pumpkin body -->
    <ellipse cx="12" cy="14" rx="7" ry="6" stroke="url(#goldGrad-halloween)" stroke-width="2" fill="none"/>
    <!-- Stem -->
    <path d="M12 8V6C12 6 11 5 11 4C11 3 12 3 12 3C12 3 13 3 13 4C13 5 12 6 12 6V8" stroke="url(#goldGrad-halloween)" stroke-width="2" stroke-linecap="round" fill="none"/>
    <!-- Eyes -->
    <path d="M9 12L10 14L9 14L8 12L9 12Z" stroke="url(#goldGrad-halloween)" stroke-width="1.5" fill="url(#goldGrad-halloween)"/>
    <path d="M15 12L16 14L15 14L14 12L15 12Z" stroke="url(#goldGrad-halloween)" stroke-width="1.5" fill="url(#goldGrad-halloween)"/>
    <!-- Smile -->
    <path d="M8 16C9 17.5 10.5 18 12 18C13.5 18 15 17.5 16 16" stroke="url(#goldGrad-halloween)" stroke-width="1.5" stroke-linecap="round"/>
  </svg>
</template>

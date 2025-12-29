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
      <linearGradient id="goldGrad-thanksgiving" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#C9B896"/>
        <stop offset="50%" style="stop-color:#A89968"/>
        <stop offset="100%" style="stop-color:#8B7D4A"/>
      </linearGradient>
    </defs>
    <!-- Plate -->
    <ellipse cx="12" cy="16" rx="9" ry="2" stroke="url(#goldGrad-thanksgiving)" stroke-width="2" fill="none"/>
    <!-- Turkey/Roasted dish -->
    <ellipse cx="12" cy="12" rx="5" ry="3.5" stroke="url(#goldGrad-thanksgiving)" stroke-width="2" fill="none"/>
    <!-- Steam lines -->
    <path d="M9 8C9 7 9 6 9 5" stroke="url(#goldGrad-thanksgiving)" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M12 7C12 6 12 5 12 4" stroke="url(#goldGrad-thanksgiving)" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M15 8C15 7 15 6 15 5" stroke="url(#goldGrad-thanksgiving)" stroke-width="1.5" stroke-linecap="round"/>
  </svg>
</template>

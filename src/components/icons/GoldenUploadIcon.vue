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
      <linearGradient id="goldGrad-upload" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#C9B896"/>
        <stop offset="50%" style="stop-color:#A89968"/>
        <stop offset="100%" style="stop-color:#8B7D4A"/>
      </linearGradient>
    </defs>
    <path d="M12 15V3" stroke="url(#goldGrad-upload)" stroke-width="2" stroke-linecap="round"/>
    <path d="M8 7L12 3L16 7" stroke="url(#goldGrad-upload)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M3 15V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V15" stroke="url(#goldGrad-upload)" stroke-width="2" stroke-linecap="round"/>
  </svg>
</template>

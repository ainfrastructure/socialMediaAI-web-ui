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
      <linearGradient id="goldGrad-edit" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#C9B896"/>
        <stop offset="50%" style="stop-color:#A89968"/>
        <stop offset="100%" style="stop-color:#8B7D4A"/>
      </linearGradient>
    </defs>
    <!-- Pencil -->
    <path d="M4 20L8 20L20 8C21 7 21 5.5 20 4.5C19 3.5 17.5 3.5 16.5 4.5L4 16L4 20Z" stroke="url(#goldGrad-edit)" stroke-width="2" fill="none" stroke-linejoin="round"/>
    <path d="M15 6L18 9" stroke="url(#goldGrad-edit)" stroke-width="2" stroke-linecap="round"/>
    <path d="M4 16L8 20" stroke="url(#goldGrad-edit)" stroke-width="2" stroke-linecap="round"/>
  </svg>
</template>

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
      <linearGradient id="goldGrad-heart" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#C9B896"/>
        <stop offset="50%" style="stop-color:#A89968"/>
        <stop offset="100%" style="stop-color:#8B7D4A"/>
      </linearGradient>
    </defs>
    <!-- Heart shape -->
    <path d="M12 21C12 21 3 15 3 9C3 6.5 4.5 5 7 5C8.5 5 10 6 11 7C11 7 11.5 7.5 12 7.5C12.5 7.5 13 7 13 7C14 6 15.5 5 17 5C19.5 5 21 6.5 21 9C21 15 12 21 12 21Z" stroke="url(#goldGrad-heart)" stroke-width="2" fill="none" stroke-linejoin="round"/>
  </svg>
</template>

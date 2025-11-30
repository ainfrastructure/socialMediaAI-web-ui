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
    <!-- Fork -->
    <path d="M8.5 2V11C8.5 11.5523 8.05228 12 7.5 12C6.94772 12 6.5 11.5523 6.5 11V2" stroke="url(#goldGrad-restaurant)" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M7.5 12V22" stroke="url(#goldGrad-restaurant)" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M4.5 2V8" stroke="url(#goldGrad-restaurant)" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M10.5 2V8" stroke="url(#goldGrad-restaurant)" stroke-width="1.5" stroke-linecap="round"/>
    <!-- Knife -->
    <path d="M16.5 2V9C16.5 10.1046 17.3954 11 18.5 11C19.6046 11 20.5 10.1046 20.5 9V2" stroke="url(#goldGrad-restaurant)" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M18.5 11V22" stroke="url(#goldGrad-restaurant)" stroke-width="1.5" stroke-linecap="round"/>
  </svg>
</template>

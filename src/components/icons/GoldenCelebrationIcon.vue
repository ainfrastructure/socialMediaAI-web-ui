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
      <linearGradient id="goldGrad-celebration" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#E5C775"/>
        <stop offset="50%" style="stop-color:#D4AF37"/>
        <stop offset="100%" style="stop-color:#B8943D"/>
      </linearGradient>
    </defs>
    <!-- Fireworks bursts -->
    <path d="M12 5V2M12 5L14 3M12 5L10 3" stroke="url(#goldGrad-celebration)" stroke-width="2" stroke-linecap="round"/>
    <path d="M19 9L22 8M19 9L21 11M19 9L17 11" stroke="url(#goldGrad-celebration)" stroke-width="2" stroke-linecap="round"/>
    <path d="M5 9L2 8M5 9L3 11M5 9L7 11" stroke="url(#goldGrad-celebration)" stroke-width="2" stroke-linecap="round"/>
    <path d="M12 18V22M12 18L10 20M12 18L14 20" stroke="url(#goldGrad-celebration)" stroke-width="2" stroke-linecap="round"/>
    <path d="M19 14L22 15M19 14L21 12M19 14L17 12" stroke="url(#goldGrad-celebration)" stroke-width="2" stroke-linecap="round"/>
    <path d="M5 14L2 15M5 14L3 12M5 14L7 12" stroke="url(#goldGrad-celebration)" stroke-width="2" stroke-linecap="round"/>
    <!-- Center star -->
    <circle cx="12" cy="12" r="2" fill="url(#goldGrad-celebration)"/>
  </svg>
</template>

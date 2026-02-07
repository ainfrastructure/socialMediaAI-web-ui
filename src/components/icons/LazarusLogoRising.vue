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
  <svg :width="sizeValue" :height="sizeValue" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="lazarus-rising-grad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:#0f3d2e" />
        <stop offset="100%" style="stop-color:#1a5a45" />
      </linearGradient>
    </defs>
    <!-- Stylized "L" with ascending lines (rising/resurrection theme) -->
    <!-- Base "L" shape -->
    <path d="M16 8L16 48L44 48" stroke="url(#lazarus-rising-grad)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none" />
    <!-- Rising lines ascending from the L -->
    <line x1="28" y1="40" x2="28" y2="26" stroke="url(#lazarus-rising-grad)" stroke-width="3" stroke-linecap="round" opacity="0.9" />
    <line x1="36" y1="40" x2="36" y2="18" stroke="url(#lazarus-rising-grad)" stroke-width="3" stroke-linecap="round" opacity="0.75" />
    <line x1="44" y1="40" x2="44" y2="12" stroke="url(#lazarus-rising-grad)" stroke-width="3" stroke-linecap="round" opacity="0.6" />
    <!-- Spark at top -->
    <circle cx="44" cy="10" r="2.5" fill="url(#lazarus-rising-grad)" opacity="0.8" />
    <line x1="44" y1="5" x2="44" y2="7" stroke="url(#lazarus-rising-grad)" stroke-width="1.5" stroke-linecap="round" opacity="0.5" />
    <line x1="48" y1="10" x2="50" y2="10" stroke="url(#lazarus-rising-grad)" stroke-width="1.5" stroke-linecap="round" opacity="0.5" />
    <line x1="47" y1="7" x2="48.5" y2="5.5" stroke="url(#lazarus-rising-grad)" stroke-width="1.5" stroke-linecap="round" opacity="0.5" />
  </svg>
</template>

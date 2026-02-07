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
      <linearGradient id="lazarus-abstract-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#0f3d2e" />
        <stop offset="100%" style="stop-color:#1a5a45" />
      </linearGradient>
    </defs>
    <!-- Minimal abstract face/profile + L letterform -->
    <!-- "L" letterform integrated into a profile silhouette -->
    <!-- Vertical stroke of L / face profile -->
    <path
      d="M20 10C20 10 20 54 20 54"
      stroke="url(#lazarus-abstract-grad)"
      stroke-width="4"
      stroke-linecap="round"
    />
    <!-- Horizontal stroke of L -->
    <path
      d="M20 54L40 54"
      stroke="url(#lazarus-abstract-grad)"
      stroke-width="4"
      stroke-linecap="round"
    />
    <!-- Abstract face profile curve -->
    <path
      d="M20 10C28 10 36 14 36 22C36 28 32 30 32 34C32 38 36 40 36 40"
      stroke="url(#lazarus-abstract-grad)"
      stroke-width="3"
      stroke-linecap="round"
      fill="none"
      opacity="0.7"
    />
    <!-- Eye dot -->
    <circle cx="30" cy="20" r="2.5" fill="url(#lazarus-abstract-grad)" opacity="0.8" />
    <!-- Small spark/consciousness indicator -->
    <circle cx="44" cy="14" r="3" fill="url(#lazarus-abstract-grad)" opacity="0.5" />
    <line x1="44" y1="9" x2="44" y2="11" stroke="url(#lazarus-abstract-grad)" stroke-width="1.5" stroke-linecap="round" opacity="0.4" />
    <line x1="48" y1="14" x2="50" y2="14" stroke="url(#lazarus-abstract-grad)" stroke-width="1.5" stroke-linecap="round" opacity="0.4" />
    <line x1="47" y1="11" x2="48.5" y2="9.5" stroke="url(#lazarus-abstract-grad)" stroke-width="1.5" stroke-linecap="round" opacity="0.4" />
  </svg>
</template>

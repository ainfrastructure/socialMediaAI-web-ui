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
      <linearGradient id="lazarus-neural-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#0f3d2e" />
        <stop offset="50%" style="stop-color:#1a5a45" />
        <stop offset="100%" style="stop-color:#b08a5a" />
      </linearGradient>
      <linearGradient id="lazarus-glow-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#1a5a45" />
        <stop offset="100%" style="stop-color:#b08a5a" />
      </linearGradient>
      <filter id="lazarus-glow">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <!-- Outer ring - subtle -->
    <circle cx="32" cy="32" r="28" stroke="url(#lazarus-neural-grad)" stroke-width="1.5" opacity="0.2" />
    <!-- Inner hexagonal shape suggesting AI/tech -->
    <path
      d="M32 8L52 20V44L32 56L12 44V20Z"
      stroke="url(#lazarus-neural-grad)"
      stroke-width="1.5"
      fill="none"
      opacity="0.15"
    />
    <!-- Bold "L" monogram -->
    <path
      d="M22 16V48H42"
      stroke="url(#lazarus-neural-grad)"
      stroke-width="5"
      stroke-linecap="round"
      stroke-linejoin="round"
      filter="url(#lazarus-glow)"
    />
    <!-- Signal/pulse waves emanating from the L -->
    <path
      d="M38 18C42 18 46 22 46 28"
      stroke="url(#lazarus-glow-grad)"
      stroke-width="2"
      stroke-linecap="round"
      fill="none"
      opacity="0.6"
    />
    <path
      d="M42 14C48 14 54 20 54 28"
      stroke="url(#lazarus-glow-grad)"
      stroke-width="1.5"
      stroke-linecap="round"
      fill="none"
      opacity="0.35"
    />
    <!-- Accent dot - active/online indicator -->
    <circle cx="46" cy="18" r="3" fill="#b08a5a" opacity="0.8" />
    <circle cx="46" cy="18" r="1.5" fill="#d4a964" />
  </svg>
</template>

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
      <linearGradient id="lazarus-loop-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#0f3d2e" />
        <stop offset="100%" style="stop-color:#1a5a45" />
      </linearGradient>
    </defs>
    <!-- Infinity loop combining chat bubble + calendar concepts -->
    <!-- Left loop (chat bubble shape) -->
    <path
      d="M8 32C8 22 15 16 22 16C29 16 33 22 33 32C33 42 29 48 22 48C15 48 8 42 8 32Z"
      stroke="url(#lazarus-loop-grad)"
      stroke-width="3.5"
      fill="none"
      stroke-linecap="round"
    />
    <!-- Right loop (calendar shape) -->
    <path
      d="M56 32C56 42 49 48 42 48C35 48 31 42 31 32C31 22 35 16 42 16C49 16 56 22 56 32Z"
      stroke="url(#lazarus-loop-grad)"
      stroke-width="3.5"
      fill="none"
      stroke-linecap="round"
    />
    <!-- Chat dots inside left loop -->
    <circle cx="17" cy="32" r="2" fill="url(#lazarus-loop-grad)" opacity="0.7" />
    <circle cx="22" cy="32" r="2" fill="url(#lazarus-loop-grad)" opacity="0.7" />
    <circle cx="27" cy="32" r="2" fill="url(#lazarus-loop-grad)" opacity="0.7" />
    <!-- Calendar lines inside right loop -->
    <line x1="38" y1="28" x2="46" y2="28" stroke="url(#lazarus-loop-grad)" stroke-width="2" stroke-linecap="round" opacity="0.6" />
    <line x1="38" y1="33" x2="46" y2="33" stroke="url(#lazarus-loop-grad)" stroke-width="2" stroke-linecap="round" opacity="0.6" />
    <line x1="38" y1="38" x2="43" y2="38" stroke="url(#lazarus-loop-grad)" stroke-width="2" stroke-linecap="round" opacity="0.6" />
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ size?: number }>(), { size: 20 })
</script>

<template>
  <svg
    :width="Math.round(size * 96 / 120)"
    :height="size"
    viewBox="0 0 96 120"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    class="sc-static-mark"
  >
    <rect x="18" y="8" width="16" height="16" rx="3.5" fill="#3A9BC0" />
    <rect x="40" y="8" width="16" height="16" rx="3.5" fill="#3A9BC0" />
    <rect x="62" y="8" width="16" height="16" rx="3.5" fill="#3A9BC0" />
    <rect x="18" y="30" width="16" height="16" rx="3.5" fill="#3A9BC0" />
    <rect x="18" y="52" width="16" height="16" rx="3.5" fill="#3A9BC0" />
    <rect x="40" y="52" width="16" height="16" rx="3.5" fill="#3A9BC0" />
    <rect x="62" y="52" width="16" height="16" rx="3.5" fill="#3A9BC0" />
    <rect x="62" y="74" width="16" height="16" rx="3.5" fill="#3A9BC0" />
    <rect x="18" y="96" width="16" height="16" rx="3.5" fill="#3A9BC0" />
    <rect x="40" y="96" width="16" height="16" rx="3.5" fill="#3A9BC0" />
    <rect x="62" y="96" width="16" height="16" rx="3.5" fill="#3A9BC0" />
  </svg>
</template>

<style scoped>
.sc-static-mark {
  display: block;
  flex-shrink: 0;
}
</style>

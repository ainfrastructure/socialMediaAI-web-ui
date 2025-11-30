<script setup lang="ts">
interface Props {
  icon: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
  filled?: boolean
  color?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  filled: false
})

const sizeMap = {
  xs: '16px',
  sm: '20px',
  md: '24px',
  lg: '32px',
  xl: '40px',
  '2xl': '48px',
  '3xl': '64px'
}
</script>

<template>
  <span
    :class="['material-symbols-outlined', { 'material-symbols-filled': filled }]"
    :style="{
      fontSize: sizeMap[size],
      color: color || 'currentColor'
    }"
    aria-hidden="true"
  >
    {{ icon }}
  </span>
</template>

<style scoped>
.material-symbols-outlined,
.material-symbols-filled {
  font-variation-settings:
  'FILL' 0,
  'wght' 400,
  'GRAD' 0,
  'opsz' 24;
  user-select: none;
  vertical-align: middle;
}

.material-symbols-filled {
  font-variation-settings:
  'FILL' 1,
  'wght' 400,
  'GRAD' 0,
  'opsz' 24;
}
</style>

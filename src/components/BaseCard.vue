<template>
  <div :class="['base-card', variantClass, { 'hoverable': hoverable, 'elevated': elevated }]">
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'glass' | 'glass-intense' | 'solid'
  hoverable?: boolean
  elevated?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'glass',
  hoverable: false,
  elevated: false
})

const variantClass = computed(() => `card-${props.variant}`)
</script>

<style scoped>
.base-card {
  border-radius: var(--radius-lg);
  padding: var(--space-2xl);
  transition: var(--transition-base);
  position: relative;
}

/* Glass Variants */
.card-glass {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--blur-md));
  -webkit-backdrop-filter: blur(var(--blur-md));
  border: var(--border-width) solid var(--glass-border);
  box-shadow: var(--shadow-lg);
}

.card-glass-intense {
  background: rgba(26, 26, 26, 0.85);
  backdrop-filter: blur(var(--blur-lg));
  -webkit-backdrop-filter: blur(var(--blur-lg));
  border: var(--border-width) solid var(--glass-border);
  box-shadow: var(--shadow-xl);
}

.card-solid {
  background: var(--bg-secondary);
  border: var(--border-width) solid var(--border-color);
  box-shadow: var(--shadow-md);
}

/* Modifiers */
.elevated {
  box-shadow: var(--shadow-xl);
}

.hoverable {
  cursor: pointer;
}

.hoverable:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-xl);
  border-color: var(--border-hover);
}

.card-glass.hoverable:hover {
  background: rgba(26, 26, 26, 0.75);
}

.card-solid.hoverable:hover {
  background: var(--bg-elevated);
}

/* Inner highlight for depth */
.base-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--glass-highlight);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
}
</style>

<script setup lang="ts">
/**
 * ContentDivider - Reusable divider with optional text
 */
interface Props {
  text?: string
}

defineProps<Props>()
</script>

<template>
  <div class="content-divider">
    <span v-if="text" class="divider-text">{{ text }}</span>
  </div>
</template>

<style scoped>
.content-divider {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  margin: var(--space-2xl) 0;
}

.content-divider::before,
.content-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border-color);
}

.divider-text {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

/* No text variant */
.content-divider:not(:has(.divider-text))::after {
  display: none;
}

.content-divider:not(:has(.divider-text))::before {
  flex: 1;
}
</style>

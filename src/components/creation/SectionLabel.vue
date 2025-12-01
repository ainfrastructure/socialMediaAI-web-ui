<script setup lang="ts">
/**
 * SectionLabel - Reusable section header with icon
 * Used for consistent section headers in creation wizards
 */
import MaterialIcon from '../MaterialIcon.vue'

interface Props {
  icon?: string
  iconColor?: string
}

withDefaults(defineProps<Props>(), {
  iconColor: 'var(--gold-primary)'
})
</script>

<template>
  <h4 class="section-label">
    <MaterialIcon
      v-if="icon"
      :icon="icon"
      size="sm"
      :color="iconColor"
    />
    <slot></slot>
  </h4>
</template>

<style scoped>
.section-label {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin-bottom: var(--space-lg);
}
</style>

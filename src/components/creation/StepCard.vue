<script setup lang="ts">
/**
 * StepCard - Reusable card wrapper for wizard steps
 * Used by both EasyModeCreation and AdvancedModeCreation
 */
import BaseCard from '../BaseCard.vue'

interface Props {
  title: string
  subtitle?: string
  description?: string
  variant?: 'glass' | 'glass-intense' | 'solid'
}

withDefaults(defineProps<Props>(), {
  variant: 'glass'
})
</script>

<template>
  <BaseCard :variant="variant" class="step-card">
    <div class="step-header">
      <div class="step-info">
        <h3 class="step-title">{{ title }}</h3>
        <p v-if="subtitle" class="step-subtitle">{{ subtitle }}</p>
        <p v-if="description" class="step-description">{{ description }}</p>
      </div>
      <slot name="header-actions"></slot>
    </div>

    <slot></slot>

    <div v-if="$slots.navigation" class="step-navigation">
      <slot name="navigation"></slot>
    </div>
  </BaseCard>
</template>

<style scoped>
.step-card {
  margin-bottom: var(--space-2xl);
  animation: fadeInUp 0.4s var(--ease-smooth);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.step-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-2xl);
  padding-bottom: var(--space-xl);
  border-bottom: 1px solid var(--border-color);
}

.step-info {
  flex: 1;
}

.step-title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  margin-bottom: var(--space-sm);
}

.step-subtitle {
  font-size: var(--text-lg);
  color: var(--text-secondary);
  margin-bottom: var(--space-sm);
}

.step-description {
  font-size: var(--text-base);
  color: var(--text-muted);
  line-height: var(--leading-relaxed);
}

.step-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-lg);
  margin-top: var(--space-2xl);
  padding-top: var(--space-xl);
  border-top: 1px solid var(--border-color);
}

/* Responsive */
@media (max-width: 768px) {
  .step-header {
    flex-direction: column;
    gap: var(--space-lg);
  }

  .step-title {
    font-size: var(--text-xl);
  }

  .step-navigation {
    flex-direction: column;
  }
}
</style>

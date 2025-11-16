<script setup lang="ts">
interface Action {
  text: string
  onClick: () => void
}

interface Props {
  message: string
  action?: Action
}

const props = defineProps<Props>()
</script>

<template>
  <div class="empty-state">
    <p class="empty-message">{{ message }}</p>
    <button
      v-if="action"
      class="empty-action"
      @click="action.onClick"
    >
      {{ action.text }}
    </button>
  </div>
</template>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-lg);
  padding: var(--space-3xl) var(--space-xl);
  text-align: center;
}

.empty-message {
  font-size: var(--text-sm);
  color: var(--text-muted);
  margin: 0;
  line-height: var(--leading-normal);
}

.empty-action {
  padding: var(--space-sm) var(--space-lg);
  background: rgba(212, 175, 55, 0.1);
  border: 1px solid var(--gold-primary);
  border-radius: var(--radius-md);
  color: var(--gold-primary);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: var(--transition-base);
}

.empty-action:hover {
  background: var(--gold-primary);
  color: var(--text-on-gold);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.empty-action:active {
  transform: translateY(0);
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .empty-action {
    transition: none;
  }

  .empty-action:hover {
    transform: none;
  }

  .empty-action:active {
    transform: none;
  }
}
</style>

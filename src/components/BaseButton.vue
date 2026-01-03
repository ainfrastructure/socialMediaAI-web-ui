<template>
  <button
    :class="['base-button', variantClass, sizeClass, { 'full-width': fullWidth, 'disabled': disabled }]"
    :disabled="disabled"
    :type="type"
    @click="handleClick"
  >
    <slot></slot>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'small' | 'medium' | 'large'
  fullWidth?: boolean
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'medium',
  fullWidth: false,
  disabled: false,
  type: 'button'
})

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()

const variantClass = computed(() => `button-${props.variant}`)
const sizeClass = computed(() => `button-${props.size}`)

const handleClick = (event: MouseEvent) => {
  if (!props.disabled) {
    emit('click', event)
  }
}
</script>

<style scoped>
.base-button {
  font-family: var(--font-body);
  font-weight: var(--font-medium);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-base);
  outline: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  white-space: nowrap;
  text-decoration: none;
  position: relative;
  overflow: hidden;
}

.base-button:focus-visible {
  box-shadow: var(--focus-ring);
}

/* Variants */
.button-primary {
  background: var(--gradient-gold);
  color: var(--text-on-gold);
  box-shadow: var(--shadow-md);
}

.button-primary:hover:not(.disabled) {
  background: var(--gradient-gold-hover);
  box-shadow: var(--shadow-lg), var(--glow-gold-sm);
  transform: translateY(-1px);
}

.button-primary:active:not(.disabled) {
  transform: translateY(0);
  box-shadow: var(--shadow-sm);
}

.button-secondary {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--blur-md));
  -webkit-backdrop-filter: blur(var(--blur-md));
  border: var(--border-width) solid var(--glass-border);
  color: var(--text-primary);
  box-shadow: var(--shadow-sm);
}

.button-secondary:hover:not(.disabled) {
  border-color: var(--border-hover);
  background: var(--bg-elevated);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.button-secondary:active:not(.disabled) {
  transform: translateY(0);
}

.button-ghost {
  background: transparent;
  color: var(--text-secondary);
  border: var(--border-width) solid var(--border-color);
}

.button-ghost:hover:not(.disabled) {
  color: var(--gold-primary);
  border-color: var(--gold-primary);
  background: var(--gold-subtle);
}

.button-ghost:active:not(.disabled) {
  background: var(--gold-subtle);
}

.button-danger {
  background: var(--error-bg);
  color: var(--error-text);
  border: var(--border-width) solid var(--error-border);
  box-shadow: var(--shadow-sm);
}

.button-danger:hover:not(.disabled) {
  background: rgba(220, 53, 69, 0.25);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.button-danger:active:not(.disabled) {
  transform: translateY(0);
}

/* Sizes */
.button-small {
  padding: var(--space-sm) var(--space-lg);
  font-size: var(--text-sm);
}

.button-medium {
  padding: var(--space-md) var(--space-xl);
  font-size: var(--text-base);
}

.button-large {
  padding: var(--space-lg) var(--space-2xl);
  font-size: var(--text-lg);
}

/* Modifiers */
.full-width {
  width: 100%;
}

.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

/* Ripple effect on click */
.base-button::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(246, 241, 231, 0.3);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.base-button:active::after {
  width: 300px;
  height: 300px;
}

/* Mobile touch target optimization */
@media (max-width: 768px) {
  .button-small {
    padding: var(--space-md) var(--space-lg);
    min-height: var(--touch-target-min);
    font-size: var(--text-sm);
  }

  .button-medium {
    padding: var(--space-md) var(--space-xl);
    min-height: var(--touch-target-min);
  }

  .button-large {
    padding: var(--space-lg) var(--space-2xl);
    min-height: var(--touch-target-comfortable);
  }
}

@media (max-width: 480px) {
  .button-small {
    padding: var(--space-md) var(--space-md);
    font-size: var(--text-xs);
  }

  .button-medium {
    padding: var(--space-md) var(--space-lg);
    font-size: var(--text-sm);
  }

  .button-large {
    padding: var(--space-md) var(--space-xl);
    font-size: var(--text-base);
  }

  /* Disable transform on mobile for better touch feedback */
  .base-button:hover:not(.disabled) {
    transform: none;
  }

  .base-button:active:not(.disabled) {
    transform: scale(0.98);
  }
}
</style>

<script setup lang="ts">
import { watch } from 'vue'
import BaseCard from './BaseCard.vue'

interface Props {
  modelValue: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  title?: string
  showCloseButton?: boolean
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
  preventBodyScroll?: boolean
  cardVariant?: 'glass' | 'glass-intense' | 'solid'
  zIndex?: number
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  showCloseButton: true,
  closeOnOverlayClick: true,
  closeOnEscape: true,
  preventBodyScroll: true,
  cardVariant: 'glass-intense',
  zIndex: 9999,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'close'): void
}>()

// Size classes
const sizeClasses: Record<string, string> = {
  sm: 'modal-sm',
  md: 'modal-md',
  lg: 'modal-lg',
  xl: 'modal-xl',
  full: 'modal-full',
}

// Close modal
function close() {
  emit('update:modelValue', false)
  emit('close')
}

// Handle overlay click
function handleOverlayClick() {
  if (props.closeOnOverlayClick) {
    close()
  }
}

// Handle escape key
function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.closeOnEscape) {
    close()
  }
}

// Manage body scroll and escape listener
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    if (props.preventBodyScroll) {
      document.body.style.overflow = 'hidden'
    }
    if (props.closeOnEscape) {
      document.addEventListener('keydown', handleKeydown)
    }
  } else {
    if (props.preventBodyScroll) {
      document.body.style.overflow = ''
    }
    document.removeEventListener('keydown', handleKeydown)
  }
}, { immediate: true })
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="base-modal-overlay"
        :style="{ zIndex: props.zIndex }"
        @click.self="handleOverlayClick"
      >
        <BaseCard
          :variant="cardVariant"
          :class="['base-modal-card', sizeClasses[size]]"
        >
          <!-- Close Button -->
          <button
            v-if="showCloseButton"
            class="base-modal-close"
            @click="close"
            aria-label="Close modal"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>

          <!-- Header (optional, via prop or slot) -->
          <div v-if="title || $slots.header" class="base-modal-header">
            <slot name="header">
              <h3 class="base-modal-title">{{ title }}</h3>
            </slot>
          </div>

          <!-- Body (main content) -->
          <div class="base-modal-body">
            <slot></slot>
          </div>

          <!-- Footer (optional, via slot) -->
          <div v-if="$slots.footer" class="base-modal-footer">
            <slot name="footer"></slot>
          </div>
        </BaseCard>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.base-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-xl);
  z-index: var(--z-modal, 9999);
}

/* Modal transition */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.25s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .base-modal-card,
.modal-leave-active .base-modal-card {
  transition: transform 0.25s ease, opacity 0.25s ease;
}

.modal-enter-from .base-modal-card,
.modal-leave-to .base-modal-card {
  opacity: 0;
  transform: scale(0.95) translateY(-10px);
}

/* Modal card base styles */
.base-modal-card {
  position: relative;
  width: 100%;
  max-height: 90vh;
  max-height: 90dvh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Size variants */
.modal-sm {
  max-width: 400px;
}

.modal-md {
  max-width: 560px;
}

.modal-lg {
  max-width: 800px;
}

.modal-xl {
  max-width: 1000px;
}

.modal-full {
  max-width: calc(100vw - var(--space-2xl) * 2);
  max-height: calc(100vh - var(--space-2xl) * 2);
  max-height: calc(100dvh - var(--space-2xl) * 2);
}

/* Close button */
.base-modal-close {
  position: absolute;
  top: var(--space-md);
  right: var(--space-md);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-muted);
  cursor: pointer;
  padding: var(--space-sm);
  border-radius: var(--radius-sm);
  transition: var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  min-width: var(--touch-target-min);
  min-height: var(--touch-target-min);
}

.base-modal-close:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}

/* Header */
.base-modal-header {
  padding: var(--space-xl) var(--space-xl) var(--space-lg);
  padding-right: var(--space-3xl); /* Make room for close button */
  border-bottom: 1px solid var(--border-color);
}

.base-modal-title {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0;
}

/* Body */
.base-modal-body {
  flex: 1;
  padding: var(--space-xl);
  overflow-y: auto;
}

/* Footer */
.base-modal-footer {
  padding: var(--space-lg) var(--space-xl);
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
  gap: var(--space-md);
}

/* Responsive */
@media (max-width: 768px) {
  .base-modal-overlay {
    padding: var(--space-md);
  }

  .modal-sm,
  .modal-md,
  .modal-lg,
  .modal-xl {
    max-width: 100%;
  }

  .base-modal-body {
    padding: var(--space-lg);
  }

  .base-modal-header {
    padding: var(--space-lg) var(--space-lg) var(--space-md);
    padding-right: var(--space-3xl);
  }

  .base-modal-footer {
    padding: var(--space-md) var(--space-lg);
    flex-wrap: wrap;
  }

  .base-modal-title {
    font-size: var(--text-lg);
  }
}

@media (max-width: 480px) {
  .base-modal-overlay {
    padding: var(--space-sm);
    align-items: flex-end;
  }

  .base-modal-card {
    max-height: 95vh;
    max-height: 95dvh;
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  }

  .base-modal-body {
    padding: var(--space-md);
  }

  .base-modal-header {
    padding: var(--space-md) var(--space-md) var(--space-sm);
    padding-right: var(--space-3xl);
  }

  .base-modal-footer {
    padding: var(--space-md);
    gap: var(--space-sm);
  }

  .base-modal-close {
    top: var(--space-sm);
    right: var(--space-sm);
  }
}

@media (max-width: 390px) {
  .base-modal-overlay {
    padding: var(--space-xs);
  }

  .base-modal-title {
    font-size: var(--text-base);
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .modal-enter-active,
  .modal-leave-active,
  .modal-enter-active .base-modal-card,
  .modal-leave-active .base-modal-card {
    transition: none;
  }
}
</style>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal-overlay" @click.self="handleCancel">
        <BaseCard variant="glass-intense" class="confirm-modal">
          <div class="modal-header">
            <div :class="['modal-icon', `icon-${type}`]">
              {{ icon }}
            </div>
            <h3 class="modal-title">{{ title }}</h3>
          </div>

          <div class="modal-body">
            <p class="modal-message">{{ message }}</p>
          </div>

          <div class="modal-actions">
            <BaseButton
              variant="ghost"
              size="medium"
              @click="handleCancel"
              :disabled="loading"
            >
              {{ cancelText }}
            </BaseButton>
            <BaseButton
              :variant="type === 'danger' ? 'danger' : 'primary'"
              size="medium"
              @click="handleConfirm"
              :disabled="loading"
            >
              {{ loading ? loadingText : confirmText }}
            </BaseButton>
          </div>
        </BaseCard>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import BaseCard from './BaseCard.vue'
import BaseButton from './BaseButton.vue'

interface Props {
  modelValue: boolean
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  loadingText?: string
  type?: 'info' | 'warning' | 'danger' | 'success'
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Confirm Action',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  loadingText: 'Processing...',
  type: 'info',
  loading: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

const icon = computed(() => {
  switch (props.type) {
    case 'danger':
      return '⚠️'
    case 'warning':
      return '⚠️'
    case 'success':
      return '✓'
    case 'info':
    default:
      return 'ℹ️'
  }
})

const handleConfirm = () => {
  emit('confirm')
}

const handleCancel = () => {
  if (!props.loading) {
    emit('update:modelValue', false)
    emit('cancel')
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(var(--blur-md));
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-xl);
  z-index: 9998;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .confirm-modal,
.modal-leave-active .confirm-modal {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.modal-enter-from .confirm-modal,
.modal-leave-to .confirm-modal {
  opacity: 0;
  transform: scale(0.9);
}

.confirm-modal {
  max-width: 500px;
  width: 100%;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-2xl) var(--space-xl) var(--space-lg);
  border-bottom: 1px solid rgba(212, 175, 55, 0.2);
}

.modal-icon {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-3xl);
}

.icon-info {
  background: rgba(59, 130, 246, 0.15);
  border: 2px solid rgba(59, 130, 246, 0.4);
}

.icon-warning {
  background: rgba(245, 158, 11, 0.15);
  border: 2px solid rgba(245, 158, 11, 0.4);
}

.icon-danger {
  background: rgba(239, 68, 68, 0.15);
  border: 2px solid rgba(239, 68, 68, 0.4);
}

.icon-success {
  background: rgba(34, 197, 94, 0.15);
  border: 2px solid rgba(34, 197, 94, 0.4);
}

.modal-title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  color: var(--text-primary);
  margin: 0;
  text-align: center;
}

.modal-body {
  padding: var(--space-xl);
}

.modal-message {
  color: var(--text-secondary);
  font-size: var(--text-base);
  line-height: var(--leading-normal);
  margin: 0;
  text-align: center;
}

.modal-actions {
  display: flex;
  justify-content: center;
  gap: var(--space-md);
  padding: var(--space-lg) var(--space-xl) var(--space-2xl);
  border-top: 1px solid rgba(212, 175, 55, 0.2);
}

/* Responsive */
@media (max-width: 768px) {
  .modal-overlay {
    padding: var(--space-md);
  }

  .confirm-modal {
    max-width: 100%;
  }

  .modal-actions {
    flex-direction: column-reverse;
  }

  .modal-actions button {
    width: 100%;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .confirm-modal {
    animation: none;
  }

  .modal-enter-active,
  .modal-leave-active,
  .modal-enter-active .confirm-modal,
  .modal-leave-active .confirm-modal {
    transition: none;
  }
}
</style>

<template>
  <Teleport to="body">
    <Transition name="toast">
      <div
        v-if="visible"
        :class="['toast', `toast-${type}`]"
        role="alert"
      >
        <div class="toast-icon">{{ icon }}</div>
        <div class="toast-content">
          <p class="toast-message">{{ message }}</p>
        </div>
        <button
          v-if="dismissible"
          class="toast-close"
          @click="close"
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'

interface Props {
  message: string
  type?: 'success' | 'error' | 'info' | 'warning'
  duration?: number // in milliseconds, 0 means no auto-dismiss
  dismissible?: boolean
  modelValue?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'info',
  duration: 4000,
  dismissible: true,
  modelValue: true,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'close'): void
}>()

const visible = ref(props.modelValue)

const icon = computed(() => {
  switch (props.type) {
    case 'success':
      return '✓'
    case 'error':
      return '✕'
    case 'warning':
      return '⚠'
    case 'info':
    default:
      return 'ℹ'
  }
})

const close = () => {
  visible.value = false
  emit('update:modelValue', false)
  emit('close')
}

const startAutoClose = () => {
  if (props.duration > 0) {
    window.setTimeout(() => {
      close()
    }, props.duration)
  }
}

watch(() => props.modelValue, (newValue) => {
  visible.value = newValue
  if (newValue) {
    startAutoClose()
  }
})

onMounted(() => {
  if (visible.value) {
    startAutoClose()
  }
})
</script>

<style scoped>
.toast {
  position: fixed;
  top: var(--space-xl);
  right: var(--space-xl);
  min-width: 300px;
  max-width: 500px;
  padding: var(--space-lg);
  border-radius: var(--radius-lg);
  backdrop-filter: blur(var(--blur-md));
  border: var(--border-width) solid;
  box-shadow: var(--shadow-xl);
  display: flex;
  align-items: center;
  gap: var(--space-md);
  z-index: 9999;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.toast-icon {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
}

.toast-content {
  flex: 1;
}

.toast-message {
  margin: 0;
  color: var(--text-primary);
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  line-height: var(--leading-normal);
}

.toast-close {
  flex-shrink: 0;
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: var(--text-2xl);
  line-height: 1;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
}

.toast-close:hover {
  color: var(--text-primary);
  background: rgba(15, 61, 46, 0.1);
}

/* Success Toast */
.toast-success {
  background: rgba(34, 197, 94, 0.15);
  border-color: rgba(34, 197, 94, 0.4);
}

.toast-success .toast-icon {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

/* Error Toast */
.toast-error {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.4);
}

.toast-error .toast-icon {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

/* Warning Toast */
.toast-warning {
  background: rgba(245, 158, 11, 0.15);
  border-color: rgba(245, 158, 11, 0.4);
}

.toast-warning .toast-icon {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

/* Info Toast */
.toast-info {
  background: rgba(59, 130, 246, 0.15);
  border-color: rgba(59, 130, 246, 0.4);
}

.toast-info .toast-icon {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}

/* Responsive */
@media (max-width: 768px) {
  .toast {
    top: var(--space-md);
    right: var(--space-md);
    left: var(--space-md);
    min-width: unset;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .toast,
  .toast-enter-active,
  .toast-leave-active {
    animation: none;
    transition: none;
  }
}
</style>

<template>
  <div v-if="modelValue" :class="['base-alert', typeClass]" role="alert">
    <div class="alert-content">
      <span class="alert-icon">{{ icon }}</span>
      <div class="alert-message">
        <slot>{{ message }}</slot>
      </div>
    </div>
    <button v-if="dismissible" class="alert-close" @click="handleClose" aria-label="Close">
      ×
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  type?: 'success' | 'error' | 'info' | 'warning'
  message?: string
  dismissible?: boolean
  modelValue?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'info',
  message: '',
  dismissible: true,
  modelValue: true
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'close'): void
}>()

const typeClass = computed(() => `alert-${props.type}`)

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

const handleClose = () => {
  emit('update:modelValue', false)
  emit('close')
}
</script>

<style scoped>
.base-alert {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: var(--space-lg);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-lg);
  border: var(--border-width) solid;
  backdrop-filter: blur(var(--blur-sm));
  -webkit-backdrop-filter: blur(var(--blur-sm));
  font-size: var(--text-sm);
  line-height: var(--leading-normal);
  animation: slideIn 0.3s var(--ease-smooth);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.alert-content {
  display: flex;
  align-items: flex-start;
  gap: var(--space-md);
  flex: 1;
}

.alert-icon {
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  line-height: 1;
  flex-shrink: 0;
}

.alert-message {
  flex: 1;
  padding-top: 2px;
}

.alert-close {
  background: none;
  border: none;
  color: inherit;
  font-size: var(--text-2xl);
  line-height: 1;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity var(--duration-fast);
  padding: 0;
  margin-left: var(--space-md);
  flex-shrink: 0;
}

.alert-close:hover {
  opacity: 1;
}

/* Alert Types */
.alert-success {
  background: var(--success-bg);
  border-color: var(--success-border);
  color: var(--success-text);
}

.alert-error {
  background: var(--error-bg);
  border-color: var(--error-border);
  color: var(--error-text);
}

.alert-info {
  background: var(--info-bg);
  border-color: var(--info-border);
  color: var(--info-text);
}

.alert-warning {
  background: var(--warning-bg);
  border-color: var(--warning-border);
  color: var(--warning-text);
}
</style>

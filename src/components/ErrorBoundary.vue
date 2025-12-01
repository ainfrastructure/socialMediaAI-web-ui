<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'
import { captureError } from '@/config/sentry'
import BaseCard from './BaseCard.vue'
import BaseButton from './BaseButton.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const hasError = ref(false)
const errorMessage = ref('')

// Capture errors from child components
onErrorCaptured((err: Error, instance, info) => {
  console.error('Error caught by boundary:', err)

  // Send to Sentry
  captureError(err, {
    componentName: instance?.$options?.name || 'Unknown',
    errorInfo: info,
  })

  // Update UI
  hasError.value = true
  errorMessage.value = err.message || 'An unexpected error occurred'

  // Prevent error from propagating
  return false
})

function retry() {
  hasError.value = false
  errorMessage.value = ''
  // Optionally trigger a re-render or navigation
  window.location.reload()
}

function goBack() {
  window.history.back()
}
</script>

<template>
  <div>
    <slot v-if="!hasError"></slot>

    <!-- Error state -->
    <div v-else class="error-boundary">
      <BaseCard variant="glass-intense" class="error-card">
        <div class="error-content">
          <div class="error-icon">
            <span class="material-symbols-outlined">error</span>
          </div>

          <h2 class="error-title">{{ t('common.somethingWentWrong') || 'Something went wrong' }}</h2>

          <p class="error-message">
            {{ errorMessage }}
          </p>

          <p class="error-hint">
            {{ t('common.errorHint') || 'The error has been reported to our team. Please try refreshing the page.' }}
          </p>

          <div class="error-actions">
            <BaseButton variant="primary" @click="retry">
              {{ t('common.refresh') || 'Refresh Page' }}
            </BaseButton>
            <BaseButton variant="ghost" @click="goBack">
              {{ t('common.goBack') || 'Go Back' }}
            </BaseButton>
          </div>
        </div>
      </BaseCard>
    </div>
  </div>
</template>

<style scoped>
.error-boundary {
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-2xl);
}

.error-card {
  max-width: 600px;
  width: 100%;
  animation: fadeInUp 0.4s var(--ease-smooth);
}

.error-content {
  text-align: center;
  padding: var(--space-2xl);
}

.error-icon {
  margin-bottom: var(--space-2xl);
}

.error-icon .material-symbols-outlined {
  font-size: 64px;
  color: var(--error-text);
}

.error-title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  color: var(--text-primary);
  margin-bottom: var(--space-lg);
}

.error-message {
  color: var(--text-secondary);
  font-size: var(--text-base);
  margin-bottom: var(--space-md);
  font-family: monospace;
  background: var(--bg-tertiary);
  padding: var(--space-md);
  border-radius: var(--radius-md);
  border: 1px solid var(--error-border);
}

.error-hint {
  color: var(--text-muted);
  font-size: var(--text-sm);
  margin-bottom: var(--space-2xl);
}

.error-actions {
  display: flex;
  gap: var(--space-md);
  justify-content: center;
  flex-wrap: wrap;
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

@media (max-width: 768px) {
  .error-boundary {
    padding: var(--space-lg);
  }

  .error-content {
    padding: var(--space-lg);
  }

  .error-icon .material-symbols-outlined {
    font-size: 48px;
  }

  .error-actions {
    flex-direction: column;
    width: 100%;
  }

  .error-actions button {
    width: 100%;
  }
}
</style>

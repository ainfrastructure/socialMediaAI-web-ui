<template>
  <Transition name="modal">
    <div v-if="modelValue" class="modal-overlay" @click.self="$emit('update:modelValue', false)">
      <BaseCard variant="glass-intense" class="progress-modal">
        <div class="progress-content">
          <div class="progress-icon">
            <div class="spinner large"></div>
          </div>

          <h3 class="progress-title">{{ title }}</h3>

          <div class="progress-bar-container">
            <div class="progress-bar">
              <div
                class="progress-bar-fill"
                :style="{ width: `${progress}%` }"
              ></div>
            </div>
            <div class="progress-percentage">{{ progress }}%</div>
          </div>

          <p class="progress-message">{{ currentMessage }}</p>

          <div class="progress-steps">
            <div
              v-for="(step, index) in steps"
              :key="index"
              class="progress-step"
              :class="{
                active: index === currentStepIndex,
                completed: index < currentStepIndex
              }"
            >
              <div class="step-icon">
                <span v-if="index < currentStepIndex">✓</span>
                <span v-else-if="index === currentStepIndex" class="step-spinner"></span>
                <span v-else>{{ index + 1 }}</span>
              </div>
              <span class="step-text">{{ step }}</span>
            </div>
          </div>
        </div>
      </BaseCard>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import BaseCard from './BaseCard.vue'

interface Props {
  modelValue: boolean
  title?: string
  progress: number
  currentMessage?: string
  steps?: string[]
  currentStepIndex?: number
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Processing...',
  currentMessage: 'Please wait while we process your request',
  steps: () => [],
  currentStepIndex: 0
})

defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(var(--blur-lg));
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--space-xl);
}

.progress-modal {
  max-width: 500px;
  width: 100%;
  padding: var(--space-3xl);
}

.progress-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xl);
}

.progress-icon {
  margin-bottom: var(--space-lg);
}

.spinner.large {
  width: 80px;
  height: 80px;
  border: 5px solid rgba(212, 175, 55, 0.15);
  border-top-color: var(--gold-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  filter: drop-shadow(0 0 15px rgba(212, 175, 55, 0.4));
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.progress-title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0;
  text-align: center;
}

.progress-bar-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.progress-bar {
  width: 100%;
  height: 10px;
  background: rgba(26, 26, 26, 0.8);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: var(--radius-full);
  overflow: hidden;
  position: relative;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--gold-dark), var(--gold-primary), var(--gold-light));
  background-size: 200% 100%;
  animation: shimmer 2s ease-in-out infinite;
  border-radius: var(--radius-full);
  transition: width 0.3s ease-out;
  box-shadow: 0 0 15px rgba(212, 175, 55, 0.5);
}

@keyframes shimmer {
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

.progress-percentage {
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  color: var(--gold-primary);
  text-align: center;
}

.progress-message {
  font-size: var(--text-base);
  color: var(--text-secondary);
  text-align: center;
  margin: 0;
  font-style: italic;
}

.progress-steps {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  margin-top: var(--space-xl);
}

.progress-step {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  padding: var(--space-lg);
  background: rgba(255, 255, 255, 0.02);
  border: 2px solid rgba(212, 175, 55, 0.1);
  border-radius: var(--radius-lg);
  transition: all 0.3s var(--ease-smooth);
  opacity: 0.5;
}

.progress-step.active {
  opacity: 1;
  border-color: var(--gold-primary);
  background: rgba(212, 175, 55, 0.1);
  box-shadow: 0 0 20px rgba(212, 175, 55, 0.2);
  transform: scale(1.02);
}

.progress-step.completed {
  opacity: 0.75;
  border-color: rgba(46, 213, 115, 0.4);
}

.step-icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  flex-shrink: 0;
  background: rgba(26, 26, 26, 0.9);
  border: 3px solid rgba(212, 175, 55, 0.3);
  color: var(--text-muted);
  transition: all 0.3s var(--ease-smooth);
}

.progress-step.active .step-icon {
  border-color: var(--gold-primary);
  background: rgba(212, 175, 55, 0.15);
  color: var(--gold-primary);
  box-shadow: 0 0 16px rgba(212, 175, 55, 0.4);
}

.progress-step.completed .step-icon {
  background: rgba(46, 213, 115, 0.15);
  border-color: #2ed573;
  color: #2ed573;
  box-shadow: 0 0 12px rgba(46, 213, 115, 0.3);
}

.step-spinner {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(212, 175, 55, 0.2);
  border-top-color: var(--gold-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

.step-text {
  font-size: var(--text-base);
  color: var(--text-secondary);
  flex: 1;
  font-weight: var(--font-medium);
}

.progress-step.active .step-text {
  color: var(--text-primary);
  font-weight: var(--font-semibold);
}

.progress-step.completed .step-text {
  color: var(--text-secondary);
}

/* Modal transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active .progress-modal,
.modal-leave-active .progress-modal {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .progress-modal,
.modal-leave-to .progress-modal {
  transform: scale(0.9);
  opacity: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .progress-modal {
    padding: var(--space-2xl);
  }

  .progress-title {
    font-size: var(--text-xl);
  }

  .spinner.large {
    width: 48px;
    height: 48px;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>

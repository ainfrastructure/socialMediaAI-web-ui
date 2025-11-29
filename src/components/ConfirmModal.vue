<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal-overlay" @click.self="handleCancel">
        <BaseCard variant="glass-intense" class="confirm-modal">
          <!-- Progress bar at top (only shown when auto-close is enabled) -->
          <div v-if="autoCloseSeconds > 0" class="progress-bar-container">
            <div
              class="progress-bar"
              :style="{ width: `${progressWidth}%` }"
            ></div>
          </div>

          <!-- Close button -->
          <button class="close-button" @click="handleCancel" aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>

          <div class="modal-header">
            <div :class="['modal-icon', `icon-${type}`]">
              <svg v-if="type === 'danger'" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 8v4M12 16h.01" stroke-linecap="round"/>
              </svg>
              <svg v-else-if="type === 'warning'" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                <path d="M12 9v4M12 17h.01" stroke-linecap="round"/>
              </svg>
              <svg v-else-if="type === 'success'" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9 12l2 2 4-4" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <svg v-else width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 16v-4M12 8h.01" stroke-linecap="round"/>
              </svg>
            </div>
            <h3 class="modal-title">{{ title }}</h3>
          </div>

          <div class="modal-body">
            <p class="modal-message">{{ message }}</p>
          </div>

          <div class="modal-actions">
            <button class="btn btn-cancel" @click="handleCancel" :disabled="loading">
              {{ cancelText }}
            </button>
            <button
              class="btn"
              :class="type === 'danger' ? 'btn-danger' : 'btn-primary'"
              @click="handleConfirm"
              :disabled="loading"
            >
              {{ loading ? loadingText : confirmText }}
            </button>
          </div>

          <p v-if="autoCloseSeconds > 0" class="auto-close-text">
            Auto-closing in {{ remainingSeconds }}s
          </p>
        </BaseCard>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import BaseCard from './BaseCard.vue'

interface Props {
  modelValue: boolean
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  loadingText?: string
  type?: 'info' | 'warning' | 'danger' | 'success'
  loading?: boolean
  autoCloseSeconds?: number
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Confirm Action',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  loadingText: 'Processing...',
  type: 'info',
  loading: false,
  autoCloseSeconds: 10,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

const remainingSeconds = ref(props.autoCloseSeconds)
const progressWidth = ref(100)
let intervalId: ReturnType<typeof setInterval> | null = null
let animationId: ReturnType<typeof requestAnimationFrame> | null = null
let startTime: number | null = null

function startTimer() {
  // Don't start timer if auto-close is disabled
  if (props.autoCloseSeconds <= 0) return

  remainingSeconds.value = props.autoCloseSeconds
  progressWidth.value = 100
  startTime = Date.now()

  // Update remaining seconds every second
  intervalId = setInterval(() => {
    remainingSeconds.value--
    if (remainingSeconds.value <= 0) {
      handleCancel()
    }
  }, 1000)

  // Smooth progress bar animation
  function animateProgress() {
    if (!startTime) return
    const elapsed = Date.now() - startTime
    const total = props.autoCloseSeconds * 1000
    const remaining = Math.max(0, 100 - (elapsed / total) * 100)
    progressWidth.value = remaining

    if (remaining > 0 && props.modelValue) {
      animationId = requestAnimationFrame(animateProgress)
    }
  }
  animationId = requestAnimationFrame(animateProgress)
}

function stopTimer() {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
  startTime = null
}

const handleConfirm = () => {
  stopTimer()
  emit('confirm')
}

const handleCancel = () => {
  if (!props.loading) {
    stopTimer()
    emit('update:modelValue', false)
    emit('cancel')
  }
}

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    startTimer()
  } else {
    stopTimer()
  }
})

onUnmounted(() => {
  stopTimer()
})
</script>

<style scoped>
.modal-overlay {
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
  z-index: 9999;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.25s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .confirm-modal,
.modal-leave-active .confirm-modal {
  transition: transform 0.25s ease, opacity 0.25s ease;
}

.modal-enter-from .confirm-modal,
.modal-leave-to .confirm-modal {
  opacity: 0;
  transform: scale(0.95) translateY(-10px);
}

.confirm-modal {
  position: relative;
  max-width: 420px;
  width: 100%;
  overflow: hidden;
}

/* Progress bar */
.progress-bar-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: rgba(255, 255, 255, 0.1);
  overflow: hidden;
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--gold-primary), var(--gold-light));
  transition: width 0.1s linear;
  border-radius: 0 2px 2px 0;
}

/* Close button */
.close-button {
  position: absolute;
  top: var(--space-md);
  right: var(--space-md);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-muted);
  cursor: pointer;
  padding: var(--space-xs);
  border-radius: var(--radius-sm);
  transition: var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.close-button:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}

.modal-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-2xl) var(--space-xl) var(--space-lg);
  padding-top: var(--space-3xl);
}

.modal-icon {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-info {
  background: rgba(107, 155, 209, 0.15);
  border: 2px solid rgba(107, 155, 209, 0.3);
  color: var(--info-text);
}

.icon-warning {
  background: rgba(212, 175, 55, 0.15);
  border: 2px solid rgba(212, 175, 55, 0.3);
  color: var(--gold-primary);
}

.icon-danger {
  background: rgba(220, 53, 69, 0.15);
  border: 2px solid rgba(220, 53, 69, 0.3);
  color: var(--error-text);
}

.icon-success {
  background: rgba(34, 197, 94, 0.15);
  border: 2px solid rgba(34, 197, 94, 0.3);
  color: var(--success-text);
}

.modal-title {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  color: var(--text-primary);
  margin: 0;
  text-align: center;
}

.modal-body {
  padding: 0 var(--space-xl) var(--space-lg);
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
  padding: var(--space-md) var(--space-xl);
}

.btn {
  flex: 1;
  max-width: 140px;
  padding: var(--space-sm) var(--space-lg);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: var(--transition-fast);
  border: 1px solid transparent;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-cancel {
  background: rgba(255, 255, 255, 0.05);
  border-color: var(--border-color);
  color: var(--text-secondary);
}

.btn-cancel:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}

.btn-danger {
  background: rgba(220, 53, 69, 0.15);
  border-color: rgba(220, 53, 69, 0.3);
  color: var(--error-text);
}

.btn-danger:hover:not(:disabled) {
  background: rgba(220, 53, 69, 0.25);
}

.btn-primary {
  background: rgba(212, 175, 55, 0.15);
  border-color: rgba(212, 175, 55, 0.3);
  color: var(--gold-light);
}

.btn-primary:hover:not(:disabled) {
  background: rgba(212, 175, 55, 0.25);
}

.auto-close-text {
  text-align: center;
  padding: var(--space-sm) var(--space-xl) var(--space-lg);
  font-size: var(--text-xs);
  color: var(--text-muted);
  margin: 0;
}

/* Responsive */
@media (max-width: 480px) {
  .modal-overlay {
    padding: var(--space-md);
  }

  .confirm-modal {
    max-width: 100%;
  }

  .modal-actions {
    flex-direction: column-reverse;
    gap: var(--space-sm);
  }

  .btn {
    max-width: none;
    width: 100%;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .modal-enter-active,
  .modal-leave-active,
  .modal-enter-active .confirm-modal,
  .modal-leave-active .confirm-modal {
    transition: none;
  }

  .progress-bar {
    transition: none;
  }
}
</style>

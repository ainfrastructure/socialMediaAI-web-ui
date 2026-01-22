<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="modal-overlay" @click="close">
        <div class="modal-container" @click.stop>
          <div class="modal-header">
            <h2 class="modal-title">{{ t('contactFeedback.modalTitle') }}</h2>
            <button class="close-button" @click="close" :aria-label="t('common.close')">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="modal-body">
            <p class="modal-description">
              {{ t('contactFeedback.description') }}
            </p>

            <form @submit.prevent="submitFeedback" class="feedback-form">
              <div class="form-group">
                <label for="modal-feedback-message" class="form-label">{{ t('contactFeedback.messageLabel') }}</label>
                <textarea
                  id="modal-feedback-message"
                  v-model="message"
                  class="feedback-textarea"
                  :placeholder="t('contactFeedback.messagePlaceholder')"
                  rows="6"
                  maxlength="2000"
                  :disabled="submitting"
                  autofocus
                ></textarea>
                <div class="character-count">
                  {{ characterCount }}
                </div>
              </div>

              <BaseAlert v-if="error" type="error">
                {{ error }}
              </BaseAlert>

              <BaseAlert v-if="success" type="success">
                {{ t('contactFeedback.successMessage') }}
              </BaseAlert>

              <div class="form-actions">
                <BaseButton
                  type="button"
                  variant="secondary"
                  @click="close"
                  :disabled="submitting"
                >
                  {{ t('contactFeedback.cancel') }}
                </BaseButton>
                <BaseButton
                  type="submit"
                  variant="primary"
                  :disabled="submitting || !message.trim()"
                >
                  {{ submitting ? t('contactFeedback.sending') : t('contactFeedback.send') }}
                </BaseButton>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseButton from './BaseButton.vue'
import BaseAlert from './BaseAlert.vue'
import { notificationPreferencesService } from '../services/notificationPreferencesService'

const { t } = useI18n()

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const message = ref('')
const submitting = ref(false)
const success = ref(false)
const error = ref('')

const characterCount = computed(() => t('contactFeedback.characterCount', { count: message.value.length }))

// Reset form when modal opens
watch(() => props.isOpen, (newValue) => {
  if (newValue) {
    // Reset state when opening
    success.value = false
    error.value = ''
    // Don't clear message immediately - let user edit if they reopen
  } else {
    // Clear message when closing
    setTimeout(() => {
      message.value = ''
      success.value = false
      error.value = ''
    }, 300) // Wait for transition to complete
  }
})

function close() {
  emit('close')
}

async function submitFeedback() {
  submitting.value = true
  success.value = false
  error.value = ''

  try {
    // Validate message
    if (!message.value.trim()) {
      error.value = t('contactFeedback.errorRequired')
      return
    }

    // Call backend to send feedback
    const response = await notificationPreferencesService.submitFeedback(message.value.trim())

    if (response.success) {
      // Show success message
      success.value = true
      message.value = '' // Clear the form

      // Close modal after 2 seconds
      setTimeout(() => {
        close()
      }, 2000)
    } else {
      error.value = response.error || t('contactFeedback.errorFailed')
    }
  } catch (err) {
    error.value = t('contactFeedback.errorFailed')
  } finally {
    submitting.value = false
  }
}

// Close modal on Escape key
function handleEscape(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.isOpen) {
    close()
  }
}

// Add/remove escape key listener
watch(() => props.isOpen, (newValue) => {
  if (newValue) {
    document.addEventListener('keydown', handleEscape)
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden'
  } else {
    document.removeEventListener('keydown', handleEscape)
    document.body.style.overflow = ''
  }
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: var(--space-lg);
}

.modal-container {
  background: var(--bg-secondary);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-lg);
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-xl);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-title {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  color: var(--text-primary);
  margin: 0;
}

.close-button {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: var(--space-xs);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
}

.close-button:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.05);
}

.modal-body {
  padding: var(--space-xl);
}

.modal-description {
  color: var(--text-secondary);
  font-size: var(--text-sm);
  line-height: 1.6;
  margin-bottom: var(--space-lg);
}

.feedback-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.form-label {
  font-family: var(--font-heading);
  font-size: var(--text-sm);
  color: var(--text-primary);
  font-weight: 500;
}

.feedback-textarea {
  width: 100%;
  padding: var(--space-md);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  line-height: 1.6;
  resize: vertical;
  min-height: 150px;
  transition: all 0.2s ease;
}

.feedback-textarea:focus {
  outline: none;
  border-color: var(--primary-color);
  background: rgba(255, 255, 255, 0.08);
}

.feedback-textarea:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.feedback-textarea::placeholder {
  color: var(--text-tertiary);
}

.character-count {
  text-align: right;
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

.form-actions {
  display: flex;
  gap: var(--space-md);
  justify-content: flex-end;
}

/* Modal transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.95);
  opacity: 0;
}

/* Responsive */
@media (max-width: 640px) {
  .modal-overlay {
    padding: 0;
    align-items: flex-end;
  }

  .modal-container {
    max-height: 95vh;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  }

  .modal-header,
  .modal-body {
    padding: var(--space-lg);
  }

  .form-actions {
    flex-direction: column-reverse;
  }

  .form-actions button {
    width: 100%;
  }
}
</style>

<template>
  <div>
    <button
      class="floating-feedback-button"
      @click="openModal"
      :aria-label="t('contactFeedback.buttonAriaLabel')"
      :title="t('contactFeedback.modalTitle')"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
      <span class="button-text">{{ t('contactFeedback.buttonLabel') }}</span>
    </button>

    <ContactFeedbackModal :is-open="isModalOpen" @close="closeModal" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import ContactFeedbackModal from './ContactFeedbackModal.vue'

const { t } = useI18n()

const isModalOpen = ref(false)

function openModal() {
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
}
</script>

<style scoped>
.floating-feedback-button {
  position: fixed;
  bottom: var(--space-2xl);
  right: var(--space-2xl);
  z-index: 1000;

  display: flex;
  align-items: center;
  gap: var(--space-sm);

  background: var(--gold-primary);
  color: var(--text-on-gold);
  border: none;
  border-radius: var(--radius-full);
  padding: var(--space-md) var(--space-lg);

  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: 500;

  cursor: pointer;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3),
              0 4px 6px -2px rgba(0, 0, 0, 0.2);

  transition: all 0.3s ease;
}

.floating-feedback-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 15px 30px -5px rgba(0, 0, 0, 0.4),
              0 6px 8px -2px rgba(0, 0, 0, 0.3);
  background: var(--gold-light);
}

.floating-feedback-button:active {
  transform: translateY(0);
}

.floating-feedback-button svg {
  width: 20px;
  height: 20px;
  stroke-width: 2.5;
}

.button-text {
  white-space: nowrap;
}

/* Mobile optimization */
@media (max-width: 768px) {
  .floating-feedback-button {
    bottom: var(--space-xl);
    right: var(--space-lg);
    padding: var(--space-md);
    border-radius: var(--radius-full);
  }

  /* Show only icon on mobile */
  .button-text {
    display: none;
  }

  .floating-feedback-button svg {
    width: 24px;
    height: 24px;
  }
}

@media (max-width: 480px) {
  .floating-feedback-button {
    bottom: var(--space-lg);
    right: var(--space-md);
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .floating-feedback-button {
    transition: none;
  }

  .floating-feedback-button:hover {
    transform: none;
  }
}

/* Dark mode adjustments (if needed) */
:root[data-theme="dark"] .floating-feedback-button {
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5),
              0 4px 6px -2px rgba(0, 0, 0, 0.3);
}

:root[data-theme="dark"] .floating-feedback-button:hover {
  box-shadow: 0 15px 30px -5px rgba(0, 0, 0, 0.6),
              0 6px 8px -2px rgba(0, 0, 0, 0.4);
}
</style>

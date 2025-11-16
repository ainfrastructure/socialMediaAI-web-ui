<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import BaseButton from './BaseButton.vue'

interface Props {
  visible?: boolean
  disabled?: boolean
  loading?: boolean
  saved?: boolean
  restaurantName?: string
}

withDefaults(defineProps<Props>(), {
  visible: true,
  disabled: false,
  loading: false,
  saved: false
})

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'continue'): void
}>()

const { t } = useI18n()

const handleBack = () => {
  emit('back')
}

const handleContinue = () => {
  emit('continue')
}
</script>

<template>
  <div v-if="visible" class="sticky-cta">
    <div class="sticky-cta-content">
      <button
        class="back-button"
        @click="handleBack"
        :aria-label="t('restaurantSearch.backToSearch')"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </button>
      <BaseButton
        variant="primary"
        size="large"
        class="continue-button"
        :disabled="disabled"
        @click="handleContinue"
      >
        {{ loading
          ? t('restaurantSearch.saving')
          : t('restaurantSearch.saveAndContinue')
        }}
      </BaseButton>
    </div>
  </div>
</template>

<style scoped>
.sticky-cta {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--bg-secondary);
  border-top: 1px solid rgba(212, 175, 55, 0.2);
  backdrop-filter: blur(var(--blur-lg));
  z-index: 100;
  padding: var(--space-lg) var(--space-2xl);
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.sticky-cta-content {
  max-width: var(--max-width-2xl);
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-lg);
}

.back-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition-base);
  flex-shrink: 0;
}

.back-button:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: var(--gold-primary);
  color: var(--gold-primary);
  transform: translateX(-2px);
}

.back-button:active {
  transform: translateX(-2px) scale(0.95);
}

.continue-button {
  width: auto;
  min-width: 300px;
  max-width: 500px;
}

/* Responsive */
@media (max-width: 768px) {
  .sticky-cta {
    padding: var(--space-md) var(--space-lg);
  }

  .sticky-cta-content {
    gap: var(--space-md);
  }

  .back-button {
    width: 44px;
    height: 44px;
  }
}

@media (max-width: 480px) {
  .sticky-cta-content {
    flex-direction: column;
    width: 100%;
  }

  .continue-button {
    font-size: var(--text-sm);
    width: 100%;
    min-width: auto;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .sticky-cta {
    animation: none;
  }

  .back-button {
    transition: none;
  }

  .back-button:hover {
    transform: none;
  }

  .back-button:active {
    transform: none;
  }
}
</style>

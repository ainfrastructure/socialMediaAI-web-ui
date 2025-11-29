<script setup lang="ts">
import { ref } from 'vue'
import BaseButton from './BaseButton.vue'
import BaseCard from './BaseCard.vue'
import { useFacebookStore } from '@/stores/facebook'
import { usePreferencesStore } from '@/stores/preferences'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'connected'): void
}>()

const facebookStore = useFacebookStore()
const preferencesStore = usePreferencesStore()
const connecting = ref(false)

async function handleConnect() {
  connecting.value = true
  try {
    await facebookStore.connectFacebook()
    // OAuth redirect will happen, so this code may not execute
  } catch (error) {
    console.error('Facebook connection error:', error)
    connecting.value = false
  }
}

function handleRemindLater() {
  preferencesStore.markFacebookOnboardingSeen()
  emit('update:modelValue', false)
}

function handleClose() {
  emit('update:modelValue', false)
}
</script>

<template>
  <Transition name="modal">
    <div v-if="modelValue" class="modal-overlay" @click.self="handleClose">
      <BaseCard variant="glass-intense" class="modal-card">
        <!-- Close button -->
        <button class="close-button" @click="handleClose" :title="$t('common.close')">
          ✕
        </button>

        <!-- Icon -->
        <div class="modal-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="url(#facebook-gradient)"/>
            <defs>
              <linearGradient id="facebook-gradient" x1="0" y1="0" x2="24" y2="24">
                <stop offset="0%" stop-color="#D4AF37"/>
                <stop offset="100%" stop-color="#B8943D"/>
              </linearGradient>
            </defs>
          </svg>
        </div>

        <!-- Title -->
        <h2 class="modal-title">{{ $t('facebookOnboarding.title') }}</h2>

        <!-- Description -->
        <p class="modal-description">
          {{ $t('facebookOnboarding.description') }}
        </p>

        <!-- Benefits list -->
        <ul class="benefits-list">
          <li class="benefit-item">
            <span class="benefit-icon">✓</span>
            <span>{{ $t('facebookOnboarding.benefit1') }}</span>
          </li>
          <li class="benefit-item">
            <span class="benefit-icon">✓</span>
            <span>{{ $t('facebookOnboarding.benefit2') }}</span>
          </li>
          <li class="benefit-item">
            <span class="benefit-icon">✓</span>
            <span>{{ $t('facebookOnboarding.benefit3') }}</span>
          </li>
        </ul>

        <!-- Security note -->
        <div class="security-note">
          <span class="security-icon">🔒</span>
          <span class="security-text">{{ $t('facebookOnboarding.securityNote') }}</span>
        </div>

        <!-- Action buttons -->
        <div class="modal-actions">
          <BaseButton
            variant="primary"
            size="large"
            full-width
            :disabled="connecting"
            @click="handleConnect"
          >
            {{ connecting ? $t('facebookOnboarding.connecting') : $t('facebookOnboarding.connectButton') }}
          </BaseButton>

          <BaseButton
            variant="ghost"
            size="medium"
            full-width
            @click="handleRemindLater"
          >
            {{ $t('facebookOnboarding.remindLater') }}
          </BaseButton>
        </div>
      </BaseCard>
    </div>
  </Transition>
</template>

<style scoped>
/* Modal Overlay */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-xl);
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
}

/* Modal Card */
.modal-card {
  position: relative;
  max-width: 480px;
  width: 100%;
  padding: var(--space-3xl);
  text-align: center;
  animation: slideUp 0.3s var(--ease-smooth);
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

/* Close Button */
.close-button {
  position: absolute;
  top: var(--space-lg);
  right: var(--space-lg);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  font-size: var(--text-xl);
  cursor: pointer;
  transition: var(--transition-base);
}

.close-button:hover {
  background: var(--bg-elevated);
  color: var(--text-primary);
}

/* Icon */
.modal-icon {
  margin: 0 auto var(--space-xl);
  width: 64px;
  height: 64px;
}

/* Title */
.modal-title {
  font-family: var(--font-heading);
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  margin-bottom: var(--space-lg);
}

/* Description */
.modal-description {
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--text-secondary);
  line-height: var(--leading-normal);
  margin-bottom: var(--space-2xl);
}

/* Benefits List */
.benefits-list {
  list-style: none;
  padding: 0;
  margin: 0 0 var(--space-2xl) 0;
  text-align: left;
}

.benefit-item {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md);
  font-size: var(--text-base);
  color: var(--text-secondary);
  line-height: var(--leading-normal);
}

.benefit-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  border-radius: var(--radius-full);
  background: var(--gold-subtle);
  color: var(--gold-primary);
  font-weight: var(--font-bold);
  font-size: var(--text-sm);
}

/* Security Note */
.security-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  padding: var(--space-md);
  margin-bottom: var(--space-2xl);
  background: var(--bg-elevated);
  border-radius: var(--radius-md);
  border: var(--border-width) solid var(--border-color);
}

.security-icon {
  font-size: var(--text-lg);
}

.security-text {
  font-size: var(--text-sm);
  color: var(--text-muted);
}

/* Actions */
.modal-actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s var(--ease-smooth);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-card {
  animation: slideUp 0.3s var(--ease-smooth);
}

.modal-leave-active .modal-card {
  animation: slideDown 0.3s var(--ease-smooth);
}

@keyframes slideDown {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(20px);
  }
}

/* Responsive */
@media (max-width: 640px) {
  .modal-overlay {
    padding: var(--space-lg);
  }

  .modal-card {
    padding: var(--space-2xl);
  }

  .modal-title {
    font-size: var(--text-2xl);
  }

  .modal-description {
    font-size: var(--text-sm);
  }

  .benefit-item {
    font-size: var(--text-sm);
  }
}

/* Reduce motion */
@media (prefers-reduced-motion: reduce) {
  .modal-card,
  .modal-enter-active .modal-card,
  .modal-leave-active .modal-card {
    animation: none;
  }
}
</style>

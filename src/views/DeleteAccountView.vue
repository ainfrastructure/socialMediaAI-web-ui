<template>
  <DashboardLayout>
    <div class="delete-account-view">
      <div class="delete-container">
        <!-- Header with warning -->
        <div class="warning-header">
          <div class="warning-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h1 class="page-title">{{ $t('deleteAccount.pageTitle') }}</h1>
          <p class="warning-text">{{ $t('deleteAccount.warning') }}</p>
        </div>

        <BaseCard variant="glass" class="delete-card">
          <!-- Step 1: Warning about consequences -->
          <div v-if="currentStep === 1" class="step-content">
            <h2 class="step-title">{{ $t('deleteAccount.step1Title') }}</h2>
            <p class="step-description">{{ $t('deleteAccount.step1Description') }}</p>

            <ul class="data-list">
              <li>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="list-icon">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {{ $t('deleteAccount.dataList.restaurants') }}
              </li>
              <li>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="list-icon">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {{ $t('deleteAccount.dataList.posts') }}
              </li>
              <li>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="list-icon">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {{ $t('deleteAccount.dataList.favorites') }}
              </li>
              <li>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="list-icon">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {{ $t('deleteAccount.dataList.connections') }}
              </li>
              <li>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="list-icon">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {{ $t('deleteAccount.dataList.subscription') }}
              </li>
              <li>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="list-icon">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {{ $t('deleteAccount.dataList.history') }}
              </li>
            </ul>

            <div class="button-group">
              <BaseButton variant="secondary" @click="goBack">
                {{ $t('deleteAccount.cancelButton') }}
              </BaseButton>
              <BaseButton variant="danger" @click="nextStep">
                {{ $t('deleteAccount.continueButton') }}
              </BaseButton>
            </div>
          </div>

          <!-- Step 2: Checkbox confirmations + Delete button -->
          <div v-if="currentStep === 2" class="step-content">
            <h2 class="step-title">{{ $t('deleteAccount.step2Title') }}</h2>

            <div class="confirmations">
              <label class="confirmation-item">
                <input
                  type="checkbox"
                  v-model="confirmations.understandDataLoss"
                />
                <span>{{ $t('deleteAccount.confirmDataLoss') }}</span>
              </label>

              <label class="confirmation-item">
                <input
                  type="checkbox"
                  v-model="confirmations.understandNoRecovery"
                />
                <span>{{ $t('deleteAccount.confirmNoRecovery') }}</span>
              </label>

              <label class="confirmation-item">
                <input
                  type="checkbox"
                  v-model="confirmations.understandImmediateEffect"
                />
                <span>{{ $t('deleteAccount.confirmImmediateEffect') }}</span>
              </label>
            </div>

            <!-- Optional reason -->
            <div class="reason-section">
              <h3 class="reason-title">{{ $t('deleteAccount.reasonTitle') }}</h3>
              <p class="reason-description">{{ $t('deleteAccount.reasonDescription') }}</p>
              <textarea
                v-model="reason"
                :placeholder="$t('deleteAccount.reasonPlaceholder')"
                rows="3"
                class="reason-textarea"
              />
            </div>

            <BaseButton
              variant="secondary"
              class="back-button-centered"
              @click="prevStep"
              :disabled="isDeleting"
            >
              {{ $t('deleteAccount.backButton') }}
            </BaseButton>

            <!-- Big delete button -->
            <BaseButton
              variant="danger"
              size="large"
              class="delete-button-large"
              @click="performDeletion"
              :disabled="!allConfirmationsChecked || isDeleting"
            >
              {{ isDeleting ? $t('deleteAccount.deleting') : $t('deleteAccount.deleteButton') }}
            </BaseButton>
          </div>

          <!-- Error message -->
          <BaseAlert v-if="error" type="error" class="error-message">
            {{ error }}
          </BaseAlert>
        </BaseCard>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import { authService } from '../services/authService'
import DashboardLayout from '../components/DashboardLayout.vue'
import BaseCard from '../components/BaseCard.vue'
import BaseButton from '../components/BaseButton.vue'
import BaseAlert from '../components/BaseAlert.vue'

const { t } = useI18n()
const router = useRouter()
const authStore = useAuthStore()

const currentStep = ref(1)
const isDeleting = ref(false)
const error = ref('')
const reason = ref('')

const confirmations = ref({
  understandDataLoss: false,
  understandNoRecovery: false,
  understandImmediateEffect: false,
})

const allConfirmationsChecked = computed(() =>
  confirmations.value.understandDataLoss &&
  confirmations.value.understandNoRecovery &&
  confirmations.value.understandImmediateEffect
)

function nextStep() {
  if (currentStep.value < 2) {
    currentStep.value++
    error.value = ''
  }
}

function prevStep() {
  if (currentStep.value > 1) {
    currentStep.value--
    error.value = ''
  }
}

function goBack() {
  router.push('/dashboard')
}

async function performDeletion() {
  if (!allConfirmationsChecked.value) return

  isDeleting.value = true
  error.value = ''

  try {
    const result = await authService.deleteAccount({
      reason: reason.value || undefined,
      confirmations: confirmations.value,
    })

    if (result.success) {
      await authStore.logout()
      router.push('/goodbye')
    } else {
      error.value = result.error || t('deleteAccount.errorGeneric')
    }
  } catch (err) {
    error.value = t('deleteAccount.errorGeneric')
  } finally {
    isDeleting.value = false
  }
}
</script>

<style scoped>
.delete-account-view {
  min-height: 100vh;
  min-height: 100dvh;
  padding: var(--space-3xl) var(--space-2xl);
  background: var(--bg-primary);
  width: 100%;
  max-width: 100vw;
  overflow-x: hidden;
}

.delete-container {
  max-width: 600px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-2xl);
}

/* Warning Header */
.warning-header {
  text-align: center;
  margin-bottom: var(--space-xl);
}

.warning-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto var(--space-xl);
  background: rgba(239, 68, 68, 0.2);
  border: 2px solid rgba(239, 68, 68, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.warning-icon svg {
  width: 40px;
  height: 40px;
  color: #fca5a5;
}

.page-title {
  font-family: var(--font-heading);
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  color: #fca5a5;
  margin-bottom: var(--space-md);
}

.warning-text {
  color: var(--text-secondary);
  font-size: var(--text-lg);
}

/* Delete Card */
.delete-card {
  padding: var(--space-3xl);
  animation: fadeInUp 0.6s var(--ease-smooth);
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

/* Step Content */
.step-content {
  animation: fadeIn 0.3s var(--ease-smooth);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.step-title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  color: var(--text-primary);
  margin-bottom: var(--space-md);
}

.step-description {
  color: var(--text-secondary);
  margin-bottom: var(--space-xl);
  line-height: var(--leading-relaxed);
}

/* Data List */
.data-list {
  list-style: none;
  padding: 0;
  margin: 0 0 var(--space-2xl) 0;
}

.data-list li {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-lg);
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-sm);
  color: var(--text-primary);
  font-size: var(--text-base);
}

.list-icon {
  width: 20px;
  height: 20px;
  color: #fca5a5;
  flex-shrink: 0;
}

/* Confirmations */
.confirmations {
  margin-bottom: var(--space-2xl);
}

.confirmation-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-md);
  padding: var(--space-lg);
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(212, 175, 55, 0.1);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-md);
  cursor: pointer;
  transition: var(--transition-base);
}

.confirmation-item:hover {
  border-color: rgba(212, 175, 55, 0.3);
  background: rgba(0, 0, 0, 0.4);
}

.confirmation-item input[type="checkbox"] {
  width: 20px;
  height: 20px;
  margin-top: 2px;
  flex-shrink: 0;
  accent-color: var(--gold-primary);
  cursor: pointer;
}

.confirmation-item span {
  color: var(--text-primary);
  line-height: var(--leading-relaxed);
}

/* Reason Section */
.reason-section {
  margin-bottom: var(--space-2xl);
  padding: var(--space-xl);
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(212, 175, 55, 0.1);
  border-radius: var(--radius-md);
}

.reason-title {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  color: var(--text-primary);
  margin-bottom: var(--space-sm);
}

.reason-description {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin-bottom: var(--space-md);
}

.reason-textarea {
  width: 100%;
  padding: var(--space-md);
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: var(--text-base);
  resize: vertical;
  transition: var(--transition-base);
}

.reason-textarea:focus {
  outline: none;
  border-color: rgba(212, 175, 55, 0.5);
}

.reason-textarea::placeholder {
  color: var(--text-muted);
}

/* Large Delete Button */
.delete-button-large {
  width: 100%;
  margin-top: var(--space-xl);
  padding: var(--space-lg) var(--space-2xl);
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
}

/* Centered Back Button */
.back-button-centered {
  display: block;
  margin: var(--space-xl) auto 0;
}

/* Button Group */
.button-group {
  display: flex;
  gap: var(--space-md);
  justify-content: flex-end;
  margin-top: var(--space-xl);
}

/* Error Message */
.error-message {
  margin-top: var(--space-xl);
}

/* Responsive */
@media (max-width: 768px) {
  .delete-account-view {
    padding: var(--space-xl) var(--space-lg);
  }

  .delete-card {
    padding: var(--space-2xl);
  }

  .page-title {
    font-size: var(--text-2xl);
  }

  .button-group {
    flex-direction: column;
  }

  .button-group button {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .delete-account-view {
    padding: var(--space-lg) var(--space-sm);
  }

  .delete-card {
    padding: var(--space-lg);
  }

  .warning-icon {
    width: 64px;
    height: 64px;
  }

  .warning-icon svg {
    width: 32px;
    height: 32px;
  }

  .page-title {
    font-size: var(--text-xl);
  }

  .step-title {
    font-size: var(--text-lg);
  }
}

/* Reduce motion */
@media (prefers-reduced-motion: reduce) {
  .delete-card,
  .step-content {
    animation: none;
  }
}
</style>

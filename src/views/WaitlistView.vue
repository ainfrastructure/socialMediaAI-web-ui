<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { api } from '../services/api'
import BaseCard from '../components/BaseCard.vue'
import BaseButton from '../components/BaseButton.vue'
import BaseAlert from '../components/BaseAlert.vue'
import BaseInput from '../components/BaseInput.vue'

const router = useRouter()
const { t } = useI18n()

const email = ref('')
const loading = ref(false)
const success = ref(false)
const error = ref('')
const waitlistCount = ref(0)
const countLoading = ref(true)
const countFailed = ref(false)

// Base count offset (fake starting count)
const BASE_COUNT = 110

onMounted(async () => {
  // Fetch current waitlist count
  countLoading.value = true
  countFailed.value = false
  try {
    const response = await api.getWaitlistCount()
    // Backend returns { success: true, count: X } directly
    const count = (response as any).count ?? response.data?.count
    if (response.success && count !== undefined) {
      waitlistCount.value = BASE_COUNT + count
    } else {
      countFailed.value = true
    }
  } catch {
    countFailed.value = true
  } finally {
    countLoading.value = false
  }
})

async function handleSubmit() {
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email.value || !emailRegex.test(email.value)) {
    error.value = t('waitlist.invalidEmail')
    return
  }

  loading.value = true
  error.value = ''

  try {
    const response = await api.joinWaitlist(email.value)

    if (response.success) {
      success.value = true
      // Update count with new value from backend
      const newCount = (response as any).count ?? response.data?.count
      if (newCount !== undefined) {
        waitlistCount.value = BASE_COUNT + newCount
      } else {
        waitlistCount.value += 1
      }
    } else if ((response as any).error === 'already_on_waitlist') {
      error.value = t('waitlist.alreadyOnList')
    } else {
      error.value = response.error || t('waitlist.error')
    }
  } catch {
    error.value = t('waitlist.error')
  } finally {
    loading.value = false
  }
}

function goToLogin() {
  router.push('/login')
}
</script>

<template>
  <div class="waitlist-container">
    <!-- Background Image -->
    <div class="background-image"></div>
    <div class="background-overlay"></div>

    <!-- Content -->
    <div class="content">
      <!-- Logo -->
      <img
        src="../assets/socialchef_logo.svg"
        alt="SocialChef Logo"
        class="logo"
      />

      <!-- Headline -->
      <h1 class="headline">{{ $t('waitlist.headline') }}</h1>
      <p class="subheadline">{{ $t('waitlist.subheadline') }}</p>

      <!-- Social Proof (only show when not failed) -->
      <p v-if="!countFailed" class="social-proof">
        <span v-if="countLoading" class="count-spinner"></span>
        <template v-else>
          {{ $t('waitlist.socialProof', { count: waitlistCount }) }}
        </template>
      </p>

      <!-- Coming Soon (show when count fetch failed) -->
      <template v-if="countFailed">
        <p class="coming-soon">{{ $t('waitlist.comingSoon') }}</p>
      </template>

      <!-- Form Card (hide when count failed) -->
      <BaseCard v-else variant="glass-intense" class="form-card">
        <!-- Success State -->
        <div v-if="success" class="success-state">
          <div class="success-icon">✓</div>
          <h2 class="success-title">{{ $t('waitlist.successTitle') }}</h2>
          <p class="success-message">{{ $t('waitlist.successMessage') }}</p>
        </div>

        <!-- Form -->
        <form v-else @submit.prevent="handleSubmit" class="waitlist-form">
          <BaseAlert v-if="error" type="error" :dismissible="true" @close="error = ''">
            {{ error }}
          </BaseAlert>

          <div class="input-row">
            <BaseInput
              v-model="email"
              type="email"
              :placeholder="$t('waitlist.emailPlaceholder')"
              required
              class="email-input"
            />
            <BaseButton
              type="submit"
              variant="primary"
              size="large"
              :disabled="loading"
              class="submit-button"
            >
              {{ loading ? $t('waitlist.joining') : $t('waitlist.joinButton') }}
            </BaseButton>
          </div>
        </form>
      </BaseCard>

      <!-- Login Link -->
      <p class="login-link">
        {{ $t('waitlist.loginLink') }}
        <a href="#" @click.prevent="goToLogin" class="login-link-text">
          {{ $t('waitlist.loginLinkText') }}
        </a>
      </p>
    </div>
  </div>
</template>

<style scoped>
.waitlist-container {
  min-height: 100vh;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.background-image {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url('/background.jpeg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  z-index: 0;
}

.background-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(10, 10, 10, 0.75);
  z-index: 1;
}

.content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--space-xl);
  max-width: 700px;
  width: 100%;
  animation: fadeInUp 0.8s var(--ease-smooth);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes logoFloat {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6px);
  }
}

.logo {
  height: 160px;
  width: auto;
  margin-bottom: var(--space-3xl);
  filter: drop-shadow(0 6px 30px rgba(212, 175, 55, 0.5));
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.4s ease;
  cursor: pointer;
  animation: logoFloat 4s ease-in-out infinite;
}

.logo:hover {
  filter: drop-shadow(0 10px 40px rgba(212, 175, 55, 0.7));
  transform: scale(1.08) translateY(-4px);
  animation: none;
}

.headline {
  font-family: var(--font-heading);
  font-size: var(--text-4xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  margin-bottom: var(--space-lg);
  line-height: 1.2;
  text-shadow: 0 2px 20px rgba(0, 0, 0, 0.5);
}

.subheadline {
  font-family: var(--font-body);
  font-size: var(--text-lg);
  color: var(--text-secondary);
  margin-bottom: var(--space-xl);
  line-height: var(--leading-relaxed);
  max-width: 550px;
}

.social-proof {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  color: var(--gold-primary);
  margin-bottom: var(--space-2xl);
  font-weight: var(--font-medium);
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 20px;
}

.count-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--gold-subtle);
  border-top-color: var(--gold-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.coming-soon {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  color: var(--gold-primary);
  margin-bottom: var(--space-2xl);
  font-weight: var(--font-semibold);
  letter-spacing: 1px;
}

.form-card {
  width: 100%;
  max-width: 650px;
  padding: var(--space-2xl) var(--space-3xl);
}

.waitlist-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.input-row {
  display: flex;
  gap: var(--space-md);
  align-items: flex-start;
}

.email-input {
  flex: 1;
  min-width: 0;
}

.email-input :deep(.form-group) {
  margin-bottom: 0;
}

.email-input :deep(input) {
  font-size: var(--text-lg);
  padding: var(--space-lg) var(--space-xl);
  min-height: 56px;
}

.submit-button {
  flex-shrink: 0;
  white-space: nowrap;
  min-height: 56px;
  padding: var(--space-lg) var(--space-2xl);
  font-size: var(--text-lg);
}

/* Success State */
.success-state {
  text-align: center;
  padding: var(--space-xl) 0;
}

.success-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--gradient-gold);
  color: var(--text-on-gold);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: bold;
  margin: 0 auto var(--space-xl);
  animation: scaleIn 0.4s var(--ease-smooth);
}

@keyframes scaleIn {
  from {
    transform: scale(0);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.success-title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  color: var(--text-primary);
  margin-bottom: var(--space-md);
}

.success-message {
  font-size: var(--text-base);
  color: var(--text-secondary);
}

/* Login Link */
.login-link {
  margin-top: var(--space-2xl);
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.login-link-text {
  color: var(--gold-primary);
  text-decoration: none;
  font-weight: var(--font-medium);
  transition: var(--transition-fast);
}

.login-link-text:hover {
  color: var(--gold-light);
  text-decoration: underline;
}

/* Responsive */
@media (max-width: 640px) {
  .background-image {
    /* Center on the food/plate area instead of top which might show just decorations */
    background-position: center 40%;
    background-size: cover;
  }

  .content {
    padding: var(--space-lg);
  }

  .logo {
    height: 120px;
  }

  .headline {
    font-size: var(--text-3xl);
  }

  .subheadline {
    font-size: var(--text-base);
  }

  .input-row {
    flex-direction: column;
    width: 100%;
    gap: var(--space-md);
  }

  .email-input {
    width: 100%;
  }

  .email-input :deep(.form-group) {
    width: 100%;
    margin-bottom: 0;
  }

  .submit-button {
    width: 100%;
  }

  .form-card {
    padding: var(--space-xl);
  }

  .email-input :deep(input) {
    width: 100%;
    font-size: var(--text-base);
    padding: var(--space-md) var(--space-lg);
    min-height: 48px;
  }

  .submit-button {
    min-height: 48px;
    font-size: var(--text-base);
  }
}

@media (max-width: 400px) {
  .headline {
    font-size: var(--text-2xl);
  }

  .logo {
    height: 100px;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .content,
  .logo,
  .success-icon {
    animation: none;
  }
}
</style>

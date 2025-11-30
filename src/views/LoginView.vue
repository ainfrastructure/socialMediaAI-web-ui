<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import { api } from '../services/api'
import BaseCard from '../components/BaseCard.vue'
import BaseButton from '../components/BaseButton.vue'
import BaseAlert from '../components/BaseAlert.vue'
import BaseInput from '../components/BaseInput.vue'

const router = useRouter()
const authStore = useAuthStore()
const { t } = useI18n()

const disableSignup = ref(true)
const isSignup = ref(false)
const showMagicLink = ref(false)
const showForgotPassword = ref(false)
const email = ref('')
const password = ref('')
const message = ref('')
const messageType = ref<'success' | 'error' | 'info'>('info')

// Handle email confirmation token from URL hash
onMounted(() => {
  const hash = window.location.hash
  if (hash) {
    const params = new URLSearchParams(hash.substring(1))
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')
    const type = params.get('type')

    if (accessToken && type === 'signup') {
      // Store the tokens
      localStorage.setItem('access_token', accessToken)
      if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken)
      }

      showMessage('Email confirmed! Loading your profile...', 'success')

      // Load profile and redirect
      setTimeout(async () => {
        await authStore.loadProfile()
        if (authStore.isAuthenticated) {
          router.push('/playground')
        } else {
          showMessage('Please login to continue', 'info')
          window.location.hash = '' // Clear hash
        }
      }, 1000)
    }
  }
})

async function handleSubmit() {
  if (!email.value || !password.value) {
    showMessage(t('auth.invalidCredentials'), 'error')
    return
  }

  if (isSignup.value) {
    const result = await authStore.signup(email.value, password.value)

    if (!result.success) {
      showMessage(result.error || t('errors.generic'), 'error')
      return
    }

    if (result.emailConfirmationRequired) {
      showMessage(
        result.message || t('auth.checkEmail'),
        'info',
      )
      isSignup.value = false
      return
    }

    showMessage(t('common.success'), 'success')
    router.push('/dashboard')
  } else {
    const result = await authStore.login(email.value, password.value)

    if (!result.success) {
      showMessage(result.error || t('errors.generic'), 'error')
      return
    }

    showMessage(t('common.success'), 'success')
    router.push('/dashboard')
  }
}

function showMessage(msg: string, type: 'success' | 'error' | 'info') {
  message.value = msg
  messageType.value = type
  setTimeout(() => (message.value = ''), 5000)
}

function toggleMode() {
  isSignup.value = !isSignup.value
  showMagicLink.value = false
  showForgotPassword.value = false
  message.value = ''
}

function toggleMagicLink() {
  showMagicLink.value = !showMagicLink.value
  isSignup.value = false
  showForgotPassword.value = false
  message.value = ''
}

function toggleForgotPassword() {
  showForgotPassword.value = !showForgotPassword.value
  isSignup.value = false
  showMagicLink.value = false
  message.value = ''
}

async function handleMagicLink() {
  if (!email.value) {
    showMessage(t('errors.validationError'), 'error')
    return
  }

  try {
    const response = await api.sendMagicLink(email.value)

    if (!response.success) {
      showMessage(response.error || t('errors.generic'), 'error')
      return
    }

    showMessage(t('auth.checkEmail'), 'success')
  } catch (err: any) {
    showMessage(err.message || t('errors.networkError'), 'error')
  }
}

async function handleForgotPassword() {
  if (!email.value) {
    showMessage(t('errors.validationError'), 'error')
    return
  }

  try {
    const response = await api.requestPasswordReset(email.value)

    if (!response.success) {
      showMessage(response.error || t('errors.generic'), 'error')
      return
    }

    showMessage(t('auth.checkEmail'), 'success')
  } catch (err: any) {
    showMessage(err.message || t('errors.networkError'), 'error')
  }
}
</script>

<template>
  <div class="login-container">
    <BaseCard variant="glass-intense" class="login-card">
      <div class="header">
        <img src="../assets/socialchef_logo.svg" alt="SocialChef Logo" class="brand-logo" />
        <h1 class="brand-title">SocialChef</h1>
        <p class="brand-subtitle">{{ $t('auth.brandSubtitle') }}</p>
      </div>

      <BaseAlert
        v-if="message"
        :type="messageType"
        :model-value="!!message"
        @update:model-value="message = ''"
      >
        {{ message }}
      </BaseAlert>

      <form v-if="!showMagicLink && !showForgotPassword" @submit.prevent="handleSubmit">
        <BaseInput
          v-model="email"
          type="email"
          :label="$t('auth.email')"
          :placeholder="$t('auth.emailPlaceholder')"
          required
        />

        <BaseInput
          v-model="password"
          type="password"
          :label="$t('auth.password')"
          :placeholder="$t('auth.passwordPlaceholder')"
          required
        />

        <BaseButton
          type="submit"
          variant="primary"
          size="large"
          full-width
          :disabled="authStore.loading"
        >
          {{ isSignup ? $t('auth.signUp') : $t('auth.signIn') }}
        </BaseButton>

        <BaseButton
          v-if="!disableSignup"
          type="button"
          variant="ghost"
          size="medium"
          full-width
          @click="toggleMode"
        >
          <template v-if="isSignup">{{ $t('auth.login') }}</template>
          <template v-else>{{ $t('auth.dontHaveAccount') }} {{ $t('auth.signUp') }}</template>
        </BaseButton>

        <div v-if="!disableSignup" class="divider">
          <span>{{ $t('common.or') }}</span>
        </div>

        <BaseButton
          v-if="!disableSignup"
          type="button"
          variant="ghost"
          size="small"
          full-width
          @click="toggleMagicLink"
        >
          {{ $t('auth.loginWithMagicLink') }}
        </BaseButton>

        <BaseButton
          v-if="!disableSignup"
          type="button"
          variant="ghost"
          size="small"
          full-width
          @click="toggleForgotPassword"
        >
          {{ $t('auth.forgotPassword') }}
        </BaseButton>
      </form>

      <!-- Magic Link Form -->
      <form v-if="showMagicLink" @submit.prevent="handleMagicLink">
        <BaseInput
          v-model="email"
          type="email"
          :label="$t('auth.email')"
          :placeholder="$t('auth.emailPlaceholder')"
          required
        />

        <BaseButton
          type="submit"
          variant="primary"
          size="large"
          full-width
          :disabled="authStore.loading"
        >
          {{ $t('auth.sendMagicLink') }}
        </BaseButton>

        <BaseButton
          type="button"
          variant="secondary"
          size="medium"
          full-width
          @click="toggleMagicLink"
        >
          {{ $t('auth.backToLogin') }}
        </BaseButton>
      </form>

      <!-- Forgot Password Form -->
      <form v-if="showForgotPassword" @submit.prevent="handleForgotPassword">
        <BaseInput
          v-model="email"
          type="email"
          :label="$t('auth.email')"
          :placeholder="$t('auth.emailPlaceholder')"
          required
        />

        <BaseButton
          type="submit"
          variant="primary"
          size="large"
          full-width
          :disabled="authStore.loading"
        >
          {{ $t('auth.sendResetLink') }}
        </BaseButton>

        <BaseButton
          type="button"
          variant="secondary"
          size="medium"
          full-width
          @click="toggleForgotPassword"
        >
          {{ $t('auth.backToLogin') }}
        </BaseButton>
      </form>
    </BaseCard>
  </div>
</template>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-xl);
}

.login-card {
  max-width: 440px;
  width: 100%;
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

.header {
  text-align: center;
  margin-bottom: var(--space-3xl);
}

.brand-logo {
  height: 80px;
  width: auto;
  margin: 0 auto var(--space-xl);
  display: block;
  filter: drop-shadow(0 4px 12px rgba(212, 175, 55, 0.3));
  transition: var(--transition-base);
}

.brand-logo:hover {
  filter: drop-shadow(0 6px 16px rgba(212, 175, 55, 0.4));
  transform: scale(1.05);
}

.brand-title {
  font-family: var(--font-heading);
  font-size: var(--text-4xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  margin-bottom: var(--space-md);
  background: var(--gradient-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.brand-subtitle {
  font-size: var(--text-base);
  color: var(--text-secondary);
  font-weight: var(--font-normal);
}

form {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: var(--space-lg) 0;
  color: var(--text-muted);
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  border-bottom: var(--border-width) solid var(--border-color);
}

.divider span {
  padding: 0 var(--space-lg);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  letter-spacing: 0.05em;
}

/* Responsive */
@media (max-width: 480px) {
  .login-container {
    padding: var(--space-lg);
  }

  .brand-logo {
    height: 60px;
  }

  .brand-title {
    font-size: var(--text-3xl);
  }
}
</style>

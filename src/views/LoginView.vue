<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import { useLogin } from '../composables/useLogin'
import BaseCard from '../components/BaseCard.vue'
import BaseButton from '../components/BaseButton.vue'
import BaseAlert from '../components/BaseAlert.vue'
import BaseInput from '../components/BaseInput.vue'
import AppleIcon from '../components/icons/AppleIcon.vue'
import GoogleIcon from '../components/icons/GoogleIcon.vue'
import FacebookIcon from '../components/icons/FacebookIcon.vue'

const router = useRouter()
const authStore = useAuthStore()
const { t } = useI18n()

const {
  showEmailLogin,
  email,
  message,
  messageType,
  loggingIn,
  lastUsedProvider,
  loading,
  isDev,
  showMessage,
  toggleEmailLogin,
  handleEmailLogin: doEmailLogin,
  handleAppleSignIn,
  handleGoogleSignIn,
  handleFacebookSignIn,
} = useLogin()

// Handle email confirmation token from URL hash
onMounted(() => {
  const hash = window.location.hash
  if (hash) {
    const params = new URLSearchParams(hash.substring(1))
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')
    const type = params.get('type')

    if (accessToken && (type === 'signup' || type === 'magiclink')) {
      // Store the tokens
      localStorage.setItem('access_token', accessToken)
      if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken)
      }

      showMessage(t('auth.emailConfirmed'), 'success')

      // Load profile and redirect
      setTimeout(async () => {
        await authStore.loadProfile()
        if (authStore.isAuthenticated) {
          if (authStore.hasActiveSubscription) {
            router.push('/posts')
          } else {
            router.push('/plans')
          }
        } else {
          showMessage(t('auth.pleaseLogin'), 'info')
          window.location.hash = '' // Clear hash
        }
      }, 1000)
    }
  }
})

async function handleEmailLogin() {
  const result = await doEmailLogin()
  if (result.success) {
    if (authStore.hasActiveSubscription) {
      router.push('/posts')
    } else {
      router.push('/plans')
    }
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

      <!-- Login Content Wrapper -->
      <div class="login-content-wrapper">
        <!-- Main Login View: Social Sign In -->
        <div :class="['login-content', { 'is-hidden': showEmailLogin }]">
          <!-- Social Sign In Buttons -->
          <div class="social-buttons">
            <div class="social-button-wrapper">
              <button
                type="button"
                class="social-sign-in-button apple-button"
                :disabled="loading"
                @click="handleAppleSignIn"
              >
                <AppleIcon :size="20" />
                <span>{{ $t('auth.continueWithApple') }}</span>
              </button>
              <span v-if="lastUsedProvider === 'apple'" class="last-used-badge">
                {{ $t('auth.lastUsed') }}
              </span>
            </div>

            <div class="social-button-wrapper">
              <button
                type="button"
                class="social-sign-in-button google-button"
                :disabled="loading"
                @click="handleGoogleSignIn"
              >
                <GoogleIcon :size="20" />
                <span>{{ $t('auth.continueWithGoogle') }}</span>
              </button>
              <span v-if="lastUsedProvider === 'google'" class="last-used-badge">
                {{ $t('auth.lastUsed') }}
              </span>
            </div>

            <div class="social-button-wrapper">
              <button
                type="button"
                class="social-sign-in-button facebook-button"
                :disabled="loading"
                @click="handleFacebookSignIn"
              >
                <FacebookIcon :size="20" />
                <span>{{ $t('auth.continueWithFacebook') }}</span>
              </button>
              <span v-if="lastUsedProvider === 'facebook'" class="last-used-badge">
                {{ $t('auth.lastUsed') }}
              </span>
            </div>
          </div>

          <!-- Email Sign In Link -->
          <button
            type="button"
            class="email-link"
            @click="toggleEmailLogin"
          >
            {{ $t('auth.signInWithEmail') }}
          </button>
        </div>

        <!-- Email Login Form -->
        <div :class="['login-content', 'email-content', { 'is-visible': showEmailLogin }]">
          <form @submit.prevent="handleEmailLogin">
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
              :disabled="loggingIn"
            >
              {{ loggingIn ? $t('common.loading') : (isDev ? 'Dev Login (bypass)' : $t('auth.signIn')) }}
            </BaseButton>
          </form>

          <!-- Back to Social Login -->
          <button
            type="button"
            class="back-link"
            @click="toggleEmailLogin"
          >
            ← {{ $t('auth.backToLogin') }}
          </button>
        </div>
      </div>

      <!-- Legal Links -->
      <div class="legal-links">
        <router-link to="/privacy-policy">{{ $t('auth.privacyPolicy') }}</router-link>
        <span class="separator">·</span>
        <router-link to="/terms">{{ $t('auth.termsOfService') }}</router-link>
      </div>
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
  filter: drop-shadow(0 4px 12px rgba(176, 138, 90, 0.3));
  transition: var(--transition-base);
}

.brand-logo:hover {
  filter: drop-shadow(0 6px 16px rgba(176, 138, 90, 0.4));
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

/* Social Sign In Buttons */
.social-buttons {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.social-button-wrapper {
  position: relative;
  transition: transform var(--transition-base);
}

.social-button-wrapper:hover {
  transform: translateY(-1px);
}

.last-used-badge {
  position: absolute;
  top: -8px;
  right: -4px;
  background: var(--bg-secondary);
  color: var(--gold-primary);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  border: 1px solid var(--gold-primary);
  pointer-events: none;
}

.social-sign-in-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
  width: 100%;
  padding: var(--space-lg) var(--space-xl);
  border: none;
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: var(--transition-base);
}

.social-sign-in-button:active:not(:disabled) {
  transform: translateY(1px);
}

.social-sign-in-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Apple Button */
.apple-button {
  background: #000000;
  color: #ffffff;
}

.apple-button:hover:not(:disabled) {
  background: #333333;
}

/* Google Button */
.google-button {
  background: #ffffff;
  color: #1f1f1f;
  border: 1px solid var(--border-color);
}

.google-button:hover:not(:disabled) {
  background: #f5f5f5;
}

/* Facebook Button */
.facebook-button {
  background: #1877F2;
  color: #ffffff;
}

.facebook-button:hover:not(:disabled) {
  background: #166fe5;
}

/* Login Content Wrapper - enables smooth crossfade */
.login-content-wrapper {
  position: relative;
  min-height: 200px;
}

/* Login Content Container */
.login-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  transition: opacity 0.2s ease, transform 0.2s ease;
}

/* Social login - default visible */
.login-content.is-hidden {
  opacity: 0;
  transform: translateY(-8px);
  pointer-events: none;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
}

/* Email login - initially hidden */
.login-content.email-content {
  opacity: 0;
  transform: translateY(8px);
  pointer-events: none;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
}

/* Email login - visible state */
.login-content.email-content.is-visible {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
  position: relative;
}

/* Email Sign In Link */
.email-link {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  cursor: pointer;
  padding: var(--space-md) 0;
  transition: color 0.15s ease;
  text-align: center;
  margin-top: var(--space-sm);
}

.email-link:hover {
  color: var(--gold-primary);
}

/* Back Link */
.back-link {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  cursor: pointer;
  padding: var(--space-md) 0;
  transition: color 0.15s ease;
  text-align: center;
}

.back-link:hover {
  color: var(--gold-primary);
}

/* Legal Links */
.legal-links {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  margin-top: var(--space-2xl);
  padding-top: var(--space-xl);
  border-top: 1px solid var(--border-color);
}

.legal-links a {
  color: var(--text-muted);
  font-size: var(--text-xs);
  text-decoration: none;
  transition: color 0.15s ease;
}

.legal-links a:hover {
  color: var(--gold-primary);
}

.legal-links .separator {
  color: var(--text-muted);
  font-size: var(--text-xs);
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

<script setup lang="ts">
import { watch } from 'vue'
import { useLogin } from '../composables/useLogin'
import BaseModal from './BaseModal.vue'
import BaseButton from './BaseButton.vue'
import BaseAlert from './BaseAlert.vue'
import BaseInput from './BaseInput.vue'
import AppleIcon from './icons/AppleIcon.vue'
import GoogleIcon from './icons/GoogleIcon.vue'
import FacebookIcon from './icons/FacebookIcon.vue'

interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'login-success'): void
}>()

const {
  showEmailLogin,
  email,
  message,
  messageType,
  loggingIn,
  lastUsedProvider,
  loading,
  isDev,
  toggleEmailLogin,
  resetForm,
  handleEmailLogin: doEmailLogin,
  handleAppleSignIn,
  handleGoogleSignIn,
  handleFacebookSignIn,
} = useLogin()

// Reset form when modal closes
watch(() => props.modelValue, (isOpen) => {
  if (!isOpen) {
    resetForm()
  }
})

function close() {
  emit('update:modelValue', false)
}

async function handleEmailLogin() {
  const result = await doEmailLogin()
  if (result.success) {
    emit('login-success')
    close()
  }
}
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    size="sm"
    @update:model-value="emit('update:modelValue', $event)"
    @close="close"
  >
    <div class="login-modal">
      <!-- Header -->
      <div class="login-header">
        <img src="../assets/socialchef_logo.svg" alt="SocialChef" class="login-logo" />
        <h2 class="login-title">{{ $t('landing.loginModal.title') }}</h2>
        <p class="login-subtitle">{{ $t('landing.loginModal.subtitle') }}</p>
      </div>

      <!-- Alert -->
      <BaseAlert
        v-if="message"
        :type="messageType"
        :model-value="!!message"
        @update:model-value="message = ''"
        class="login-alert"
      >
        {{ message }}
      </BaseAlert>

      <!-- Content Wrapper -->
      <div class="login-content-wrapper">
        <!-- Social Login -->
        <div :class="['login-content', { 'is-hidden': showEmailLogin }]">
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

          <button
            type="button"
            class="email-link"
            @click="toggleEmailLogin"
          >
            {{ $t('auth.signInWithEmail') }}
          </button>
        </div>

        <!-- Email Login -->
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
        <router-link to="/privacy-policy" @click="close">{{ $t('auth.privacyPolicy') }}</router-link>
        <span class="separator">·</span>
        <router-link to="/terms" @click="close">{{ $t('auth.termsOfService') }}</router-link>
      </div>
    </div>
  </BaseModal>
</template>

<style scoped>
.login-modal {
  text-align: center;
}

.login-header {
  margin-bottom: var(--space-2xl);
}

.login-logo {
  height: 60px;
  width: auto;
  margin: 0 auto var(--space-lg);
  display: block;
  filter: drop-shadow(0 4px 12px rgba(176, 138, 90, 0.3));
}

.login-title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  margin-bottom: var(--space-sm);
}

.login-subtitle {
  font-size: var(--text-base);
  color: var(--text-secondary);
}

.login-alert {
  margin-bottom: var(--space-lg);
}

/* Content Wrapper */
.login-content-wrapper {
  position: relative;
  min-height: 220px;
}

.login-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.login-content.is-hidden {
  opacity: 0;
  transform: translateY(-8px);
  pointer-events: none;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
}

.login-content.email-content {
  opacity: 0;
  transform: translateY(8px);
  pointer-events: none;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
}

.login-content.email-content.is-visible {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
  position: relative;
}

/* Social Buttons */
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

.apple-button {
  background: #000000;
  color: #ffffff;
}

.apple-button:hover:not(:disabled) {
  background: #1a1a1a;
}

.google-button {
  background: #ffffff;
  color: #1f1f1f;
  border: 1px solid var(--border-color);
}

.google-button:hover:not(:disabled) {
  background: #f5f5f5;
}

.facebook-button {
  background: #1877F2;
  color: #ffffff;
}

.facebook-button:hover:not(:disabled) {
  background: #166fe5;
}

/* Email Link */
.email-link {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  cursor: pointer;
  padding: var(--space-md) 0;
  transition: color 0.15s ease;
}

.email-link:hover {
  color: var(--gold-primary);
}

/* Form */
form {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
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
  .login-logo {
    height: 50px;
  }

  .login-title {
    font-size: var(--text-xl);
  }
}
</style>

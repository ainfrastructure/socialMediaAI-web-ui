import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import { api } from '../services/api'
import { env } from '../config/environment'

export type LoginStep = 'social' | 'email' | 'code_entry' | 'otp_entry'

export function useLogin() {
  const authStore = useAuthStore()
  const { t } = useI18n()

  const step = ref<LoginStep>('social')
  const email = ref('')
  const otpCode = ref('')
  const message = ref('')
  const messageType = ref<'success' | 'error' | 'info'>('info')
  const loggingIn = ref(false)
  const lastUsedProvider = ref<string | null>(localStorage.getItem('last_login_provider'))

  // Check if we're in development mode (for dev login)
  const isDev = computed(() => env.isDevelopment)

  // Backward compat: showEmailLogin maps to step !== 'social'
  const showEmailLogin = computed(() => step.value !== 'social')

  function showMessage(msg: string, type: 'success' | 'error' | 'info') {
    message.value = msg
    messageType.value = type
    setTimeout(() => (message.value = ''), 5000)
  }

  function clearMessage() {
    message.value = ''
  }

  function toggleEmailLogin() {
    if (step.value === 'social') {
      step.value = 'email'
    } else {
      step.value = 'social'
    }
    message.value = ''
  }

  function goBackToEmail() {
    step.value = 'email'
    otpCode.value = ''
    message.value = ''
  }

  function resetForm() {
    step.value = 'social'
    email.value = ''
    otpCode.value = ''
    message.value = ''
  }

  async function handleEmailLogin(): Promise<{ success: boolean }> {
    if (!email.value) {
      showMessage(t('errors.validationError'), 'error')
      return { success: false }
    }

    if (loggingIn.value) return { success: false }

    loggingIn.value = true
    try {
      const result = await api.initEmailLogin(email.value)

      if (!result.success) {
        showMessage((result as any).error || t('errors.generic'), 'error')
        return { success: false }
      }

      const method = (result as any).data?.method || (result as any).method
      if (method === 'code') {
        step.value = 'code_entry'
      } else {
        step.value = 'otp_entry'
      }
      return { success: false } // Don't navigate away — user needs to enter code
    } catch (err: any) {
      showMessage(err.message || t('errors.networkError'), 'error')
      return { success: false }
    } finally {
      loggingIn.value = false
    }
  }

  async function handleCodeSubmit(): Promise<{ success: boolean }> {
    if (!otpCode.value) {
      showMessage('Please enter your code', 'error')
      return { success: false }
    }

    if (loggingIn.value) return { success: false }

    loggingIn.value = true
    try {
      const result = await authStore.devLogin(email.value, otpCode.value)
      if (!result.success) {
        showMessage(result.error || t('errors.generic'), 'error')
        return { success: false }
      }
      return { success: true }
    } catch (err: any) {
      showMessage(err.message || t('errors.generic'), 'error')
      return { success: false }
    } finally {
      loggingIn.value = false
    }
  }

  async function handleOtpSubmit(): Promise<{ success: boolean }> {
    if (!otpCode.value) {
      showMessage('Please enter the 6-digit code', 'error')
      return { success: false }
    }

    if (loggingIn.value) return { success: false }

    loggingIn.value = true
    try {
      const result = await api.verifyOtp(email.value, otpCode.value)
      if (!result.success || !result.session) {
        showMessage(result.error || t('errors.generic'), 'error')
        return { success: false }
      }
      authStore.storeSessionAndLoad(result.session)
      return { success: true }
    } catch (err: any) {
      showMessage(err.message || t('errors.generic'), 'error')
      return { success: false }
    } finally {
      loggingIn.value = false
    }
  }

  async function handleResendOtp() {
    if (loggingIn.value) return

    loggingIn.value = true
    try {
      await api.initEmailLogin(email.value)
      showMessage('Code resent! Check your email.', 'success')
    } catch (err: any) {
      showMessage(err.message || 'Failed to resend code', 'error')
    } finally {
      loggingIn.value = false
    }
  }

  async function handleAppleSignIn(): Promise<{ success: boolean }> {
    localStorage.setItem('last_login_provider', 'apple')
    const result = await authStore.signInWithApple()

    if (!result.success) {
      showMessage(result.error || t('errors.generic'), 'error')
      return { success: false }
    }
    // OAuth will redirect, so success here means redirect initiated
    return { success: true }
  }

  async function handleGoogleSignIn(): Promise<{ success: boolean }> {
    localStorage.setItem('last_login_provider', 'google')
    const result = await authStore.signInWithGoogle()

    if (!result.success) {
      showMessage(result.error || t('errors.generic'), 'error')
      return { success: false }
    }
    return { success: true }
  }

  async function handleFacebookSignIn(): Promise<{ success: boolean }> {
    localStorage.setItem('last_login_provider', 'facebook')
    const result = await authStore.signInWithFacebook()

    if (!result.success) {
      showMessage(result.error || t('errors.generic'), 'error')
      return { success: false }
    }
    return { success: true }
  }

  return {
    // State
    step,
    showEmailLogin,
    email,
    otpCode,
    message,
    messageType,
    loggingIn,
    lastUsedProvider,
    loading: authStore.loading,
    isDev,

    // Methods
    showMessage,
    clearMessage,
    toggleEmailLogin,
    goBackToEmail,
    resetForm,
    handleEmailLogin,
    handleCodeSubmit,
    handleOtpSubmit,
    handleResendOtp,
    handleAppleSignIn,
    handleGoogleSignIn,
    handleFacebookSignIn,
  }
}

import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import { api } from '../services/api'

export function useLogin() {
  const authStore = useAuthStore()
  const { t } = useI18n()

  const showEmailLogin = ref(false)
  const email = ref('')
  const message = ref('')
  const messageType = ref<'success' | 'error' | 'info'>('info')
  const loggingIn = ref(false)
  const lastUsedProvider = ref<string | null>(localStorage.getItem('last_login_provider'))

  // Check if we're in development mode
  const isDev = computed(() => import.meta.env.DEV)

  function showMessage(msg: string, type: 'success' | 'error' | 'info') {
    message.value = msg
    messageType.value = type
    setTimeout(() => (message.value = ''), 5000)
  }

  function clearMessage() {
    message.value = ''
  }

  function toggleEmailLogin() {
    showEmailLogin.value = !showEmailLogin.value
    message.value = ''
  }

  function resetForm() {
    showEmailLogin.value = false
    email.value = ''
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
      // In development: use dev login (direct login without email)
      // In production: use magic link (sends email with login link)
      if (isDev.value) {
        const result = await authStore.devLogin(email.value)

        if (!result.success) {
          showMessage(result.error || t('errors.generic'), 'error')
          return { success: false }
        }

        return { success: true }
      } else {
        // Production: send magic link
        const result = await api.sendMagicLink(email.value)

        if (!result.success) {
          showMessage(result.error || t('errors.generic'), 'error')
          return { success: false }
        }

        // Show success message - user needs to check their email
        showMessage(t('auth.checkEmailForLink'), 'success')
        return { success: false } // Return false so we don't navigate away
      }
    } catch (err: any) {
      showMessage(err.message || t('errors.networkError'), 'error')
      return { success: false }
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
    showEmailLogin,
    email,
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
    resetForm,
    handleEmailLogin,
    handleAppleSignIn,
    handleGoogleSignIn,
    handleFacebookSignIn,
  }
}

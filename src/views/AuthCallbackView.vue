<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import BaseCard from '../components/BaseCard.vue'

const router = useRouter()
const authStore = useAuthStore()
const message = ref('Processing authentication...')
const error = ref('')

onMounted(async () => {
  try {
    // Get hash parameters from URL
    const hash = window.location.hash.substring(1)
    const params = new URLSearchParams(hash)

    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')
    const errorParam = params.get('error')
    const errorDescription = params.get('error_description')

    // Handle errors from Supabase
    if (errorParam) {
      error.value = errorDescription || errorParam
      message.value = 'Authentication failed'
      setTimeout(() => router.push('/login'), 3000)
      return
    }

    // Handle successful authentication
    if (accessToken && refreshToken) {
      // Clear any old tokens first (important for deleted account re-login)
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('token_expires_at')

      // Store tokens with expiration (default to 1 hour)
      const expiresIn = params.get('expires_in')
      const expiresAt = expiresIn ? Date.now() + parseInt(expiresIn) * 1000 : Date.now() + 3600 * 1000

      localStorage.setItem('access_token', accessToken)
      localStorage.setItem('refresh_token', refreshToken)
      localStorage.setItem('token_expires_at', expiresAt.toString())

      // Set the auth store tokens
      authStore.accessToken = accessToken
      authStore.refreshToken = refreshToken

      // Load user profile
      await authStore.loadProfile()

      if (authStore.isAuthenticated) {
        message.value = 'Successfully authenticated! Redirecting...'
        setTimeout(() => router.push('/dashboard'), 1000)
      } else {
        error.value = 'Failed to load profile'
        setTimeout(() => router.push('/login'), 3000)
      }
    } else {
      error.value = 'Invalid authentication response'
      setTimeout(() => router.push('/login'), 3000)
    }
  } catch (err: any) {
    error.value = err.message || 'An error occurred'
    setTimeout(() => router.push('/login'), 3000)
  }
})
</script>

<template>
  <div class="callback-container">
    <BaseCard variant="glass-intense" class="callback-card">
      <div v-if="!error" class="spinner"></div>
      <div v-if="error" class="error-icon">⚠️</div>
      <h2 class="message-title">{{ message }}</h2>
      <p v-if="error" class="error-message">{{ error }}</p>
      <p v-if="!error" class="info-message">Please wait...</p>
    </BaseCard>
  </div>
</template>

<style scoped>
.callback-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-xl);
}

.callback-card {
  max-width: 440px;
  width: 100%;
  text-align: center;
  padding: var(--space-5xl) var(--space-3xl);
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

.spinner {
  border: 4px solid var(--border-color);
  border-top: 4px solid var(--gold-primary);
  border-radius: 50%;
  width: 56px;
  height: 56px;
  animation: spin 1s linear infinite;
  margin: 0 auto var(--space-2xl);
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.error-icon {
  font-size: var(--text-5xl);
  margin-bottom: var(--space-2xl);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.message-title {
  color: var(--text-primary);
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  margin-bottom: var(--space-md);
}

.info-message {
  color: var(--text-secondary);
  margin-top: var(--space-md);
  font-size: var(--text-base);
}

.error-message {
  color: var(--error-text);
  margin-top: var(--space-md);
  font-weight: var(--font-medium);
  font-size: var(--text-base);
}

/* Responsive */
@media (max-width: 480px) {
  .callback-container {
    padding: var(--space-lg);
  }

  .callback-card {
    padding: var(--space-4xl) var(--space-2xl);
  }

  .message-title {
    font-size: var(--text-xl);
  }
}
</style>

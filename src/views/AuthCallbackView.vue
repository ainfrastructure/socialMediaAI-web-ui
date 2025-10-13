<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

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
    const type = params.get('type')
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
    <div class="callback-card">
      <div v-if="!error" class="spinner"></div>
      <div v-if="error" class="error-icon">⚠️</div>
      <h2>{{ message }}</h2>
      <p v-if="error" class="error-message">{{ error }}</p>
      <p v-if="!error" class="info-message">Please wait...</p>
    </div>
  </div>
</template>

<style scoped>
.callback-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.callback-card {
  background: white;
  padding: 60px 40px;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  max-width: 400px;
  width: 100%;
  text-align: center;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
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
  font-size: 50px;
  margin-bottom: 20px;
}

h2 {
  color: #333;
  margin-bottom: 10px;
}

.info-message {
  color: #666;
  margin-top: 10px;
}

.error-message {
  color: #dc3545;
  margin-top: 10px;
  font-weight: 500;
}
</style>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { api } from '../services/api'

const router = useRouter()
const authStore = useAuthStore()

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
          router.push('/dashboard')
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
    showMessage('Please enter email and password', 'error')
    return
  }

  if (isSignup.value) {
    const result = await authStore.signup(email.value, password.value)

    if (!result.success) {
      showMessage(result.error || 'Signup failed', 'error')
      return
    }

    if (result.emailConfirmationRequired) {
      showMessage(
        result.message || 'Account created! Please check your email to confirm.',
        'info',
      )
      isSignup.value = false
      return
    }

    showMessage('Account created successfully!', 'success')
    router.push('/dashboard')
  } else {
    const result = await authStore.login(email.value, password.value)

    if (!result.success) {
      showMessage(result.error || 'Login failed', 'error')
      return
    }

    showMessage('Logged in successfully!', 'success')
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
    showMessage('Please enter your email', 'error')
    return
  }

  try {
    const response = await api.sendMagicLink(email.value)

    if (!response.success) {
      showMessage(response.error || 'Failed to send magic link', 'error')
      return
    }

    showMessage('Magic link sent! Please check your email.', 'success')
  } catch (err: any) {
    showMessage(err.message || 'Network error', 'error')
  }
}

async function handleForgotPassword() {
  if (!email.value) {
    showMessage('Please enter your email', 'error')
    return
  }

  try {
    const response = await api.requestPasswordReset(email.value)

    if (!response.success) {
      showMessage(response.error || 'Failed to send reset email', 'error')
      return
    }

    showMessage('Password reset email sent! Please check your email.', 'success')
  } catch (err: any) {
    showMessage(err.message || 'Network error', 'error')
  }
}
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <div class="header">
        <h1>🎨 Social Media AI</h1>
        <p>AI-Powered Content Generation</p>
      </div>

      <div v-if="message" :class="`alert alert-${messageType}`">
        {{ message }}
      </div>

      <form v-if="!showMagicLink && !showForgotPassword" @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="your@email.com"
            required
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="••••••••"
            required
          />
        </div>

        <button type="submit" class="btn-primary" :disabled="authStore.loading">
          {{ isSignup ? 'Sign Up' : 'Login' }}
        </button>

        <button type="button" class="btn-secondary" @click="toggleMode">
          {{ isSignup ? 'Already have an account? Login' : "Don't have an account? Sign Up" }}
        </button>

        <div class="divider">
          <span>OR</span>
        </div>

        <button type="button" class="btn-link" @click="toggleMagicLink">
          Login with Magic Link
        </button>

        <button type="button" class="btn-link" @click="toggleForgotPassword">
          Forgot Password?
        </button>
      </form>

      <!-- Magic Link Form -->
      <form v-if="showMagicLink" @submit.prevent="handleMagicLink">
        <div class="form-group">
          <label for="magic-email">Email</label>
          <input
            id="magic-email"
            v-model="email"
            type="email"
            placeholder="your@email.com"
            required
          />
        </div>

        <button type="submit" class="btn-primary" :disabled="authStore.loading">
          Send Magic Link
        </button>

        <button type="button" class="btn-secondary" @click="toggleMagicLink">
          Back to Login
        </button>
      </form>

      <!-- Forgot Password Form -->
      <form v-if="showForgotPassword" @submit.prevent="handleForgotPassword">
        <div class="form-group">
          <label for="reset-email">Email</label>
          <input
            id="reset-email"
            v-model="email"
            type="email"
            placeholder="your@email.com"
            required
          />
        </div>

        <button type="submit" class="btn-primary" :disabled="authStore.loading">
          Send Reset Link
        </button>

        <button type="button" class="btn-secondary" @click="toggleForgotPassword">
          Back to Login
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  background: white;
  padding: 40px;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  max-width: 400px;
  width: 100%;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h1 {
  font-size: 2em;
  margin-bottom: 10px;
  color: #333;
}

.header p {
  color: #666;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.form-group input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 1em;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
}

button {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 5px;
  font-size: 1em;
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 10px;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover {
  background: #5568d3;
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-secondary {
  background: transparent;
  color: #667eea;
  border: 1px solid #667eea;
}

.btn-secondary:hover {
  background: #f8f9fa;
}

.alert {
  padding: 15px;
  border-radius: 5px;
  margin-bottom: 20px;
  font-size: 0.9em;
}

.alert-success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.alert-error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.alert-info {
  background: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
}

.divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 20px 0;
  color: #999;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid #ddd;
}

.divider span {
  padding: 0 10px;
  font-size: 0.9em;
}

.btn-link {
  background: transparent;
  color: #667eea;
  border: none;
  text-decoration: underline;
  padding: 8px;
}

.btn-link:hover {
  color: #5568d3;
}
</style>

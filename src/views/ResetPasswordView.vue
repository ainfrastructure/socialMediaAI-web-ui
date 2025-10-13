<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../services/api'

const router = useRouter()
const password = ref('')
const confirmPassword = ref('')
const message = ref('')
const messageType = ref<'success' | 'error' | 'info'>('info')
const loading = ref(false)
const accessToken = ref<string | null>(null)

onMounted(() => {
  // Get access token from URL hash
  const hash = window.location.hash.substring(1)
  const params = new URLSearchParams(hash)
  const token = params.get('access_token')

  if (!token) {
    showMessage('Invalid or missing reset token. Please request a new password reset.', 'error')
    setTimeout(() => router.push('/login'), 3000)
    return
  }

  accessToken.value = token
  showMessage('Enter your new password below.', 'info')
})

async function handleSubmit() {
  if (!password.value || !confirmPassword.value) {
    showMessage('Please enter and confirm your new password', 'error')
    return
  }

  if (password.value.length < 6) {
    showMessage('Password must be at least 6 characters long', 'error')
    return
  }

  if (password.value !== confirmPassword.value) {
    showMessage('Passwords do not match', 'error')
    return
  }

  if (!accessToken.value) {
    showMessage('Invalid reset token', 'error')
    return
  }

  loading.value = true

  try {
    const response = await api.updatePassword(password.value, accessToken.value)

    if (!response.success) {
      showMessage(response.error || 'Failed to update password', 'error')
      return
    }

    showMessage('Password updated successfully! Redirecting to login...', 'success')
    setTimeout(() => router.push('/login'), 2000)
  } catch (err: any) {
    showMessage(err.message || 'An error occurred', 'error')
  } finally {
    loading.value = false
  }
}

function showMessage(msg: string, type: 'success' | 'error' | 'info') {
  message.value = msg
  messageType.value = type
}
</script>

<template>
  <div class="reset-container">
    <div class="reset-card">
      <div class="header">
        <h1>Reset Password</h1>
        <p>Enter your new password below</p>
      </div>

      <div v-if="message" :class="`alert alert-${messageType}`">
        {{ message }}
      </div>

      <form @submit.prevent="handleSubmit" v-if="accessToken">
        <div class="form-group">
          <label for="password">New Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="Enter new password"
            required
            minlength="6"
          />
        </div>

        <div class="form-group">
          <label for="confirmPassword">Confirm Password</label>
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            placeholder="Confirm new password"
            required
            minlength="6"
          />
        </div>

        <button type="submit" class="btn-primary" :disabled="loading">
          {{ loading ? 'Updating...' : 'Update Password' }}
        </button>

        <button type="button" class="btn-secondary" @click="router.push('/login')">
          Back to Login
        </button>
      </form>

      <div v-else class="error-state">
        <p>Redirecting to login page...</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.reset-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.reset-card {
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

.error-state {
  text-align: center;
  color: #666;
}
</style>

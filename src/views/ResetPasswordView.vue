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
useI18n()
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
    <BaseCard variant="glass-intense" class="reset-card">
      <div class="header">
        <h1 class="title">{{ $t('auth.resetPasswordTitle') }}</h1>
        <p class="subtitle">{{ $t('auth.resetPasswordSubtitle') }}</p>
      </div>

      <BaseAlert
        v-if="message"
        :type="messageType"
        :model-value="!!message"
        @update:model-value="message = ''"
      >
        {{ message }}
      </BaseAlert>

      <form @submit.prevent="handleSubmit" v-if="accessToken">
        <BaseInput
          v-model="password"
          type="password"
          :label="$t('profile.newPassword')"
          :placeholder="$t('auth.passwordPlaceholder')"
          required
        />

        <BaseInput
          v-model="confirmPassword"
          type="password"
          :label="$t('profile.confirmPassword')"
          :placeholder="$t('auth.passwordPlaceholder')"
          required
        />

        <BaseButton
          type="submit"
          variant="primary"
          size="large"
          full-width
          :disabled="loading"
        >
          {{ loading ? $t('profile.updating') : $t('auth.resetPassword') }}
        </BaseButton>

        <BaseButton
          type="button"
          variant="secondary"
          size="medium"
          full-width
          @click="router.push('/login')"
        >
          {{ $t('auth.backToLogin') }}
        </BaseButton>
      </form>

      <div v-else class="error-state">
        <p>Redirecting to login page...</p>
      </div>
    </BaseCard>
  </div>
</template>

<style scoped>
.reset-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-xl);
}

.reset-card {
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

.title {
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

.subtitle {
  font-size: var(--text-base);
  color: var(--text-secondary);
  font-weight: var(--font-normal);
}

form {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.error-state {
  text-align: center;
  color: var(--text-muted);
  padding: var(--space-2xl);
  font-size: var(--text-base);
}

/* Responsive */
@media (max-width: 480px) {
  .reset-container {
    padding: var(--space-lg);
  }

  .title {
    font-size: var(--text-3xl);
  }
}
</style>

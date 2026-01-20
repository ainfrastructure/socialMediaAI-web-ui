<script setup lang="ts">
import { debugLog } from '@/utils/debug'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useTikTokStore } from '../stores/tiktok'
import BaseCard from '../components/BaseCard.vue'

const router = useRouter()
const tiktokStore = useTikTokStore()

const status = ref('Processing your TikTok connection...')
const isError = ref(false)

onMounted(async () => {
  // Get stored return URL (if any)
  const returnUrl = localStorage.getItem('oauth_return_url')
  const defaultRedirect = '/connect-accounts'
  debugLog('[TikTokCallback] Return URL from localStorage:', returnUrl)

  try {
    // Get code and state from URL parameters
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    const state = urlParams.get('state')
    const error = urlParams.get('error')
    const errorDescription = urlParams.get('error_description')

    // Check for errors from TikTok
    if (error) {
      isError.value = true
      status.value = `TikTok error: ${errorDescription || error}`
      localStorage.removeItem('oauth_return_url')
      setTimeout(() => router.push(returnUrl || defaultRedirect), 3000)
      return
    }

    if (!code || !state) {
      isError.value = true
      status.value = 'Missing authorization code or state'
      localStorage.removeItem('oauth_return_url')
      setTimeout(() => router.push(returnUrl || defaultRedirect), 3000)
      return
    }

    // Complete OAuth flow
    await tiktokStore.handleOAuthCallback(code, state)

    // Success! Clear return URL and redirect
    status.value = `Success! Connected ${tiktokStore.connectedAccounts.length} TikTok account(s)`
    localStorage.removeItem('oauth_return_url')
    setTimeout(() => router.push(returnUrl || '/connect-accounts?connected=true'), 2000)
  } catch (error: any) {
    isError.value = true
    status.value = error.message || 'Failed to complete TikTok connection'
    localStorage.removeItem('oauth_return_url')
    setTimeout(() => router.push(returnUrl || defaultRedirect), 3000)
  }
})
</script>

<template>
  <div class="callback-view">
    <div class="container">
      <BaseCard variant="glass" class="callback-card">
        <div class="callback-content">
          <!-- Loading/Success Icon -->
          <div v-if="!isError" class="icon-wrapper loading">
            <div class="spinner"></div>
          </div>

          <!-- Error Icon -->
          <div v-else class="icon-wrapper error">
            <span class="error-icon">✕</span>
          </div>

          <!-- Status Message -->
          <h2 :class="{ error: isError }">{{ status }}</h2>

          <!-- Additional info -->
          <p v-if="!isError" class="subtitle">Please wait while we connect your TikTok account...</p>
          <p v-else class="subtitle">Redirecting you back...</p>
        </div>
      </BaseCard>
    </div>
  </div>
</template>

<style scoped>
.callback-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-lg);
  background: linear-gradient(135deg, rgba(246, 241, 231, 0.9) 0%, rgba(240, 235, 225, 0.95) 100%);
}

.container {
  max-width: 500px;
  width: 100%;
}

.callback-card {
  padding: var(--space-2xl);
}

.callback-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--space-lg);
}

.icon-wrapper {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-md);
}

.icon-wrapper.loading {
  background: linear-gradient(135deg, #000000, #25F4EE, #FE2C55);
}

.icon-wrapper.error {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .spinner {
    animation-duration: 0.01ms !important;
  }
}

.error-icon {
  font-size: 48px;
  color: white;
  font-weight: bold;
}

h2 {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  color: var(--text-primary);
  margin: 0;
}

h2.error {
  color: #ef4444;
}

.subtitle {
  font-size: var(--text-base);
  color: var(--text-secondary);
  margin: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .callback-card {
    padding: var(--space-xl);
  }

  h2 {
    font-size: var(--text-xl);
  }

  .icon-wrapper {
    width: 64px;
    height: 64px;
  }

  .spinner {
    width: 32px;
    height: 32px;
  }

  .error-icon {
    font-size: 36px;
  }
}
</style>

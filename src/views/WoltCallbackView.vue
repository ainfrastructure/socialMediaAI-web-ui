<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import GradientBackground from '../components/GradientBackground.vue'
import BaseCard from '../components/BaseCard.vue'
import BaseAlert from '../components/BaseAlert.vue'

const router = useRouter()
const route = useRoute()

const loading = ref(true)
const error = ref('')
const success = ref(false)

onMounted(async () => {
  loading.value = true

  try {
    // Get code and state from URL query params (from Wolt redirect)
    const code = route.query.code as string
    const state = route.query.state as string
    const scope = route.query.scope as string

    console.log('🔔 Wolt callback received')
    console.log('  - Code:', code ? code.substring(0, 20) + '...' : 'missing')
    console.log('  - State:', state)
    console.log('  - Scope:', scope)

    if (!code || !state) {
      throw new Error('Missing authorization code or state from Wolt')
    }

    // Verify state to prevent CSRF
    const savedState = localStorage.getItem('wolt_oauth_state')
    if (state !== savedState) {
      throw new Error('Invalid OAuth state - possible CSRF attack')
    }
    localStorage.removeItem('wolt_oauth_state')

    console.log('✅ State verified, exchanging code for tokens...')

    // Exchange code for tokens by calling our backend manual-exchange endpoint
    const authStore = useAuthStore()
    const token = authStore.accessToken

    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/wolt/manual-exchange`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ code, state })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Failed to exchange code for tokens')
    }

    const data = await response.json()

    console.log('✅ Wolt connected successfully!')
    console.log('  - Venue ID:', data.connection?.venueId)
    console.log('  - Venue Name:', data.connection?.venueName)

    success.value = true
    loading.value = false

    // Redirect to connect accounts page after 2 seconds
    setTimeout(() => {
      router.push('/connect-accounts')
    }, 2000)

  } catch (err: any) {
    console.error('❌ Wolt callback error:', err)
    error.value = err.message || 'Failed to connect to Wolt'
    loading.value = false
  }
})
</script>

<template>
  <div class="wolt-callback-view">
    <GradientBackground />

    <div class="container">
      <BaseCard variant="glass-intense" class="callback-card">
        <div v-if="loading" class="callback-content">
          <div class="spinner"></div>
          <h2 class="callback-title">Connecting to Wolt</h2>
          <p class="callback-message">Please wait while we complete the connection...</p>
        </div>

        <div v-else-if="success" class="callback-content success">
          <div class="success-icon">✓</div>
          <h2 class="callback-title">Successfully Connected!</h2>
          <p class="callback-message">
            Your Wolt account has been connected successfully.
            Redirecting to dashboard...
          </p>
        </div>

        <div v-else class="callback-content error">
          <BaseAlert type="error">
            {{ error }}
          </BaseAlert>
          <div class="callback-actions">
            <button @click="router.push('/dashboard')" class="back-button">
              Go to Dashboard
            </button>
          </div>
        </div>
      </BaseCard>
    </div>
  </div>
</template>

<style scoped>
.wolt-callback-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-xl);
}

.container {
  max-width: 500px;
  width: 100%;
}

.callback-card {
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

.callback-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--space-4xl) var(--space-2xl);
  gap: var(--space-xl);
}

.spinner {
  width: 64px;
  height: 64px;
  border: 4px solid rgba(212, 175, 55, 0.2);
  border-top-color: var(--gold-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.success-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--gold-primary);
  color: var(--text-on-gold);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-4xl);
  font-weight: var(--font-bold);
  animation: successPulse 0.6s ease-out;
}

@keyframes successPulse {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.callback-title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0;
}

.callback-message {
  font-size: var(--text-base);
  color: var(--text-secondary);
  line-height: var(--leading-normal);
  margin: 0;
}

.callback-actions {
  margin-top: var(--space-lg);
}

.back-button {
  padding: var(--space-md) var(--space-2xl);
  background: var(--gold-primary);
  border: none;
  border-radius: var(--radius-md);
  color: var(--text-on-gold);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  cursor: pointer;
  transition: var(--transition-base);
}

.back-button:hover {
  background: var(--gold-light);
  transform: translateY(-2px);
}

/* Responsive */
@media (max-width: 768px) {
  .wolt-callback-view {
    padding: var(--space-lg);
  }

  .callback-content {
    padding: var(--space-3xl) var(--space-lg);
  }

  .callback-title {
    font-size: var(--text-xl);
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .spinner,
  .success-icon,
  .callback-card,
  .back-button {
    animation: none;
  }

  .back-button:hover {
    transform: none;
  }
}
</style>

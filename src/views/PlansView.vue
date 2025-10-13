<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { api, type SubscriptionPlan } from '../services/api'

const router = useRouter()
const authStore = useAuthStore()

const plans = ref<SubscriptionPlan[]>([])
const loading = ref(true)
const message = ref('')
const messageType = ref<'success' | 'error' | 'info'>('info')

onMounted(async () => {
  await loadPlans()
})

async function loadPlans() {
  loading.value = true

  try {
    const response = await api.getPlans()

    if (response.success && response.plans) {
      plans.value = response.plans
    }
  } catch (error) {
    showMessage('Failed to load plans', 'error')
  } finally {
    loading.value = false
  }
}

async function subscribe(tier: string) {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }

  if (tier === 'free') {
    showMessage('You are already on the free plan', 'info')
    return
  }

  try {
    const successUrl = `${window.location.origin}/dashboard?success=true`
    const cancelUrl = `${window.location.origin}/plans?canceled=true`

    const response = await api.createCheckout(tier, successUrl, cancelUrl)

    if (!response.success) {
      showMessage(response.error || 'Failed to create checkout', 'error')
      return
    }

    // Redirect to Stripe Checkout
    window.location.href = response.checkout_url || ''
  } catch (error: any) {
    showMessage(error.message || 'Network error', 'error')
  }
}

function showMessage(msg: string, type: 'success' | 'error' | 'info') {
  message.value = msg
  messageType.value = type
  setTimeout(() => (message.value = ''), 5000)
}

function goBack() {
  if (authStore.isAuthenticated) {
    router.push('/dashboard')
  } else {
    router.push('/login')
  }
}

// Check for success/canceled parameters
const urlParams = new URLSearchParams(window.location.search)
if (urlParams.get('success') === 'true') {
  showMessage('Subscription successful! Your account will be updated shortly.', 'success')
  setTimeout(() => {
    if (authStore.isAuthenticated) {
      authStore.refreshProfile()
      router.push('/dashboard')
    }
  }, 2000)
} else if (urlParams.get('canceled') === 'true') {
  showMessage('Subscription canceled', 'info')
}
</script>

<template>
  <div class="plans-view">
    <div class="header">
      <h1>🎨 Social Media AI</h1>
      <button class="btn-secondary btn-small" @click="goBack">
        {{ authStore.isAuthenticated ? 'Back to Dashboard' : 'Back to Login' }}
      </button>
    </div>

    <div v-if="message" :class="`alert alert-${messageType}`">
      {{ message }}
    </div>

    <div class="content">
      <h2>Choose Your Plan</h2>

      <div v-if="loading" class="loading">Loading plans...</div>

      <div v-else class="plans-grid">
        <div
          v-for="plan in plans"
          :key="plan.tier"
          :class="['plan-card', { featured: plan.tier === 'pro' }]"
        >
          <h3>{{ plan.name }}</h3>
          <div class="price">{{ plan.formatted_price }}</div>
          <ul class="features">
            <li v-for="(feature, index) in plan.features" :key="index">{{ feature }}</li>
          </ul>
          <button
            v-if="plan.tier !== 'free'"
            class="btn-primary"
            @click="subscribe(plan.tier)"
            :disabled="authStore.subscriptionTier === plan.tier"
          >
            {{
              authStore.subscriptionTier === plan.tier ? 'Current Plan' : 'Subscribe Now'
            }}
          </button>
          <div v-else class="free-label">Free Forever</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.plans-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.header {
  max-width: 1200px;
  margin: 0 auto 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
}

.header h1 {
  font-size: 2em;
  margin: 0;
}

.content {
  max-width: 1200px;
  margin: 0 auto;
}

.content h2 {
  text-align: center;
  color: white;
  margin-bottom: 30px;
  font-size: 2em;
}

.loading {
  text-align: center;
  color: white;
  font-size: 1.2em;
}

.plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.plan-card {
  background: white;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  text-align: center;
  transition: transform 0.3s;
}

.plan-card:hover {
  transform: translateY(-5px);
}

.plan-card.featured {
  border: 3px solid #667eea;
  transform: scale(1.05);
}

.plan-card h3 {
  font-size: 1.8em;
  margin-bottom: 10px;
  color: #667eea;
}

.price {
  font-size: 2.5em;
  font-weight: bold;
  margin: 20px 0;
  color: #333;
}

.features {
  list-style: none;
  padding: 0;
  margin: 20px 0;
  text-align: left;
}

.features li {
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}

.features li:before {
  content: '✓ ';
  color: #667eea;
  font-weight: bold;
}

.free-label {
  color: #666;
  font-weight: bold;
  padding: 12px;
}

button {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 5px;
  font-size: 1em;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #5568d3;
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
}

.btn-small {
  padding: 8px 16px;
  font-size: 0.9em;
}

.alert {
  max-width: 1200px;
  margin: 0 auto 20px;
  padding: 15px;
  border-radius: 5px;
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
</style>

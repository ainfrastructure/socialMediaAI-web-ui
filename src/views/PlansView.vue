<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { api, type SubscriptionPlan } from '../services/api'
import BaseCard from '../components/BaseCard.vue'
import BaseButton from '../components/BaseButton.vue'
import BaseAlert from '../components/BaseAlert.vue'

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
    const successUrl = `${window.location.origin}/playground?success=true`
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
    router.push('/playground')
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
      router.push('/playground')
    }
  }, 2000)
} else if (urlParams.get('canceled') === 'true') {
  showMessage('Subscription canceled', 'info')
}
</script>

<template>
  <div class="plans-view">
    <div class="header">
      <h1 class="brand-title">Social Media AI</h1>
      <BaseButton variant="ghost" size="small" @click="goBack">
        {{ authStore.isAuthenticated ? 'Back to Dashboard' : 'Back to Login' }}
      </BaseButton>
    </div>

    <BaseAlert
      v-if="message"
      :type="messageType"
      :model-value="!!message"
      @update:model-value="message = ''"
      class="plans-alert"
    >
      {{ message }}
    </BaseAlert>

    <div class="content">
      <h2 class="section-title">Choose Your Plan</h2>
      <p class="section-subtitle">Unlock the full power of AI-generated content</p>

      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>Loading plans...</p>
      </div>

      <div v-else class="plans-grid">
        <BaseCard
          v-for="plan in plans"
          :key="plan.tier"
          :variant="plan.tier === 'pro' ? 'glass-intense' : 'glass'"
          :class="['plan-card', { featured: plan.tier === 'pro' }]"
          :hoverable="plan.tier !== 'free'"
        >
          <div v-if="plan.tier === 'pro'" class="featured-badge">Most Popular</div>
          <div v-if="authStore.subscriptionTier === plan.tier" class="current-badge">Current Plan</div>

          <h3 class="plan-name">{{ plan.name }}</h3>
          <div class="price">{{ plan.formatted_price }}</div>

          <ul class="features">
            <li v-for="(feature, index) in plan.features" :key="index">
              <span class="check-icon">✓</span>
              {{ feature }}
            </li>
          </ul>

          <BaseButton
            v-if="plan.tier !== 'free'"
            variant="primary"
            size="large"
            full-width
            @click="subscribe(plan.tier)"
            :disabled="authStore.subscriptionTier === plan.tier"
          >
            {{ authStore.subscriptionTier === plan.tier ? 'Current Plan' : 'Subscribe Now' }}
          </BaseButton>
          <div v-else class="free-label">Free Forever</div>
        </BaseCard>
      </div>
    </div>
  </div>
</template>

<style scoped>
.plans-view {
  min-height: 100vh;
  padding: var(--space-2xl);
}

.header {
  max-width: var(--max-width-2xl);
  margin: 0 auto var(--space-3xl);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.brand-title {
  font-family: var(--font-heading);
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  background: var(--gradient-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}

.plans-alert {
  max-width: var(--max-width-2xl);
  margin: 0 auto var(--space-2xl);
}

.content {
  max-width: var(--max-width-2xl);
  margin: 0 auto;
}

.section-title {
  text-align: center;
  color: var(--text-primary);
  font-family: var(--font-heading);
  margin-bottom: var(--space-md);
  font-size: var(--text-4xl);
  font-weight: var(--font-bold);
}

.section-subtitle {
  text-align: center;
  color: var(--text-secondary);
  margin-bottom: var(--space-4xl);
  font-size: var(--text-lg);
}

.loading {
  text-align: center;
  padding: var(--space-5xl);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-lg);
}

.loading p {
  color: var(--text-secondary);
  font-size: var(--text-lg);
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid var(--border-color);
  border-top: 4px solid var(--gold-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: var(--space-2xl);
  margin-bottom: var(--space-3xl);
}

.plan-card {
  text-align: center;
  position: relative;
  animation: fadeInUp 0.6s var(--ease-smooth);
  animation-fill-mode: both;
}

.plan-card:nth-child(1) {
  animation-delay: 0.1s;
}

.plan-card:nth-child(2) {
  animation-delay: 0.2s;
}

.plan-card:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.plan-card.featured {
  position: relative;
}

.plan-card.featured::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: var(--gradient-gold);
  border-radius: var(--radius-lg);
  z-index: -1;
  opacity: 0.5;
  animation: pulse-glow 3s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% {
    opacity: 0.5;
  }
  50% {
    opacity: 0.8;
  }
}

.featured-badge {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--gradient-gold);
  color: var(--text-on-gold);
  padding: var(--space-xs) var(--space-lg);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  box-shadow: var(--shadow-md);
}

.current-badge {
  position: absolute;
  top: var(--space-lg);
  right: var(--space-lg);
  background: var(--success-bg);
  color: var(--success-text);
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  border: var(--border-width) solid var(--success-border);
}

.plan-name {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  margin: var(--space-xl) 0 var(--space-md);
  color: var(--text-primary);
}

.price {
  font-size: var(--text-5xl);
  font-weight: var(--font-bold);
  margin: var(--space-xl) 0;
  background: var(--gradient-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-family: var(--font-heading);
}

.features {
  list-style: none;
  padding: 0;
  margin: var(--space-2xl) 0;
  text-align: left;
}

.features li {
  padding: var(--space-md) 0;
  border-bottom: var(--border-width) solid var(--border-color);
  color: var(--text-secondary);
  font-size: var(--text-sm);
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.features li:last-child {
  border-bottom: none;
}

.check-icon {
  color: var(--gold-primary);
  font-weight: var(--font-bold);
  font-size: var(--text-lg);
  flex-shrink: 0;
}

.free-label {
  color: var(--text-muted);
  font-weight: var(--font-semibold);
  padding: var(--space-lg);
  font-size: var(--text-base);
}

/* Responsive */
@media (max-width: 768px) {
  .plans-view {
    padding: var(--space-lg);
  }

  .header {
    flex-direction: column;
    gap: var(--space-md);
    text-align: center;
  }

  .brand-title {
    font-size: var(--text-2xl);
  }

  .section-title {
    font-size: var(--text-3xl);
  }

  .plans-grid {
    grid-template-columns: 1fr;
    gap: var(--space-xl);
  }

  .plan-card.featured::before {
    display: none;
  }
}
</style>

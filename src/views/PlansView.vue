<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import { api, type SubscriptionPlan } from '../services/api'
import BaseCard from '../components/BaseCard.vue'
import BaseButton from '../components/BaseButton.vue'
import BaseAlert from '../components/BaseAlert.vue'
import MaterialIcon from '../components/MaterialIcon.vue'

const router = useRouter()
const authStore = useAuthStore()
const { t } = useI18n()

const plans = ref<SubscriptionPlan[]>([])
const loading = ref(true)
const portalLoading = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error' | 'info'>('info')

// Plan tier icons
const tierIcons: Record<string, string> = {
  free: 'spark',
  pro: 'bolt',
  enterprise: 'diamond'
}

// Computed: check if user has an active paid subscription
const hasActiveSubscription = computed(() => {
  return authStore.isAuthenticated &&
    authStore.subscriptionTier &&
    authStore.subscriptionTier !== 'free'
})

onMounted(async () => {
  await loadPlans()
})

async function loadPlans() {
  loading.value = true

  try {
    const response = await api.getPlans()

    if (response.success) {
      // Handle both response formats: { plans: [...] } and { data: { plans: [...] } }
      const plansData = (response as any).plans || response.data?.plans
      if (plansData) {
        plans.value = plansData
      }
    }
  } catch (error) {
    showMessage(t('plans.failedToLoad'), 'error')
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
    showMessage(t('plans.alreadyOnFreePlan'), 'info')
    return
  }

  // For enterprise, open contact form or email
  if (tier === 'enterprise') {
    window.location.href = 'mailto:hello@socialchef.ai?subject=Enterprise%20Plan%20Inquiry'
    return
  }

  try {
    const successUrl = `${window.location.origin}/playground?success=true`
    const cancelUrl = `${window.location.origin}/plans?canceled=true`

    const response = await api.createCheckout(tier, successUrl, cancelUrl)

    if (!response.success) {
      showMessage(response.error || t('plans.failedToCheckout'), 'error')
      return
    }

    // Redirect to Stripe Checkout
    window.location.href = response.data?.checkout_url || ''
  } catch (error: any) {
    showMessage(error.message || t('plans.networkError'), 'error')
  }
}

async function openBillingPortal() {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }

  portalLoading.value = true

  try {
    const returnUrl = `${window.location.origin}/plans`
    const response = await api.createCustomerPortal(returnUrl)

    if (response.success && response.data?.url) {
      window.location.href = response.data.url
    } else {
      showMessage(t('plans.failedToOpenPortal'), 'error')
    }
  } catch (error: any) {
    showMessage(error.message || t('plans.networkError'), 'error')
  } finally {
    portalLoading.value = false
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

function getTierIcon(tier: string): string {
  return tierIcons[tier] || 'star'
}

function isCurrentPlan(tier: string): boolean {
  return authStore.subscriptionTier === tier
}

function canUpgrade(tier: string): boolean {
  const tierOrder = ['free', 'pro', 'enterprise']
  const currentIndex = tierOrder.indexOf(authStore.subscriptionTier || 'free')
  const targetIndex = tierOrder.indexOf(tier)
  return targetIndex > currentIndex
}

// Check for success/canceled parameters
const urlParams = new URLSearchParams(window.location.search)
if (urlParams.get('success') === 'true') {
  showMessage(t('plans.subscriptionSuccess'), 'success')
  setTimeout(() => {
    if (authStore.isAuthenticated) {
      authStore.refreshProfile()
      router.push('/playground')
    }
  }, 2000)
} else if (urlParams.get('canceled') === 'true') {
  showMessage(t('plans.subscriptionCanceled'), 'info')
}
</script>

<template>
  <div class="plans-view">
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
      <h1 class="brand-title">{{ $t('plans.brandTitle') }}</h1>
      <h2 class="section-title">{{ $t('plans.chooseYourPlan') }}</h2>
      <p class="section-subtitle">{{ $t('plans.unlockPower') }}</p>

      <!-- Manage Subscription Button for existing subscribers -->
      <div v-if="hasActiveSubscription" class="manage-subscription-section">
        <BaseButton
          variant="secondary"
          size="medium"
          @click="openBillingPortal"
          :disabled="portalLoading"
        >
          <MaterialIcon icon="settings" size="sm" />
          {{ portalLoading ? $t('common.loading') : $t('plans.manageSubscription') }}
        </BaseButton>
      </div>

      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>{{ $t('plans.loading') }}</p>
      </div>

      <div v-else class="plans-grid">
        <BaseCard
          v-for="plan in plans"
          :key="plan.tier"
          :variant="plan.tier === 'pro' ? 'glass-intense' : 'glass'"
          :class="['plan-card', { featured: plan.tier === 'pro', enterprise: plan.tier === 'enterprise' }]"
          :hoverable="plan.tier !== 'free'"
        >
          <div v-if="plan.tier === 'pro'" class="featured-badge">{{ $t('plans.mostPopular') }}</div>
          <div v-if="plan.tier === 'enterprise'" class="enterprise-badge">{{ $t('plans.bestValue') }}</div>
          <div v-if="isCurrentPlan(plan.tier)" class="current-badge">{{ $t('plans.currentPlan') }}</div>

          <!-- Tier Icon -->
          <div class="tier-icon-wrapper">
            <MaterialIcon :icon="getTierIcon(plan.tier)" size="lg" :color="plan.tier === 'enterprise' ? 'var(--gold-primary)' : plan.tier === 'pro' ? 'var(--gold-light)' : 'var(--text-secondary)'" />
          </div>

          <h3 class="plan-name">{{ plan.name }}</h3>

          <!-- Price Display -->
          <div class="price-wrapper">
            <div class="price">{{ plan.formatted_price }}</div>
            <span v-if="plan.tier !== 'free' && plan.tier !== 'enterprise'" class="price-period">{{ $t('plans.perMonth') }}</span>
            <span v-if="plan.tier === 'enterprise'" class="price-custom">{{ $t('plans.customPricing') }}</span>
          </div>

          <!-- Token/Credit Highlight -->
          <div class="credits-highlight">
            <MaterialIcon icon="token" size="sm" :color="'var(--gold-primary)'" />
            <span>{{ plan.monthly_limit }} {{ $t('plans.tokensPerMonth') }}</span>
          </div>

          <ul class="features">
            <li v-for="(feature, index) in plan.features" :key="index">
              <MaterialIcon icon="check_circle" size="sm" :color="'var(--gold-primary)'" class="check-icon" />
              {{ feature }}
            </li>
          </ul>

          <!-- Action Buttons -->
          <div class="plan-actions">
            <template v-if="plan.tier === 'free'">
              <div v-if="isCurrentPlan(plan.tier)" class="free-label current">{{ $t('plans.currentPlan') }}</div>
              <div v-else class="free-label">{{ $t('plans.freeForever') }}</div>
            </template>

            <template v-else-if="plan.tier === 'enterprise'">
              <BaseButton
                variant="secondary"
                size="large"
                full-width
                @click="subscribe(plan.tier)"
              >
                <MaterialIcon icon="mail" size="sm" />
                {{ $t('plans.contactSales') }}
              </BaseButton>
            </template>

            <template v-else>
              <BaseButton
                v-if="isCurrentPlan(plan.tier)"
                variant="secondary"
                size="large"
                full-width
                @click="openBillingPortal"
                :disabled="portalLoading"
              >
                {{ $t('plans.manageSubscription') }}
              </BaseButton>
              <BaseButton
                v-else-if="canUpgrade(plan.tier)"
                variant="primary"
                size="large"
                full-width
                @click="subscribe(plan.tier)"
              >
                {{ $t('plans.upgradeTo') }} {{ plan.name }}
              </BaseButton>
              <BaseButton
                v-else
                variant="ghost"
                size="large"
                full-width
                @click="subscribe(plan.tier)"
              >
                {{ $t('plans.subscribeNow') }}
              </BaseButton>
            </template>
          </div>
        </BaseCard>
      </div>

      <!-- FAQ / Trust Section -->
      <div class="trust-section">
        <div class="trust-item">
          <MaterialIcon icon="lock" size="sm" :color="'var(--gold-primary)'" />
          <span>{{ $t('plans.securePayment') }}</span>
        </div>
        <div class="trust-item">
          <MaterialIcon icon="sync" size="sm" :color="'var(--gold-primary)'" />
          <span>{{ $t('plans.cancelAnytime') }}</span>
        </div>
        <div class="trust-item">
          <MaterialIcon icon="support_agent" size="sm" :color="'var(--gold-primary)'" />
          <span>{{ $t('plans.prioritySupport') }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.plans-view {
  min-height: 100vh;
  padding: var(--space-2xl);
}

.plans-alert {
  max-width: var(--max-width-2xl);
  margin: 0 auto var(--space-2xl);
}

.content {
  max-width: var(--max-width-2xl);
  margin: 0 auto;
}

.brand-title {
  text-align: center;
  font-family: var(--font-heading);
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  background: var(--gradient-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 var(--space-2xl) 0;
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
  margin-bottom: var(--space-2xl);
  font-size: var(--text-lg);
}

.manage-subscription-section {
  text-align: center;
  margin-bottom: var(--space-3xl);
}

.manage-subscription-section button {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
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
  display: flex;
  flex-direction: column;
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

.plan-card.enterprise {
  position: relative;
}

.plan-card.enterprise::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(135deg, var(--gold-dark) 0%, var(--gold-primary) 50%, var(--gold-light) 100%);
  border-radius: var(--radius-lg);
  z-index: -1;
  opacity: 0.3;
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
  white-space: nowrap;
}

.enterprise-badge {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, var(--gold-dark), var(--gold-primary));
  color: var(--text-on-gold);
  padding: var(--space-xs) var(--space-lg);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  box-shadow: var(--shadow-md);
  white-space: nowrap;
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

.tier-icon-wrapper {
  margin-top: var(--space-xl);
  display: flex;
  justify-content: center;
}

.plan-name {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  margin: var(--space-lg) 0 var(--space-sm);
  color: var(--text-primary);
}

.price-wrapper {
  margin: var(--space-lg) 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
}

.price {
  font-size: var(--text-5xl);
  font-weight: var(--font-bold);
  background: var(--gradient-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-family: var(--font-heading);
  line-height: 1.1;
}

.price-period {
  color: var(--text-muted);
  font-size: var(--text-sm);
}

.price-custom {
  color: var(--gold-primary);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
}

.credits-highlight {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-lg);
  background: var(--gold-subtle);
  border-radius: var(--radius-md);
  margin: var(--space-lg) 0;
}

.credits-highlight span {
  color: var(--gold-primary);
  font-weight: var(--font-semibold);
  font-size: var(--text-sm);
}

.features {
  list-style: none;
  padding: 0;
  margin: var(--space-lg) 0;
  text-align: left;
  flex-grow: 1;
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

.plan-actions {
  margin-top: auto;
  padding-top: var(--space-lg);
}

.plan-actions button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
}

.free-label {
  color: var(--text-muted);
  font-weight: var(--font-semibold);
  padding: var(--space-lg);
  font-size: var(--text-base);
}

.free-label.current {
  color: var(--success-text);
  background: var(--success-bg);
  border-radius: var(--radius-md);
  border: var(--border-width) solid var(--success-border);
}

/* Trust Section */
.trust-section {
  display: flex;
  justify-content: center;
  gap: var(--space-3xl);
  padding: var(--space-2xl) 0;
  border-top: var(--border-width) solid var(--border-color);
  margin-top: var(--space-2xl);
}

.trust-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  color: var(--text-secondary);
  font-size: var(--text-sm);
}

/* Responsive */
@media (max-width: 768px) {
  .plans-view {
    padding: var(--space-lg);
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

  .plan-card.featured::before,
  .plan-card.enterprise::before {
    display: none;
  }

  .trust-section {
    flex-direction: column;
    align-items: center;
    gap: var(--space-lg);
  }

  .price {
    font-size: var(--text-4xl);
  }
}
</style>

<script setup lang="ts">
import { debugLog, errorLog, warnLog } from '@/utils/debug'

import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import { useLocaleStore } from '../stores/locale'
import { api } from '../services/api'
import { referralService } from '../services/referralService'
import DashboardLayout from '../components/DashboardLayout.vue'
import BaseCard from '../components/BaseCard.vue'
import BaseButton from '../components/BaseButton.vue'
import BaseAlert from '../components/BaseAlert.vue'
import MaterialIcon from '../components/MaterialIcon.vue'

interface Plan {
  tier: string
  name: string
  price: number
  formatted_price: string
  currency: string
  stripe_price_id: string
  interval: string
  credits: number
  is_recurring: boolean
  features: string[]
  savings?: string
  badge?: string
  limited_to?: number
}

interface PlansResponse {
  success: boolean
  currency: string
  credit_costs: {
    image: number
    video: number
  }
  plans: Plan[]
}

const router = useRouter()
const authStore = useAuthStore()
const localeStore = useLocaleStore()
const { t } = useI18n()

const plans = ref<Plan[]>([])
const currency = ref<string>('usd')
const creditCosts = ref({ image: 1, video: 5 })
const loading = ref(true)
const portalLoading = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error' | 'info'>('info')
const hasPendingReferral = ref(false)

// Payment processing state
const processingPayment = ref(false)
const processingAttempts = ref(0)
const processingError = ref<string | null>(null)
const MAX_POLLING_ATTEMPTS = 12  // 12 attempts × 3 sec = 36 sec max
const POLL_INTERVAL = 3000
let pollingAborted = false

// Plan tier icons
const tierIcons: Record<string, string> = {
  monthly: 'calendar_month',
  yearly: 'event_repeat',
  lifetime: 'all_inclusive'
}

// Use authStore.hasActiveSubscription for consistency

onMounted(async () => {
  await loadPlans()
  await checkPendingReferral()
})

onUnmounted(() => {
  pollingAborted = true
})

async function checkPendingReferral() {
  if (!authStore.isAuthenticated) return
  try {
    const response = await referralService.getPendingReferral()
    if (response.success && (response as any).has_pending_referral) {
      hasPendingReferral.value = true
    }
  } catch {
    // Ignore errors - just don't show referral info
  }
}

// Polling function for subscription activation
async function pollForSubscriptionActivation(): Promise<boolean> {
  if (pollingAborted) return false

  processingAttempts.value++

  try {
    // Try to sync subscription with Stripe
    await api.syncSubscription()

    // Refresh the user profile to get updated subscription status
    await authStore.refreshProfile()

    // Check if subscription is now active
    if (authStore.hasActiveSubscription) {
      return true // Success!
    }

    // Still not active, check if we should keep trying
    if (processingAttempts.value >= MAX_POLLING_ATTEMPTS) {
      return false // Max attempts reached
    }

    // Wait and try again
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL))
    return pollForSubscriptionActivation() // Recursive poll

  } catch (error) {
    // Log error but continue polling (network issues shouldn't stop us)
    warnLog('Polling attempt failed:', error)

    if (processingAttempts.value >= MAX_POLLING_ATTEMPTS) {
      return false
    }

    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL))
    return pollForSubscriptionActivation()
  }
}

async function retryActivation() {
  processingError.value = null
  processingAttempts.value = 0

  const activated = await pollForSubscriptionActivation()

  if (activated) {
    showMessage(t('plans.subscriptionActivated'), 'success')
    await new Promise(resolve => setTimeout(resolve, 1000))
    router.push('/dashboard')
  } else {
    processingError.value = t('plans.activationTakingLong')
  }
}

function goToDashboard() {
  // User chooses to check later - go to dashboard which will show paywall if still not active
  router.push('/dashboard')
}

async function loadPlans() {
  loading.value = true

  try {
    // Pass currency if in devAccess mode
    const devCurrency = localeStore.isDevAccess ? localeStore.currentCurrency : undefined
    const response = await api.getPlans(devCurrency) as PlansResponse

    if (response.success) {
      plans.value = response.plans || []
      currency.value = response.currency || 'usd'
      creditCosts.value = response.credit_costs || { image: 1, video: 5 }
    }
  } catch (error) {
    showMessage(t('plans.failedToLoad'), 'error')
  } finally {
    loading.value = false
  }
}

// Reload plans when currency changes in devAccess mode
watch(
  () => localeStore.currentCurrency,
  () => {
    if (localeStore.isDevAccess) {
      loadPlans()
    }
  }
)

async function subscribe(tier: string) {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }

  try {
    const successUrl = `${window.location.origin}/plans?success=true`
    const cancelUrl = `${window.location.origin}/plans?canceled=true`

    debugLog('[Checkout] Creating checkout session for tier:', tier)
    const response = await api.createCheckout(tier, successUrl, cancelUrl)
    debugLog('[Checkout] Response:', response)

    if (!response.success) {
      const errorMsg = (response as any).message || response.error || t('plans.failedToCheckout')
      errorLog('[Checkout] Error details:', errorMsg)
      showMessage(errorMsg, 'error')
      return
    }

    const checkoutUrl = (response as any).checkout_url || response.data?.checkout_url

    if (!checkoutUrl) {
      errorLog('[Checkout] No checkout URL in response:', response)
      showMessage(t('plans.failedToCheckout'), 'error')
      return
    }

    debugLog('[Checkout] Redirecting to:', checkoutUrl)
    window.location.href = checkoutUrl
  } catch (error: any) {
    errorLog('[Checkout] Error:', error)
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
    debugLog('[Portal] Creating customer portal session')
    const response = await api.createCustomerPortal(returnUrl)
    debugLog('[Portal] Response:', response)

    const portalUrl = (response as any).portal_url || response.data?.url

    if (response.success && portalUrl) {
      debugLog('[Portal] Redirecting to:', portalUrl)
      window.location.href = portalUrl
    } else {
      errorLog('[Portal] No portal URL in response:', response)
      showMessage(t('plans.failedToOpenPortal'), 'error')
    }
  } catch (error: any) {
    errorLog('[Portal] Error:', error)
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

function getTierIcon(tier: string): string {
  return tierIcons[tier] || 'star'
}

function isCurrentPlan(tier: string): boolean {
  return authStore.subscriptionTier === tier
}

function getPriceInterval(plan: Plan): string {
  if (plan.interval === 'month') return t('plans.perMonth')
  if (plan.interval === 'year') return t('plans.perYear')
  if (plan.interval === 'lifetime') return t('plans.oneTime')
  return ''
}

function getMonthlyEquivalent(plan: Plan): string {
  if (plan.interval !== 'year') return ''

  const monthlyPrice = Math.round(plan.price / 12)

  // Format with currency symbol
  const currencySymbols: Record<string, string> = {
    usd: '$',
    nok: 'kr ',
    eur: '€',
    gbp: '£'
  }
  const symbol = currencySymbols[currency.value.toLowerCase()] || '$'

  // For NOK, put symbol after the number
  if (currency.value.toLowerCase() === 'nok') {
    return `${monthlyPrice} ${symbol.trim()}`
  }

  return `${symbol}${monthlyPrice}`
}

function getButtonText(plan: Plan): string {
  // Lifetime is always "Buy"
  if (plan.tier === 'lifetime') {
    return t('plans.buy')
  }

  // If user has monthly subscription and looking at yearly, show "Upgrade"
  if (authStore.subscriptionTier === 'monthly' && plan.tier === 'yearly') {
    return t('plans.upgrade')
  }

  // Default to "Get Started"
  return t('plans.getStarted')
}

function getBadgeText(badge: string): string {
  // Map API badge values to i18n keys
  const badgeMap: Record<string, string> = {
    'Best value': 'plans.bestValue',
    'Launch Deal': 'plans.launchDeal',
    'Most Popular': 'plans.mostPopular',
  }

  const key = badgeMap[badge]
  return key ? t(key) : badge
}

function getFeatureText(feature: string): string {
  // Map API feature values to i18n keys
  const featureMap: Record<string, string> = {
    'AI image generation': 'plans.imageGeneration',
    'AI video generation': 'plans.videoGeneration',
    'Facebook publishing': 'plans.facebookPublishing',
    'Instagram publishing': 'plans.instagramPublishing',
    'Post scheduling': 'plans.postScheduling',
    'Unlimited businesses': 'plans.unlimitedBusinesses',
    'Credits never expire': 'plans.noExpiration',
  }

  const key = featureMap[feature]
  if (key) return t(key)

  // Handle dynamic "X credits upfront/total" features - convert to images/videos
  const creditsMatch = feature.match(/^(\d+)\s+credits?\s+(upfront|total|per month)$/i)
  if (creditsMatch) {
    const credits = parseInt(creditsMatch[1])
    const images = Math.floor(credits / creditCosts.value.image)
    const videos = Math.floor(credits / creditCosts.value.video)
    return `${images} ${t('plans.images')} ${t('plans.orEquivalent')} ${videos} ${t('plans.videos')}`
  }

  return feature
}

// Check for success/canceled parameters
const urlParams = new URLSearchParams(window.location.search)
if (urlParams.get('success') === 'true') {
  // Immediately set processing state to hide plans
  processingPayment.value = true
  processingAttempts.value = 0
  processingError.value = null

  // Clear the URL parameter to prevent re-triggering on refresh
  window.history.replaceState({}, '', window.location.pathname)

  // Start polling for subscription activation (async IIFE)
  ;(async () => {
    const activated = await pollForSubscriptionActivation()

    if (activated) {
      // Success! Show brief success message then redirect
      showMessage(t('plans.subscriptionActivated'), 'success')
      await new Promise(resolve => setTimeout(resolve, 1000)) // Brief pause for user to see success
      router.push('/dashboard')
    } else {
      // Max retries reached - show fallback message
      processingError.value = t('plans.activationTakingLong')
    }
  })()
} else if (urlParams.get('canceled') === 'true') {
  showMessage(t('plans.subscriptionCanceled'), 'info')
}
</script>

<template>
  <!-- Payment Processing State -->
  <div v-if="processingPayment && !processingError" class="processing-overlay">
    <BaseCard variant="solid" class="processing-card">
      <div class="processing-content">
        <!-- Logo with animation -->
        <img
          src="/socialchef_logo.svg"
          alt="Social Chef"
          class="processing-logo"
        />

        <!-- Title -->
        <h2 class="processing-title">{{ $t('plans.activatingSubscription') }}</h2>

        <!-- Progress steps -->
        <div class="processing-steps">
          <div class="processing-step" :class="{ active: processingAttempts >= 1 }">
            <MaterialIcon icon="check_circle" size="sm" />
            <span>{{ $t('plans.paymentReceived') }}</span>
          </div>
          <div class="processing-step" :class="{ active: processingAttempts >= 2 }">
            <MaterialIcon icon="sync" size="sm" :class="{ spinning: processingAttempts >= 2 && processingAttempts < MAX_POLLING_ATTEMPTS }" />
            <span>{{ $t('plans.settingUpAccount') }}</span>
          </div>
          <div class="processing-step pending">
            <MaterialIcon icon="rocket_launch" size="sm" />
            <span>{{ $t('plans.almostReady') }}</span>
          </div>
        </div>

        <!-- Hint text -->
        <p class="processing-hint">{{ $t('plans.processingHint') }}</p>
      </div>
    </BaseCard>
  </div>

  <!-- Error/Timeout State -->
  <div v-else-if="processingPayment && processingError" class="processing-overlay">
    <BaseCard variant="solid" class="processing-card">
      <div class="processing-content">
        <MaterialIcon icon="schedule" size="xl" color="var(--warning-text)" />

        <h2 class="processing-title">{{ $t('plans.activationDelayed') }}</h2>

        <p class="processing-message">{{ processingError }}</p>

        <div class="processing-actions">
          <BaseButton variant="primary" @click="retryActivation">
            {{ $t('common.retry') }}
          </BaseButton>
          <BaseButton variant="secondary" @click="goToDashboard">
            {{ $t('plans.checkLater') }}
          </BaseButton>
        </div>

        <p class="processing-support">
          {{ $t('plans.contactSupport') }}
        </p>
      </div>
    </BaseCard>
  </div>

  <!-- Existing plans content - only show when NOT processing -->
  <component v-else :is="authStore.hasActiveSubscription ? DashboardLayout : 'div'" :class="{ 'plans-standalone': !authStore.hasActiveSubscription }">
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

    <!-- Paywall message for authenticated users without subscription -->
    <BaseAlert
      v-if="authStore.isAuthenticated && !authStore.hasActiveSubscription"
      type="info"
      class="paywall-alert"
    >
      {{ $t('plans.subscriptionRequired') }}
    </BaseAlert>

    <div class="content">
      <h1 class="brand-title">{{ $t('plans.brandTitle') }}</h1>
      <h2 class="section-title">{{ $t('plans.chooseYourPlan') }}</h2>
      <p class="section-subtitle">{{ $t('plans.unlockPower') }}</p>


      <!-- Manage Subscription Button for existing subscribers -->
      <div v-if="authStore.hasActiveSubscription" class="manage-subscription-section">
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
          :variant="plan.tier === 'yearly' ? 'glass-intense' : 'glass'"
          :class="['plan-card', { featured: plan.tier === 'yearly', lifetime: plan.tier === 'lifetime' }]"
          hoverable
        >
          <!-- Badges -->
          <div v-if="plan.badge" class="plan-badge" :class="{ 'lifetime-badge': plan.tier === 'lifetime' }">
            {{ getBadgeText(plan.badge) }}
          </div>
          <div v-if="plan.limited_to" class="limited-badge">
            {{ $t('plans.limitedTo', { count: plan.limited_to }) }}
          </div>
          <div v-if="isCurrentPlan(plan.tier)" class="current-badge">{{ $t('plans.currentPlan') }}</div>

          <!-- Tier Icon -->
          <div class="tier-icon-wrapper">
            <MaterialIcon
              :icon="getTierIcon(plan.tier)"
              size="lg"
              :color="plan.tier === 'lifetime' ? 'var(--gold-primary)' : plan.tier === 'yearly' ? 'var(--gold-light)' : 'var(--text-secondary)'"
            />
          </div>

          <h3 class="plan-name">{{ plan.name }}</h3>

          <!-- Price Display -->
          <div class="price-wrapper">
            <div class="price">{{ plan.formatted_price }}</div>
            <span class="price-period">{{ getPriceInterval(plan) }}</span>
            <span v-if="plan.tier === 'yearly'" class="monthly-equivalent">
              ({{ $t('plans.equalsMonthly', { price: getMonthlyEquivalent(plan) }) }})
            </span>
            <div v-if="plan.savings" class="savings-badge">
              {{ plan.savings }}
            </div>
          </div>

          <!-- Credits as Images/Videos -->
          <div class="credits-highlight">
            <div class="credit-line">
              <MaterialIcon icon="image" size="sm" color="var(--gold-primary)" />
              <span>{{ Math.floor(plan.credits / creditCosts.image) }} {{ $t('plans.images') }}</span>
            </div>
            <span class="or-divider">{{ $t('plans.orEquivalent') }}</span>
            <div class="credit-line">
              <MaterialIcon icon="videocam" size="sm" color="var(--gold-primary)" />
              <span>{{ Math.floor(plan.credits / creditCosts.video) }} {{ $t('plans.videos') }}</span>
            </div>
          </div>

          <ul class="features">
            <li v-for="(feature, index) in plan.features" :key="index">
              <MaterialIcon icon="check_circle" size="sm" color="var(--gold-primary)" class="check-icon" />
              {{ getFeatureText(feature) }}
            </li>
          </ul>

          <!-- Action Buttons -->
          <div class="plan-actions">
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
              v-else
              :variant="plan.tier === 'yearly' || plan.tier === 'lifetime' ? 'primary' : 'secondary'"
              size="large"
              full-width
              @click="subscribe(plan.tier)"
            >
              {{ getButtonText(plan) }}
            </BaseButton>
          </div>
        </BaseCard>
      </div>

      <!-- Promo Code / Referral Info -->
      <div class="promo-info" :class="{ 'referral-active': hasPendingReferral }">
        <MaterialIcon :icon="hasPendingReferral ? 'card_giftcard' : 'local_offer'" size="sm" color="var(--gold-primary)" />
        <span v-if="hasPendingReferral">{{ $t('plans.referralDiscountApplied') }}</span>
        <span v-else>{{ $t('plans.promoCodeHint') }}</span>
      </div>

      <!-- Trust Section -->
      <div class="trust-section">
        <div class="trust-item">
          <MaterialIcon icon="lock" size="sm" color="var(--gold-primary)" />
          <span>{{ $t('plans.securePayment') }}</span>
        </div>
        <div class="trust-item">
          <MaterialIcon icon="sync" size="sm" color="var(--gold-primary)" />
          <span>{{ $t('plans.cancelAnytime') }}</span>
        </div>
        <div class="trust-item">
          <MaterialIcon icon="support_agent" size="sm" color="var(--gold-primary)" />
          <span>{{ $t('plans.prioritySupport') }}</span>
        </div>
      </div>
    </div>
    </div>
  </component>
</template>

<style scoped>
/* Processing Overlay */
.processing-overlay {
  min-height: 100vh;
  background: var(--bg-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-2xl);
}

.processing-card {
  max-width: 500px;
  width: 100%;
  text-align: center;
}

.processing-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-xl);
}

.processing-logo {
  width: 100px;
  height: 100px;
  margin-bottom: var(--space-2xl);
  animation: pulse-logo 2s ease-in-out infinite;
  filter: drop-shadow(0 4px 20px rgba(176, 138, 90, 0.4));
}

@keyframes pulse-logo {
  0%, 100% {
    transform: scale(1);
    filter: drop-shadow(0 4px 20px rgba(176, 138, 90, 0.4));
  }
  50% {
    transform: scale(1.05);
    filter: drop-shadow(0 4px 30px rgba(176, 138, 90, 0.5));
  }
}

.processing-title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  color: var(--gold-primary);
  margin: 0 0 var(--space-2xl) 0;
}

.processing-steps {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  margin-bottom: var(--space-2xl);
  width: 100%;
  max-width: 280px;
}

.processing-step {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md);
  border-radius: var(--radius-md);
  background: var(--bg-tertiary);
  color: var(--text-muted);
  transition: all 0.3s ease;
}

.processing-step.active {
  background: var(--gold-subtle);
  color: var(--gold-primary);
}

.processing-step.active .material-symbols-rounded {
  color: var(--gold-primary);
}

.processing-step.pending {
  opacity: 0.5;
}

.processing-hint {
  font-size: var(--text-sm);
  color: var(--text-muted);
  margin: 0;
}

.processing-message {
  font-size: var(--text-base);
  color: var(--text-secondary);
  margin: var(--space-lg) 0 var(--space-2xl) 0;
  line-height: var(--leading-relaxed);
}

.processing-actions {
  display: flex;
  gap: var(--space-lg);
  margin-bottom: var(--space-xl);
}

.processing-support {
  font-size: var(--text-sm);
  color: var(--text-muted);
  margin: 0;
}

.spinning {
  animation: spin 1s linear infinite;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .processing-logo,
  .spinning {
    animation: none !important;
  }
}

/* Responsive */
@media (max-width: 480px) {
  .processing-overlay {
    padding: var(--space-lg);
  }

  .processing-logo {
    width: 80px;
    height: 80px;
  }

  .processing-title {
    font-size: var(--text-xl);
  }

  .processing-actions {
    flex-direction: column;
    width: 100%;
  }

  .processing-actions button {
    width: 100%;
  }
}

/* Standalone mode (no subscription) - full page with background */
.plans-standalone {
  min-height: 100vh;
  background: var(--bg-primary);
}

.plans-view {
  min-height: 100vh;
  padding: var(--space-2xl);
}

.plans-alert {
  max-width: var(--max-width-2xl);
  margin: 0 auto var(--space-2xl);
}

.paywall-alert {
  max-width: var(--max-width-2xl);
  margin: 0 auto var(--space-xl);
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
  margin-bottom: var(--space-lg);
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
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
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

.plan-card:nth-child(1) { animation-delay: 0.1s; }
.plan-card:nth-child(2) { animation-delay: 0.2s; }
.plan-card:nth-child(3) { animation-delay: 0.3s; }

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

.plan-card.lifetime {
  background: linear-gradient(135deg, rgba(15, 61, 46, 0.15) 0%, rgba(255, 255, 255, 0.9) 100%);
  border: 2px solid var(--gold-primary);
  box-shadow: 0 0 30px rgba(15, 61, 46, 0.2), var(--shadow-lg);
}

.plan-card.lifetime::before {
  content: '';
  position: absolute;
  top: -3px;
  left: -3px;
  right: -3px;
  bottom: -3px;
  background: linear-gradient(135deg, var(--gold-dark) 0%, var(--gold-primary) 50%, var(--gold-light) 100%);
  border-radius: var(--radius-lg);
  z-index: -1;
  opacity: 0.6;
  animation: pulse-glow 2s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 0.8; }
}

.plan-badge {
  position: absolute;
  top: var(--space-lg);
  left: 50%;
  transform: translateX(-50%);
  background: var(--gradient-gold);
  color: var(--text-on-gold);
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  box-shadow: var(--shadow-md);
  white-space: nowrap;
  z-index: 1;
}

.plan-badge.lifetime-badge {
  background: linear-gradient(135deg, var(--gold-dark), var(--gold-primary));
}

.limited-badge {
  position: absolute;
  top: calc(var(--space-lg) + var(--space-2xl));
  left: 50%;
  transform: translateX(-50%);
  background: var(--gold-subtle);
  color: var(--gold-primary);
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  border: var(--border-width) solid var(--gold-primary);
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
  margin-top: var(--space-5xl);
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

.monthly-equivalent {
  display: block;
  color: var(--text-muted);
  font-size: var(--text-xs);
  margin-top: var(--space-xs);
}

.savings-badge {
  background: var(--success-bg);
  color: var(--success-text);
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  margin-top: var(--space-xs);
}

.credits-highlight {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-lg);
  background: var(--gold-subtle);
  border-radius: var(--radius-md);
  margin: var(--space-lg) 0;
}

.credit-line {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.credit-line span {
  color: var(--gold-primary);
  font-weight: var(--font-semibold);
  font-size: var(--text-sm);
}

.or-divider {
  color: var(--text-muted);
  font-size: var(--text-xs);
  font-style: italic;
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

/* Promo Info */
.promo-info {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--space-sm);
  color: var(--text-muted);
  font-size: var(--text-sm);
  margin-bottom: var(--space-2xl);
}

.promo-info.referral-active {
  background: var(--success-bg);
  color: var(--success-text);
  padding: var(--space-md) var(--space-lg);
  border-radius: var(--radius-md);
  border: 1px solid var(--success-border);
  font-weight: var(--font-medium);
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

  .credit-info {
    flex-direction: column;
    gap: var(--space-sm);
  }

  .credit-divider {
    display: none;
  }

  .plans-grid {
    grid-template-columns: 1fr;
    gap: var(--space-xl);
  }

  .plan-card.featured::before,
  .plan-card.lifetime::before {
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

/* ===== DARK MODE OVERRIDES ===== */
:root[data-theme="dark"] .plan-card.lifetime {
  background: linear-gradient(135deg, rgba(194, 163, 107, 0.1) 0%, var(--bg-secondary) 100%);
  border-color: var(--gold-primary);
  box-shadow: 0 0 30px rgba(194, 163, 107, 0.15), var(--shadow-lg);
}

:root[data-theme="dark"] .plan-card.lifetime::before {
  background: linear-gradient(135deg, var(--gold-dark) 0%, var(--gold-primary) 50%, var(--gold-light) 100%);
  opacity: 0.4;
}

:root[data-theme="dark"] .plan-badge {
  background: var(--gradient-gold);
  color: var(--bg-primary);
}

:root[data-theme="dark"] .plan-badge.lifetime-badge {
  background: linear-gradient(135deg, var(--gold-dark), var(--gold-primary));
}

:root[data-theme="dark"] .limited-badge {
  background: var(--accent-alpha-10);
  border-color: var(--gold-primary);
  color: var(--gold-primary);
}

:root[data-theme="dark"] .credits-highlight {
  background: var(--accent-alpha-10);
}
</style>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import { useLocaleStore } from '../stores/locale'
import { api } from '../services/api'
import BaseModal from './BaseModal.vue'
import BaseCard from './BaseCard.vue'
import BaseButton from './BaseButton.vue'
import BaseAlert from './BaseAlert.vue'
import MaterialIcon from './MaterialIcon.vue'

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

interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'payment-success'): void
}>()

useRouter()
useAuthStore()
const localeStore = useLocaleStore()
const { t } = useI18n()

const plans = ref<Plan[]>([])
const creditCosts = ref({ image: 1, video: 5 })
const loading = ref(true)
const message = ref('')
const messageType = ref<'success' | 'error' | 'info'>('info')

const tierIcons: Record<string, string> = {
  monthly: 'calendar_month',
  yearly: 'event_repeat',
  lifetime: 'all_inclusive'
}

onMounted(async () => {
  await loadPlans()
})

async function loadPlans() {
  loading.value = true

  try {
    // Pass currency if in devAccess mode
    const currency = localeStore.isDevAccess ? localeStore.currentCurrency : undefined
    const response = await api.getPlans(currency) as PlansResponse

    if (response.success) {
      plans.value = response.plans || []
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
  try {
    const successUrl = `${window.location.origin}/posts/create?payment=success`
    const cancelUrl = `${window.location.origin}/?payment=canceled`

    const response = await api.createCheckout(tier, successUrl, cancelUrl)

    if (!response.success) {
      const errorMsg = (response as any).message || response.error || t('plans.failedToCheckout')
      showMessage(errorMsg, 'error')
      return
    }

    const checkoutUrl = (response as any).checkout_url || response.data?.checkout_url

    if (!checkoutUrl) {
      showMessage(t('plans.failedToCheckout'), 'error')
      return
    }

    window.location.href = checkoutUrl
  } catch (error: any) {
    showMessage(error.message || t('plans.networkError'), 'error')
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

function getPriceInterval(plan: Plan): string {
  if (plan.interval === 'month') return t('plans.perMonth')
  if (plan.interval === 'year') return t('plans.perYear')
  if (plan.interval === 'lifetime') return t('plans.oneTime')
  return ''
}

function getButtonText(plan: Plan): string {
  if (plan.tier === 'lifetime') {
    return t('plans.buy')
  }
  return t('plans.getStarted')
}

function getBadgeText(badge: string): string {
  const badgeMap: Record<string, string> = {
    'Best value': 'plans.bestValue',
    'Launch Deal': 'plans.launchDeal',
    'Most Popular': 'plans.mostPopular',
  }

  const key = badgeMap[badge]
  return key ? t(key) : badge
}

function close() {
  emit('update:modelValue', false)
}
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    size="xl"
    :close-on-overlay-click="false"
    @update:model-value="emit('update:modelValue', $event)"
    @close="close"
  >
    <div class="paywall-modal">
      <!-- Header -->
      <div class="paywall-header">
        <h2 class="paywall-title">{{ $t('landing.paywall.title') }}</h2>
        <p class="paywall-subtitle">{{ $t('landing.paywall.subtitle') }}</p>
      </div>

      <!-- Alert -->
      <BaseAlert
        v-if="message"
        :type="messageType"
        :model-value="!!message"
        @update:model-value="message = ''"
        class="paywall-alert"
      >
        {{ message }}
      </BaseAlert>

      <!-- Loading -->
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>{{ $t('plans.loading') }}</p>
      </div>

      <!-- Plans Grid -->
      <div v-else class="plans-grid">
        <BaseCard
          v-for="plan in plans"
          :key="plan.tier"
          :variant="plan.tier === 'yearly' ? 'glass-intense' : 'glass'"
          :class="['plan-card', { featured: plan.tier === 'yearly', lifetime: plan.tier === 'lifetime' }]"
          hoverable
        >
          <!-- Badge -->
          <div v-if="plan.badge" class="plan-badge" :class="{ 'lifetime-badge': plan.tier === 'lifetime' }">
            {{ getBadgeText(plan.badge) }}
          </div>
          <div v-if="plan.limited_to" class="limited-badge">
            {{ $t('plans.limitedTo', { count: plan.limited_to }) }}
          </div>

          <!-- Icon -->
          <div class="tier-icon-wrapper">
            <MaterialIcon
              :icon="getTierIcon(plan.tier)"
              size="lg"
              :color="plan.tier === 'lifetime' ? 'var(--gold-primary)' : plan.tier === 'yearly' ? 'var(--gold-light)' : 'var(--text-secondary)'"
            />
          </div>

          <h3 class="plan-name">{{ plan.name }}</h3>

          <!-- Price -->
          <div class="price-wrapper">
            <div class="price">{{ plan.formatted_price }}</div>
            <span class="price-period">{{ getPriceInterval(plan) }}</span>
            <div v-if="plan.savings" class="savings-badge">
              {{ plan.savings }}
            </div>
          </div>

          <!-- Credits -->
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

          <!-- Action Button -->
          <BaseButton
            :variant="plan.tier === 'yearly' || plan.tier === 'lifetime' ? 'primary' : 'secondary'"
            size="large"
            full-width
            @click="subscribe(plan.tier)"
          >
            {{ getButtonText(plan) }}
          </BaseButton>
        </BaseCard>
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

      <!-- Auto-posting reminder -->
      <div class="auto-posting-reminder">
        <MaterialIcon icon="auto_awesome" size="sm" color="var(--gold-primary)" />
        <span>{{ $t('landing.paywall.autoPostingReminder') }}</span>
      </div>
    </div>
  </BaseModal>
</template>

<style scoped>
.paywall-modal {
  text-align: center;
}

.paywall-header {
  margin-bottom: var(--space-2xl);
}

.paywall-title {
  font-family: var(--font-heading);
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  background: var(--gradient-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: var(--space-sm);
}

.paywall-subtitle {
  font-size: var(--text-lg);
  color: var(--text-secondary);
}

.paywall-alert {
  margin-bottom: var(--space-xl);
}

/* Loading */
.loading {
  text-align: center;
  padding: var(--space-4xl);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-lg);
}

.loading p {
  color: var(--text-secondary);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-color);
  border-top: 3px solid var(--gold-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Plans Grid */
.plans-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-xl);
  margin-bottom: var(--space-2xl);
}

.plan-card {
  text-align: center;
  position: relative;
  padding: var(--space-xl);
  animation: fadeInUp 0.6s var(--ease-smooth);
  animation-fill-mode: both;
}

.plan-card:nth-child(1) { animation-delay: 0.1s; }
.plan-card:nth-child(2) { animation-delay: 0.2s; }
.plan-card:nth-child(3) { animation-delay: 0.3s; }

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

.plan-card.featured {
  border: 2px solid var(--gold-primary);
}

.plan-card.lifetime {
  background: linear-gradient(135deg, rgba(15, 61, 46, 0.1) 0%, rgba(255, 255, 255, 0.9) 100%);
}

.plan-badge {
  position: absolute;
  top: var(--space-md);
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
  white-space: nowrap;
}

.plan-badge.lifetime-badge {
  background: linear-gradient(135deg, var(--gold-dark), var(--gold-primary));
}

.limited-badge {
  position: absolute;
  top: calc(var(--space-md) + var(--space-2xl));
  left: 50%;
  transform: translateX(-50%);
  background: var(--gold-subtle);
  color: var(--gold-primary);
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  border: 1px solid var(--gold-primary);
  white-space: nowrap;
}

.tier-icon-wrapper {
  margin-top: var(--space-3xl);
  margin-bottom: var(--space-md);
}

.plan-name {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  color: var(--text-primary);
  margin-bottom: var(--space-md);
}

.price-wrapper {
  margin-bottom: var(--space-lg);
}

.price {
  font-size: var(--text-4xl);
  font-weight: var(--font-bold);
  background: var(--gradient-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-family: var(--font-heading);
  line-height: 1.1;
}

.price-period {
  display: block;
  color: var(--text-muted);
  font-size: var(--text-sm);
  margin-top: var(--space-xs);
}

.savings-badge {
  display: inline-block;
  background: var(--success-bg);
  color: var(--success-text);
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  margin-top: var(--space-sm);
}

.credits-highlight {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-md);
  background: var(--gold-subtle);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-lg);
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

/* Trust Section */
.trust-section {
  display: flex;
  justify-content: center;
  gap: var(--space-2xl);
  padding: var(--space-xl) 0;
  border-top: 1px solid var(--border-color);
  margin-top: var(--space-xl);
}

.trust-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  color: var(--text-secondary);
  font-size: var(--text-sm);
}

/* Auto-posting reminder */
.auto-posting-reminder {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-lg);
  background: var(--gold-subtle);
  border-radius: var(--radius-md);
  margin-top: var(--space-lg);
  color: var(--gold-primary);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
}

/* Responsive */
@media (max-width: 768px) {
  .plans-grid {
    grid-template-columns: 1fr;
    gap: var(--space-lg);
  }

  .trust-section {
    flex-direction: column;
    align-items: center;
    gap: var(--space-md);
  }

  .paywall-title {
    font-size: var(--text-2xl);
  }

  .paywall-subtitle {
    font-size: var(--text-base);
  }

  .price {
    font-size: var(--text-3xl);
  }
}

@media (prefers-reduced-motion: reduce) {
  .plan-card {
    animation: none;
  }
}

/* ===== DARK MODE OVERRIDES ===== */
:root[data-theme="dark"] .plan-card.lifetime {
  background: linear-gradient(135deg, var(--accent-alpha-10) 0%, var(--bg-secondary) 100%);
}
</style>

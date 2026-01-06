<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import { referralService, type ReferralValidation } from '../services/referralService'
import BaseCard from '../components/BaseCard.vue'
import BaseButton from '../components/BaseButton.vue'
import BaseAlert from '../components/BaseAlert.vue'
import MaterialIcon from '../components/MaterialIcon.vue'
import LoginModal from '../components/LoginModal.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { t } = useI18n()

// State
const referralCode = ref<string>('')
const validation = ref<ReferralValidation | null>(null)
const isLoading = ref(true)
const isApplying = ref(false)
const error = ref('')
const success = ref('')
const showLoginModal = ref(false)

// Get referral code from URL
onMounted(async () => {
  const codeFromUrl = route.query.ref as string
  if (codeFromUrl) {
    referralCode.value = codeFromUrl.trim()
    await validateCode()
  } else {
    isLoading.value = false
  }
})

// Validate the referral code
async function validateCode() {
  if (!referralCode.value) {
    isLoading.value = false
    return
  }

  try {
    const response = await referralService.validateCode(referralCode.value)
    if (response.success) {
      validation.value = {
        valid: (response as any).valid,
        referrer_name: (response as any).referrer_name,
        benefits: (response as any).benefits,
        error: (response as any).error,
      }
    } else {
      error.value = response.error || t('referral.invalidCode')
    }
  } catch (err) {
    error.value = t('referral.validationError')
  } finally {
    isLoading.value = false
  }
}

// Apply the referral code and proceed
async function handleGetStarted() {
  // If not authenticated, show login modal
  if (!authStore.isAuthenticated) {
    showLoginModal.value = true
    return
  }

  // Apply the referral code
  isApplying.value = true
  error.value = ''

  try {
    const response = await referralService.applyCode(referralCode.value)
    if (response.success) {
      success.value = response.message || t('referral.codeApplied')
      // Redirect to plans after a short delay
      setTimeout(() => {
        router.push('/plans')
      }, 1500)
    } else {
      error.value = response.error || t('referral.applyError')
    }
  } catch (err) {
    error.value = t('referral.applyError')
  } finally {
    isApplying.value = false
  }
}

// Handle successful login from modal
function handleLoginSuccess() {
  showLoginModal.value = false
  // After login, apply the code
  handleGetStarted()
}

// Is the code valid?
const isValidCode = computed(() => validation.value?.valid === true)

// Benefits display
const benefits = computed(() => [
  {
    icon: 'card_giftcard',
    title: t('referral.freeMonth'),
    description: t('referral.freeMonthDesc'),
  },
  {
    icon: 'savings',
    title: t('referral.fiftyOff'),
    description: t('referral.fiftyOffDesc'),
  },
  {
    icon: 'all_inclusive',
    title: t('referral.fullAccess'),
    description: t('referral.fullAccessDesc'),
  },
])

// How it works steps
const howItWorksSteps = computed(() => [
  {
    number: 1,
    title: t('referral.step1Title'),
    description: t('referral.step1Desc'),
  },
  {
    number: 2,
    title: t('referral.step2Title'),
    description: t('referral.step2Desc'),
  },
  {
    number: 3,
    title: t('referral.step3Title'),
    description: t('referral.step3Desc'),
  },
])
</script>

<template>
  <div class="referral-landing">
    <!-- Header -->
    <header class="landing-header">
      <div class="header-content">
        <router-link to="/" class="logo">
          <span class="logo-text">SocialChef</span>
        </router-link>
        <div class="header-actions">
          <BaseButton
            v-if="!authStore.isAuthenticated"
            variant="secondary"
            size="small"
            @click="showLoginModal = true"
          >
            {{ $t('common.login') }}
          </BaseButton>
          <BaseButton
            v-else
            variant="secondary"
            size="small"
            @click="router.push('/posts')"
          >
            {{ $t('common.dashboard') }}
          </BaseButton>
        </div>
      </div>
    </header>

    <main class="landing-main">
      <!-- Loading State -->
      <div v-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>{{ $t('common.loading') }}</p>
      </div>

      <!-- Error State (invalid code) -->
      <div v-else-if="!isValidCode && referralCode" class="error-state">
        <BaseCard variant="glass" class="error-card">
          <MaterialIcon icon="error_outline" size="xl" color="var(--error-text)" />
          <h2>{{ $t('referral.invalidCodeTitle') }}</h2>
          <p>{{ validation?.error || $t('referral.invalidCode') }}</p>
          <BaseButton variant="primary" @click="router.push('/')">
            {{ $t('referral.goToHome') }}
          </BaseButton>
        </BaseCard>
      </div>

      <!-- No Code State -->
      <div v-else-if="!referralCode" class="no-code-state">
        <BaseCard variant="glass" class="info-card">
          <MaterialIcon icon="link_off" size="xl" color="var(--text-secondary)" />
          <h2>{{ $t('referral.noCodeTitle') }}</h2>
          <p>{{ $t('referral.noCodeDesc') }}</p>
          <BaseButton variant="primary" @click="router.push('/')">
            {{ $t('referral.goToHome') }}
          </BaseButton>
        </BaseCard>
      </div>

      <!-- Valid Code - Main Content -->
      <template v-else>
        <!-- Hero Section -->
        <section class="hero-section">
          <div class="hero-content">
            <div class="referrer-badge" v-if="validation?.referrer_name">
              <MaterialIcon icon="person" size="sm" />
              <span>{{ $t('referral.invitedBy', { name: validation.referrer_name }) }}</span>
            </div>
            <h1 class="hero-title">{{ $t('referral.landingTitle') }}</h1>
            <p class="hero-subtitle">{{ $t('referral.landingSubtitle') }}</p>
          </div>
        </section>

        <!-- Alerts -->
        <div class="alerts-container">
          <BaseAlert v-if="error" type="error" dismissible @update:model-value="error = ''">
            {{ error }}
          </BaseAlert>
          <BaseAlert v-if="success" type="success" dismissible @update:model-value="success = ''">
            {{ success }}
          </BaseAlert>
        </div>

        <!-- Benefits Section -->
        <section class="benefits-section">
          <h2 class="section-title">{{ $t('referral.benefitsTitle') }}</h2>
          <div class="benefits-grid">
            <BaseCard
              v-for="(benefit, index) in benefits"
              :key="index"
              variant="glass"
              class="benefit-card"
              hoverable
            >
              <div class="benefit-icon">
                <MaterialIcon :icon="benefit.icon" size="lg" color="var(--gold-primary)" />
              </div>
              <h3>{{ benefit.title }}</h3>
              <p>{{ benefit.description }}</p>
            </BaseCard>
          </div>
        </section>

        <!-- CTA Section -->
        <section class="cta-section">
          <BaseCard variant="glass-intense" class="cta-card">
            <div class="cta-content">
              <div class="discount-badge">
                <span class="discount-amount">{{ $t('referral.discountBadge') }}</span>
              </div>
              <h2>{{ $t('referral.ctaTitle') }}</h2>
              <p class="cta-description">{{ $t('referral.ctaDescription') }}</p>
              <BaseButton
                variant="primary"
                size="large"
                :disabled="isApplying"
                @click="handleGetStarted"
              >
                <MaterialIcon v-if="isApplying" icon="hourglass_empty" size="sm" class="spin" />
                <span v-else>{{ $t('referral.getStarted') }}</span>
              </BaseButton>
              <p class="cta-note">{{ $t('referral.ctaNote') }}</p>
            </div>
          </BaseCard>
        </section>

        <!-- How It Works Section -->
        <section class="how-it-works-section">
          <h2 class="section-title">{{ $t('referral.howItWorks') }}</h2>
          <div class="steps-grid">
            <div v-for="step in howItWorksSteps" :key="step.number" class="step-item">
              <div class="step-number">{{ step.number }}</div>
              <h3>{{ step.title }}</h3>
              <p>{{ step.description }}</p>
            </div>
          </div>
        </section>
      </template>
    </main>

    <!-- Footer -->
    <footer class="landing-footer">
      <p>&copy; {{ new Date().getFullYear() }} SocialChef. {{ $t('common.allRightsReserved') }}</p>
    </footer>

    <!-- Login Modal -->
    <LoginModal
      v-model="showLoginModal"
      @close="showLoginModal = false"
      @success="handleLoginSuccess"
    />
  </div>
</template>

<style scoped>
.referral-landing {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
}

/* Header */
.landing-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--glass-border);
  padding: var(--space-md) var(--space-xl);
}

.header-content {
  max-width: var(--max-width-2xl);
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  text-decoration: none;
}

.logo-text {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  background: var(--gradient-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Main Content */
.landing-main {
  flex: 1;
  max-width: var(--max-width-2xl);
  margin: 0 auto;
  padding: var(--space-2xl);
  width: 100%;
}

/* Loading & Error States */
.loading-state,
.error-state,
.no-code-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: var(--space-lg);
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

.error-card,
.info-card {
  text-align: center;
  padding: var(--space-3xl);
  max-width: 500px;
}

.error-card h2,
.info-card h2 {
  margin: var(--space-lg) 0 var(--space-md);
  color: var(--text-primary);
}

.error-card p,
.info-card p {
  color: var(--text-secondary);
  margin-bottom: var(--space-xl);
}

/* Hero Section */
.hero-section {
  text-align: center;
  padding: var(--space-3xl) 0;
}

.hero-content {
  max-width: 700px;
  margin: 0 auto;
}

.referrer-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  background: var(--gold-subtle);
  color: var(--gold-primary);
  padding: var(--space-sm) var(--space-lg);
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  margin-bottom: var(--space-xl);
}

.hero-title {
  font-family: var(--font-heading);
  font-size: var(--text-5xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  margin-bottom: var(--space-lg);
  line-height: 1.1;
}

.hero-subtitle {
  font-size: var(--text-xl);
  color: var(--text-secondary);
  line-height: 1.6;
}

/* Alerts */
.alerts-container {
  max-width: 600px;
  margin: 0 auto var(--space-2xl);
}

/* Benefits Section */
.benefits-section {
  padding: var(--space-3xl) 0;
}

.section-title {
  text-align: center;
  font-family: var(--font-heading);
  font-size: var(--text-3xl);
  color: var(--text-primary);
  margin-bottom: var(--space-2xl);
}

.benefits-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--space-xl);
}

.benefit-card {
  text-align: center;
  padding: var(--space-2xl);
}

.benefit-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto var(--space-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gold-subtle);
  border-radius: var(--radius-lg);
}

.benefit-card h3 {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  color: var(--text-primary);
  margin-bottom: var(--space-sm);
}

.benefit-card p {
  color: var(--text-secondary);
  font-size: var(--text-sm);
  line-height: 1.5;
}

/* CTA Section */
.cta-section {
  padding: var(--space-2xl) 0;
}

.cta-card {
  max-width: 600px;
  margin: 0 auto;
  padding: var(--space-3xl);
  text-align: center;
  position: relative;
  overflow: hidden;
}

.cta-card::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: var(--gradient-gold);
  border-radius: var(--radius-lg);
  z-index: -1;
  opacity: 0.3;
}

.discount-badge {
  display: inline-block;
  background: var(--gradient-gold);
  color: var(--text-on-gold);
  padding: var(--space-sm) var(--space-xl);
  border-radius: var(--radius-full);
  font-weight: var(--font-bold);
  font-size: var(--text-lg);
  margin-bottom: var(--space-xl);
}

.cta-content h2 {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  color: var(--text-primary);
  margin-bottom: var(--space-md);
}

.cta-description {
  color: var(--text-secondary);
  margin-bottom: var(--space-xl);
  line-height: 1.6;
}

.cta-note {
  color: var(--text-muted);
  font-size: var(--text-sm);
  margin-top: var(--space-lg);
}

/* How It Works Section */
.how-it-works-section {
  padding: var(--space-3xl) 0;
}

.steps-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--space-2xl);
}

.step-item {
  text-align: center;
  padding: var(--space-xl);
}

.step-number {
  width: 48px;
  height: 48px;
  margin: 0 auto var(--space-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gradient-gold);
  color: var(--text-on-gold);
  border-radius: var(--radius-full);
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
}

.step-item h3 {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  color: var(--text-primary);
  margin-bottom: var(--space-sm);
}

.step-item p {
  color: var(--text-secondary);
  font-size: var(--text-sm);
  line-height: 1.5;
}

/* Footer */
.landing-footer {
  text-align: center;
  padding: var(--space-2xl);
  color: var(--text-muted);
  font-size: var(--text-sm);
  border-top: 1px solid var(--border-color);
}

/* Animations */
.spin {
  animation: spin 1s linear infinite;
}

/* Responsive */
@media (max-width: 768px) {
  .landing-main {
    padding: var(--space-lg);
  }

  .hero-title {
    font-size: var(--text-3xl);
  }

  .hero-subtitle {
    font-size: var(--text-base);
  }

  .section-title {
    font-size: var(--text-2xl);
  }

  .benefits-grid {
    grid-template-columns: 1fr;
  }

  .steps-grid {
    grid-template-columns: 1fr;
  }

  .cta-card {
    padding: var(--space-xl);
  }
}
</style>

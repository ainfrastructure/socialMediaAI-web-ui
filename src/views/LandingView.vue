<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import { useLogin } from '../composables/useLogin'
import { api } from '../services/api'
import BaseCard from '../components/BaseCard.vue'
import BaseButton from '../components/BaseButton.vue'
import BaseInput from '../components/BaseInput.vue'
import BaseAlert from '../components/BaseAlert.vue'
import MaterialIcon from '../components/MaterialIcon.vue'
import LoginModal from '../components/LoginModal.vue'
import PaywallModal from '../components/PaywallModal.vue'
import LanguageSelector from '../components/LanguageSelector.vue'
import AppleIcon from '../components/icons/AppleIcon.vue'
import GoogleIcon from '../components/icons/GoogleIcon.vue'
import FacebookIcon from '../components/icons/FacebookIcon.vue'

const router = useRouter()
const authStore = useAuthStore()
const { t } = useI18n()

// Login composable for inline login box
const {
  email,
  message,
  messageType,
  loggingIn,
  lastUsedProvider,
  loading: loginLoading,
  isDev,
  resetForm,
  handleEmailLogin: doEmailLogin,
  handleAppleSignIn,
  handleGoogleSignIn,
  handleFacebookSignIn,
} = useLogin()

const showLoginModal = ref(false)
const showPaywallModal = ref(false)

// Pricing data from API
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

const plans = ref<Plan[]>([])
const creditCosts = ref({ image: 1, video: 5 })
const plansLoading = ref(true)

const tierIcons: Record<string, string> = {
  monthly: 'calendar_month',
  yearly: 'event_repeat',
  lifetime: 'all_inclusive',
}

// Check if user has an active subscription
const hasSubscription = computed(() => {
  return (
    authStore.isAuthenticated &&
    authStore.subscriptionTier &&
    ['monthly', 'yearly', 'lifetime'].includes(authStore.subscriptionTier)
  )
})

async function loadPlans() {
  plansLoading.value = true
  try {
    const response = (await api.getPlans()) as PlansResponse
    if (response.success) {
      plans.value = response.plans || []
      creditCosts.value = response.credit_costs || { image: 1, video: 5 }
    }
  } catch (error) {
    console.error('Failed to load plans:', error)
  } finally {
    plansLoading.value = false
  }
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

function getBadgeText(badge: string): string {
  const badgeMap: Record<string, string> = {
    'Best value': 'plans.bestValue',
    'Launch Deal': 'plans.launchDeal',
    'Most Popular': 'plans.mostPopular',
  }
  const key = badgeMap[badge]
  return key ? t(key) : badge
}

function handleCTAClick() {
  if (authStore.isAuthenticated) {
    if (hasSubscription.value) {
      router.push('/posts/create')
    } else {
      showPaywallModal.value = true
    }
  } else {
    showLoginModal.value = true
  }
}

async function handleInlineEmailLogin() {
  const result = await doEmailLogin()
  if (result.success) {
    onLoginSuccess()
  }
}

function onLoginSuccess() {
  showLoginModal.value = false
  resetForm()
  // Only show paywall if user doesn't have an active subscription
  if (hasSubscription.value) {
    router.push('/posts/create')
  } else {
    showPaywallModal.value = true
  }
}

function onPaymentSuccess() {
  showPaywallModal.value = false
  router.push('/posts/create')
}

function goToDashboard() {
  router.push('/posts/create')
}

// Examples showcase data
// First example: 1 original → 3 generated versions
const multiExample = {
  id: 1,
  original: '/example/original.jpeg',
  generated: [
    { src: '/example/original1-studio.jpeg', templateKey: 'studioShot' },
    { src: '/example/original1-one-bite.jpeg', templateKey: 'oneBite' },
    { src: '/example/orignal1-custom.jpeg', templateKey: 'custom' },
  ],
  captionKey: 'exampleCaption1',
}

// Before/After comparison examples
const comparisonExamples = [
  {
    id: 1,
    original: '/example/original-2.jpeg',
    generated: '/example/behind-the-scens-of-original-2.jpeg',
    templateKey: 'behindTheScenes',
  },
  {
    id: 2,
    original: '/example/orignal-3.png',
    generated: '/example/orignal-3-studio.jpeg',
    templateKey: 'studioShot',
  },
]

// Before/After slider state
const selectedComparisonIndex = ref(0)
const sliderPosition = ref(50) // percentage
const isDragging = ref(false)
const hasInteracted = ref(false) // Track if user has interacted
const sliderContainerRef = ref<HTMLElement | null>(null)
let animationFrame: number | null = null

const selectedComparison = computed(() => comparisonExamples[selectedComparisonIndex.value])

function selectComparison(index: number) {
  selectedComparisonIndex.value = index
  sliderPosition.value = 50 // Reset slider position
  hasInteracted.value = false // Reset to allow animation on new selection
  startHintAnimation()
}

function startDragging(e: MouseEvent | TouchEvent) {
  isDragging.value = true
  hasInteracted.value = true // User has interacted, stop animation
  stopHintAnimation()
  updateSliderPosition(e)
}

function stopDragging() {
  isDragging.value = false
}

function handleDrag(e: MouseEvent | TouchEvent) {
  if (!isDragging.value) return
  updateSliderPosition(e)
}

function updateSliderPosition(e: MouseEvent | TouchEvent) {
  if (!sliderContainerRef.value) return

  const rect = sliderContainerRef.value.getBoundingClientRect()
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
  const x = clientX - rect.left
  const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))
  sliderPosition.value = percentage
}

// Hint animation that moves the slider back and forth
function startHintAnimation() {
  if (hasInteracted.value) return

  const duration = 3000 // 3 seconds per cycle for full width sweep
  const startTime = Date.now()

  function animate() {
    if (hasInteracted.value || isDragging.value) {
      stopHintAnimation()
      return
    }

    const elapsed = Date.now() - startTime
    const progress = (elapsed % duration) / duration
    // Sine wave oscillation between 5% and 95% (full width)
    const position = 50 + Math.sin(progress * Math.PI * 2) * 45
    sliderPosition.value = position

    animationFrame = requestAnimationFrame(animate)
  }

  animate()
}

function stopHintAnimation() {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame)
    animationFrame = null
  }
}

// Start hint animation on mount
onMounted(async () => {
  await loadPlans()
  // Delay start of hint animation
  setTimeout(() => {
    if (!hasInteracted.value) {
      startHintAnimation()
    }
  }, 1000)
})

// Benefits data
const benefits = [
  {
    id: 'time',
    icon: 'schedule',
    title: 'landing.benefits.time.title',
    description: 'landing.benefits.time.description',
  },
  {
    id: 'professional',
    icon: 'auto_awesome',
    title: 'landing.benefits.professional.title',
    description: 'landing.benefits.professional.description',
  },
  {
    id: 'growth',
    icon: 'trending_up',
    title: 'landing.benefits.growth.title',
    description: 'landing.benefits.growth.description',
  },
  {
    id: 'easy',
    icon: 'thumb_up',
    title: 'landing.benefits.easy.title',
    description: 'landing.benefits.easy.description',
  },
]
</script>

<template>
  <div class="landing-page">
    <!-- Language Selector Header -->
    <div class="landing-header">
      <LanguageSelector />
    </div>

    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-content">
        <div class="hero-text">
          <img src="../assets/socialchef_logo.svg" alt="SocialChef" class="hero-logo" />
          <h1 class="hero-headline">{{ $t('landing.hero.headline') }}</h1>
          <p class="hero-subheadline">{{ $t('landing.hero.subheadline') }}</p>
          <BaseButton variant="primary" size="large" class="hero-cta" @click="handleCTAClick">
            {{ $t('landing.hero.cta') }}
          </BaseButton>
        </div>

        <!-- Inline Login Box -->
        <div class="hero-login">
          <BaseCard variant="glass-intense" class="login-box">
            <!-- If authenticated, show dashboard button -->
            <template v-if="authStore.isAuthenticated">
              <div class="login-header">
                <h2 class="login-title">{{ $t('common.welcome') }}</h2>
                <p class="login-subtitle">{{ authStore.user?.email }}</p>
              </div>
              <BaseButton variant="primary" size="large" full-width @click="goToDashboard">
                {{ $t('landing.loginBox.goToDashboard') }}
              </BaseButton>
            </template>

            <!-- If not authenticated, show login form -->
            <template v-else>
              <div class="login-header">
                <h2 class="login-title">{{ $t('landing.loginBox.title') }}</h2>
                <p class="login-subtitle">{{ $t('landing.loginBox.subtitle') }}</p>
              </div>

              <!-- Alert -->
              <BaseAlert
                v-if="message"
                :type="messageType"
                :model-value="!!message"
                @update:model-value="message = ''"
                class="login-alert"
              >
                {{ message }}
              </BaseAlert>

              <!-- Login Content -->
              <div class="login-content">
                <!-- Email Login (Primary) -->
                <form @submit.prevent="handleInlineEmailLogin" class="email-form">
                  <BaseInput
                    v-model="email"
                    type="email"
                    :label="$t('auth.email')"
                    :placeholder="$t('auth.emailPlaceholder')"
                    required
                  />

                  <BaseButton
                    type="submit"
                    variant="primary"
                    size="large"
                    full-width
                    :disabled="loggingIn"
                  >
                    {{
                      loggingIn ? $t('common.loading') : isDev ? 'Dev Login' : $t('auth.sendLoginLink')
                    }}
                  </BaseButton>
                </form>

                <!-- Divider -->
                <div class="login-divider">
                  <span>{{ $t('auth.orContinueWith') }}</span>
                </div>

                <!-- Social Login (Secondary) -->
                <div class="social-buttons">
                  <div class="social-button-wrapper">
                    <button
                      type="button"
                      class="social-sign-in-button apple-button"
                      :disabled="loginLoading"
                      @click="handleAppleSignIn"
                    >
                      <AppleIcon :size="20" />
                      <span>{{ $t('auth.continueWithApple') }}</span>
                    </button>
                    <span v-if="lastUsedProvider === 'apple'" class="last-used-badge">
                      {{ $t('auth.lastUsed') }}
                    </span>
                  </div>

                  <div class="social-button-wrapper">
                    <button
                      type="button"
                      class="social-sign-in-button google-button"
                      :disabled="loginLoading"
                      @click="handleGoogleSignIn"
                    >
                      <GoogleIcon :size="20" />
                      <span>{{ $t('auth.continueWithGoogle') }}</span>
                    </button>
                    <span v-if="lastUsedProvider === 'google'" class="last-used-badge">
                      {{ $t('auth.lastUsed') }}
                    </span>
                  </div>

                  <div class="social-button-wrapper">
                    <button
                      type="button"
                      class="social-sign-in-button facebook-button"
                      :disabled="loginLoading"
                      @click="handleFacebookSignIn"
                    >
                      <FacebookIcon :size="20" />
                      <span>{{ $t('auth.continueWithFacebook') }}</span>
                    </button>
                    <span v-if="lastUsedProvider === 'facebook'" class="last-used-badge">
                      {{ $t('auth.lastUsed') }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Legal Links -->
              <div class="legal-links">
                <router-link to="/privacy-policy">{{ $t('auth.privacyPolicy') }}</router-link>
                <span class="separator">·</span>
                <router-link to="/terms">{{ $t('auth.termsOfService') }}</router-link>
              </div>
            </template>
          </BaseCard>
        </div>
      </div>
    </section>

    <!-- How It Works Section -->
    <section class="how-it-works-section">
      <div class="section-container">
        <h2 class="section-title">{{ $t('landing.howItWorks.title') }}</h2>

        <div class="steps-grid">
          <!-- Step 1 -->
          <div class="step-card">
            <div class="step-number">1</div>
            <div class="step-image-placeholder">
              <MaterialIcon icon="photo_camera" size="lg" />
              <span>{{ $t('landing.howItWorks.step1Image') }}</span>
            </div>
            <h3 class="step-title">{{ $t('landing.howItWorks.step1Title') }}</h3>
            <p class="step-description">{{ $t('landing.howItWorks.step1Description') }}</p>
          </div>

          <!-- Step 2 -->
          <div class="step-card">
            <div class="step-number">2</div>
            <div class="step-image-placeholder">
              <MaterialIcon icon="auto_awesome" size="lg" />
              <span>{{ $t('landing.howItWorks.step2Image') }}</span>
            </div>
            <h3 class="step-title">{{ $t('landing.howItWorks.step2Title') }}</h3>
            <p class="step-description">{{ $t('landing.howItWorks.step2Description') }}</p>
          </div>

          <!-- Step 3 -->
          <div class="step-card">
            <div class="step-number">3</div>
            <div class="step-image-placeholder">
              <MaterialIcon icon="send" size="lg" />
              <span>{{ $t('landing.howItWorks.step3Image') }}</span>
            </div>
            <h3 class="step-title">{{ $t('landing.howItWorks.step3Title') }}</h3>
            <p class="step-description">{{ $t('landing.howItWorks.step3Description') }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Examples Showcase Section -->
    <section class="examples-section">
      <div class="section-container">
        <h2 class="section-title">{{ $t('landing.examples.title') }}</h2>
        <p class="section-subtitle">{{ $t('landing.examples.subtitle') }}</p>

        <!-- Main Example: Full workflow with detailed explanations -->
        <div class="main-example-flow">
          <!-- Step 1: Upload -->
          <div class="flow-step-card">
            <div class="step-header">
              <span class="step-badge">1</span>
              <h3 class="step-title">{{ $t('landing.examples.flow.step1Title') }}</h3>
            </div>
            <p class="step-description">{{ $t('landing.examples.flow.step1Description') }}</p>
            <div class="step-visual">
              <div class="example-image-wrapper xlarge">
                <img
                  :src="multiExample.original"
                  :alt="$t('landing.examples.originalPhoto')"
                  class="example-image"
                />
              </div>
            </div>
          </div>

          <!-- Arrow -->
          <div class="flow-arrow">
            <MaterialIcon icon="arrow_forward" size="lg" color="var(--gold-primary)" />
          </div>

          <!-- Step 2: AI Generates -->
          <div class="flow-step-card wide">
            <div class="step-header">
              <span class="step-badge">2</span>
              <h3 class="step-title">{{ $t('landing.examples.flow.step2Title') }}</h3>
            </div>
            <p class="step-description">{{ $t('landing.examples.flow.step2Description') }}</p>
            <div class="step-visual">
              <div class="generated-versions">
                <div
                  v-for="(gen, idx) in multiExample.generated"
                  :key="idx"
                  class="example-post-card medium"
                >
                  <div class="template-badge">
                    {{ $t(`landing.examples.templates.${gen.templateKey}`) }}
                  </div>
                  <img
                    :src="gen.src"
                    :alt="$t('landing.examples.aiGenerated')"
                    class="example-image"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Arrow -->
          <div class="flow-arrow">
            <MaterialIcon icon="arrow_forward" size="lg" color="var(--gold-primary)" />
          </div>

          <!-- Step 3: Review & Approve -->
          <div class="flow-step-card">
            <div class="step-header">
              <span class="step-badge">3</span>
              <h3 class="step-title">{{ $t('landing.examples.flow.step3Title') }}</h3>
            </div>
            <p class="step-description">{{ $t('landing.examples.flow.step3Description') }}</p>
            <div class="step-visual">
              <div class="approve-visual">
                <MaterialIcon icon="check_circle" size="lg" color="var(--success-text)" />
                <span class="approve-text">{{ $t('landing.examples.approveAndPost') }}</span>
              </div>
            </div>
          </div>

          <!-- Arrow -->
          <div class="flow-arrow">
            <MaterialIcon icon="arrow_forward" size="lg" color="var(--gold-primary)" />
          </div>

          <!-- Step 4: Published -->
          <div class="flow-step-card">
            <div class="step-header">
              <span class="step-badge">4</span>
              <h3 class="step-title">{{ $t('landing.examples.flow.step4Title') }}</h3>
            </div>
            <p class="step-description">{{ $t('landing.examples.flow.step4Description') }}</p>
            <div class="step-visual">
              <div class="posted-platforms vertical">
                <div class="platform-icon large">
                  <MaterialIcon icon="check_circle" size="sm" color="var(--success-text)" />
                  <span>Facebook</span>
                </div>
                <div class="platform-icon large">
                  <MaterialIcon icon="check_circle" size="sm" color="var(--success-text)" />
                  <span>Instagram</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Before/After Interactive Slider -->
        <div class="before-after-gallery">
          <h3 class="gallery-title">{{ $t('landing.examples.gallery.title') }}</h3>
          <p class="gallery-subtitle">{{ $t('landing.examples.gallery.subtitle') }}</p>

          <!-- Main Slider -->
          <div
            ref="sliderContainerRef"
            class="comparison-slider"
            @mousedown="startDragging"
            @mousemove="handleDrag"
            @mouseup="stopDragging"
            @mouseleave="stopDragging"
            @touchstart="startDragging"
            @touchmove="handleDrag"
            @touchend="stopDragging"
          >
            <!-- After Image (Background - full) -->
            <div class="slider-image-container">
              <img
                :src="selectedComparison.generated"
                :alt="$t('landing.examples.gallery.after')"
                class="slider-image"
                draggable="false"
              />
              <div class="image-label after-label">
                {{ $t('landing.examples.gallery.after') }}
              </div>
            </div>

            <!-- Before Image (Foreground - clipped) -->
            <div
              class="slider-image-container before-container"
              :style="{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }"
            >
              <img
                :src="selectedComparison.original"
                :alt="$t('landing.examples.gallery.before')"
                class="slider-image"
                draggable="false"
              />
              <div class="image-label before-label">
                {{ $t('landing.examples.gallery.before') }}
              </div>
            </div>

            <!-- Slider Handle -->
            <div
              class="slider-handle"
              :class="{ 'is-dragging': isDragging }"
              :style="{ left: `${sliderPosition}%` }"
            >
              <div class="handle-line"></div>
              <div class="handle-button">
                <MaterialIcon icon="drag_handle" size="sm" color="var(--text-on-gold)" />
              </div>
              <div class="handle-line"></div>
            </div>
          </div>

          <!-- Thumbnail Selector -->
          <div class="comparison-thumbnails">
            <button
              v-for="(example, index) in comparisonExamples"
              :key="example.id"
              :class="['thumbnail-button', { active: selectedComparisonIndex === index }]"
              @click="selectComparison(index)"
            >
              <img
                :src="example.original"
                :alt="$t(`landing.examples.templates.${example.templateKey}`)"
                class="thumbnail-image"
              />
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Auto-Posting Feature Section (KEY DIFFERENTIATOR) -->
    <section class="auto-posting-section">
      <div class="section-container">
        <div class="auto-posting-content">
          <div class="auto-posting-text">
            <span class="feature-badge">{{ $t('landing.autoPosting.badge') }}</span>
            <h2 class="auto-posting-title">{{ $t('landing.autoPosting.title') }}</h2>
            <h3 class="auto-posting-headline">{{ $t('landing.autoPosting.headline') }}</h3>
            <p class="auto-posting-description">{{ $t('landing.autoPosting.description') }}</p>

            <div class="auto-posting-features">
              <div class="feature-item">
                <MaterialIcon icon="check_circle" size="sm" color="var(--gold-primary)" />
                <span>{{ $t('landing.autoPosting.feature1') }}</span>
              </div>
              <div class="feature-item">
                <MaterialIcon icon="check_circle" size="sm" color="var(--gold-primary)" />
                <span>{{ $t('landing.autoPosting.feature2') }}</span>
              </div>
              <div class="feature-item">
                <MaterialIcon icon="check_circle" size="sm" color="var(--gold-primary)" />
                <span>{{ $t('landing.autoPosting.feature3') }}</span>
              </div>
            </div>
          </div>
          <div class="auto-posting-image">
            <div class="image-placeholder large">
              <MaterialIcon icon="compare" size="lg" />
              <span>{{ $t('landing.autoPosting.imagePlaceholder') }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Benefits Grid Section -->
    <section class="benefits-section">
      <div class="section-container">
        <h2 class="section-title">{{ $t('landing.benefits.title') }}</h2>

        <div class="benefits-grid">
          <BaseCard
            v-for="benefit in benefits"
            :key="benefit.id"
            variant="glass"
            class="benefit-card"
            hoverable
          >
            <div class="benefit-icon">
              <MaterialIcon :icon="benefit.icon" size="lg" color="var(--gold-primary)" />
            </div>
            <h3 class="benefit-title">{{ $t(benefit.title) }}</h3>
            <p class="benefit-description">{{ $t(benefit.description) }}</p>
          </BaseCard>
        </div>
      </div>
    </section>

    <!-- Pricing Section (Dynamic from API) -->
    <section class="pricing-section">
      <div class="section-container">
        <h2 class="section-title">{{ $t('landing.pricing.title') }}</h2>
        <p class="section-subtitle">{{ $t('landing.pricing.subtitle') }}</p>

        <!-- Loading State -->
        <div v-if="plansLoading" class="pricing-loading">
          <div class="spinner"></div>
          <p>{{ $t('plans.loading') }}</p>
        </div>

        <!-- Plans Grid -->
        <div v-else class="pricing-preview">
          <BaseCard
            v-for="plan in plans"
            :key="plan.tier"
            :variant="plan.tier === 'yearly' ? 'glass-intense' : 'glass'"
            :class="[
              'pricing-card',
              { featured: plan.tier === 'yearly', lifetime: plan.tier === 'lifetime' },
            ]"
            hoverable
          >
            <!-- Badge -->
            <div
              v-if="plan.badge"
              class="pricing-badge"
              :class="{ 'lifetime-badge': plan.tier === 'lifetime' }"
            >
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
                :color="
                  plan.tier === 'lifetime'
                    ? 'var(--gold-primary)'
                    : plan.tier === 'yearly'
                      ? 'var(--gold-light)'
                      : 'var(--text-secondary)'
                "
              />
            </div>

            <h3 class="pricing-tier">{{ plan.name }}</h3>

            <!-- Price -->
            <div class="price-wrapper">
              <div class="pricing-price">{{ plan.formatted_price }}</div>
              <span class="price-period">{{ getPriceInterval(plan) }}</span>
              <div v-if="plan.savings" class="savings-badge">
                {{ plan.savings }}
              </div>
            </div>

            <!-- Credits -->
            <div class="credits-highlight">
              <div class="credit-line">
                <MaterialIcon icon="image" size="sm" color="var(--gold-primary)" />
                <span
                  >{{ Math.floor(plan.credits / creditCosts.image) }} {{ $t('plans.images') }}</span
                >
              </div>
              <span class="or-divider">{{ $t('plans.orEquivalent') }}</span>
              <div class="credit-line">
                <MaterialIcon icon="videocam" size="sm" color="var(--gold-primary)" />
                <span
                  >{{ Math.floor(plan.credits / creditCosts.video) }} {{ $t('plans.videos') }}</span
                >
              </div>
            </div>

            <!-- CTA Button -->
            <BaseButton
              :variant="
                plan.tier === 'yearly' || plan.tier === 'lifetime' ? 'primary' : 'secondary'
              "
              size="large"
              full-width
              @click="handleCTAClick"
            >
              {{ $t('plans.getStarted') }}
            </BaseButton>
          </BaseCard>
        </div>
      </div>
    </section>

    <!-- Final CTA Section -->
    <section class="final-cta-section">
      <div class="section-container">
        <h2 class="final-cta-title">{{ $t('landing.finalCta.title') }}</h2>
        <p class="final-cta-subtitle">{{ $t('landing.finalCta.subtitle') }}</p>
        <BaseButton variant="primary" size="large" class="final-cta-button" @click="handleCTAClick">
          {{ $t('landing.hero.cta') }}
        </BaseButton>
      </div>
    </section>

    <!-- Footer -->
    <footer class="landing-footer">
      <div class="footer-content">
        <p class="footer-made-with">{{ $t('landing.footer.madeWith') }}</p>
        <div class="footer-links">
          <router-link to="/privacy-policy">{{ $t('auth.privacyPolicy') }}</router-link>
          <span class="footer-divider">·</span>
          <router-link to="/terms">{{ $t('auth.termsOfService') }}</router-link>
        </div>
        <p class="footer-copyright">{{ $t('landing.footer.copyright') }}</p>
      </div>
    </footer>

    <!-- Modals -->
    <LoginModal v-model="showLoginModal" @login-success="onLoginSuccess" />

    <PaywallModal v-model="showPaywallModal" @payment-success="onPaymentSuccess" />
  </div>
</template>

<style scoped>
.landing-page {
  min-height: 100vh;
  background: var(--bg-primary);
}

/* Language Selector Header */
.landing-header {
  position: fixed;
  top: var(--space-lg);
  right: var(--space-lg);
  z-index: 100;
}

/* Hero Section */
.hero-section {
  min-height: 85vh;
  display: flex;
  align-items: center;
  padding: var(--space-2xl);
  padding-top: var(--space-4xl);
  position: relative;
  overflow: hidden;
  background-image: url('/background.jpeg');
  background-size: cover;
  background-position: center;
}

.hero-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    rgba(10, 10, 10, 0.85) 0%,
    rgba(10, 10, 10, 0.75) 50%,
    rgba(10, 10, 10, 0.85) 100%
  );
  pointer-events: none;
}

.hero-content {
  max-width: var(--max-width-2xl);
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4xl);
  align-items: center;
  position: relative;
  z-index: 1;
}

.hero-logo {
  height: 80px;
  width: auto;
  margin-bottom: var(--space-xl);
  filter: drop-shadow(0 4px 12px rgba(212, 175, 55, 0.3));
}

.hero-headline {
  font-family: var(--font-heading);
  font-size: var(--text-5xl);
  font-weight: var(--font-bold);
  background: var(--gradient-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: var(--space-lg);
  line-height: 1.1;
}

.hero-subheadline {
  font-size: var(--text-xl);
  color: var(--text-secondary);
  margin-bottom: var(--space-2xl);
  line-height: var(--leading-relaxed);
}

.hero-cta {
  font-size: var(--text-lg);
  padding: var(--space-lg) var(--space-3xl);
}

/* Hero Login Box */
.hero-login {
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.login-box {
  width: 100%;
  max-width: 380px;
  padding: var(--space-xl);
}

.login-header {
  text-align: center;
  margin-bottom: var(--space-xl);
}

.login-title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  margin-bottom: var(--space-sm);
}

.login-subtitle {
  font-size: var(--text-base);
  color: var(--text-secondary);
}

.login-alert {
  margin-bottom: var(--space-lg);
}

/* Login Content */
.login-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.email-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

/* Login Divider */
.login-divider {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin: var(--space-md) 0;
}

.login-divider::before,
.login-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--glass-border);
}

.login-divider span {
  color: var(--text-muted);
  font-size: var(--text-sm);
  white-space: nowrap;
}

/* Social Buttons */
.social-buttons {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.social-button-wrapper {
  position: relative;
  transition: transform var(--transition-base);
}

.social-button-wrapper:hover {
  transform: translateY(-1px);
}

.last-used-badge {
  position: absolute;
  top: -8px;
  right: -4px;
  background: var(--bg-secondary);
  color: var(--gold-primary);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  border: 1px solid var(--gold-primary);
  pointer-events: none;
}

.social-sign-in-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
  width: 100%;
  padding: var(--space-md) var(--space-lg);
  border: none;
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: var(--transition-base);
}

.social-sign-in-button:active:not(:disabled) {
  transform: translateY(1px);
}

.social-sign-in-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.apple-button {
  background: #000000;
  color: #ffffff;
}

.apple-button:hover:not(:disabled) {
  background: #1a1a1a;
}

.google-button {
  background: #ffffff;
  color: #1f1f1f;
  border: 1px solid var(--border-color);
}

.google-button:hover:not(:disabled) {
  background: #f5f5f5;
}

.facebook-button {
  background: #1877f2;
  color: #ffffff;
}

.facebook-button:hover:not(:disabled) {
  background: #166fe5;
}


/* Legal Links */
.legal-links {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  margin-top: var(--space-xl);
  padding-top: var(--space-lg);
  border-top: 1px solid var(--border-color);
}

.legal-links a {
  color: var(--text-muted);
  font-size: var(--text-xs);
  text-decoration: none;
  transition: color 0.15s ease;
}

.legal-links a:hover {
  color: var(--gold-primary);
}

.legal-links .separator {
  color: var(--text-muted);
  font-size: var(--text-xs);
}

/* Image Placeholders */
.image-placeholder {
  background: var(--bg-secondary);
  border: 2px dashed var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--space-3xl);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
  color: var(--text-muted);
  text-align: center;
  min-height: 300px;
  width: 100%;
  max-width: 400px;
}

.image-placeholder.large {
  min-height: 350px;
  max-width: 500px;
}

.image-placeholder span {
  font-size: var(--text-sm);
  max-width: 200px;
}

/* Section Styles */
.section-container {
  max-width: var(--max-width-2xl);
  margin: 0 auto;
  padding: var(--space-5xl) var(--space-2xl);
}

.section-title {
  font-family: var(--font-heading);
  font-size: var(--text-4xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  text-align: center;
  margin-bottom: var(--space-3xl);
}

.section-subtitle {
  font-size: var(--text-lg);
  color: var(--text-secondary);
  text-align: center;
  margin-top: calc(-1 * var(--space-2xl));
  margin-bottom: var(--space-3xl);
}

/* How It Works Section */
.how-it-works-section {
  background: var(--bg-secondary);
}

.steps-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-2xl);
}

.step-card {
  text-align: center;
  position: relative;
}

.step-number {
  width: 48px;
  height: 48px;
  background: var(--gradient-gold);
  color: var(--text-on-gold);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  margin: 0 auto var(--space-xl);
}

.step-image-placeholder {
  background: var(--bg-tertiary);
  border: 2px dashed var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--space-2xl);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  color: var(--text-muted);
  text-align: center;
  min-height: 180px;
  margin-bottom: var(--space-lg);
}

.step-image-placeholder span {
  font-size: var(--text-xs);
}

.step-title {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  color: var(--text-primary);
  margin-bottom: var(--space-sm);
}

.step-description {
  font-size: var(--text-base);
  color: var(--text-secondary);
}

/* Examples Showcase Section */
.examples-section {
  background: linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
}

/* Main Example Flow - Horizontal Steps */
.main-example-flow {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: var(--space-lg);
  margin-bottom: var(--space-5xl);
  flex-wrap: wrap;
}

.flow-step-card {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
  text-align: center;
  max-width: 280px;
  backdrop-filter: blur(var(--blur-md));
}

.flow-step-card.wide {
  max-width: 100%;
}

.step-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
  margin-bottom: var(--space-md);
}

.step-badge {
  width: 36px;
  height: 36px;
  background: var(--gradient-gold);
  color: var(--text-on-gold);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  flex-shrink: 0;
}

.flow-step-card .step-title {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  color: var(--text-primary);
  margin: 0;
}

.flow-step-card .step-description {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: var(--leading-relaxed);
  margin-bottom: var(--space-lg);
}

.step-visual {
  display: flex;
  justify-content: center;
}

.flow-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: var(--space-4xl);
}

/* Approve Visual */
.approve-visual {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-xl);
  background: var(--success-bg);
  border: 2px solid var(--success-border);
  border-radius: var(--radius-lg);
}

.approve-text {
  font-weight: var(--font-semibold);
  color: var(--success-text);
}

/* Posted Platforms */
.posted-platforms {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.posted-platforms.vertical {
  gap: var(--space-md);
}

.platform-icon {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-md);
  background: var(--success-bg);
  border: 1px solid var(--success-border);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: var(--success-text);
}

.platform-icon.large {
  padding: var(--space-md) var(--space-lg);
  font-size: var(--text-base);
}

/* Image Wrappers */
.example-image-wrapper {
  width: 200px;
  height: 200px;
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 2px solid var(--border-color);
}

.example-image-wrapper.xlarge {
  width: 280px;
  height: 280px;
}

.example-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Generated Versions Grid */
.generated-versions {
  display: flex;
  gap: var(--space-lg);
  flex-wrap: wrap;
  justify-content: center;
}

.example-post-card {
  position: relative;
  width: 280px;
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 2px solid var(--gold-primary);
  box-shadow: var(--shadow-lg), var(--glow-gold-sm);
}

.example-post-card .example-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.example-post-card.medium {
  width: 200px;
}

.example-post-card.medium .example-image {
  height: 160px;
}

.template-badge {
  position: absolute;
  top: var(--space-sm);
  left: var(--space-sm);
  background: var(--gradient-gold);
  color: var(--text-on-gold);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  z-index: 1;
}

/* Before/After Interactive Slider */
.before-after-gallery {
  margin-top: var(--space-4xl);
  padding-top: var(--space-4xl);
  border-top: 1px solid var(--border-color);
}

.gallery-title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  color: var(--text-primary);
  text-align: center;
  margin-bottom: var(--space-sm);
}

.gallery-subtitle {
  font-size: var(--text-base);
  color: var(--text-muted);
  text-align: center;
  margin-bottom: var(--space-3xl);
}

/* Comparison Slider */
.comparison-slider {
  position: relative;
  width: 100%;
  max-width: 600px;
  margin: 0 auto var(--space-2xl);
  aspect-ratio: 1;
  border-radius: var(--radius-xl);
  overflow: hidden;
  cursor: ew-resize;
  user-select: none;
  -webkit-user-select: none;
  box-shadow: var(--shadow-xl);
  border: 2px solid var(--glass-border);
}

.comparison-slider * {
  user-select: none;
  -webkit-user-select: none;
}

.slider-image-container {
  position: absolute;
  inset: 0;
}

.slider-image-container.before-container {
  z-index: 2;
}

.slider-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-label {
  position: absolute;
  bottom: var(--space-lg);
  padding: var(--space-xs) var(--space-md);
  background: rgba(0, 0, 0, 0.7);
  color: var(--text-primary);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-radius: var(--radius-full);
  backdrop-filter: blur(4px);
  user-select: none;
  pointer-events: none;
}

.before-label {
  left: var(--space-lg);
}

.after-label {
  right: var(--space-lg);
}

/* Slider Handle */
.slider-handle {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 4px;
  transform: translateX(-50%);
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
}

.handle-line {
  flex: 1;
  width: 3px;
  background: var(--gold-primary);
  box-shadow: 0 0 10px rgba(212, 175, 55, 0.5);
}

.handle-button {
  width: 44px;
  height: 44px;
  background: var(--gradient-gold);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    var(--shadow-lg),
    0 0 20px rgba(212, 175, 55, 0.4);
  flex-shrink: 0;
  pointer-events: auto;
  cursor: ew-resize;
}

.slider-handle.is-dragging .handle-button {
  transform: scale(1.1);
  box-shadow:
    var(--shadow-xl),
    0 0 30px rgba(212, 175, 55, 0.6);
}

/* Thumbnail Selector */
.comparison-thumbnails {
  display: flex;
  justify-content: center;
  gap: var(--space-lg);
  flex-wrap: wrap;
}

.thumbnail-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm);
  background: var(--glass-bg);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: var(--transition-base);
}

.thumbnail-button:hover {
  border-color: var(--gold-primary);
  transform: translateY(-2px);
}

.thumbnail-button.active {
  border-color: var(--gold-primary);
  box-shadow: var(--glow-gold-sm);
}

.thumbnail-image {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: var(--radius-md);
}

/* Auto-Posting Section */
.auto-posting-section {
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, transparent 50%);
}

.auto-posting-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4xl);
  align-items: center;
}

.feature-badge {
  display: inline-block;
  background: var(--gold-subtle);
  color: var(--gold-primary);
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: var(--space-lg);
}

.auto-posting-title {
  font-family: var(--font-heading);
  font-size: var(--text-3xl);
  color: var(--text-primary);
  margin-bottom: var(--space-sm);
}

.auto-posting-headline {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  background: var(--gradient-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: var(--space-lg);
}

.auto-posting-description {
  font-size: var(--text-lg);
  color: var(--text-secondary);
  line-height: var(--leading-relaxed);
  margin-bottom: var(--space-xl);
}

.auto-posting-features {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.feature-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  color: var(--text-secondary);
}

/* Benefits Section */
.benefits-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-xl);
}

.benefit-card {
  text-align: center;
  padding: var(--space-2xl);
}

.benefit-icon {
  margin-bottom: var(--space-lg);
}

.benefit-title {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  color: var(--text-primary);
  margin-bottom: var(--space-sm);
}

.benefit-description {
  font-size: var(--text-base);
  color: var(--text-secondary);
  line-height: var(--leading-relaxed);
}

/* Pricing Section */
.pricing-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
  padding: var(--space-4xl);
  color: var(--text-secondary);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-color);
  border-top-color: var(--gold-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.pricing-preview {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-xl);
  margin-bottom: var(--space-2xl);
}

.pricing-card {
  text-align: center;
  padding: var(--space-2xl);
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.pricing-card.featured {
  border: 2px solid var(--gold-primary);
  box-shadow: var(--glow-gold-sm);
}

.pricing-card.lifetime {
  border: 2px solid var(--gold-dark);
}

.pricing-badge {
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
  white-space: nowrap;
}

.pricing-badge.lifetime-badge {
  background: linear-gradient(135deg, #3b3b3b 0%, #1a1a1a 100%);
  color: var(--gold-primary);
  border: 1px solid var(--gold-dark);
}

.limited-badge {
  font-size: var(--text-xs);
  color: var(--warning-text);
  background: var(--warning-bg);
  border: 1px solid var(--warning-border);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-sm);
}

.tier-icon-wrapper {
  margin-top: var(--space-lg);
}

.pricing-tier {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  color: var(--text-primary);
  margin: 0;
}

.price-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
}

.pricing-price {
  font-family: var(--font-heading);
  font-size: var(--text-4xl);
  font-weight: var(--font-bold);
  background: var(--gradient-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.price-period {
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.savings-badge {
  background: var(--success-bg);
  color: var(--success-text);
  border: 1px solid var(--success-border);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
}

.credits-highlight {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-md);
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
}

.credit-line {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.or-divider {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.pricing-credits {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

/* Final CTA Section */
.final-cta-section {
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(212, 175, 55, 0.02) 100%);
  text-align: center;
  padding: var(--space-5xl) var(--space-2xl);
}

.final-cta-title {
  font-family: var(--font-heading);
  font-size: var(--text-4xl);
  font-weight: var(--font-bold);
  background: var(--gradient-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: var(--space-lg);
}

.final-cta-subtitle {
  font-size: var(--text-xl);
  color: var(--text-secondary);
  margin-bottom: var(--space-2xl);
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.final-cta-button {
  font-size: var(--text-lg);
  padding: var(--space-lg) var(--space-3xl);
}

/* Footer */
.landing-footer {
  background: var(--bg-secondary);
  padding: var(--space-3xl) var(--space-2xl);
  text-align: center;
}

.footer-content {
  max-width: var(--max-width-lg);
  margin: 0 auto;
}

.footer-made-with {
  font-size: var(--text-sm);
  color: var(--text-muted);
  margin-bottom: var(--space-lg);
}

.footer-links {
  display: flex;
  justify-content: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-lg);
}

.footer-links a {
  color: var(--text-secondary);
  text-decoration: none;
  font-size: var(--text-sm);
  transition: var(--transition-base);
}

.footer-links a:hover {
  color: var(--gold-primary);
}

.footer-divider {
  color: var(--text-muted);
}

.footer-copyright {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

/* Responsive */
@media (max-width: 1024px) {
  .hero-content {
    grid-template-columns: 1fr;
    text-align: center;
    gap: var(--space-3xl);
  }

  .hero-login {
    order: -1;
  }

  .login-box {
    max-width: 400px;
  }

  .auto-posting-content {
    grid-template-columns: 1fr;
    text-align: center;
  }

  .auto-posting-image {
    order: -1;
  }

  .auto-posting-features {
    align-items: center;
  }

  /* Examples responsive */
  .main-example-flow {
    flex-direction: column;
    align-items: center;
  }

  .flow-arrow {
    transform: rotate(90deg);
    padding: var(--space-md) 0;
  }

  .flow-step-card {
    max-width: 100%;
    width: 100%;
  }

  .flow-step-card.wide {
    max-width: 100%;
  }

  /* Slider responsive */
  .comparison-slider {
    max-width: 100%;
  }

  .thumbnail-image {
    width: 60px;
    height: 60px;
  }
}

@media (max-width: 768px) {
  .hero-section {
    min-height: auto;
    padding: var(--space-3xl) var(--space-lg);
  }

  .hero-headline {
    font-size: var(--text-4xl);
  }

  .hero-subheadline {
    font-size: var(--text-lg);
  }

  .section-container {
    padding: var(--space-3xl) var(--space-lg);
  }

  .section-title {
    font-size: var(--text-3xl);
  }

  .steps-grid {
    grid-template-columns: 1fr;
    gap: var(--space-3xl);
  }

  .benefits-grid {
    grid-template-columns: 1fr;
  }

  .pricing-preview {
    grid-template-columns: 1fr;
  }

  .final-cta-title {
    font-size: var(--text-3xl);
  }

  .final-cta-subtitle {
    font-size: var(--text-lg);
  }
}

@media (max-width: 480px) {
  .hero-logo {
    height: 60px;
  }

  .hero-headline {
    font-size: var(--text-3xl);
  }

  .image-placeholder {
    min-height: 200px;
    padding: var(--space-xl);
  }
}

/* Animation */
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

.hero-content,
.step-card,
.benefit-card,
.pricing-card {
  animation: fadeInUp 0.6s var(--ease-smooth);
  animation-fill-mode: both;
}

.step-card:nth-child(1) {
  animation-delay: 0.1s;
}
.step-card:nth-child(2) {
  animation-delay: 0.2s;
}
.step-card:nth-child(3) {
  animation-delay: 0.3s;
}

.benefit-card:nth-child(1) {
  animation-delay: 0.1s;
}
.benefit-card:nth-child(2) {
  animation-delay: 0.15s;
}
.benefit-card:nth-child(3) {
  animation-delay: 0.2s;
}
.benefit-card:nth-child(4) {
  animation-delay: 0.25s;
}

@media (prefers-reduced-motion: reduce) {
  .hero-content,
  .step-card,
  .benefit-card,
  .pricing-card {
    animation: none;
  }
}
</style>

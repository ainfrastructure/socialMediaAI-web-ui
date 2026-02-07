<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import { useLocaleStore } from '../stores/locale'
import { useLogin } from '../composables/useLogin'
import { api } from '../services/api'
import { errorLog } from '@/utils/debug'
import BaseCard from '../components/BaseCard.vue'
import BaseButton from '../components/BaseButton.vue'
import BaseInput from '../components/BaseInput.vue'
import BaseAlert from '../components/BaseAlert.vue'
import MaterialIcon from '../components/MaterialIcon.vue'
import LoginModal from '../components/LoginModal.vue'
import PaywallModal from '../components/PaywallModal.vue'
import LanguageSelector from '../components/LanguageSelector.vue'
import ThemeToggle from '../components/ThemeToggle.vue'
import LazarusLogoNeural from '../components/icons/LazarusLogoNeural.vue'
import LazarusAnimatedMascot from '../components/icons/LazarusAnimatedMascot.vue'
import PhoneMockup from '../components/landing/PhoneMockup.vue'
import LazarusChat from '../components/landing/LazarusChat.vue'

// ===== FEATURE FLAG =====
const ENABLE_SIGNUP = true

const router = useRouter()
const authStore = useAuthStore()
const localeStore = useLocaleStore()
const { t } = useI18n()

// Mobile menu state
const isMobileMenuOpen = ref(false)
const isHeaderScrolled = ref(false)

function handleScroll() {
  isHeaderScrolled.value = window.scrollY > 50
}

function scrollToSection(sectionId: string) {
  const element = document.getElementById(sectionId)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' })
    isMobileMenuOpen.value = false
  }
}

function toggleMobileMenu() {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

// Login composable
const { resetForm } = useLogin()

const showLoginModal = ref(false)
const showPaywallModal = ref(false)

// ===== WAITLIST STATE =====
const waitlistEmail = ref('')
const waitlistLoading = ref(false)
const waitlistSuccess = ref(false)
const waitlistError = ref('')
const waitlistCount = ref(0)
const WAITLIST_BASE_COUNT = 110

async function loadWaitlistCount() {
  try {
    const response = await api.getWaitlistCount()
    const count = (response as any).count ?? response.data?.count
    if (response.success && count !== undefined) {
      waitlistCount.value = WAITLIST_BASE_COUNT + count
    } else {
      waitlistCount.value = WAITLIST_BASE_COUNT
    }
  } catch {
    waitlistCount.value = WAITLIST_BASE_COUNT
  }
}

async function handleWaitlistSubmit() {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!waitlistEmail.value || !emailRegex.test(waitlistEmail.value)) {
    waitlistError.value = t('waitlist.invalidEmail')
    return
  }

  waitlistLoading.value = true
  waitlistError.value = ''

  try {
    const response = await api.joinWaitlist(waitlistEmail.value)

    if (response.success) {
      waitlistSuccess.value = true
      const newCount = (response as any).count ?? response.data?.count
      if (newCount !== undefined) {
        waitlistCount.value = WAITLIST_BASE_COUNT + newCount
      } else {
        waitlistCount.value += 1
      }
    } else if ((response as any).error === 'already_on_waitlist') {
      waitlistError.value = t('waitlist.alreadyOnList')
    } else {
      waitlistError.value = response.error || t('waitlist.error')
    }
  } catch {
    waitlistError.value = t('waitlist.error')
  } finally {
    waitlistLoading.value = false
  }
}

// ===== PRICING =====
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
    const currency = localeStore.isDevAccess ? localeStore.currentCurrency : undefined
    const response = (await api.getPlans(currency)) as PlansResponse
    if (response.success) {
      plans.value = response.plans || []
      creditCosts.value = response.credit_costs || { image: 1, video: 5 }
    }
  } catch (error) {
    errorLog('Failed to load plans:', error)
  } finally {
    plansLoading.value = false
  }
}

watch(
  () => localeStore.currentCurrency,
  () => {
    if (localeStore.isDevAccess) {
      loadPlans()
    }
  }
)

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

const cheapestMonthlyPrice = computed(() => {
  const monthlyPlans = plans.value.filter((p) => p.interval === 'month')
  if (monthlyPlans.length === 0) return 0
  return Math.min(...monthlyPlans.map((p) => p.price))
})

function getBeforePrice(plan: Plan): number | null {
  if (cheapestMonthlyPrice.value === 0) return null
  if (plan.interval === 'year') {
    return cheapestMonthlyPrice.value * 12
  }
  if (plan.interval === 'lifetime') {
    return cheapestMonthlyPrice.value * 120
  }
  return null
}

function formatBeforePrice(price: number): string {
  const currency = plans.value[0]?.currency || 'USD'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

// ===== CTA HANDLERS =====
function handleCTAClick() {
  if (!ENABLE_SIGNUP) {
    scrollToSection('waitlist')
    return
  }
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

function onLoginSuccess() {
  showLoginModal.value = false
  resetForm()
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

// ===== BEFORE/AFTER COMPARISON DATA =====
const comparisonExamples = [
  {
    id: 1,
    original: '/example/example8-original.jpeg',
    generated: '/example/example8-enhanced.jpg',
  },
  {
    id: 2,
    original: '/example/example6-original.jpeg',
    generated: '/example/example6-enhanced.jpg',
  },
  {
    id: 3,
    original: '/example/example5-original.jpeg',
    generated: '/example/example5-enhanced.jpg',
  },
  {
    id: 4,
    original: '/example/kebab-original.jpg',
    generated: '/example/kebab-enhanced.jpg',
  },
  {
    id: 5,
    original: '/example/orignal-3.jpg',
    generated: '/example/orignal-3-studio.jpeg',
  },
  {
    id: 6,
    original: '/example/original-2.jpeg',
    generated: '/example/behind-the-scens-of-original-2.jpeg',
  },
  {
    id: 7,
    original: '/example/example10-original.jpg',
    generated: '/example/example10-enhanced.jpg',
  },
  {
    id: 8,
    original: '/example/example20-original.jpeg',
    generated: '/example/example20-enhanced.jpg',
  },
]

// Before/After slider state
const selectedComparisonIndex = ref(0)
const sliderPosition = ref(50)
const isDragging = ref(false)
const hasInteracted = ref(false)
const sliderContainerRef = ref<HTMLElement | null>(null)
let animationFrame: number | null = null

let isTouchDragging = false
let pendingPosition: number | null = null
let dragAnimationFrame: number | null = null
let cachedRect: DOMRect | null = null

// Thumbnail carousel state
let comparisonCarouselInterval: ReturnType<typeof setInterval> | null = null
const comparisonCarouselDuration = 5000
const comparisonPauseDuration = 8000
let comparisonResumeTimeout: ReturnType<typeof setTimeout> | null = null
const isComparisonPaused = ref(false)
const comparisonProgressKey = ref(0)

const selectedComparison = computed(() => comparisonExamples[selectedComparisonIndex.value])

function selectComparison(index: number) {
  if (selectedComparisonIndex.value === index) {
    if (isComparisonPaused.value) {
      resumeComparisonCarousel()
    } else {
      pauseComparisonCarousel()
    }
    return
  }
  selectedComparisonIndex.value = index
  comparisonProgressKey.value++
  sliderPosition.value = 50
  hasInteracted.value = false
  stopHintAnimation()
  startHintAnimation()
  pauseComparisonCarousel()
}

function startComparisonCarousel() {
  if (comparisonCarouselInterval) return
  isComparisonPaused.value = false
  comparisonCarouselInterval = setInterval(() => {
    selectedComparisonIndex.value = (selectedComparisonIndex.value + 1) % comparisonExamples.length
    comparisonProgressKey.value++
    sliderPosition.value = 50
    hasInteracted.value = false
    stopHintAnimation()
    startHintAnimation()
  }, comparisonCarouselDuration)
}

function stopComparisonCarousel() {
  if (comparisonCarouselInterval) {
    clearInterval(comparisonCarouselInterval)
    comparisonCarouselInterval = null
  }
}

function clearComparisonResumeTimeout() {
  if (comparisonResumeTimeout) {
    clearTimeout(comparisonResumeTimeout)
    comparisonResumeTimeout = null
  }
}

function pauseComparisonCarousel() {
  stopComparisonCarousel()
  clearComparisonResumeTimeout()
  isComparisonPaused.value = true
  comparisonResumeTimeout = setTimeout(() => {
    startComparisonCarousel()
  }, comparisonPauseDuration)
}

function resumeComparisonCarousel() {
  clearComparisonResumeTimeout()
  comparisonProgressKey.value++
  isComparisonPaused.value = false
  startComparisonCarousel()
}

function onMouseDown(e: MouseEvent) {
  e.preventDefault()
  isDragging.value = true
  hasInteracted.value = true
  stopHintAnimation()
  pauseComparisonCarousel()
  updateSliderPosition(e)
}

function onMouseMove(e: MouseEvent) {
  if (!isDragging.value) return
  e.preventDefault()
  updateSliderPosition(e)
}

function onMouseUp() {
  isDragging.value = false
}

function onHandleTouchStart(e: TouchEvent) {
  e.preventDefault()
  e.stopPropagation()
  isTouchDragging = true
  isDragging.value = true
  hasInteracted.value = true
  stopHintAnimation()
  pauseComparisonCarousel()
  if (sliderContainerRef.value) {
    cachedRect = sliderContainerRef.value.getBoundingClientRect()
  }
  updateSliderPositionFromTouch(e.touches[0].clientX)
  window.addEventListener('touchmove', onGlobalTouchMove, { passive: false })
  window.addEventListener('touchend', onGlobalTouchEnd)
  window.addEventListener('touchcancel', onGlobalTouchEnd)
}

function onGlobalTouchMove(e: TouchEvent) {
  if (!isTouchDragging) return
  e.preventDefault()
  const clientX = e.touches[0].clientX
  pendingPosition = clientX
  if (!dragAnimationFrame) {
    dragAnimationFrame = requestAnimationFrame(flushPendingPosition)
  }
}

function flushPendingPosition() {
  dragAnimationFrame = null
  if (pendingPosition !== null) {
    updateSliderPositionFromTouch(pendingPosition)
    pendingPosition = null
  }
}

function onGlobalTouchEnd() {
  isTouchDragging = false
  isDragging.value = false
  cachedRect = null
  pendingPosition = null
  if (dragAnimationFrame) {
    cancelAnimationFrame(dragAnimationFrame)
    dragAnimationFrame = null
  }
  window.removeEventListener('touchmove', onGlobalTouchMove)
  window.removeEventListener('touchend', onGlobalTouchEnd)
  window.removeEventListener('touchcancel', onGlobalTouchEnd)
}

function updateSliderPositionFromTouch(clientX: number) {
  if (!cachedRect) return
  const x = clientX - cachedRect.left
  const percentage = Math.max(0, Math.min(100, (x / cachedRect.width) * 100))
  sliderPosition.value = percentage
}

function updateSliderPosition(e: MouseEvent | TouchEvent) {
  if (!sliderContainerRef.value) return
  const rect = sliderContainerRef.value.getBoundingClientRect()
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
  const x = clientX - rect.left
  const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))
  sliderPosition.value = percentage
}

function startHintAnimation() {
  if (hasInteracted.value) return
  const duration = 3000
  const startTime = Date.now()
  function animate() {
    if (hasInteracted.value || isDragging.value) {
      stopHintAnimation()
      return
    }
    const elapsed = Date.now() - startTime
    const progress = (elapsed % duration) / duration
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

// ===== FEATURES GRID DATA =====
const featuresData = [
  { id: 'aiContent', icon: 'auto_awesome' },
  { id: 'scheduling', icon: 'schedule' },
  { id: 'platforms', icon: 'hub' },
  { id: 'mobile', icon: 'smartphone' },
  { id: 'analyticsCard', icon: 'analytics' },
  { id: 'brandVoice', icon: 'record_voice_over' },
]

// ===== HOW IT WORKS DATA =====
const howItWorksSteps = [
  { step: 1, icon: 'link', titleKey: 'landing.howItWorks.step1Title', descKey: 'landing.howItWorks.step1Desc' },
  { step: 2, icon: 'smart_toy', titleKey: 'landing.howItWorks.step2Title', descKey: 'landing.howItWorks.step2Desc' },
  { step: 3, icon: 'touch_app', titleKey: 'landing.howItWorks.step3Title', descKey: 'landing.howItWorks.step3Desc' },
]

// ===== LIFECYCLE =====
onMounted(async () => {
  if (ENABLE_SIGNUP) {
    await loadPlans()
  } else {
    await loadWaitlistCount()
  }
  window.addEventListener('scroll', handleScroll)
  handleScroll()
  // Start slider hint animation after a short delay
  setTimeout(() => {
    if (!hasInteracted.value) {
      startHintAnimation()
    }
  }, 1000)
  // Start comparison thumbnail carousel
  startComparisonCarousel()
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  stopComparisonCarousel()
  clearComparisonResumeTimeout()
  stopHintAnimation()
})
</script>

<template>
  <div class="landing-page">
    <!-- ===== 1. STICKY HEADER ===== -->
    <header class="site-header" :class="{ scrolled: isHeaderScrolled }">
      <!-- Desktop Header -->
      <div class="header-container desktop-header">
        <div class="header-logo">
          <img src="../assets/socialchef_logo.svg" alt="SocialChef" class="logo-image" />
          <span class="logo-text">SocialChef</span>
          <LazarusLogoNeural :size="20" />
        </div>

        <nav class="header-nav desktop-nav">
          <button class="nav-link" @click="scrollToSection('how-it-works')">
            {{ $t('nav.howItWorks') }}
          </button>
          <button class="nav-link" @click="scrollToSection('features')">
            {{ $t('nav.features') }}
          </button>
          <button v-if="ENABLE_SIGNUP" class="nav-link" @click="scrollToSection('pricing')">
            {{ $t('nav.pricing') }}
          </button>
          <button v-else class="nav-link" @click="scrollToSection('waitlist')">
            {{ $t('nav.joinWaitlist') }}
          </button>
        </nav>

        <div class="header-actions">
          <LanguageSelector />
          <ThemeToggle />
          <template v-if="authStore.isAuthenticated">
            <BaseButton variant="primary" size="small" @click="goToDashboard">
              {{ $t('landing.loginBox.goToDashboard') }}
            </BaseButton>
          </template>
          <template v-else>
            <button class="login-link" @click="showLoginModal = true">
              {{ $t('nav.login') }}
            </button>
            <BaseButton variant="primary" size="small" class="animated-cta" @click="handleCTAClick">
              {{ $t('nav.getStarted') }}
            </BaseButton>
          </template>
        </div>
      </div>

      <!-- Mobile Header Pill -->
      <div class="mobile-header-pill">
        <div class="pill-content">
          <div class="header-logo">
            <img src="../assets/socialchef_logo.svg" alt="SocialChef" class="logo-image" />
            <span class="logo-text">SocialChef</span>
          </div>
          <div class="pill-actions">
            <ThemeToggle />
            <LanguageSelector />
            <button
              class="pill-menu-button"
              :class="{ active: isMobileMenuOpen }"
              @click="toggleMobileMenu"
              :aria-label="isMobileMenuOpen ? 'Close menu' : 'Open menu'"
              aria-expanded="false"
            >
              <span class="hamburger-line"></span>
              <span class="hamburger-line"></span>
              <span class="hamburger-line"></span>
            </button>
          </div>
        </div>
      </div>

      <!-- Mobile Navigation Dropdown -->
      <nav class="mobile-nav" :class="{ open: isMobileMenuOpen }">
        <button class="mobile-nav-link" @click="scrollToSection('how-it-works')">
          {{ $t('nav.howItWorks') }}
        </button>
        <button class="mobile-nav-link" @click="scrollToSection('features')">
          {{ $t('nav.features') }}
        </button>
        <button v-if="ENABLE_SIGNUP" class="mobile-nav-link" @click="scrollToSection('pricing')">
          {{ $t('nav.pricing') }}
        </button>
        <button v-else class="mobile-nav-link" @click="scrollToSection('waitlist')">
          {{ $t('nav.joinWaitlist') }}
        </button>
        <div class="mobile-nav-divider"></div>
        <div class="mobile-nav-settings-row">
          <div class="mobile-nav-setting">
            <span class="setting-label">{{ $t('common.theme') }}</span>
            <ThemeToggle />
          </div>
          <div class="mobile-nav-setting">
            <span class="setting-label">{{ $t('common.language') }}</span>
            <LanguageSelector />
          </div>
        </div>
        <div class="mobile-nav-divider"></div>
        <div class="mobile-nav-buttons">
          <template v-if="authStore.isAuthenticated">
            <BaseButton variant="primary" size="medium" full-width @click="goToDashboard">
              {{ $t('landing.loginBox.goToDashboard') }}
            </BaseButton>
          </template>
          <template v-else>
            <button class="mobile-nav-login-btn" @click="showLoginModal = true; isMobileMenuOpen = false">
              {{ $t('nav.login') }}
            </button>
            <BaseButton variant="primary" size="medium" full-width class="animated-cta" @click="handleCTAClick">
              {{ $t('nav.getStarted') }}
            </BaseButton>
          </template>
        </div>
      </nav>
    </header>

    <!-- ===== 2. HERO SECTION ===== -->
    <section class="hero-section">
      <!-- Gradient orbs background -->
      <div class="hero-bg-orbs" aria-hidden="true">
        <div class="orb orb-green"></div>
        <div class="orb orb-bronze"></div>
        <div class="orb orb-light"></div>
      </div>

      <div class="hero-content">
        <div class="hero-text">
          <!-- Tagline pill -->
          <div class="hero-tagline-pill">
            <MaterialIcon icon="auto_awesome" size="sm" color="var(--gold-primary)" />
            <span>{{ $t('landing.hero.tagline') }}</span>
          </div>

          <h1 class="hero-headline">
            <span class="headline-regular">{{ $t('landing.hero.headlinePart1') }}</span>
            <span class="headline-gold">{{ $t('landing.hero.headlinePart2') }}</span>
            <span class="headline-regular">{{ $t('landing.hero.headlinePart3') }}</span>
          </h1>
          <p class="hero-subheadline">{{ $t('landing.hero.subheadline') }}</p>

          <!-- Feature pills -->
          <div class="hero-features">
            <div class="hero-feature">
              <MaterialIcon icon="auto_awesome" size="sm" color="var(--gold-primary)" />
              <span>{{ $t('landing.hero.features.aiContent') }}</span>
            </div>
            <div class="hero-feature">
              <MaterialIcon icon="schedule" size="sm" color="var(--gold-primary)" />
              <span>{{ $t('landing.hero.features.scheduling') }}</span>
            </div>
            <div class="hero-feature">
              <MaterialIcon icon="hub" size="sm" color="var(--gold-primary)" />
              <span>{{ $t('landing.hero.features.multiPlatform') }}</span>
            </div>
            <div class="hero-feature">
              <MaterialIcon icon="analytics" size="sm" color="var(--gold-primary)" />
              <span>{{ $t('landing.hero.features.analytics') }}</span>
            </div>
            <div class="hero-feature">
              <MaterialIcon icon="smartphone" size="sm" color="var(--gold-primary)" />
              <span>{{ $t('landing.hero.features.mobileApp') }}</span>
            </div>
          </div>

          <!-- CTA Buttons -->
          <div class="hero-cta-group">
            <BaseButton variant="primary" size="large" class="hero-cta-primary" @click="handleCTAClick">
              {{ $t('landing.hero.cta') }}
              <MaterialIcon icon="arrow_forward" size="sm" color="var(--text-on-gold)" />
            </BaseButton>
            <BaseButton variant="secondary" size="large" class="hero-cta-secondary" @click="scrollToSection('how-it-works')">
              {{ $t('landing.hero.ctaSecondary') }}
              <MaterialIcon icon="play_arrow" size="sm" />
            </BaseButton>
          </div>
        </div>

        <!-- Phone mockup with Lazarus chat -->
        <div class="hero-phone">
          <PhoneMockup>
            <LazarusChat />
          </PhoneMockup>
        </div>
      </div>
    </section>

    <!-- ===== 3. MEET LAZARUS ===== -->
    <section class="meet-lazarus-section">
      <div class="section-container">
        <!-- Centered mascot hero -->
        <div class="lazarus-mascot-hero">
          <LazarusAnimatedMascot :size="240" />
        </div>

        <h2 class="section-title">{{ $t('landing.meetLazarus.title') }}</h2>
        <p class="lazarus-subtitle-centered">{{ $t('landing.meetLazarus.subtitle') }}</p>
        <p class="lazarus-description-centered">{{ $t('landing.meetLazarus.description') }}</p>
        <p class="lazarus-name-origin-centered">{{ $t('landing.meetLazarus.nameOrigin') }}</p>

        <div class="lazarus-capabilities">
          <div class="capability-item">
            <MaterialIcon icon="psychology" size="sm" color="var(--gold-primary)" />
            <span>{{ $t('landing.meetLazarus.feature1Title') }}</span>
          </div>
          <div class="capability-item">
            <MaterialIcon icon="edit_note" size="sm" color="var(--gold-primary)" />
            <span>{{ $t('landing.meetLazarus.feature2Title') }}</span>
          </div>
          <div class="capability-item">
            <MaterialIcon icon="send" size="sm" color="var(--gold-primary)" />
            <span>{{ $t('landing.meetLazarus.feature3Title') }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== 4b. REAL RESULTS (Interactive Slider) ===== -->
    <section class="results-section">
      <div class="section-container">
        <h2 class="section-title">{{ $t('landing.results.title') }}</h2>
        <p class="section-subtitle">{{ $t('landing.results.subtitle') }}</p>

        <div class="before-after-gallery">
          <!-- Main Slider -->
          <div
            ref="sliderContainerRef"
            class="comparison-slider"
            @mousedown="onMouseDown"
            @mousemove="onMouseMove"
            @mouseup="onMouseUp"
            @mouseleave="onMouseUp"
          >
            <!-- After Image (Background - full) -->
            <div class="slider-image-container">
              <img
                :src="selectedComparison.generated"
                :alt="$t('landing.results.after')"
                class="slider-image"
                draggable="false"
                loading="lazy"
              />
              <div class="image-label after-label">
                {{ $t('landing.results.after') }}
              </div>
            </div>

            <!-- Before Image (Foreground - clipped) -->
            <div
              class="slider-image-container before-container"
              :style="{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }"
            >
              <img
                :src="selectedComparison.original"
                :alt="$t('landing.results.before')"
                class="slider-image"
                draggable="false"
                loading="lazy"
              />
              <div class="image-label before-label">
                {{ $t('landing.results.before') }}
              </div>
            </div>

            <!-- Slider Handle -->
            <div
              class="slider-handle"
              :class="{ 'is-dragging': isDragging }"
              :style="{ left: `${sliderPosition}%` }"
            >
              <div class="handle-line"></div>
              <div class="handle-button" @touchstart="onHandleTouchStart">
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
                :alt="$t('landing.results.before')"
                class="thumbnail-image"
                loading="lazy"
              />
              <!-- Progress indicator -->
              <div class="thumbnail-progress-bar">
                <div
                  v-if="selectedComparisonIndex === index"
                  :key="`comparison-progress-${index}-${comparisonProgressKey}`"
                  :class="['thumbnail-progress-fill', { paused: isComparisonPaused }]"
                />
              </div>
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== 5. HOW IT WORKS ===== -->
    <section id="how-it-works" class="how-it-works-section">
      <div class="section-container">
        <h2 class="section-title">{{ $t('landing.howItWorks.title') }}</h2>
        <p class="section-subtitle">{{ $t('landing.howItWorks.subtitle') }}</p>

        <div class="steps-grid">
          <div v-for="step in howItWorksSteps" :key="step.step" class="step-card">
            <span class="step-badge">{{ step.step }}</span>
            <div class="step-icon-wrapper">
              <MaterialIcon :icon="step.icon" size="lg" color="var(--gold-primary)" />
            </div>
            <h3 class="step-title">{{ $t(step.titleKey) }}</h3>
            <p class="step-description">{{ $t(step.descKey) }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== 6. FEATURES GRID ===== -->
    <section id="features" class="features-section">
      <div class="section-container">
        <h2 class="section-title">{{ $t('landing.features.title') }}</h2>
        <p class="section-subtitle">{{ $t('landing.features.subtitle') }}</p>

        <div class="features-grid">
          <BaseCard
            v-for="feature in featuresData"
            :key="feature.id"
            variant="glass"
            class="feature-card"
            hoverable
          >
            <div class="feature-icon">
              <MaterialIcon :icon="feature.icon" size="lg" color="var(--gold-primary)" />
            </div>
            <h3 class="feature-title">{{ $t(`landing.features.${feature.id}.title`) }}</h3>
            <p class="feature-description">{{ $t(`landing.features.${feature.id}.desc`) }}</p>
          </BaseCard>
        </div>
      </div>
    </section>

    <!-- ===== 7. MOBILE APP SHOWCASE ===== -->
    <section class="mobile-app-section">
      <div class="section-container">
        <div class="mobile-app-layout">
          <div class="mobile-app-phone">
            <PhoneMockup :scale="0.85">
              <LazarusChat />
            </PhoneMockup>
          </div>
          <div class="mobile-app-text">
            <h2 class="section-title">{{ $t('landing.mobileApp.title') }}</h2>
            <p class="section-subtitle">{{ $t('landing.mobileApp.subtitle') }}</p>
            <ul class="mobile-app-features">
              <li>
                <MaterialIcon icon="touch_app" size="sm" color="var(--gold-primary)" />
                <span>{{ $t('landing.mobileApp.feature1') }}</span>
              </li>
              <li>
                <MaterialIcon icon="notifications_active" size="sm" color="var(--gold-primary)" />
                <span>{{ $t('landing.mobileApp.feature2') }}</span>
              </li>
              <li>
                <MaterialIcon icon="rate_review" size="sm" color="var(--gold-primary)" />
                <span>{{ $t('landing.mobileApp.feature3') }}</span>
              </li>
            </ul>
            <BaseButton variant="primary" size="large" class="animated-cta" @click="handleCTAClick">
              {{ $t('landing.hero.cta') }}
              <MaterialIcon icon="arrow_forward" size="sm" color="var(--text-on-gold)" />
            </BaseButton>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== 8. PRICING (dynamic from API) ===== -->
    <section v-if="ENABLE_SIGNUP" id="pricing" class="pricing-section">
      <div class="section-container">
        <h2 class="section-title">{{ $t('landing.pricing.title') }}</h2>
        <p class="section-subtitle">{{ $t('landing.pricing.subtitle') }}</p>

        <div v-if="plansLoading" class="pricing-loading">
          <div class="spinner"></div>
          <p>{{ $t('plans.loading') }}</p>
        </div>

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

            <div class="price-wrapper">
              <div v-if="getBeforePrice(plan)" class="original-price">
                {{ formatBeforePrice(getBeforePrice(plan)!) }}
              </div>
              <div class="pricing-price">{{ plan.formatted_price }}</div>
              <span class="price-period">{{ getPriceInterval(plan) }}</span>
              <div v-if="plan.savings" class="savings-badge">
                {{ plan.savings }}
              </div>
            </div>

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

            <div class="social-posting-included">
              <div class="posting-line">
                <span class="platform-icon-small facebook"></span>
                <span>{{ $t('plans.facebookPublishing') }}</span>
                <span class="included-badge">{{ $t('plans.included') }}</span>
              </div>
              <div class="posting-line">
                <span class="platform-icon-small instagram"></span>
                <span>{{ $t('plans.instagramPublishing') }}</span>
                <span class="included-badge">{{ $t('plans.included') }}</span>
              </div>
            </div>

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

    <!-- ===== 9. WAITLIST (when signup disabled) ===== -->
    <section v-else id="waitlist" class="waitlist-section">
      <div class="section-container">
        <h2 class="section-title">{{ $t('waitlist.headline') }}</h2>
        <p class="section-subtitle">{{ $t('waitlist.subheadline') }}</p>

        <p class="waitlist-social-proof">
          {{ $t('waitlist.socialProof', { count: waitlistCount }) }}
        </p>

        <BaseCard variant="glass-intense" class="waitlist-card">
          <div v-if="waitlistSuccess" class="waitlist-success">
            <div class="success-icon">✓</div>
            <h3 class="success-title">{{ $t('waitlist.successTitle') }}</h3>
            <p class="success-message">{{ $t('waitlist.successMessage') }}</p>
          </div>

          <form v-else @submit.prevent="handleWaitlistSubmit" class="waitlist-form">
            <BaseAlert v-if="waitlistError" type="error" :dismissible="true" @close="waitlistError = ''">
              {{ waitlistError }}
            </BaseAlert>

            <div class="waitlist-input-row">
              <BaseInput
                v-model="waitlistEmail"
                type="email"
                :placeholder="$t('waitlist.emailPlaceholder')"
                required
                class="waitlist-email-input"
              />
              <BaseButton
                type="submit"
                variant="primary"
                size="large"
                :disabled="waitlistLoading"
                class="waitlist-submit-btn"
              >
                {{ waitlistLoading ? $t('waitlist.joining') : $t('waitlist.joinButton') }}
              </BaseButton>
            </div>
          </form>
        </BaseCard>

        <p class="waitlist-login-link">
          {{ $t('waitlist.loginLink') }}
          <button class="login-text-link" @click="showLoginModal = true">
            {{ $t('waitlist.loginLinkText') }}
          </button>
        </p>
      </div>
    </section>

    <!-- ===== 10. FINAL CTA ===== -->
    <section class="final-cta-section">
      <div class="section-container">
        <template v-if="ENABLE_SIGNUP">
          <h2 class="final-cta-title">{{ $t('landing.finalCta.title') }}</h2>
          <p class="final-cta-subtitle">{{ $t('landing.finalCta.subtitle') }}</p>
          <BaseButton variant="primary" size="large" class="final-cta-button animated-cta" @click="handleCTAClick">
            {{ $t('landing.hero.cta') }}
          </BaseButton>
        </template>
        <template v-else>
          <h2 class="final-cta-title">{{ $t('waitlist.finalCta.title') }}</h2>
          <p class="final-cta-subtitle">{{ $t('waitlist.finalCta.subtitle') }}</p>
          <BaseButton variant="primary" size="large" class="final-cta-button animated-cta" @click="handleCTAClick">
            {{ $t('waitlist.joinButton') }}
          </BaseButton>
        </template>
      </div>
    </section>

    <!-- ===== 11. FOOTER ===== -->
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
/* ===== BASE ===== */
.landing-page {
  min-height: 100vh;
  background: var(--bg-primary);
  scroll-behavior: smooth;
}

.landing-page :target {
  scroll-margin-top: 80px;
}

.section-container {
  max-width: var(--max-width-2xl);
  margin: 0 auto;
  padding: 0 var(--space-xl);
}

.section-title {
  font-family: var(--font-heading);
  font-size: clamp(1.75rem, 3vw, 2.5rem);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  text-align: center;
  margin-bottom: var(--space-sm);
}

.section-subtitle {
  font-size: var(--text-lg);
  color: var(--text-secondary);
  text-align: center;
  max-width: 600px;
  margin: 0 auto var(--space-3xl);
  line-height: 1.6;
}

/* ===== HEADER ===== */
.site-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  padding: var(--space-md) var(--space-xl);
  transition: var(--transition-base);
  background: transparent;
}

.site-header.scrolled {
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--glass-border);
  box-shadow: 0 2px 20px rgba(15, 61, 46, 0.08);
}

.header-container {
  max-width: var(--max-width-2xl);
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-xl);
}

.header-logo {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.logo-image {
  height: 40px;
  width: auto;
}

.logo-text {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.desktop-nav {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
}

.nav-link {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-family: var(--font-body);
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  cursor: pointer;
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  transition: var(--transition-base);
}

.nav-link:hover {
  color: var(--text-primary);
  background: var(--glass-bg);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.login-link {
  background: none;
  border: 1px solid var(--glass-border);
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  padding: var(--space-sm) var(--space-lg);
  border-radius: var(--radius-full);
  transition: var(--transition-base);
}

.login-link:hover {
  border-color: var(--gold-primary);
  color: var(--gold-primary);
}

/* Mobile header pill */
.mobile-header-pill {
  display: none;
}

.hamburger-line {
  display: block;
  width: 20px;
  height: 2px;
  background: var(--text-primary);
  border-radius: var(--radius-full);
  transition: var(--transition-base);
}

.pill-menu-button {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: none;
  border: none;
  padding: var(--space-sm);
  cursor: pointer;
}

.pill-menu-button.active .hamburger-line:nth-child(1) {
  transform: rotate(45deg) translate(4px, 4px);
}

.pill-menu-button.active .hamburger-line:nth-child(2) {
  opacity: 0;
}

.pill-menu-button.active .hamburger-line:nth-child(3) {
  transform: rotate(-45deg) translate(4px, -4px);
}

.pill-actions {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

/* Mobile Navigation */
.mobile-nav {
  display: none;
  flex-direction: column;
  gap: var(--space-sm);
  padding: var(--space-lg);
  background: var(--glass-bg);
  border-top: 1px solid var(--glass-border);
  max-height: 0;
  overflow: hidden;
  opacity: 0;
  transition: all 0.3s ease;
}

.mobile-nav.open {
  max-height: 400px;
  opacity: 1;
  padding-bottom: var(--space-xl);
}

.mobile-nav-link {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-family: var(--font-body);
  font-size: var(--text-lg);
  font-weight: var(--font-medium);
  cursor: pointer;
  padding: var(--space-md);
  text-align: left;
  border-radius: var(--radius-md);
  transition: var(--transition-base);
}

.mobile-nav-link:hover {
  color: var(--text-primary);
  background: var(--glass-bg);
}

.mobile-nav-divider {
  height: 1px;
  background: var(--glass-border);
  margin: var(--space-sm) 0;
}

.mobile-nav-settings-row {
  display: flex;
  justify-content: space-around;
  gap: var(--space-lg);
  padding: var(--space-sm) 0;
}

.mobile-nav-setting {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
}

.mobile-nav-setting .setting-label {
  font-size: var(--text-xs);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.mobile-nav-setting :deep(.theme-toggle) {
  width: 48px;
  height: 48px;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
}

.mobile-nav-setting :deep(.theme-toggle .material-symbols-outlined) {
  font-size: 24px;
}

.mobile-nav-setting :deep(.language-selector .language-button) {
  width: 48px;
  height: 48px;
  min-width: 48px;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: 0;
  justify-content: center;
}

.mobile-nav-setting :deep(.language-selector .language-button .flag) {
  font-size: 24px;
}

.mobile-nav-setting :deep(.language-selector .language-button .flag-icon .material-symbols-outlined) {
  font-size: 24px;
}

.mobile-nav-setting :deep(.language-selector .language-button .chevron),
.mobile-nav-setting :deep(.language-selector .language-button .currency-badge) {
  display: none;
}

.mobile-nav-buttons {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  width: 100%;
}

.mobile-nav-login-btn {
  width: 100%;
  padding: var(--space-md) var(--space-lg);
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: var(--transition-base);
}

.mobile-nav-login-btn:hover {
  border-color: var(--gold-primary);
  color: var(--gold-primary);
}

/* ===== HERO ===== */
.hero-section {
  min-height: 100vh;
  display: flex;
  align-items: center;
  padding: var(--space-2xl);
  padding-top: calc(80px + var(--space-3xl));
  position: relative;
  overflow: hidden;
}

/* CSS gradient orbs background */
.hero-bg-orbs {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.25;
}

.orb-green {
  width: 500px;
  height: 500px;
  background: var(--gold-primary);
  top: -100px;
  right: -100px;
  opacity: 0.12;
}

.orb-bronze {
  width: 400px;
  height: 400px;
  background: #b08a5a;
  bottom: -50px;
  left: -50px;
  opacity: 0.1;
}

.orb-light {
  width: 600px;
  height: 600px;
  background: var(--bg-secondary);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  opacity: 0.5;
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

.hero-tagline-pill {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  background: rgba(15, 61, 46, 0.06);
  border: 1px solid rgba(15, 61, 46, 0.15);
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  color: var(--gold-primary);
  margin-bottom: var(--space-xl);
}

.hero-headline {
  font-family: var(--font-heading);
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: var(--font-bold);
  margin-bottom: var(--space-lg);
  line-height: 1.15;
}

.headline-regular {
  color: var(--text-primary);
  display: block;
}

.headline-gold {
  background: linear-gradient(135deg, var(--gold-primary), var(--gold-light));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  display: block;
}

.hero-subheadline {
  font-size: var(--text-lg);
  color: var(--text-secondary);
  line-height: 1.7;
  margin-bottom: var(--space-xl);
  max-width: 520px;
}

.hero-features {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  margin-bottom: var(--space-2xl);
}

.hero-feature {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  color: var(--text-primary);
  font-weight: var(--font-medium);
}

.hero-cta-group {
  display: flex;
  gap: var(--space-md);
  flex-wrap: wrap;
}

.hero-phone {
  display: flex;
  justify-content: center;
  align-items: center;
}

/* ===== MEET LAZARUS ===== */
.meet-lazarus-section {
  padding: var(--space-5xl) 0;
  background: var(--bg-primary);
  text-align: center;
}

.lazarus-mascot-hero {
  display: flex;
  justify-content: center;
  margin-bottom: var(--space-2xl);
}

.lazarus-subtitle-centered {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  color: var(--gold-primary);
  margin-bottom: var(--space-lg);
  text-align: center;
}

.lazarus-description-centered {
  font-size: var(--text-base);
  color: var(--text-secondary);
  line-height: 1.7;
  margin-bottom: var(--space-md);
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  text-align: center;
}

.lazarus-name-origin-centered {
  font-size: var(--text-sm);
  color: var(--text-muted);
  font-style: italic;
  margin-bottom: var(--space-2xl);
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
  text-align: center;
}

.lazarus-capabilities {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: var(--space-md);
}

.capability-item {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-lg);
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  color: var(--text-primary);
  font-weight: var(--font-medium);
  transition: var(--transition-base);
}

.capability-item:hover {
  border-color: rgba(15, 61, 46, 0.25);
  box-shadow: 0 4px 16px rgba(15, 61, 46, 0.08);
}

/* ===== RESULTS / BEFORE-AFTER SLIDER ===== */
.results-section {
  padding: var(--space-5xl) 0;
  background: var(--bg-secondary);
}

.before-after-gallery {
  margin-top: 0;
  padding-top: 0;
}

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
  touch-action: auto;
  -webkit-touch-callout: none;
  box-shadow: 0 8px 40px rgba(15, 61, 46, 0.15);
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
  color: #ffffff;
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
  box-shadow: 0 0 10px rgba(15, 61, 46, 0.5);
}

.handle-button {
  width: 48px;
  height: 48px;
  background: var(--gold-primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(15, 61, 46, 0.3), 0 0 20px rgba(15, 61, 46, 0.2);
  flex-shrink: 0;
  pointer-events: auto;
  cursor: ew-resize;
  touch-action: none;
  transition: var(--transition-fast);
}

.slider-handle.is-dragging .handle-button {
  transform: scale(1.1);
  box-shadow: 0 4px 24px rgba(15, 61, 46, 0.4), 0 0 30px rgba(15, 61, 46, 0.3);
}

/* Thumbnail Selector */
.comparison-thumbnails {
  display: flex;
  justify-content: center;
  gap: var(--space-lg);
  flex-wrap: wrap;
}

.thumbnail-button {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm);
  background: var(--glass-bg);
  border: 2px solid var(--glass-border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: var(--transition-base);
  overflow: hidden;
}

.thumbnail-button:hover {
  border-color: var(--gold-primary);
  transform: translateY(-2px);
}

.thumbnail-button.active {
  border-color: var(--gold-primary);
  box-shadow: 0 4px 16px rgba(15, 61, 46, 0.15);
}

.thumbnail-image {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: var(--radius-md);
}

/* Thumbnail Progress Bar */
.thumbnail-progress-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: rgba(15, 61, 46, 0.1);
  border-radius: 0 0 var(--radius-md) var(--radius-md);
  overflow: hidden;
}

.thumbnail-progress-fill {
  height: 100%;
  width: 0;
  background: var(--gold-primary);
  animation: thumbnailProgressFill 5s linear forwards;
}

.thumbnail-progress-fill.paused {
  animation-play-state: paused;
}

@keyframes thumbnailProgressFill {
  from { width: 0; }
  to { width: 100%; }
}

/* ===== HOW IT WORKS ===== */
.how-it-works-section {
  padding: var(--space-5xl) 0;
  background: var(--bg-secondary);
}

.steps-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-2xl);
}

.step-card {
  text-align: center;
  padding: var(--space-2xl) var(--space-xl);
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  position: relative;
  transition: var(--transition-base);
}

.step-card:hover {
  border-color: rgba(15, 61, 46, 0.2);
  box-shadow: 0 8px 32px rgba(15, 61, 46, 0.1);
  transform: translateY(-2px);
}

.step-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: var(--gold-primary);
  color: #ffffff;
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  border-radius: var(--radius-full);
  margin-bottom: var(--space-lg);
}

.step-icon-wrapper {
  margin-bottom: var(--space-lg);
}

.step-title {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin-bottom: var(--space-sm);
}

.step-description {
  font-size: var(--text-base);
  color: var(--text-secondary);
  line-height: 1.6;
}

/* ===== FEATURES GRID ===== */
.features-section {
  padding: var(--space-5xl) 0;
  background: var(--bg-primary);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-xl);
}

.feature-card {
  padding: var(--space-xl);
  text-align: left;
}

.feature-icon {
  margin-bottom: var(--space-md);
}

.feature-title {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin-bottom: var(--space-sm);
}

.feature-description {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: 1.6;
}

/* ===== MOBILE APP SHOWCASE ===== */
.mobile-app-section {
  padding: var(--space-5xl) 0;
  background: var(--bg-secondary);
}

.mobile-app-layout {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--space-4xl);
  align-items: center;
}

.mobile-app-phone {
  display: flex;
  justify-content: center;
}

.mobile-app-text .section-title {
  text-align: left;
}

.mobile-app-text .section-subtitle {
  text-align: left;
  margin-left: 0;
  margin-bottom: var(--space-xl);
}

.mobile-app-features {
  list-style: none;
  padding: 0;
  margin: 0 0 var(--space-2xl);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.mobile-app-features li {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  font-size: var(--text-base);
  color: var(--text-primary);
}

/* ===== PRICING ===== */
.pricing-section {
  padding: var(--space-5xl) 0;
  background: var(--bg-primary);
}

.pricing-loading {
  text-align: center;
  padding: var(--space-3xl);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--glass-border);
  border-top-color: var(--gold-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto var(--space-md);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.pricing-preview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--space-xl);
  max-width: 1000px;
  margin: 0 auto;
}

.pricing-card {
  padding: var(--space-2xl);
  text-align: center;
  position: relative;
}

.pricing-card.featured {
  border-color: var(--gold-primary);
  box-shadow: 0 8px 32px rgba(15, 61, 46, 0.12);
}

.pricing-badge {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--gold-primary);
  color: #ffffff;
  padding: var(--space-xs) var(--space-lg);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
  white-space: nowrap;
}

.lifetime-badge {
  background: linear-gradient(135deg, #b08a5a, #9a7848);
}

.limited-badge {
  font-size: var(--text-xs);
  color: var(--gold-primary);
  font-weight: var(--font-medium);
  margin-bottom: var(--space-sm);
}

.tier-icon-wrapper {
  margin-bottom: var(--space-md);
}

.pricing-tier {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin-bottom: var(--space-md);
}

.price-wrapper {
  margin-bottom: var(--space-lg);
}

.original-price {
  font-size: var(--text-sm);
  color: var(--text-muted);
  text-decoration: line-through;
  margin-bottom: var(--space-xs);
}

.pricing-price {
  font-family: var(--font-heading);
  font-size: var(--text-4xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
}

.price-period {
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.savings-badge {
  display: inline-block;
  margin-top: var(--space-xs);
  background: rgba(15, 61, 46, 0.08);
  color: var(--gold-primary);
  padding: 2px var(--space-sm);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
}

.credits-highlight {
  padding: var(--space-md);
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-lg);
}

.credit-line {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  font-size: var(--text-sm);
  color: var(--text-primary);
  font-weight: var(--font-medium);
}

.or-divider {
  font-size: var(--text-xs);
  color: var(--text-muted);
  margin: var(--space-xs) 0;
  display: block;
  text-align: center;
}

.social-posting-included {
  margin-bottom: var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.posting-line {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.platform-icon-small {
  width: 16px;
  height: 16px;
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}

.platform-icon-small.facebook {
  background: #1877F2;
}

.platform-icon-small.instagram {
  background: linear-gradient(135deg, #833AB4, #FD1D1D, #F77737);
}

.included-badge {
  margin-left: auto;
  font-size: var(--text-xs);
  color: var(--gold-primary);
  font-weight: var(--font-semibold);
}

/* ===== WAITLIST ===== */
.waitlist-section {
  padding: var(--space-5xl) 0;
  background: var(--bg-secondary);
}

.waitlist-social-proof {
  text-align: center;
  font-size: var(--text-sm);
  color: var(--gold-primary);
  font-weight: var(--font-medium);
  margin-bottom: var(--space-2xl);
}

.waitlist-card {
  max-width: 600px;
  margin: 0 auto var(--space-xl);
  padding: var(--space-2xl);
}

.waitlist-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.waitlist-input-row {
  display: flex;
  gap: var(--space-md);
}

.waitlist-email-input {
  flex: 1;
}

.waitlist-success {
  text-align: center;
  padding: var(--space-xl);
}

.success-icon {
  width: 48px;
  height: 48px;
  background: var(--gold-primary);
  color: #ffffff;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  margin: 0 auto var(--space-md);
}

.success-title {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  color: var(--text-primary);
  margin-bottom: var(--space-sm);
}

.success-message {
  color: var(--text-secondary);
}

.waitlist-login-link {
  text-align: center;
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.login-text-link {
  background: none;
  border: none;
  color: var(--gold-primary);
  font-weight: var(--font-semibold);
  cursor: pointer;
  text-decoration: underline;
}

/* ===== FINAL CTA ===== */
.final-cta-section {
  padding: var(--space-5xl) 0;
  background: var(--bg-primary);
  text-align: center;
}

.final-cta-title {
  font-family: var(--font-heading);
  font-size: clamp(1.75rem, 3vw, 2.5rem);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  margin-bottom: var(--space-md);
}

.final-cta-subtitle {
  font-size: var(--text-lg);
  color: var(--text-secondary);
  margin-bottom: var(--space-2xl);
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

/* ===== FOOTER ===== */
.landing-footer {
  padding: var(--space-2xl) 0;
  border-top: 1px solid var(--glass-border);
  background: var(--bg-secondary);
}

.footer-content {
  max-width: var(--max-width-2xl);
  margin: 0 auto;
  padding: 0 var(--space-xl);
  text-align: center;
}

.footer-made-with {
  font-size: var(--text-sm);
  color: var(--text-muted);
  margin-bottom: var(--space-sm);
}

.footer-links {
  display: flex;
  justify-content: center;
  gap: var(--space-md);
  margin-bottom: var(--space-sm);
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

/* ===== ANIMATED CTA ===== */
.animated-cta {
  position: relative;
  overflow: hidden;
}

.animated-cta::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -75%;
  width: 50%;
  height: 200%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.15),
    transparent
  );
  transform: skewX(-25deg);
  animation: shimmer 4s infinite;
}

@keyframes shimmer {
  0%, 100% { left: -75%; }
  50% { left: 125%; }
}

/* ===== RESPONSIVE ===== */

/* Tablet */
@media (max-width: 1024px) {
  .hero-content {
    grid-template-columns: 1fr;
    gap: var(--space-2xl);
    text-align: center;
  }

  .hero-text {
    order: 2;
  }

  .hero-phone {
    order: 1;
  }

  .hero-tagline-pill {
    margin-left: auto;
    margin-right: auto;
  }

  .hero-subheadline {
    max-width: none;
    margin-left: auto;
    margin-right: auto;
  }

  .hero-features {
    justify-content: center;
  }

  .hero-cta-group {
    justify-content: center;
  }

  .comparison-slider {
    max-width: 500px;
  }

  .steps-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-lg);
  }

  .features-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .mobile-app-layout {
    grid-template-columns: 1fr;
    text-align: center;
    gap: var(--space-2xl);
  }

  .mobile-app-text .section-title,
  .mobile-app-text .section-subtitle {
    text-align: center;
    margin-left: auto;
    margin-right: auto;
  }

  .mobile-app-features {
    align-items: center;
  }
}

/* Mobile */
@media (max-width: 768px) {
  .desktop-header {
    display: none;
  }

  .mobile-header-pill {
    display: block;
    padding: 0;
  }

  .pill-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-xs) var(--space-sm);
    background: var(--glass-bg);
    backdrop-filter: blur(20px);
    border-radius: var(--radius-full);
    border: 1px solid var(--glass-border);
    margin: 0 var(--space-md);
  }

  .mobile-nav {
    display: flex;
    border-radius: 0 0 var(--radius-xl) var(--radius-xl);
    margin: 0 var(--space-md);
    border: 1px solid var(--glass-border);
    border-top: none;
    backdrop-filter: blur(20px);
  }

  .site-header {
    padding: var(--space-sm) 0;
  }

  .hero-section {
    padding: var(--space-xl);
    padding-top: calc(80px + var(--space-xl));
    min-height: auto;
  }

  .hero-headline {
    font-size: clamp(2rem, 8vw, 2.5rem);
  }

  .hero-features {
    gap: var(--space-xs);
  }

  .hero-feature {
    font-size: var(--text-xs);
    padding: 3px var(--space-sm);
  }

  .hero-cta-group {
    flex-direction: column;
    align-items: stretch;
  }

  .comparison-slider {
    max-width: 100%;
  }

  .thumbnail-image {
    width: 60px;
    height: 60px;
  }

  .comparison-thumbnails {
    gap: var(--space-sm);
  }

  .lazarus-mascot-hero :deep(.lazarus-mascot-wrapper) {
    width: 180px !important;
    height: 180px !important;
  }

  .steps-grid {
    grid-template-columns: 1fr;
    gap: var(--space-lg);
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .waitlist-input-row {
    flex-direction: column;
  }

  .pricing-preview {
    grid-template-columns: 1fr;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
</style>

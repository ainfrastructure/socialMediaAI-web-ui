<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import { useLogin } from '../composables/useLogin'
import { api } from '../services/api'
import BaseCard from '../components/BaseCard.vue'
import BaseButton from '../components/BaseButton.vue'
import MaterialIcon from '../components/MaterialIcon.vue'
import LoginModal from '../components/LoginModal.vue'
import PaywallModal from '../components/PaywallModal.vue'
import LanguageSelector from '../components/LanguageSelector.vue'

const router = useRouter()
const authStore = useAuthStore()
const { t } = useI18n()

// Mobile menu state
const isMobileMenuOpen = ref(false)
const isHeaderScrolled = ref(false)

// Handle scroll for header background
function handleScroll() {
  isHeaderScrolled.value = window.scrollY > 50
}

// Smooth scroll to section
function scrollToSection(sectionId: string) {
  const element = document.getElementById(sectionId)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' })
    isMobileMenuOpen.value = false
  }
}

// Toggle mobile menu
function toggleMobileMenu() {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

// Login composable - only need resetForm for modal callback
const { resetForm } = useLogin()

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

// Calculate "before" price for yearly and lifetime plans
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
  return null // monthly plans don't show before price
}

function formatBeforePrice(price: number): string {
  // Format the price with currency symbol (assumes same currency as plan)
  const currency = plans.value[0]?.currency || 'USD'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
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

// Before/After thumbnail carousel state
let comparisonCarouselInterval: ReturnType<typeof setInterval> | null = null
const comparisonCarouselDuration = 5000 // 5 seconds per image

const selectedComparison = computed(() => comparisonExamples[selectedComparisonIndex.value])

function selectComparison(index: number) {
  selectedComparisonIndex.value = index
  sliderPosition.value = 50 // Reset slider position
  hasInteracted.value = false // Reset to allow animation on new selection
  // Stop any existing animation before starting a new one
  stopHintAnimation()
  startHintAnimation()
  // Reset carousel timer when manually selecting
  stopComparisonCarousel()
  startComparisonCarousel()
}

function startComparisonCarousel() {
  if (comparisonCarouselInterval) return
  comparisonCarouselInterval = setInterval(() => {
    selectedComparisonIndex.value = (selectedComparisonIndex.value + 1) % comparisonExamples.length
    sliderPosition.value = 50
    hasInteracted.value = false
    // Stop any existing animation before starting a new one
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

function startDragging(e: MouseEvent | TouchEvent) {
  e.preventDefault() // Prevent scrolling on touch devices
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
  e.preventDefault() // Prevent scrolling while dragging
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

// AI versions carousel state
const currentTemplateIndex = ref(0)
let carouselInterval: ReturnType<typeof setInterval> | null = null

const currentTemplate = computed(() => multiExample.generated[currentTemplateIndex.value])

function selectTemplate(index: number) {
  currentTemplateIndex.value = index
  // Reset auto-rotation timer when manually selecting
  stopCarouselRotation()
  startCarouselRotation()
}

function startCarouselRotation() {
  if (carouselInterval) return
  carouselInterval = setInterval(() => {
    currentTemplateIndex.value = (currentTemplateIndex.value + 1) % multiExample.generated.length
  }, 3500)
}

function stopCarouselRotation() {
  if (carouselInterval) {
    clearInterval(carouselInterval)
    carouselInterval = null
  }
}

// Start animations on mount
onMounted(async () => {
  await loadPlans()
  // Delay start of hint animation
  setTimeout(() => {
    if (!hasInteracted.value) {
      startHintAnimation()
    }
  }, 1000)
  // Start carousel auto-rotation
  startCarouselRotation()
  // Start before/after comparison carousel
  startComparisonCarousel()
  // Add scroll listener for header
  window.addEventListener('scroll', handleScroll)
  handleScroll() // Check initial scroll position
})

// Cleanup on unmount
onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  stopCarouselRotation()
  stopComparisonCarousel()
  stopHintAnimation()
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
    <!-- Sticky Header Navigation -->
    <header class="site-header" :class="{ scrolled: isHeaderScrolled }">
      <!-- Desktop Header Container -->
      <div class="header-container desktop-header">
        <!-- Logo -->
        <div class="header-logo">
          <img src="../assets/socialchef_logo.svg" alt="SocialChef" class="logo-image" />
          <span class="logo-text">SocialChef</span>
        </div>

        <!-- Desktop Navigation -->
        <nav class="header-nav desktop-nav">
          <button class="nav-link" @click="scrollToSection('examples')">
            {{ $t('nav.howItWorks') }}
          </button>
          <button class="nav-link" @click="scrollToSection('pricing')">
            {{ $t('nav.pricing') }}
          </button>
        </nav>

        <!-- Header Actions -->
        <div class="header-actions">
          <LanguageSelector />
          <template v-if="authStore.isAuthenticated">
            <BaseButton variant="primary" size="small" @click="goToDashboard">
              {{ $t('landing.loginBox.goToDashboard') }}
            </BaseButton>
          </template>
          <template v-else>
            <button class="login-link" @click="showLoginModal = true">
              {{ $t('nav.login') }}
            </button>
            <BaseButton variant="primary" size="small" @click="handleCTAClick">
              {{ $t('nav.getStarted') }}
            </BaseButton>
          </template>
        </div>
      </div>

      <!-- Mobile Header - Pill Style -->
      <div class="mobile-header-pill">
        <div class="pill-content">
          <!-- Logo -->
          <div class="header-logo">
            <img src="../assets/socialchef_logo.svg" alt="SocialChef" class="logo-image" />
            <span class="logo-text">SocialChef</span>
          </div>

          <!-- Right side actions -->
          <div class="pill-actions">
            <LanguageSelector />
            <template v-if="authStore.isAuthenticated">
              <button class="pill-login-btn" @click="goToDashboard">
                {{ $t('landing.loginBox.goToDashboard') }}
              </button>
            </template>
            <template v-else>
              <button class="pill-login-btn" @click="showLoginModal = true">
                {{ $t('nav.login') }}
              </button>
            </template>
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
        <button class="mobile-nav-link" @click="scrollToSection('examples')">
          {{ $t('nav.howItWorks') }}
        </button>
        <button class="mobile-nav-link" @click="scrollToSection('pricing')">
          {{ $t('nav.pricing') }}
        </button>
        <div class="mobile-nav-divider"></div>
        <template v-if="authStore.isAuthenticated">
          <BaseButton variant="primary" size="medium" full-width @click="goToDashboard">
            {{ $t('landing.loginBox.goToDashboard') }}
          </BaseButton>
        </template>
        <template v-else>
          <BaseButton variant="primary" size="medium" full-width @click="handleCTAClick">
            {{ $t('nav.getStarted') }}
          </BaseButton>
        </template>
      </nav>
    </header>

    <!-- Hero Section -->
    <section class="hero-section">
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

          <!-- Feature points -->
          <div class="hero-features">
            <div class="hero-feature">
              <MaterialIcon icon="image" size="sm" color="var(--gold-primary)" />
              <span>{{ $t('landing.hero.features.images') }}</span>
            </div>
            <div class="hero-feature">
              <MaterialIcon icon="videocam" size="sm" color="var(--gold-primary)" />
              <span>{{ $t('landing.hero.features.videos') }}</span>
            </div>
            <div class="hero-feature">
              <MaterialIcon icon="article" size="sm" color="var(--gold-primary)" />
              <span>{{ $t('landing.hero.features.posts') }}</span>
            </div>
            <div class="hero-feature">
              <MaterialIcon icon="send" size="sm" color="var(--gold-primary)" />
              <span>{{ $t('landing.hero.features.publish') }}</span>
            </div>
            <div class="hero-feature">
              <MaterialIcon icon="analytics" size="sm" color="var(--gold-primary)" />
              <span>{{ $t('landing.hero.features.analytics') }}</span>
            </div>
          </div>

          <!-- CTA Buttons -->
          <div class="hero-cta-group">
            <BaseButton variant="primary" size="large" class="hero-cta-primary" @click="handleCTAClick">
              {{ $t('landing.hero.cta') }}
              <MaterialIcon icon="auto_awesome" size="sm" color="var(--text-on-gold)" />
            </BaseButton>
            <BaseButton variant="secondary" size="large" class="hero-cta-secondary" @click="scrollToSection('how-it-works')">
              {{ $t('landing.hero.ctaSecondary') }}
              <MaterialIcon icon="play_arrow" size="sm" />
            </BaseButton>
          </div>

          <!-- As seen on -->
          <div class="hero-seen-on">
            <span class="seen-on-label">{{ $t('landing.hero.seenOn') }}</span>
            <div class="seen-on-logos">
              <a href="https://news.ycombinator.com" target="_blank" rel="noopener noreferrer" class="seen-on-logo" aria-label="Hacker News">
                <svg class="logo-icon hn-logo" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M0 0v24h24V0H0zm12.5 14.3V19h-1v-4.7L8.1 8h1.1l2.8 5.2 2.8-5.2h1.1l-3.4 6.3z"/>
                </svg>
                <span>Hacker News</span>
              </a>
              <a href="https://www.producthunt.com" target="_blank" rel="noopener noreferrer" class="seen-on-logo" aria-label="Product Hunt">
                <svg class="logo-icon ph-logo" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm1.2 14.4H10v3.6H8.4V6h4.8c2.319 0 4.2 1.881 4.2 4.2s-1.881 4.2-4.2 4.2zm-.001-6.6H10v4.8h3.199c1.322 0 2.4-1.078 2.4-2.4s-1.078-2.4-2.4-2.4z"/>
                </svg>
                <span>Product Hunt</span>
              </a>
              <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer" class="seen-on-logo" aria-label="LinkedIn">
                <svg class="logo-icon li-logo" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                <span>LinkedIn</span>
              </a>
            </div>
          </div>
        </div>

        <!-- Before/After Interactive Slider -->
        <div class="hero-slider">
          <div class="before-after-gallery">
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
                <!-- Progress indicator -->
                <div class="thumbnail-progress-bar">
                  <div
                    v-if="selectedComparisonIndex === index"
                    :key="`comparison-progress-${index}-${selectedComparisonIndex}`"
                    class="thumbnail-progress-fill"
                  />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Examples Showcase Section -->
    <section id="examples" class="examples-section">
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
              <div class="example-image-wrapper with-label">
                <div class="original-label">{{ $t('landing.examples.originalLabel') }}</div>
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

          <!-- Step 2: AI Generates (Carousel) -->
          <div class="flow-step-card">
            <div class="step-header">
              <span class="step-badge">2</span>
              <h3 class="step-title">{{ $t('landing.examples.flow.step2Title') }}</h3>
            </div>
            <p class="step-description">{{ $t('landing.examples.flow.step2Description') }}</p>
            <div class="step-visual">
              <!-- Single image carousel -->
              <div class="carousel-container">
                <div class="carousel-image-wrapper">
                  <div class="template-badge">
                    {{
                      $t(
                        `landing.examples.templates.${multiExample.generated[currentTemplateIndex].templateKey}`,
                      )
                    }}
                  </div>
                  <img
                    :src="multiExample.generated[currentTemplateIndex].src"
                    :alt="$t('landing.examples.aiGenerated')"
                    class="carousel-image"
                  />
                </div>
                <!-- Template badge selectors with progress bars -->
                <div class="carousel-badges">
                  <button
                    v-for="(gen, idx) in multiExample.generated"
                    :key="idx"
                    :class="['carousel-badge', { active: currentTemplateIndex === idx }]"
                    @click="selectTemplate(idx)"
                  >
                    <span class="badge-text">{{
                      $t(`landing.examples.templates.${gen.templateKey}`)
                    }}</span>
                    <div class="badge-progress-bar">
                      <div
                        v-if="currentTemplateIndex === idx"
                        :key="`progress-${idx}-${currentTemplateIndex}`"
                        class="badge-progress-fill animating"
                      />
                    </div>
                  </button>
                  <!-- And many more badge -->
                  <span class="carousel-badge more-badge">
                    {{ $t('landing.examples.templates.andMore') }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Arrow -->
          <div class="flow-arrow">
            <MaterialIcon icon="arrow_forward" size="lg" color="var(--gold-primary)" />
          </div>

          <!-- Step 3: Approve & Published (merged) -->
          <div class="flow-step-card">
            <div class="step-header">
              <span class="step-badge">3</span>
              <h3 class="step-title">{{ $t('landing.examples.flow.step3Title') }}</h3>
            </div>
            <p class="step-description">{{ $t('landing.examples.flow.step3Description') }}</p>
            <div class="step-visual">
              <div class="flow-platforms-grid">
                <!-- Facebook -->
                <div class="flow-platform-item">
                  <div class="flow-platform-logo facebook">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </div>
                  <span class="flow-platform-name">Facebook</span>
                </div>
                <!-- Instagram -->
                <div class="flow-platform-item">
                  <div class="flow-platform-logo instagram">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                    </svg>
                  </div>
                  <span class="flow-platform-name">Instagram</span>
                </div>
                <!-- TikTok -->
                <div class="flow-platform-item coming-soon">
                  <div class="flow-platform-logo tiktok">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                    </svg>
                  </div>
                  <span class="flow-platform-name">TikTok</span>
                  <span class="flow-coming-soon-badge">{{ $t('landing.howItWorks.comingSoon') }}</span>
                </div>
                <!-- X (Twitter) -->
                <div class="flow-platform-item coming-soon">
                  <div class="flow-platform-logo x-twitter">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </div>
                  <span class="flow-platform-name">X</span>
                  <span class="flow-coming-soon-badge">{{ $t('landing.howItWorks.comingSoon') }}</span>
                </div>
              </div>
            </div>
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
    <section id="pricing" class="pricing-section">
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
              <div v-if="getBeforePrice(plan)" class="original-price">
                {{ formatBeforePrice(getBeforePrice(plan)!) }}
              </div>
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

            <!-- Social Media Posting Included -->
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
  scroll-behavior: smooth;
}

/* Scroll offset for fixed header */
.landing-page :target {
  scroll-margin-top: 80px;
}

/* Sticky Header Navigation */
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
  background: rgba(20, 20, 20, 0.95);
  backdrop-filter: blur(var(--blur-lg));
  border-bottom: 1px solid var(--glass-border);
  box-shadow: var(--shadow-md);
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

/* Desktop Navigation */
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

/* Header Actions */
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

/* Mobile Header Pill - Hidden on desktop */
.mobile-header-pill {
  display: none;
}

/* Hamburger line shared styles */
.hamburger-line {
  display: block;
  width: 20px;
  height: 2px;
  background: var(--text-primary);
  border-radius: var(--radius-full);
  transition: var(--transition-base);
}

/* Mobile Navigation */
.mobile-nav {
  display: none;
  flex-direction: column;
  gap: var(--space-sm);
  padding: var(--space-lg);
  background: rgba(20, 20, 20, 0.98);
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

/* Hero Section */
.hero-section {
  min-height: 100vh;
  display: flex;
  align-items: center;
  padding: var(--space-2xl);
  padding-top: calc(80px + var(--space-3xl)); /* Account for fixed header */
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

/* Hero Tagline Pill */
.hero-tagline-pill {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  background: var(--gold-subtle);
  border: 1px solid var(--gold-dark);
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
  background: var(--gradient-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-style: italic;
  display: block;
}

.hero-subheadline {
  font-size: var(--text-xl);
  color: var(--text-secondary);
  margin-bottom: var(--space-xl);
  line-height: var(--leading-relaxed);
  max-width: 540px;
}

/* Hero Feature Points */
.hero-features {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-lg) var(--space-xl);
  margin-bottom: var(--space-2xl);
}

.hero-feature {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--text-base);
  color: var(--text-secondary);
}

/* Hero CTA Group */
.hero-cta-group {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-md);
  margin-bottom: var(--space-3xl);
}

.hero-cta-primary,
.hero-cta-secondary {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--text-lg);
  padding: var(--space-lg) var(--space-2xl);
}

.hero-cta-secondary {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(var(--blur-md));
}

.hero-cta-secondary:hover {
  background: var(--bg-tertiary);
  border-color: var(--gold-primary);
}

/* As Seen On Section */
.hero-seen-on {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.seen-on-label {
  font-size: var(--text-sm);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.seen-on-logos {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-xl);
}

.seen-on-logo {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  color: var(--text-muted);
  text-decoration: none;
  font-size: var(--text-sm);
  transition: var(--transition-base);
  opacity: 0.7;
}

.seen-on-logo:hover {
  color: var(--text-primary);
  opacity: 1;
}

.seen-on-logo .logo-icon {
  width: 20px;
  height: 20px;
}

.seen-on-logo .hn-logo {
  color: #ff6600;
}

.seen-on-logo .ph-logo {
  color: #da552f;
}

.seen-on-logo .li-logo {
  color: #0077b5;
}

/* Hero Slider */
.hero-slider {
  display: flex;
  justify-content: center;
  align-items: center;
}

.hero-slider .before-after-gallery {
  width: 100%;
  max-width: 500px;
}

.hero-slider .comparison-slider {
  max-width: 100%;
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

/* Examples Showcase Section */
.examples-section {
  background: linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
}

/* Main Example Flow - Horizontal Steps */
.main-example-flow {
  display: grid;
  grid-template-columns: 1fr auto 1fr auto 1fr;
  align-items: stretch;
  justify-content: center;
  gap: var(--space-lg);
  margin-bottom: var(--space-5xl);
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
}

.flow-step-card {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
  text-align: center;
  backdrop-filter: blur(var(--blur-md));
  display: flex;
  flex-direction: column;
  min-height: 480px;
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
  align-items: stretch;
  flex-grow: 1;
  width: 100%;
}

.flow-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 120px;
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

/* Flow Platforms Grid (Step 3 in Examples) */
.flow-platforms-grid {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  width: 100%;
}

.flow-platform-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-tertiary);
  border-radius: var(--radius-lg);
  position: relative;
}

.flow-platform-item.coming-soon {
  opacity: 0.6;
}

.flow-platform-logo {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  transition: var(--transition-base);
  flex-shrink: 0;
}

.flow-platform-logo svg {
  width: 20px;
  height: 20px;
}

.flow-platform-logo.facebook {
  background: linear-gradient(135deg, #1877f2 0%, #0d5ecf 100%);
}

.flow-platform-logo.instagram {
  background: linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);
}

.flow-platform-logo.tiktok {
  background: linear-gradient(135deg, #010101 0%, #1a1a1a 100%);
  border: 1px solid var(--glass-border);
}

.flow-platform-logo.x-twitter {
  background: linear-gradient(135deg, #000000 0%, #14171a 100%);
  border: 1px solid var(--glass-border);
}

.flow-platform-item:not(.coming-soon) .flow-platform-logo:hover {
  transform: scale(1.1);
  box-shadow: var(--shadow-lg);
}

.flow-platform-name {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-primary);
}

.flow-coming-soon-badge {
  margin-left: auto;
  background: var(--gold-subtle);
  color: var(--gold-primary);
  font-size: 10px;
  font-weight: var(--font-semibold);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  white-space: nowrap;
  border: 1px solid var(--gold-dark);
}

/* Image Wrappers */
.example-image-wrapper {
  width: 100%;
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 2px solid var(--border-color);
}

.example-image-wrapper.with-label {
  position: relative;
}

.original-label {
  position: absolute;
  top: var(--space-sm);
  left: var(--space-sm);
  background: var(--bg-secondary);
  color: var(--text-primary);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  z-index: 1;
  border: 1px solid var(--border-color);
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

/* AI Versions Carousel */
.carousel-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-lg);
  width: 100%;
}

.carousel-image-wrapper {
  position: relative;
  width: 100%;
  max-width: 100%;
  aspect-ratio: 1;
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 2px solid var(--gold-primary);
  box-shadow: var(--shadow-lg), var(--glow-gold-sm);
}

.carousel-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity 0.3s ease;
}

.carousel-badges {
  display: flex;
  gap: var(--space-sm);
  flex-wrap: wrap;
  justify-content: center;
  max-width: 100%;
}

.carousel-badge {
  position: relative;
  padding: var(--space-sm) var(--space-md);
  background: var(--glass-bg);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-lg);
  color: var(--text-secondary);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: var(--transition-base);
  min-height: 44px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
  overflow: hidden;
}

.carousel-badge:hover {
  border-color: var(--gold-primary);
  color: var(--text-primary);
}

.carousel-badge.active {
  border-color: var(--gold-primary);
  color: var(--text-primary);
  box-shadow: var(--glow-gold-sm);
}

.badge-text {
  position: relative;
  z-index: 1;
}

.badge-progress-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--border-color);
  overflow: hidden;
}

.badge-progress-fill {
  height: 100%;
  width: 0;
  background: var(--gold-primary);
}

.badge-progress-fill.animating {
  animation: progressFill 3.5s linear forwards;
}

@keyframes progressFill {
  from {
    width: 0;
  }
  to {
    width: 100%;
  }
}

/* "And many more" transparent badge */
.carousel-badge.more-badge {
  background: transparent;
  border: 2px dashed var(--border-color);
  color: var(--text-muted);
  cursor: default;
  font-style: italic;
}

.carousel-badge.more-badge:hover {
  border-color: var(--border-color);
  color: var(--text-muted);
}

/* Before/After Interactive Slider */
.before-after-gallery {
  margin-top: 0;
  padding-top: 0;
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
  touch-action: none; /* Prevent browser handling of touch gestures */
  -webkit-touch-callout: none;
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
  width: 48px;
  height: 48px;
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
  touch-action: none;
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
  position: relative;
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
  overflow: hidden;
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

/* Thumbnail Progress Bar */
.thumbnail-progress-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 0 0 var(--radius-md) var(--radius-md);
  overflow: hidden;
}

.thumbnail-progress-fill {
  height: 100%;
  width: 0;
  background: var(--gold-primary);
  animation: thumbnailProgressFill 5s linear forwards;
}

@keyframes thumbnailProgressFill {
  from {
    width: 0;
  }
  to {
    width: 100%;
  }
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

.pricing-card :deep(.base-button) {
  margin-top: auto;
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
  position: absolute;
  top: calc(var(--space-md) + 28px);
  left: 50%;
  transform: translateX(-50%);
  font-size: var(--text-xs);
  color: var(--warning-text);
  background: var(--warning-bg);
  border: 1px solid var(--warning-border);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-sm);
  white-space: nowrap;
}

.tier-icon-wrapper {
  margin-top: var(--space-lg);
}

.pricing-card.lifetime .tier-icon-wrapper {
  margin-top: var(--space-3xl);
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

.original-price {
  position: relative;
  font-size: var(--text-lg);
  opacity: 0.7;
  background: var(--gradient-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.original-price::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 2px;
  background: var(--gradient-gold);
  transform: translateY(-50%);
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

/* Social Posting Included */
.social-posting-included {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  padding: var(--space-md);
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  margin-top: var(--space-sm);
}

.posting-line {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.platform-icon-small {
  width: 18px;
  height: 18px;
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}

.platform-icon-small.facebook {
  background: var(--gradient-facebook);
}

.platform-icon-small.instagram {
  background: var(--gradient-instagram);
}

.included-badge {
  margin-left: auto;
  color: var(--success-text);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
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

.final-cta-section .section-container {
  max-width: var(--max-width-2xl);
  margin: 0 auto;
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
  /* Header responsive - Hide desktop, show mobile pill */
  .desktop-header {
    display: none;
  }

  .mobile-header-pill {
    display: block;
    padding: var(--space-md) var(--space-lg);
  }

  .pill-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba(20, 20, 20, 0.9);
    backdrop-filter: blur(var(--blur-lg));
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-full);
    padding: var(--space-sm) var(--space-sm) var(--space-sm) var(--space-lg);
    box-shadow: var(--shadow-lg);
    max-width: 420px;
    margin: 0 auto;
  }

  .pill-content .header-logo .logo-image {
    height: 28px;
  }

  .pill-content .header-logo .logo-text {
    font-size: var(--text-base);
  }

  .pill-actions {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
  }

  .pill-login-btn {
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
    white-space: nowrap;
  }

  .pill-login-btn:hover {
    border-color: var(--gold-primary);
    color: var(--gold-primary);
  }

  .pill-menu-button {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 4px;
    width: 44px;
    height: 44px;
    background: none;
    border: none;
    cursor: pointer;
    padding: var(--space-sm);
  }

  .pill-menu-button .hamburger-line {
    width: 18px;
    height: 2px;
    background: var(--text-primary);
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

  /* Style LanguageSelector inside pill */
  .pill-actions :deep(.language-button) {
    background: none;
    border: none;
    color: var(--text-secondary);
    padding: var(--space-xs) var(--space-sm);
    min-width: auto;
  }

  .pill-actions :deep(.language-button:hover) {
    background: rgba(212, 175, 55, 0.1);
  }

  .pill-actions :deep(.chevron) {
    color: var(--gold-primary);
  }

  .mobile-nav {
    display: flex;
    margin-top: var(--space-sm);
    margin-left: var(--space-lg);
    margin-right: var(--space-lg);
    border-radius: var(--radius-xl);
    background: rgba(30, 30, 30, 0.98);
  }

  .mobile-nav.open {
    padding: var(--space-lg);
  }

  .site-header {
    background: transparent;
    backdrop-filter: none;
  }

  .site-header.scrolled {
    background: transparent;
    backdrop-filter: none;
    border-bottom: none;
    box-shadow: none;
  }

  .hero-content {
    grid-template-columns: 1fr;
    text-align: center;
    gap: var(--space-3xl);
  }

  .hero-tagline-pill {
    justify-content: center;
  }

  .hero-subheadline {
    max-width: 100%;
    margin-left: auto;
    margin-right: auto;
  }

  .hero-features {
    justify-content: center;
  }

  .hero-cta-group {
    justify-content: center;
  }

  .hero-seen-on {
    align-items: center;
  }

  .seen-on-logos {
    justify-content: center;
  }

  .hero-slider {
    order: -1;
    padding-top: var(--space-xl);
  }

  .hero-slider .before-after-gallery {
    max-width: 400px;
  }

  .auto-posting-content {
    grid-template-columns: 1fr;
    text-align: center;
  }

  .auto-posting-features {
    align-items: center;
  }

  /* Examples responsive */
  .main-example-flow {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-md);
  }

  .flow-arrow {
    transform: rotate(90deg);
    padding: 0;
    margin-top: 0;
  }

  .flow-step-card {
    width: 100%;
    max-width: 500px;
    min-height: auto;
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
.benefit-card,
.pricing-card {
  animation: fadeInUp 0.6s var(--ease-smooth);
  animation-fill-mode: both;
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
  .benefit-card,
  .pricing-card,
  .thumbnail-progress-fill,
  .badge-progress-fill {
    animation: none;
  }
}
</style>

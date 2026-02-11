<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseButton from '../components/BaseButton.vue'
import BaseInput from '../components/BaseInput.vue'
import MaterialIcon from '../components/MaterialIcon.vue'
import ThemeToggle from '../components/ThemeToggle.vue'
import { waitlistService } from '../services/waitlistService'

const { t } = useI18n()

// ===== HEADER STATE =====
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

// ===== WAITLIST STATE =====
const waitlistEmail = ref('')
const waitlistLoading = ref(false)
const waitlistSuccess = ref(false)
const waitlistError = ref('')
const waitlistCount = ref(0)

async function handleWaitlistSubmit() {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!waitlistEmail.value || !emailRegex.test(waitlistEmail.value)) {
    waitlistError.value = t('appLanding.earlyBird.invalidEmail')
    return
  }

  waitlistLoading.value = true
  waitlistError.value = ''

  try {
    const response = await waitlistService.join(waitlistEmail.value, {
      referrer: 'app-landing-early-bird'
    })

    if (response.success) {
      waitlistSuccess.value = true
      const newCount = (response as any).count ?? (response as any).data?.count
      if (newCount !== undefined) {
        waitlistCount.value = newCount
      } else {
        waitlistCount.value += 1
      }
    } else if ((response as any).error === 'already_on_waitlist') {
      waitlistError.value = t('appLanding.earlyBird.alreadyOnList')
    } else {
      waitlistError.value = (response as any).error || t('appLanding.earlyBird.error')
    }
  } catch {
    waitlistError.value = t('appLanding.earlyBird.error')
  } finally {
    waitlistLoading.value = false
  }
}

// ===== AUTONOMY SPECTRUM =====
const autonomyModes = ['manual', 'assisted', 'autopilot'] as const
type AutonomyMode = typeof autonomyModes[number]
const selectedAutonomy = ref<AutonomyMode>('assisted')
let autonomyInterval: ReturnType<typeof setInterval> | null = null
let autonomyPauseTimeout: ReturnType<typeof setTimeout> | null = null

function selectAutonomy(mode: AutonomyMode) {
  selectedAutonomy.value = mode
  pauseAutonomyRotation()
}

function startAutonomyRotation() {
  if (autonomyInterval) return
  autonomyInterval = setInterval(() => {
    const currentIndex = autonomyModes.indexOf(selectedAutonomy.value)
    selectedAutonomy.value = autonomyModes[(currentIndex + 1) % autonomyModes.length]
  }, 4000)
}

function stopAutonomyRotation() {
  if (autonomyInterval) {
    clearInterval(autonomyInterval)
    autonomyInterval = null
  }
}

function pauseAutonomyRotation() {
  stopAutonomyRotation()
  if (autonomyPauseTimeout) clearTimeout(autonomyPauseTimeout)
  autonomyPauseTimeout = setTimeout(() => {
    startAutonomyRotation()
  }, 10000)
}

// ===== PLATFORM TABS =====
const platforms = ['facebook', 'instagram', 'linkedin', 'twitter'] as const
type Platform = typeof platforms[number]
const selectedPlatform = ref<Platform>('instagram')

const platformIcons: Record<Platform, string> = {
  facebook: 'facebook',
  instagram: 'photo_camera',
  linkedin: 'work',
  twitter: 'tag'
}

const platformColors: Record<Platform, string> = {
  facebook: '#1877f2',
  instagram: '#E1306C',
  linkedin: '#0a66c2',
  twitter: '#000000'
}

// ===== FEATURES =====
const features = [
  { key: 'aiChat', icon: 'chat' },
  { key: 'smartContent', icon: 'auto_awesome' },
  { key: 'reviewApprove', icon: 'fact_check' },
  { key: 'multiPlatform', icon: 'share' },
  { key: 'brandVoice', icon: 'record_voice_over' },
  { key: 'assetLibrary', icon: 'photo_library' }
]

// ===== SCROLL REVEAL =====
function setupScrollReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed')
          observer.unobserve(entry.target)
        }
      })
    },
    { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
  )

  document.querySelectorAll('.scroll-reveal').forEach((el) => {
    observer.observe(el)
  })

  return observer
}

let scrollObserver: IntersectionObserver | null = null

// ===== LIFECYCLE =====
onMounted(async () => {
  // Set font theme
  document.documentElement.setAttribute('data-font-theme', 'native')

  window.addEventListener('scroll', handleScroll)
  handleScroll()

  startAutonomyRotation()

  // Delay scroll reveal setup to ensure DOM is ready
  requestAnimationFrame(() => {
    scrollObserver = setupScrollReveal()
  })
})

onUnmounted(() => {
  // Restore default font theme
  document.documentElement.removeAttribute('data-font-theme')

  window.removeEventListener('scroll', handleScroll)
  stopAutonomyRotation()
  if (autonomyPauseTimeout) clearTimeout(autonomyPauseTimeout)
  if (scrollObserver) scrollObserver.disconnect()
})
</script>

<template>
  <div class="app-landing">
    <!-- ========== 0. STICKY HEADER ========== -->
    <header class="al-header" :class="{ scrolled: isHeaderScrolled }">
      <div class="al-header-container desktop-header">
        <div class="al-logo">
          <img src="../assets/socialchef_logo.svg" alt="SocialChef" class="al-logo-img" />
          <span class="al-logo-text">SocialChef</span>
        </div>

        <nav class="al-nav">
          <button class="al-nav-link" @click="scrollToSection('features')">
            {{ $t('appLanding.nav.features') }}
          </button>
          <button class="al-nav-link" @click="scrollToSection('platforms')">
            {{ $t('appLanding.nav.platforms') }}
          </button>
          <button class="al-nav-link" @click="scrollToSection('early-bird')">
            {{ $t('appLanding.nav.earlyBird') }}
          </button>
        </nav>

        <div class="al-header-actions">
          <ThemeToggle />
          <BaseButton variant="primary" size="small" @click="scrollToSection('early-bird')">
            {{ $t('appLanding.nav.getEarlyAccess') }}
          </BaseButton>
        </div>
      </div>

      <!-- Mobile Header -->
      <div class="al-mobile-header">
        <div class="al-mobile-pill">
          <div class="al-logo">
            <img src="../assets/socialchef_logo.svg" alt="SocialChef" class="al-logo-img" />
            <span class="al-logo-text">SocialChef</span>
          </div>
          <div class="al-mobile-actions">
            <ThemeToggle />
            <button
              class="al-hamburger"
              :class="{ active: isMobileMenuOpen }"
              @click="toggleMobileMenu"
              :aria-label="isMobileMenuOpen ? 'Close menu' : 'Open menu'"
            >
              <span class="hamburger-line"></span>
              <span class="hamburger-line"></span>
              <span class="hamburger-line"></span>
            </button>
          </div>
        </div>
      </div>

      <!-- Mobile Nav Dropdown -->
      <nav class="al-mobile-nav" :class="{ open: isMobileMenuOpen }">
        <button class="al-mobile-nav-link" @click="scrollToSection('features')">
          {{ $t('appLanding.nav.features') }}
        </button>
        <button class="al-mobile-nav-link" @click="scrollToSection('platforms')">
          {{ $t('appLanding.nav.platforms') }}
        </button>
        <button class="al-mobile-nav-link" @click="scrollToSection('early-bird')">
          {{ $t('appLanding.nav.earlyBird') }}
        </button>
        <div class="al-mobile-nav-divider"></div>
        <BaseButton variant="primary" size="medium" full-width @click="scrollToSection('early-bird'); isMobileMenuOpen = false">
          {{ $t('appLanding.nav.getEarlyAccess') }}
        </BaseButton>
      </nav>
    </header>

    <!-- ========== 1. HERO ========== -->
    <section class="al-hero">
      <!-- Ambient orbs -->
      <div class="al-hero-orb al-hero-orb-1"></div>
      <div class="al-hero-orb al-hero-orb-2"></div>
      <div class="al-hero-orb al-hero-orb-3"></div>
      <div class="al-hero-grain"></div>

      <div class="al-hero-content">
        <div class="al-hero-text">
          <span class="al-hero-badge scroll-reveal">
            <span class="al-badge-dot"></span>
            {{ $t('appLanding.hero.badge') }}
          </span>
          <h1 class="al-hero-headline scroll-reveal scroll-reveal-delay-1">
            {{ $t('appLanding.hero.headline') }}
            <span class="al-accent-text">{{ $t('appLanding.hero.headlineAccent') }}</span>
          </h1>
          <p class="al-hero-sub scroll-reveal scroll-reveal-delay-2">
            {{ $t('appLanding.hero.subheadline') }}
          </p>
          <div class="al-hero-ctas scroll-reveal scroll-reveal-delay-3">
            <BaseButton variant="primary" size="large" @click="scrollToSection('early-bird')">
              {{ $t('appLanding.hero.ctaPrimary') }}
            </BaseButton>
            <button class="al-ghost-btn" @click="scrollToSection('demo')">
              <MaterialIcon icon="play_circle" size="sm" />
              {{ $t('appLanding.hero.ctaSecondary') }}
            </button>
          </div>
        </div>

        <div class="al-hero-phone scroll-reveal scroll-reveal-delay-4">
          <div class="al-phone-glow"></div>
          <div class="al-phone-frame">
            <div class="al-phone-notch"></div>
            <div class="al-phone-screen">
              <!-- Chat UI mockup inside phone -->
              <div class="al-phone-status-bar">
                <span>9:41</span>
                <div class="al-phone-status-icons">
                  <span class="al-signal"></span>
                  <span class="al-wifi"></span>
                  <span class="al-battery"></span>
                </div>
              </div>
              <div class="al-phone-app-header">
                <img src="../assets/socialchef_logo.svg" alt="" class="al-phone-app-logo" />
                <span>SocialChef</span>
              </div>
              <div class="al-phone-chat">
                <div class="al-chat-bubble al-chat-user">
                  Create a post about our weekend sale ✨
                </div>
                <div class="al-chat-bubble al-chat-ai">
                  <div class="al-typing-indicator">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ========== 2. SOCIAL PROOF BAR ========== -->
    <section class="al-social-proof scroll-reveal">
      <div class="al-social-proof-inner">
        <div class="al-proof-platforms">
          <span class="al-proof-label">{{ $t('appLanding.socialProof.platforms') }}</span>
          <div class="al-platform-logos">
            <span class="al-platform-logo al-fb" title="Facebook">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </span>
            <span class="al-platform-logo al-ig" title="Instagram">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
            </span>
            <span class="al-platform-logo al-li" title="LinkedIn">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            </span>
            <span class="al-platform-logo al-tw" title="X">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </span>
          </div>
        </div>
      </div>
    </section>

    <!-- ========== 3. VIDEO DEMO ========== -->
    <section id="demo" class="al-section al-demo">
      <div class="al-section-inner">
        <span class="al-section-eyebrow scroll-reveal">How it works</span>
        <h2 class="al-section-title scroll-reveal">{{ $t('appLanding.demo.title') }}</h2>

        <div class="al-demo-phones">
          <div
            v-for="(step, i) in ['step1', 'step2', 'step3']"
            :key="step"
            class="al-demo-step scroll-reveal"
            :class="[`scroll-reveal-delay-${i + 1}`, { 'al-demo-center': i === 1 }]"
          >
            <div class="al-phone-frame al-phone-small">
              <div class="al-phone-notch"></div>
              <div class="al-phone-screen">
                <div class="al-phone-placeholder">
                  <MaterialIcon
                    :icon="i === 0 ? 'chat' : i === 1 ? 'touch_app' : 'send'"
                    size="xl"
                  />
                  <button class="al-play-overlay">
                    <MaterialIcon icon="play_arrow" size="lg" />
                  </button>
                </div>
              </div>
            </div>
            <div class="al-step-badge">{{ i + 1 }}</div>
            <h3 class="al-step-title">{{ $t(`appLanding.demo.${step}`) }}</h3>
            <p class="al-step-desc">{{ $t(`appLanding.demo.${step}Desc`) }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ========== 4. AUTONOMY SPECTRUM ========== -->
    <section class="al-section al-autonomy">
      <div class="al-autonomy-bg-shape"></div>
      <div class="al-section-inner">
        <span class="al-section-eyebrow scroll-reveal">Your level of control</span>
        <h2 class="al-section-title scroll-reveal">{{ $t('appLanding.autonomy.title') }}</h2>
        <p class="al-section-subtitle scroll-reveal scroll-reveal-delay-1">{{ $t('appLanding.autonomy.subtitle') }}</p>

        <!-- Illustration Card -->
        <div class="al-autonomy-card scroll-reveal scroll-reveal-delay-2">
          <div class="al-autonomy-display">
            <!-- Manual -->
            <Transition name="al-fade" mode="out-in">
              <div v-if="selectedAutonomy === 'manual'" key="manual" class="al-autonomy-scene">
                <div class="al-mock-chat">
                  <div class="al-mock-header">
                    <MaterialIcon icon="chat" size="sm" />
                    <span>AI Chat</span>
                  </div>
                  <div class="al-mock-bubble al-mock-user">
                    {{ $t('appLanding.autonomy.manualChat') }}
                  </div>
                  <div class="al-mock-bubble al-mock-ai">
                    <div class="al-typing-indicator"><span></span><span></span><span></span></div>
                  </div>
                </div>
              </div>

              <!-- Assisted -->
              <div v-else-if="selectedAutonomy === 'assisted'" key="assisted" class="al-autonomy-scene">
                <div class="al-mock-notif">
                  <div class="al-notif-icon">
                    <MaterialIcon icon="notifications" size="md" />
                  </div>
                  <div class="al-notif-content">
                    <strong>SocialChef</strong>
                    <p>{{ $t('appLanding.autonomy.assistedNotif') }}</p>
                  </div>
                  <div class="al-notif-actions">
                    <button class="al-notif-btn al-approve">{{ $t('appLanding.autonomy.assistedApprove') }}</button>
                    <button class="al-notif-btn al-edit">{{ $t('appLanding.autonomy.assistedEdit') }}</button>
                  </div>
                </div>
              </div>

              <!-- Autopilot -->
              <div v-else key="autopilot" class="al-autonomy-scene">
                <div class="al-mock-calendar">
                  <div class="al-mock-header">
                    <MaterialIcon icon="event" size="sm" />
                    <span>Schedule</span>
                  </div>
                  <div class="al-calendar-grid">
                    <div v-for="h in 5" :key="h" class="al-cal-slot" :class="{ filled: h <= 3 }">
                      <span class="al-cal-time">{{ 8 + h * 2 }}:00</span>
                      <span v-if="h <= 3" class="al-cal-post">
                        <MaterialIcon :icon="h === 1 ? 'image' : h === 2 ? 'videocam' : 'article'" size="xs" />
                      </span>
                    </div>
                  </div>
                  <div class="al-calendar-status">
                    <MaterialIcon icon="check_circle" size="xs" />
                    {{ $t('appLanding.autonomy.autopilotStatus') }}
                  </div>
                  <div class="al-calendar-next">
                    <MaterialIcon icon="schedule" size="xs" />
                    {{ $t('appLanding.autonomy.autopilotScheduled') }}
                  </div>
                </div>
              </div>
            </Transition>
          </div>
        </div>

        <!-- Segmented Control -->
        <div class="al-autonomy-control scroll-reveal scroll-reveal-delay-3">
          <div class="al-segment-track">
            <div
              class="al-segment-indicator"
              :style="{ transform: `translateX(${autonomyModes.indexOf(selectedAutonomy) * 100}%)` }"
            ></div>
            <button
              v-for="mode in autonomyModes"
              :key="mode"
              class="al-segment-btn"
              :class="{ active: selectedAutonomy === mode }"
              @click="selectAutonomy(mode)"
            >
              <MaterialIcon
                :icon="mode === 'manual' ? 'edit' : mode === 'assisted' ? 'supervisor_account' : 'rocket_launch'"
                size="sm"
              />
              {{ $t(`appLanding.autonomy.${mode}`) }}
            </button>
          </div>
          <p class="al-autonomy-desc">{{ $t(`appLanding.autonomy.${selectedAutonomy}Desc`) }}</p>
        </div>
      </div>
    </section>

    <!-- ========== 5. PLATFORM PREVIEWS ========== -->
    <section id="platforms" class="al-section al-platforms">
      <div class="al-section-inner">
        <span class="al-section-eyebrow scroll-reveal">Multi-platform</span>
        <h2 class="al-section-title scroll-reveal">{{ $t('appLanding.platformPreviews.title') }}</h2>
        <p class="al-section-subtitle scroll-reveal scroll-reveal-delay-1">{{ $t('appLanding.platformPreviews.subtitle') }}</p>

        <!-- Platform Tabs -->
        <div class="al-platform-tabs scroll-reveal scroll-reveal-delay-2">
          <button
            v-for="p in platforms"
            :key="p"
            class="al-platform-tab"
            :class="{ active: selectedPlatform === p }"
            :style="selectedPlatform === p ? { '--tab-color': platformColors[p] } : {}"
            @click="selectedPlatform = p"
          >
            {{ $t(`appLanding.platformPreviews.${p}`) }}
          </button>
        </div>

        <!-- Phone Preview -->
        <div class="al-platform-preview scroll-reveal scroll-reveal-delay-3">
          <div class="al-phone-frame al-phone-large">
            <div class="al-phone-notch"></div>
            <div class="al-phone-screen">
              <Transition name="al-fade" mode="out-in">
                <div :key="selectedPlatform" class="al-platform-mock">
                  <!-- Platform Header -->
                  <div class="al-platform-mock-header" :style="{ background: platformColors[selectedPlatform] }">
                    <span class="al-platform-mock-name">
                      {{ $t(`appLanding.platformPreviews.${selectedPlatform}`) }}
                    </span>
                  </div>

                  <!-- Post Preview -->
                  <div class="al-post-mock">
                    <div class="al-post-author">
                      <div class="al-post-avatar">SC</div>
                      <div class="al-post-meta">
                        <strong>SocialChef</strong>
                        <span>Just now</span>
                      </div>
                    </div>
                    <div class="al-post-image">
                      <div class="al-post-image-placeholder">
                        <MaterialIcon icon="image" size="2xl" />
                      </div>
                    </div>
                    <div class="al-post-engagement">
                      <span><MaterialIcon icon="thumb_up" size="xs" /> {{ $t('appLanding.platformPreviews.likeCount') }}</span>
                      <span><MaterialIcon icon="comment" size="xs" /> {{ $t('appLanding.platformPreviews.commentCount') }}</span>
                      <span><MaterialIcon icon="share" size="xs" /> {{ $t('appLanding.platformPreviews.shareCount') }}</span>
                    </div>
                  </div>
                </div>
              </Transition>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ========== 6. FEATURES GRID ========== -->
    <section id="features" class="al-section al-features">
      <div class="al-section-inner">
        <span class="al-section-eyebrow scroll-reveal">Capabilities</span>
        <h2 class="al-section-title scroll-reveal">{{ $t('appLanding.features.title') }}</h2>
        <p class="al-section-subtitle scroll-reveal scroll-reveal-delay-1">{{ $t('appLanding.features.subtitle') }}</p>

        <div class="al-features-grid">
          <div
            v-for="(feature, i) in features"
            :key="feature.key"
            class="al-feature-card scroll-reveal"
            :class="`scroll-reveal-delay-${(i % 3) + 1}`"
          >
            <div class="al-feature-icon">
              <MaterialIcon :icon="feature.icon" size="lg" />
            </div>
            <h3 class="al-feature-title">{{ $t(`appLanding.features.${feature.key}.title`) }}</h3>
            <p class="al-feature-desc">{{ $t(`appLanding.features.${feature.key}.description`) }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ========== 7. EARLY BIRD OFFER ========== -->
    <section id="early-bird" class="al-section al-early-bird">
      <div class="al-early-bird-orb"></div>
      <div class="al-section-inner">
        <div class="al-early-bird-card scroll-reveal">
          <div class="al-early-bird-card-inner">
            <div class="al-discount-hero">
              <span class="al-discount-number">{{ $t('appLanding.earlyBird.discount') }}</span>
              <span class="al-discount-suffix">{{ $t('appLanding.earlyBird.discountSuffix') }}</span>
            </div>

            <h2 class="al-early-bird-title">{{ $t('appLanding.earlyBird.title') }}</h2>
            <p class="al-early-bird-desc">{{ $t('appLanding.earlyBird.description') }}</p>

            <div v-if="!waitlistSuccess" class="al-early-bird-form">
              <form @submit.prevent="handleWaitlistSubmit" class="al-form-row">
                <BaseInput
                  v-model="waitlistEmail"
                  type="email"
                  :placeholder="$t('appLanding.earlyBird.inputPlaceholder')"
                  :disabled="waitlistLoading"
                />
                <BaseButton variant="primary" size="medium" type="submit" :loading="waitlistLoading">
                  {{ $t('appLanding.earlyBird.cta') }}
                </BaseButton>
              </form>
              <p v-if="waitlistError" class="al-form-error">{{ waitlistError }}</p>
              <div class="al-form-meta">
                <span class="al-no-cc">
                  <MaterialIcon icon="lock" size="xs" />
                  {{ $t('appLanding.earlyBird.noCreditCard') }}
                </span>
              </div>
            </div>

            <div v-else class="al-early-bird-success">
              <div class="al-success-check">
                <MaterialIcon icon="check_circle" size="2xl" />
              </div>
              <h3>{{ $t('appLanding.earlyBird.successTitle') }}</h3>
              <p>{{ $t('appLanding.earlyBird.successMessage') }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ========== 8. APP STORE PREVIEW ========== -->
    <section class="al-section al-app-stores">
      <div class="al-section-inner">
        <div class="al-stores-row scroll-reveal">
          <!-- Apple App Store -->
          <div class="al-store-badge">
            <div class="al-store-icon">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
            </div>
            <div class="al-store-text">
              <span class="al-store-small">{{ $t('appLanding.appStore.comingSoon') }}</span>
              <span class="al-store-name">{{ $t('appLanding.appStore.appStore') }}</span>
            </div>
          </div>

          <!-- Google Play -->
          <div class="al-store-badge">
            <div class="al-store-icon">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
                <path d="M3.18 23.08c-.34-.2-.58-.56-.58-.96V1.88c0-.4.24-.76.58-.96L13.54 12 3.18 23.08zm1.38-22.2L16.1 10.87l-2.78 2.78L4.56.88zM20.06 10.45c.53.3.84.83.84 1.4v.3c0 .57-.31 1.1-.84 1.4l-3.22 1.86-3.06-3.06 3.06-3.06 3.22 1.16zM4.56 23.12l8.76-8.77 2.78 2.78L4.56 23.12z"/>
              </svg>
            </div>
            <div class="al-store-text">
              <span class="al-store-small">{{ $t('appLanding.appStore.comingSoon') }}</span>
              <span class="al-store-name">{{ $t('appLanding.appStore.googlePlay') }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ========== 9. FINAL CTA ========== -->
    <section class="al-section al-final-cta">
      <div class="al-final-cta-orb"></div>
      <div class="al-section-inner">
        <h2 class="al-final-title scroll-reveal">{{ $t('appLanding.finalCta.title') }}</h2>
        <p class="al-final-sub scroll-reveal scroll-reveal-delay-1">{{ $t('appLanding.finalCta.subtitle') }}</p>
        <div class="scroll-reveal scroll-reveal-delay-2">
          <BaseButton variant="primary" size="large" @click="scrollToSection('early-bird')">
            {{ $t('appLanding.finalCta.cta') }}
          </BaseButton>
        </div>
      </div>
    </section>

    <!-- ========== 10. FOOTER ========== -->
    <footer class="al-footer">
      <div class="al-footer-inner">
        <div class="al-footer-logo">
          <img src="../assets/socialchef_logo.svg" alt="SocialChef" class="al-logo-img" />
          <span class="al-logo-text">SocialChef</span>
        </div>
        <div class="al-footer-links">
          <router-link to="/privacy-policy">{{ $t('appLanding.footer.privacy') }}</router-link>
          <router-link to="/terms">{{ $t('appLanding.footer.terms') }}</router-link>
        </div>
        <p class="al-footer-copy">
          {{ $t('appLanding.footer.copyright', { year: new Date().getFullYear() }) }}
        </p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* =============================================
   APP LANDING VIEW — PREMIUM REDESIGN
   Forest green + bronze + cream brand palette
   ============================================= */

.app-landing {
  --al-max-width: 1200px;
  --al-phone-radius: 40px;
  --al-phone-border: 3px;
  min-height: 100vh;
  min-height: 100dvh;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: var(--font-body);
  overflow-x: hidden;
}

/* ===== SCROLL REVEAL — Cinematic ===== */
.scroll-reveal {
  opacity: 0;
  transform: translateY(48px);
  transition: opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1), transform 0.9s cubic-bezier(0.16, 1, 0.3, 1);
}
.scroll-reveal.revealed {
  opacity: 1;
  transform: translateY(0);
}
.scroll-reveal-delay-1 { transition-delay: 120ms; }
.scroll-reveal-delay-2 { transition-delay: 240ms; }
.scroll-reveal-delay-3 { transition-delay: 360ms; }
.scroll-reveal-delay-4 { transition-delay: 500ms; }
.scroll-reveal-delay-5 { transition-delay: 650ms; }

@media (prefers-reduced-motion: reduce) {
  .scroll-reveal { opacity: 1; transform: none; transition: none; }
}

/* ===== TRANSITIONS ===== */
.al-fade-enter-active,
.al-fade-leave-active {
  transition: opacity 0.35s var(--ease-smooth), transform 0.35s var(--ease-smooth);
}
.al-fade-enter-from { opacity: 0; transform: translateY(16px) scale(0.98); }
.al-fade-leave-to { opacity: 0; transform: translateY(-16px) scale(0.98); }

/* ===== HEADER ===== */
.al-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: var(--z-fixed);
  transition: background 0.4s var(--ease-smooth),
              backdrop-filter 0.4s var(--ease-smooth),
              box-shadow 0.4s var(--ease-smooth);
}

.al-header.scrolled {
  background: var(--glass-bg);
  backdrop-filter: blur(20px) saturate(1.4);
  -webkit-backdrop-filter: blur(20px) saturate(1.4);
  box-shadow: 0 1px 0 var(--glass-border), var(--shadow-sm);
}

.al-header-container {
  max-width: var(--al-max-width);
  margin: 0 auto;
  padding: var(--space-md) var(--space-xl);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.desktop-header { display: flex; }

.al-logo {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.al-logo-img { width: 32px; height: 32px; }

.al-logo-text {
  font-family: var(--font-heading);
  font-weight: var(--font-bold);
  font-size: var(--text-lg);
  color: var(--text-primary);
  letter-spacing: -0.01em;
}

.al-nav {
  display: flex;
  gap: var(--space-xs);
}

.al-nav-link {
  background: none;
  border: none;
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
  cursor: pointer;
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-full);
  transition: all 0.25s var(--ease-smooth);
  letter-spacing: 0.01em;
}
.al-nav-link:hover {
  color: var(--text-primary);
  background: var(--gold-subtle);
}

.al-header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

/* Mobile Header */
.al-mobile-header { display: none; }

.al-mobile-pill {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-sm) var(--space-lg);
}

.al-mobile-actions {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.al-hamburger {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 5px;
  width: 36px;
  height: 36px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
}

.hamburger-line {
  display: block;
  width: 20px;
  height: 2px;
  background: var(--text-primary);
  border-radius: 2px;
  transition: all 0.3s var(--ease-smooth);
}

.al-hamburger.active .hamburger-line:nth-child(1) { transform: rotate(45deg) translate(5px, 5px); }
.al-hamburger.active .hamburger-line:nth-child(2) { opacity: 0; }
.al-hamburger.active .hamburger-line:nth-child(3) { transform: rotate(-45deg) translate(5px, -5px); }

/* Mobile Nav Dropdown */
.al-mobile-nav {
  display: none;
  flex-direction: column;
  padding: 0 var(--space-lg) var(--space-lg);
  gap: var(--space-xs);
}
.al-mobile-nav.open { display: flex; }
.al-mobile-nav-link {
  background: none;
  border: none;
  font-family: var(--font-body);
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
  text-align: left;
  padding: var(--space-md) var(--space-sm);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: all 0.2s var(--ease-smooth);
}
.al-mobile-nav-link:hover { background: var(--gold-subtle); color: var(--text-primary); }
.al-mobile-nav-divider { height: 1px; background: var(--border-color); margin: var(--space-sm) 0; }

@media (max-width: 768px) {
  .desktop-header { display: none; }
  .al-mobile-header { display: block; }
}

/* ===== HERO — Cinematic with ambient orbs ===== */
.al-hero {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  padding: 120px var(--space-xl) var(--space-5xl);
  position: relative;
  overflow: hidden;
}

/* Floating ambient orbs */
.al-hero-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.35;
  pointer-events: none;
  will-change: transform;
}

.al-hero-orb-1 {
  width: 500px;
  height: 500px;
  background: var(--gold-primary);
  top: -10%;
  right: -5%;
  animation: al-orb-drift-1 20s ease-in-out infinite;
}

.al-hero-orb-2 {
  width: 350px;
  height: 350px;
  background: var(--bronze-primary, #8B5A2B);
  bottom: 5%;
  left: -8%;
  animation: al-orb-drift-2 25s ease-in-out infinite;
}

.al-hero-orb-3 {
  width: 250px;
  height: 250px;
  background: var(--gold-light, #2d6b52);
  top: 40%;
  left: 45%;
  animation: al-orb-drift-3 18s ease-in-out infinite;
  opacity: 0.2;
}

@keyframes al-orb-drift-1 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(-40px, 30px) scale(1.05); }
  66% { transform: translate(20px, -20px) scale(0.95); }
}

@keyframes al-orb-drift-2 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -25px) scale(1.08); }
  66% { transform: translate(-20px, 15px) scale(0.92); }
}

@keyframes al-orb-drift-3 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(-30px, 20px) scale(1.1); }
}

/* Subtle grain texture */
.al-hero-grain {
  position: absolute;
  inset: 0;
  opacity: 0.03;
  pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  background-repeat: repeat;
  background-size: 256px 256px;
}

.al-hero-content {
  max-width: var(--al-max-width);
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: var(--space-5xl);
  align-items: center;
  width: 100%;
  position: relative;
  z-index: 1;
}

/* Badge with pulsing dot */
.al-hero-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  background: var(--glass-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border);
  color: var(--gold-primary);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  padding: var(--space-sm) var(--space-lg);
  border-radius: var(--radius-full);
  margin-bottom: var(--space-2xl);
  letter-spacing: 0.02em;
}

.al-badge-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--gold-primary);
  animation: al-pulse-dot 2s ease-in-out infinite;
}

@keyframes al-pulse-dot {
  0%, 100% { opacity: 1; box-shadow: 0 0 0 0 var(--gold-primary); }
  50% { opacity: 0.7; box-shadow: 0 0 0 6px transparent; }
}

.al-hero-headline {
  font-family: var(--font-heading);
  font-size: clamp(2.75rem, 5.5vw, 4.25rem);
  font-weight: var(--font-bold);
  line-height: 1.1;
  color: var(--text-primary);
  margin: 0 0 var(--space-xl);
  letter-spacing: -0.02em;
}

.al-accent-text {
  display: block;
  background: var(--gradient-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.al-hero-sub {
  font-size: var(--text-lg);
  color: var(--text-secondary);
  line-height: 1.7;
  margin: 0 0 var(--space-3xl);
  max-width: 480px;
}

.al-hero-ctas {
  display: flex;
  gap: var(--space-lg);
  align-items: center;
  flex-wrap: wrap;
}

.al-ghost-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  background: var(--glass-bg);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid var(--glass-border);
  color: var(--text-secondary);
  font-family: var(--font-body);
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  padding: var(--space-md) var(--space-xl);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all 0.3s var(--ease-smooth);
}
.al-ghost-btn:hover {
  border-color: var(--border-hover);
  color: var(--text-primary);
  background: var(--glass-intense-bg);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

/* Phone with glow */
.al-hero-phone {
  display: flex;
  justify-content: center;
  perspective: 1200px;
  position: relative;
}

.al-phone-glow {
  position: absolute;
  width: 320px;
  height: 200px;
  bottom: -30px;
  left: 50%;
  transform: translateX(-50%);
  background: radial-gradient(ellipse, var(--gold-primary), transparent 70%);
  opacity: 0.25;
  filter: blur(40px);
  pointer-events: none;
  animation: al-glow-pulse 4s ease-in-out infinite;
}

@keyframes al-glow-pulse {
  0%, 100% { opacity: 0.2; transform: translateX(-50%) scale(1); }
  50% { opacity: 0.35; transform: translateX(-50%) scale(1.05); }
}

.al-phone-frame {
  width: 280px;
  height: 580px;
  border-radius: var(--al-phone-radius);
  border: var(--al-phone-border) solid var(--text-muted);
  background: var(--bg-secondary);
  position: relative;
  overflow: hidden;
  box-shadow:
    var(--shadow-xl),
    0 0 0 1px rgba(0,0,0,0.03),
    0 30px 60px -12px rgba(0,0,0,0.15);
}

.al-hero-phone .al-phone-frame {
  transform: rotateY(-6deg) rotateX(3deg);
  animation: al-float 8s ease-in-out infinite;
}

@keyframes al-float {
  0%, 100% { transform: rotateY(-6deg) rotateX(3deg) translateY(0); }
  50% { transform: rotateY(-6deg) rotateX(3deg) translateY(-16px); }
}

.al-phone-notch {
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 100px;
  height: 28px;
  background: var(--bg-primary);
  border-radius: 0 0 16px 16px;
  z-index: 2;
}

.al-phone-screen {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.al-phone-status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 24px 4px;
  font-size: 12px;
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  z-index: 3;
}

.al-phone-status-icons { display: flex; gap: 4px; align-items: center; }

.al-signal, .al-wifi, .al-battery {
  display: block; width: 16px; height: 10px;
  background: var(--text-muted); border-radius: 2px;
}
.al-battery { width: 22px; border-radius: 3px; }

.al-phone-app-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-lg);
  font-weight: var(--font-semibold);
  font-size: var(--text-sm);
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-color);
}

.al-phone-app-logo { width: 18px; height: 18px; }

.al-phone-chat {
  flex: 1;
  padding: var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  justify-content: flex-end;
}

.al-chat-bubble {
  padding: var(--space-md) var(--space-lg);
  border-radius: 18px;
  font-size: 13px;
  line-height: 1.4;
  max-width: 85%;
  animation: al-bubble-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.al-chat-user {
  background: var(--gradient-gold);
  color: var(--text-on-gold);
  align-self: flex-end;
  border-bottom-right-radius: 6px;
  animation-delay: 1.2s;
}

.al-chat-ai {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  align-self: flex-start;
  border-bottom-left-radius: 6px;
  animation-delay: 2.2s;
}

@keyframes al-bubble-in {
  from { opacity: 0; transform: translateY(16px) scale(0.92); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.al-typing-indicator { display: flex; gap: 4px; padding: 4px 0; }
.al-typing-indicator span {
  width: 7px; height: 7px; border-radius: 50%;
  background: var(--text-muted);
  animation: al-typing 1.4s ease-in-out infinite;
}
.al-typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
.al-typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

@keyframes al-typing {
  0%, 100% { opacity: 0.3; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1); }
}

/* Phone placeholder */
.al-phone-placeholder {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gradient-subtle);
  color: var(--text-muted);
  position: relative;
}

.al-play-overlay {
  position: absolute;
  width: 56px; height: 56px;
  border-radius: 50%;
  background: var(--glass-bg);
  backdrop-filter: blur(var(--blur-sm));
  -webkit-backdrop-filter: blur(var(--blur-sm));
  border: 1px solid var(--glass-border);
  color: var(--text-primary);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  transition: all 0.3s var(--ease-smooth);
}
.al-play-overlay:hover {
  background: var(--glass-intense-bg);
  transform: scale(1.12);
  box-shadow: var(--shadow-lg);
}

/* Phone sizes */
.al-phone-small { width: 220px; height: 440px; }
.al-phone-large { width: 300px; height: 620px; margin: 0 auto; }

@media (max-width: 768px) {
  .al-hero {
    min-height: auto;
    padding: 100px var(--space-lg) var(--space-3xl);
  }
  .al-hero-content {
    grid-template-columns: 1fr;
    gap: var(--space-3xl);
    text-align: center;
  }
  .al-hero-sub { max-width: none; }
  .al-hero-ctas { justify-content: center; }
  .al-hero-phone { order: -1; }
  .al-hero-phone .al-phone-frame {
    width: 240px; height: 480px;
    transform: none;
    animation: al-float-mobile 6s ease-in-out infinite;
  }
  .al-hero-orb-1 { width: 300px; height: 300px; }
  .al-hero-orb-2 { width: 200px; height: 200px; }
  .al-hero-orb-3 { display: none; }
  @keyframes al-float-mobile {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
}

/* ===== SOCIAL PROOF ===== */
.al-social-proof {
  border-top: 1px solid var(--glass-border);
  border-bottom: 1px solid var(--glass-border);
  background: var(--glass-bg);
  backdrop-filter: blur(var(--blur-sm));
  -webkit-backdrop-filter: blur(var(--blur-sm));
}

.al-social-proof-inner {
  max-width: var(--al-max-width);
  margin: 0 auto;
  padding: var(--space-xl);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-xl);
}

.al-proof-platforms { display: flex; align-items: center; gap: var(--space-md); }
.al-proof-label {
  font-size: var(--text-sm);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: var(--font-medium);
}

.al-platform-logos { display: flex; gap: var(--space-sm); }

.al-platform-logo {
  width: 32px; height: 32px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: white;
  transition: transform 0.3s var(--ease-smooth), box-shadow 0.3s var(--ease-smooth);
}
.al-platform-logo:hover {
  transform: translateY(-2px) scale(1.1);
  box-shadow: var(--shadow-md);
}
.al-fb { background: #1877f2; }
.al-ig { background: linear-gradient(135deg, #f58529, #dd2a7b, #8134af); }
.al-li { background: #0a66c2; }
.al-tw { background: #000; }

@media (max-width: 768px) {
  .al-social-proof-inner { flex-direction: column; gap: var(--space-md); text-align: center; }
}

/* ===== SECTIONS ===== */
.al-section {
  padding: 100px var(--space-xl);
  position: relative;
}
.al-section-inner {
  max-width: var(--al-max-width);
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.al-section-eyebrow {
  display: block;
  text-align: center;
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--gold-primary);
  margin-bottom: var(--space-lg);
}

.al-section-title {
  font-family: var(--font-heading);
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: var(--font-bold);
  text-align: center;
  margin: 0 0 var(--space-lg);
  color: var(--text-primary);
  letter-spacing: -0.02em;
  line-height: 1.15;
}
.al-section-subtitle {
  text-align: center;
  color: var(--text-secondary);
  font-size: var(--text-lg);
  max-width: 560px;
  margin: 0 auto var(--space-4xl);
  line-height: 1.7;
}

/* ===== DEMO ===== */
.al-demo-phones {
  display: flex;
  justify-content: center;
  gap: var(--space-3xl);
  align-items: stretch;
}

.al-demo-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  max-width: 240px;
}

.al-step-badge {
  width: 36px; height: 36px;
  border-radius: 50%;
  background: var(--gradient-gold);
  color: var(--text-on-gold);
  font-weight: var(--font-bold);
  font-size: var(--text-sm);
  display: flex; align-items: center; justify-content: center;
  margin-top: var(--space-xl);
  box-shadow: 0 4px 16px rgba(26, 77, 58, 0.2);
}

.al-step-title {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  margin: var(--space-md) 0 var(--space-xs);
  letter-spacing: -0.01em;
}

.al-step-desc {
  font-size: var(--text-sm);
  color: var(--text-muted);
  line-height: var(--leading-relaxed);
  margin: 0;
}

@media (max-width: 768px) {
  .al-demo-phones {
    flex-direction: row; overflow-x: auto;
    scroll-snap-type: x mandatory;
    gap: var(--space-lg); padding: 0 var(--space-lg);
    -webkit-overflow-scrolling: touch;
  }
  .al-demo-step { scroll-snap-align: center; min-width: 220px; flex-shrink: 0; }
}

/* ===== AUTONOMY ===== */
.al-autonomy {
  background: var(--bg-tertiary);
  overflow: hidden;
}

.al-autonomy-bg-shape {
  position: absolute;
  width: 600px;
  height: 600px;
  border-radius: 50%;
  background: var(--gold-primary);
  opacity: 0.04;
  filter: blur(100px);
  top: -200px;
  right: -200px;
  pointer-events: none;
}

.al-autonomy-card {
  max-width: 500px;
  margin: 0 auto var(--space-2xl);
  border-radius: var(--radius-2xl);
  background: var(--glass-bg);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--glass-border);
  box-shadow: var(--shadow-lg), 0 0 0 1px rgba(0,0,0,0.02);
  overflow: hidden;
}

.al-autonomy-display {
  min-height: 340px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-2xl);
}

.al-autonomy-scene { width: 100%; }
.al-mock-chat, .al-mock-calendar { width: 100%; }

.al-mock-header {
  display: flex; align-items: center; gap: var(--space-sm);
  padding-bottom: var(--space-md);
  border-bottom: 1px solid var(--border-color);
  margin-bottom: var(--space-lg);
  font-weight: var(--font-semibold);
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.al-mock-bubble {
  padding: var(--space-md) var(--space-lg);
  border-radius: 16px;
  font-size: var(--text-sm);
  line-height: 1.4;
  margin-bottom: var(--space-sm);
  max-width: 80%;
}
.al-mock-user {
  background: var(--gradient-gold);
  color: var(--text-on-gold);
  margin-left: auto;
  border-bottom-right-radius: 4px;
}
.al-mock-ai { background: var(--bg-tertiary); border-bottom-left-radius: 4px; }

.al-mock-notif {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
  border: 1px solid var(--border-color);
}

.al-notif-icon {
  width: 48px; height: 48px;
  border-radius: 50%;
  background: var(--gold-subtle);
  color: var(--gold-primary);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: var(--space-md);
}

.al-notif-content strong { display: block; margin-bottom: var(--space-xs); font-size: var(--text-sm); }
.al-notif-content p { font-size: var(--text-sm); color: var(--text-secondary); margin: 0 0 var(--space-lg); }

.al-notif-actions { display: flex; gap: var(--space-md); }

.al-notif-btn {
  flex: 1;
  padding: var(--space-sm) var(--space-lg);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: all 0.2s var(--ease-smooth);
}
.al-approve { background: var(--gradient-gold); color: var(--text-on-gold); border-color: transparent; }
.al-edit { background: transparent; color: var(--text-secondary); }

.al-calendar-grid { display: flex; flex-direction: column; gap: var(--space-sm); margin-bottom: var(--space-lg); }

.al-cal-slot {
  display: flex; align-items: center; gap: var(--space-md);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-color);
  font-size: var(--text-sm);
  transition: all 0.2s var(--ease-smooth);
}
.al-cal-slot.filled { background: var(--gold-subtle); border-color: var(--glass-border); }

.al-cal-time { font-weight: var(--font-medium); color: var(--text-muted); min-width: 45px; font-size: 12px; }
.al-cal-post { color: var(--gold-primary); display: flex; align-items: center; }

.al-calendar-status {
  display: flex; align-items: center; gap: var(--space-sm);
  font-size: var(--text-sm); font-weight: var(--font-medium);
  color: var(--success-text); margin-bottom: var(--space-xs);
}

.al-calendar-next {
  display: flex; align-items: center; gap: var(--space-sm);
  font-size: 12px; color: var(--text-muted);
}

/* Segmented Control */
.al-autonomy-control { max-width: 500px; margin: 0 auto; text-align: center; }

.al-segment-track {
  display: flex; position: relative;
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  padding: 4px;
}

.al-segment-indicator {
  position: absolute;
  top: 4px; left: 4px;
  width: calc(33.333% - 2.66px);
  height: calc(100% - 8px);
  background: var(--gradient-gold);
  border-radius: var(--radius-md);
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  z-index: 0;
  box-shadow: 0 2px 8px rgba(26, 77, 58, 0.15);
}

.al-segment-btn {
  flex: 1;
  display: flex; align-items: center; justify-content: center;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-sm);
  background: none; border: none;
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
  cursor: pointer;
  position: relative; z-index: 1;
  transition: color 0.3s var(--ease-smooth);
  border-radius: var(--radius-md);
}
.al-segment-btn.active { color: var(--text-on-gold); }

.al-autonomy-desc {
  margin-top: var(--space-xl);
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: 1.7;
}

/* ===== PLATFORM PREVIEWS ===== */
.al-platform-tabs {
  display: flex; justify-content: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-3xl);
  flex-wrap: wrap;
}

.al-platform-tab {
  padding: var(--space-sm) var(--space-xl);
  border-radius: var(--radius-full);
  border: 1px solid var(--border-color);
  background: transparent;
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.3s var(--ease-smooth);
  letter-spacing: 0.01em;
}
.al-platform-tab.active {
  background: var(--tab-color, var(--gold-primary));
  color: white;
  border-color: transparent;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  transform: scale(1.02);
}
.al-platform-tab:not(.active):hover { border-color: var(--border-hover); color: var(--text-primary); }

.al-platform-preview { display: flex; justify-content: center; }

.al-platform-mock { height: 100%; display: flex; flex-direction: column; }

.al-platform-mock-header {
  padding: var(--space-lg) var(--space-lg) var(--space-md);
  padding-top: 44px;
}

.al-platform-mock-name { font-weight: var(--font-bold); font-size: var(--text-base); color: white; }

.al-post-mock { flex: 1; padding: var(--space-lg); background: var(--bg-secondary); }

.al-post-author { display: flex; align-items: center; gap: var(--space-md); margin-bottom: var(--space-lg); }

.al-post-avatar {
  width: 40px; height: 40px;
  border-radius: 50%;
  background: var(--gradient-gold);
  color: var(--text-on-gold);
  display: flex; align-items: center; justify-content: center;
  font-weight: var(--font-bold); font-size: var(--text-sm);
}

.al-post-meta { display: flex; flex-direction: column; }
.al-post-meta strong { font-size: var(--text-sm); }
.al-post-meta span { font-size: 11px; color: var(--text-muted); }

.al-post-image { border-radius: var(--radius-md); overflow: hidden; margin-bottom: var(--space-lg); }

.al-post-image-placeholder {
  width: 100%; aspect-ratio: 1;
  background: var(--gradient-subtle);
  display: flex; align-items: center; justify-content: center;
  color: var(--text-disabled);
}

.al-post-engagement { display: flex; gap: var(--space-lg); font-size: 12px; color: var(--text-muted); }
.al-post-engagement span { display: flex; align-items: center; gap: 4px; }

/* ===== FEATURES GRID — Glass cards with hover glow ===== */
.al-features { background: var(--bg-primary); }

.al-features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-lg);
}

.al-feature-card {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--blur-sm));
  -webkit-backdrop-filter: blur(var(--blur-sm));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  padding: var(--space-2xl) var(--space-xl);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  overflow: hidden;
}

.al-feature-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(135deg, var(--gold-primary), transparent 50%);
  opacity: 0;
  transition: opacity 0.4s var(--ease-smooth);
  z-index: 0;
  pointer-events: none;
}

.al-feature-card:hover {
  transform: translateY(-6px);
  box-shadow: var(--shadow-xl);
  border-color: transparent;
}

.al-feature-card:hover::before {
  opacity: 0.06;
}

.al-feature-icon {
  width: 56px; height: 56px;
  border-radius: var(--radius-lg);
  background: var(--gold-subtle);
  color: var(--gold-primary);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: var(--space-xl);
  position: relative;
  z-index: 1;
  transition: all 0.3s var(--ease-smooth);
}

.al-feature-card:hover .al-feature-icon {
  background: var(--gradient-gold);
  color: var(--text-on-gold);
  box-shadow: 0 4px 16px rgba(26, 77, 58, 0.2);
}

.al-feature-title {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  margin: 0 0 var(--space-sm);
  position: relative;
  z-index: 1;
  letter-spacing: -0.01em;
}

.al-feature-desc {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: 1.7;
  margin: 0;
  position: relative;
  z-index: 1;
}

@media (max-width: 1024px) { .al-features-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 640px) { .al-features-grid { grid-template-columns: 1fr; } }

/* ===== EARLY BIRD — Animated gradient border ===== */
.al-early-bird {
  background: var(--bg-tertiary);
  overflow: hidden;
  position: relative;
}

.al-early-bird-orb {
  position: absolute;
  width: 400px;
  height: 400px;
  border-radius: 50%;
  background: var(--gold-primary);
  opacity: 0.06;
  filter: blur(80px);
  bottom: -100px;
  left: 50%;
  transform: translateX(-50%);
  pointer-events: none;
}

.al-early-bird-card {
  max-width: 640px;
  margin: 0 auto;
  border-radius: var(--radius-2xl);
  padding: 2px;
  background: linear-gradient(135deg, var(--gold-primary), var(--bronze-primary, #8B5A2B), var(--gold-primary));
  background-size: 200% 200%;
  animation: al-gradient-rotate 6s ease-in-out infinite;
  position: relative;
}

@keyframes al-gradient-rotate {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.al-early-bird-card-inner {
  background: var(--glass-intense-bg);
  backdrop-filter: blur(var(--blur-xl));
  -webkit-backdrop-filter: blur(var(--blur-xl));
  border-radius: calc(var(--radius-2xl) - 2px);
  padding: var(--space-4xl) var(--space-3xl);
  text-align: center;
}

.al-discount-hero { margin-bottom: var(--space-xl); }

.al-discount-number {
  font-family: var(--font-heading);
  font-size: clamp(5rem, 12vw, 9rem);
  font-weight: var(--font-bold);
  background: var(--gradient-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
  display: block;
  letter-spacing: -0.04em;
}

.al-discount-suffix {
  font-size: var(--text-xl);
  color: var(--text-secondary);
  font-weight: var(--font-medium);
  letter-spacing: 0.02em;
}

.al-early-bird-title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  margin: 0 0 var(--space-md);
  letter-spacing: -0.01em;
}

.al-early-bird-desc {
  color: var(--text-secondary);
  font-size: var(--text-base);
  line-height: 1.7;
  margin: 0 0 var(--space-2xl);
}

.al-form-row { display: flex; gap: var(--space-md); margin-bottom: var(--space-md); }
.al-form-row > :first-child { flex: 1; }
.al-form-error { color: var(--error-text); font-size: var(--text-sm); margin: 0 0 var(--space-md); }
.al-form-meta { display: flex; justify-content: center; gap: var(--space-xl); flex-wrap: wrap; }

.al-no-cc {
  display: flex; align-items: center; gap: var(--space-xs);
  font-size: var(--text-sm); color: var(--text-muted);
}

/* Success state */
.al-early-bird-success { padding: var(--space-xl) 0; }
.al-success-check { color: var(--success-text); margin-bottom: var(--space-lg); }
.al-early-bird-success h3 { font-family: var(--font-heading); font-size: var(--text-2xl); margin: 0 0 var(--space-sm); }
.al-early-bird-success p { color: var(--text-secondary); margin: 0; }

@media (max-width: 640px) {
  .al-early-bird-card-inner { padding: var(--space-2xl) var(--space-xl); }
  .al-form-row { flex-direction: column; }
}

/* ===== APP STORES ===== */
.al-app-stores { padding: var(--space-4xl) var(--space-xl); }

.al-stores-row { display: flex; justify-content: center; gap: var(--space-xl); flex-wrap: wrap; }

.al-store-badge {
  display: flex; align-items: center; gap: var(--space-lg);
  padding: var(--space-lg) var(--space-2xl);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  opacity: 0.7;
  cursor: default;
  transition: all 0.3s var(--ease-smooth);
}
.al-store-badge:hover { opacity: 0.85; transform: translateY(-2px); }

.al-store-icon { color: var(--text-primary); }
.al-store-text { display: flex; flex-direction: column; }
.al-store-small { font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
.al-store-name { font-size: var(--text-lg); font-weight: var(--font-semibold); }

/* ===== FINAL CTA ===== */
.al-final-cta {
  padding: 140px var(--space-xl);
  text-align: center;
  position: relative;
  overflow: hidden;
}

.al-final-cta-orb {
  position: absolute;
  width: 500px; height: 500px;
  border-radius: 50%;
  background: var(--gold-primary);
  opacity: 0.05;
  filter: blur(100px);
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.al-final-title {
  font-family: var(--font-heading);
  font-size: clamp(2.25rem, 4.5vw, 3.5rem);
  font-weight: var(--font-bold);
  margin: 0 0 var(--space-lg);
  letter-spacing: -0.02em;
  line-height: 1.1;
}

.al-final-sub {
  font-size: var(--text-lg);
  color: var(--text-secondary);
  margin: 0 0 var(--space-3xl);
  line-height: 1.7;
}

/* ===== FOOTER ===== */
.al-footer {
  border-top: 1px solid var(--border-color);
  padding: var(--space-3xl) var(--space-xl);
}

.al-footer-inner {
  max-width: var(--al-max-width);
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-lg);
}

.al-footer-logo { display: flex; align-items: center; gap: var(--space-sm); }

.al-footer-links { display: flex; gap: var(--space-xl); }
.al-footer-links a {
  color: var(--text-muted);
  text-decoration: none;
  font-size: var(--text-sm);
  transition: color 0.2s var(--ease-smooth);
}
.al-footer-links a:hover { color: var(--text-primary); }

.al-footer-copy { font-size: var(--text-sm); color: var(--text-muted); margin: 0; }

@media (max-width: 640px) {
  .al-footer-inner { flex-direction: column; text-align: center; }
}
</style>

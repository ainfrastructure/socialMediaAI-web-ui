<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMagneticButton } from '@/composables/useMagneticButton'

const { t } = useI18n()

const isScrolled = ref(false)
const isMobileMenuOpen = ref(false)
const navCta = ref<HTMLElement | null>(null)

useMagneticButton(navCta, 0.2)

function handleScroll() {
  isScrolled.value = window.scrollY > 50
}

function scrollToSection(sectionId: string) {
  const el = document.getElementById(sectionId)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' })
    isMobileMenuOpen.value = false
  }
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  handleScroll()
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <header class="lp-nav" :class="{ scrolled: isScrolled }">
    <!-- Desktop -->
    <div class="lp-nav-inner lp-nav-desktop">
      <div class="lp-nav-logo">
        <img src="/mascot/socialchef_wave.png" alt="SocialChef" class="lp-logo-img" />
        <span class="lp-logo-text">SocialChef</span>
      </div>

      <nav class="lp-nav-links">
        <button class="lp-nav-link" @click="scrollToSection('lp-features')">
          {{ t('appLanding.nav.features') }}
        </button>
        <button class="lp-nav-link" @click="scrollToSection('lp-pricing')">
          {{ t('appLanding.nav.pricing') }}
        </button>
        <button class="lp-nav-link" @click="scrollToSection('lp-how-it-works')">
          {{ t('appLanding.nav.howItWorks') }}
        </button>
      </nav>

      <button ref="navCta" class="lp-nav-cta" @click="scrollToSection('lp-final-cta')">
        {{ t('appLanding.nav.getEarlyAccess') }}
      </button>
    </div>

    <!-- Mobile -->
    <div class="lp-nav-inner lp-nav-mobile">
      <div class="lp-nav-logo">
        <img src="/mascot/socialchef_wave.png" alt="SocialChef" class="lp-logo-img" />
        <span class="lp-logo-text">SocialChef</span>
      </div>

      <button
        class="lp-hamburger"
        :class="{ active: isMobileMenuOpen }"
        :aria-label="isMobileMenuOpen ? 'Close menu' : 'Open menu'"
        @click="isMobileMenuOpen = !isMobileMenuOpen"
      >
        <span /><span /><span />
      </button>
    </div>

    <!-- Mobile dropdown -->
    <nav class="lp-mobile-dropdown" :class="{ open: isMobileMenuOpen }">
      <button class="lp-mobile-link" @click="scrollToSection('lp-features')">
        {{ t('appLanding.nav.features') }}
      </button>
      <button class="lp-mobile-link" @click="scrollToSection('lp-pricing')">
        {{ t('appLanding.nav.pricing') }}
      </button>
      <button class="lp-mobile-link" @click="scrollToSection('lp-how-it-works')">
        {{ t('appLanding.nav.howItWorks') }}
      </button>
      <div class="lp-mobile-divider" />
      <button class="lp-mobile-cta" @click="scrollToSection('lp-final-cta')">
        {{ t('appLanding.nav.getEarlyAccess') }}
      </button>
    </nav>
  </header>
</template>

<style scoped>
.lp-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: var(--z-fixed);
  transition: background 0.4s ease, backdrop-filter 0.4s ease, box-shadow 0.4s ease;
}

.lp-nav.scrolled {
  background: var(--lp-nav-scrolled-bg);
  backdrop-filter: blur(20px) saturate(1.4);
  -webkit-backdrop-filter: blur(20px) saturate(1.4);
  box-shadow: 0 1px 0 var(--lp-border);
}

.lp-nav-inner {
  max-width: var(--lp-max-width);
  margin: 0 auto;
  padding: var(--space-md) var(--space-xl);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.lp-nav-desktop { display: flex; }
.lp-nav-mobile { display: none; }

.lp-nav-logo {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.lp-logo-img {
  width: 36px;
  height: 36px;
  object-fit: contain;
}

.lp-logo-text {
  font-family: var(--font-heading);
  font-weight: var(--font-bold);
  font-size: var(--text-lg);
  color: var(--lp-text-primary);
  letter-spacing: -0.01em;
}

.lp-nav-links {
  display: flex;
  gap: var(--space-xs);
}

.lp-nav-link {
  background: none;
  border: none;
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--lp-text-secondary);
  cursor: pointer;
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-full);
  transition: color 0.25s ease, background 0.25s ease;
}

.lp-nav-link:hover {
  color: var(--lp-text-primary);
  background: var(--lp-hover-overlay);
}

.lp-nav-cta {
  background: var(--lp-accent-orange);
  color: #fff;
  border: none;
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  padding: var(--space-sm) var(--space-xl);
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: background 0.25s ease, box-shadow 0.25s ease;
}

.lp-nav-cta:hover {
  background: var(--lp-accent-orange-hover);
  box-shadow: 0 0 20px var(--lp-accent-orange-glow);
}

/* Shimmer sweep on CTA */
.lp-nav-cta::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(
    105deg,
    transparent 40%,
    rgba(255, 255, 255, 0.2) 50%,
    transparent 60%
  );
  background-size: 200% 100%;
  animation: cta-shimmer 3s ease-in-out infinite;
  pointer-events: none;
}

.lp-nav-cta {
  position: relative;
  overflow: hidden;
}

@keyframes cta-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Hamburger */
.lp-hamburger {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 5px;
  width: 44px;
  height: 44px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 10px;
}

.lp-hamburger span {
  display: block;
  width: 20px;
  height: 2px;
  background: var(--lp-text-primary);
  border-radius: 2px;
  transition: all 0.3s ease;
}

.lp-hamburger.active span:nth-child(1) { transform: rotate(45deg) translate(5px, 5px); }
.lp-hamburger.active span:nth-child(2) { opacity: 0; }
.lp-hamburger.active span:nth-child(3) { transform: rotate(-45deg) translate(5px, -5px); }

/* Mobile dropdown */
.lp-mobile-dropdown {
  display: none;
  flex-direction: column;
  padding: 0 var(--space-xl) var(--space-xl);
  gap: var(--space-xs);
  background: var(--lp-nav-mobile-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.lp-mobile-dropdown.open { display: flex; }

.lp-mobile-link {
  background: none;
  border: none;
  font-family: var(--font-body);
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  color: var(--lp-text-secondary);
  text-align: left;
  padding: var(--space-md) var(--space-sm);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: color 0.2s ease, background 0.2s ease;
}

.lp-mobile-link:hover {
  color: var(--lp-text-primary);
  background: var(--lp-hover-overlay);
}

.lp-mobile-divider {
  height: 1px;
  background: var(--lp-border);
  margin: var(--space-sm) 0;
}

.lp-mobile-cta {
  background: var(--lp-accent-orange);
  color: #fff;
  border: none;
  font-family: var(--font-body);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  padding: var(--space-md) var(--space-xl);
  border-radius: var(--radius-lg);
  cursor: pointer;
  text-align: center;
  transition: background 0.25s ease;
}

.lp-mobile-cta:hover {
  background: var(--lp-accent-orange-hover);
}

@media (max-width: 768px) {
  .lp-nav-desktop { display: none; }
  .lp-nav-mobile { display: flex; }
}

@media (prefers-reduced-motion: reduce) {
  .lp-nav { transition: none; }
  .lp-hamburger span { transition: none; }
}
</style>

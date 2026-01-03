<template>
  <div class="language-selector" ref="selectorContainer">
    <!-- Language Button -->
    <button @click="toggleDropdown" class="language-button" :aria-label="$t('languages.selectCountry')">
      <span class="flag">{{ currentDomainFlag }}</span>
      <span v-if="localeStore.isDevAccess" class="currency-badge">{{ localeStore.currentCurrency }}</span>
      <span class="chevron" :class="{ open: isOpen }">▼</span>
    </button>

    <!-- Dropdown Menu - Desktop (inline) -->
    <Transition name="dropdown">
      <div v-if="isOpen && !isMobile" class="dropdown-menu">
        <!-- Header -->
        <div class="dropdown-header">
          <span class="header-title">{{ $t('languages.selectCountry') }}</span>
          <button @click="closeDropdown" class="close-button" aria-label="Close">
            <span>×</span>
          </button>
        </div>

        <!-- Language Grid -->
        <div class="language-grid">
          <button
            v-for="item in selectableDomains"
            :key="item.domain"
            @click="selectDomain(item.domain)"
            class="language-card"
            :class="{ active: isCurrentDomain(item.domain) }"
          >
            <span class="card-flag">{{ item.flag }}</span>
            <span class="card-name">{{ item.name }}</span>
            <span v-if="isCurrentDomain(item.domain)" class="card-check">✓</span>
          </button>
        </div>


        <!-- Currency Section (dev access only) -->
        <template v-if="localeStore.isDevAccess">
          <div class="dropdown-divider"></div>
          <div class="dropdown-section-label">{{ $t('languages.selectCurrency') }}</div>
          <div class="currency-grid">
            <button
              v-for="curr in localeStore.availableCurrencies"
              :key="curr"
              @click="selectCurrency(curr)"
              class="currency-card"
              :class="{ active: localeStore.currentCurrency === curr }"
            >
              <span class="currency-symbol">{{ localeStore.getCurrencySymbol(curr) }}</span>
              <span class="currency-code">{{ curr }}</span>
            </button>
          </div>
        </template>
      </div>
    </Transition>

    <!-- Dropdown Menu - Mobile (teleported to body) -->
    <Teleport to="body">
      <Transition name="mobile-dropdown">
        <div v-if="isOpen && isMobile" class="mobile-dropdown-overlay" @click.self="closeDropdown">
          <div class="mobile-dropdown-menu">
            <!-- Header -->
            <div class="dropdown-header">
              <span class="header-title">{{ $t('languages.selectCountry') }}</span>
              <button @click="closeDropdown" class="close-button" aria-label="Close">
                <span>×</span>
              </button>
            </div>

            <!-- Language Grid -->
            <div class="language-grid">
              <button
                v-for="item in selectableDomains"
                :key="item.domain"
                @click="selectDomain(item.domain)"
                class="language-card"
                :class="{ active: isCurrentDomain(item.domain) }"
              >
                <span class="card-flag">{{ item.flag }}</span>
                <span class="card-name">{{ item.name }}</span>
                <span v-if="isCurrentDomain(item.domain)" class="card-check">✓</span>
              </button>
            </div>

            <!-- Currency Section (dev access only) -->
            <template v-if="localeStore.isDevAccess">
              <div class="dropdown-divider"></div>
              <div class="dropdown-section-label">{{ $t('languages.selectCurrency') }}</div>
              <div class="currency-grid">
                <button
                  v-for="curr in localeStore.availableCurrencies"
                  :key="curr"
                  @click="selectCurrency(curr)"
                  class="currency-card"
                  :class="{ active: localeStore.currentCurrency === curr }"
                >
                  <span class="currency-symbol">{{ localeStore.getCurrencySymbol(curr) }}</span>
                  <span class="currency-code">{{ curr }}</span>
                </button>
              </div>
            </template>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLocaleStore, type Currency } from '@/stores/locale'
import { useDomain } from '@/composables/useDomain'
import { SELECTABLE_DOMAINS, type SelectableDomain } from '@/config/domains'

const { locale } = useI18n()
const localeStore = useLocaleStore()
const { domainConfig } = useDomain()

// Check localhost directly from window to avoid initialization timing issues
const isLocalhost = computed(() => {
  if (typeof window === 'undefined') return false
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
})

const isOpen = ref(false)
const selectorContainer = ref<HTMLElement | null>(null)
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1024)

const isMobile = computed(() => windowWidth.value <= 768)

// All selectable domains
const selectableDomains = computed<SelectableDomain[]>(() => SELECTABLE_DOMAINS)

// Get the current domain's flag
const currentDomainFlag = computed(() => {
  return domainConfig.value.flag
})

function toggleDropdown() {
  isOpen.value = !isOpen.value
}

function closeDropdown() {
  isOpen.value = false
}

/**
 * Get the current domain from URL
 * Handles both ?domain= param (localhost) and actual hostname
 */
function getCurrentDomain(): string {
  if (typeof window === 'undefined') return 'socialchef.ai'

  // Check for query param override (localhost testing)
  const params = new URLSearchParams(window.location.search)
  const domainOverride = params.get('domain')
  if (domainOverride) {
    return domainOverride
  }

  // On localhost without domain param, default to socialchef.ai
  if (isLocalhost.value) {
    return 'socialchef.ai'
  }

  // Use actual hostname
  return window.location.hostname
}

/**
 * Check if a domain matches the current domain
 */
function isCurrentDomain(domain: string): boolean {
  const current = getCurrentDomain()

  // Direct match
  if (current === domain) return true

  // For subdomains like de.socialchef.ai, check if current matches
  if (domain.includes('.socialchef.ai')) {
    // Extract subdomain from domain (e.g., 'de' from 'de.socialchef.ai')
    const domainSubdomain = domain.split('.')[0]
    const currentParts = current.split('.')
    if (currentParts.length >= 3 && currentParts[0] === domainSubdomain) {
      return true
    }
  }

  // For socialchef.ai (international), only match if there's NO subdomain
  // e.g., socialchef.ai matches, but de.socialchef.ai does NOT match
  if (domain === 'socialchef.ai') {
    // Only match if current is exactly socialchef.ai (no subdomain)
    return current === 'socialchef.ai'
  }

  // Check if current hostname contains the domain (e.g., staging.socialchef.no matches socialchef.no)
  // But exclude .ai subdomains which are handled above
  if (current.endsWith('.' + domain) && !domain.endsWith('.ai')) return true

  return false
}

/**
 * Navigate to a different domain
 */
function selectDomain(targetDomain: string) {
  let targetUrl: string

  if (isLocalhost.value) {
    // On localhost, update the ?domain= query param
    const url = new URL(window.location.href)
    if (targetDomain === 'socialchef.ai') {
      // Default domain - remove the param
      url.searchParams.delete('domain')
    } else {
      url.searchParams.set('domain', targetDomain)
    }
    targetUrl = url.toString()
  } else {
    // In production, redirect to the appropriate domain
    const newUrl = new URL(window.location.href)
    newUrl.hostname = targetDomain
    targetUrl = newUrl.toString()
  }

  // Navigate using location.assign for better Safari compatibility
  window.location.assign(targetUrl)
}

function selectCurrency(currency: Currency) {
  localeStore.setCurrency(currency)
  closeDropdown()
}

// Watch for locale changes and update i18n
watch(
  () => localeStore.currentLocale,
  (newLocale) => {
    locale.value = newLocale
  },
  { immediate: true }
)

// Close dropdown when clicking outside
function handleClickOutside(event: MouseEvent) {
  if (selectorContainer.value && !selectorContainer.value.contains(event.target as Node)) {
    closeDropdown()
  }
}

// Close on escape key
function handleEscape(event: KeyboardEvent) {
  if (event.key === 'Escape' && isOpen.value) {
    closeDropdown()
  }
}

// Track window resize for mobile detection
function handleResize() {
  windowWidth.value = window.innerWidth
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleEscape)
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleEscape)
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.language-selector {
  position: relative;
}

/* Language Button */
.language-button {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  background: transparent;
  border: 1px solid rgba(15, 61, 46, 0.15);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-base);
  color: var(--text-secondary);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  min-width: 60px;
}

.language-button:hover {
  background: rgba(15, 61, 46, 0.05);
  border-color: rgba(15, 61, 46, 0.25);
}

.flag {
  font-size: var(--text-lg);
  line-height: 1;
}

.chevron {
  font-size: 10px;
  transition: transform var(--transition-base);
  color: var(--gold-primary);
}

.chevron.open {
  transform: rotate(180deg);
}

/* Currency badge in button */
.currency-badge {
  font-size: var(--text-xs);
  padding: 2px 6px;
  background: rgba(15, 61, 46, 0.1);
  border-radius: var(--radius-sm);
  color: var(--gold-primary);
  font-weight: var(--font-medium);
}

/* Dropdown Menu */
.dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 340px;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(15, 61, 46, 0.1);
  border-radius: var(--radius-xl);
  box-shadow:
    0 12px 48px rgba(15, 61, 46, 0.15),
    0 0 0 1px rgba(15, 61, 46, 0.05);
  overflow: hidden;
  z-index: 1000;
}

/* Header */
.dropdown-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md) var(--space-lg);
  border-bottom: 1px solid rgba(15, 61, 46, 0.08);
}

.header-title {
  font-family: var(--font-heading);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  letter-spacing: 0.02em;
}

.close-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: transparent;
  border: 1px solid rgba(15, 61, 46, 0.05);
  border-radius: var(--radius-md);
  color: var(--text-muted);
  font-size: var(--text-lg);
  cursor: pointer;
  transition: var(--transition-fast);
}

.close-button:hover {
  background: rgba(15, 61, 46, 0.05);
  color: var(--text-primary);
  border-color: rgba(15, 61, 46, 0.1);
}

/* Language Grid */
.language-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-sm);
  padding: var(--space-md);
}

/* Language Card */
.language-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-md) var(--space-sm);
  background: rgba(15, 61, 46, 0.015);
  border: 1px solid rgba(15, 61, 46, 0.04);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: var(--transition-base);
  position: relative;
}

.language-card:hover {
  background: rgba(15, 61, 46, 0.05);
  border-color: rgba(15, 61, 46, 0.15);
  transform: translateY(-2px);
}

.language-card.active {
  background: rgba(15, 61, 46, 0.08);
  border-color: var(--gold-primary);
  box-shadow: 0 0 12px rgba(15, 61, 46, 0.1);
}

.card-flag {
  font-size: 1.75rem;
  line-height: 1;
}

.card-name {
  font-family: var(--font-body);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.language-card.active .card-name {
  color: var(--gold-primary);
}

.card-check {
  position: absolute;
  top: 4px;
  right: 4px;
  font-size: 10px;
  color: var(--gold-primary);
  background: rgba(15, 61, 46, 0.1);
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Section divider */
.dropdown-divider {
  height: 1px;
  background: rgba(15, 61, 46, 0.08);
  margin: 0;
}

/* Section label */
.dropdown-section-label {
  padding: var(--space-sm) var(--space-lg);
  font-size: var(--text-xs);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: var(--font-medium);
}

/* Currency Grid */
.currency-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-md) var(--space-md);
}

/* Currency Card */
.currency-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: var(--space-sm);
  background: rgba(15, 61, 46, 0.015);
  border: 1px solid rgba(15, 61, 46, 0.04);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-base);
}

.currency-card:hover {
  background: rgba(15, 61, 46, 0.05);
  border-color: rgba(15, 61, 46, 0.15);
}

.currency-card.active {
  background: rgba(15, 61, 46, 0.08);
  border-color: var(--gold-primary);
}

.currency-symbol {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--gold-primary);
}

.currency-code {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.currency-card.active .currency-code {
  color: var(--gold-light);
}

/* Transition */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
  transform-origin: top right;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(-8px);
}

.dropdown-enter-to,
.dropdown-leave-from {
  opacity: 1;
  transform: scale(1) translateY(0);
}

/* Responsive - Desktop only adjustments */
@media (max-width: 768px) {
  .language-button {
    min-width: 50px;
    padding: var(--space-xs) var(--space-sm);
  }

  .flag {
    font-size: var(--text-base);
  }
}

/* Reduce motion */
@media (prefers-reduced-motion: reduce) {
  .language-button,
  .chevron,
  .language-card,
  .currency-card,
  .dropdown-enter-active,
  .dropdown-leave-active {
    transition: none;
  }

  .language-card:hover {
    transform: none;
  }
}
</style>

<!-- Global styles for teleported mobile dropdown -->
<style>
/* Mobile Dropdown Overlay */
.mobile-dropdown-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 61, 46, 0.25);
  z-index: 9999;
  display: flex;
  align-items: flex-end;
}

/* Mobile Dropdown Menu */
.mobile-dropdown-menu {
  width: 100%;
  max-height: 70vh;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(15, 61, 46, 0.1);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  box-shadow:
    0 -12px 48px rgba(15, 61, 46, 0.15),
    0 0 0 1px rgba(15, 61, 46, 0.05);
  overflow-y: auto;
  padding-bottom: env(safe-area-inset-bottom, 0);
}

.mobile-dropdown-menu .dropdown-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md) var(--space-lg);
  border-bottom: 1px solid rgba(15, 61, 46, 0.08);
}

.mobile-dropdown-menu .header-title {
  font-family: var(--font-heading);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  letter-spacing: 0.02em;
}

.mobile-dropdown-menu .close-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: transparent;
  border: 1px solid rgba(15, 61, 46, 0.05);
  border-radius: var(--radius-md);
  color: var(--text-muted);
  font-size: var(--text-lg);
  cursor: pointer;
  transition: var(--transition-fast);
}

.mobile-dropdown-menu .close-button:hover {
  background: rgba(15, 61, 46, 0.05);
  color: var(--text-primary);
  border-color: rgba(15, 61, 46, 0.1);
}

.mobile-dropdown-menu .language-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-sm);
  padding: var(--space-md);
}

.mobile-dropdown-menu .language-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-md) var(--space-sm);
  background: rgba(15, 61, 46, 0.015);
  border: 1px solid rgba(15, 61, 46, 0.04);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: var(--transition-base);
  position: relative;
}

.mobile-dropdown-menu .language-card:hover {
  background: rgba(15, 61, 46, 0.05);
  border-color: rgba(15, 61, 46, 0.15);
}

.mobile-dropdown-menu .language-card.active {
  background: rgba(15, 61, 46, 0.08);
  border-color: var(--gold-primary);
  box-shadow: 0 0 12px rgba(15, 61, 46, 0.1);
}

.mobile-dropdown-menu .card-flag {
  font-size: 1.75rem;
  line-height: 1;
}

.mobile-dropdown-menu .card-name {
  font-family: var(--font-body);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.mobile-dropdown-menu .language-card.active .card-name {
  color: var(--gold-primary);
}

.mobile-dropdown-menu .card-check {
  position: absolute;
  top: 4px;
  right: 4px;
  font-size: 10px;
  color: var(--gold-primary);
  background: rgba(15, 61, 46, 0.1);
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mobile-dropdown-menu .dropdown-divider {
  height: 1px;
  background: rgba(15, 61, 46, 0.08);
  margin: 0;
}

.mobile-dropdown-menu .dropdown-section-label {
  padding: var(--space-sm) var(--space-lg);
  font-size: var(--text-xs);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: var(--font-medium);
}

.mobile-dropdown-menu .currency-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-md) var(--space-md);
}

.mobile-dropdown-menu .currency-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: var(--space-sm);
  background: rgba(15, 61, 46, 0.015);
  border: 1px solid rgba(15, 61, 46, 0.04);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-base);
}

.mobile-dropdown-menu .currency-card:hover {
  background: rgba(15, 61, 46, 0.05);
  border-color: rgba(15, 61, 46, 0.15);
}

.mobile-dropdown-menu .currency-card.active {
  background: rgba(15, 61, 46, 0.08);
  border-color: var(--gold-primary);
}

.mobile-dropdown-menu .currency-symbol {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--gold-primary);
}

.mobile-dropdown-menu .currency-code {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.mobile-dropdown-menu .currency-card.active .currency-code {
  color: var(--gold-light);
}

/* Mobile Dropdown Transitions */
.mobile-dropdown-enter-active,
.mobile-dropdown-leave-active {
  transition: opacity 0.3s ease;
}

.mobile-dropdown-enter-active .mobile-dropdown-menu,
.mobile-dropdown-leave-active .mobile-dropdown-menu {
  transition: transform 0.3s ease;
}

.mobile-dropdown-enter-from,
.mobile-dropdown-leave-to {
  opacity: 0;
}

.mobile-dropdown-enter-from .mobile-dropdown-menu,
.mobile-dropdown-leave-to .mobile-dropdown-menu {
  transform: translateY(100%);
}

.mobile-dropdown-enter-to,
.mobile-dropdown-leave-from {
  opacity: 1;
}

.mobile-dropdown-enter-to .mobile-dropdown-menu,
.mobile-dropdown-leave-from .mobile-dropdown-menu {
  transform: translateY(0);
}

/* Smaller screens - 2 columns */
@media (max-width: 360px) {
  .mobile-dropdown-menu .language-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Reduce motion for mobile dropdown */
@media (prefers-reduced-motion: reduce) {
  .mobile-dropdown-enter-active,
  .mobile-dropdown-leave-active,
  .mobile-dropdown-enter-active .mobile-dropdown-menu,
  .mobile-dropdown-leave-active .mobile-dropdown-menu {
    transition: none;
  }
}
</style>

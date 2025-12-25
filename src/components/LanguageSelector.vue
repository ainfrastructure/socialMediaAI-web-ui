<template>
  <div class="language-selector" ref="selectorContainer">
    <!-- Language Button -->
    <button @click="toggleDropdown" class="language-button" :aria-label="$t('languages.selectLanguage')">
      <span class="flag">{{ localeStore.getLocaleFlag(currentLocale) }}</span>
      <span v-if="localeStore.isDevAccess" class="currency-badge">{{ localeStore.currentCurrency }}</span>
      <span class="chevron" :class="{ open: isOpen }">▼</span>
    </button>

    <!-- Dropdown Menu -->
    <Transition name="dropdown">
      <div v-if="isOpen" class="dropdown-menu">
        <!-- Language Section -->
        <div class="dropdown-section-label">{{ $t('languages.selectLanguage') }}</div>
        <button
          v-for="lang in availableLocales"
          :key="lang"
          @click="selectLocale(lang)"
          class="dropdown-item"
          :class="{ active: currentLocale === lang }"
        >
          <span class="flag-large">{{ localeStore.getLocaleFlag(lang) }}</span>
          <span class="language-name">{{ localeStore.getLocaleName(lang) }}</span>
          <span v-if="currentLocale === lang" class="checkmark">✓</span>
        </button>

        <!-- Currency Section (dev access only) -->
        <template v-if="localeStore.isDevAccess">
          <div class="dropdown-divider"></div>
          <div class="dropdown-section-label">{{ $t('languages.selectCurrency') }}</div>
          <button
            v-for="curr in localeStore.availableCurrencies"
            :key="curr"
            @click="selectCurrency(curr)"
            class="dropdown-item"
            :class="{ active: localeStore.currentCurrency === curr }"
          >
            <span class="currency-symbol">{{ localeStore.getCurrencySymbol(curr) }}</span>
            <span class="language-name">{{ localeStore.getCurrencyName(curr) }}</span>
            <span v-if="localeStore.currentCurrency === curr" class="checkmark">✓</span>
          </button>
        </template>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLocaleStore, type Locale, type Currency } from '../stores/locale'

const { locale } = useI18n()
const localeStore = useLocaleStore()
const isOpen = ref(false)
const selectorContainer = ref<HTMLElement | null>(null)

const currentLocale = computed(() => localeStore.currentLocale)
const availableLocales: Locale[] = ['en', 'no']

function toggleDropdown() {
  isOpen.value = !isOpen.value
}

function closeDropdown() {
  isOpen.value = false
}

function selectLocale(newLocale: Locale) {
  localeStore.setLocale(newLocale)
  locale.value = newLocale
  closeDropdown()
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

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
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
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-base);
  color: var(--text-secondary);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  min-width: 60px;
}

.language-button:hover {
  background: rgba(212, 175, 55, 0.1);
  border-color: rgba(212, 175, 55, 0.5);
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

/* Dropdown Menu */
.dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 180px;
  background: rgba(26, 26, 26, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(212, 175, 55, 0.1);
  overflow: hidden;
  z-index: 1000;
  padding: var(--space-xs) 0;
}

/* Dropdown Item */
.dropdown-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-lg);
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-family: var(--font-body);
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: var(--transition-base);
  text-align: left;
  position: relative;
}

.dropdown-item:hover {
  background: rgba(212, 175, 55, 0.1);
  color: var(--gold-light);
}

.dropdown-item.active {
  background: rgba(212, 175, 55, 0.15);
  color: var(--gold-primary);
}

.flag-large {
  font-size: var(--text-xl);
  line-height: 1;
  flex-shrink: 0;
}

.language-name {
  flex: 1;
}

.checkmark {
  font-size: var(--text-sm);
  color: var(--gold-primary);
  font-weight: var(--font-bold);
}

/* Currency badge in button */
.currency-badge {
  font-size: var(--text-xs);
  padding: 2px 6px;
  background: rgba(212, 175, 55, 0.2);
  border-radius: var(--radius-sm);
  color: var(--gold-primary);
  font-weight: var(--font-medium);
}

/* Section divider */
.dropdown-divider {
  height: 1px;
  background: rgba(212, 175, 55, 0.2);
  margin: var(--space-sm) 0;
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

/* Currency symbol */
.currency-symbol {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--gold-primary);
  width: 24px;
  text-align: center;
  flex-shrink: 0;
}

/* Transition */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity var(--transition-fast), transform var(--transition-fast);
  transform-origin: top right;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(-10px);
}

.dropdown-enter-to,
.dropdown-leave-from {
  opacity: 1;
  transform: scale(1) translateY(0);
}

/* Responsive */
@media (max-width: 768px) {
  .language-button {
    min-width: 50px;
    padding: var(--space-xs) var(--space-sm);
  }

  .flag {
    font-size: var(--text-base);
  }

  .dropdown-menu {
    min-width: 160px;
    right: -8px;
  }
}

/* Reduce motion */
@media (prefers-reduced-motion: reduce) {
  .language-button,
  .chevron,
  .dropdown-item,
  .dropdown-enter-active,
  .dropdown-leave-active {
    transition: none;
  }
}
</style>

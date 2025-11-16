<template>
  <div class="language-selector" ref="selectorContainer">
    <!-- Language Button -->
    <button @click="toggleDropdown" class="language-button" :aria-label="$t('languages.selectLanguage')">
      <span class="flag">{{ localeStore.getLocaleFlag(currentLocale) }}</span>
      <span class="chevron" :class="{ open: isOpen }">▼</span>
    </button>

    <!-- Dropdown Menu -->
    <Transition name="dropdown">
      <div v-if="isOpen" class="dropdown-menu">
        <button
          v-for="locale in availableLocales"
          :key="locale"
          @click="selectLocale(locale)"
          class="dropdown-item"
          :class="{ active: currentLocale === locale }"
        >
          <span class="flag-large">{{ localeStore.getLocaleFlag(locale) }}</span>
          <span class="language-name">{{ localeStore.getLocaleName(locale) }}</span>
          <span v-if="currentLocale === locale" class="checkmark">✓</span>
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLocaleStore, type Locale } from '../stores/locale'

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

<template>
  <div class="font-selector" ref="selectorContainer">
    <!-- Font Button -->
    <button @click="toggleDropdown" class="font-button" aria-label="Select Font Theme">
      <span class="icon">{{ fontStore.getThemeIcon(currentTheme) }}</span>
      <span class="chevron" :class="{ open: isOpen }">▼</span>
    </button>

    <!-- Dropdown Menu -->
    <Transition name="dropdown">
      <div v-if="isOpen" class="dropdown-menu">
        <button
          v-for="theme in availableThemes"
          :key="theme"
          @click="selectTheme(theme)"
          class="dropdown-item"
          :class="{ active: currentTheme === theme }"
        >
          <span class="icon-large">{{ fontStore.getThemeIcon(theme) }}</span>
          <div class="theme-info">
            <span class="theme-name">{{ fontStore.getThemeName(theme) }}</span>
            <span class="theme-desc">{{ fontStore.getThemeDescription(theme) }}</span>
          </div>
          <span v-if="currentTheme === theme" class="checkmark">✓</span>
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useFontStore, type FontTheme } from '../stores/font'

const fontStore = useFontStore()
const isOpen = ref(false)
const selectorContainer = ref<HTMLElement | null>(null)

const currentTheme = computed(() => fontStore.currentTheme)
const availableThemes: FontTheme[] = ['current', 'apple', 'classic', 'modern', 'luxury', 'elegant', 'boutique']

function toggleDropdown() {
  isOpen.value = !isOpen.value
}

function closeDropdown() {
  isOpen.value = false
}

function selectTheme(newTheme: FontTheme) {
  fontStore.setTheme(newTheme)
  closeDropdown()
}

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
.font-selector {
  position: relative;
}

/* Font Button */
.font-button {
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

.font-button:hover {
  background: rgba(212, 175, 55, 0.1);
  border-color: rgba(212, 175, 55, 0.5);
}

.icon {
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
  min-width: 280px;
  background: rgba(26, 26, 26, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(212, 175, 55, 0.1);
  overflow: hidden;
  z-index: 1000;
  padding: var(--space-xs) 0;
  max-height: 400px;
  overflow-y: auto;
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

.icon-large {
  font-size: var(--text-xl);
  line-height: 1;
  flex-shrink: 0;
}

.theme-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.theme-name {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: inherit;
}

.theme-desc {
  font-size: var(--text-xs);
  color: var(--text-muted);
  font-weight: var(--font-normal);
}

.checkmark {
  font-size: var(--text-sm);
  color: var(--gold-primary);
  font-weight: var(--font-bold);
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

/* Scrollbar for dropdown */
.dropdown-menu::-webkit-scrollbar {
  width: 6px;
}

.dropdown-menu::-webkit-scrollbar-track {
  background: transparent;
}

.dropdown-menu::-webkit-scrollbar-thumb {
  background: var(--gold-dark);
  border-radius: var(--radius-full);
}

/* Responsive */
@media (max-width: 768px) {
  .font-button {
    min-width: 50px;
    padding: var(--space-xs) var(--space-sm);
  }

  .icon {
    font-size: var(--text-base);
  }

  .dropdown-menu {
    min-width: 240px;
    right: -8px;
  }

  .theme-name {
    font-size: var(--text-sm);
  }

  .theme-desc {
    font-size: 10px;
  }
}

/* Reduce motion */
@media (prefers-reduced-motion: reduce) {
  .font-button,
  .chevron,
  .dropdown-item,
  .dropdown-enter-active,
  .dropdown-leave-active {
    transition: none;
  }
}
</style>

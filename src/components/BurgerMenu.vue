<template>
  <div class="burger-menu" ref="menuContainer">
    <!-- Burger Icon Button -->
    <button @click="toggleMenu" class="burger-button" aria-label="User menu">
      <div class="burger-icon" :class="{ open: isOpen }">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </button>

    <!-- Dropdown Menu -->
    <Transition name="dropdown">
      <div v-if="isOpen" class="dropdown-menu">
        <div class="dropdown-header">
          <div class="user-avatar">
            {{ userInitial }}
          </div>
          <div class="user-details">
            <span class="user-email">{{ authStore.user?.email }}</span>
            <span class="user-plan">{{ planName }}</span>
          </div>
        </div>

        <div class="dropdown-divider"></div>

        <nav class="dropdown-nav">
          <router-link to="/profile" class="dropdown-item" @click="closeMenu">
            <span class="dropdown-icon">👤</span>
            <span>Profile</span>
          </router-link>

          <router-link to="/plans" class="dropdown-item" @click="closeMenu">
            <span class="dropdown-icon">💎</span>
            <span>Plans & Billing</span>
          </router-link>

          <router-link to="/connect-accounts" class="dropdown-item" @click="closeMenu">
            <span class="dropdown-icon">🔗</span>
            <span>Connect Accounts</span>
          </router-link>
        </nav>

        <div class="dropdown-divider"></div>

        <button @click="handleLogout" class="dropdown-item logout-item">
          <span class="dropdown-icon">🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const isOpen = ref(false)
const menuContainer = ref<HTMLElement | null>(null)

const userInitial = computed(() => {
  const email = authStore.user?.email || ''
  return email.charAt(0).toUpperCase()
})

const planName = computed(() => {
  const tier = authStore.subscriptionTier
  return tier.charAt(0).toUpperCase() + tier.slice(1) + ' Plan'
})

function toggleMenu() {
  isOpen.value = !isOpen.value
}

function closeMenu() {
  isOpen.value = false
}

async function handleLogout() {
  closeMenu()
  await authStore.logout()
  router.push('/login')
}

// Close menu when clicking outside
function handleClickOutside(event: MouseEvent) {
  if (menuContainer.value && !menuContainer.value.contains(event.target as Node)) {
    closeMenu()
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
.burger-menu {
  position: relative;
}

/* Burger Button */
.burger-button {
  width: 40px;
  height: 40px;
  background: transparent;
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: var(--radius-md);
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition-base);
}

.burger-button:hover {
  background: rgba(212, 175, 55, 0.1);
  border-color: rgba(212, 175, 55, 0.5);
}

/* Burger Icon */
.burger-icon {
  width: 20px;
  height: 16px;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.burger-icon span {
  display: block;
  height: 2px;
  width: 100%;
  background: var(--gold-primary);
  border-radius: 2px;
  transition: var(--transition-base);
  transform-origin: center;
}

.burger-icon.open span:nth-child(1) {
  transform: translateY(7px) rotate(45deg);
}

.burger-icon.open span:nth-child(2) {
  opacity: 0;
}

.burger-icon.open span:nth-child(3) {
  transform: translateY(-7px) rotate(-45deg);
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
}

/* Dropdown Header */
.dropdown-header {
  padding: var(--space-xl);
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-full);
  background: var(--gradient-gold);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  color: var(--text-on-gold);
  flex-shrink: 0;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  min-width: 0;
  flex: 1;
}

.user-email {
  color: var(--text-primary);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-plan {
  color: var(--gold-primary);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Dropdown Divider */
.dropdown-divider {
  height: 1px;
  background: rgba(212, 175, 55, 0.1);
  margin: 0;
}

/* Dropdown Navigation */
.dropdown-nav {
  padding: var(--space-sm) 0;
}

.dropdown-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-xl);
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-family: var(--font-body);
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  text-decoration: none;
  cursor: pointer;
  transition: var(--transition-base);
  text-align: left;
}

.dropdown-item:hover {
  background: rgba(212, 175, 55, 0.1);
  color: var(--gold-light);
}

.dropdown-icon {
  font-size: var(--text-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  flex-shrink: 0;
}

.logout-item {
  color: var(--text-muted);
}

.logout-item:hover {
  background: rgba(220, 38, 38, 0.1);
  color: #fca5a5;
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
  .dropdown-menu {
    min-width: 260px;
    right: -8px;
  }

  .dropdown-header {
    padding: var(--space-lg);
  }

  .user-avatar {
    width: 40px;
    height: 40px;
    font-size: var(--text-lg);
  }
}

/* Reduce motion */
@media (prefers-reduced-motion: reduce) {
  .burger-icon span,
  .burger-button,
  .dropdown-item,
  .dropdown-enter-active,
  .dropdown-leave-active {
    transition: none;
  }
}
</style>

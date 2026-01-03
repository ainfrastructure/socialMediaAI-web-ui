<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useI18n } from 'vue-i18n'
import SidebarMenu from './SidebarMenu.vue'
import LanguageSelector from './LanguageSelector.vue'
import ThemeToggle from './ThemeToggle.vue'
import MaterialIcon from './MaterialIcon.vue'
import NotificationDropdown from './NotificationDropdown.vue'

const authStore = useAuthStore()
useI18n()

// Mobile menu state
const mobileMenuOpen = ref(false)

function openMobileMenu() {
  mobileMenuOpen.value = true
}

function closeMobileMenu() {
  mobileMenuOpen.value = false
}

const userInitial = computed(() => {
  const email = authStore.user?.email || ''
  return email.charAt(0).toUpperCase()
})
</script>

<template>
  <div class="dashboard-layout">
    <!-- Sidebar -->
    <SidebarMenu
      :mobile-open="mobileMenuOpen"
      @close="closeMobileMenu"
    />

    <!-- Main Content Area -->
    <div class="main-area">
      <!-- Top Header Bar -->
      <header class="top-header">
        <div class="header-left">
          <!-- Mobile Menu Button -->
          <button
            class="mobile-menu-btn"
            @click="openMobileMenu"
            :aria-label="$t('sidebar.menu')"
          >
            <MaterialIcon icon="menu" size="md" />
          </button>

          <slot name="header-left"></slot>
        </div>

        <div class="header-right">
          <!-- Language Selector -->
          <LanguageSelector />

          <!-- Theme Toggle -->
          <ThemeToggle />

          <!-- Notifications -->
          <NotificationDropdown />

          <!-- User Avatar -->
          <router-link to="/profile" class="user-avatar">
            {{ userInitial }}
          </router-link>
        </div>
      </header>

      <!-- Page Content -->
      <main class="content-area">
        <slot></slot>
      </main>
    </div>
  </div>
</template>

<style scoped>
.dashboard-layout {
  display: flex;
  min-height: 100vh;
  min-height: 100dvh;
  background: var(--bg-primary);
  overflow-x: hidden;
}

/* Main Content Area */
.main-area {
  flex: 1;
  margin-left: 260px;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  min-height: 100dvh;
  max-width: 100%;
  overflow-x: hidden;
}

/* Top Header */
.top-header {
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-lg) var(--space-2xl);
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
}

/* Mobile Menu Button - hidden by default */
.mobile-menu-btn {
  display: none;
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition-base);
}

.mobile-menu-btn:hover {
  background: var(--bg-elevated);
  border-color: var(--gold-primary);
  color: var(--gold-primary);
}

/* Icon Button */
.icon-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition-base);
}

.icon-btn:hover {
  background: var(--bg-elevated);
  border-color: var(--gold-primary);
  color: var(--gold-primary);
}

/* User Avatar */
.user-avatar {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gradient-gold);
  border-radius: var(--radius-full);
  font-family: var(--font-heading);
  font-size: var(--text-base);
  font-weight: var(--font-bold);
  color: var(--text-on-gold);
  text-decoration: none;
  transition: var(--transition-base);
}

.user-avatar:hover {
  transform: scale(1.05);
  box-shadow: var(--glow-gold-sm);
}

/* Content Area */
.content-area {
  flex: 1;
  padding: var(--space-2xl);
  overflow-y: auto;
  overflow-x: hidden;
  max-width: 100%;
  contain: inline-size;
}

/* Responsive */
@media (max-width: 1024px) {
  .main-area {
    margin-left: 220px;
  }
}

@media (max-width: 768px) {
  .main-area {
    margin-left: 0;
  }

  .top-header {
    padding: var(--space-md) var(--space-lg);
  }

  .mobile-menu-btn {
    display: flex;
    min-width: var(--touch-target-min);
    min-height: var(--touch-target-min);
  }

  .content-area {
    padding: var(--space-lg);
  }
}

@media (max-width: 480px) {
  .top-header {
    padding: var(--space-sm) var(--space-md);
    gap: var(--space-sm);
  }

  .header-right {
    gap: var(--space-sm);
  }

  .content-area {
    padding: var(--space-md);
  }

  .icon-btn,
  .user-avatar {
    width: 36px;
    height: 36px;
  }
}

@media (max-width: 390px) {
  .top-header {
    padding: var(--space-xs) var(--space-sm);
  }

  .content-area {
    padding: var(--space-sm);
  }

  .header-right {
    gap: var(--space-xs);
  }

  .icon-btn,
  .user-avatar {
    width: 32px;
    height: 32px;
    font-size: var(--text-sm);
  }
}
</style>

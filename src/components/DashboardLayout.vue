<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useI18n } from 'vue-i18n'
import SidebarMenu from './SidebarMenu.vue'
import LanguageSelector from './LanguageSelector.vue'
import MaterialIcon from './MaterialIcon.vue'

const authStore = useAuthStore()
const { t } = useI18n()

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
          <!-- Search (placeholder for future) -->
          <div class="search-box">
            <MaterialIcon icon="search" size="sm" color="var(--text-muted)" />
            <input
              type="text"
              :placeholder="$t('common.search') + '...'"
              class="search-input"
            />
          </div>

          <!-- Language Selector -->
          <LanguageSelector />

          <!-- Notifications (placeholder) -->
          <button class="icon-btn" :aria-label="$t('sidebar.notifications')">
            <MaterialIcon icon="notifications" size="md" />
          </button>

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
  background: var(--bg-primary);
}

/* Main Content Area */
.main-area {
  flex: 1;
  margin-left: 260px;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
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
  background: rgba(10, 10, 10, 0.85);
  backdrop-filter: blur(12px);
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

/* Search Box */
.search-box {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-lg);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-full);
  min-width: 200px;
  transition: var(--transition-base);
}

.search-box:focus-within {
  border-color: var(--gold-primary);
  box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.1);
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-primary);
  font-size: var(--text-sm);
}

.search-input::placeholder {
  color: var(--text-muted);
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
}

/* Responsive */
@media (max-width: 1024px) {
  .main-area {
    margin-left: 220px;
  }

  .search-box {
    min-width: 160px;
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
  }

  .search-box {
    display: none;
  }

  .content-area {
    padding: var(--space-lg);
  }
}
</style>

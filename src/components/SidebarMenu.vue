<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import MaterialIcon from './MaterialIcon.vue'

const props = defineProps<{
  mobileOpen?: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { t } = useI18n()

// Menu items for navigation
const menuItems = computed(() => [
  {
    path: '/dashboard',
    icon: 'dashboard',
    label: t('sidebar.dashboard'),
    active: route.path === '/dashboard'
  },
  {
    path: '/content',
    icon: 'edit_note',
    label: t('sidebar.content'),
    active: route.path.startsWith('/content')
  },
  {
    path: '/scheduler',
    icon: 'calendar_today',
    label: t('sidebar.calendar'),
    active: route.path === '/scheduler'
  },
  {
    path: '/connect-accounts',
    icon: 'share',
    label: t('sidebar.platforms'),
    active: route.path === '/connect-accounts'
  }
])

const tierDisplayName = computed(() =>
  authStore.user?.subscription.tier.toUpperCase() || 'FREE'
)

const progressPercent = computed(() => {
  if (!authStore.usageStats) return 0
  const { credits_this_month, monthly_limit } = authStore.usageStats
  return Math.min((credits_this_month / monthly_limit) * 100, 100)
})

function navigateTo(path: string) {
  router.push(path)
  emit('close') // Close mobile menu after navigation
}

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}

function closeMobileMenu() {
  emit('close')
}
</script>

<template>
  <!-- Mobile Overlay -->
  <div
    v-if="mobileOpen"
    class="sidebar-overlay"
    @click="closeMobileMenu"
  ></div>

  <aside class="sidebar" :class="{ 'mobile-open': mobileOpen }">
    <!-- Mobile Close Button -->
    <button class="mobile-close" @click="closeMobileMenu">
      <MaterialIcon icon="close" size="md" />
    </button>

    <!-- Logo Section -->
    <div class="sidebar-header">
      <router-link to="/dashboard" class="brand" @click="closeMobileMenu">
        <img src="../assets/socialchef_logo.svg" alt="SocialChef Logo" class="brand-logo" />
        <div class="brand-info">
          <span class="brand-text">SocialChef</span>
          <span class="brand-badge">{{ tierDisplayName }}</span>
        </div>
      </router-link>
    </div>

    <!-- Navigation Menu -->
    <nav class="sidebar-nav">
      <span class="nav-section-label">{{ $t('sidebar.menu') }}</span>
      <ul class="nav-list">
        <li v-for="item in menuItems" :key="item.path">
          <button
            class="nav-item"
            :class="{ active: item.active }"
            @click="navigateTo(item.path)"
          >
            <span class="nav-icon">
              <MaterialIcon :icon="item.icon" size="md" />
            </span>
            <span class="nav-label">{{ item.label }}</span>
          </button>
        </li>
      </ul>
    </nav>

    <!-- Bottom Section -->
    <div class="sidebar-footer">
      <!-- Credits Usage -->
      <div class="credits-card">
        <div class="credits-header">
          <span class="credits-label">{{ $t('sidebar.creditsUsed') }}</span>
          <span class="credits-percent">{{ Math.round(progressPercent) }}%</span>
        </div>
        <div class="credits-bar">
          <div class="credits-progress" :style="{ width: `${progressPercent}%` }"></div>
        </div>
        <div class="credits-info">
          <span class="credits-count">{{ authStore.usageStats?.credits_this_month || 0 }}</span>
          <span class="credits-total">/{{ authStore.usageStats?.monthly_limit || 0 }}</span>
        </div>
        <button class="upgrade-btn" @click="navigateTo('/plans')">
          {{ $t('sidebar.upgrade') }}
        </button>
      </div>

      <!-- User Actions -->
      <div class="user-actions">
        <button class="action-item" @click="navigateTo('/profile')">
          <MaterialIcon icon="person" size="sm" />
          <span>{{ $t('sidebar.profile') }}</span>
        </button>
        <button class="action-item logout" @click="handleLogout">
          <MaterialIcon icon="logout" size="sm" />
          <span>{{ $t('sidebar.logout') }}</span>
        </button>
      </div>
    </div>
  </aside>
</template>

<style scoped>
/* Mobile Overlay */
.sidebar-overlay {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: calc(var(--z-fixed) - 1);
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.sidebar {
  width: 260px;
  min-height: 100vh;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  top: 0;
  z-index: var(--z-fixed);
  transition: transform 0.3s ease;
}

/* Mobile Close Button - hidden by default */
.mobile-close {
  display: none;
  position: absolute;
  top: var(--space-lg);
  right: var(--space-lg);
  width: 36px;
  height: 36px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  cursor: pointer;
  align-items: center;
  justify-content: center;
  transition: var(--transition-base);
  z-index: 10;
}

.mobile-close:hover {
  background: var(--gold-primary);
  border-color: var(--gold-primary);
  color: var(--text-on-gold);
}

/* Header / Logo */
.sidebar-header {
  padding: var(--space-xl);
  border-bottom: 1px solid var(--border-color);
}

.brand {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  text-decoration: none;
}

.brand-logo {
  height: 36px;
  width: auto;
}

.brand-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.brand-text {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  background: var(--gradient-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.brand-badge {
  font-size: 10px;
  font-weight: var(--font-bold);
  color: var(--gold-primary);
  background: rgba(212, 175, 55, 0.15);
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  width: fit-content;
}

/* Navigation */
.sidebar-nav {
  flex: 1;
  padding: var(--space-lg);
  overflow-y: auto;
}

.nav-section-label {
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0 var(--space-md);
  margin-bottom: var(--space-md);
  display: block;
}

.nav-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.nav-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-lg);
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-family: var(--font-body);
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: var(--transition-base);
  text-align: left;
}

.nav-item:hover {
  background: var(--bg-elevated);
  color: var(--text-primary);
}

.nav-item.active {
  background: rgba(212, 175, 55, 0.1);
  color: var(--gold-primary);
}

.nav-item.active .nav-icon {
  color: var(--gold-primary);
}

.nav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: inherit;
}

.nav-label {
  flex: 1;
}

/* Footer Section */
.sidebar-footer {
  padding: var(--space-lg);
  border-top: 1px solid var(--border-color);
}

/* Credits Card */
.credits-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  margin-bottom: var(--space-lg);
}

.credits-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-sm);
}

.credits-label {
  font-size: var(--text-xs);
  color: var(--text-secondary);
}

.credits-percent {
  font-size: var(--text-sm);
  font-weight: var(--font-bold);
  color: var(--gold-primary);
}

.credits-bar {
  height: 6px;
  background: var(--bg-elevated);
  border-radius: var(--radius-full);
  overflow: hidden;
  margin-bottom: var(--space-sm);
}

.credits-progress {
  height: 100%;
  background: var(--gradient-gold);
  border-radius: var(--radius-full);
  transition: width var(--transition-base);
}

.credits-info {
  display: flex;
  align-items: baseline;
  gap: 2px;
  margin-bottom: var(--space-md);
}

.credits-count {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
}

.credits-total {
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.upgrade-btn {
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  background: var(--gradient-gold);
  border: none;
  border-radius: var(--radius-md);
  color: var(--text-on-gold);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  cursor: pointer;
  transition: var(--transition-base);
}

.upgrade-btn:hover {
  background: var(--gradient-gold-hover);
  transform: translateY(-1px);
}

/* User Actions */
.user-actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.action-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  color: var(--text-muted);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: var(--transition-base);
  width: 100%;
  text-align: left;
}

.action-item:hover {
  background: var(--bg-elevated);
  color: var(--text-primary);
}

.action-item.logout:hover {
  background: rgba(220, 53, 69, 0.1);
  color: var(--error-text);
}

/* Responsive */
@media (max-width: 1024px) {
  .sidebar {
    width: 220px;
  }
}

@media (max-width: 768px) {
  .sidebar-overlay {
    display: block;
  }

  .sidebar {
    transform: translateX(-100%);
    width: 280px;
    box-shadow: var(--shadow-xl);
  }

  .sidebar.mobile-open {
    transform: translateX(0);
  }

  .mobile-close {
    display: flex;
  }
}
</style>

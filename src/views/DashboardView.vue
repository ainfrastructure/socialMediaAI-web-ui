<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import { useFacebookStore } from '../stores/facebook'
import { useInstagramStore } from '../stores/instagram'
import { api } from '../services/api'
import GradientBackground from '../components/GradientBackground.vue'
import BaseCard from '../components/BaseCard.vue'
import BaseButton from '../components/BaseButton.vue'

const router = useRouter()
const authStore = useAuthStore()
const facebookStore = useFacebookStore()
const instagramStore = useInstagramStore()
const { t } = useI18n()

// Real stats from API
const stats = ref({
  postsCreated: 0,
  postsSaved: 0,
  scheduledPosts: 0,
  restaurantsAdded: 0
})

const loading = ref(true)

const tierDisplayName = computed(() => authStore.user?.subscription.tier.toUpperCase() || 'FREE')

const progressPercent = computed(() => {
  if (!authStore.usageStats) return 0
  const { credits_this_month, monthly_limit } = authStore.usageStats
  return Math.min((credits_this_month / monthly_limit) * 100, 100)
})

// Platform connection status
const isFacebookConnected = computed(() => facebookStore.connectedPages.length > 0)
const isInstagramConnected = computed(() => instagramStore.connectedAccounts.length > 0)

const connectedCount = computed(() => {
  let count = 0
  if (isFacebookConnected.value) count++
  if (isInstagramConnected.value) count++
  return count
})

async function openCustomerPortal() {
  try {
    const response = await api.createPortalSession(window.location.href)
    if (response.success && (response as any).portal_url) {
      window.location.href = (response as any).portal_url
    }
  } catch (error) {
    console.error('Failed to open customer portal:', error)
  }
}

// Load data on mount
onMounted(async () => {
  try {
    // Load profile and connected pages/accounts
    await authStore.refreshProfile()
    await Promise.all([
      facebookStore.loadConnectedPages(),
      instagramStore.loadConnectedAccounts()
    ])

    // Load real stats from API
    const statsResponse = await api.getStats()
    if (statsResponse.success && statsResponse.data) {
      stats.value = {
        postsCreated: statsResponse.data.postsCreated || 0,
        postsSaved: statsResponse.data.favoritesSaved || 0,
        scheduledPosts: statsResponse.data.scheduledPosts || 0,
        restaurantsAdded: statsResponse.data.restaurantsAdded || 0
      }
    }
  } catch (error) {
    console.error('Failed to load dashboard data:', error)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="dashboard-view">
    <GradientBackground />

    <div class="container">
      <!-- Hero Section with Inline Stats -->
      <div class="hero-compact">
        <h1 class="hero-title">{{ $t('dashboard.welcomeBack', { name: authStore.user?.email?.split('@')[0] }) }}</h1>

        <!-- Inline Stats Bar -->
        <div class="stats-bar">
          <div class="stat-item">
            <span class="stat-icon">🎨</span>
            <span class="stat-value">{{ stats.postsCreated }}</span>
            <span class="stat-label">{{ $t('dashboard.postsCreated') }}</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-icon">⭐</span>
            <span class="stat-value">{{ stats.postsSaved }}</span>
            <span class="stat-label">{{ $t('dashboard.postsSaved') }}</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-icon">📅</span>
            <span class="stat-value">{{ stats.scheduledPosts }}</span>
            <span class="stat-label">{{ $t('dashboard.scheduledPosts') }}</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-icon">🍽️</span>
            <span class="stat-value">{{ stats.restaurantsAdded }}</span>
            <span class="stat-label">{{ $t('dashboard.restaurants') }}</span>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <section class="section">
        <h2 class="section-label">{{ $t('dashboard.quickActions') }}</h2>
        <div class="actions-grid">
          <div class="action-card" @click="router.push('/content/create')">
            <div class="action-icon">🔍</div>
            <h3 class="action-title">{{ $t('dashboard.addRestaurant') }}</h3>
            <p class="action-desc">{{ $t('dashboard.addRestaurantDescription') }}</p>
            <BaseButton variant="secondary" size="small" class="action-btn-cta">
              {{ $t('dashboard.getStarted') }} →
            </BaseButton>
          </div>
          <div class="action-card" @click="router.push('/content/create')">
            <div class="action-icon">🎨</div>
            <h3 class="action-title">{{ $t('dashboard.cookUpContent') }}</h3>
            <p class="action-desc">{{ $t('dashboard.cookUpContentDescription') }}</p>
            <BaseButton variant="secondary" size="small" class="action-btn-cta">
              {{ $t('dashboard.createNow') }} →
            </BaseButton>
          </div>
          <div class="action-card" @click="router.push('/scheduler')">
            <div class="action-icon">📅</div>
            <h3 class="action-title">{{ $t('dashboard.schedulePosts') }}</h3>
            <p class="action-desc">{{ $t('dashboard.schedulePostsDescription') }}</p>
            <BaseButton variant="secondary" size="small" class="action-btn-cta">
              {{ $t('dashboard.openCalendar') }} →
            </BaseButton>
          </div>
          <div class="action-card" @click="router.push('/content')">
            <div class="action-icon">📝</div>
            <h3 class="action-title">{{ $t('dashboard.viewPosts') }}</h3>
            <p class="action-desc">{{ $t('dashboard.viewPostsDescription') }}</p>
            <BaseButton variant="secondary" size="small" class="action-btn-cta">
              {{ $t('dashboard.browseLibrary') }} →
            </BaseButton>
          </div>
        </div>
      </section>

      <!-- Platforms -->
      <section class="section">
        <h2 class="section-label">{{ $t('dashboard.socialPlatforms') }}</h2>
        <p class="section-subtitle">{{ $t('dashboard.connectPlatformsPrompt') }}</p>
        <div class="platforms-grid">
          <div class="platform-card" :class="{ connected: isFacebookConnected }">
            <div class="platform-icon-large">📘</div>
            <h3 class="platform-name">Facebook</h3>
            <p class="platform-desc">{{ $t('dashboard.facebookDescription') }}</p>
            <span class="status-badge" :class="isFacebookConnected ? 'connected' : 'disconnected'">
              {{ isFacebookConnected ? $t('dashboard.connected') : $t('dashboard.notConnected') }}
            </span>
            <BaseButton
              :variant="isFacebookConnected ? 'danger' : 'primary'"
              size="small"
              class="platform-btn"
              @click="router.push('/connect-accounts')"
            >
              {{ isFacebookConnected ? $t('connectAccounts.disconnect') : $t('dashboard.connect') }}
            </BaseButton>
          </div>
          <div class="platform-card" :class="{ connected: isInstagramConnected }">
            <div class="platform-icon-large">📷</div>
            <h3 class="platform-name">Instagram</h3>
            <p class="platform-desc">{{ $t('dashboard.instagramDescription') }}</p>
            <span class="status-badge" :class="isInstagramConnected ? 'connected' : 'disconnected'">
              {{ isInstagramConnected ? $t('dashboard.connected') : $t('dashboard.notConnected') }}
            </span>
            <BaseButton
              :variant="isInstagramConnected ? 'danger' : 'primary'"
              size="small"
              class="platform-btn"
              @click="router.push('/connect-accounts')"
            >
              {{ isInstagramConnected ? $t('connectAccounts.disconnect') : $t('dashboard.connect') }}
            </BaseButton>
          </div>
          <div class="platform-card disabled">
            <div class="platform-icon-large">🎵</div>
            <h3 class="platform-name">TikTok</h3>
            <p class="platform-desc">{{ $t('dashboard.tiktokDescription') }}</p>
            <span class="status-badge coming-soon">{{ $t('connectAccounts.comingSoon') }}</span>
          </div>
          <div class="platform-card disabled">
            <div class="platform-icon-large">🐦</div>
            <h3 class="platform-name">Twitter/X</h3>
            <p class="platform-desc">{{ $t('dashboard.twitterDescription') }}</p>
            <span class="status-badge coming-soon">{{ $t('connectAccounts.comingSoon') }}</span>
          </div>
        </div>
      </section>

      <!-- Account Bar -->
      <section class="section">
        <h2 class="section-label">{{ $t('dashboard.accountOverview') }}</h2>
        <BaseCard variant="glass" class="account-bar">
          <div class="account-bar-content">
            <div class="account-tier">
              <span class="tier-badge">{{ tierDisplayName }}</span>
              <span class="tier-status">{{ authStore.user?.subscription.status }}</span>
            </div>

            <div class="account-usage">
              <div class="usage-info">
                <span class="usage-current">{{ authStore.usageStats?.credits_this_month || 0 }}</span>
                <span class="usage-sep">/</span>
                <span class="usage-total">{{ authStore.usageStats?.monthly_limit || 0 }}</span>
                <span class="usage-text">{{ $t('dashboard.creditsUsedLabel') }}</span>
              </div>
              <div class="usage-bar-compact">
                <div class="usage-progress-compact" :style="{ width: `${progressPercent}%` }"></div>
              </div>
            </div>

            <div class="account-actions-compact">
              <BaseButton variant="ghost" size="small" @click="router.push('/plans')">
                {{ $t('dashboard.viewPlans') }}
              </BaseButton>
              <BaseButton variant="secondary" size="small" @click="openCustomerPortal">
                {{ $t('dashboard.manageSubscription') }}
              </BaseButton>
            </div>
          </div>
        </BaseCard>
      </section>
    </div>
  </div>
</template>

<style scoped>
.dashboard-view {
  min-height: 100vh;
  position: relative;
  padding: var(--space-xl) var(--space-lg);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

/* Hero Compact */
.hero-compact {
  text-align: center;
  margin-bottom: var(--space-3xl);
  animation: fadeInUp 0.5s var(--ease-smooth);
}

.hero-title {
  font-family: var(--font-heading);
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  margin: 0 0 var(--space-xl) 0;
  background: var(--gradient-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Stats Bar - Inline Horizontal */
.stats-bar {
  display: flex;
  justify-content: center;
  align-items: stretch;
  padding: 0;
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  overflow: hidden;
}

.stat-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  padding: var(--space-lg) var(--space-xl);
}

.stat-icon {
  font-size: var(--text-xl);
}

.stat-value {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--gold-primary);
}

.stat-label {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-divider {
  width: 1px;
  background: var(--border-color);
  align-self: stretch;
}

/* Section */
.section {
  margin-bottom: var(--space-3xl);
}

.section-label {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--space-lg) 0;
}

/* Section Subtitle */
.section-subtitle {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: calc(-1 * var(--space-md)) 0 var(--space-lg) 0;
}

/* Actions Grid */
.actions-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-lg);
}

.action-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--space-xl);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.action-card:hover {
  border-color: var(--gold-primary);
  transform: translateY(-2px);
}

.action-icon {
  font-size: 48px;
  margin-bottom: var(--space-md);
}

.action-title {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--space-sm) 0;
}

.action-desc {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: 0 0 var(--space-lg) 0;
  flex: 1;
}

.action-btn-cta {
  width: 100%;
}

/* Platforms Grid */
.platforms-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-lg);
}

.platform-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--space-xl);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  transition: all var(--transition-fast);
}

.platform-card:hover:not(.disabled) {
  border-color: var(--gold-primary);
}

.platform-card.connected {
  border-color: var(--success-border);
  background: rgba(34, 197, 94, 0.05);
}

.platform-card.disabled {
  opacity: 0.6;
}

.platform-icon-large {
  font-size: 48px;
  margin-bottom: var(--space-md);
}

.platform-name {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--space-sm) 0;
}

.platform-desc {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: 0 0 var(--space-md) 0;
  flex: 1;
}

.status-badge {
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-full);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: var(--space-md);
}

.status-badge.connected {
  background: var(--success-bg);
  color: var(--success-text);
  border: 1px solid var(--success-border);
}

.status-badge.disconnected {
  background: var(--bg-tertiary);
  color: var(--text-muted);
  border: 1px solid var(--border-color);
}

.status-badge.coming-soon {
  background: var(--bg-tertiary);
  color: var(--text-muted);
  border: 1px solid var(--border-color);
}

.platform-btn {
  width: 100%;
}

/* Account Bar */
.account-bar {
  padding: var(--space-lg) var(--space-xl);
}

.account-bar-content {
  display: flex;
  align-items: center;
  gap: var(--space-xl);
  flex-wrap: wrap;
}

.account-tier {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.tier-badge {
  background: var(--gradient-gold);
  color: var(--text-on-gold);
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-full);
  font-weight: var(--font-bold);
  font-size: var(--text-xs);
}

.tier-status {
  font-size: var(--text-sm);
  color: var(--text-muted);
  text-transform: capitalize;
}

.account-usage {
  flex: 1;
  min-width: 200px;
}

.usage-info {
  display: flex;
  align-items: baseline;
  gap: var(--space-xs);
  margin-bottom: var(--space-xs);
}

.usage-current {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  color: var(--gold-primary);
}

.usage-sep {
  color: var(--text-muted);
}

.usage-total {
  font-size: var(--text-base);
  color: var(--text-secondary);
}

.usage-text {
  font-size: var(--text-xs);
  color: var(--text-muted);
  margin-left: var(--space-sm);
}

.usage-bar-compact {
  width: 100%;
  height: 6px;
  background: var(--bg-primary);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.usage-progress-compact {
  height: 100%;
  background: var(--gradient-gold);
  transition: width var(--transition-base);
  border-radius: var(--radius-full);
}

.account-actions-compact {
  display: flex;
  gap: var(--space-sm);
}

/* Animations */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive - Tablet */
@media (max-width: 1024px) {
  .actions-grid,
  .platforms-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Responsive - Mobile */
@media (max-width: 768px) {
  .dashboard-view {
    padding: var(--space-lg) var(--space-md);
  }

  .hero-title {
    font-size: var(--text-2xl);
  }

  .stats-bar {
    flex-wrap: wrap;
  }

  .stat-divider {
    display: none;
  }

  .stat-item {
    flex: 1 1 45%;
    padding: var(--space-md);
    border-bottom: 1px solid var(--border-color);
  }

  .stat-item:nth-child(n+5) {
    border-bottom: none;
  }

  .stat-value {
    font-size: var(--text-xl);
  }

  .stat-label {
    font-size: var(--text-xs);
  }

  .actions-grid,
  .platforms-grid {
    grid-template-columns: 1fr;
  }

  .account-bar-content {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-md);
  }

  .account-tier {
    justify-content: center;
  }

  .account-actions-compact {
    justify-content: center;
  }
}
</style>

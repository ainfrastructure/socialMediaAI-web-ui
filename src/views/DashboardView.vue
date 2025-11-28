<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import { useFacebookStore } from '../stores/facebook'
import { api } from '../services/api'
import GradientBackground from '../components/GradientBackground.vue'
import BaseCard from '../components/BaseCard.vue'
import BaseButton from '../components/BaseButton.vue'

const router = useRouter()
const authStore = useAuthStore()
const facebookStore = useFacebookStore()
const { t } = useI18n()

// Real stats from API
const stats = ref({
  postsCreated: 0,
  favoritesSaved: 0,
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

// All available platforms
const allPlatforms = computed(() => [
  {
    name: 'Facebook',
    icon: '📘',
    connected: false,
    route: '/playground',
    description: t('dashboard.facebookDescription')
  },
  {
    name: 'Instagram',
    icon: '📷',
    connected: false,
    route: '/playground',
    description: t('dashboard.instagramDescription')
  },
  {
    name: 'TikTok',
    icon: '🎵',
    connected: false,
    route: '/playground',
    description: t('dashboard.tiktokDescription')
  },
  {
    name: 'Twitter/X',
    icon: '🐦',
    connected: false,
    route: '/playground',
    description: t('dashboard.twitterDescription')
  },
  {
    name: 'LinkedIn',
    icon: '💼',
    connected: false,
    route: '/playground',
    description: t('dashboard.linkedinDescription')
  }
])

const connectedCount = computed(() => {
  return allPlatforms.value.filter(p => p.connected).length
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
    // Load profile and connected pages
    await authStore.refreshProfile()
    await facebookStore.loadConnectedPages()

    // Load real stats from API
    const statsResponse = await api.getStats()
    if (statsResponse.success && statsResponse.data) {
      stats.value = statsResponse.data
    }

    // Update Facebook connection status
    if (facebookStore.connectedPages && facebookStore.connectedPages.length > 0) {
      const fbPlatform = allPlatforms.value.find(p => p.name === 'Facebook')
      if (fbPlatform) {
        fbPlatform.connected = true
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
      <!-- Hero Section -->
      <div class="hero-section">
        <h1 class="hero-title">{{ $t('dashboard.welcomeBack', { name: authStore.user?.email?.split('@')[0] }) }}</h1>
        <p class="hero-subtitle">
          {{ $t('dashboard.readyToCreate') }}
        </p>
      </div>

      <!-- Onboarding Test Button -->
      <BaseCard variant="glass" class="onboarding-test-card">
        <div class="test-header">
          <span class="test-badge">{{ $t('dashboard.forTesting') }}</span>
          <h3 class="test-title">{{ $t('dashboard.tryOnboarding') }}</h3>
        </div>
        <p class="test-description">
          {{ $t('dashboard.tryOnboardingDescription') }}
        </p>
        <BaseButton variant="primary" @click="router.push('/onboarding')">
          {{ $t('dashboard.launchOnboarding') }}
        </BaseButton>
      </BaseCard>

      <!-- Quick Stats -->
      <div class="stats-grid">
        <BaseCard variant="glass" class="stat-card">
          <div class="stat-icon">🎨</div>
          <div class="stat-value">{{ stats.postsCreated }}</div>
          <div class="stat-label">{{ $t('dashboard.postsCreated') }}</div>
        </BaseCard>

        <BaseCard variant="glass" class="stat-card">
          <div class="stat-icon">⭐</div>
          <div class="stat-value">{{ stats.favoritesSaved }}</div>
          <div class="stat-label">{{ $t('dashboard.favoritesSaved') }}</div>
        </BaseCard>

        <BaseCard variant="glass" class="stat-card">
          <div class="stat-icon">📅</div>
          <div class="stat-value">{{ stats.scheduledPosts }}</div>
          <div class="stat-label">{{ $t('dashboard.scheduledPosts') }}</div>
        </BaseCard>

        <BaseCard variant="glass" class="stat-card">
          <div class="stat-icon">🍽️</div>
          <div class="stat-value">{{ stats.restaurantsAdded }}</div>
          <div class="stat-label">{{ $t('dashboard.restaurants') }}</div>
        </BaseCard>
      </div>

      <!-- Quick Actions -->
      <div class="section-header">
        <h2 class="section-title">{{ $t('dashboard.quickActions') }}</h2>
        <p class="section-subtitle">{{ $t('dashboard.quickActionsSubtitle') }}</p>
      </div>

      <div class="actions-grid">
        <BaseCard variant="glass" hoverable class="action-card" @click="router.push('/restaurants')">
          <div class="action-icon">🔍</div>
          <h3 class="action-title">{{ $t('dashboard.addRestaurant') }}</h3>
          <p class="action-description">{{ $t('dashboard.addRestaurantDescription') }}</p>
          <BaseButton variant="secondary" size="small">{{ $t('dashboard.getStarted') }}</BaseButton>
        </BaseCard>

        <BaseCard variant="glass" hoverable class="action-card" @click="router.push('/playground')">
          <div class="action-icon">🎨</div>
          <h3 class="action-title">{{ $t('dashboard.cookUpContent') }}</h3>
          <p class="action-description">{{ $t('dashboard.cookUpContentDescription') }}</p>
          <BaseButton variant="secondary" size="small">{{ $t('dashboard.createNow') }}</BaseButton>
        </BaseCard>

        <BaseCard variant="glass" hoverable class="action-card" @click="router.push('/scheduler')">
          <div class="action-icon">📅</div>
          <h3 class="action-title">{{ $t('dashboard.schedulePosts') }}</h3>
          <p class="action-description">{{ $t('dashboard.schedulePostsDescription') }}</p>
          <BaseButton variant="secondary" size="small">{{ $t('dashboard.openCalendar') }}</BaseButton>
        </BaseCard>

        <BaseCard variant="glass" hoverable class="action-card" @click="router.push('/favorites')">
          <div class="action-icon">⭐</div>
          <h3 class="action-title">{{ $t('dashboard.viewFavorites') }}</h3>
          <p class="action-description">{{ $t('dashboard.viewFavoritesDescription') }}</p>
          <BaseButton variant="secondary" size="small">{{ $t('dashboard.browseLibrary') }}</BaseButton>
        </BaseCard>
      </div>

      <!-- Connected Platforms -->
      <div class="section-header">
        <h2 class="section-title">{{ $t('dashboard.socialPlatforms') }}</h2>
        <p class="section-subtitle">
          {{ connectedCount > 0 ? $t('dashboard.platformsConnected', connectedCount) : $t('dashboard.connectPlatformsPrompt') }}
        </p>
      </div>

      <div class="platforms-grid">
        <BaseCard
          v-for="platform in allPlatforms"
          :key="platform.name"
          variant="glass"
          hoverable
          :class="['platform-card', { connected: platform.connected }]"
          @click="router.push(platform.route)"
        >
          <div class="platform-card-icon">{{ platform.icon }}</div>
          <h3 class="platform-card-name">{{ platform.name }}</h3>
          <p class="platform-card-description">{{ platform.description }}</p>
          <div class="platform-card-status">
            <span v-if="platform.connected" class="status-badge connected">
              {{ $t('dashboard.connected') }}
            </span>
            <span v-else class="status-badge disconnected">
              {{ $t('dashboard.notConnected') }}
            </span>
          </div>
          <BaseButton
            :variant="platform.connected ? 'secondary' : 'primary'"
            size="small"
            class="platform-card-button"
          >
            {{ platform.connected ? $t('dashboard.manage') : $t('dashboard.connect') }}
          </BaseButton>
        </BaseCard>
      </div>

      <!-- Account Overview -->
      <div class="section-header">
        <h2 class="section-title">{{ $t('dashboard.accountOverview') }}</h2>
      </div>

      <BaseCard variant="glass" class="account-card">
        <div class="account-grid">
          <!-- Subscription Info -->
          <div class="account-section">
            <h3 class="account-section-title">{{ $t('dashboard.subscription') }}</h3>
            <div class="account-info">
              <div class="info-row">
                <span class="info-label">{{ $t('dashboard.currentPlan') }}</span>
                <span class="tier-badge">{{ tierDisplayName }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">{{ $t('dashboard.status') }}</span>
                <span class="info-value">{{ authStore.user?.subscription.status }}</span>
              </div>
            </div>
            <BaseButton variant="secondary" size="small" @click="router.push('/plans')">
              {{ $t('dashboard.viewPlans') }}
            </BaseButton>
          </div>

          <!-- Usage Stats -->
          <div class="account-section">
            <h3 class="account-section-title">{{ $t('dashboard.usageThisMonth') }}</h3>
            <div class="usage-stats">
              <div class="usage-numbers">
                <span class="usage-current">{{ authStore.usageStats?.credits_this_month }}</span>
                <span class="usage-separator">/</span>
                <span class="usage-total">{{ authStore.usageStats?.monthly_limit }}</span>
              </div>
              <div class="usage-label">{{ $t('dashboard.creditsUsedLabel') }}</div>
            </div>
            <div class="usage-bar">
              <div class="usage-progress" :style="{ width: `${progressPercent}%` }"></div>
            </div>
            <div class="usage-remaining">
              {{ $t('dashboard.remainingCreditsLabel', authStore.usageStats?.remaining_credits || 0) }}
            </div>
          </div>
        </div>

        <div class="account-actions">
          <BaseButton variant="secondary" @click="openCustomerPortal">
            {{ $t('dashboard.manageSubscription') }}
          </BaseButton>
        </div>
      </BaseCard>
    </div>
  </div>
</template>

<style scoped>
.dashboard-view {
  min-height: 100vh;
  position: relative;
  padding: var(--space-3xl) var(--space-lg);
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

/* Hero Section */
.hero-section {
  margin-bottom: var(--space-4xl);
  text-align: center;
  animation: fadeInUp 0.6s var(--ease-smooth);
}

.hero-title {
  font-family: var(--font-heading);
  font-size: var(--text-4xl);
  font-weight: var(--font-bold);
  margin: 0 0 var(--space-md) 0;
  background: var(--gradient-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: var(--text-lg);
  color: var(--text-secondary);
  margin: 0;
}

/* Onboarding Test Card */
.onboarding-test-card {
  padding: var(--space-2xl);
  margin-bottom: var(--space-4xl);
  text-align: center;
  border: 2px dashed var(--gold-primary);
  animation: fadeInUp 0.7s var(--ease-smooth);
}

.test-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}

.test-badge {
  background: var(--gold-subtle);
  color: var(--gold-primary);
  padding: var(--space-xs) var(--space-lg);
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  border: 1px solid var(--gold-primary);
}

.test-title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  color: var(--text-primary);
  margin: 0;
}

.test-description {
  color: var(--text-secondary);
  margin: 0 0 var(--space-xl) 0;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-xl);
  margin-bottom: var(--space-4xl);
}

.stat-card {
  padding: var(--space-2xl);
  text-align: center;
  animation: fadeInUp 0.6s var(--ease-smooth);
  animation-fill-mode: both;
}

.stat-card:nth-child(1) { animation-delay: 0.1s; }
.stat-card:nth-child(2) { animation-delay: 0.2s; }
.stat-card:nth-child(3) { animation-delay: 0.3s; }
.stat-card:nth-child(4) { animation-delay: 0.4s; }

.stat-icon {
  font-size: var(--text-5xl);
  margin-bottom: var(--space-md);
}

.stat-value {
  font-family: var(--font-heading);
  font-size: var(--text-4xl);
  font-weight: var(--font-bold);
  color: var(--gold-primary);
  margin-bottom: var(--space-xs);
}

.stat-label {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Section Headers */
.section-header {
  text-align: center;
  margin: var(--space-5xl) 0 var(--space-3xl) 0;
}

.section-title {
  font-family: var(--font-heading);
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  margin: 0 0 var(--space-sm) 0;
  color: var(--text-primary);
}

.section-subtitle {
  font-size: var(--text-base);
  color: var(--text-secondary);
  margin: 0;
}

/* Actions Grid */
.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--space-xl);
  margin-bottom: var(--space-4xl);
}

.action-card {
  padding: var(--space-2xl);
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  cursor: pointer;
  animation: fadeInUp 0.6s var(--ease-smooth);
  animation-fill-mode: both;
}

.action-card:nth-child(1) { animation-delay: 0.1s; }
.action-card:nth-child(2) { animation-delay: 0.2s; }
.action-card:nth-child(3) { animation-delay: 0.3s; }
.action-card:nth-child(4) { animation-delay: 0.4s; }

.action-icon {
  font-size: 60px;
  margin-bottom: var(--space-sm);
}

.action-title {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  color: var(--text-primary);
  margin: 0;
}

.action-description {
  color: var(--text-secondary);
  font-size: var(--text-sm);
  line-height: var(--leading-normal);
  margin: 0;
  flex: 1;
}

/* Platforms Grid */
.platforms-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--space-xl);
  margin-bottom: var(--space-4xl);
}

.platform-card {
  padding: var(--space-2xl);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--space-md);
  cursor: pointer;
  transition: all var(--transition-base);
  animation: fadeInUp 0.6s var(--ease-smooth);
  animation-fill-mode: both;
}

.platform-card:nth-child(1) { animation-delay: 0.1s; }
.platform-card:nth-child(2) { animation-delay: 0.2s; }
.platform-card:nth-child(3) { animation-delay: 0.3s; }
.platform-card:nth-child(4) { animation-delay: 0.4s; }
.platform-card:nth-child(5) { animation-delay: 0.5s; }

.platform-card.connected {
  border-color: var(--success-border);
  background: var(--success-bg);
}

.platform-card-icon {
  font-size: 64px;
  margin-bottom: var(--space-sm);
}

.platform-card-name {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  color: var(--text-primary);
  margin: 0;
}

.platform-card-description {
  color: var(--text-secondary);
  font-size: var(--text-sm);
  line-height: var(--leading-normal);
  margin: 0;
  flex: 1;
}

.platform-card-status {
  margin: var(--space-sm) 0;
}

.status-badge {
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-full);
  text-transform: uppercase;
  letter-spacing: 0.5px;
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

.platform-card-button {
  width: 100%;
}

/* Account Card */
.account-card {
  padding: var(--space-3xl);
  margin-bottom: var(--space-4xl);
  animation: fadeInUp 0.9s var(--ease-smooth);
}

.account-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--space-3xl);
  margin-bottom: var(--space-3xl);
}

.account-section {
  background: var(--bg-tertiary);
  padding: var(--space-2xl);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
}

.account-section-title {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  color: var(--text-primary);
  margin: 0 0 var(--space-xl) 0;
  text-align: center;
}

.account-info {
  margin-bottom: var(--space-xl);
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-md) 0;
  border-bottom: 1px solid var(--border-color);
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-weight: var(--font-semibold);
  color: var(--text-secondary);
  font-size: var(--text-sm);
}

.info-value {
  color: var(--text-primary);
  font-size: var(--text-sm);
}

.tier-badge {
  background: var(--gradient-gold);
  color: var(--text-on-gold);
  padding: var(--space-xs) var(--space-lg);
  border-radius: var(--radius-full);
  font-weight: var(--font-bold);
  font-size: var(--text-xs);
}

.usage-stats {
  text-align: center;
  margin-bottom: var(--space-xl);
}

.usage-numbers {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-sm);
}

.usage-current {
  font-family: var(--font-heading);
  font-size: var(--text-4xl);
  font-weight: var(--font-bold);
  color: var(--gold-primary);
}

.usage-separator {
  font-size: var(--text-2xl);
  color: var(--text-muted);
}

.usage-total {
  font-size: var(--text-2xl);
  color: var(--text-secondary);
}

.usage-label {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.usage-bar {
  width: 100%;
  height: 12px;
  background: var(--bg-primary);
  border-radius: var(--radius-full);
  overflow: hidden;
  margin-bottom: var(--space-md);
}

.usage-progress {
  height: 100%;
  background: var(--gradient-gold);
  transition: width var(--transition-base);
  border-radius: var(--radius-full);
}

.usage-remaining {
  font-size: var(--text-xs);
  color: var(--text-muted);
  text-align: center;
}

.account-actions {
  display: flex;
  gap: var(--space-lg);
  justify-content: center;
  flex-wrap: wrap;
}

/* Animations */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive */
@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .actions-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .dashboard-view {
    padding: var(--space-2xl) var(--space-md);
  }

  .hero-title {
    font-size: var(--text-3xl);
  }

  .hero-subtitle {
    font-size: var(--text-base);
  }

  .stats-grid,
  .actions-grid {
    grid-template-columns: 1fr;
  }

  .account-grid {
    grid-template-columns: 1fr;
  }

  .account-actions {
    flex-direction: column;
  }
}
</style>

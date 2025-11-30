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
import MaterialIcon from '../components/MaterialIcon.vue'
import PlatformLogo from '../components/PlatformLogo.vue'
import ConfirmModal from '../components/ConfirmModal.vue'

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

// Disconnect modal state
const showDisconnectModal = ref(false)
const disconnectModalTitle = ref('')
const disconnectModalMessage = ref('')
const pendingDisconnect = ref<{ type: 'facebook' | 'instagram'; id: string; name: string } | null>(null)

function requestDisconnectFacebook() {
  const page = facebookStore.connectedPages[0]
  if (!page) return
  pendingDisconnect.value = { type: 'facebook', id: page.pageId, name: page.pageName }
  disconnectModalTitle.value = t('connectAccounts.disconnectTitle')
  disconnectModalMessage.value = t('connectAccounts.confirmDisconnect', { name: page.pageName })
  showDisconnectModal.value = true
}

function requestDisconnectInstagram() {
  const account = instagramStore.connectedAccounts[0]
  if (!account) return
  pendingDisconnect.value = { type: 'instagram', id: account.instagramAccountId, name: `@${account.username}` }
  disconnectModalTitle.value = t('connectAccounts.disconnectTitle')
  disconnectModalMessage.value = t('connectAccounts.confirmDisconnect', { name: `@${account.username}` })
  showDisconnectModal.value = true
}

async function handleConfirmDisconnect() {
  showDisconnectModal.value = false
  if (!pendingDisconnect.value) return

  const { type, id } = pendingDisconnect.value

  if (type === 'facebook') {
    await facebookStore.disconnectPage(id)
  } else if (type === 'instagram') {
    await instagramStore.disconnectAccount(id)
  }

  pendingDisconnect.value = null
}

function handleCancelDisconnect() {
  showDisconnectModal.value = false
  pendingDisconnect.value = null
}

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
            <MaterialIcon icon="palette" size="lg" :color="'var(--gold-primary)'" />
            <span class="stat-value">{{ stats.postsCreated }}</span>
            <span class="stat-label">{{ $t('dashboard.postsCreated') }}</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <MaterialIcon icon="star" size="lg" :color="'var(--gold-primary)'" />
            <span class="stat-value">{{ stats.postsSaved }}</span>
            <span class="stat-label">{{ $t('dashboard.postsSaved') }}</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <MaterialIcon icon="calendar_month" size="lg" :color="'var(--gold-primary)'" />
            <span class="stat-value">{{ stats.scheduledPosts }}</span>
            <span class="stat-label">{{ $t('dashboard.scheduledPosts') }}</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <MaterialIcon icon="restaurant" size="lg" :color="'var(--gold-primary)'" />
            <span class="stat-value">{{ stats.restaurantsAdded }}</span>
            <span class="stat-label">{{ $t('dashboard.restaurants') }}</span>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <section class="section">
        <h2 class="section-label">{{ $t('dashboard.quickActions') }}</h2>
        <div class="actions-grid">
          <div class="action-card" @click="router.push('/content')">
            <div class="action-icon-wrapper">
              <MaterialIcon icon="edit_note" size="3xl" :color="'var(--gold-primary)'" />
            </div>
            <h3 class="action-title">Cook Up Content</h3>
            <p class="action-desc">Create and manage your social media posts</p>
            <BaseButton variant="secondary" size="small" class="action-btn-cta">
              Get Started
            </BaseButton>
          </div>
          <div class="action-card" @click="router.push('/scheduler')">
            <div class="action-icon-wrapper">
              <MaterialIcon icon="calendar_today" size="3xl" :color="'var(--gold-primary)'" />
            </div>
            <h3 class="action-title">Schedule Posts</h3>
            <p class="action-desc">Plan and schedule your content calendar</p>
            <BaseButton variant="secondary" size="small" class="action-btn-cta">
              Open Calendar
            </BaseButton>
          </div>
          <div class="action-card" @click="router.push('/plans')">
            <div class="action-icon-wrapper">
              <MaterialIcon icon="credit_card" size="3xl" :color="'var(--gold-primary)'" />
            </div>
            <h3 class="action-title">Plans & Billing</h3>
            <p class="action-desc">Manage subscription and payment methods</p>
            <BaseButton variant="secondary" size="small" class="action-btn-cta">
              View Plans
            </BaseButton>
          </div>
          <div class="action-card" @click="router.push('/profile')">
            <div class="action-icon-wrapper">
              <MaterialIcon icon="person" size="3xl" :color="'var(--gold-primary)'" />
            </div>
            <h3 class="action-title">Profile & Settings</h3>
            <p class="action-desc">Update your account and preferences</p>
            <BaseButton variant="secondary" size="small" class="action-btn-cta">
              Manage Profile
            </BaseButton>
          </div>
        </div>
      </section>

      <!-- Platforms - Minimal Icon Grid -->
      <section class="section">
        <h2 class="section-label">{{ $t('dashboard.socialPlatforms') }}</h2>
        <p class="section-subtitle">{{ $t('dashboard.connectPlatformsPrompt') }}</p>
        <div class="platforms-grid-minimal">
          <!-- Facebook -->
          <div
            class="platform-box-minimal"
            :class="{ 'platform-connected': isFacebookConnected }"
          >
            <div class="platform-icon-bg platform-bg-facebook">
              <PlatformLogo platform="facebook" :size="32" />
            </div>
            <span v-if="isFacebookConnected" class="connected-badge-mini">
              <svg class="checkmark-icon-mini" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12L11 14L15 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              {{ $t('connectAccounts.connected') }}
            </span>
            <span v-else class="connect-label" @click="router.push('/connect-accounts')">{{ $t('connectAccounts.connect') }}</span>
            <button
              v-if="isFacebookConnected"
              class="disconnect-btn-top"
              @click.stop="requestDisconnectFacebook"
              :aria-label="$t('connectAccounts.disconnect')"
            >
              <MaterialIcon icon="close" size="sm" />
            </button>
          </div>

          <!-- Instagram -->
          <div
            class="platform-box-minimal"
            :class="{ 'platform-connected': isInstagramConnected }"
          >
            <div class="platform-icon-bg platform-bg-instagram">
              <PlatformLogo platform="instagram" :size="32" />
            </div>
            <span v-if="isInstagramConnected" class="connected-badge-mini">
              <svg class="checkmark-icon-mini" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12L11 14L15 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              {{ $t('connectAccounts.connected') }}
            </span>
            <span v-else class="connect-label" @click="router.push('/connect-accounts')">{{ $t('connectAccounts.connect') }}</span>
            <button
              v-if="isInstagramConnected"
              class="disconnect-btn-top"
              @click.stop="requestDisconnectInstagram"
              :aria-label="$t('connectAccounts.disconnect')"
            >
              <MaterialIcon icon="close" size="sm" />
            </button>
          </div>

          <!-- Wolt (Coming Soon) -->
          <div class="platform-box-minimal platform-disabled">
            <div class="platform-icon-bg platform-bg-wolt">
              <PlatformLogo platform="wolt" :size="32" />
            </div>
            <span class="coming-soon-badge">{{ $t('connectAccounts.comingSoon') }}</span>
          </div>

          <!-- Twitter/X (Coming Soon) -->
          <div class="platform-box-minimal platform-disabled">
            <div class="platform-icon-bg platform-bg-twitter">
              <PlatformLogo platform="twitter" :size="32" />
            </div>
            <span class="coming-soon-badge">{{ $t('connectAccounts.comingSoon') }}</span>
          </div>

          <!-- LinkedIn (Coming Soon) -->
          <div class="platform-box-minimal platform-disabled">
            <div class="platform-icon-bg platform-bg-linkedin">
              <PlatformLogo platform="linkedin" :size="32" />
            </div>
            <span class="coming-soon-badge">{{ $t('connectAccounts.comingSoon') }}</span>
          </div>

          <!-- TikTok (Coming Soon) -->
          <div class="platform-box-minimal platform-disabled">
            <div class="platform-icon-bg platform-bg-tiktok">
              <PlatformLogo platform="tiktok" :size="32" />
            </div>
            <span class="coming-soon-badge">{{ $t('connectAccounts.comingSoon') }}</span>
          </div>

          <!-- YouTube (Coming Soon) -->
          <div class="platform-box-minimal platform-disabled">
            <div class="platform-icon-bg platform-bg-youtube">
              <PlatformLogo platform="youtube" :size="32" />
            </div>
            <span class="coming-soon-badge">{{ $t('connectAccounts.comingSoon') }}</span>
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

    <!-- Disconnect Confirm Modal -->
    <ConfirmModal
      v-model="showDisconnectModal"
      :title="disconnectModalTitle"
      :message="disconnectModalMessage"
      type="danger"
      :confirm-text="$t('connectAccounts.disconnect')"
      :cancel-text="$t('common.cancel')"
      :auto-close-seconds="0"
      @confirm="handleConfirmDisconnect"
      @cancel="handleCancelDisconnect"
    />
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

.action-icon-wrapper {
  margin-bottom: var(--space-md);
  opacity: 0.9;
  transition: var(--transition-base);
}

.action-card:hover .action-icon-wrapper {
  opacity: 1;
  transform: scale(1.05);
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

/* Platforms Grid - Minimal Icon-Only */
.platforms-grid-minimal {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: var(--space-md);
  max-width: 700px; /* Constrains grid to reasonable width for 7 platforms */
}

.platform-box-minimal {
  position: relative;
  aspect-ratio: 1;
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-base);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.platform-box-minimal:hover:not(.platform-disabled) {
  transform: translateY(-4px);
  border-color: var(--gold-primary);
  box-shadow: var(--shadow-lg), var(--glow-gold-sm);
}

.platform-box-minimal.platform-connected {
  border-color: var(--border-color);
  background: var(--bg-secondary);
}

.platform-box-minimal.platform-disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.platform-icon-bg {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform var(--transition-base);
}

.platform-box-minimal:hover:not(.platform-disabled) .platform-icon-bg {
  transform: scale(1.1);
}

/* Connected Badge - Mini version with checkmark */
.connected-badge-mini {
  position: absolute;
  bottom: 6px;
  left: 50%;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px 6px;
  background: rgba(34, 197, 94, 0.15);
  border: 1px solid rgba(34, 197, 94, 0.4);
  border-radius: var(--radius-sm);
  font-size: 9px;
  font-weight: var(--font-bold);
  color: rgb(34, 197, 94);
  text-transform: uppercase;
  letter-spacing: 0.3px;
  white-space: nowrap;
}

.checkmark-icon-mini {
  width: 10px;
  height: 10px;
  color: rgb(34, 197, 94);
  flex-shrink: 0;
}

.connect-label {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 11px;
  font-weight: var(--font-semibold);
  color: var(--gold-primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: var(--transition-fast);
}

.connect-label:hover {
  color: var(--gold-light);
}

/* Disconnect Button (appears on hover, top-right) */
.disconnect-btn-top {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 20px;
  height: 20px;
  background: rgba(220, 53, 69, 0.9);
  border: none;
  border-radius: 50%;
  color: white;
  display: none;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: var(--transition-fast);
  padding: 0;
}

.platform-box-minimal:hover .disconnect-btn-top {
  display: flex;
}

.disconnect-btn-top:hover {
  background: #dc3545;
  transform: scale(1.15);
}

/* Coming Soon Badge */
.coming-soon-badge {
  position: absolute;
  bottom: 6px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 9px;
  font-weight: var(--font-bold);
  padding: 2px 6px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.3px;
  white-space: nowrap;
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
  .actions-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .platforms-grid-minimal {
    grid-template-columns: repeat(7, 1fr);
    max-width: 560px;
    gap: var(--space-sm);
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

  .actions-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .platforms-grid-minimal {
    grid-template-columns: repeat(7, 1fr);
    max-width: 100%;
    gap: var(--space-xs);
  }

  .platform-box-minimal {
    min-width: 40px;
  }

  .platform-icon-bg {
    width: 40px;
    height: 40px;
  }

  .connected-badge-mini,
  .coming-soon-badge {
    font-size: 7px;
    padding: 1px 3px;
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

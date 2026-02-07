<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useFacebookStore } from '../stores/facebook'
import { useInstagramStore } from '../stores/instagram'
import { useBusinessesStore } from '@/stores/businesses'
import { usePreferencesStore } from '@/stores/preferences'
import { getBusinessTypeLabel } from '@/utils/businessTypes'
import DashboardLayout from '../components/DashboardLayout.vue'
import BaseCard from '../components/BaseCard.vue'
import BaseButton from '../components/BaseButton.vue'
import Toast from '../components/Toast.vue'
import ConfirmModal from '../components/ConfirmModal.vue'
import BusinessSelectorModal from '@/components/BusinessSelectorModal.vue'
import MaterialIcon from '@/components/MaterialIcon.vue'
import PlatformLogo from '@/components/PlatformLogo.vue'

const router = useRouter()
const route = useRoute()
const facebookStore = useFacebookStore()
const instagramStore = useInstagramStore()
const businessesStore = useBusinessesStore()
const preferencesStore = usePreferencesStore()
const { t } = useI18n()

const showSuccessToast = ref(false)
const showErrorToast = ref(false)
const toastMessage = ref('')
const errorMessage = ref('')

// Collapsible state
const expandedPlatforms = ref<Set<string>>(new Set())

// Business selector modal
const showBusinessSelector = ref(false)

// Track which platform is actively connecting (local, not store-based)
const activelyConnecting = ref<string | null>(null)

// Confirm modal state
const showConfirmModal = ref(false)
const confirmModalMessage = ref('')
const confirmModalTitle = ref('')
const pendingDisconnect = ref<{
  type: 'facebook' | 'instagram' | 'all-facebook' | 'all-instagram'
  id?: string
  name: string
} | null>(null)

// Computed property to check if Facebook is connected
const isConnected = computed(() => facebookStore.connectedPages.length > 0)

// Computed property to check if Instagram is connected
const isInstagramConnected = computed(() => instagramStore.connectedAccounts.length > 0)

const selectedBusinessId = computed({
  get: () => preferencesStore.selectedBusinessId,
  set: (value: string | null) => preferencesStore.setSelectedBusiness(value),
})

const selectedBusiness = computed(() =>
  businessesStore.businesses.find(business => business.id === selectedBusinessId.value) || null
)

const facebookCount = computed(() => facebookStore.connectedPages.length)
const instagramCount = computed(() => instagramStore.connectedAccounts.length)
const totalConnections = computed(() => facebookCount.value + instagramCount.value)
const facebookPreview = computed(() => facebookStore.connectedPages.slice(0, 3))
const instagramPreview = computed(() => instagramStore.connectedAccounts.slice(0, 3))
const facebookExtra = computed(() => Math.max(0, facebookCount.value - facebookPreview.value.length))
const instagramExtra = computed(() => Math.max(0, instagramCount.value - instagramPreview.value.length))

// Platform cards data-driven rendering
const platformCards = computed(() => [
  {
    key: 'facebook' as const,
    name: t('connectAccounts.facebookPages'),
    platform: 'facebook' as const,
    connected: isConnected.value,
    count: facebookCount.value,
    accounts: facebookStore.connectedPages,
    connecting: activelyConnecting.value === 'facebook',
    preview: facebookPreview.value,
    extra: facebookExtra.value,
    onConnect: handleConnectFacebook,
    onDisconnectAll: () => requestDisconnectAll('facebook'),
    onDisconnect: (id: string, name: string) => requestDisconnectPage(id, name),
    getId: (a: any) => a.pageId,
    getName: (a: any) => a.pageName,
    getAvatar: (a: any) => a.profilePictureUrl,
  },
  {
    key: 'instagram' as const,
    name: t('connectAccounts.instagramBusiness'),
    platform: 'instagram' as const,
    connected: isInstagramConnected.value,
    count: instagramCount.value,
    accounts: instagramStore.connectedAccounts,
    connecting: activelyConnecting.value === 'instagram',
    preview: instagramPreview.value,
    extra: instagramExtra.value,
    onConnect: handleConnectInstagram,
    onDisconnectAll: () => requestDisconnectAll('instagram'),
    onDisconnect: (id: string, name: string) => requestDisconnectInstagramAccount(id, name),
    getId: (a: any) => a.instagramAccountId,
    getName: (a: any) => `@${a.username}`,
    getAvatar: (a: any) => a.profilePictureUrl,
  },
])

const comingSoonPlatforms = [
  { key: 'tiktok', name: 'TikTok', platform: 'tiktok' as const },
  { key: 'twitter', name: 'X (Twitter)', platform: 'twitter' as const },
  { key: 'linkedin', name: 'LinkedIn', platform: 'linkedin' as const },
  { key: 'pinterest', name: 'Pinterest', platform: 'pinterest' as const },
  { key: 'youtube', name: 'YouTube', platform: 'youtube' as const },
]

function handleBusinessSelected(business: { id: string }) {
  selectedBusinessId.value = business.id
}

onMounted(async () => {
  if (!businessesStore.businesses.length) {
    await businessesStore.fetchBusinesses()
  }

  if (!selectedBusinessId.value && businessesStore.businesses.length > 0) {
    preferencesStore.setSelectedBusiness(businessesStore.businesses[0].id)
  }

  // Load connected Facebook pages and Instagram accounts on mount
  await Promise.all([
    facebookStore.loadConnectedPages(selectedBusinessId.value || undefined),
    instagramStore.loadConnectedAccounts(selectedBusinessId.value || undefined),
  ])

  // Check if we just came back from a successful connection
  const urlParams = new URLSearchParams(window.location.search)
  if (urlParams.has('connected')) {
    // Get which platform was just connected
    const connectedPlatform = localStorage.getItem('oauth_platform')

    // Determine the count and platform name based on which platform was connected
    let count = 0
    let messageKey = 'connectAccounts.successfullyConnected'

    if (connectedPlatform === 'facebook') {
      count = facebookStore.connectedPages.length
      messageKey = 'connectAccounts.successfullyConnectedFacebook'
    } else if (connectedPlatform === 'instagram') {
      count = instagramStore.connectedAccounts.length
      messageKey = 'connectAccounts.successfullyConnectedInstagram'
    }

    if (count > 0) {
      // Check if we have a returnTo URL stored in localStorage (from before OAuth redirect)
      const storedReturnTo = localStorage.getItem('oauth_return_to')
      if (storedReturnTo) {
        // Clear the stored URL
        localStorage.removeItem('oauth_return_to')
        localStorage.removeItem('oauth_platform')
        // Redirect back to the original page after successful connection
        router.replace(decodeURIComponent(storedReturnTo))
        return
      }

      toastMessage.value = t(messageKey, { count })
      showSuccessToast.value = true
      // Clean up URL and localStorage
      localStorage.removeItem('oauth_platform')
      window.history.replaceState({}, '', '/connect-accounts')
    }
  }
})

watch(selectedBusinessId, async (newBusinessId, oldBusinessId) => {
  if (newBusinessId === oldBusinessId) return
  if (newBusinessId) {
    facebookStore.ensureBusinessCache(newBusinessId)
    instagramStore.ensureBusinessCache(newBusinessId)
  }
  activelyConnecting.value = null
  facebookStore.resetConnectionState()
  instagramStore.resetConnectionState()
  localStorage.removeItem('oauth_platform')
  localStorage.removeItem('oauth_return_to')
  localStorage.removeItem('oauth_return_url')
  expandedPlatforms.value = new Set()
  await Promise.all([
    facebookStore.loadConnectedPages(newBusinessId || undefined),
    instagramStore.loadConnectedAccounts(newBusinessId || undefined),
  ])
})

function ensureBusinessSelected(): string | null {
  if (!selectedBusinessId.value) {
    errorMessage.value = t('connectAccounts.selectBusinessFirst')
    showErrorToast.value = true
    return null
  }

  return selectedBusinessId.value
}

async function handleConnectFacebook() {
  showSuccessToast.value = false
  showErrorToast.value = false

  try {
    const businessId = ensureBusinessSelected()
    if (!businessId) return

    activelyConnecting.value = 'facebook'

    // Store returnTo URL before OAuth redirect if present
    const returnTo = route.query.returnTo as string
    if (returnTo) {
      localStorage.setItem('oauth_return_to', returnTo)
    }

    // Store which platform is being connected
    localStorage.setItem('oauth_platform', 'facebook')

    // This will redirect to Facebook - no success message needed here
    // Success message will be shown after OAuth callback when returning to this page
    await facebookStore.connectFacebook(undefined, businessId)
  } catch (error: any) {
    activelyConnecting.value = null
    errorMessage.value = facebookStore.error || t('connectAccounts.errorOccurred')
    showErrorToast.value = true
  }
}

function requestDisconnectPage(pageId: string, pageName: string) {
  pendingDisconnect.value = { type: 'facebook', id: pageId, name: pageName }
  confirmModalTitle.value = t('connectAccounts.disconnectTitle')
  confirmModalMessage.value = t('connectAccounts.confirmDisconnect', { name: pageName })
  showConfirmModal.value = true
}

async function executeDisconnectPage(pageId: string, pageName: string) {
  showSuccessToast.value = false
  showErrorToast.value = false

  try {
    const businessId = ensureBusinessSelected()
    if (!businessId) return

    await facebookStore.disconnectPage(pageId, businessId)
    toastMessage.value = t('connectAccounts.successfullyDisconnected', { name: pageName })
    showSuccessToast.value = true
  } catch (error: any) {
    errorMessage.value = facebookStore.error || t('connectAccounts.errorOccurred')
    showErrorToast.value = true
  }
}

async function handleConnectInstagram() {
  showSuccessToast.value = false
  showErrorToast.value = false

  try {
    const businessId = ensureBusinessSelected()
    if (!businessId) return

    activelyConnecting.value = 'instagram'

    // Store returnTo URL before OAuth redirect if present
    const returnTo = route.query.returnTo as string
    if (returnTo) {
      localStorage.setItem('oauth_return_to', returnTo)
    }

    // Store which platform is being connected
    localStorage.setItem('oauth_platform', 'instagram')

    await instagramStore.connectInstagram(undefined, businessId)
  } catch (error: any) {
    activelyConnecting.value = null
    errorMessage.value = instagramStore.error || t('connectAccounts.errorOccurred')
    showErrorToast.value = true
  }
}

function requestDisconnectInstagramAccount(accountId: string, username: string) {
  pendingDisconnect.value = { type: 'instagram', id: accountId, name: `@${username}` }
  confirmModalTitle.value = t('connectAccounts.disconnectTitle')
  confirmModalMessage.value = t('connectAccounts.confirmDisconnect', { name: `@${username}` })
  showConfirmModal.value = true
}

async function executeDisconnectInstagramAccount(accountId: string, username: string) {
  showSuccessToast.value = false
  showErrorToast.value = false

  try {
    const businessId = ensureBusinessSelected()
    if (!businessId) return

    await instagramStore.disconnectAccount(accountId, businessId)
    toastMessage.value = t('connectAccounts.successfullyDisconnected', { name: `@${username}` })
    showSuccessToast.value = true
  } catch (error: any) {
    errorMessage.value = instagramStore.error || t('connectAccounts.errorOccurred')
    showErrorToast.value = true
  }
}

// Handle confirm from modal
async function handleConfirmDisconnect() {
  showConfirmModal.value = false

  if (!pendingDisconnect.value) return

  const { type, id, name } = pendingDisconnect.value

  if (type === 'all-facebook') {
    await executeDisconnectAll('facebook')
  } else if (type === 'all-instagram') {
    await executeDisconnectAll('instagram')
  } else if (type === 'facebook' && id) {
    await executeDisconnectPage(id, name)
  } else if (type === 'instagram' && id) {
    await executeDisconnectInstagramAccount(id, name.replace('@', ''))
  }

  pendingDisconnect.value = null
}

function handleCancelDisconnect() {
  showConfirmModal.value = false
  pendingDisconnect.value = null
}

// Toggle platform expanded state
function togglePlatform(platform: string) {
  if (expandedPlatforms.value.has(platform)) {
    expandedPlatforms.value.delete(platform)
  } else {
    expandedPlatforms.value.add(platform)
  }
}

// Request disconnect all accounts for a platform
function requestDisconnectAll(type: 'facebook' | 'instagram') {
  let count = 0
  let platformName = ''

  if (type === 'facebook') {
    count = facebookStore.connectedPages.length
    platformName = t('connectAccounts.facebookPages')
  } else if (type === 'instagram') {
    count = instagramStore.connectedAccounts.length
    platformName = t('connectAccounts.instagramBusiness')
  }

  pendingDisconnect.value = { type: `all-${type}` as any, name: platformName }
  confirmModalTitle.value = t('connectAccounts.disconnectAllTitle')
  confirmModalMessage.value = t('connectAccounts.confirmDisconnectAll', { platform: platformName, count })
  showConfirmModal.value = true
}

// Execute disconnect all accounts for a platform
async function executeDisconnectAll(type: 'facebook' | 'instagram') {
  showSuccessToast.value = false
  showErrorToast.value = false

  try {
    const businessId = ensureBusinessSelected()
    if (!businessId) return

    if (type === 'facebook') {
      const pages = [...facebookStore.connectedPages]
      for (const page of pages) {
        await facebookStore.disconnectPage(page.pageId, businessId)
      }
      toastMessage.value = t('connectAccounts.successfullyDisconnectedAll', { count: pages.length })
    } else if (type === 'instagram') {
      const accounts = [...instagramStore.connectedAccounts]
      for (const account of accounts) {
        await instagramStore.disconnectAccount(account.instagramAccountId, businessId)
      }
      toastMessage.value = t('connectAccounts.successfullyDisconnectedAll', { count: accounts.length })
    }
    showSuccessToast.value = true
  } catch (error: any) {
    errorMessage.value = t('connectAccounts.errorOccurred')
    showErrorToast.value = true
  }
}
</script>

<template>
  <DashboardLayout>
    <div class="connect-accounts-view">
      <div class="container">
        <!-- Section 1: Hero Header -->
        <header class="page-header section-animate" style="--stagger: 0">
          <h1>{{ $t('connectAccounts.pageTitle') }}</h1>
          <p class="subtitle">{{ $t('connectAccounts.pageSubtitle') }}</p>
          <div class="header-divider" />
        </header>

        <!-- Section 2: Business Showcase -->
        <BaseCard variant="glass" class="business-showcase section-animate" style="--stagger: 1">
          <div class="showcase-layout">
            <div class="showcase-identity">
              <div class="active-indicator">
                <span class="active-dot" />
                <span class="eyebrow">{{ $t('connectAccounts.activeBusiness') }}</span>
              </div>
              <div class="identity-row">
                <div class="business-avatar-large">
                  <img
                    v-if="selectedBusiness?.logo_url || selectedBusiness?.brand_dna?.logo_url"
                    :src="selectedBusiness?.logo_url || selectedBusiness?.brand_dna?.logo_url"
                    :alt="selectedBusiness?.name"
                  />
                  <span v-else class="avatar-fallback">
                    {{ selectedBusiness?.name?.charAt(0)?.toUpperCase() || 'B' }}
                  </span>
                </div>
                <div class="identity-text">
                  <h2>{{ selectedBusiness?.name || $t('connectAccounts.selectABusiness') }}</h2>
                  <div class="business-meta">
                    <span v-if="selectedBusiness" class="type-pill">
                      {{ getBusinessTypeLabel(selectedBusiness.business_type) }}
                    </span>
                    <span v-else class="type-pill muted">{{ $t('connectAccounts.noBusinessSelected') }}</span>
                    <template v-if="selectedBusiness?.address">
                      <span class="meta-divider">
                        <MaterialIcon icon="location_on" size="xs" />
                      </span>
                      <span class="meta-text">{{ selectedBusiness.address }}</span>
                    </template>
                  </div>
                </div>
              </div>
            </div>

            <div class="showcase-actions">
              <span v-if="businessesStore.businesses.length > 1" class="business-counter">
                {{ $t('connectAccounts.businessCount', {
                  current: (businessesStore.businesses.findIndex(b => b.id === selectedBusinessId) + 1) || 1,
                  total: businessesStore.businesses.length
                }) }}
              </span>
              <BaseButton
                variant="secondary"
                size="small"
                :disabled="!businessesStore.businesses.length"
                @click="showBusinessSelector = true"
              >
                <MaterialIcon icon="swap_horiz" size="sm" />
                {{ $t('connectAccounts.switchBusiness') }}
              </BaseButton>
              <BaseButton
                variant="ghost"
                size="small"
                @click="router.push('/businesses')"
              >
                <MaterialIcon icon="settings" size="sm" />
                {{ $t('connectAccounts.manageAll') }}
              </BaseButton>
            </div>
          </div>
        </BaseCard>

        <!-- Section 3: Quick Stats Bar -->
        <div class="stats-grid section-animate" style="--stagger: 2">
          <BaseCard variant="glass" class="stat-card" style="--card-stagger: 0">
            <div class="stat-icon">
              <MaterialIcon icon="link" size="lg" />
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ totalConnections }}</span>
              <span class="stat-label">{{ $t('connectAccounts.totalConnections') }}</span>
            </div>
          </BaseCard>
          <BaseCard variant="glass" class="stat-card" style="--card-stagger: 1">
            <div class="stat-icon">
              <PlatformLogo platform="facebook" :size="32" />
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ facebookCount }}</span>
              <span class="stat-label">{{ $t('connectAccounts.facebookPagesCount') }}</span>
            </div>
          </BaseCard>
          <BaseCard variant="glass" class="stat-card" style="--card-stagger: 2">
            <div class="stat-icon">
              <PlatformLogo platform="instagram" :size="32" />
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ instagramCount }}</span>
              <span class="stat-label">{{ $t('connectAccounts.instagramAccountsCount') }}</span>
            </div>
          </BaseCard>
        </div>

        <!-- Section 4: Connected Platforms List -->
        <section class="platforms-section section-animate" style="--stagger: 3">
          <div class="platforms-header">
            <h2>{{ $t('connectAccounts.connectedPlatforms') }}</h2>
            <p v-if="selectedBusiness">{{ $t('connectAccounts.platformsFor', { name: selectedBusiness.name }) }}</p>
            <p v-else>{{ $t('connectAccounts.chooseBusiness') }}</p>
          </div>

          <div class="platforms-list">
            <!-- Active Platforms (Facebook, Instagram) -->
            <div
              v-for="pc in platformCards"
              :key="pc.key"
              class="platform-section"
              :class="{ expanded: expandedPlatforms.has(pc.key), connected: pc.connected }"
            >
              <div
                class="platform-header"
                :class="{ clickable: pc.connected }"
                @click="pc.connected ? togglePlatform(pc.key) : null"
              >
                <div class="platform-icon-wrap">
                  <PlatformLogo :platform="pc.platform" :size="48" />
                  <span v-if="pc.connected" class="connected-indicator" />
                </div>
                <div class="platform-info">
                  <h3>{{ pc.name }}</h3>
                  <span v-if="pc.connected" class="connection-count connected">
                    <MaterialIcon icon="check_circle" size="xs" />
                    {{ $t('connectAccounts.accountsConnected', { count: pc.count }) }}
                  </span>
                  <span v-else class="connection-count">{{ $t('connectAccounts.notConnected') }}</span>
                </div>
                <div v-if="pc.connected" class="expand-chevron" :class="{ rotated: expandedPlatforms.has(pc.key) }">
                  <MaterialIcon icon="expand_more" size="md" />
                </div>
                <div class="platform-actions" @click.stop>
                  <BaseButton
                    variant="primary"
                    size="small"
                    :disabled="pc.connecting"
                    @click="pc.onConnect"
                  >
                    {{ pc.connecting ? $t('connectAccounts.connecting') : $t('connectAccounts.connect') }}
                  </BaseButton>
                </div>
              </div>

              <!-- Connected accounts list (expanded) -->
              <div v-if="pc.connected && expandedPlatforms.has(pc.key)" class="connected-accounts-list">
                <div
                  v-for="account in pc.accounts"
                  :key="pc.getId(account)"
                  class="connected-account-item"
                >
                  <img
                    v-if="pc.getAvatar(account)"
                    :src="pc.getAvatar(account)"
                    :alt="pc.getName(account)"
                    class="profile-picture"
                  />
                  <div v-else class="profile-picture-placeholder">
                    {{ pc.getName(account)?.charAt(0)?.toUpperCase() || '?' }}
                  </div>
                  <div class="account-details">
                    <span class="account-name">{{ pc.getName(account) }}</span>
                    <span class="account-id">ID: {{ pc.getId(account) }}</span>
                  </div>
                  <BaseButton
                    variant="danger"
                    size="small"
                    :disabled="pc.connecting"
                    class="disconnect-btn"
                    @click="pc.onDisconnect(pc.getId(account), pc.getName(account))"
                  >
                    {{ $t('connectAccounts.disconnect') }}
                  </BaseButton>
                </div>

                <!-- Connect More + Disconnect All -->
                <div class="expanded-footer">
                  <BaseButton
                    variant="ghost"
                    size="small"
                    :disabled="pc.connecting"
                    class="connect-more-btn"
                    @click="pc.onConnect"
                  >
                    <MaterialIcon icon="add" size="sm" />
                    {{ pc.connecting ? $t('connectAccounts.connecting') : $t('connectAccounts.connectMore') }}
                  </BaseButton>
                  <BaseButton
                    v-if="pc.count > 1"
                    variant="ghost"
                    size="small"
                    :disabled="pc.connecting"
                    class="disconnect-all-btn"
                    @click="pc.onDisconnectAll"
                  >
                    {{ $t('connectAccounts.disconnectAll') }}
                  </BaseButton>
                </div>
              </div>
            </div>

            <!-- Coming Soon Platforms -->
            <div
              v-for="cs in comingSoonPlatforms"
              :key="cs.key"
              class="platform-section disabled"
            >
              <div class="platform-header">
                <div class="platform-icon-wrap">
                  <PlatformLogo :platform="cs.platform" :size="48" />
                </div>
                <div class="platform-info">
                  <h3>{{ cs.name }}</h3>
                </div>
                <div class="platform-actions">
                  <span class="coming-soon-badge">{{ $t('connectAccounts.comingSoon') }}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Business Selector Modal -->
        <BusinessSelectorModal
          v-model="showBusinessSelector"
          :businesses="businessesStore.businesses"
          :current-id="selectedBusinessId || undefined"
          @select="handleBusinessSelected"
        />

        <!-- Toast Notifications -->
        <Toast
          v-model="showSuccessToast"
          :message="toastMessage"
          type="success"
          :duration="4000"
        />
        <Toast
          v-model="showErrorToast"
          :message="errorMessage"
          type="error"
          :duration="5000"
        />

        <!-- Confirm Disconnect Modal -->
        <ConfirmModal
          v-model="showConfirmModal"
          :title="confirmModalTitle"
          :message="confirmModalMessage"
          type="danger"
          :confirm-text="$t('connectAccounts.disconnect')"
          :cancel-text="$t('common.cancel')"
          :auto-close-seconds="0"
          @confirm="handleConfirmDisconnect"
          @cancel="handleCancelDisconnect"
        />
      </div>
    </div>
  </DashboardLayout>
</template>

<style scoped>
/* Animations */
@keyframes fadeSlideUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.section-animate {
  animation: fadeSlideUp 0.5s ease both;
  animation-delay: calc(var(--stagger, 0) * 80ms);
}

/* Layout */
.connect-accounts-view {
  min-height: 100vh;
  min-height: 100dvh;
  padding: var(--space-2xl) var(--space-lg);
  width: 100%;
  max-width: 100vw;
  overflow-x: hidden;
}

.container {
  max-width: var(--max-width-xl);
  margin: 0 auto;
}

/* Section 1: Hero Header */
.page-header {
  margin-bottom: var(--space-2xl);
  text-align: left;
}

.page-header h1 {
  font-family: var(--font-heading);
  font-size: var(--text-3xl);
  margin-bottom: var(--space-sm);
  background: var(--gradient-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  font-size: var(--text-lg);
  color: var(--text-secondary);
  max-width: 620px;
  margin: 0 0 var(--space-lg);
}

.header-divider {
  height: 2px;
  width: 80px;
  background: var(--gradient-gold);
  border-radius: var(--radius-full);
}

/* Section 2: Business Showcase */
.business-showcase {
  padding: var(--space-xl);
  margin-bottom: var(--space-xl);
}

.showcase-layout {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-xl);
}

.showcase-identity {
  flex: 1;
  min-width: 0;
}

.active-indicator {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}

.active-dot {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
  background: var(--gold-primary);
  animation: pulse 2s ease-in-out infinite;
  box-shadow: 0 0 0 3px rgba(15, 61, 46, 0.2);
}

.eyebrow {
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
  font-weight: var(--font-medium);
}

.identity-row {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
}

.business-avatar-large {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-xl);
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
  border: 2px solid var(--glass-border);
  box-shadow: 0 4px 12px rgba(15, 61, 46, 0.08);
}

.business-avatar-large img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-fallback {
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  color: var(--text-secondary);
}

.identity-text h2 {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  color: var(--text-primary);
  margin: 0 0 var(--space-xs);
}

.business-meta {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex-wrap: wrap;
  color: var(--text-secondary);
  font-size: var(--text-sm);
}

.type-pill {
  display: inline-flex;
  align-items: center;
  padding: var(--space-2xs) var(--space-sm);
  border-radius: var(--radius-full);
  background: rgba(15, 61, 46, 0.08);
  color: var(--text-primary);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
}

.type-pill.muted {
  background: rgba(15, 61, 46, 0.05);
  color: var(--text-muted);
}

.meta-divider {
  color: var(--text-muted);
  display: flex;
  align-items: center;
}

.meta-text {
  color: var(--text-secondary);
}

.showcase-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-sm);
  flex-shrink: 0;
}

.business-counter {
  font-size: var(--text-sm);
  color: var(--text-muted);
  font-weight: var(--font-medium);
}

.showcase-actions :deep(.base-button) {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
}

/* Section 3: Quick Stats Bar */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-lg);
  margin-bottom: var(--space-xl);
}

.stat-card {
  padding: var(--space-lg);
  display: flex;
  align-items: center;
  gap: var(--space-md);
  animation: fadeSlideUp 0.5s ease both;
  animation-delay: calc((var(--stagger, 2) * 80ms) + (var(--card-stagger, 0) * 60ms));
}

.stat-icon {
  color: var(--gold-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xs);
}

.stat-value {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  background: var(--gradient-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-label {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

/* Section 4: Platforms Grid */
.platforms-section {
  margin-bottom: var(--space-2xl);
}

.platforms-header {
  margin-bottom: var(--space-lg);
}

.platforms-header h2 {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  color: var(--text-primary);
  margin-bottom: var(--space-xs);
}

.platforms-header p {
  color: var(--text-secondary);
  font-size: var(--text-sm);
  margin: 0;
}

/* Platforms List (vertical accordion — modern) */
.platforms-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.platform-section {
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  transition: border-color var(--transition-base), box-shadow var(--transition-base);
}

.platform-section:hover {
  border-color: rgba(15, 61, 46, 0.18);
}

.platform-section.connected {
  border-color: rgba(15, 61, 46, 0.2);
  box-shadow: 0 2px 12px rgba(15, 61, 46, 0.06);
}

.platform-section.expanded {
  box-shadow: 0 4px 20px rgba(15, 61, 46, 0.08);
}

/* Platform icon wrapper with connected dot */
.platform-icon-wrap {
  position: relative;
  flex-shrink: 0;
}

.platform-icon-wrap :deep(.platform-logo.with-background) {
  border-radius: var(--radius-lg);
}

.connected-indicator {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 14px;
  height: 14px;
  border-radius: var(--radius-full);
  background: var(--gold-primary);
  border: 2.5px solid var(--bg-secondary);
  box-shadow: 0 0 0 1px rgba(15, 61, 46, 0.1);
}

.platform-header {
  display: flex;
  align-items: center;
  padding: var(--space-lg) var(--space-xl);
  gap: var(--space-lg);
  transition: background var(--transition-base);
}

.platform-header.clickable {
  cursor: pointer;
}

.platform-header.clickable:hover {
  background: rgba(15, 61, 46, 0.03);
}

.platform-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.platform-info h3 {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0;
}

.connection-count {
  font-size: var(--text-xs);
  color: var(--text-muted);
  font-weight: var(--font-normal);
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
}

.connection-count.connected {
  color: var(--gold-primary);
}

.connection-count.connected :deep(.material-symbols-outlined) {
  font-size: 14px;
}

/* Expand Chevron */
.expand-chevron {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  border-radius: var(--radius-full);
  transition: background var(--transition-base);
}

.platform-header.clickable:hover .expand-chevron {
  background: rgba(15, 61, 46, 0.06);
  color: var(--text-secondary);
}

.expand-chevron :deep(.material-symbols-outlined) {
  transition: transform var(--transition-base);
}

.expand-chevron.rotated :deep(.material-symbols-outlined) {
  transform: rotate(180deg);
}

/* Platform Actions (connect/disconnect buttons) */
.platform-actions {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex-shrink: 0;
}

.platform-actions :deep(.base-button) {
  min-width: auto;
  height: auto;
  padding: var(--space-xs) var(--space-lg);
  font-size: var(--text-sm);
  border-radius: var(--radius-full);
}

.platform-actions :deep(.base-button.button-primary) {
  min-width: 110px;
  height: 36px;
}

.platform-actions :deep(.base-button.button-danger) {
  min-width: 110px;
  height: 36px;
  background: transparent !important;
  border: 1px solid var(--error-border) !important;
  color: var(--error-text) !important;
}

.platform-actions :deep(.base-button.button-danger:hover) {
  background: var(--error-bg) !important;
}

/* Connected Accounts List (expanded) */
.connected-accounts-list {
  border-top: 1px solid var(--glass-border);
  padding: var(--space-sm) 0;
}

.connected-account-item {
  display: flex;
  align-items: center;
  padding: var(--space-md) var(--space-xl);
  gap: var(--space-md);
  transition: background var(--transition-base);
}

.connected-account-item:hover {
  background: rgba(15, 61, 46, 0.03);
}

.profile-picture {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  object-fit: cover;
  border: 2px solid var(--glass-border);
  flex-shrink: 0;
}

.profile-picture-placeholder {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  flex-shrink: 0;
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
}

.account-details {
  display: flex;
  flex-direction: column;
  gap: 1px;
  flex: 1;
  min-width: 0;
}

.account-name {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-primary);
}

.account-id {
  font-size: var(--text-xs);
  color: var(--text-muted);
  font-family: var(--font-mono, monospace);
}

.disconnect-btn {
  flex-shrink: 0;
  margin-left: auto;
}

.disconnect-btn :deep(.base-button) {
  border-radius: var(--radius-full);
}

/* Expanded footer (connect more + disconnect all) */
.expanded-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-sm) var(--space-xl) var(--space-md);
  border-top: 1px solid var(--glass-border);
}

.connect-more-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  color: var(--gold-primary);
  font-weight: var(--font-medium);
  font-size: var(--text-sm);
}

.disconnect-all-btn {
  color: var(--error-text);
  font-size: var(--text-xs);
}

/* Coming Soon / Disabled */
.platform-section.disabled {
  opacity: 0.5;
  background: var(--bg-tertiary);
  border-color: transparent;
}

.platform-section.disabled:hover {
  border-color: transparent;
}

.platform-section.disabled :deep(.platform-logo) {
  filter: grayscale(40%);
}

.coming-soon-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-xs) var(--space-md);
  background: rgba(15, 61, 46, 0.04);
  border: none;
  color: var(--text-muted);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  border-radius: var(--radius-full);
  white-space: nowrap;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

/* Responsive */
@media (max-width: 768px) {
  .showcase-layout {
    flex-direction: column;
    align-items: flex-start;
  }

  .showcase-actions {
    align-items: flex-start;
    flex-direction: row;
    flex-wrap: wrap;
    width: 100%;
  }

  .identity-row {
    gap: var(--space-md);
  }

  .business-avatar-large {
    width: 64px;
    height: 64px;
  }

  .identity-text h2 {
    font-size: var(--text-xl);
  }

  .platform-header {
    padding: var(--space-lg);
    flex-wrap: wrap;
    gap: var(--space-md);
  }

  .platform-info {
    flex: 1 1 auto;
    min-width: 0;
  }

  .platform-actions {
    order: 3;
    width: 100%;
    margin-left: 0;
    justify-content: flex-end;
    margin-top: var(--space-xs);
  }

  .connected-account-item {
    padding: var(--space-md) var(--space-lg);
    flex-wrap: wrap;
  }

  .disconnect-btn {
    width: 100%;
    margin-top: var(--space-sm);
  }

  .expanded-footer {
    padding: var(--space-sm) var(--space-lg) var(--space-md);
  }
}

@media (max-width: 540px) {
  .connect-accounts-view {
    padding: var(--space-xl) var(--space-md);
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .business-avatar-large {
    width: 56px;
    height: 56px;
  }

  .profile-picture,
  .profile-picture-placeholder {
    width: 36px;
    height: 36px;
  }

  .expand-chevron {
    display: none;
  }
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
</style>

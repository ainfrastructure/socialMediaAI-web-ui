<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useFacebookStore } from '../stores/facebook'
import BaseCard from '../components/BaseCard.vue'
import BaseButton from '../components/BaseButton.vue'
import BaseAlert from '../components/BaseAlert.vue'

const router = useRouter()
const facebookStore = useFacebookStore()
const { t } = useI18n()

const showSuccessMessage = ref(false)
const showErrorMessage = ref(false)
const successMessage = ref('')

// Computed property to check if Facebook is connected
const isConnected = computed(() => facebookStore.connectedPages.length > 0)

// Total connected accounts across all platforms
const totalConnectedAccounts = computed(() => facebookStore.connectedPages.length)

onMounted(async () => {
  // Load connected Facebook pages on mount
  await facebookStore.loadConnectedPages()

  // Check if we just came back from a successful connection
  // The callback handler sets this in the store
  if (facebookStore.connectedPages.length > 0 && !showSuccessMessage.value) {
    // Show success message if we have pages (might be from a fresh connection)
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.has('connected')) {
      successMessage.value = t('connectAccounts.successfullyConnected', { count: facebookStore.connectedPages.length })
      showSuccessMessage.value = true
      // Clean up URL
      window.history.replaceState({}, '', '/connect-accounts')
    }
  }
})

async function handleConnectFacebook() {
  showSuccessMessage.value = false
  showErrorMessage.value = false

  try {
    await facebookStore.connectFacebook()
    successMessage.value = t('connectAccounts.successfullyConnected', { count: facebookStore.connectedPages.length })
    showSuccessMessage.value = true
  } catch (error: any) {
    showErrorMessage.value = true
  }
}

async function handleDisconnectPage(pageId: string, pageName: string) {
  if (!confirm(t('connectAccounts.confirmDisconnect', { name: pageName }))) {
    return
  }

  showSuccessMessage.value = false
  showErrorMessage.value = false

  try {
    await facebookStore.disconnectPage(pageId)
    successMessage.value = t('connectAccounts.successfullyDisconnected', { name: pageName })
    showSuccessMessage.value = true
  } catch (error: any) {
    showErrorMessage.value = true
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return t('connectAccounts.justNow')
  if (diffInSeconds < 3600) return t('connectAccounts.minutesAgo', { count: Math.floor(diffInSeconds / 60) })
  if (diffInSeconds < 86400) return t('connectAccounts.hoursAgo', { count: Math.floor(diffInSeconds / 3600) })
  if (diffInSeconds < 604800) return t('connectAccounts.daysAgo', { count: Math.floor(diffInSeconds / 86400) })

  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

const comingSoonPlatforms = [
  { name: 'Instagram', icon: '📷', color: '#E4405F' },
  { name: 'Twitter/X', icon: '𝕏', color: '#1DA1F2' },
  { name: 'LinkedIn', icon: '💼', color: '#0077B5' },
  { name: 'TikTok', icon: '🎵', color: '#000000' },
  { name: 'YouTube', icon: '▶️', color: '#FF0000' },
]
</script>

<template>
  <div class="connect-accounts-view">
    <div class="container">
      <!-- Back Navigation -->
      <div class="back-nav">
        <BaseButton variant="ghost" size="small" @click="router.back()">
          ← {{ $t('connectAccounts.back') }}
        </BaseButton>
      </div>

      <header class="page-header">
        <h1>{{ $t('connectAccounts.pageTitle') }}</h1>
        <p class="subtitle">
          {{ $t('connectAccounts.pageSubtitle') }}
        </p>

        <!-- Stats Summary -->
        <div v-if="totalConnectedAccounts > 0" class="stats-summary">
          <div class="stat-item">
            <span class="stat-value">{{ totalConnectedAccounts }}</span>
            <span class="stat-label">{{ $t('connectAccounts.accountsConnected', { count: totalConnectedAccounts }) }}</span>
          </div>
        </div>
      </header>

      <!-- Success/Error Messages -->
      <BaseAlert v-if="showSuccessMessage" type="success" @close="showSuccessMessage = false">
        <div class="alert-with-action">
          <p>{{ successMessage }}</p>
          <BaseButton variant="primary" size="small" @click="router.push('/playground')" style="margin-top: 12px;">
            {{ $t('connectAccounts.continueToPlayground') }}
          </BaseButton>
        </div>
      </BaseAlert>

      <BaseAlert v-if="showErrorMessage" type="error" @close="showErrorMessage = false">
        {{ facebookStore.error || $t('connectAccounts.errorOccurred') }}
      </BaseAlert>

      <!-- Facebook Section -->
      <section class="platform-section">
        <h2>{{ $t('connectAccounts.facebook') }}</h2>

        <BaseCard variant="glass" class="platform-card" :class="{ 'connected': isConnected }">
          <div class="platform-content">
            <div class="platform-icon facebook-icon">f</div>
            <div class="platform-info">
              <h3>{{ $t('connectAccounts.facebookPages') }}</h3>
              <p>
                {{ $t('connectAccounts.facebookDescription') }}
              </p>
              <!-- Connection Status Badge -->
              <div v-if="isConnected" class="connection-status-badge">
                <svg class="checkmark-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span>{{ $t('connectAccounts.connected') }}</span>
              </div>
            </div>
            <BaseButton
              @click="handleConnectFacebook"
              :variant="isConnected ? 'secondary' : 'primary'"
              :disabled="facebookStore.loading"
              class="connect-button"
            >
              {{ facebookStore.loading ? $t('connectAccounts.connecting') : (isConnected ? $t('connectAccounts.reconnect') : $t('connectAccounts.connectToFacebook')) }}
            </BaseButton>
          </div>

          <!-- Connected Pages List -->
          <div v-if="facebookStore.connectedPages.length > 0" class="connected-pages">
            <h4>{{ $t('connectAccounts.connectedPages') }}</h4>
            <div class="pages-list">
              <div
                v-for="page in facebookStore.connectedPages"
                :key="page.id"
                class="page-item"
              >
                <div class="page-info">
                  <div class="page-icon">f</div>
                  <div class="page-details">
                    <span class="page-name">{{ page.pageName }}</span>
                    <span class="page-meta">{{ $t('connectAccounts.connectedTime', { time: formatDate(page.connectedAt) }) }}</span>
                  </div>
                </div>
                <BaseButton
                  @click="handleDisconnectPage(page.pageId, page.pageName)"
                  variant="danger"
                  size="small"
                  :disabled="facebookStore.loading"
                >
                  {{ $t('connectAccounts.disconnect') }}
                </BaseButton>
              </div>
            </div>
          </div>
        </BaseCard>
      </section>

      <!-- Coming Soon Section -->
      <section class="platform-section">
        <h2>{{ $t('connectAccounts.comingSoon') }}</h2>

        <div class="coming-soon-grid">
          <BaseCard
            v-for="platform in comingSoonPlatforms"
            :key="platform.name"
            variant="glass"
            class="platform-card disabled coming-soon-card"
          >
            <div class="coming-soon-content">
              <div class="coming-soon-header">
                <div class="platform-icon" :style="{ backgroundColor: platform.color }">
                  {{ platform.icon }}
                </div>
                <div class="platform-info">
                  <h3>{{ platform.name }}</h3>
                  <span class="coming-soon-badge">{{ $t('connectAccounts.comingSoon') }}</span>
                </div>
              </div>
            </div>
          </BaseCard>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.connect-accounts-view {
  min-height: 100vh;
  padding: var(--space-2xl) var(--space-lg);
}

.container {
  max-width: var(--max-width-xl);
  margin: 0 auto;
}

.back-nav {
  margin-bottom: var(--space-xl);
}

.page-header {
  margin-bottom: var(--space-2xl);
  text-align: center;
}

.page-header h1 {
  font-family: var(--font-heading);
  font-size: var(--font-size-3xl);
  color: var(--text-primary);
  margin-bottom: var(--space-sm);
  background: linear-gradient(135deg, var(--gold-primary), var(--gold-light));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  font-size: var(--font-size-lg);
  color: var(--text-secondary);
  max-width: 600px;
  margin: 0 auto;
}

.stats-summary {
  margin-top: var(--space-xl);
  display: flex;
  justify-content: center;
  gap: var(--space-2xl);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-lg) var(--space-2xl);
  background: rgba(212, 175, 55, 0.1);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: var(--radius-lg);
}

.stat-value {
  font-family: var(--font-heading);
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  color: var(--gold-primary);
}

.stat-label {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.alert-with-action p {
  margin: 0 0 4px 0;
  font-weight: var(--font-semibold);
}

.platform-section {
  margin-bottom: var(--space-2xl);
}

.platform-section h2 {
  font-family: var(--font-heading);
  font-size: var(--font-size-2xl);
  color: var(--text-primary);
  margin-bottom: var(--space-lg);
}

.platform-card {
  padding: var(--space-xl);
  transition: var(--transition-base);
}

.platform-card:not(.disabled):hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-xl);
}

.platform-card.connected {
  border: 1px solid rgba(34, 197, 94, 0.3);
  background: linear-gradient(
    135deg,
    rgba(34, 197, 94, 0.05) 0%,
    rgba(255, 255, 255, 0.02) 100%
  );
}

.platform-card.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.platform-content {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
}

.platform-icon {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}

.facebook-icon {
  background: linear-gradient(135deg, #1877f2, #0d5dbf);
}

.platform-info {
  flex: 1;
}

.platform-info h3 {
  font-size: var(--font-size-xl);
  color: var(--text-primary);
  margin-bottom: var(--space-xs);
}

.platform-info p {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.connection-status-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  margin-top: var(--space-sm);
  padding: var(--space-xs) var(--space-sm);
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  color: rgb(34, 197, 94);
  font-size: var(--font-size-sm);
  font-weight: 600;
  border-radius: var(--radius-full);
}

.checkmark-icon {
  width: 16px;
  height: 16px;
  color: rgb(34, 197, 94);
}

.coming-soon-badge {
  display: inline-block;
  padding: var(--space-xs) var(--space-sm);
  background: var(--gold-primary);
  color: var(--bg-primary);
  font-size: var(--font-size-xs);
  font-weight: 600;
  border-radius: var(--radius-full);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.connect-button {
  min-width: 180px;
}

.connected-pages {
  margin-top: var(--space-xl);
  padding-top: var(--space-xl);
  border-top: 1px solid var(--border-color);
}

.connected-pages h4 {
  font-size: var(--font-size-lg);
  color: var(--text-primary);
  margin-bottom: var(--space-md);
}

.pages-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.page-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md);
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  transition: var(--transition-base);
}

.page-item:hover {
  background: rgba(255, 255, 255, 0.04);
  border-color: var(--gold-primary);
}

.page-info {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.page-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, #1877f2, #0d5dbf);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: white;
}

.page-details {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.page-name {
  font-size: var(--font-size-md);
  font-weight: 600;
  color: var(--text-primary);
}

.page-meta {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.coming-soon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-lg);
}

.coming-soon-card {
  padding: var(--space-lg);
}

.coming-soon-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.coming-soon-header {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.coming-soon-card .platform-icon {
  width: 48px;
  height: 48px;
  font-size: var(--font-size-xl);
  flex-shrink: 0;
}

.coming-soon-card .platform-info {
  flex: 1;
}

.coming-soon-card h3 {
  font-size: var(--font-size-lg);
  margin-bottom: var(--space-xs);
}

/* Responsive */
@media (max-width: 768px) {
  .platform-content {
    flex-direction: column;
    text-align: center;
  }

  .connect-button {
    width: 100%;
  }

  .page-item {
    flex-direction: column;
    gap: var(--space-md);
  }

  .coming-soon-grid {
    grid-template-columns: 1fr;
  }

  .coming-soon-header {
    flex-direction: column;
    text-align: center;
  }

  .coming-soon-card .platform-icon {
    width: 56px;
    height: 56px;
    font-size: var(--font-size-2xl);
  }
}
</style>

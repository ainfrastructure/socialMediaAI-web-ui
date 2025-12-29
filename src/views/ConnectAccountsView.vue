<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useFacebookStore } from '../stores/facebook'
import { useInstagramStore } from '../stores/instagram'
import DashboardLayout from '../components/DashboardLayout.vue'
import BaseCard from '../components/BaseCard.vue'
import BaseButton from '../components/BaseButton.vue'
import Toast from '../components/Toast.vue'
import ConfirmModal from '../components/ConfirmModal.vue'

const router = useRouter()
const route = useRoute()
const facebookStore = useFacebookStore()
const instagramStore = useInstagramStore()
const { t } = useI18n()

const showSuccessToast = ref(false)
const showErrorToast = ref(false)
const toastMessage = ref('')
const errorMessage = ref('')

// Confirm modal state
const showConfirmModal = ref(false)
const confirmModalMessage = ref('')
const confirmModalTitle = ref('')
const pendingDisconnect = ref<{
  type: 'facebook' | 'instagram'
  id: string
  name: string
} | null>(null)

// Computed property to check if Facebook is connected
const isConnected = computed(() => facebookStore.connectedPages.length > 0)

// Computed property to check if Instagram is connected
const isInstagramConnected = computed(() => instagramStore.connectedAccounts.length > 0)

onMounted(async () => {
  // Load connected Facebook pages and Instagram accounts on mount
  await Promise.all([facebookStore.loadConnectedPages(), instagramStore.loadConnectedAccounts()])

  // Check if we just came back from a successful connection
  const urlParams = new URLSearchParams(window.location.search)
  if (urlParams.has('connected')) {
    const totalAccounts =
      facebookStore.connectedPages.length + instagramStore.connectedAccounts.length
    if (totalAccounts > 0) {
      // Check if we have a returnTo URL stored in localStorage (from before OAuth redirect)
      const storedReturnTo = localStorage.getItem('oauth_return_to')
      if (storedReturnTo) {
        // Clear the stored URL
        localStorage.removeItem('oauth_return_to')
        // Redirect back to the original page after successful connection
        router.replace(decodeURIComponent(storedReturnTo))
        return
      }

      toastMessage.value = t('connectAccounts.successfullyConnected', { count: totalAccounts })
      showSuccessToast.value = true
      // Clean up URL
      window.history.replaceState({}, '', '/connect-accounts')
    }
  }
})

async function handleConnectFacebook() {
  showSuccessToast.value = false
  showErrorToast.value = false

  try {
    // Store returnTo URL before OAuth redirect if present
    const returnTo = route.query.returnTo as string
    if (returnTo) {
      localStorage.setItem('oauth_return_to', returnTo)
    }

    // This will redirect to Facebook - no success message needed here
    // Success message will be shown after OAuth callback when returning to this page
    await facebookStore.connectFacebook()
  } catch (error: any) {
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
    await facebookStore.disconnectPage(pageId)
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
    // Store returnTo URL before OAuth redirect if present
    const returnTo = route.query.returnTo as string
    if (returnTo) {
      localStorage.setItem('oauth_return_to', returnTo)
    }

    await instagramStore.connectInstagram()
  } catch (error: any) {
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
    await instagramStore.disconnectAccount(accountId)
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

  if (type === 'facebook') {
    await executeDisconnectPage(id, name)
  } else if (type === 'instagram') {
    await executeDisconnectInstagramAccount(id, name.replace('@', ''))
  }

  pendingDisconnect.value = null
}

function handleCancelDisconnect() {
  showConfirmModal.value = false
  pendingDisconnect.value = null
}
</script>

<template>
  <DashboardLayout>
    <div class="connect-accounts-view">
    <div class="container">

      <header class="page-header">
        <h1>{{ $t('connectAccounts.pageTitle') }}</h1>
        <p class="subtitle">
          {{ $t('connectAccounts.pageSubtitle') }}
        </p>
      </header>

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

      <!-- Connected Platforms List -->
      <section class="platforms-section">
        <BaseCard variant="glass" class="platforms-list">
          <!-- Facebook Row -->
          <div class="platform-row" :class="{ connected: isConnected }">
            <div class="platform-icon facebook-icon">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="white"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z"
                />
              </svg>
            </div>
            <div class="platform-info">
              <h3>{{ $t('connectAccounts.facebookPages') }}</h3>
            </div>
            <div class="connected-account" v-if="isConnected">
              <span class="account-name">{{ facebookStore.connectedPages[0]?.pageName }}</span>
            </div>
            <div class="platform-actions">
              <BaseButton
                v-if="isConnected"
                @click="
                  requestDisconnectPage(
                    facebookStore.connectedPages[0]?.pageId,
                    facebookStore.connectedPages[0]?.pageName,
                  )
                "
                variant="danger"
                size="small"
                :disabled="facebookStore.loading"
              >
                {{ $t('connectAccounts.disconnect') }}
              </BaseButton>
              <BaseButton
                v-if="!isConnected"
                @click="handleConnectFacebook"
                variant="primary"
                size="small"
                :disabled="facebookStore.loading"
              >
                {{
                  facebookStore.loading
                    ? $t('connectAccounts.connecting')
                    : $t('connectAccounts.connect')
                }}
              </BaseButton>
            </div>
          </div>

          <!-- Instagram Row -->
          <div class="platform-row" :class="{ connected: isInstagramConnected }">
            <div class="platform-icon platform-icon-instagram">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="white"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077"
                />
              </svg>
            </div>
            <div class="platform-info">
              <h3>Instagram Business</h3>
            </div>
            <div class="connected-account" v-if="isInstagramConnected">
              <span class="account-name">@{{ instagramStore.connectedAccounts[0]?.username }}</span>
            </div>
            <div class="platform-actions">
              <BaseButton
                v-if="isInstagramConnected"
                @click="
                  requestDisconnectInstagramAccount(
                    instagramStore.connectedAccounts[0]?.instagramAccountId,
                    instagramStore.connectedAccounts[0]?.username,
                  )
                "
                variant="danger"
                size="small"
                :disabled="instagramStore.loading"
              >
                {{ $t('connectAccounts.disconnect') }}
              </BaseButton>
              <BaseButton
                v-if="!isInstagramConnected"
                @click="handleConnectInstagram"
                variant="primary"
                size="small"
                :disabled="instagramStore.loading"
              >
                {{ instagramStore.loading ? $t('connectAccounts.connecting') : $t('connectAccounts.connect') }}
              </BaseButton>
            </div>
          </div>

          <!-- X (Twitter) Row - Coming Soon -->
          <div class="platform-row disabled">
            <div class="platform-icon platform-icon-x">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="white"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"
                />
              </svg>
            </div>
            <div class="platform-info">
              <h3>X (Twitter)</h3>
            </div>
            <div class="platform-actions">
              <span class="coming-soon-badge">{{ $t('connectAccounts.comingSoon') }}</span>
            </div>
          </div>

          <!-- LinkedIn Row - Coming Soon -->
          <div class="platform-row disabled">
            <div class="platform-icon platform-icon-linkedin">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="white"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
                />
              </svg>
            </div>
            <div class="platform-info">
              <h3>LinkedIn</h3>
            </div>
            <div class="platform-actions">
              <span class="coming-soon-badge">{{ $t('connectAccounts.comingSoon') }}</span>
            </div>
          </div>

          <!-- TikTok Row - Coming Soon -->
          <div class="platform-row disabled">
            <div class="platform-icon platform-icon-tiktok">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="white"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"
                />
              </svg>
            </div>
            <div class="platform-info">
              <h3>TikTok</h3>
            </div>
            <div class="platform-actions">
              <span class="coming-soon-badge">{{ $t('connectAccounts.comingSoon') }}</span>
            </div>
          </div>

          <!-- YouTube Row - Coming Soon -->
          <div class="platform-row disabled">
            <div class="platform-icon platform-icon-youtube">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="white"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"
                />
              </svg>
            </div>
            <div class="platform-info">
              <h3>YouTube</h3>
            </div>
            <div class="platform-actions">
              <span class="coming-soon-badge">{{ $t('connectAccounts.comingSoon') }}</span>
            </div>
          </div>
        </BaseCard>
      </section>
    </div>

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
  </DashboardLayout>
</template>

<style scoped>
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

/* Unified Platforms List */
.platforms-section {
  margin-bottom: var(--space-2xl);
}

.platforms-list {
  padding: 0;
  overflow: hidden;
}

.platform-row {
  display: flex;
  align-items: center;
  padding: var(--space-lg) var(--space-xl);
  gap: var(--space-lg);
  transition: var(--transition-base);
}

.platform-row:not(:last-child) {
  border-bottom: 1px solid var(--border-color);
}

.platform-row:hover {
  background: rgba(255, 255, 255, 0.02);
}

.platform-row.connected {
  background: rgba(34, 197, 94, 0.08);
}

.platform-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}

.facebook-icon {
  background: linear-gradient(135deg, #1877f2, #0d5dbf);
}

.platform-icon-instagram {
  background: linear-gradient(135deg, #f58529, #dd2a7b, #8134af, #515bd4);
}

.platform-icon-x,
.platform-icon-tiktok {
  background: #000000;
}

.platform-icon-linkedin {
  background: #0a66c2;
}

.platform-icon-youtube {
  background: #ff0000;
}

.platform-info {
  flex: 1;
  min-width: 0;
}

.platform-info h3 {
  font-size: var(--font-size-base);
  font-weight: var(--font-medium);
  color: var(--text-primary);
  margin: 0;
}

.connected-account {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-left: auto;
  flex-shrink: 0;
}

.account-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
}


.platform-actions {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex-shrink: 0;
  margin-left: auto;
}

.platform-actions :deep(.base-button) {
  min-width: auto;
  height: auto;
  padding: var(--space-xs) var(--space-md);
  font-size: var(--text-sm);
}

.platform-actions :deep(.base-button.button-primary),
.platform-actions :deep(.base-button.button-danger) {
  width: 100px !important;
  min-width: 100px !important;
  max-width: 100px !important;
  height: 32px !important;
  padding: 0 !important;
  font-size: var(--text-sm) !important;
  box-shadow: none !important;
}

.platform-actions :deep(.base-button.button-primary) {
  background: var(--gradient-gold) !important;
  border: none !important;
  color: var(--text-on-gold) !important;
}

.platform-actions :deep(.base-button.button-primary:hover) {
  background: var(--gradient-gold-hover) !important;
  border: none !important;
  color: var(--text-on-gold) !important;
  transform: translateY(-1px) !important;
}

.platform-actions :deep(.base-button.button-danger) {
  background: var(--error-bg) !important;
  border: 1px solid var(--error-border) !important;
  color: var(--error-text) !important;
}

.platform-actions :deep(.base-button.button-danger:hover) {
  background: rgba(220, 53, 69, 0.25) !important;
  border-color: var(--error-text) !important;
}

.platform-row.disabled {
  opacity: 0.6;
}

.platform-row.disabled .platform-icon {
  filter: grayscale(30%);
}

.coming-soon-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 32px;
  padding: 0 var(--space-md);
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-muted);
  font-size: var(--text-sm);
  font-weight: 500;
  border-radius: var(--radius-md);
  white-space: nowrap;
}

/* Responsive */
@media (max-width: 768px) {
  .platform-row {
    flex-wrap: wrap;
    padding: var(--space-lg);
    gap: var(--space-md);
  }

  .platform-info {
    flex: 1 1 auto;
  }

  .connected-account {
    order: 3;
    width: 100%;
    margin-left: 0;
    padding-left: calc(44px + var(--space-md));
  }

  .platform-actions {
    order: 2;
    margin-left: auto;
  }
}
</style>

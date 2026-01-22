<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useFacebookStore } from '@/stores/facebook'
import { useInstagramStore } from '@/stores/instagram'
import { useTwitterStore } from '@/stores/twitter'
import { useTikTokStore } from '@/stores/tiktok'
import BaseCard from './BaseCard.vue'
import BaseButton from './BaseButton.vue'

interface Props {
  platform: 'facebook' | 'instagram' | 'twitter' | 'tiktok'
  modelValue: string[]
  multiSelect?: boolean
  label?: string
  showError?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  multiSelect: true,
  label: '',
  showError: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string[]): void
}>()

const { t } = useI18n()
const router = useRouter()
const facebookStore = useFacebookStore()
const instagramStore = useInstagramStore()
const twitterStore = useTwitterStore()
const tiktokStore = useTikTokStore()

// Get accounts based on platform
const accounts = computed(() => {
  if (props.platform === 'facebook') {
    return facebookStore.connectedPages.map(page => ({
      id: page.pageId,
      name: page.pageName,
      pictureUrl: page.profilePictureUrl,
      accountId: page.pageId
    }))
  } else if (props.platform === 'instagram') {
    return instagramStore.connectedAccounts.map(account => ({
      id: account.instagramAccountId,
      name: account.username,
      pictureUrl: account.profilePictureUrl,
      accountId: account.instagramAccountId
    }))
  } else if (props.platform === 'tiktok') {
    return tiktokStore.connectedAccounts.map(account => ({
      id: account.tiktokAccountId,
      name: account.username,
      pictureUrl: account.profilePictureUrl,
      accountId: account.tiktokAccountId
    }))
  } else {
    return twitterStore.connectedAccounts.map(account => ({
      id: account.twitterAccountId,
      name: account.username,
      pictureUrl: account.profilePictureUrl,
      accountId: account.twitterAccountId
    }))
  }
})

// Check if account is selected
const isSelected = (accountId: string) => {
  return props.modelValue.includes(accountId)
}

// Toggle account selection
const toggleAccount = (accountId: string) => {
  if (props.multiSelect) {
    // Multi-select mode
    if (isSelected(accountId)) {
      // Remove from selection
      emit('update:modelValue', props.modelValue.filter(id => id !== accountId))
    } else {
      // Add to selection
      emit('update:modelValue', [...props.modelValue, accountId])
    }
  } else {
    // Single-select mode
    if (isSelected(accountId)) {
      // Deselect if already selected
      emit('update:modelValue', [])
    } else {
      // Select only this account
      emit('update:modelValue', [accountId])
    }
  }
}

// Navigate to connect accounts page
const handleConnectAccount = () => {
  router.push('/connect')
}

// Label text
const labelText = computed(() => {
  if (props.label) return props.label

  if (props.platform === 'facebook') {
    return t('accountSelector.selectFacebookPages')
  } else if (props.platform === 'instagram') {
    return t('accountSelector.selectInstagramAccounts')
  } else if (props.platform === 'tiktok') {
    return t('accountSelector.selectTikTokAccounts')
  } else {
    return t('accountSelector.selectTwitterAccounts')
  }
})

// Selected count text
const selectedCountText = computed(() => {
  const count = props.modelValue.length
  if (count === 0) return ''
  return t('accountSelector.multipleSelected', { count })
})
</script>

<template>
  <div class="account-selector">
    <!-- Header -->
    <div class="selector-header">
      <h3 class="selector-label">{{ labelText }}</h3>
      <span v-if="multiSelect && selectedCountText" class="selected-count">
        {{ selectedCountText }}
      </span>
    </div>

    <!-- Empty State -->
    <div v-if="accounts.length === 0" class="empty-state">
      <p class="empty-text">
        {{ t('accountSelector.noAccountsConnected', { platform: platform === 'facebook' ? 'Facebook' : platform === 'instagram' ? 'Instagram' : platform === 'tiktok' ? 'TikTok' : 'Twitter' }) }}
      </p>
      <BaseButton variant="secondary" @click="handleConnectAccount">
        {{ t('accountSelector.connectAccount') }}
      </BaseButton>
    </div>

    <!-- Account Grid -->
    <div v-else :class="['account-grid', { 'has-error': showError && modelValue.length === 0 }]">
      <div
        v-for="account in accounts"
        :key="account.id"
        :class="['account-card', { 'selected': isSelected(account.id) }]"
        @click="toggleAccount(account.id)"
      >
        <BaseCard variant="glass" hoverable>
          <div class="account-content">
            <!-- Avatar -->
            <div class="account-avatar">
              <img
                v-if="account.pictureUrl"
                :src="account.pictureUrl"
                :alt="account.name"
                class="avatar-image"
              />
              <div v-else class="avatar-placeholder">
                <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
            </div>

            <!-- Info -->
            <div class="account-info">
              <p class="account-name">{{ account.name }}</p>
              <p class="account-id">{{ t('accountSelector.accountId') }}: {{ account.accountId }}</p>
            </div>

            <!-- Selection Indicator -->
            <div v-if="isSelected(account.id)" class="selection-check">
              <svg viewBox="0 0 24 24" fill="none" width="24" height="24">
                <circle cx="12" cy="12" r="10" fill="var(--gold-primary)"/>
                <path d="M9 12L11 14L15 10" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>
        </BaseCard>
      </div>
    </div>

    <!-- Error Message -->
    <p v-if="showError && modelValue.length === 0 && accounts.length > 0" class="error-message">
      {{ t('accountSelector.noAccountsSelected', { platform: platform === 'facebook' ? 'Facebook' : platform === 'instagram' ? 'Instagram' : platform === 'tiktok' ? 'TikTok' : 'Twitter' }) }}
    </p>

    <!-- Info Text for Single Account -->
    <p v-if="accounts.length === 1" class="info-text">
      {{ t('accountSelector.singleAccountInfo') }}
    </p>
  </div>
</template>

<style scoped>
.account-selector {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

/* Header */
.selector-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
}

.selector-label {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.selected-count {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  font-weight: 500;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-lg);
  padding: var(--space-2xl);
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  border: 2px dashed var(--border-color);
}

.empty-text {
  font-size: var(--text-base);
  color: var(--text-secondary);
  text-align: center;
  margin: 0;
}

/* Account Grid */
.account-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--space-md);
}

.account-grid.has-error {
  border: 2px solid var(--error-border);
  border-radius: var(--radius-md);
  padding: var(--space-sm);
}

.account-card {
  cursor: pointer;
  position: relative;
  transition: var(--transition-base);
}

.account-card.selected :deep(.base-card) {
  border-color: var(--gold-primary);
  box-shadow: 0 0 0 2px var(--gold-primary);
}

.account-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
  text-align: center;
  position: relative;
  padding: var(--space-sm);
}

/* Avatar */
.account-avatar {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-full);
  overflow: hidden;
  background: var(--bg-elevated);
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Account Info */
.account-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  width: 100%;
}

.account-name {
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  word-break: break-word;
}

.account-id {
  font-size: var(--text-xs);
  color: var(--text-muted);
  margin: 0;
  font-family: monospace;
  word-break: break-all;
}

/* Selection Check */
.selection-check {
  position: absolute;
  top: var(--space-xs);
  right: var(--space-xs);
}

/* Error Message */
.error-message {
  font-size: var(--text-sm);
  color: var(--error-text);
  margin: 0;
  padding: var(--space-sm) var(--space-md);
  background: var(--error-bg);
  border: 1px solid var(--error-border);
  border-radius: var(--radius-sm);
}

/* Info Text */
.info-text {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: 0;
  padding: var(--space-sm) var(--space-md);
  background: var(--info-bg);
  border: 1px solid var(--info-border);
  border-radius: var(--radius-sm);
}

/* Mobile Responsive */
@media (max-width: 640px) {
  .account-grid {
    grid-template-columns: 1fr;
  }

  .selector-header {
    flex-direction: column;
    align-items: flex-start;
  }
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  .account-card {
    transition: none;
  }
}
</style>

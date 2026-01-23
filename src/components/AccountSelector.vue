<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useFacebookStore } from '@/stores/facebook'
import { useInstagramStore } from '@/stores/instagram'
import { useTwitterStore } from '@/stores/twitter'
import { useTikTokStore } from '@/stores/tiktok'
import { usePostTypeOptions } from '@/composables/usePostTypeOptions'
import type { AccountSelection, CarouselItem } from '@/types/scheduling'
import BaseCard from './BaseCard.vue'
import BaseButton from './BaseButton.vue'
import BaseModal from './BaseModal.vue'
import MaterialIcon from './MaterialIcon.vue'
import CarouselImageSelector from './creation/CarouselImageSelector.vue'
import CarouselContentModal from './CarouselContentModal.vue'

interface Props {
  platform: 'facebook' | 'instagram' | 'twitter' | 'tiktok' | 'linkedin'
  modelValue: AccountSelection[] | string[]
  multiSelect?: boolean
  label?: string
  showError?: boolean
  showPostTypeSelector?: boolean
  contentType?: 'image' | 'video'
  hasMultipleImages?: boolean
  restaurantName?: string
  brandDNA?: any
}

const props = withDefaults(defineProps<Props>(), {
  multiSelect: true,
  label: '',
  showError: false,
  showPostTypeSelector: false,
  contentType: 'image',
  hasMultipleImages: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: AccountSelection[] | string[]): void
}>()

const { t } = useI18n()
const router = useRouter()
const facebookStore = useFacebookStore()
const instagramStore = useInstagramStore()
const twitterStore = useTwitterStore()
const tiktokStore = useTikTokStore()

// Carousel modal state
const showCarouselModal = ref(false)
const currentAccountForCarousel = ref<string | null>(null)
const carouselItems = ref<Record<string, CarouselItem[]>>({})
const tempCarouselItems = ref<CarouselItem[]>([])

// Carousel content modal state
const showCarouselContentModal = ref(false)
const carouselContentAccountId = ref<string | null>(null)
const carouselContentItems = ref<CarouselItem[]>([])

// Post type options (only for FB/IG)
const postTypeOptions = computed(() => {
  if (props.showPostTypeSelector && (props.platform === 'facebook' || props.platform === 'instagram')) {
    return usePostTypeOptions(props.platform).value
  }
  return []
})

// Type guard to check if modelValue is AccountSelection[]
const isAccountSelectionArray = (value: AccountSelection[] | string[]): value is AccountSelection[] => {
  return Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && 'accountId' in value[0]
}

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
  if (isAccountSelectionArray(props.modelValue)) {
    return props.modelValue.some(sel => sel.accountId === accountId)
  }
  return props.modelValue.includes(accountId)
}

// Get post type for a specific account
const getPostType = (accountId: string): 'feed' | 'story' | 'reel' | 'carousel' => {
  if (isAccountSelectionArray(props.modelValue)) {
    const selection = props.modelValue.find(sel => sel.accountId === accountId)
    return selection?.postType || 'feed'
  }
  return 'feed'
}

// Update post type for a specific account
const updatePostType = (accountId: string, postType: 'feed' | 'story' | 'reel' | 'carousel') => {
  if (isAccountSelectionArray(props.modelValue)) {
    const updated = props.modelValue.map(sel => {
      if (sel.accountId === accountId) {
        // Clear carousel items when switching away from carousel
        if (postType !== 'carousel' && sel.carouselItems) {
          delete carouselItems.value[accountId]
          const { carouselItems: _, ...rest } = sel
          return { ...rest, postType }
        }
        return { ...sel, postType }
      }
      return sel
    })
    emit('update:modelValue', updated)
  }
}

// Toggle account selection
const toggleAccount = (accountId: string) => {
  if (props.multiSelect) {
    // Multi-select mode
    if (isSelected(accountId)) {
      // Remove from selection
      if (isAccountSelectionArray(props.modelValue)) {
        emit('update:modelValue', props.modelValue.filter(sel => sel.accountId !== accountId))
      } else {
        emit('update:modelValue', props.modelValue.filter(id => id !== accountId))
      }
    } else {
      // Add to selection
      if (props.showPostTypeSelector) {
        // Add with default post type 'feed'
        const newSelection: AccountSelection = { accountId, postType: 'feed' }
        emit('update:modelValue', [...(props.modelValue as AccountSelection[]), newSelection])
      } else {
        // Add as string
        emit('update:modelValue', [...(props.modelValue as string[]), accountId])
      }
    }
  } else {
    // Single-select mode
    if (isSelected(accountId)) {
      // Deselect if already selected
      emit('update:modelValue', [])
    } else {
      // Select only this account
      if (props.showPostTypeSelector) {
        const newSelection: AccountSelection = { accountId, postType: 'feed' }
        emit('update:modelValue', [newSelection])
      } else {
        emit('update:modelValue', [accountId])
      }
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

// Check if a post type is available based on content type
const isPostTypeAvailable = (postType: 'feed' | 'story' | 'reel' | 'carousel'): boolean => {
  // Reels require video content
  if (postType === 'reel' && props.contentType !== 'video') {
    return false
  }

  // Carousel is always available - user will select items in modal
  // Stories work with any content but images should be 9:16
  // We'll allow it but show a warning in the description
  return true
}

// Stop propagation for chip clicks
const handleChipClick = (event: Event, accountId: string, postType: 'feed' | 'story' | 'reel' | 'carousel') => {
  event.stopPropagation()

  // Don't allow selecting unavailable post types
  if (!isPostTypeAvailable(postType)) {
    return
  }

  // For carousel, open modal to select items
  if (postType === 'carousel') {
    openCarouselSelector(accountId)
    return
  }

  // For other post types, update directly
  updatePostType(accountId, postType)
}

// Open carousel selector for specific account
const openCarouselSelector = (accountId: string) => {
  currentAccountForCarousel.value = accountId
  // Initialize temp items with current selection
  tempCarouselItems.value = [...(carouselItems.value[accountId] || [])]
  showCarouselModal.value = true
}

// Update temp carousel items (called when user selects items in modal)
const updateTempCarouselItems = (items: CarouselItem[]) => {
  tempCarouselItems.value = items
}

// Save carousel items and update post type
const saveCarouselSelection = () => {
  if (currentAccountForCarousel.value && tempCarouselItems.value.length >= 2) {
    // Store carousel items for this account
    carouselItems.value[currentAccountForCarousel.value] = [...tempCarouselItems.value]

    console.log('[AccountSelector] Saving carousel selection:', {
      accountId: currentAccountForCarousel.value,
      itemCount: tempCarouselItems.value.length,
      items: tempCarouselItems.value
    })

    // Update post type to carousel and include carousel items
    if (isAccountSelectionArray(props.modelValue)) {
      const updated = props.modelValue.map(sel =>
        sel.accountId === currentAccountForCarousel.value
          ? { ...sel, postType: 'carousel' as const, carouselItems: [...tempCarouselItems.value] }
          : sel
      )
      console.log('[AccountSelector] Updated modelValue:', updated)
      emit('update:modelValue', updated)
    }

    // Close carousel selector and open content generation modal
    closeCarouselModal()

    // Open carousel content modal for AI-generated caption/hashtags
    carouselContentAccountId.value = currentAccountForCarousel.value
    carouselContentItems.value = [...tempCarouselItems.value]
    showCarouselContentModal.value = true
  } else {
    console.warn('[AccountSelector] Cannot save carousel - insufficient items:', tempCarouselItems.value.length)
    closeCarouselModal()
  }
}

// Close carousel modal
const closeCarouselModal = () => {
  showCarouselModal.value = false
  currentAccountForCarousel.value = null
  tempCarouselItems.value = []
}

// Get carousel items for a specific account
const getCarouselItems = (accountId: string): CarouselItem[] => {
  return carouselItems.value[accountId] || []
}

// Get carousel item count for display
const getCarouselItemCount = (accountId: string): number => {
  return getCarouselItems(accountId).length
}

// Handle carousel content confirmation (caption & hashtags from AI)
const handleCarouselContentConfirm = (data: { caption: string; hashtags: string[] }) => {
  if (carouselContentAccountId.value && isAccountSelectionArray(props.modelValue)) {
    console.log('[AccountSelector] Carousel content confirmed:', data)

    // Update the account selection with carousel-specific caption and hashtags
    const updated = props.modelValue.map(sel =>
      sel.accountId === carouselContentAccountId.value
        ? {
            ...sel,
            carouselCaption: data.caption,
            carouselHashtags: data.hashtags
          }
        : sel
    )

    console.log('[AccountSelector] Updated with carousel content:', updated)
    emit('update:modelValue', updated)
  }

  // Close modal
  showCarouselContentModal.value = false
  carouselContentAccountId.value = null
  carouselContentItems.value = []
}

// Handle carousel content modal cancel
const handleCarouselContentCancel = () => {
  showCarouselContentModal.value = false
  carouselContentAccountId.value = null
  carouselContentItems.value = []
}
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

            <!-- Post Type Chips (only when selected AND showPostTypeSelector) -->
            <div v-if="isSelected(account.id) && showPostTypeSelector" class="post-type-chips">
              <div class="chips-divider"></div>
              <div class="chips-label">{{ t('accountSelector.postTypeLabel') }}</div>
              <div class="chips-container">
                <div
                  v-for="type in postTypeOptions"
                  :key="type.value"
                  class="chip-wrapper"
                >
                  <button
                    :class="['chip', {
                      active: getPostType(account.id) === type.value,
                      disabled: !isPostTypeAvailable(type.value)
                    }]"
                    :disabled="!isPostTypeAvailable(type.value)"
                    @click="(e) => handleChipClick(e, account.id, type.value)"
                  >
                    <div class="chip-header">
                      <MaterialIcon :icon="type.icon" size="sm" />
                      <span class="chip-label">{{ type.label }}</span>
                      <div class="chip-help-icon-wrapper">
                        <MaterialIcon icon="help" size="xs" class="chip-help-icon" />
                        <div class="chip-help-tooltip">
                          {{ t(`accountSelector.${type.value}Description`) }}
                        </div>
                      </div>
                    </div>
                    <span
                      v-if="type.value === 'carousel' && getCarouselItemCount(account.id) > 0"
                      class="carousel-badge"
                    >
                      {{ t('accountSelector.carouselItemsSelected', { count: getCarouselItemCount(account.id) }) }}
                    </span>
                  </button>
                  <span class="chip-description">{{ t(`accountSelector.${type.value}Short`) }}</span>
                </div>
              </div>
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

    <!-- Carousel Selector Modal -->
    <Teleport to="body">
      <BaseModal
        v-model="showCarouselModal"
        size="xl"
        :title="t('accountSelector.carouselModalTitle')"
      >
        <template #default>
          <div class="carousel-modal-content">
            <p class="carousel-modal-subtitle">
              {{ t('accountSelector.carouselModalSubtitle') }}
            </p>
            <CarouselImageSelector
              v-if="currentAccountForCarousel"
              :model-value="tempCarouselItems"
              :min-images="2"
              :max-images="10"
              @update:model-value="updateTempCarouselItems"
            />
          </div>
        </template>
        <template #footer>
          <div class="modal-footer-actions">
            <BaseButton variant="secondary" @click="closeCarouselModal">
              {{ t('common.cancel') }}
            </BaseButton>
            <BaseButton
              variant="primary"
              :disabled="tempCarouselItems.length < 2"
              @click="saveCarouselSelection"
            >
              {{ t('common.save') }}
            </BaseButton>
          </div>
        </template>
      </BaseModal>
    </Teleport>

    <!-- Carousel Content Modal (AI-generated caption & hashtags) -->
    <CarouselContentModal
      v-model="showCarouselContentModal"
      :carousel-images="carouselContentItems"
      :platform="platform as 'facebook' | 'instagram'"
      :restaurant-name="restaurantName"
      :brand-d-n-a="brandDNA"
      @confirm="handleCarouselContentConfirm"
      @cancel="handleCarouselContentCancel"
    />
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
  gap: var(--space-sm);
  text-align: center;
  position: relative;
  padding: var(--space-xs) var(--space-sm);
}

/* Post Type Chips Section */
.post-type-chips {
  width: 100%;
  margin-top: var(--space-xs);
  padding-top: var(--space-sm);
  border-top: 1px solid var(--glass-border);
}

.chips-divider {
  display: none;
}

.chips-label {
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-align: center;
  margin-bottom: var(--space-sm);
}

.chips-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-sm);
  width: 100%;
}

.chip-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
  min-width: 0;
  width: 100%;
}

.chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-xs);
  background: var(--bg-secondary);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition-fast);
  width: 100%;
  min-height: 70px;
  position: relative;
}

.chip:hover:not(:disabled) {
  background: var(--bg-elevated);
  border-color: var(--gold-light);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(15, 61, 46, 0.1);
}

.chip.active {
  background: var(--gold-primary);
  color: white;
  border-color: var(--gold-primary);
}

.chip.active :deep(.material-icon) {
  color: white;
}

.chip.active .chip-help-icon {
  color: white;
}

.chip.disabled,
.chip:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background: var(--bg-tertiary);
  color: var(--text-muted);
  border-color: var(--border-color);
}

.chip.disabled:hover,
.chip:disabled:hover {
  transform: none;
  background: var(--bg-tertiary);
  border-color: var(--border-color);
  box-shadow: none;
}

.chip-header {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  position: relative;
  flex-wrap: nowrap;
  max-width: 100%;
}

.chip-label {
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 1;
}

.chip-help-icon-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
  cursor: help;
}

.chip-help-icon {
  color: var(--text-muted);
  transition: var(--transition-fast);
  opacity: 0.7;
}

.chip:hover .chip-help-icon {
  opacity: 1;
}

.chip.active .chip-help-icon {
  color: white;
  opacity: 0.9;
}

.chip-help-tooltip {
  position: absolute;
  bottom: calc(100% + var(--space-sm));
  left: 50%;
  transform: translateX(-50%);
  background: var(--bg-primary);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  padding: var(--space-sm) var(--space-md);
  font-size: var(--text-xs);
  color: var(--text-secondary);
  line-height: 1.5;
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
  transition: var(--transition-fast);
  box-shadow: 0 8px 16px rgba(15, 61, 46, 0.15);
  z-index: 100;
  max-width: 220px;
  white-space: normal;
  text-align: center;
  font-weight: 400;
}

.chip-help-icon-wrapper:hover .chip-help-tooltip {
  opacity: 1;
  visibility: visible;
}

.chip-description {
  font-size: 10px;
  color: var(--text-muted);
  text-align: center;
  font-weight: 400;
  line-height: 1.3;
  word-wrap: break-word;
  overflow-wrap: break-word;
  width: 100%;
  max-width: 100%;
}

.carousel-badge {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  background: var(--success-bg);
  color: var(--success-text);
  border-radius: var(--radius-sm);
  margin-top: 2px;
}

.chip.active .carousel-badge {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.account-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  text-align: center;
  position: relative;
  padding: var(--space-xs) var(--space-sm);
}

/* Avatar */
.account-avatar {
  width: 36px;
  height: 36px;
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
  font-size: var(--text-sm);
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

  .post-type-chips {
    justify-content: center;
  }

  .chips-container {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-xs);
  }

  .chip-wrapper {
    width: 100%;
  }

  .chip-help-tooltip {
    left: 50%;
    transform: translateX(-50%);
    max-width: 200px;
  }
}

/* Carousel Modal */
.carousel-modal-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  padding: var(--space-md);
}

.carousel-modal-subtitle {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: 0;
  text-align: center;
}

.modal-footer-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-md);
  padding: var(--space-md);
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  .account-card,
  .chip {
    transition: none;
  }
}
</style>

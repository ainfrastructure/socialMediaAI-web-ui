<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import type { AccountSelection } from '@/types/scheduling'
import BaseButton from './BaseButton.vue'
import BaseAlert from './BaseAlert.vue'
import BaseModal from './BaseModal.vue'
import { VueDatePicker } from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import MobileTimePicker from './MobileTimePicker.vue'
import AccountSelector from './AccountSelector.vue'
import PlatformLogo from './PlatformLogo.vue'
import { useSocialAccounts } from '@/composables/useSocialAccounts'
import { useScheduleTime } from '@/composables/useScheduleTime'
import { useFacebookStore } from '@/stores/facebook'
import { useInstagramStore } from '@/stores/instagram'
import { useTikTokStore } from '@/stores/tiktok'
import { useTwitterStore } from '@/stores/twitter'
import { errorLog } from '@/utils/debug'

interface Props {
  disabled?: boolean
  showPreview?: boolean
  imageUrl?: string
  videoUrl?: string
  postText?: string
  hashtags?: string[]
  initialPlatforms?: string[]
  initialPublishType?: 'now' | 'schedule'
  initialScheduleDate?: string // Format: YYYY-MM-DD
  forceScheduleMode?: boolean
  showCancelButton?: boolean
  lockDate?: boolean // When true, date picker is hidden and date is displayed as read-only
  carouselItems?: Array<{ mediaUrl: string; contentType: 'image' | 'video' }>
  businessId?: string
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  showPreview: false,
  initialPlatforms: () => [],
  initialPublishType: 'now',
  forceScheduleMode: false,
  showCancelButton: true,
  lockDate: false
})

const emit = defineEmits<{
  (e: 'publish', data: {
    platforms: string[]
    publishType: 'now' | 'schedule'
    scheduledDate?: string
    scheduledTime?: string
    timezone?: string
    accountSelections?: {
      facebook?: AccountSelection[]
      instagram?: AccountSelection[]
      tiktok?: string[]
      twitter?: string[]
    }
  }): void
  (e: 'cancel'): void
}>()

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const facebookStore = useFacebookStore()
const instagramStore = useInstagramStore()
const tiktokStore = useTikTokStore()
const twitterStore = useTwitterStore()
const { platforms: socialPlatforms, isConnected } = useSocialAccounts()
const { timezoneOptions, getDefaultTimezone } = useScheduleTime()

// State - default to 'now' unless forceScheduleMode is explicitly set
const publishType = ref<'now' | 'schedule'>(
  props.forceScheduleMode ? 'schedule' : props.initialPublishType
)
const selectedPlatforms = ref<string[]>(props.initialPlatforms.length > 0 ? [...props.initialPlatforms] : [])

// Account selections for each platform
const accountSelections = ref<{
  facebook?: AccountSelection[]
  instagram?: AccountSelection[]
  tiktok?: string[]
  twitter?: string[]
}>({
  facebook: [],
  instagram: [],
  tiktok: [],
  twitter: []
})

// Modal state for account selection
const showAccountModal = ref(false)
const currentPlatformForSelection = ref<'facebook' | 'instagram' | 'tiktok' | 'twitter' | null>(null)
const tempAccountSelections = ref<AccountSelection[] | string[]>([])

// Initialize scheduleDateTime from initialScheduleDate if provided
const initScheduleDateTime = (): Date | null => {
  if (props.initialScheduleDate) {
    // Parse YYYY-MM-DD format and set to noon to avoid timezone issues
    const [year, month, day] = props.initialScheduleDate.split('-').map(Number)
    const date = new Date(year, month - 1, day, 12, 0, 0)
    return date
  }
  return null
}
const scheduleDateTime = ref<Date | null>(initScheduleDateTime())

// Initialize scheduleTime to current time
const initScheduleTime = (): { hours: number; minutes: number } => {
  const now = new Date()
  return { hours: now.getHours(), minutes: now.getMinutes() }
}
const scheduleTime = ref<{ hours: number; minutes: number }>(initScheduleTime())
const selectedTimezone = ref(getDefaultTimezone())
const error = ref('')

// Platform display info
const availablePlatforms = computed(() => {
  return [
    {
      id: 'facebook',
      name: 'Facebook',
      isConnected: isConnected('facebook'),
      connectedAccounts: socialPlatforms.value.find(p => p.id === 'facebook')?.connectedAccounts || [],
      comingSoon: false
    },
    {
      id: 'instagram',
      name: 'Instagram',
      isConnected: isConnected('instagram'),
      connectedAccounts: socialPlatforms.value.find(p => p.id === 'instagram')?.connectedAccounts || [],
      comingSoon: false
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      isConnected: isConnected('tiktok'),
      connectedAccounts: socialPlatforms.value.find(p => p.id === 'tiktok')?.connectedAccounts || [],
      comingSoon: true
    },
    {
      id: 'twitter',
      name: 'X (Twitter)',
      isConnected: isConnected('twitter'),
      connectedAccounts: socialPlatforms.value.find(p => p.id === 'twitter')?.connectedAccounts || [],
      comingSoon: true
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      isConnected: false,
      connectedAccounts: [],
      comingSoon: true
    },
    {
      id: 'pinterest',
      name: 'Pinterest',
      isConnected: false,
      connectedAccounts: [],
      comingSoon: true
    },
    {
      id: 'youtube',
      name: 'YouTube',
      isConnected: false,
      connectedAccounts: [],
      comingSoon: true
    },
  ]
})

// Computed
const canPublish = computed(() => {
  if (selectedPlatforms.value.length === 0) return false
  // Check that all selected platforms have accounts selected
  for (const platform of selectedPlatforms.value) {
    if (platform === 'facebook' && (!accountSelections.value.facebook || accountSelections.value.facebook.length === 0)) {
      return false
    }
    if (platform === 'instagram' && (!accountSelections.value.instagram || accountSelections.value.instagram.length === 0)) {
      return false
    }
    if (platform === 'tiktok' && (!accountSelections.value.tiktok || accountSelections.value.tiktok.length === 0)) {
      return false
    }
  }
  if (publishType.value === 'schedule' && !scheduleDateTime.value) return false
  return true
})

const today = computed(() => {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date
})

// Formatted locked date display
const formattedLockedDate = computed(() => {
  if (!scheduleDateTime.value) return ''
  return scheduleDateTime.value.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
})

// Summary of selected platforms and accounts
const publishSummary = computed(() => {
  const summary: Array<{ platform: string; accounts: Array<{ id: string; name: string; pictureUrl?: string; postType?: string }> }> = []

  for (const platformId of selectedPlatforms.value) {
    if (platformId === 'facebook') {
      const fbAccounts = (accountSelections.value.facebook || []).map(selection => {
        const page = facebookStore.connectedPages.find(p => p.pageId === selection.accountId)
        return {
          id: selection.accountId,
          name: page?.pageName || selection.accountId,
          pictureUrl: page?.profilePictureUrl,
          postType: selection.postType
        }
      })
      if (fbAccounts.length > 0) {
        summary.push({ platform: 'Facebook', accounts: fbAccounts })
      }
    } else if (platformId === 'instagram') {
      const igAccounts = (accountSelections.value.instagram || []).map(selection => {
        const account = instagramStore.connectedAccounts.find(a => a.instagramAccountId === selection.accountId)
        return {
          id: selection.accountId,
          name: account?.username || selection.accountId,
          pictureUrl: account?.profilePictureUrl,
          postType: selection.postType
        }
      })
      if (igAccounts.length > 0) {
        summary.push({ platform: 'Instagram', accounts: igAccounts })
      }
    } else if (platformId === 'tiktok') {
      const ttAccounts = (accountSelections.value.tiktok || []).map(accountId => {
        const account = tiktokStore.connectedAccounts.find(a => a.tiktokAccountId === accountId)
        return {
          id: accountId,
          name: account?.username || accountId,
          pictureUrl: account?.profilePictureUrl
        }
      })
      if (ttAccounts.length > 0) {
        summary.push({ platform: 'TikTok', accounts: ttAccounts })
      }
    }
  }

  return summary
})

const hasPlatformsWithAccounts = computed(() => publishSummary.value.length > 0)

// Methods
function togglePlatform(platformId: string) {
  const index = selectedPlatforms.value.indexOf(platformId)
  if (index > -1) {
    selectedPlatforms.value.splice(index, 1)
    // Clear account selections when deselecting platform
    if (platformId === 'facebook') {
      accountSelections.value.facebook = []
    } else if (platformId === 'instagram') {
      accountSelections.value.instagram = []
    } else if (platformId === 'tiktok') {
      accountSelections.value.tiktok = []
    } else if (platformId === 'twitter') {
      accountSelections.value.twitter = []
    }
  } else {
    selectedPlatforms.value.push(platformId)
  }
}

function openAccountSelectionModal(platformId: 'facebook' | 'instagram' | 'tiktok' | 'twitter') {
  currentPlatformForSelection.value = platformId
  // Initialize with existing selections
  const existing = accountSelections.value[platformId] || []
  tempAccountSelections.value = [...existing] as typeof tempAccountSelections.value
  showAccountModal.value = true
}

function confirmAccountSelection() {
  if (currentPlatformForSelection.value) {
    const platform = currentPlatformForSelection.value

    // Handle Facebook and Instagram with AccountSelection[]
    if (platform === 'facebook' || platform === 'instagram') {
      const selections = [...tempAccountSelections.value] as AccountSelection[]

      // Attach carousel items to selections with carousel post type
      if (props.carouselItems && props.carouselItems.length >= 2) {
        selections.forEach(selection => {
          if (selection.postType === 'carousel') {
            selection.carouselItems = props.carouselItems
          }
        })
      }

      accountSelections.value[platform] = selections
    } else if (platform === 'tiktok' || platform === 'twitter') {
      // Handle TikTok and Twitter with string[]
      accountSelections.value[platform] = [...tempAccountSelections.value] as string[]
    }

    // If accounts were selected, ensure platform is in selectedPlatforms
    if (tempAccountSelections.value.length > 0) {
      if (!selectedPlatforms.value.includes(currentPlatformForSelection.value)) {
        selectedPlatforms.value.push(currentPlatformForSelection.value)
      }
    } else {
      // If no accounts selected, remove platform from selection
      const index = selectedPlatforms.value.indexOf(currentPlatformForSelection.value)
      if (index > -1) {
        selectedPlatforms.value.splice(index, 1)
      }
    }
  }
  closeAccountModal()
}

function closeAccountModal() {
  showAccountModal.value = false
  currentPlatformForSelection.value = null
  tempAccountSelections.value = []
}

async function handlePlatformClick(platform: typeof availablePlatforms.value[0]) {
  if (platform.isConnected) {
    // Open account selection modal for connected platforms
    if (platform.id === 'facebook' || platform.id === 'instagram' || platform.id === 'tiktok' || platform.id === 'twitter') {
      openAccountSelectionModal(platform.id)
    }
  } else if (!platform.comingSoon) {
    // Trigger connection directly based on platform
    // Pass current URL so user returns here after OAuth
    const returnUrl = route.fullPath
    try {
      if (platform.id === 'facebook') {
        await facebookStore.connectFacebook(returnUrl)
      } else if (platform.id === 'instagram') {
        await instagramStore.connectInstagram(returnUrl)
      } else if (platform.id === 'tiktok') {
        await tiktokStore.connectTikTok(returnUrl)
      } else if (platform.id === 'twitter') {
        await twitterStore.connectTwitter(returnUrl)
      }
      // The stores are reactive, so UI will update automatically after connection
    } catch (error) {
      errorLog('Failed to connect:', error)
    }
  }
}

function handlePublish() {
  error.value = ''

  // Validate platform selection
  if (selectedPlatforms.value.length === 0) {
    error.value = t('unifiedSchedule.noPlatformSelected', 'Please select at least one platform')
    return
  }

  // Validate account selections for each selected platform
  for (const platform of selectedPlatforms.value) {
    if (platform === 'facebook' && (!accountSelections.value.facebook || accountSelections.value.facebook.length === 0)) {
      error.value = t('accountSelector.noAccountsSelected', { platform: 'Facebook' })
      return
    }
    if (platform === 'instagram' && (!accountSelections.value.instagram || accountSelections.value.instagram.length === 0)) {
      error.value = t('accountSelector.noAccountsSelected', { platform: 'Instagram' })
      return
    }
    if (platform === 'tiktok' && (!accountSelections.value.tiktok || accountSelections.value.tiktok.length === 0)) {
      error.value = t('accountSelector.noAccountsSelected', { platform: 'TikTok' })
      return
    }
    if (platform === 'twitter' && (!accountSelections.value.twitter || accountSelections.value.twitter.length === 0)) {
      error.value = t('accountSelector.noAccountsSelected', { platform: 'Twitter' })
      return
    }
  }

  let scheduledDate: string | undefined
  let scheduledTime: string | undefined

  if (publishType.value === 'schedule') {
    if (!scheduleDateTime.value) {
      error.value = t('unifiedSchedule.noDateSelected', 'Please select a date')
      return
    }

    // Get time from time picker
    const hour24 = scheduleTime.value.hours
    const minute = scheduleTime.value.minutes

    // Create scheduled datetime for validation
    const scheduledDateTimeObj = new Date(
      scheduleDateTime.value.getFullYear(),
      scheduleDateTime.value.getMonth(),
      scheduleDateTime.value.getDate(),
      hour24,
      minute
    )

    // Validate that scheduled time is in the future
    const now = new Date()
    if (scheduledDateTimeObj <= now) {
      error.value = t('unifiedSchedule.mustBeInFuture', 'Scheduled time must be after now')
      return
    }

    // Format date as YYYY-MM-DD
    const year = scheduleDateTime.value.getFullYear()
    const month = String(scheduleDateTime.value.getMonth() + 1).padStart(2, '0')
    const day = String(scheduleDateTime.value.getDate()).padStart(2, '0')
    scheduledDate = `${year}-${month}-${day}`
    scheduledTime = `${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
  }

  console.log('[UnifiedSchedulePost] Publishing with data:', {
    platforms: selectedPlatforms.value,
    publishType: publishType.value,
    accountSelections: accountSelections.value
  })

  emit('publish', {
    platforms: [...selectedPlatforms.value],
    publishType: publishType.value,
    scheduledDate,
    scheduledTime,
    timezone: selectedTimezone.value,
    accountSelections: accountSelections.value
  })
}

function handleCancel() {
  emit('cancel')
}

// Load connected accounts when component mounts
onMounted(async () => {
  // Load connected accounts from all platforms
  await Promise.all([
    facebookStore.loadConnectedPages(),
    instagramStore.loadConnectedAccounts(),
    tiktokStore.loadConnectedAccounts(),
    twitterStore.loadConnectedAccounts()
  ])

  // Clean up: remove any platforms from selectedPlatforms that don't have accounts selected
  selectedPlatforms.value = selectedPlatforms.value.filter(platformId => {
    if (platformId === 'facebook') {
      return accountSelections.value.facebook && accountSelections.value.facebook.length > 0
    }
    if (platformId === 'instagram') {
      return accountSelections.value.instagram && accountSelections.value.instagram.length > 0
    }
    if (platformId === 'tiktok') {
      return accountSelections.value.tiktok && accountSelections.value.tiktok.length > 0
    }
    return false
  })
})
</script>

<template>
  <div class="unified-schedule-post">
    <!-- Preview Section (optional) -->
    <div v-if="showPreview && (imageUrl || videoUrl)" class="preview-section">
      <div class="preview-media-wrapper">
        <video
          v-if="videoUrl"
          :src="videoUrl"
          controls
          autoplay
          muted
          loop
          class="preview-video"
        />
        <img
          v-else-if="imageUrl"
          :src="imageUrl"
          alt="Post preview"
          class="preview-image"
        />
      </div>
      <div v-if="postText || (hashtags && hashtags.length > 0)" class="preview-content">
        <div v-if="postText" class="preview-text">
          {{ postText }}
        </div>
        <div v-if="hashtags && hashtags.length > 0" class="preview-hashtags">
          {{ hashtags.map(tag => tag.startsWith('#') ? tag : '#' + tag).join(' ') }}
        </div>
      </div>
    </div>

    <!-- Locked Date Header (shown when date is locked) -->
    <div v-if="lockDate" class="locked-date-header">
      <svg class="locked-date-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
      </svg>
      <h3 class="locked-date-title">{{ formattedLockedDate }}</h3>
    </div>

    <!-- Publish Type Toggle (hidden in force schedule mode OR when date is locked) -->
    <div v-if="!forceScheduleMode && !lockDate" class="publish-type-section">
      <h4 class="section-label">{{ t('unifiedSchedule.whenToPublish', 'When to Publish') }}</h4>
      <div class="publish-type-toggle">
        <span class="toggle-slider" :class="{ 'slider-right': publishType === 'schedule' }" />
        <button
          type="button"
          :class="['toggle-btn', { active: publishType === 'now' }]"
          @click="publishType = 'now'"
        >
          {{ t('unifiedSchedule.publishNow', 'Publish Now') }}
        </button>
        <button
          type="button"
          :class="['toggle-btn', { active: publishType === 'schedule' }]"
          @click="publishType = 'schedule'"
        >
          {{ t('unifiedSchedule.scheduleLater', 'Schedule for Later') }}
        </button>
      </div>
    </div>

    <!-- Schedule Section (always shown in force mode or lockDate mode, otherwise when scheduling) -->
    <Transition name="schedule-reveal">
      <div v-if="publishType === 'schedule' || forceScheduleMode || lockDate" class="schedule-section">
        <div class="schedule-datetime-row">
          <!-- Date Picker (only shown when NOT locked) -->
          <div v-if="!lockDate" class="form-group">
            <label class="form-label">{{ t('unifiedSchedule.selectDate', 'Select Date') }}</label>
            <VueDatePicker
              v-model="scheduleDateTime"
              :min-date="today"
              :enable-time-picker="false"
              inline
              auto-apply
              class="date-picker-inline"
            />
          </div>

          <!-- Time Picker -->
          <div class="form-group">
            <label class="form-label">{{ t('unifiedSchedule.selectTime', 'Select Time') }}</label>
            <div class="time-picker-wrapper">
              <MobileTimePicker
                v-model="scheduleTime"
                :minutes-increment="1"
              />
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Platform Selection -->
    <div class="platform-section">
      <h4 class="section-label">{{ t('unifiedSchedule.selectPlatforms', 'Select Platforms') }}</h4>
      <div class="platform-grid">
        <div
          v-for="platform in availablePlatforms"
          :key="platform.id"
          :class="[
            'platform-card',
            {
              selected: selectedPlatforms.includes(platform.id) && accountSelections[platform.id]?.length > 0,
              'not-connected': !platform.isConnected && !platform.comingSoon,
              'coming-soon': platform.comingSoon
            }
          ]"
          @click="handlePlatformClick(platform)"
        >
          <!-- Platform Icon -->
          <PlatformLogo :platform="platform.id as 'facebook' | 'instagram' | 'tiktok' | 'twitter' | 'linkedin' | 'youtube' | 'pinterest' | 'wolt'" :size="40" />

          <!-- Platform Info -->
          <div class="platform-info">
            <span class="platform-name">{{ platform.name }}</span>
            <span v-if="platform.comingSoon" class="status coming-soon">
              {{ t('unifiedSchedule.comingSoon', 'Coming Soon') }}
            </span>
            <span v-else-if="!platform.isConnected" class="status not-connected">
              {{ t('unifiedSchedule.tapToConnect', 'Tap to connect') }}
            </span>
            <span v-else-if="platform.isConnected && accountSelections[platform.id]?.length > 0" class="status accounts-selected">
              {{ accountSelections[platform.id].length }} {{ accountSelections[platform.id].length === 1 ? 'account' : 'accounts' }} selected
            </span>
            <span v-else-if="platform.isConnected" class="status click-to-select">
              {{ t('unifiedSchedule.clickToSelectAccounts', 'Click to select accounts') }}
            </span>
          </div>

          <!-- Selection Checkmark (only show when accounts are selected) -->
          <div v-if="selectedPlatforms.includes(platform.id) && accountSelections[platform.id]?.length > 0" class="selection-check">
            <svg viewBox="0 0 24 24" fill="none" width="24" height="24">
              <circle cx="12" cy="12" r="10" fill="var(--gold-primary)"/>
              <path d="M9 12L11 14L15 10" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <!-- Connected indicator (green dot) for connected platforms without selection -->
          <div v-else-if="platform.isConnected" class="connected-dot"></div>
        </div>
      </div>
    </div>

    <!-- TikTok Privacy Notice -->
    <BaseAlert v-if="selectedPlatforms.includes('tiktok')" type="info" class="tiktok-notice">
      <strong>TikTok Privacy Notice:</strong> Videos will be posted as <strong>Private (Only Me)</strong> due to TikTok's requirements for unaudited apps. You can change the privacy to Public later in the TikTok app.
    </BaseAlert>

    <!-- Publish Summary -->
    <div v-if="hasPlatformsWithAccounts" class="summary-section">
      <h4 class="section-label">{{ $t('unifiedSchedule.publishSummary', 'Where your content will be posted') }}</h4>
      <div class="summary-list">
        <div v-for="item in publishSummary" :key="item.platform" class="summary-platform">
          <div class="summary-platform-header">
            <span class="summary-platform-name">{{ item.platform }}</span>
            <span class="summary-account-count">{{ item.accounts.length }} {{ item.accounts.length === 1 ? 'account' : 'accounts' }}</span>
          </div>
          <div class="summary-accounts">
            <div v-for="account in item.accounts" :key="account.id" class="summary-account">
              <img
                v-if="account.pictureUrl"
                :src="account.pictureUrl"
                :alt="account.name"
                class="summary-account-avatar"
              />
              <div v-else class="summary-account-avatar-placeholder">
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
              <div class="summary-account-info">
                <span class="summary-account-name">{{ account.name }}</span>
                <span v-if="account.postType" class="summary-post-type">
                  <span class="post-type-name">{{ $t(`postType.${account.postType}`) }}</span>
                  <span class="post-type-desc">{{ $t(`postType.${account.postType}Desc`) }}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error -->
    <BaseAlert v-if="error" type="error" class="error-alert">
      {{ error }}
    </BaseAlert>

    <!-- Actions -->
    <div class="actions">
      <BaseButton v-if="showCancelButton" variant="ghost" @click="handleCancel">
        {{ t('common.cancel', 'Cancel') }}
      </BaseButton>
      <BaseButton
        variant="primary"
        :disabled="!canPublish || disabled"
        @click="handlePublish"
      >
        {{ publishType === 'now'
          ? t('unifiedSchedule.publish', 'Publish')
          : t('unifiedSchedule.schedule', 'Schedule Post')
        }}
      </BaseButton>
    </div>

    <!-- Account Selection Modal -->
    <Teleport to="body">
      <BaseModal
        v-model="showAccountModal"
        size="md"
        :show-close-button="true"
        @close="closeAccountModal"
      >
        <div class="account-modal-content">
          <h3 class="account-modal-title">
            {{ currentPlatformForSelection === 'facebook'
              ? $t('accountSelector.selectFacebookPages', 'Select Facebook Pages')
              : currentPlatformForSelection === 'instagram'
              ? $t('accountSelector.selectInstagramAccounts', 'Select Instagram Accounts')
              : currentPlatformForSelection === 'tiktok'
              ? $t('accountSelector.selectTikTokAccounts', 'Select TikTok Accounts')
              : $t('accountSelector.selectTwitterAccounts', 'Select Twitter Accounts')
            }}
          </h3>
          <p class="account-modal-subtitle">
            {{ $t('unifiedSchedule.selectAccountsInfo', 'Choose which accounts to post to') }}
          </p>

          <AccountSelector
            v-if="currentPlatformForSelection"
            :platform="currentPlatformForSelection"
            :multi-select="true"
            :show-post-type-selector="['facebook', 'instagram'].includes(currentPlatformForSelection)"
            :content-type="props.videoUrl ? 'video' : 'image'"
            :has-multiple-images="(props.carouselItems?.length || 0) >= 2"
            :business-id="props.businessId"
            v-model="tempAccountSelections"
          />

          <div class="account-modal-actions">
            <BaseButton variant="ghost" @click="closeAccountModal">
              {{ $t('common.cancel', 'Cancel') }}
            </BaseButton>
            <BaseButton
              variant="primary"
              @click="confirmAccountSelection"
            >
              {{ $t('common.save', 'Confirm') }}
            </BaseButton>
          </div>
        </div>
      </BaseModal>
    </Teleport>
  </div>
</template>

<style scoped>
.unified-schedule-post {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

/* Preview Section */
.preview-section {
  display: flex;
  gap: var(--space-lg);
  padding: var(--space-lg);
  background: var(--bg-tertiary);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-lg);
}

.preview-media-wrapper {
  flex-shrink: 0;
  width: 200px;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--bg-secondary);
}

.preview-image {
  width: 100%;
  height: auto;
  aspect-ratio: 9 / 16;
  object-fit: cover;
}

.preview-video {
  width: 100%;
  height: auto;
  max-height: 300px;
  object-fit: contain;
  background: black;
}

.preview-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  min-width: 0;
}

.preview-text {
  color: var(--text-primary);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
  white-space: pre-wrap;
  word-break: break-word;
}

.preview-hashtags {
  color: var(--gold-primary);
  font-size: var(--text-sm);
  line-height: var(--leading-normal);
  word-break: break-word;
}

@media (max-width: 640px) {
  .preview-section {
    flex-direction: column;
  }

  .preview-media-wrapper {
    width: 100%;
    max-width: 300px;
    margin: 0 auto;
  }
}

/* Publish Type Toggle */
.publish-type-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.section-label {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.publish-type-toggle {
  display: flex;
  position: relative;
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  padding: var(--space-xs);
}

.toggle-slider {
  position: absolute;
  top: var(--space-xs);
  left: var(--space-xs);
  width: calc(50% - var(--space-xs));
  height: calc(100% - var(--space-xs) * 2);
  background: var(--gold-primary);
  border-radius: var(--radius-sm);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 0;
}

.toggle-slider.slider-right {
  transform: translateX(100%);
}

.toggle-btn {
  flex: 1;
  position: relative;
  z-index: 1;
  padding: var(--space-md) var(--space-lg);
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: color var(--transition-base);
}

.toggle-btn:hover {
  color: var(--text-primary);
}

.toggle-btn.active {
  color: var(--text-on-gold);
  background: transparent;
}

/* Schedule Section */
.schedule-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
  padding: var(--space-xl);
  background: var(--glass-bg);
  border: var(--border-width) solid var(--glass-border);
  border-radius: var(--radius-lg);
  backdrop-filter: blur(var(--blur-md));
}

.schedule-datetime-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: var(--space-xl);
  align-items: start;
}

/* Schedule Reveal Transition */
.schedule-reveal-enter-active {
  transition: all 0.35s ease;
  overflow: hidden;
}

.schedule-reveal-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}

.schedule-reveal-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}

.schedule-reveal-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.form-label {
  font-size: var(--text-sm);
  color: var(--gold-primary);
  font-weight: var(--font-medium);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.form-select {
  padding: var(--space-md) var(--space-lg);
  background: var(--bg-secondary);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  transition: var(--transition-base);
  cursor: pointer;
  width: 100%;
}

.form-select option {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.form-select:hover {
  border-color: var(--gold-primary);
}

.form-select:focus {
  outline: none;
  border-color: var(--gold-primary);
  box-shadow: var(--glow-gold-sm);
}

/* Locked Date Header */
.locked-date-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
  padding: var(--space-lg) var(--space-xl);
  background: rgba(15, 61, 46, 0.05);
  border: var(--border-width) solid rgba(15, 61, 46, 0.15);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-md);
}

.locked-date-icon {
  width: 24px;
  height: 24px;
  color: var(--gold-primary);
  flex-shrink: 0;
}

.locked-date-title {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0;
}

/* Platform Section */
.platform-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.platform-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: var(--space-md);
}

.platform-card {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md);
  background: var(--bg-tertiary);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-base);
  position: relative;
}

.platform-card:hover:not(.disabled) {
  border-color: var(--gold-primary);
}

.platform-card.selected {
  border-color: var(--gold-primary);
  background: var(--gold-subtle);
}

.platform-card.not-connected {
  border-style: dashed;
}

.platform-card.not-connected:hover {
  border-color: var(--gold-primary);
  background: var(--gold-subtle);
}

.platform-card.coming-soon {
  opacity: 0.5;
  cursor: not-allowed;
}

.platform-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.platform-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.platform-name {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-primary);
}

.status {
  font-size: var(--text-xs);
}

.status.connected {
  color: var(--success-text);
}

.status.coming-soon {
  color: var(--text-muted);
  font-style: italic;
}

.status.not-connected {
  color: var(--gold-primary);
}

.status.click-to-select {
  color: var(--text-secondary);
  font-style: italic;
}

.status.accounts-selected {
  color: var(--success-text);
  font-weight: 600;
}

.selection-check {
  position: absolute;
  top: var(--space-sm);
  right: var(--space-sm);
}

.connected-dot {
  position: absolute;
  top: var(--space-sm);
  right: var(--space-sm);
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #4ade80;
}

/* Publish Summary Section */
.summary-section {
  margin-top: var(--space-xl);
  padding: var(--space-xl);
  background: var(--bg-tertiary);
  border-radius: var(--radius-lg);
  border: 2px solid var(--gold-primary);
}

.summary-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  margin-top: var(--space-md);
}

.summary-platform {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.summary-platform-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: var(--space-sm);
  border-bottom: 1px solid var(--border-color);
}

.summary-platform-name {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--text-primary);
}

.summary-account-count {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  font-weight: 500;
}

.summary-accounts {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  margin-top: var(--space-sm);
}

.summary-account {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
}

.summary-account-avatar {
  width: 24px;
  height: 24px;
  border-radius: var(--radius-full);
  object-fit: cover;
  flex-shrink: 0;
}

.summary-account-avatar-placeholder {
  width: 24px;
  height: 24px;
  border-radius: var(--radius-full);
  background: var(--bg-elevated);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  flex-shrink: 0;
}

.summary-account-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.summary-account-name {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text-primary);
}

.summary-post-type {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.post-type-name {
  font-size: var(--text-xs);
  color: var(--gold-primary);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.post-type-desc {
  font-size: var(--text-xs);
  color: var(--text-secondary);
  font-weight: 400;
  line-height: 1.3;
}

/* Account Selection Modal */
.account-modal-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  padding: var(--space-xl);
}

.account-modal-title {
  font-size: var(--text-2xl);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.account-modal-subtitle {
  font-size: var(--text-base);
  color: var(--text-secondary);
  margin: 0;
}

.account-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-md);
  padding-top: var(--space-lg);
  border-top: 1px solid var(--border-color);
}

/* Error Alert */
.error-alert {
  margin-top: var(--space-md);
}

/* TikTok Notice */
.tiktok-notice {
  margin-top: var(--space-lg);
}

/* Actions */
.actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-md);
  padding-top: var(--space-lg);
  border-top: var(--border-width) solid var(--border-color);
}

/* Inline Date Picker Container */
.date-picker-inline {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  display: flex;
  justify-content: center;
}

/* Force the calendar to not have minimum widths */
.date-picker-inline :deep(.dp__menu) {
  border: none !important;
  background: transparent !important;
  box-shadow: none !important;
  min-width: unset !important;
}

.date-picker-inline :deep(.dp__instance_calendar) {
  min-width: unset !important;
}

.date-picker-inline :deep(.dp__calendar) {
  min-width: unset !important;
}

.date-picker-inline :deep(.dp__calendar_header_item) {
  padding: 4px 2px !important;
  font-size: 11px !important;
  width: auto !important;
  flex: 1 1 0 !important;
  min-width: 36px !important;
}

.date-picker-inline :deep(.dp__calendar_item) {
  width: auto !important;
  flex: 1 1 0 !important;
  min-width: 36px !important;
}

.date-picker-inline :deep(.dp__cell_inner) {
  width: 36px !important;
  height: 36px !important;
  font-size: var(--text-sm) !important;
  padding: 0 !important;
  border-radius: var(--radius-md) !important;
  transition: var(--transition-fast);
}

.date-picker-inline :deep(.dp__cell_offset) {
  width: 36px !important;
  height: 36px !important;
}

/* Month/year header */
.date-picker-inline :deep(.dp__month_year_row) {
  padding: 0 4px;
}

.date-picker-inline :deep(.dp__inner_nav) {
  width: 28px !important;
  height: 28px !important;
}

/* Hide the time picker toggle button at bottom of calendar */
.date-picker-inline :deep(.dp__action_row),
.date-picker-inline :deep(.dp__selection_preview),
.date-picker-inline :deep(.dp__action_buttons),
.date-picker-inline :deep(.dp__time_picker_inline_container),
.date-picker-inline :deep(.dp__button) {
  display: none !important;
}

/* Time Picker Wrapper */
.time-picker-wrapper {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  display: flex;
  justify-content: center;
}

/* Date/Time Picker Theme Override */
:deep(.dp__theme_light) {
  --dp-background-color: transparent;
  --dp-text-color: var(--text-primary);
  --dp-hover-color: rgba(15, 61, 46, 0.08);
  --dp-hover-text-color: var(--text-primary);
  --dp-primary-color: var(--gold-primary);
  --dp-primary-text-color: var(--text-on-gold);
  --dp-secondary-color: rgba(15, 61, 46, 0.05);
  --dp-border-color: rgba(15, 61, 46, 0.15);
  --dp-menu-border-color: transparent;
  --dp-border-color-hover: var(--gold-primary);
  --dp-disabled-color: var(--text-muted);
  --dp-disabled-color-text: var(--text-muted);
  --dp-success-color: var(--gold-primary);
  --dp-icon-color: var(--gold-primary);
  --dp-danger-color: #ef4444;
  --dp-highlight-color: rgba(15, 61, 46, 0.05);
}

/* Inline picker - remove default styling */
:deep(.dp__main) {
  width: 100%;
}

:deep(.dp__menu) {
  border: none;
  background: transparent;
  box-shadow: none;
}

/* Calendar header */
:deep(.dp__calendar_header) {
  font-weight: var(--font-semibold);
}

:deep(.dp__calendar_header_item) {
  color: var(--gold-primary);
  font-weight: var(--font-medium);
  text-transform: uppercase;
  font-size: var(--text-xs);
}

/* Month/Year navigation */
:deep(.dp__month_year_row) {
  margin-bottom: var(--space-md);
}

:deep(.dp__month_year_select) {
  color: var(--text-primary);
  font-weight: var(--font-semibold);
  font-size: var(--text-lg);
}

:deep(.dp__month_year_select:hover) {
  color: var(--gold-primary);
  background: rgba(15, 61, 46, 0.05);
  border-radius: var(--radius-sm);
}

/* Navigation arrows */
:deep(.dp__inner_nav) {
  color: var(--text-secondary);
  width: 36px;
  height: 36px;
}

:deep(.dp__inner_nav:hover) {
  background: rgba(15, 61, 46, 0.08);
  color: var(--gold-primary);
  border-radius: var(--radius-sm);
}

/* Calendar days */
:deep(.dp__calendar_item) {
  border-radius: var(--radius-md);
}

:deep(.dp__cell_inner) {
  border-radius: var(--radius-md);
  width: 36px;
  height: 36px;
  font-size: var(--text-sm);
  transition: var(--transition-fast);
}

:deep(.dp__today) {
  border: 2px solid var(--gold-primary);
  font-weight: var(--font-semibold);
}

:deep(.dp__active_date) {
  background: var(--gold-primary);
  color: var(--text-on-gold);
  box-shadow: var(--shadow-sm);
}

:deep(.dp__cell_offset) {
  color: var(--text-muted);
  opacity: 0.4;
}

:deep(.dp__cell_disabled) {
  color: var(--text-muted);
  opacity: 0.3;
}

/* Hide action row in inline mode */
:deep(.dp__action_row) {
  display: none;
}

/* Responsive */
@media (max-width: 768px) {
  .platform-grid {
    grid-template-columns: 1fr;
  }

  .publish-type-toggle {
    flex-direction: column;
  }

  .toggle-slider {
    width: calc(100% - var(--space-xs) * 2);
    height: calc(50% - var(--space-xs));
  }

  .toggle-slider.slider-right {
    transform: translateY(100%);
  }

  .schedule-datetime-row {
    grid-template-columns: 1fr;
  }

  .actions {
    flex-direction: column;
  }

  .actions > * {
    width: 100%;
  }

  .date-picker-inline :deep(.dp__cell_inner) {
    width: 32px !important;
    height: 32px !important;
  }

  .date-picker-inline :deep(.dp__cell_offset) {
    width: 32px !important;
    height: 32px !important;
  }

  .date-picker-inline :deep(.dp__calendar_header_item) {
    min-width: 32px !important;
  }

  .date-picker-inline :deep(.dp__calendar_item) {
    min-width: 32px !important;
  }
}

@media (prefers-reduced-motion: reduce) {
  .toggle-slider,
  .schedule-reveal-enter-active,
  .schedule-reveal-leave-active {
    transition-duration: 0.01ms !important;
  }
}
</style>

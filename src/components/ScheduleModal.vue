<template>
  <BaseModal
    :model-value="modelValue"
    size="lg"
    :title="$t('scheduleModal.title')"
    :show-close-button="true"
    card-variant="glass-intense"
    @update:model-value="(val: boolean) => !val && closeModal()"
    @close="closeModal"
  >
    <!-- Preview -->
    <div v-if="favoritePost" class="preview-section">
      <h4 class="section-title">{{ $t('scheduleModal.preview') }}</h4>
      <div class="preview-content">
        <!-- Show video if video_url exists -->
        <video
          v-if="favoritePost.video_url"
          :src="favoritePost.video_url"
          class="preview-media"
          controls
        ></video>
        <!-- Otherwise show image -->
        <img
          v-else-if="favoritePost.media_url"
          :src="favoritePost.media_url"
          alt="Post preview"
          class="preview-media"
        />
        <p v-if="favoritePost.post_text" class="preview-text">
          {{ truncateText(favoritePost.post_text, 100) }}
        </p>
      </div>
    </div>

    <!-- Notes -->
    <div class="form-group notes-section">
      <label for="notes" class="form-label">{{ $t('scheduleModal.notesLabel') }}</label>
      <textarea
        id="notes"
        v-model="formData.notes"
        class="form-textarea"
        rows="2"
        :placeholder="$t('scheduleModal.notesPlaceholder')"
      ></textarea>
    </div>

    <!-- Unified Schedule Component -->
    <UnifiedSchedulePost
      :disabled="scheduling"
      :show-cancel-button="true"
      :initial-platforms="initialPlatforms"
      @publish="handleUnifiedPublish"
      @cancel="closeModal"
    />

    <BaseAlert v-if="error" type="error" class="form-alert">
      {{ error }}
    </BaseAlert>
  </BaseModal>

  <!-- Publishing Progress Modal -->
  <PublishingProgressModal
    :visible="showPublishingModal"
    :platforms="publishingProgress"
    :is-complete="publishingComplete"
    @create-another="handlePublishingModalCreateAnother"
    @close="handlePublishingModalClose"
  />

  <!-- Success Modal -->
  <SuccessModal
    :visible="showSuccessModal"
    :published-urls="publishedUrls"
    :failed-platforms="failedPlatforms"
    @create-another="handleSuccessModalCreateAnother"
    @close="handleSuccessModalClose"
  />
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import BaseModal from './BaseModal.vue'
import BaseAlert from './BaseAlert.vue'
import UnifiedSchedulePost from './UnifiedSchedulePost.vue'
import SuccessModal from './SuccessModal.vue'
import PublishingProgressModal from './PublishingProgressModal.vue'
import { api } from '../services/api'
import { useSocialAccounts } from '../composables/useSocialAccounts'
import { useFacebookStore } from '@/stores/facebook'
import { useInstagramStore } from '@/stores/instagram'
import { useTikTokStore } from '@/stores/tiktok'
import { useTwitterStore } from '@/stores/twitter'
import { useNotificationStore } from '@/stores/notifications'
import { warnLog } from '@/utils/debug'

useI18n()

const router = useRouter()
const facebookStore = useFacebookStore()
const instagramStore = useInstagramStore()
const tiktokStore = useTikTokStore()
const twitterStore = useTwitterStore()
const notificationStore = useNotificationStore()

// Social accounts composable
const { isConnected } = useSocialAccounts()

interface Props {
  modelValue: boolean
  favoritePost: any | null
  preselectedDate?: string | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'scheduled', scheduledPost: any): void
}>()

const formData = ref({
  notes: '',
})

const scheduling = ref(false)
const error = ref('')

// Publishing progress modal state
const showPublishingModal = ref(false)
const publishingProgress = ref<Array<{
  platform: string
  status: 'pending' | 'publishing' | 'success' | 'error'
  url?: string
  error?: string
}>>([])
const publishingComplete = ref(false)

// Success modal state
const showSuccessModal = ref(false)
const publishedUrls = ref<Record<string, string>>({})
const failedPlatforms = ref<Array<{ platform: string; error: string }>>([])

// Compute initial platforms from favoritePost
const initialPlatforms = computed(() => {
  if (props.favoritePost?.platform && isConnected(props.favoritePost.platform)) {
    return [props.favoritePost.platform]
  }
  return []
})

watch(() => props.modelValue, async (newValue) => {
  if (newValue) {
    // Reset form when modal opens
    formData.value = {
      notes: '',
    }
    error.value = ''

    // Load connected accounts from all platforms
    await Promise.all([
      facebookStore.loadConnectedPages(),
      instagramStore.loadConnectedAccounts(),
      tiktokStore.loadConnectedAccounts(),
      twitterStore.loadConnectedAccounts()
    ])
  }
})

const closeModal = () => {
  emit('update:modelValue', false)
}

const handleUnifiedPublish = async (data: {
  platforms: string[]
  publishType: 'now' | 'schedule'
  scheduledDate?: string
  scheduledTime?: string
  timezone?: string
  accountSelections?: {
    facebook?: string[]
    instagram?: string[]
    tiktok?: string[]
    twitter?: string[]
  }
}) => {
  if (!props.favoritePost?.id) {
    error.value = 'No favorite post selected'
    return
  }

  if (data.platforms.length === 0) {
    error.value = 'Please select at least one platform'
    return
  }

  try {
    scheduling.value = true
    error.value = ''

    if (data.publishType === 'now') {
      // Initialize publishing progress
      publishingProgress.value = data.platforms.map(platform => ({
        platform,
        status: 'pending' as const,
        url: undefined,
        error: undefined
      }))
      publishingComplete.value = false

      // Show publishing modal immediately
      showPublishingModal.value = true

      // Publish immediately to all platforms
      const results: Array<{ platform: string; success: boolean; url?: string; error?: string }> = []
      const postUrls: Record<string, string> = {}

      // Build the message with post text and hashtags
      const hashtags = props.favoritePost.hashtags || []
      const postText = props.favoritePost.post_text || ''
      const message = hashtags.length > 0
        ? `${postText}\n\n${hashtags.map((h: string) => h.startsWith('#') ? h : `#${h}`).join(' ')}`
        : postText

      // Publish to each platform
      for (const platform of data.platforms) {
        // Update status to "publishing"
        const progressItem = publishingProgress.value.find(p => p.platform === platform)
        if (progressItem) {
          progressItem.status = 'publishing'
        }
        if (platform === 'facebook') {
          // Get selected page IDs from user selection
          const selectedPageIds = data.accountSelections?.facebook || []

          if (selectedPageIds.length === 0) {
            results.push({ platform: 'facebook', success: false, error: 'No Facebook page selected' })
            // Update progress
            if (progressItem) {
              progressItem.status = 'error'
              progressItem.error = 'No Facebook page selected'
            }
            continue
          }

          // Post to each selected page
          for (const pageId of selectedPageIds) {
            const selectedPage = facebookStore.connectedPages.find(p => p.pageId === pageId)
            if (!selectedPage) {
              warnLog(`Facebook page with ID ${pageId} not found in connected pages`)
              continue
            }

            try {
              // Use video_url if it exists, otherwise check content_type
              const hasVideo = !!props.favoritePost.video_url
              const isVideo = hasVideo || props.favoritePost.content_type === 'video'
              const videoUrl = props.favoritePost.video_url || props.favoritePost.media_url
              const response = await api.postToFacebook(
                selectedPage.pageId,
                message,
                isVideo ? undefined : props.favoritePost.media_url,
                isVideo ? videoUrl : undefined,
                isVideo ? 'video' : 'image'
              )

              const postUrl = (response as any).postUrl || response.data?.postUrl
              if (response.success && postUrl) {
                results.push({ platform: 'facebook', success: true, url: postUrl })
                postUrls.facebook = postUrl
                notificationStore.addPublishSuccess('facebook', postUrl)
                // Update progress
                if (progressItem) {
                  progressItem.status = 'success'
                  progressItem.url = postUrl
                }
              } else {
                const errorMsg = response.error || 'Failed to publish'
                results.push({ platform: 'facebook', success: false, error: errorMsg })
                // Update progress
                if (progressItem) {
                  progressItem.status = 'error'
                  progressItem.error = errorMsg
                }
              }
            } catch (err: any) {
              const errorMsg = err.message || 'Failed to publish'
              results.push({ platform: 'facebook', success: false, error: errorMsg })
              // Update progress
              if (progressItem) {
                progressItem.status = 'error'
                progressItem.error = errorMsg
              }
            }
          }
        } else if (platform === 'instagram') {
          // Get selected Instagram account IDs from user selection
          const selectedAccountIds = data.accountSelections?.instagram || []

          if (selectedAccountIds.length === 0) {
            results.push({ platform: 'instagram', success: false, error: 'No Instagram account selected' })
            // Update progress
            if (progressItem) {
              progressItem.status = 'error'
              progressItem.error = 'No Instagram account selected'
            }
            continue
          }

          // Post to each selected account
          for (const accountId of selectedAccountIds) {
            const selectedAccount = instagramStore.connectedAccounts.find(a => a.instagramAccountId === accountId)
            if (!selectedAccount) {
              warnLog(`Instagram account with ID ${accountId} not found in connected accounts`)
              continue
            }

            try {
              // Use video_url if it exists, otherwise check content_type
              const hasVideo = !!props.favoritePost.video_url
              const isVideo = hasVideo || props.favoritePost.content_type === 'video'
              const videoUrl = props.favoritePost.video_url || props.favoritePost.media_url
              const response = await api.postToInstagram(
                selectedAccount.instagramAccountId,
                message,
                isVideo ? undefined : props.favoritePost.media_url,
                isVideo ? videoUrl : undefined,
                isVideo ? 'video' : 'image'
              )

              const postUrl = (response as any).postUrl || response.data?.postUrl
              if (response.success && postUrl) {
                results.push({ platform: 'instagram', success: true, url: postUrl })
                postUrls.instagram = postUrl
                notificationStore.addPublishSuccess('instagram', postUrl)
                // Update progress
                if (progressItem) {
                  progressItem.status = 'success'
                  progressItem.url = postUrl
                }
              } else {
                const errorMsg = response.error || 'Failed to publish'
                results.push({ platform: 'instagram', success: false, error: errorMsg })
                // Update progress
                if (progressItem) {
                  progressItem.status = 'error'
                  progressItem.error = errorMsg
                }
              }
            } catch (err: any) {
              const errorMsg = err.message || 'Failed to publish'
              results.push({ platform: 'instagram', success: false, error: errorMsg })
              // Update progress
              if (progressItem) {
                progressItem.status = 'error'
                progressItem.error = errorMsg
              }
            }
          }
        } else if (platform === 'tiktok') {
          // Get selected TikTok account IDs from user selection
          const selectedAccountIds = data.accountSelections?.tiktok || []

          if (selectedAccountIds.length === 0) {
            results.push({ platform: 'tiktok', success: false, error: 'No TikTok account selected' })
            // Update progress
            if (progressItem) {
              progressItem.status = 'error'
              progressItem.error = 'No TikTok account selected'
            }
            continue
          }

          // Validate video content
          const hasVideo = !!props.favoritePost.video_url
          if (!hasVideo) {
            const errorMsg = 'TikTok requires video content. This post only has an image.'
            results.push({ platform: 'tiktok', success: false, error: errorMsg })
            // Update progress
            if (progressItem) {
              progressItem.status = 'error'
              progressItem.error = errorMsg
            }
            continue
          }

          // Post to each selected account
          for (const accountId of selectedAccountIds) {
            const selectedAccount = tiktokStore.connectedAccounts.find(a => a.tiktokAccountId === accountId)
            if (!selectedAccount) {
              warnLog(`TikTok account with ID ${accountId} not found in connected accounts`)
              continue
            }

            try {
              const videoUrl = props.favoritePost.video_url
              // Note: TikTok requires SELF_ONLY privacy for unaudited apps
              // Posts will be private until manually changed in TikTok app
              const response = await api.postToTikTok(
                accountId,
                message,
                videoUrl,
                'SELF_ONLY'
              )

              const postUrl = response.data?.postUrl
              if (response.success && postUrl) {
                results.push({ platform: 'tiktok', success: true, url: postUrl })
                postUrls.tiktok = postUrl
                notificationStore.addPublishSuccess('tiktok', postUrl)
                // Update progress
                if (progressItem) {
                  progressItem.status = 'success'
                  progressItem.url = postUrl
                }
              } else {
                const errorMsg = response.error || 'Failed to publish'
                results.push({ platform: 'tiktok', success: false, error: errorMsg })
                // Update progress
                if (progressItem) {
                  progressItem.status = 'error'
                  progressItem.error = errorMsg
                }
              }
            } catch (err: any) {
              const errorMsg = err.message || 'Failed to publish'
              results.push({ platform: 'tiktok', success: false, error: errorMsg })
              // Update progress
              if (progressItem) {
                progressItem.status = 'error'
                progressItem.error = errorMsg
              }
            }
          }
        } else if (platform === 'twitter') {
          // Get selected Twitter account IDs from user selection
          const selectedAccountIds = data.accountSelections?.twitter || []

          if (selectedAccountIds.length === 0) {
            results.push({ platform: 'twitter', success: false, error: 'No Twitter account selected' })
            // Update progress
            if (progressItem) {
              progressItem.status = 'error'
              progressItem.error = 'No Twitter account selected'
            }
            continue
          }

          // Validate character limit (280 chars for standard accounts)
          if (message.length > 280) {
            const errorMsg = 'Tweet text exceeds 280 character limit'
            results.push({ platform: 'twitter', success: false, error: errorMsg })
            // Update progress
            if (progressItem) {
              progressItem.status = 'error'
              progressItem.error = errorMsg
            }
            continue
          }

          // Post to each selected account
          for (const accountId of selectedAccountIds) {
            const selectedAccount = twitterStore.connectedAccounts.find(a => a.twitterAccountId === accountId)
            if (!selectedAccount) {
              warnLog(`Twitter account with ID ${accountId} not found in connected accounts`)
              continue
            }

            try {
              // Prepare media URLs for Twitter
              const mediaUrls: string[] = []
              const hasVideo = !!props.favoritePost.video_url
              const isVideo = hasVideo || props.favoritePost.content_type === 'video'

              if (isVideo && (props.favoritePost.video_url || props.favoritePost.media_url)) {
                mediaUrls.push(props.favoritePost.video_url || props.favoritePost.media_url)
              } else if (props.favoritePost.media_url) {
                mediaUrls.push(props.favoritePost.media_url)
              }

              const response = await api.postToTwitter(
                accountId,
                message,
                mediaUrls
              )

              const tweetUrl = (response as any).tweetUrl || response.data?.tweetUrl
              if (response.success && tweetUrl) {
                results.push({ platform: 'twitter', success: true, url: tweetUrl })
                postUrls.twitter = tweetUrl
                notificationStore.addPublishSuccess('twitter', tweetUrl)
                // Update progress
                if (progressItem) {
                  progressItem.status = 'success'
                  progressItem.url = tweetUrl
                }
              } else {
                const errorMsg = response.error || 'Failed to publish'
                results.push({ platform: 'twitter', success: false, error: errorMsg })
                // Update progress
                if (progressItem) {
                  progressItem.status = 'error'
                  progressItem.error = errorMsg
                }
              }
            } catch (err: any) {
              const errorMsg = err.message || 'Failed to publish'
              results.push({ platform: 'twitter', success: false, error: errorMsg })
              // Update progress
              if (progressItem) {
                progressItem.status = 'error'
                progressItem.error = errorMsg
              }
            }
          }
        } else {
          results.push({ platform, success: false, error: `${platform} publishing not yet supported` })
        }
      }

      // Mark publishing as complete
      publishingComplete.value = true

      // Check results
      const successfulPlatforms = results.filter(r => r.success)
      const failed = results.filter(r => !r.success)

      if (successfulPlatforms.length > 0) {
        // Save to calendar with published status
        const now = new Date()
        try {
          await api.createPublishedPost({
            favorite_post_id: props.favoritePost.id,
            published_date: now.toISOString().split('T')[0],
            published_time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
            platforms: successfulPlatforms.map(r => r.platform),
            timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
            platform_post_urls: postUrls
          })
        } catch (calendarErr) {
          warnLog('Failed to save to calendar:', calendarErr)
        }

        // Close the main schedule modal (publishing progress modal stays open)
        closeModal()
      } else {
        // All platforms failed
        error.value = failed.map(f => f.error).join('. ')
      }
    } else {
      // Schedule for later
      const scheduleData = {
        favorite_post_id: props.favoritePost.id,
        scheduled_date: data.scheduledDate,
        scheduled_time: data.scheduledTime || undefined,
        timezone: data.timezone,
        notes: formData.value.notes || undefined,
        platforms: data.platforms,
        platform_settings: data.accountSelections || {}, // Include selected accounts for each platform
      }
      const response = await api.schedulePost(scheduleData)

      if (response.success) {
        emit('scheduled', { success: true, publishType: data.publishType })
        closeModal()
        router.push('/scheduler')
      } else {
        error.value = response.error || 'Failed to schedule post'
      }
    }

  } catch (err: any) {
    error.value = err.message || 'Failed to process post'
    publishingComplete.value = true
  } finally {
    scheduling.value = false
  }
}

const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// Publishing progress modal handlers
function handlePublishingModalCreateAnother() {
  showPublishingModal.value = false
  publishingProgress.value = []
  publishingComplete.value = false
  router.push('/posts/create')
}

function handlePublishingModalClose() {
  showPublishingModal.value = false
  publishingProgress.value = []
  publishingComplete.value = false
}

// Success modal handlers
function handleSuccessModalCreateAnother() {
  showSuccessModal.value = false
  router.push('/posts/create')
}

function handleSuccessModalClose() {
  showSuccessModal.value = false
}
</script>

<style scoped>
.preview-section {
  margin-bottom: var(--space-2xl);
}

.section-title {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  color: var(--text-primary);
  margin: 0 0 var(--space-md) 0;
}

.preview-content {
  background: rgba(15, 61, 46, 0.15);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  border: 1px solid rgba(15, 61, 46, 0.2);
}

.preview-media {
  width: 100%;
  max-height: 300px;
  object-fit: contain;
  border-radius: var(--radius-md);
  margin-bottom: var(--space-md);
}

.preview-text {
  color: var(--text-secondary);
  font-size: var(--text-sm);
  line-height: 1.5;
  margin: 0;
}

.notes-section {
  margin-bottom: var(--space-lg);
  padding-bottom: var(--space-lg);
  border-bottom: 1px solid rgba(15, 61, 46, 0.2);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.form-label {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-primary);
}

.form-label .required {
  color: #ef4444;
  margin-left: 2px;
}

.date-hint {
  margin: 0;
  font-size: var(--text-xs);
  color: var(--gold-primary);
  font-weight: 500;
}

.date-input {
  cursor: pointer;
  color: var(--gold-primary);
  font-weight: var(--font-semibold);
}

.date-input::-webkit-calendar-picker-indicator {
  cursor: pointer;
  filter: invert(0.8) sepia(1) saturate(5) hue-rotate(10deg);
  opacity: 0.9;
  transition: opacity 0.2s ease;
}

.date-input::-webkit-calendar-picker-indicator:hover {
  opacity: 1;
  filter: invert(0.9) sepia(1) saturate(6) hue-rotate(10deg);
}

/* Time Picker Styles */
.time-picker {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.time-select {
  flex: 1;
  padding: var(--space-md);
  background: rgba(15, 61, 46, 0.2);
  border: 1px solid rgba(15, 61, 46, 0.3);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.time-select:focus {
  outline: none;
  border-color: var(--gold-primary);
  background: rgba(15, 61, 46, 0.25);
}

.time-select option {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.time-separator {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--gold-primary);
  user-select: none;
}

.period-select {
  flex: 0.8;
  padding: var(--space-md);
  background: rgba(15, 61, 46, 0.15);
  border: 1px solid var(--gold-primary);
  border-radius: var(--radius-md);
  color: var(--gold-primary);
  font-family: var(--font-body);
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.period-select:focus {
  outline: none;
  background: rgba(15, 61, 46, 0.25);
}

.period-select option {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.time-hint {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--text-secondary);
  font-weight: var(--font-medium);
}

/* Platform Styles */
.platform-select {
  cursor: pointer;
  font-size: var(--text-base);
}

.platform-hint {
  margin: 0;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.platform-hint.error {
  color: #ef4444;
}

.platform-hint.warning {
  color: #f59e0b;
}

/* Timezone Styles */
.timezone-select {
  cursor: pointer;
}

.detected-badge {
  font-size: var(--text-xs);
  color: var(--gold-primary);
  font-weight: var(--font-medium);
  background: rgba(15, 61, 46, 0.15);
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  margin-left: var(--space-sm);
}

.timezone-hint {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--gold-light);
  font-weight: var(--font-medium);
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: var(--space-md);
  background: rgba(15, 61, 46, 0.2);
  border: 1px solid rgba(15, 61, 46, 0.3);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: var(--text-base);
  transition: all 0.2s ease;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--gold-primary);
  background: rgba(15, 61, 46, 0.25);
}

.form-select option {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.form-alert {
  margin: 0;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-md);
  margin-top: var(--space-lg);
}

/* Platform Grid */
.platform-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--space-md);
  margin-bottom: var(--space-md);
}

/* Platform Card */
.platform-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-lg);
  background: rgba(15, 61, 46, 0.15);
  border: 2px solid rgba(15, 61, 46, 0.2);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-base);
}

.platform-card:hover:not(.disabled) {
  border-color: rgba(15, 61, 46, 0.4);
  background: rgba(15, 61, 46, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(15, 61, 46, 0.15);
}

.platform-card.selected {
  border-color: var(--gold-primary);
  background: rgba(15, 61, 46, 0.15);
  box-shadow: 0 0 20px rgba(15, 61, 46, 0.2);
}

.platform-card.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: rgba(15, 61, 46, 0.1);
}

.platform-card.coming-soon {
  opacity: 0.6;
}

/* Platform Icon */
.platform-card-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(15, 61, 46, 0.15);
}

/* Platform Content */
.platform-card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  min-width: 0;
}

.platform-name {
  font-family: var(--font-heading);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
}

.connection-status.connected {
  color: var(--gold-primary);
}

.connection-status.not-connected {
  color: var(--text-muted);
}

.connection-status.coming-soon {
  color: #f59e0b;
}

.checkmark-icon {
  width: 14px;
  height: 14px;
}

.account-count {
  color: var(--text-secondary);
  font-size: var(--text-xs);
}

/* Selection Indicator */
.selection-indicator {
  position: absolute;
  top: var(--space-sm);
  right: var(--space-sm);
  width: 24px;
  height: 24px;
  animation: scaleIn 0.2s ease;
}

@keyframes scaleIn {
  from {
    transform: scale(0);
  }
  to {
    transform: scale(1);
  }
}

.selection-indicator svg {
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 2px 4px rgba(15, 61, 46, 0.15));
}

/* Responsive */
@media (max-width: 768px) {
  .preview-media {
    max-height: 200px;
  }

  .platform-grid {
    grid-template-columns: 1fr;
  }

  .platform-card {
    min-height: var(--touch-target-comfortable);
  }
}

@media (max-width: 480px) {
  .preview-media {
    max-height: 150px;
  }

  .preview-container {
    padding: var(--space-md);
  }

  .preview-details {
    padding: var(--space-md);
  }

  .preview-text {
    font-size: var(--text-sm);
  }

  .schedule-settings {
    gap: var(--space-md);
  }

  .setting-group label {
    font-size: var(--text-sm);
  }

  .time-select,
  .period-select {
    min-height: var(--touch-target-min);
    font-size: var(--text-base);
  }

  .platform-card {
    padding: var(--space-md);
  }

  .platform-info h4 {
    font-size: var(--text-sm);
  }

  .platform-info p {
    font-size: var(--text-xs);
  }
}

@media (max-width: 390px) {
  .preview-media {
    max-height: 120px;
  }

  .schedule-settings {
    gap: var(--space-sm);
  }

  .setting-group label {
    font-size: var(--text-xs);
  }

  .platform-icon {
    width: 36px;
    height: 36px;
  }

  .platform-icon-inner {
    font-size: 1.25rem;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .platform-card,
  .selection-indicator {
    animation: none !important;
    transition: none !important;
  }
}

/* ===== DARK MODE OVERRIDES ===== */
:root[data-theme="dark"] .preview-content {
  background: var(--accent-alpha-15);
  border-color: var(--border-color);
}

:root[data-theme="dark"] .notes-section {
  border-bottom-color: var(--border-color);
}

:root[data-theme="dark"] .form-input,
:root[data-theme="dark"] .form-select,
:root[data-theme="dark"] .form-textarea {
  background: var(--bg-tertiary);
  border-color: var(--border-color);
}

:root[data-theme="dark"] .form-input:focus,
:root[data-theme="dark"] .form-select:focus,
:root[data-theme="dark"] .form-textarea:focus {
  background: var(--bg-elevated);
}

:root[data-theme="dark"] .time-select,
:root[data-theme="dark"] .period-select {
  background: var(--bg-tertiary);
  border-color: var(--border-color);
}

:root[data-theme="dark"] .time-select:focus,
:root[data-theme="dark"] .period-select:focus {
  background: var(--bg-elevated);
}

:root[data-theme="dark"] .platform-card {
  background: var(--accent-alpha-15);
  border-color: var(--border-color);
}

:root[data-theme="dark"] .platform-card:hover:not(.disabled) {
  background: var(--accent-alpha-20);
  border-color: var(--accent-alpha-40);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

:root[data-theme="dark"] .platform-card.selected {
  background: var(--accent-alpha-15);
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
}

:root[data-theme="dark"] .platform-card.disabled {
  background: var(--accent-alpha-10);
}

:root[data-theme="dark"] .detected-badge {
  background: var(--accent-alpha-15);
}
</style>

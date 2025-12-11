<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import BaseButton from './BaseButton.vue'
import BaseAlert from './BaseAlert.vue'
import { VueDatePicker } from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import MobileTimePicker from './MobileTimePicker.vue'
import { useSocialAccounts } from '@/composables/useSocialAccounts'
import { useScheduleTime } from '@/composables/useScheduleTime'
import { useFacebookStore } from '@/stores/facebook'
import { useInstagramStore } from '@/stores/instagram'

interface Props {
  disabled?: boolean
  showPreview?: boolean
  imageUrl?: string
  postText?: string
  hashtags?: string[]
  initialPlatforms?: string[]
  initialPublishType?: 'now' | 'schedule'
  initialScheduleDate?: string // Format: YYYY-MM-DD
  forceScheduleMode?: boolean
  showCancelButton?: boolean
  lockDate?: boolean // When true, date picker is hidden and date is displayed as read-only
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
  }): void
  (e: 'cancel'): void
}>()

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const facebookStore = useFacebookStore()
const instagramStore = useInstagramStore()
const { platforms: socialPlatforms, isConnected } = useSocialAccounts()
const { timezoneOptions, getDefaultTimezone } = useScheduleTime()

// State - default to 'now' unless forceScheduleMode is explicitly set
const publishType = ref<'now' | 'schedule'>(
  props.forceScheduleMode ? 'schedule' : props.initialPublishType
)
const selectedPlatforms = ref<string[]>(props.initialPlatforms.length > 0 ? [...props.initialPlatforms] : [])

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
const scheduleTime = ref<{ hours: number; minutes: number }>({ hours: 12, minutes: 0 })
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
      comingSoon: false,
      bgColor: '#1877F2'
    },
    {
      id: 'instagram',
      name: 'Instagram',
      isConnected: isConnected('instagram'),
      connectedAccounts: socialPlatforms.value.find(p => p.id === 'instagram')?.connectedAccounts || [],
      comingSoon: false,
      bgColor: '#E4405F'
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      isConnected: false,
      connectedAccounts: [],
      comingSoon: true,
      bgColor: '#000000'
    },
    {
      id: 'twitter',
      name: 'X (Twitter)',
      isConnected: false,
      connectedAccounts: [],
      comingSoon: true,
      bgColor: '#000000'
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      isConnected: false,
      connectedAccounts: [],
      comingSoon: true,
      bgColor: '#0A66C2'
    },
  ]
})

// Computed
const canPublish = computed(() => {
  if (selectedPlatforms.value.length === 0) return false
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

// Methods
function togglePlatform(platformId: string) {
  const index = selectedPlatforms.value.indexOf(platformId)
  if (index > -1) {
    selectedPlatforms.value.splice(index, 1)
  } else {
    selectedPlatforms.value.push(platformId)
  }
}

async function handlePlatformClick(platform: typeof availablePlatforms.value[0]) {
  if (platform.isConnected) {
    togglePlatform(platform.id)
  } else if (!platform.comingSoon) {
    // Trigger connection directly based on platform
    // Pass current URL so user returns here after OAuth
    const returnUrl = route.fullPath
    try {
      if (platform.id === 'facebook') {
        await facebookStore.connectFacebook(returnUrl)
      } else if (platform.id === 'instagram') {
        await instagramStore.connectInstagram(returnUrl)
      }
      // The stores are reactive, so UI will update automatically after connection
    } catch (error) {
      console.error('Failed to connect:', error)
    }
  }
}

function getPlatformIconStyle(platformId: string) {
  const platform = availablePlatforms.value.find(p => p.id === platformId)
  return {
    backgroundColor: platform?.bgColor || '#666'
  }
}

function handlePublish() {
  error.value = ''

  // Validate platform selection
  if (selectedPlatforms.value.length === 0) {
    error.value = t('unifiedSchedule.noPlatformSelected', 'Please select at least one platform')
    return
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

  emit('publish', {
    platforms: [...selectedPlatforms.value],
    publishType: publishType.value,
    scheduledDate,
    scheduledTime,
    timezone: selectedTimezone.value
  })
}

function handleCancel() {
  emit('cancel')
}

// Initialize with connected platforms if none specified
onMounted(() => {
  if (selectedPlatforms.value.length === 0) {
    // Auto-select first connected platform
    const firstConnected = availablePlatforms.value.find(p => p.isConnected)
    if (firstConnected) {
      selectedPlatforms.value = [firstConnected.id]
    }
  }
})
</script>

<template>
  <div class="unified-schedule-post">
    <!-- Preview Section (optional) -->
    <div v-if="showPreview && imageUrl" class="preview-section">
      <div class="preview-image-wrapper">
        <img :src="imageUrl" alt="Post preview" class="preview-image" />
      </div>
      <div v-if="postText" class="preview-text">
        {{ postText.length > 100 ? postText.substring(0, 100) + '...' : postText }}
      </div>
    </div>

    <!-- Locked Date Header (shown when date is locked) -->
    <div v-if="lockDate" class="locked-date-header">
      <span class="locked-date-icon">📅</span>
      <h3 class="locked-date-title">{{ formattedLockedDate }}</h3>
    </div>

    <!-- Publish Type Toggle (hidden in force schedule mode OR when date is locked) -->
    <div v-if="!forceScheduleMode && !lockDate" class="publish-type-section">
      <h4 class="section-label">{{ t('unifiedSchedule.whenToPublish', 'When to Publish') }}</h4>
      <div class="publish-type-toggle">
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
    <div v-if="publishType === 'schedule' || forceScheduleMode || lockDate" class="schedule-section">
      <!-- Date Picker (only shown when NOT locked) -->
      <div v-if="!lockDate" class="form-group">
        <label class="form-label">{{ t('unifiedSchedule.selectDate', 'Select Date') }}</label>
        <VueDatePicker
          v-model="scheduleDateTime"
          :min-date="today"
          :enable-time-picker="false"
          inline
          auto-apply
          dark
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
              selected: selectedPlatforms.includes(platform.id),
              'not-connected': !platform.isConnected && !platform.comingSoon,
              'coming-soon': platform.comingSoon
            }
          ]"
          @click="handlePlatformClick(platform)"
        >
          <!-- Platform Icon -->
          <div class="platform-icon" :style="getPlatformIconStyle(platform.id)">
            <!-- Facebook -->
            <svg v-if="platform.id === 'facebook'" width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z"/>
            </svg>
            <!-- Instagram -->
            <svg v-else-if="platform.id === 'instagram'" width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/>
            </svg>
            <!-- TikTok -->
            <svg v-else-if="platform.id === 'tiktok'" width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
            </svg>
            <!-- Twitter -->
            <svg v-else-if="platform.id === 'twitter'" width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/>
            </svg>
            <!-- LinkedIn -->
            <svg v-else-if="platform.id === 'linkedin'" width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
          </div>

          <!-- Platform Info -->
          <div class="platform-info">
            <span class="platform-name">{{ platform.name }}</span>
            <span v-if="platform.comingSoon" class="status coming-soon">
              {{ t('unifiedSchedule.comingSoon', 'Coming Soon') }}
            </span>
            <span v-else-if="!platform.isConnected" class="status not-connected">
              {{ t('unifiedSchedule.tapToConnect', 'Tap to connect') }}
            </span>
          </div>

          <!-- Connected indicator (green dot) or Selection Checkmark -->
          <div v-if="selectedPlatforms.includes(platform.id)" class="selection-check">
            <svg viewBox="0 0 24 24" fill="none" width="24" height="24">
              <circle cx="12" cy="12" r="10" fill="var(--gold-primary)"/>
              <path d="M9 12L11 14L15 10" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div v-else-if="platform.isConnected" class="connected-dot"></div>
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
  gap: var(--space-md);
  padding: var(--space-lg);
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
}

.preview-image-wrapper {
  flex-shrink: 0;
  width: 80px;
  height: 80px;
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-text {
  color: var(--text-secondary);
  font-size: var(--text-sm);
  line-height: var(--leading-normal);
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
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  padding: var(--space-xs);
}

.toggle-btn {
  flex: 1;
  padding: var(--space-md) var(--space-lg);
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: var(--transition-base);
}

.toggle-btn:hover {
  color: var(--text-primary);
}

.toggle-btn.active {
  background: var(--gold-primary);
  color: var(--text-on-gold);
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
  background: var(--gold-subtle);
  border: var(--border-width) solid var(--gold-primary);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-md);
}

.locked-date-icon {
  font-size: var(--text-2xl);
}

.locked-date-title {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0;
  background: var(--gradient-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
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

/* Error Alert */
.error-alert {
  margin-top: var(--space-md);
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
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: var(--radius-lg);
  padding: var(--space-sm);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
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
  min-width: 28px !important;
}

.date-picker-inline :deep(.dp__calendar_item) {
  width: auto !important;
  flex: 1 1 0 !important;
  min-width: 28px !important;
}

.date-picker-inline :deep(.dp__cell_inner) {
  width: 28px !important;
  height: 28px !important;
  font-size: 12px !important;
  padding: 0 !important;
}

.date-picker-inline :deep(.dp__cell_offset) {
  width: 28px !important;
  height: 28px !important;
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
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  display: flex;
  justify-content: center;
}

/* Date/Time Picker Dark Theme Override */
:deep(.dp__theme_dark) {
  --dp-background-color: transparent;
  --dp-text-color: var(--text-primary);
  --dp-hover-color: rgba(212, 175, 55, 0.15);
  --dp-hover-text-color: var(--text-primary);
  --dp-primary-color: var(--gold-primary);
  --dp-primary-text-color: var(--text-on-gold);
  --dp-secondary-color: rgba(212, 175, 55, 0.1);
  --dp-border-color: rgba(212, 175, 55, 0.3);
  --dp-menu-border-color: transparent;
  --dp-border-color-hover: var(--gold-primary);
  --dp-disabled-color: var(--text-muted);
  --dp-disabled-color-text: var(--text-muted);
  --dp-success-color: var(--gold-primary);
  --dp-icon-color: var(--gold-primary);
  --dp-danger-color: #ef4444;
  --dp-highlight-color: rgba(212, 175, 55, 0.1);
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
  background: rgba(212, 175, 55, 0.1);
  border-radius: var(--radius-sm);
}

/* Navigation arrows */
:deep(.dp__inner_nav) {
  color: var(--text-secondary);
  width: 36px;
  height: 36px;
}

:deep(.dp__inner_nav:hover) {
  background: rgba(212, 175, 55, 0.15);
  color: var(--gold-primary);
  border-radius: var(--radius-sm);
}

/* Calendar days */
:deep(.dp__calendar_item) {
  border-radius: var(--radius-sm);
}

:deep(.dp__cell_inner) {
  border-radius: var(--radius-sm);
  width: 34px;
  height: 34px;
  font-size: var(--text-sm);
}

:deep(.dp__today) {
  border: 2px solid var(--gold-primary);
}

:deep(.dp__active_date) {
  background: var(--gold-primary);
  color: var(--text-on-gold);
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

  .actions {
    flex-direction: column;
  }

  .actions > * {
    width: 100%;
  }
}
</style>

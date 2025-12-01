<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseButton from './BaseButton.vue'
import BaseAlert from './BaseAlert.vue'
import { VueDatePicker } from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import { useSocialAccounts } from '@/composables/useSocialAccounts'
import { useScheduleTime } from '@/composables/useScheduleTime'

interface Props {
  disabled?: boolean
  showPreview?: boolean
  imageUrl?: string
  postText?: string
  hashtags?: string[]
  initialPlatforms?: string[]
  initialPublishType?: 'now' | 'schedule'
  forceScheduleMode?: boolean
  showCancelButton?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  showPreview: false,
  initialPlatforms: () => [],
  initialPublishType: 'now',
  forceScheduleMode: false,
  showCancelButton: true
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
const { platforms: socialPlatforms, isConnected } = useSocialAccounts()
const { hours12, minutes, timezoneOptions, getDefaultTimezone } = useScheduleTime()

// State
const publishType = ref<'now' | 'schedule'>(props.forceScheduleMode ? 'schedule' : props.initialPublishType)
const selectedPlatforms = ref<string[]>(props.initialPlatforms.length > 0 ? [...props.initialPlatforms] : [])
const scheduleDateTime = ref<Date | null>(null)
const selectedTimezone = ref(getDefaultTimezone())
const error = ref('')

// Time picker state
const selectedHour = ref('12')
const selectedMinute = ref('00')
const selectedPeriod = ref<'AM' | 'PM'>('PM')

// Use composable values - extract just the value strings for the template
const hours = computed(() => hours12.value.map(h => h.value))
const minuteOptions = computed(() => minutes.value.map(m => m.value))

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

// Methods
function togglePlatform(platformId: string) {
  const index = selectedPlatforms.value.indexOf(platformId)
  if (index > -1) {
    selectedPlatforms.value.splice(index, 1)
  } else {
    selectedPlatforms.value.push(platformId)
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

    // Format date as YYYY-MM-DD
    const year = scheduleDateTime.value.getFullYear()
    const month = String(scheduleDateTime.value.getMonth() + 1).padStart(2, '0')
    const day = String(scheduleDateTime.value.getDate()).padStart(2, '0')
    scheduledDate = `${year}-${month}-${day}`

    // Convert 12-hour to 24-hour format
    let hour24 = parseInt(selectedHour.value)
    if (selectedPeriod.value === 'PM' && hour24 !== 12) {
      hour24 += 12
    } else if (selectedPeriod.value === 'AM' && hour24 === 12) {
      hour24 = 0
    }
    scheduledTime = `${String(hour24).padStart(2, '0')}:${selectedMinute.value}`
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

    <!-- Publish Type Toggle (hidden in force schedule mode) -->
    <div v-if="!forceScheduleMode" class="publish-type-section">
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

    <!-- Schedule Section (always shown in force mode, otherwise when scheduling) -->
    <div v-if="publishType === 'schedule' || forceScheduleMode" class="schedule-section">
      <!-- Date Picker -->
      <div class="form-group">
        <label class="form-label">{{ t('unifiedSchedule.selectDate', 'Select Date') }}</label>
        <VueDatePicker
          v-model="scheduleDateTime"
          :min-date="today"
          :enable-time-picker="false"
          dark
          auto-apply
          class="date-picker"
        />
      </div>

      <!-- Time Picker -->
      <div class="form-group">
        <label class="form-label">{{ t('unifiedSchedule.selectTime', 'Select Time') }}</label>
        <div class="time-picker">
          <select v-model="selectedHour" class="time-select">
            <option v-for="hour in hours" :key="hour" :value="hour">{{ hour }}</option>
          </select>
          <span class="time-separator">:</span>
          <select v-model="selectedMinute" class="time-select">
            <option v-for="minute in minuteOptions" :key="minute" :value="minute">{{ minute }}</option>
          </select>
          <select v-model="selectedPeriod" class="period-select">
            <option value="AM">AM</option>
            <option value="PM">PM</option>
          </select>
        </div>
      </div>

      <!-- Timezone -->
      <div class="form-group">
        <label class="form-label">{{ t('unifiedSchedule.timezone', 'Timezone') }}</label>
        <select v-model="selectedTimezone" class="form-select">
          <option v-for="tz in timezoneOptions" :key="tz.value" :value="tz.value">
            {{ tz.label }}
          </option>
        </select>
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
              disabled: !platform.isConnected,
              'coming-soon': platform.comingSoon
            }
          ]"
          @click="platform.isConnected ? togglePlatform(platform.id) : null"
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
            <span v-if="platform.isConnected" class="status connected">
              ✓ {{ t('unifiedSchedule.connected', 'Connected') }} ({{ platform.connectedAccounts.length }})
            </span>
            <span v-else-if="platform.comingSoon" class="status coming-soon">
              {{ t('unifiedSchedule.comingSoon', 'Coming Soon') }}
            </span>
            <span v-else class="status not-connected">
              {{ t('unifiedSchedule.notConnected', 'Not connected') }}
            </span>
          </div>

          <!-- Selection Checkmark -->
          <div v-if="selectedPlatforms.includes(platform.id)" class="selection-check">
            <svg viewBox="0 0 24 24" fill="none" width="24" height="24">
              <circle cx="12" cy="12" r="10" fill="var(--gold-primary)"/>
              <path d="M9 12L11 14L15 10" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
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

.time-picker {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.time-select,
.period-select,
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
}

.time-select:hover,
.period-select:hover,
.form-select:hover {
  border-color: var(--gold-primary);
}

.time-select:focus,
.period-select:focus,
.form-select:focus {
  outline: none;
  border-color: var(--gold-primary);
  box-shadow: var(--glow-gold-sm);
}

.time-select {
  width: 80px;
}

.period-select {
  width: 90px;
}

.form-select {
  width: 100%;
}

.time-separator {
  color: var(--gold-primary);
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
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

.platform-card.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.platform-card.coming-soon {
  opacity: 0.6;
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
  color: var(--text-muted);
}

.selection-check {
  position: absolute;
  top: var(--space-sm);
  right: var(--space-sm);
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

/* Date Picker Dark Theme Override */
:deep(.dp__theme_dark) {
  --dp-background-color: var(--bg-secondary);
  --dp-text-color: var(--text-primary);
  --dp-hover-color: var(--bg-elevated);
  --dp-hover-text-color: var(--text-primary);
  --dp-primary-color: var(--gold-primary);
  --dp-primary-text-color: var(--text-on-gold);
  --dp-secondary-color: var(--bg-tertiary);
  --dp-border-color: var(--border-color);
  --dp-menu-border-color: var(--border-color);
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

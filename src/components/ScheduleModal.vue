<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal-overlay" @click.self="closeModal">
      <BaseCard variant="glass-intense" class="modal-card">
        <div class="modal-header">
          <h3 class="modal-title">{{ $t('scheduleModal.title') }}</h3>
          <button class="close-btn" @click="closeModal">&times;</button>
        </div>

        <div class="modal-body">
          <!-- Preview -->
          <div v-if="favoritePost" class="preview-section">
            <h4 class="section-title">{{ $t('scheduleModal.preview') }}</h4>
            <div class="preview-content">
              <img
                v-if="favoritePost.content_type === 'image'"
                :src="favoritePost.media_url"
                alt="Post preview"
                class="preview-media"
              />
              <video
                v-else
                :src="favoritePost.media_url"
                class="preview-media"
                controls
              ></video>
              <p v-if="favoritePost.post_text" class="preview-text">
                {{ truncateText(favoritePost.post_text, 100) }}
              </p>
            </div>
          </div>

          <!-- Scheduling Form -->
          <form @submit.prevent="handleSchedule" class="schedule-form">
            <div class="form-group">
              <label for="scheduled_date" class="form-label">
                {{ $t('scheduleModal.dateLabel') }} <span class="required">*</span>
              </label>
              <DatePicker
                v-model="formData.scheduled_date"
                :min-date="today"
              />
              <p v-if="preselectedDate" class="date-hint">
                {{ $t('scheduleModal.dateHint') }}
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">{{ $t('scheduleModal.timeLabel') }}</label>
              <div class="time-picker">
                <select v-model="selectedHour" class="time-select">
                  <option v-for="hour in hours" :key="hour" :value="hour">
                    {{ hour }}
                  </option>
                </select>
                <span class="time-separator">:</span>
                <select v-model="selectedMinute" class="time-select">
                  <option v-for="minute in minutes" :key="minute" :value="minute">
                    {{ minute }}
                  </option>
                </select>
                <select v-model="selectedPeriod" class="period-select">
                  <option value="AM">{{ $t('common.am') }}</option>
                  <option value="PM">{{ $t('common.pm') }}</option>
                </select>
              </div>
              <p class="time-hint">{{ $t('scheduleModal.selectedTime', { time: `${selectedHour}:${selectedMinute} ${selectedPeriod}` }) }}</p>
            </div>

            <div class="form-group">
              <label for="timezone" class="form-label">
                {{ $t('scheduleModal.timezoneLabel') }}
                <span v-if="formData.timezone === userTimezone" class="detected-badge">
                  {{ $t('scheduleModal.autoDetected') }}
                </span>
              </label>
              <select id="timezone" v-model="formData.timezone" class="form-select timezone-select">
                <option
                  v-for="tz in timezoneOptions"
                  :key="tz.value"
                  :value="tz.value"
                >
                  {{ tz.label }}
                </option>
              </select>
              <p class="timezone-hint">
                {{ $t('scheduleModal.currentTime', { time: getCurrentTimeInTimezone(formData.timezone) }) }}
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">
                {{ $t('scheduleModal.platformLabel') }} <span class="required">*</span>
              </label>
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
                  <!-- Platform Icon (inline SVG) -->
                  <div class="platform-card-icon" :style="getPlatformIconStyle(platform.id)">
                    <!-- Facebook Icon -->
                    <svg v-if="platform.id === 'facebook'" width="20" height="20" viewBox="0 0 24 24" fill="white">
                      <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z"/>
                    </svg>
                    <!-- Instagram Icon -->
                    <svg v-else-if="platform.id === 'instagram'" width="20" height="20" viewBox="0 0 24 24" fill="white">
                      <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/>
                    </svg>
                    <!-- Twitter Icon -->
                    <svg v-else-if="platform.id === 'twitter'" width="16" height="16" viewBox="0 0 24 24" fill="white">
                      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/>
                    </svg>
                    <!-- LinkedIn Icon -->
                    <svg v-else-if="platform.id === 'linkedin'" width="16" height="16" viewBox="0 0 24 24" fill="white">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    <!-- TikTok Icon -->
                    <svg v-else-if="platform.id === 'tiktok'" width="16" height="16" viewBox="0 0 24 24" fill="white">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                    </svg>
                  </div>

                  <!-- Platform Info -->
                  <div class="platform-card-content">
                    <h4 class="platform-name">{{ platform.name }}</h4>
                    <span v-if="platform.isConnected" class="connection-status connected">
                      <svg class="checkmark-icon" viewBox="0 0 24 24" fill="none">
                        <path d="M9 12L11 14L15 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                      {{ $t('scheduleModal.connected') }}
                      <span class="account-count">({{ platform.connectedAccounts.length }})</span>
                    </span>
                    <span v-else-if="platform.comingSoon" class="connection-status coming-soon">
                      {{ $t('scheduleModal.comingSoon') }}
                    </span>
                    <span v-else class="connection-status not-connected">
                      {{ $t('scheduleModal.notConnected') }}
                    </span>
                  </div>

                  <!-- Selection indicator -->
                  <div v-if="selectedPlatforms.includes(platform.id)" class="selection-indicator">
                    <svg viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" fill="var(--gold-primary)"/>
                      <path d="M9 12L11 14L15 10" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </div>
                </div>
              </div>

              <!-- Validation Messages -->
              <p v-if="selectedPlatforms.length === 0" class="platform-hint error">
                {{ $t('scheduleModal.selectAtLeastOne') }}
              </p>
            </div>

            <div class="form-group">
              <label for="notes" class="form-label">{{ $t('scheduleModal.notesLabel') }}</label>
              <textarea
                id="notes"
                v-model="formData.notes"
                class="form-textarea"
                rows="3"
                :placeholder="$t('scheduleModal.notesPlaceholder')"
              ></textarea>
            </div>

            <BaseAlert v-if="error" type="error" class="form-alert">
              {{ error }}
            </BaseAlert>

            <div class="modal-actions">
              <BaseButton variant="ghost" type="button" @click="closeModal">
                {{ $t('common.cancel') }}
              </BaseButton>
              <BaseButton variant="primary" type="submit" :disabled="scheduling">
                {{ scheduling ? $t('scheduleModal.scheduling') : $t('scheduleModal.title') }}
              </BaseButton>
            </div>
          </form>
        </div>
      </BaseCard>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import BaseCard from './BaseCard.vue'
import BaseButton from './BaseButton.vue'
import BaseAlert from './BaseAlert.vue'
import DatePicker from './DatePicker.vue'
import { api } from '../services/api'
import { useSocialAccounts } from '../composables/useSocialAccounts'

const { t } = useI18n()

const router = useRouter()

// Social accounts composable
const { platforms, isConnected } = useSocialAccounts()

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

// Auto-detect timezone with fallback
const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
const defaultTimezone = detectedTimezone || 'America/New_York'

const formData = ref({
  scheduled_date: '',
  scheduled_time: '',
  timezone: defaultTimezone,
  notes: '',
  platform: '',
})

const scheduling = ref(false)
const error = ref('')
const showCalendar = ref(false)
const selectedHour = ref('12')
const selectedMinute = ref('00')
const selectedPeriod = ref<'AM' | 'PM'>('PM')
const selectedPlatforms = ref<string[]>([])

const today = computed(() => {
  // Use local date, not UTC, to avoid timezone issues
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
})

// Use the same detected timezone as userTimezone for consistency
const userTimezone = defaultTimezone

// Generate hour options (1-12)
const hours = Array.from({ length: 12 }, (_, i) => {
  const hour = i + 1
  return hour.toString().padStart(2, '0')
})

// Generate minute options (00-59)
const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'))

// Timezone options with current time display
const timezoneOptions = computed(() => [
  { value: 'UTC', label: t('timezones.utc') },
  { value: 'America/New_York', label: t('timezones.eastern') },
  { value: 'America/Chicago', label: t('timezones.central') },
  { value: 'America/Denver', label: t('timezones.mountain') },
  { value: 'America/Los_Angeles', label: t('timezones.pacific') },
  { value: 'Europe/London', label: t('timezones.london') },
  { value: 'Europe/Paris', label: t('timezones.paris') },
  { value: 'Europe/Oslo', label: t('timezones.oslo') },
  { value: 'Asia/Tokyo', label: t('timezones.tokyo') },
  { value: 'Asia/Dubai', label: t('timezones.dubai') },
  { value: 'Australia/Sydney', label: t('timezones.sydney') },
])

// Filter to only show available platforms
const availablePlatforms = computed(() => {
  return platforms.value.filter(p =>
    ['facebook', 'instagram', 'twitter', 'linkedin', 'tiktok'].includes(p.id)
  )
})

// Get current time in selected timezone
const getCurrentTimeInTimezone = (timezone: string): string => {
  try {
    return new Date().toLocaleTimeString('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return ''
  }
}

// Toggle platform selection
const togglePlatform = (platformId: string) => {
  const index = selectedPlatforms.value.indexOf(platformId)
  if (index > -1) {
    selectedPlatforms.value.splice(index, 1)
  } else {
    selectedPlatforms.value.push(platformId)
  }
}

// Platform icon background styles
const getPlatformIconStyle = (platformId: string) => {
  const styles: Record<string, string> = {
    facebook: 'background: linear-gradient(135deg, #1877f2, #0d5dbf)',
    instagram: 'background: linear-gradient(135deg, #f58529, #dd2a7b, #8134af, #515bd4)',
    twitter: 'background: #000000',
    linkedin: 'background: #0a66c2',
    tiktok: 'background: #000000',
  }
  return styles[platformId] || ''
}

watch(() => props.modelValue, (newValue) => {

  if (newValue) {

    // Reset time selectors first
    selectedHour.value = '12'
    selectedMinute.value = '00'
    selectedPeriod.value = 'PM'

    // Reset selected platforms
    selectedPlatforms.value = []
    // Pre-select platform if favoritePost has one and it's connected
    if (props.favoritePost?.platform && isConnected(props.favoritePost.platform)) {
      selectedPlatforms.value = [props.favoritePost.platform]
    }

    // Get today's date in YYYY-MM-DD format (using local date)
    const now = new Date()
    const todayDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

    // Reset form when modal opens (scheduled_time will be set by the watch)
    formData.value = {
      scheduled_date: (props.preselectedDate ?? todayDate) as string, // Default to today
      scheduled_time: '12:00', // Set initial value
      timezone: (userTimezone || 'UTC') as string,
      notes: '',
      platform: props.favoritePost?.platform || '', // Pre-fill from favorite if available
    }

    error.value = ''
  }
})

// Update formData.scheduled_time when time selectors change
watch([selectedHour, selectedMinute, selectedPeriod], () => {
  const hour24 = selectedPeriod.value === 'PM' && selectedHour.value !== '12'
    ? (parseInt(selectedHour.value) + 12).toString().padStart(2, '0')
    : selectedPeriod.value === 'AM' && selectedHour.value === '12'
    ? '00'
    : selectedHour.value

  formData.value.scheduled_time = `${hour24}:${selectedMinute.value}`
})

const closeModal = () => {
  emit('update:modelValue', false)
}

const handleSchedule = async () => {

  if (!props.favoritePost?.id) {
    error.value = 'No favorite post selected'
    return
  }

  if (selectedPlatforms.value.length === 0) {
    error.value = 'Please select at least one platform'
    return
  }

  try {
    scheduling.value = true
    error.value = ''

    // Single API call with all selected platforms
    const scheduleData = {
      favorite_post_id: props.favoritePost.id,
      scheduled_date: formData.value.scheduled_date,
      scheduled_time: formData.value.scheduled_time || undefined,
      timezone: formData.value.timezone,
      notes: formData.value.notes || undefined,
      platforms: selectedPlatforms.value,
    }

    const response = await api.schedulePost(scheduleData)

    if (response.success) {
      emit('scheduled', { success: true })
      closeModal()
      router.push('/scheduler')
    } else {
      error.value = response.error || 'Failed to schedule post'
    }

  } catch (err: any) {
    error.value = err.message || 'Failed to schedule post'
  } finally {
    scheduling.value = false
  }
}

const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(var(--blur-md));
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-xl);
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-card {
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-xl);
  border-bottom: 1px solid rgba(212, 175, 55, 0.2);
}

.modal-title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  color: var(--gold-primary);
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 2rem;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(212, 175, 55, 0.1);
  color: var(--gold-primary);
}

.modal-body {
  padding: var(--space-xl);
}

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
  background: rgba(0, 0, 0, 0.3);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  border: 1px solid rgba(212, 175, 55, 0.2);
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

.schedule-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
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
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(212, 175, 55, 0.3);
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
  background: rgba(0, 0, 0, 0.5);
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
  background: rgba(212, 175, 55, 0.15);
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
  background: rgba(212, 175, 55, 0.25);
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
  background: rgba(212, 175, 55, 0.15);
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
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(212, 175, 55, 0.3);
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
  background: rgba(0, 0, 0, 0.5);
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
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid rgba(212, 175, 55, 0.2);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-base);
}

.platform-card:hover:not(.disabled) {
  border-color: rgba(212, 175, 55, 0.4);
  background: rgba(0, 0, 0, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.platform-card.selected {
  border-color: var(--gold-primary);
  background: rgba(212, 175, 55, 0.15);
  box-shadow: 0 0 20px rgba(212, 175, 55, 0.2);
}

.platform-card.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: rgba(0, 0, 0, 0.2);
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
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
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
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

/* Responsive */
@media (max-width: 768px) {
  .modal-overlay {
    padding: var(--space-md);
  }

  .modal-card {
    max-height: 95vh;
  }

  .modal-header,
  .modal-body {
    padding: var(--space-lg);
  }

  .preview-media {
    max-height: 200px;
  }

  .platform-grid {
    grid-template-columns: 1fr;
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
</style>

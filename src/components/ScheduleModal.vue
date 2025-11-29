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
              <label for="platform" class="form-label">
                {{ $t('scheduleModal.platformLabel') }} <span class="required">*</span>
              </label>
              <select id="platform" v-model="formData.platform" class="form-select platform-select">
                <option value="">{{ $t('scheduleModal.selectPlatform') }}</option>
                <option value="facebook">{{ $t('platforms.facebookWithIcon') }}</option>
                <option value="instagram">{{ $t('platforms.instagramWithIcon') }}</option>
                <option value="tiktok">{{ $t('platforms.tiktokWithIcon') }}</option>
                <option value="twitter">{{ $t('platforms.twitterWithIcon') }}</option>
                <option value="linkedin">{{ $t('platforms.linkedinWithIcon') }}</option>
              </select>
              <p v-if="!formData.platform" class="platform-hint error">
                {{ $t('scheduleModal.platformWarning') }}
              </p>
              <p v-else-if="formData.platform !== 'facebook'" class="platform-hint warning">
                {{ $t('scheduleModal.platformLimited') }}
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

const { t } = useI18n()

const router = useRouter()

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

watch(() => props.modelValue, (newValue) => {

  if (newValue) {

    // Reset time selectors first
    selectedHour.value = '12'
    selectedMinute.value = '00'
    selectedPeriod.value = 'PM'

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

  if (!formData.value.platform) {
    error.value = 'Please select a platform'

    return
  }

  if (formData.value.platform !== 'facebook') {
    error.value = 'Only Facebook is currently supported. Other platforms coming soon.'

    return
  }

  try {
    scheduling.value = true
    error.value = ''

    const scheduleData = {
      favorite_post_id: props.favoritePost.id,
      scheduled_date: formData.value.scheduled_date,
      scheduled_time: formData.value.scheduled_time || undefined,
      timezone: formData.value.timezone,
      notes: formData.value.notes || undefined,
      platform: formData.value.platform,
    }

    const response = await api.schedulePost(scheduleData)

    if (!response.success) {
      error.value = response.error || 'Failed to schedule post'
      return
    }

    emit('scheduled', response.data?.scheduled_post)
    closeModal()

    // Redirect to scheduler view
    router.push('/scheduler')
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
}
</style>

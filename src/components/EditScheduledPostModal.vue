<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import BaseCard from './BaseCard.vue'
import BaseButton from './BaseButton.vue'
import BaseAlert from './BaseAlert.vue'
import DatePicker from './DatePicker.vue'

interface Props {
  modelValue: boolean
  post: any
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', updates: any): void
}>()

// Auto-detect timezone with fallback
const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
const defaultTimezone = detectedTimezone || 'America/New_York'

// Form state
const scheduledDate = ref('')
const hours = ref('12')
const minutes = ref('00')
const ampm = ref('AM')
const timezone = ref(defaultTimezone)
const platform = ref('')
const notes = ref('')
const error = ref('')
const saving = ref(false)

// Time options
const hourOptions = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1).padStart(2, '0'),
  label: String(i + 1)
}))

const minuteOptions = Array.from({ length: 60 }, (_, i) => ({
  value: String(i).padStart(2, '0'),
  label: String(i).padStart(2, '0')
}))

const timezones = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'America/Anchorage',
  'Pacific/Honolulu',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney'
]

// Watch for post changes and populate form
watch(() => props.post, (newPost) => {
  if (newPost) {
    populateForm(newPost)
  }
}, { immediate: true })

// Populate form from post data
const populateForm = (post: any) => {
  if (post.scheduled_date) {
    scheduledDate.value = post.scheduled_date
  }

  if (post.scheduled_time) {
    // Parse time like "14:30:00" or "2:30 PM"
    const timeParts = post.scheduled_time.match(/(\d+):(\d+)/)
    if (timeParts) {
      let hour = parseInt(timeParts[1])
      const minute = timeParts[2]

      // Convert 24-hour to 12-hour format
      if (hour === 0) {
        hours.value = '12'
        ampm.value = 'AM'
      } else if (hour < 12) {
        hours.value = String(hour).padStart(2, '0')
        ampm.value = 'AM'
      } else if (hour === 12) {
        hours.value = '12'
        ampm.value = 'PM'
      } else {
        hours.value = String(hour - 12).padStart(2, '0')
        ampm.value = 'PM'
      }

      minutes.value = minute
    }
  }

  if (post.timezone) {
    timezone.value = post.timezone
  }

  if (post.platform) {
    platform.value = post.platform
  }

  if (post.notes) {
    notes.value = post.notes
  }
}

// Format time for display
const formattedTime = computed(() => {
  return `${hours.value}:${minutes.value} ${ampm.value}`
})

// Convert to 24-hour format for backend
const get24HourTime = () => {
  let hour = parseInt(hours.value)

  if (ampm.value === 'AM') {
    if (hour === 12) hour = 0
  } else {
    if (hour !== 12) hour += 12
  }

  return `${String(hour).padStart(2, '0')}:${minutes.value}:00`
}

// Close modal
const close = () => {
  emit('update:modelValue', false)
  error.value = ''
}

// Save changes
const saveChanges = async () => {
  error.value = ''

  // Validation
  if (!scheduledDate.value) {
    error.value = 'Please select a date'
    return
  }

  if (!platform.value) {
    error.value = 'Please select a platform'
    return
  }

  if (platform.value !== 'facebook') {
    error.value = 'Only Facebook is currently supported. Other platforms coming soon.'
    return
  }

  saving.value = true

  try {
    const updates = {
      scheduled_date: scheduledDate.value,
      scheduled_time: get24HourTime(),
      timezone: timezone.value,
      platform: platform.value,
      notes: notes.value || undefined
    }

    emit('save', updates)
    close()
  } catch (err: any) {
    error.value = err.message || 'Failed to save changes'
  } finally {
    saving.value = false
  }
}

// Format date for display
const formatDisplayDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>

<template>
  <div v-if="modelValue" class="modal-overlay" @click.self="close">
    <BaseCard variant="glass-intense" class="edit-modal">
      <div class="modal-header">
        <h2 class="modal-title">Edit Scheduled Post</h2>
        <button class="close-button" @click="close" aria-label="Close">×</button>
      </div>

      <div class="modal-body">
        <!-- Post Preview -->
        <div v-if="post" class="post-preview">
          <div class="preview-media">
            <img
              v-if="post.content_type === 'image' && post.media_url"
              :src="post.media_url"
              alt="Post preview"
              class="preview-image"
            />
            <video
              v-else-if="post.content_type === 'video' && post.media_url"
              :src="post.media_url"
              class="preview-video"
            />
            <div v-else class="preview-placeholder">
              <span class="placeholder-icon">📸</span>
              <span class="placeholder-text">No media</span>
            </div>
          </div>

          <div class="preview-info">
            <div class="preview-platform">
              <span :class="['platform-badge', `platform-${post.platform}`]">
                {{ post.platform }}
              </span>
            </div>
            <div v-if="post.post_text" class="preview-text">
              {{ post.post_text }}
            </div>
            <div class="preview-note">
              <strong>Note:</strong> To edit the post content or image, please create a new post.
            </div>
          </div>
        </div>

        <!-- Edit Form -->
        <div class="edit-form">
          <BaseAlert v-if="error" type="error">{{ error }}</BaseAlert>

          <!-- Date Selection -->
          <div class="form-group">
            <label class="form-label">📅 Scheduled Date</label>
            <DatePicker
              v-model="scheduledDate"
              :min-date="new Date().toISOString().split('T')[0]"
            />
            <div v-if="scheduledDate" class="date-preview">
              {{ formatDisplayDate(scheduledDate) }}
            </div>
          </div>

          <!-- Time Selection -->
          <div class="form-group">
            <label class="form-label">⏰ Scheduled Time</label>
            <div class="time-picker">
              <select v-model="hours" class="time-select">
                <option v-for="opt in hourOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
              <span class="time-separator">:</span>
              <select v-model="minutes" class="time-select">
                <option v-for="opt in minuteOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
              <select v-model="ampm" class="time-select ampm-select">
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
            <div class="time-preview">{{ formattedTime }}</div>
          </div>

          <!-- Timezone Selection -->
          <div class="form-group">
            <label class="form-label">🌍 Timezone</label>
            <select v-model="timezone" class="form-input">
              <option v-for="tz in timezones" :key="tz" :value="tz">
                {{ tz.replace(/_/g, ' ') }}
              </option>
            </select>
            <div class="timezone-hint">
              Detected: {{ detectedTimezone.replace(/_/g, ' ') }}
            </div>
          </div>

          <!-- Platform Selection -->
          <div class="form-group">
            <label class="form-label">📱 Platform <span class="required">*</span></label>
            <select v-model="platform" class="form-input platform-select">
              <option value="">Select a platform...</option>
              <option value="facebook">👥 Facebook</option>
              <option value="instagram">📷 Instagram</option>
              <option value="tiktok">🎵 TikTok</option>
              <option value="twitter">🐦 Twitter/X</option>
              <option value="linkedin">💼 LinkedIn</option>
            </select>
            <p v-if="!platform" class="platform-hint error">
              ⚠️ Please select a platform to publish to
            </p>
            <p v-else-if="platform !== 'facebook'" class="platform-hint warning">
              ⚠️ Only Facebook is currently supported. Other platforms coming soon.
            </p>
          </div>

          <!-- Notes -->
          <div class="form-group">
            <label class="form-label">📝 Notes (Optional)</label>
            <textarea
              v-model="notes"
              class="form-textarea"
              placeholder="Add any notes about this post..."
              rows="3"
            />
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <BaseButton variant="ghost" size="medium" @click="close" :disabled="saving">
          Cancel
        </BaseButton>
        <BaseButton variant="primary" size="medium" @click="saveChanges" :disabled="saving">
          {{ saving ? 'Saving...' : 'Save Changes' }}
        </BaseButton>
      </div>
    </BaseCard>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(var(--blur-md));
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--space-xl);
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.edit-modal {
  max-width: 700px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease-out;
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
  padding-bottom: var(--space-lg);
  border-bottom: 1px solid rgba(212, 175, 55, 0.1);
  margin-bottom: var(--space-xl);
}

.modal-title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0;
}

.close-button {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-secondary);
  font-size: var(--text-2xl);
  cursor: pointer;
  transition: var(--transition-base);
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.close-button:hover {
  background: var(--gold-primary);
  border-color: var(--gold-primary);
  color: var(--text-on-gold);
  transform: rotate(90deg);
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding-right: var(--space-sm);
}

.modal-body::-webkit-scrollbar {
  width: 6px;
}

.modal-body::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-sm);
}

.modal-body::-webkit-scrollbar-thumb {
  background: var(--gold-primary);
  border-radius: var(--radius-sm);
}

.post-preview {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: var(--space-xl);
  padding: var(--space-lg);
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(212, 175, 55, 0.1);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-2xl);
}

.preview-media {
  width: 200px;
  height: 200px;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-image,
.preview-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  color: var(--text-muted);
}

.placeholder-icon {
  font-size: var(--text-4xl);
}

.placeholder-text {
  font-size: var(--text-sm);
}

.preview-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.preview-platform {
  display: flex;
  gap: var(--space-sm);
}

.platform-badge {
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.platform-instagram {
  background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);
  color: white;
}

.platform-facebook {
  background: #1877f2;
  color: white;
}

.platform-tiktok {
  background: #000000;
  color: #00f2ea;
  border: 1px solid #00f2ea;
}

.preview-text {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: var(--leading-normal);
  max-height: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.preview-note {
  font-size: var(--text-xs);
  color: var(--text-muted);
  font-style: italic;
  padding: var(--space-sm);
  background: rgba(212, 175, 55, 0.05);
  border-left: 2px solid var(--gold-primary);
  border-radius: var(--radius-sm);
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.form-label {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.form-input,
.form-textarea {
  padding: var(--space-md);
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--text-base);
  font-family: var(--font-body);
  transition: var(--transition-base);
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--gold-primary);
  background: rgba(0, 0, 0, 0.4);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.date-preview,
.time-preview {
  font-size: var(--text-sm);
  color: var(--gold-primary);
  font-weight: var(--font-medium);
}

.time-picker {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.time-select {
  padding: var(--space-md);
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--text-base);
  cursor: pointer;
  transition: var(--transition-base);
}

.time-select:focus {
  outline: none;
  border-color: var(--gold-primary);
  background: rgba(0, 0, 0, 0.4);
}

.ampm-select {
  flex: 0 0 80px;
}

.time-separator {
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
}

.timezone-hint {
  font-size: var(--text-xs);
  color: var(--text-muted);
  font-style: italic;
}

.platform-select {
  cursor: pointer;
}

.platform-hint {
  margin: 0;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  margin-top: var(--space-xs);
}

.platform-hint.error {
  color: #ef4444;
}

.platform-hint.warning {
  color: #f59e0b;
}

.required {
  color: #ef4444;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-lg);
  padding-top: var(--space-xl);
  border-top: 1px solid rgba(212, 175, 55, 0.1);
  margin-top: var(--space-xl);
}

/* Responsive */
@media (max-width: 768px) {
  .modal-overlay {
    padding: var(--space-lg);
  }

  .post-preview {
    grid-template-columns: 1fr;
  }

  .preview-media {
    width: 100%;
    height: 250px;
  }

  .time-picker {
    flex-wrap: wrap;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .modal-overlay,
  .edit-modal,
  .close-button {
    animation: none;
  }
}
</style>

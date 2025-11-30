<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import BaseCard from './BaseCard.vue'
import BaseButton from './BaseButton.vue'
import BaseAlert from './BaseAlert.vue'
import DatePicker from './DatePicker.vue'
import { useSocialAccounts } from '../composables/useSocialAccounts'

interface Props {
  modelValue: boolean
  post: any
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', updates: any): void
}>()

// Social accounts integration
const { availablePlatforms, isConnected } = useSocialAccounts()

// Auto-detect timezone with fallback
const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
const defaultTimezone = detectedTimezone || 'America/New_York'

// Form state
const scheduledDate = ref('')
const hours = ref('12')
const minutes = ref('00')
const ampm = ref('AM')
const timezone = ref(defaultTimezone)
const selectedPlatforms = ref<string[]>([])
const notes = ref('')
const postText = ref('')
const hashtags = ref<string[]>([])
const newHashtag = ref('')
const error = ref('')
const saving = ref(false)
const showImagePicker = ref(false)
const availableFavorites = ref<any[]>([])
const selectedFavoriteId = ref<string | null>(null)

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
  'Europe/Oslo',
  'Europe/Stockholm',
  'Europe/Copenhagen',
  'Europe/Amsterdam',
  'Europe/Rome',
  'Europe/Madrid',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Dubai',
  'Australia/Sydney',
  'Pacific/Auckland'
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

  if (post.platforms && post.platforms.length > 0) {
    selectedPlatforms.value = [...post.platforms]
  } else if (post.platform) {
    // Fallback for old data structure
    selectedPlatforms.value = [post.platform]
  } else {
    selectedPlatforms.value = []
  }

  if (post.notes) {
    notes.value = post.notes
  }

  if (post.post_text) {
    postText.value = post.post_text
  }

  if (post.hashtags) {
    hashtags.value = [...post.hashtags]
  } else {
    hashtags.value = []
  }

  if (post.favorite_post_id) {
    selectedFavoriteId.value = post.favorite_post_id
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

// Hashtag functions
const addHashtag = () => {
  const tag = newHashtag.value.trim().replace(/^#/, '')
  if (tag && !hashtags.value.includes(`#${tag}`)) {
    hashtags.value.push(`#${tag}`)
  }
  newHashtag.value = ''
}

const removeHashtag = (index: number) => {
  hashtags.value.splice(index, 1)
}

// Close modal
const close = () => {
  emit('update:modelValue', false)
  error.value = ''
}

// Fetch available favorites for image switching
const fetchFavorites = async () => {
  try {
    const response = await fetch('/api/favorites', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      }
    })
    if (response.ok) {
      const data = await response.json()
      availableFavorites.value = data.data?.favorites || []
    }
  } catch (err) {
    console.error('Failed to fetch favorites:', err)
  }
}

// Show image picker
const openImagePicker = () => {
  if (availableFavorites.value.length === 0) {
    fetchFavorites()
  }
  showImagePicker.value = true
}

// Select a different favorite/image
const selectFavorite = (favorite: any) => {
  selectedFavoriteId.value = favorite.id
  showImagePicker.value = false
}

// Get currently selected favorite
const currentFavorite = computed(() => {
  if (selectedFavoriteId.value && availableFavorites.value.length > 0) {
    return availableFavorites.value.find(f => f.id === selectedFavoriteId.value)
  }
  return props.post
})

// Save changes
const saveChanges = async () => {
  error.value = ''

  // Validation
  if (!scheduledDate.value) {
    error.value = 'Please select a date'
    return
  }

  if (!selectedPlatforms.value || selectedPlatforms.value.length === 0) {
    error.value = 'Please select at least one platform'
    return
  }

  if (!postText.value.trim()) {
    error.value = 'Please enter post text'
    return
  }

  saving.value = true

  try {
    const updates = {
      scheduled_date: scheduledDate.value,
      scheduled_time: get24HourTime(),
      timezone: timezone.value,
      platforms: selectedPlatforms.value,
      notes: notes.value || undefined,
      post_text: postText.value,
      hashtags: hashtags.value,
      favorite_post_id: selectedFavoriteId.value
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
        <BaseAlert v-if="error" type="error">{{ error }}</BaseAlert>

        <!-- Image Preview at Top -->
        <div v-if="currentFavorite" class="preview-section">
          <div class="preview-media">
            <img
              v-if="currentFavorite.content_type === 'image' && currentFavorite.media_url"
              :src="currentFavorite.media_url"
              alt="Post preview"
              class="preview-image"
            />
            <video
              v-else-if="currentFavorite.content_type === 'video' && currentFavorite.media_url"
              :src="currentFavorite.media_url"
              class="preview-video"
            />
            <div v-else class="preview-placeholder">
              <span class="placeholder-icon">photo_camera</span>
              <span class="placeholder-text">No media</span>
            </div>
          </div>
          <BaseButton
            variant="secondary"
            size="small"
            @click="openImagePicker"
            class="change-image-btn"
          >
            🖼️ Change Image
          </BaseButton>
        </div>

        <!-- Form Fields -->
        <div class="edit-form">
          <!-- Post Text -->
          <div class="form-group">
            <label class="form-label">✍️ POST TEXT <span class="required">*</span></label>
            <textarea
              v-model="postText"
              class="form-textarea post-text-area"
              placeholder="Write your post content here..."
              rows="5"
            />
            <div class="char-count" :class="{ warning: postText.length > 5000 }">
              {{ postText.length }} characters
            </div>
          </div>

          <!-- Hashtags -->
          <div class="form-group">
            <label class="form-label">#️⃣ HASHTAGS</label>
            <div class="hashtag-editor">
              <div class="hashtag-tags">
                <span
                  v-for="(tag, idx) in hashtags"
                  :key="idx"
                  class="hashtag-tag"
                >
                  {{ tag }}
                  <button @click="removeHashtag(idx)" class="remove-tag">&times;</button>
                </span>
              </div>
              <input
                v-model="newHashtag"
                @keydown.enter.prevent="addHashtag"
                @keydown.,.prevent="addHashtag"
                placeholder="Add hashtag and press Enter..."
                class="hashtag-input"
              />
            </div>
          </div>

          <!-- Date -->
          <div class="form-group">
            <label class="form-label">calendar_month SCHEDULED DATE</label>
            <DatePicker
              v-model="scheduledDate"
              :min-date="new Date().toISOString().split('T')[0]"
            />
            <div v-if="scheduledDate" class="date-preview">
              {{ formatDisplayDate(scheduledDate) }}
            </div>
          </div>

          <!-- Time -->
          <div class="form-group">
            <label class="form-label">schedule SCHEDULED TIME</label>
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

          <!-- Platforms Selection -->
          <div class="form-group platforms-section">
            <label class="form-label">PLATFORMS <span class="required">*</span></label>
            <div class="platforms-grid">
              <label
                v-for="platform in availablePlatforms"
                :key="platform.id"
                :class="[
                  'platform-option',
                  {
                    'selected': selectedPlatforms.includes(platform.id),
                    'disabled': !platform.isConnected
                  }
                ]"
              >
                <input
                  type="checkbox"
                  :value="platform.id"
                  v-model="selectedPlatforms"
                  :disabled="!platform.isConnected"
                  class="platform-checkbox"
                />
                <span class="platform-icon">{{ platform.icon }}</span>
                <span class="platform-name">{{ platform.name }}</span>
                <span v-if="!platform.isConnected" class="connection-hint">(Not connected)</span>
              </label>
            </div>
            <p v-if="selectedPlatforms.length === 0" class="platform-hint error">
              Please select at least one platform
            </p>
          </div>

          <!-- Timezone Row -->
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">🌍 TIMEZONE</label>
              <select v-model="timezone" class="form-input">
                <option v-for="tz in timezones" :key="tz" :value="tz">
                  {{ tz.replace(/_/g, ' ') }}
                </option>
              </select>
              <div class="timezone-hint">
                Detected: {{ detectedTimezone.replace(/_/g, ' ') }}
              </div>
            </div>
          </div>

          <!-- Notes -->
          <div class="form-group">
            <label class="form-label">edit_note NOTES (OPTIONAL)</label>
            <textarea
              v-model="notes"
              class="form-textarea"
              placeholder="Add any notes about this post..."
              rows="3"
            />
          </div>
        </div>

        <!-- Image Picker Modal -->
        <div v-if="showImagePicker" class="image-picker-overlay" @click.self="showImagePicker = false">
          <div class="image-picker-modal">
            <div class="image-picker-header">
              <h3 class="image-picker-title">Select a Different Image</h3>
              <button class="close-button" @click="showImagePicker = false">×</button>
            </div>
            <div class="favorites-grid">
              <div
                v-for="favorite in availableFavorites"
                :key="favorite.id"
                :class="['favorite-card', { selected: selectedFavoriteId === favorite.id }]"
                @click="selectFavorite(favorite)"
              >
                <img
                  v-if="favorite.content_type === 'image'"
                  :src="favorite.media_url"
                  alt="Post"
                  class="favorite-thumbnail"
                />
                <video
                  v-else
                  :src="favorite.media_url"
                  class="favorite-thumbnail"
                />
                <div v-if="selectedFavoriteId === favorite.id" class="selected-check">check_circle</div>
              </div>
            </div>
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

/* Preview Section at Top */
.preview-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-xl);
  padding-bottom: var(--space-xl);
  border-bottom: 1px solid rgba(212, 175, 55, 0.2);
}

.preview-media {
  width: 240px;
  height: 240px;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(212, 175, 55, 0.3);
  transition: var(--transition-base);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
}

.preview-media:hover {
  border-color: var(--gold-primary);
  box-shadow: 0 12px 24px rgba(212, 175, 55, 0.2);
}

.change-image-btn {
  min-width: 200px;
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

/* Edit Form */
.edit-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-lg);
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

.form-input option {
  background: var(--bg-secondary);
  color: var(--text-primary);
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

/* Hashtag Editor */
.hashtag-editor {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  transition: all 0.2s ease;
}

.hashtag-editor:focus-within {
  border-color: var(--gold-primary);
  background: rgba(0, 0, 0, 0.4);
}

.hashtag-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  margin-bottom: var(--space-sm);
}

.hashtag-tag {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-sm);
  background: rgba(212, 175, 55, 0.15);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: var(--radius-full);
  color: var(--gold-primary);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
}

.remove-tag {
  background: none;
  border: none;
  color: var(--gold-primary);
  font-size: var(--text-base);
  cursor: pointer;
  padding: 0;
  line-height: 1;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.remove-tag:hover {
  opacity: 1;
}

.hashtag-input {
  width: 100%;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: var(--text-base);
  padding: var(--space-xs) 0;
}

.hashtag-input:focus {
  outline: none;
}

.hashtag-input::placeholder {
  color: var(--text-muted);
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

.time-select option {
  background: var(--bg-secondary);
  color: var(--text-primary);
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

.platforms-section {
  margin-bottom: var(--space-xl);
}

.platforms-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--space-md);
  margin-top: var(--space-md);
}

.platform-option {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  cursor: pointer;
  transition: all var(--transition-base);
}

.platform-option:hover:not(.disabled) {
  border-color: var(--gold-primary);
  background: var(--gold-subtle);
}

.platform-option.selected {
  border-color: var(--gold-primary);
  background: var(--gold-subtle);
}

.platform-option.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.platform-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--gold-primary);
}

.platform-option.disabled .platform-checkbox {
  cursor: not-allowed;
}

.platform-icon {
  font-size: var(--text-xl);
}

.platform-name {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.connection-hint {
  font-size: var(--text-xs);
  color: var(--text-muted);
  margin-left: auto;
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

.post-text-area {
  font-size: var(--text-base);
  line-height: var(--leading-normal);
  min-height: 150px;
}

.char-count {
  font-size: var(--text-xs);
  color: var(--text-muted);
  text-align: right;
}

.char-count.warning {
  color: #f59e0b;
  font-weight: var(--font-semibold);
}

/* Image Picker Modal */
.image-picker-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(var(--blur-lg));
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
  padding: var(--space-xl);
  animation: fadeIn 0.2s ease-out;
}

.image-picker-modal {
  max-width: 800px;
  width: 100%;
  max-height: 80vh;
  background: rgba(26, 26, 26, 0.95);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: var(--radius-lg);
  padding: var(--space-2xl);
  overflow-y: auto;
  animation: slideUp 0.3s ease-out;
}

.image-picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-2xl);
  padding-bottom: var(--space-lg);
  border-bottom: 1px solid rgba(212, 175, 55, 0.2);
}

.image-picker-title {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  color: var(--text-primary);
  margin: 0;
}

.favorites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: var(--space-lg);
}

.favorite-card {
  position: relative;
  aspect-ratio: 1;
  border-radius: var(--radius-md);
  overflow: hidden;
  cursor: pointer;
  border: 2px solid rgba(212, 175, 55, 0.2);
  transition: var(--transition-base);
}

.favorite-card:hover {
  border-color: var(--gold-primary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.favorite-card.selected {
  border-color: var(--gold-primary);
  box-shadow: var(--glow-gold-md);
}

.favorite-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.selected-check {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 50px;
  height: 50px;
  background: var(--gold-primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-2xl);
  color: var(--text-on-gold);
  font-weight: var(--font-bold);
  box-shadow: var(--glow-gold-md);
  animation: scaleIn 0.3s ease;
}

@keyframes scaleIn {
  from {
    transform: translate(-50%, -50%) scale(0);
  }
  to {
    transform: translate(-50%, -50%) scale(1);
  }
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

  .edit-modal {
    max-width: 100%;
  }

  .form-row {
    grid-template-columns: 1fr;
    gap: var(--space-md);
  }

  .preview-media {
    width: 100%;
    max-width: 300px;
    height: auto;
    aspect-ratio: 1;
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

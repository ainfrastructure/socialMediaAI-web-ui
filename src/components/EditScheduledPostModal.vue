<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseModal from './BaseModal.vue'
import BaseButton from './BaseButton.vue'
import BaseAlert from './BaseAlert.vue'
import DatePicker from './DatePicker.vue'
import MaterialIcon from './MaterialIcon.vue'
import PlatformLogo from './PlatformLogo.vue'
import { useSocialAccounts } from '../composables/useSocialAccounts'
import { useScheduleTime } from '../composables/useScheduleTime'

interface Props {
  modelValue: boolean
  post: any
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', updates: any): void
}>()

useI18n()

// Social accounts integration
const { availablePlatforms } = useSocialAccounts()

// Schedule time utilities
const { hours12, minutes: minutesList, timezones, getDefaultTimezone } = useScheduleTime()

// Form state
const scheduledDate = ref('')
const hours = ref('12')
const minutes = ref('00')
const ampm = ref('AM')
const timezone = ref(getDefaultTimezone())
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

// Time options from composable
const hourOptions = hours12
const minuteOptions = minutesList

// Detected timezone for display
const detectedTimezone = getDefaultTimezone()

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
      const hour = parseInt(timeParts[1])
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

  // Get post_text from scheduled post first, then from favorite_posts
  if (post.post_text) {
    postText.value = post.post_text
  } else if (post.favorite_posts?.post_text) {
    postText.value = post.favorite_posts.post_text
  } else {
    postText.value = ''
  }

  // Get hashtags from favorite_posts (that's where they're stored in the database)
  if (post.hashtags && post.hashtags.length > 0) {
    hashtags.value = [...post.hashtags]
  } else if (post.favorite_posts?.hashtags && post.favorite_posts.hashtags.length > 0) {
    hashtags.value = [...post.favorite_posts.hashtags]
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
  <BaseModal
    :model-value="modelValue"
    size="xl"
    :show-close-button="true"
    card-variant="glass-intense"
    :close-on-overlay-click="!saving"
    :close-on-escape="!saving"
    @update:model-value="(val: boolean) => !val && close()"
    @close="close"
  >
    <div class="modal-content">
      <!-- Media Section (Left) -->
      <div class="modal-media">
        <img
          v-if="currentFavorite?.content_type === 'image' && currentFavorite?.media_url"
          :src="currentFavorite.media_url"
          alt="Post preview"
          class="media-image"
        />
        <video
          v-else-if="currentFavorite?.content_type === 'video' && currentFavorite?.media_url"
          :src="currentFavorite.media_url"
          controls
          class="media-video"
        />
        <div v-else class="media-placeholder">
          <MaterialIcon icon="image" size="xl" color="var(--text-muted)" />
          <span>{{ $t('common.noImage') }}</span>
        </div>
        <BaseButton
          variant="secondary"
          size="small"
          @click="openImagePicker"
          class="change-image-btn"
        >
          <MaterialIcon icon="image" size="sm" />
          {{ $t('editScheduledPost.changeImage') }}
        </BaseButton>
      </div>

      <!-- Form Section (Right) -->
      <div class="modal-info">
        <h2 class="modal-title">{{ $t('editScheduledPost.title') }}</h2>

        <BaseAlert v-if="error" type="error">{{ error }}</BaseAlert>

        <!-- Post Text -->
        <div class="info-section">
          <div class="info-label">
            <MaterialIcon icon="notes" size="sm" />
            <span>{{ $t('scheduler.caption') }} <span class="required">*</span></span>
          </div>
          <textarea
            v-model="postText"
            class="form-textarea post-text-area"
            :placeholder="$t('editScheduledPost.postTextPlaceholder')"
            rows="4"
          />
          <div class="char-count" :class="{ warning: postText.length > 5000 }">
            {{ postText.length }} {{ $t('editScheduledPost.characters') }}
          </div>
        </div>

        <!-- Hashtags -->
        <div class="info-section">
          <div class="info-label">
            <MaterialIcon icon="tag" size="sm" />
            <span>{{ $t('posts.hashtags') }}</span>
          </div>
          <div class="hashtags-row" v-if="hashtags.length > 0">
            <span v-for="(tag, idx) in hashtags" :key="idx" class="hashtag">
              {{ tag }}
              <button @click="removeHashtag(idx)" class="remove-tag">&times;</button>
            </span>
          </div>
          <input
            v-model="newHashtag"
            @keydown.enter.prevent="addHashtag"
            @keydown.,.prevent="addHashtag"
            :placeholder="$t('editScheduledPost.hashtagPlaceholder')"
            class="hashtag-input"
          />
        </div>

        <!-- Date & Time -->
        <div class="info-section">
          <div class="info-label">
            <MaterialIcon icon="calendar_today" size="sm" />
            <span>{{ $t('scheduleModal.dateLabel') }} <span class="required">*</span></span>
          </div>
          <DatePicker
            v-model="scheduledDate"
            :min-date="new Date().toISOString().split('T')[0]"
          />
          <div v-if="scheduledDate" class="date-preview">
            {{ formatDisplayDate(scheduledDate) }}
          </div>
        </div>

        <div class="info-section">
          <div class="info-label">
            <MaterialIcon icon="schedule" size="sm" />
            <span>{{ $t('scheduleModal.timeLabel') }}</span>
          </div>
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

        <!-- Platforms -->
        <div class="info-section">
          <div class="info-label">
            <MaterialIcon icon="share" size="sm" />
            <span>{{ $t('dashboardNew.platforms') }} <span class="required">*</span></span>
          </div>
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
              <PlatformLogo :platform="platform.id" :size="20" />
              <span class="platform-name">{{ platform.name }}</span>
              <span v-if="!platform.isConnected" class="connection-hint">({{ $t('editScheduledPost.notConnected') }})</span>
            </label>
          </div>
          <p v-if="selectedPlatforms.length === 0" class="platform-hint error">
            {{ $t('editScheduledPost.selectPlatform') }}
          </p>
        </div>

        <!-- Timezone -->
        <div class="info-section">
          <div class="info-label">
            <MaterialIcon icon="public" size="sm" />
            <span>{{ $t('scheduleModal.timezoneLabel') }}</span>
          </div>
          <select v-model="timezone" class="form-input">
            <option v-for="tz in timezones" :key="tz" :value="tz">
              {{ tz.replace(/_/g, ' ') }}
            </option>
          </select>
          <div class="timezone-hint">
            {{ $t('editScheduledPost.detected') }}: {{ detectedTimezone.replace(/_/g, ' ') }}
          </div>
        </div>

        <!-- Notes -->
        <div class="info-section">
          <div class="info-label">
            <MaterialIcon icon="edit_note" size="sm" />
            <span>{{ $t('editScheduledPost.notes') }}</span>
          </div>
          <textarea
            v-model="notes"
            class="form-textarea"
            :placeholder="$t('editScheduledPost.notesPlaceholder')"
            rows="2"
          />
        </div>

        <!-- Actions -->
        <div class="modal-actions">
          <BaseButton variant="ghost" size="medium" @click="close" :disabled="saving">
            {{ $t('common.cancel') }}
          </BaseButton>
          <BaseButton variant="primary" size="medium" @click="saveChanges" :disabled="saving">
            <MaterialIcon icon="save" size="sm" />
            {{ saving ? $t('common.saving') : $t('common.saveChanges') }}
          </BaseButton>
        </div>
      </div>
    </div>

    <!-- Image Picker Modal -->
    <div v-if="showImagePicker" class="image-picker-overlay" @click.self="showImagePicker = false">
      <div class="image-picker-modal">
        <div class="image-picker-header">
          <h3 class="image-picker-title">{{ $t('editScheduledPost.selectImage') }}</h3>
          <button class="close-button" @click="showImagePicker = false">
            <MaterialIcon icon="close" size="md" />
          </button>
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
            <div v-if="selectedFavoriteId === favorite.id" class="selected-check">
              <MaterialIcon icon="check_circle" size="lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </BaseModal>
</template>

<style scoped>
/* Two-Column Layout matching PostDetailModal */
.modal-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  max-height: 90vh;
}

/* Media Section (Left) */
.modal-media {
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  max-height: 90vh;
  overflow: hidden;
  padding: var(--space-xl);
  gap: var(--space-lg);
}

.media-image,
.media-video {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
  border-radius: var(--radius-md);
}

.media-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
  color: var(--text-muted);
  padding: var(--space-3xl);
}

.change-image-btn {
  margin-top: var(--space-md);
}

/* Info/Form Section (Right) */
.modal-info {
  padding: var(--space-2xl);
  overflow-y: auto;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.modal-title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--gold-primary);
  margin: 0;
}

/* Info Sections (matching PostDetailModal) */
.info-section {
  padding-bottom: var(--space-md);
  border-bottom: 1px solid var(--border-color);
}

.info-section:last-of-type {
  border-bottom: none;
}

.info-label {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--text-sm);
  color: var(--text-muted);
  margin-bottom: var(--space-sm);
}

/* Form Elements */
.form-input,
.form-textarea {
  width: 100%;
  padding: var(--space-md);
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--text-sm);
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

.post-text-area {
  font-size: var(--text-sm);
  line-height: 1.6;
  min-height: 100px;
}

.char-count {
  font-size: var(--text-xs);
  color: var(--text-muted);
  text-align: right;
  margin-top: var(--space-xs);
}

.char-count.warning {
  color: #f59e0b;
  font-weight: var(--font-semibold);
}

/* Hashtags (matching PostDetailModal) */
.hashtags-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  margin-bottom: var(--space-sm);
}

.hashtag {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--text-sm);
  color: var(--gold-primary);
  background: rgba(212, 175, 55, 0.1);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-sm);
}

.remove-tag {
  background: none;
  border: none;
  color: var(--gold-primary);
  font-size: var(--text-base);
  cursor: pointer;
  padding: 0;
  margin-left: var(--space-xs);
  line-height: 1;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.remove-tag:hover {
  opacity: 1;
}

.hashtag-input {
  width: 100%;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  padding: var(--space-sm) var(--space-md);
  transition: var(--transition-base);
}

.hashtag-input:focus {
  outline: none;
  border-color: var(--gold-primary);
}

.hashtag-input::placeholder {
  color: var(--text-muted);
}

/* Date & Time */
.date-preview,
.time-preview {
  font-size: var(--text-sm);
  color: var(--gold-primary);
  font-weight: var(--font-medium);
  margin-top: var(--space-xs);
}

.time-picker {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.time-select {
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--text-sm);
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
}

.ampm-select {
  flex: 0 0 70px;
}

.time-separator {
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  color: var(--text-primary);
}

.timezone-hint {
  font-size: var(--text-xs);
  color: var(--text-muted);
  font-style: italic;
  margin-top: var(--space-xs);
}

/* Platforms Grid */
.platforms-grid {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  margin-top: var(--space-sm);
}

.platform-option {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-primary);
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
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: var(--gold-primary);
}

.platform-option.disabled .platform-checkbox {
  cursor: not-allowed;
}

.platform-name {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-primary);
  text-transform: capitalize;
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
  margin-top: var(--space-sm);
}

.platform-hint.error {
  color: #ef4444;
}

.required {
  color: #ef4444;
}

/* Actions (matching PostDetailModal) */
.modal-actions {
  display: flex;
  gap: var(--space-md);
  margin-top: auto;
  padding-top: var(--space-xl);
  border-top: 1px solid var(--border-color);
  flex-wrap: wrap;
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

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.image-picker-modal {
  max-width: 800px;
  width: 100%;
  max-height: 80vh;
  background: rgba(26, 26, 26, 0.95);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--space-2xl);
  overflow-y: auto;
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

.image-picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-2xl);
  padding-bottom: var(--space-lg);
  border-bottom: 1px solid var(--border-color);
}

.image-picker-title {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  color: var(--text-primary);
  margin: 0;
}

.close-button {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: var(--space-sm);
  border-radius: var(--radius-md);
  transition: var(--transition-fast);
}

.close-button:hover {
  color: var(--text-primary);
  background: var(--bg-elevated);
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
  border: 2px solid var(--border-color);
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
  color: var(--text-on-gold);
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

/* Responsive */
@media (max-width: 900px) {
  .modal-content {
    grid-template-columns: 1fr;
  }

  .modal-media {
    min-height: 250px;
    max-height: 40vh;
  }

  .media-image,
  .media-video {
    max-height: 35vh;
  }

  .modal-info {
    max-height: 50vh;
  }
}

@media (max-width: 600px) {
  .modal-info {
    padding: var(--space-lg);
  }

  .modal-title {
    font-size: var(--text-xl);
  }

  .modal-actions {
    flex-direction: column;
  }

  .modal-actions > * {
    width: 100%;
  }

  .time-picker {
    flex-wrap: wrap;
  }
}
</style>

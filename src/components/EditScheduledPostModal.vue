<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseModal from './BaseModal.vue'
import BaseButton from './BaseButton.vue'
import BaseAlert from './BaseAlert.vue'
import { VueDatePicker } from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import MobileTimePicker from './MobileTimePicker.vue'
import MaterialIcon from './MaterialIcon.vue'
import PlatformLogo from './PlatformLogo.vue'
import { useSocialAccounts } from '../composables/useSocialAccounts'
import { useScheduleTime } from '../composables/useScheduleTime'
import { errorLog } from '@/utils/debug'

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
const { timezones, getDefaultTimezone, detectedTimezone } = useScheduleTime()

// Form state
const scheduledDate = ref<Date | null>(null)
const selectedTime = ref<{ hours: number; minutes: number }>({ hours: 12, minutes: 0 })
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

// Watch for post changes and populate form
watch(() => props.post, (newPost) => {
  if (newPost) {
    populateForm(newPost)
  }
}, { immediate: true })

// Populate form from post data
const populateForm = (post: any) => {
  if (post.scheduled_date) {
    // Parse YYYY-MM-DD to Date object
    const [year, month, day] = post.scheduled_date.split('-').map(Number)
    scheduledDate.value = new Date(year, month - 1, day)
  }

  if (post.scheduled_time) {
    // Parse time like "14:30:00" or "14:30"
    const timeParts = post.scheduled_time.match(/(\d+):(\d+)/)
    if (timeParts) {
      selectedTime.value = {
        hours: parseInt(timeParts[1]),
        minutes: parseInt(timeParts[2])
      }
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

// Get time for backend (already in 24-hour format)
const get24HourTime = () => {
  const hours = String(selectedTime.value.hours).padStart(2, '0')
  const minutes = String(selectedTime.value.minutes).padStart(2, '0')
  return `${hours}:${minutes}:00`
}

// Get date string for backend (YYYY-MM-DD)
const getDateString = () => {
  if (!scheduledDate.value) return ''
  const year = scheduledDate.value.getFullYear()
  const month = String(scheduledDate.value.getMonth() + 1).padStart(2, '0')
  const day = String(scheduledDate.value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Today's date for min-date
const today = new Date()
today.setHours(0, 0, 0, 0)

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
    errorLog('Failed to fetch favorites:', err)
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
      scheduled_date: getDateString(),
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
          <VueDatePicker
            v-model="scheduledDate"
            :min-date="today"
            :enable-time-picker="false"
            inline
            auto-apply
            dark
            class="date-picker-inline"
          />
        </div>

        <div class="info-section">
          <div class="info-label">
            <MaterialIcon icon="schedule" size="sm" />
            <span>{{ $t('scheduleModal.timeLabel') }}</span>
          </div>
          <div class="time-picker-wrapper">
            <MobileTimePicker
              v-model="selectedTime"
              :minutes-increment="1"
            />
          </div>
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
  background: rgba(15, 61, 46, 0.2);
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
  background: rgba(15, 61, 46, 0.2);
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
  background: rgba(15, 61, 46, 0.1);
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

/* Inline Date Picker Container */
.date-picker-inline {
  background: rgba(15, 61, 46, 0.15);
  border: 1px solid rgba(15, 61, 46, 0.2);
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
  background: rgba(15, 61, 46, 0.15);
  border: 1px solid rgba(15, 61, 46, 0.2);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  display: flex;
  justify-content: center;
}

/* Date/Time Picker Dark Theme Override */
:deep(.dp__theme_dark) {
  --dp-background-color: transparent;
  --dp-text-color: var(--text-primary);
  --dp-hover-color: rgba(15, 61, 46, 0.15);
  --dp-hover-text-color: var(--text-primary);
  --dp-primary-color: var(--gold-primary);
  --dp-primary-text-color: var(--text-on-gold);
  --dp-secondary-color: rgba(15, 61, 46, 0.1);
  --dp-border-color: rgba(15, 61, 46, 0.3);
  --dp-menu-border-color: transparent;
  --dp-border-color-hover: var(--gold-primary);
  --dp-disabled-color: var(--text-muted);
  --dp-disabled-color-text: var(--text-muted);
  --dp-success-color: var(--gold-primary);
  --dp-icon-color: var(--gold-primary);
  --dp-danger-color: #ef4444;
  --dp-highlight-color: rgba(15, 61, 46, 0.1);
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
  background: rgba(15, 61, 46, 0.1);
  border-radius: var(--radius-sm);
}

/* Navigation arrows */
:deep(.dp__inner_nav) {
  color: var(--text-secondary);
  width: 36px;
  height: 36px;
}

:deep(.dp__inner_nav:hover) {
  background: rgba(15, 61, 46, 0.15);
  color: var(--gold-primary);
  border-radius: var(--radius-sm);
}

/* Calendar days */
:deep(.dp__calendar_item) {
  border-radius: var(--radius-sm);
}

:deep(.dp__cell_inner) {
  border-radius: var(--radius-sm);
  width: 36px;
  height: 36px;
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
  background: rgba(15, 61, 46, 0.45);
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
  background: rgba(255, 255, 255, 0.95);
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
}
</style>

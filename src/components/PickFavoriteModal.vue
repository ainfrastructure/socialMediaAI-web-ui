<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal-overlay" @click.self="closeModal">
      <BaseCard variant="glass-intense" class="modal-card">
        <div class="modal-header">
          <h3 class="modal-title">Pick a Favorite Post</h3>
          <button class="close-btn" @click="closeModal">&times;</button>
        </div>

        <div class="modal-body">
          <!-- Date Selection -->
          <div class="form-group-full">
            <label for="schedule_date" class="form-label">
              Date <span class="required">*</span>
            </label>
            <DatePicker
              v-model="scheduleDate"
              :min-date="today"
            />
            <p class="date-preview">
              Scheduling for: <strong>{{ formatDate(scheduleDate) }}</strong>
            </p>
          </div>

          <!-- Time, Timezone, and Platform Selection -->
          <div class="schedule-settings">
            <div class="form-group">
              <label class="form-label">
                Time <span class="required">*</span>
              </label>
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
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
              <p class="time-hint">{{ selectedHour }}:{{ selectedMinute }} {{ selectedPeriod }}</p>
            </div>

            <div class="form-group">
              <label for="timezone" class="form-label">
                Timezone
                <span v-if="timezone === defaultTimezone" class="detected-badge">
                  (Auto-detected)
                </span>
              </label>
              <select id="timezone" v-model="timezone" class="form-select">
                <option value="UTC">UTC (Coordinated Universal Time)</option>
                <option value="America/New_York">Eastern Time (ET)</option>
                <option value="America/Chicago">Central Time (CT)</option>
                <option value="America/Denver">Mountain Time (MT)</option>
                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                <option value="Europe/London">London (GMT/BST)</option>
                <option value="Europe/Paris">Paris (CET/CEST)</option>
                <option value="Europe/Oslo">Oslo (CET/CEST)</option>
                <option value="Asia/Tokyo">Tokyo (JST)</option>
                <option value="Asia/Dubai">Dubai (GST)</option>
                <option value="Australia/Sydney">Sydney (AEDT/AEST)</option>
              </select>
            </div>

            <div class="form-group form-group-full">
              <label for="platform" class="form-label">
                Platform <span class="required">*</span>
              </label>
              <select id="platform" v-model="selectedPlatform" class="form-select platform-select">
                <option value="">Select a platform...</option>
                <option value="facebook">👥 Facebook</option>
                <option value="instagram">📷 Instagram</option>
                <option value="tiktok">🎵 TikTok</option>
                <option value="twitter">🐦 Twitter/X</option>
                <option value="linkedin">💼 LinkedIn</option>
              </select>
              <p v-if="!selectedPlatform" class="platform-hint error">
                ⚠️ Please select a platform to publish to
              </p>
              <p v-else-if="selectedPlatform !== 'facebook'" class="platform-hint warning">
                ⚠️ Only Facebook is currently supported. Other platforms coming soon.
              </p>
            </div>
          </div>

          <!-- Loading State -->
          <div v-if="loading" class="loading-container">
            <div class="spinner"></div>
            <p>Loading favorites...</p>
          </div>

          <!-- Empty State -->
          <div v-else-if="favorites.length === 0" class="empty-state">
            <p>No favorites yet! Create content in the Playground first.</p>
            <BaseButton variant="primary" @click="goToPlayground">
              Go to Playground
            </BaseButton>
          </div>

          <!-- Favorites Grid -->
          <div v-else>
            <div class="favorites-grid">
              <div
                v-for="favorite in paginatedFavorites"
                :key="favorite.id"
                class="favorite-item"
                @click="selectFavorite(favorite)"
              >
              <!-- Media Thumbnail -->
              <div class="thumbnail-container">
                <img
                  v-if="favorite.content_type === 'image'"
                  :src="favorite.media_url"
                  alt="Favorite"
                  class="thumbnail"
                />
                <video
                  v-else
                  :src="favorite.media_url"
                  class="thumbnail"
                ></video>

                <!-- Type Badge -->
                <span :class="['type-badge', favorite.content_type]">
                  {{ favorite.content_type === 'image' ? '📸' : '🎥' }}
                </span>

                <!-- Platform Badge -->
                <span v-if="favorite.platform" :class="['platform-badge', `platform-${favorite.platform}`]">
                  {{ favorite.platform }}
                </span>
              </div>

              <!-- Post Info -->
              <div class="favorite-info">
                <p v-if="favorite.post_text" class="post-preview">
                  {{ truncateText(favorite.post_text, 80) }}
                </p>
                <div v-if="favorite.saved_restaurants?.name" class="restaurant-tag">
                  🏪 {{ favorite.saved_restaurants.name }}
                </div>
              </div>

              <!-- Schedule Button -->
              <BaseButton
                variant="primary"
                size="small"
                full-width
                @click.stop="scheduleFavorite(favorite)"
              >
                Schedule This
              </BaseButton>
            </div>
          </div>

          <!-- Pagination -->
          <div v-if="totalPages > 1" class="pagination">
            <button
              class="pagination-btn"
              :disabled="currentPage === 1"
              @click="currentPage--"
            >
              ← Previous
            </button>
            <span class="pagination-info">
              Page {{ currentPage }} of {{ totalPages }} ({{ favorites.length }} favorites)
            </span>
            <button
              class="pagination-btn"
              :disabled="currentPage === totalPages"
              @click="currentPage++"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
      </BaseCard>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import BaseCard from './BaseCard.vue'
import BaseButton from './BaseButton.vue'
import DatePicker from './DatePicker.vue'
import { api } from '../services/api'

interface Props {
  modelValue: boolean
  selectedDate: string | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'scheduled', data: { favorite: any; date: string }): void
}>()

const router = useRouter()
const favorites = ref<any[]>([])
const loading = ref(false)
const scheduledTime = ref('')
const selectedPlatform = ref('')
const selectedHour = ref('12')
const selectedMinute = ref('00')
const selectedPeriod = ref<'AM' | 'PM'>('PM')
const currentPage = ref(1)
const itemsPerPage = 6

// Auto-detect timezone with fallback
const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
const defaultTimezone = detectedTimezone || 'UTC'
const timezone = ref(defaultTimezone)

const scheduleDate = ref(props.selectedDate || '')

// Generate hour options (1-12)
const hours = Array.from({ length: 12 }, (_, i) => {
  const hour = i + 1
  return hour.toString().padStart(2, '0')
})

// Generate minute options (00-59)
const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'))

// Pagination computed properties
const totalPages = computed(() => Math.ceil(favorites.value.length / itemsPerPage))

const paginatedFavorites = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return favorites.value.slice(start, end)
})

const today = computed(() => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
})

// Update scheduleDate when selectedDate prop changes
watch(() => props.selectedDate, (newDate) => {
  if (newDate) {
    scheduleDate.value = newDate
  }
})

// Convert time picker values to 24-hour format
watch([selectedHour, selectedMinute, selectedPeriod], () => {
  const hour24 = selectedPeriod.value === 'PM' && selectedHour.value !== '12'
    ? (parseInt(selectedHour.value) + 12).toString().padStart(2, '0')
    : selectedPeriod.value === 'AM' && selectedHour.value === '12'
    ? '00'
    : selectedHour.value

  scheduledTime.value = `${hour24}:${selectedMinute.value}`
})

// Set default time to current time when modal opens
watch(() => props.modelValue, async (newValue) => {
  if (newValue) {
    // Set default time to current time
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()

    // Convert to 12-hour format
    selectedPeriod.value = currentHour >= 12 ? 'PM' : 'AM'
    selectedHour.value = (currentHour % 12 || 12).toString().padStart(2, '0')
    selectedMinute.value = currentMinute.toString().padStart(2, '0')

    // Reset timezone to auto-detected
    timezone.value = defaultTimezone

    // Reset platform selection and pagination
    selectedPlatform.value = ''
    currentPage.value = 1

    await fetchFavorites()
  }
})

const fetchFavorites = async () => {
  try {
    loading.value = true
    const response = await api.getFavorites()

    if (response.success) {
      favorites.value = response.data?.favorites || []
    }
  } catch (error) {

  } finally {
    loading.value = false
  }
}

const closeModal = () => {
  emit('update:modelValue', false)
}

const selectFavorite = (favorite: any) => {
  // Just highlight for now, user clicks "Schedule This" button
}

const scheduleFavorite = async (favorite: any) => {
  if (!scheduleDate.value) {
    alert('No date selected')
    return
  }

  if (!scheduledTime.value) {
    alert('Please select a time')
    return
  }

  if (!selectedPlatform.value) {
    alert('Please select a platform')
    return
  }

  if (selectedPlatform.value !== 'facebook') {
    alert('Only Facebook is currently supported. Other platforms coming soon.')
    return
  }

  try {
    const response = await api.schedulePost({
      favorite_post_id: favorite.id,
      scheduled_date: scheduleDate.value,
      scheduled_time: scheduledTime.value,
      timezone: timezone.value,
      platform: selectedPlatform.value,
    })

    if (response.success) {
      emit('scheduled', { favorite, date: scheduleDate.value })
      closeModal()
    } else {
      alert(response.error || 'Failed to schedule post')
    }
  } catch (error: any) {

    alert(error.message || 'Failed to schedule post')
  }
}

const goToPlayground = () => {
  const dateParam = props.selectedDate ? `?scheduleDate=${props.selectedDate}` : ''
  router.push(`/playground${dateParam}`)
  closeModal()
}

const formatDate = (dateString: string): string => {
  // Parse date string (YYYY-MM-DD) and create date in local timezone
  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(year, month - 1, day) // month is 0-indexed

  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
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
  max-width: 900px;
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

.form-group-full {
  margin-bottom: var(--space-xl);
}

.date-preview {
  text-align: center;
  margin-top: var(--space-md);
  padding: var(--space-sm);
  background: rgba(212, 175, 55, 0.1);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: var(--text-sm);
}

.date-preview strong {
  color: var(--gold-primary);
  font-weight: 600;
}

.schedule-settings {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-lg);
  margin-bottom: var(--space-xl);
  padding: var(--space-lg);
  background: rgba(0, 0, 0, 0.3);
  border-radius: var(--radius-lg);
  border: 1px solid rgba(212, 175, 55, 0.2);
}

.form-group-full {
  grid-column: 1 / -1;
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

.detected-badge {
  font-size: var(--text-xs);
  color: var(--gold-primary);
  font-weight: var(--font-medium);
  background: rgba(212, 175, 55, 0.15);
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  margin-left: var(--space-sm);
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

.form-input,
.form-select {
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
.form-select:focus {
  outline: none;
  border-color: var(--gold-primary);
  background: rgba(0, 0, 0, 0.5);
}

.form-select option {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

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
  margin-top: var(--space-xs);
}

.platform-hint.error {
  color: #ef4444;
}

.platform-hint.warning {
  color: #f59e0b;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3rem;
  gap: 1rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(212, 175, 55, 0.2);
  border-top-color: var(--gold-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.empty-state {
  text-align: center;
  padding: 3rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.empty-state p {
  color: var(--text-secondary);
  margin: 0;
}

.favorites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: var(--space-xl);
}

.favorite-item {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: var(--radius-lg);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
}

.favorite-item:hover {
  border-color: rgba(212, 175, 55, 0.5);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.thumbnail-container {
  position: relative;
  width: 100%;
  height: 180px;
  overflow: hidden;
}

.thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.type-badge {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  padding: 0.375rem 0.75rem;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-primary);
}

.type-badge.image {
  border-left: 3px solid #4CAF50;
}

.type-badge.video {
  border-left: 3px solid #2196F3;
}

.platform-badge {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
}

.platform-badge.platform-instagram {
  background: rgba(225, 48, 108, 0.9);
  color: white;
}

.platform-badge.platform-facebook {
  background: rgba(66, 103, 178, 0.9);
  color: white;
}

.platform-badge.platform-tiktok {
  background: rgba(0, 0, 0, 0.9);
  color: white;
}

.platform-badge.platform-twitter {
  background: rgba(29, 161, 242, 0.9);
  color: white;
}

.favorite-info {
  padding: var(--space-md);
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.post-preview {
  color: var(--text-secondary);
  font-size: 0.875rem;
  line-height: 1.4;
  margin: 0;
  flex: 1;
}

.restaurant-tag {
  font-size: 0.75rem;
  color: var(--gold-primary);
  font-weight: 500;
}

/* Pagination Styles */
.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  margin-top: var(--space-xl);
  padding: var(--space-lg);
  background: rgba(0, 0, 0, 0.3);
  border-radius: var(--radius-lg);
  border: 1px solid rgba(212, 175, 55, 0.2);
}

.pagination-btn {
  padding: var(--space-sm) var(--space-lg);
  background: rgba(212, 175, 55, 0.15);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: var(--radius-md);
  color: var(--gold-primary);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  cursor: pointer;
  transition: all 0.2s ease;
}

.pagination-btn:hover:not(:disabled) {
  background: rgba(212, 175, 55, 0.25);
  border-color: var(--gold-primary);
  transform: translateY(-1px);
}

.pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pagination-info {
  color: var(--text-secondary);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  white-space: nowrap;
}

/* Responsive */
@media (max-width: 768px) {
  .modal-card {
    max-height: 95vh;
  }

  .schedule-settings {
    grid-template-columns: 1fr;
  }

  .favorites-grid {
    grid-template-columns: 1fr;
  }

  .pagination {
    flex-direction: column;
    gap: var(--space-sm);
  }

  .pagination-info {
    order: -1;
  }
}
</style>

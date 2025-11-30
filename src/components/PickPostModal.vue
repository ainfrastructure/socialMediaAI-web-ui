<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal-overlay" @click.self="closeModal">
      <BaseCard variant="glass-intense" class="modal-card">
        <div class="modal-header">
          <h3 class="modal-title">
            {{ currentStep === 1 ? 'Pick a Saved Post' : 'Schedule Your Post' }}
          </h3>
          <button class="close-btn" @click="closeModal">&times;</button>
        </div>

        <div class="modal-body">
          <!-- Progress Indicator -->
          <div class="progress-indicator">
            <div :class="['step-dot', { active: currentStep === 1, completed: currentStep > 1 }]">1</div>
            <div class="step-line"></div>
            <div :class="['step-dot', { active: currentStep === 2 }]">2</div>
          </div>

          <!-- STEP 1: Select Post -->
          <div v-if="currentStep === 1" class="wizard-step">
            <!-- Loading State -->
            <div v-if="loading" class="loading-container">
              <div class="spinner"></div>
              <p>Loading posts...</p>
            </div>

            <!-- Empty State -->
            <div v-else-if="posts.length === 0" class="empty-state">
              <p>No posts yet! Create content in the Playground first.</p>
              <BaseButton variant="primary" @click="goToPlayground">
                Go to Playground
              </BaseButton>
            </div>

            <!-- Posts Grid -->
            <div v-else>
              <div class="posts-grid">
                <div
                  v-for="post in paginatedPosts"
                  :key="post.id"
                  :class="['post-item', { selected: selectedPost?.id === post.id }]"
                  @click="selectPost(post)"
                >
                  <!-- Media Thumbnail -->
                  <div class="thumbnail-container">
                    <img
                      v-if="post.content_type === 'image'"
                      :src="post.media_url"
                      alt="Post"
                      class="thumbnail"
                    />
                    <video
                      v-else
                      :src="post.media_url"
                      class="thumbnail"
                    ></video>

                    <!-- Type Badge -->
                    <span :class="['type-badge', post.content_type]">
                      {{ post.content_type === 'image' ? 'photo_camera' : 'videocam' }}
                    </span>

                    <!-- Platform Badge -->
                    <span v-if="post.platform" :class="['platform-badge', `platform-${post.platform}`]">
                      {{ post.platform }}
                    </span>

                    <!-- Selection Indicator -->
                    <div v-if="selectedPost?.id === post.id" class="selection-check">
                      check_circle
                    </div>
                  </div>

                  <!-- Post Info -->
                  <div class="post-info">
                    <p v-if="post.post_text" class="post-preview">
                      {{ truncateText(post.post_text, 80) }}
                    </p>
                    <div v-if="post.saved_restaurants?.name" class="restaurant-tag">
                      🏪 {{ post.saved_restaurants.name }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Pagination -->
              <BasePagination
                v-model:current-page="currentPage"
                :total-pages="totalPages"
                :total-items="posts.length"
                @update:current-page="handlePageChange"
              />

              <!-- Next Button -->
              <div class="wizard-actions">
                <BaseButton
                  variant="primary"
                  size="large"
                  full-width
                  :disabled="!selectedPost"
                  @click="goToScheduleStep"
                >
                  Next: Set Schedule →
                </BaseButton>
              </div>
            </div>
          </div>

          <!-- STEP 2: Set Schedule -->
          <div v-if="currentStep === 2" class="wizard-step">
            <!-- Selected Post Preview -->
            <div v-if="selectedPost" class="selected-post-preview">
              <div class="preview-header">
                <h4 class="preview-title">Selected Post:</h4>
                <BaseButton
                  v-if="!isEditing"
                  variant="secondary"
                  size="small"
                  @click="toggleEditMode"
                >
                  edit Edit Content
                </BaseButton>
              </div>
              <div class="preview-card">
                <img
                  v-if="selectedPost.content_type === 'image'"
                  :src="selectedPost.media_url"
                  alt="Selected"
                  class="preview-thumbnail"
                />
                <video
                  v-else
                  :src="selectedPost.media_url"
                  class="preview-thumbnail"
                ></video>
                <p v-if="!isEditing" class="preview-text">
                  {{ truncateText(selectedPost.post_text, 100) }}
                </p>
              </div>

              <!-- Edit Section -->
              <div v-if="isEditing" class="edit-section">
                <div class="edit-field">
                  <label class="edit-label">Post Text</label>
                  <textarea
                    v-model="editedPostText"
                    class="edit-textarea"
                    rows="4"
                    placeholder="Enter post text..."
                  ></textarea>
                </div>

                <div class="edit-field">
                  <label class="edit-label">Hashtags</label>
                  <div class="hashtag-editor">
                    <div class="hashtag-tags">
                      <span
                        v-for="(tag, idx) in editedHashtags"
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

                <div class="edit-actions">
                  <BaseButton
                    variant="ghost"
                    size="small"
                    @click="cancelEdits"
                  >
                    Cancel
                  </BaseButton>
                  <BaseButton
                    variant="primary"
                    size="small"
                    :disabled="savingEdits"
                    @click="saveEdits"
                  >
                    {{ savingEdits ? 'Saving...' : 'Save Changes' }}
                  </BaseButton>
                </div>
              </div>
            </div>

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
                <option value="facebook">group Facebook</option>
                <option value="instagram">photo_camera Instagram</option>
                <option value="tiktok">music_note TikTok</option>
                <option value="twitter">flutter_dash Twitter/X</option>
                <option value="linkedin">work LinkedIn</option>
              </select>
              <p v-if="!selectedPlatform" class="platform-hint error">
                warning Please select a platform to publish to
              </p>
              <p v-else-if="selectedPlatform !== 'facebook'" class="platform-hint warning">
                warning Only Facebook is currently supported. Other platforms coming soon.
              </p>
            </div>
            </div>

            <!-- Wizard Actions for Step 2 -->
            <div class="wizard-actions step-2-actions">
              <BaseButton
                variant="ghost"
                size="medium"
                @click="goBackToSelection"
              >
                ← Back
              </BaseButton>
              <BaseButton
                variant="primary"
                size="large"
                @click="scheduleSelectedPost"
              >
                Schedule Post
              </BaseButton>
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
import BasePagination from './BasePagination.vue'
import DatePicker from './DatePicker.vue'
import { api } from '../services/api'

interface Props {
  modelValue: boolean
  selectedDate: string | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'scheduled', data: { post: any; date: string }): void
}>()

const router = useRouter()
const posts = ref<any[]>([])
const loading = ref(false)
const scheduledTime = ref('')
const selectedPlatform = ref('')
const selectedHour = ref('12')
const selectedMinute = ref('00')
const selectedPeriod = ref<'AM' | 'PM'>('PM')
const currentPage = ref(1)
const itemsPerPage = 6

// Wizard state
const currentStep = ref(1) // 1 = Select Post, 2 = Set Schedule
const selectedPost = ref<any>(null)

// Edit state
const isEditing = ref(false)
const savingEdits = ref(false)
const editedPostText = ref('')
const editedHashtags = ref<string[]>([])
const newHashtag = ref('')

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
const totalPages = computed(() => Math.ceil(posts.value.length / itemsPerPage))

const paginatedPosts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return posts.value.slice(start, end)
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

    // Reset wizard state
    currentStep.value = 1
    selectedPost.value = null
    isEditing.value = false

    await fetchPosts()
  }
})

const fetchPosts = async () => {
  try {
    loading.value = true
    const response = await api.getFavorites()

    if (response.success) {
      posts.value = response.data?.favorites || []
    }
  } catch (error) {

  } finally {
    loading.value = false
  }
}

const closeModal = () => {
  emit('update:modelValue', false)
}

const selectPost = (post: any) => {
  selectedPost.value = post
}

const goToScheduleStep = () => {
  if (!selectedPost.value) {
    alert('Please select a post first')
    return
  }
  currentStep.value = 2
}

const goBackToSelection = () => {
  currentStep.value = 1
  isEditing.value = false
}

const scheduleSelectedPost = async () => {
  const post = selectedPost.value
  if (!post) {
    alert('No post selected')
    return
  }
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
      favorite_post_id: post.id,
      scheduled_date: scheduleDate.value,
      scheduled_time: scheduledTime.value,
      timezone: timezone.value,
      platforms: [selectedPlatform.value],
    })

    if (response.success) {
      emit('scheduled', { post, date: scheduleDate.value })
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

// Edit functions
const toggleEditMode = () => {
  if (selectedPost.value) {
    editedPostText.value = selectedPost.value.post_text || ''
    editedHashtags.value = [...(selectedPost.value.hashtags || [])]
    newHashtag.value = ''
  }
  isEditing.value = true
}

const cancelEdits = () => {
  isEditing.value = false
  newHashtag.value = ''
}

const addHashtag = () => {
  const tag = newHashtag.value.trim().replace(/^#/, '')
  if (tag && !editedHashtags.value.includes(`#${tag}`)) {
    editedHashtags.value.push(`#${tag}`)
  }
  newHashtag.value = ''
}

const removeHashtag = (index: number) => {
  editedHashtags.value.splice(index, 1)
}

const saveEdits = async () => {
  if (!selectedPost.value) return

  try {
    savingEdits.value = true
    const response = await api.updateFavorite(selectedPost.value.id, {
      post_text: editedPostText.value,
      hashtags: editedHashtags.value,
    })

    if (response.success) {
      // Update the local selected post with new values
      selectedPost.value = {
        ...selectedPost.value,
        post_text: editedPostText.value,
        hashtags: editedHashtags.value,
      }
      isEditing.value = false
    } else {
      alert(response.error || 'Failed to save changes')
    }
  } catch (error: any) {
    alert(error.message || 'Failed to save changes')
  } finally {
    savingEdits.value = false
  }
}

const handlePageChange = (page: number) => {
  currentPage.value = page
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

/* Progress Indicator */
.progress-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-lg);
  margin-bottom: var(--space-2xl);
  padding: var(--space-lg);
}

.step-dot {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--font-bold);
  font-size: var(--text-base);
  background: rgba(0, 0, 0, 0.4);
  border: 2px solid rgba(212, 175, 55, 0.3);
  color: var(--text-muted);
  transition: all 0.3s ease;
}

.step-dot.active {
  background: var(--gold-primary);
  border-color: var(--gold-primary);
  color: var(--text-on-gold);
  box-shadow: var(--glow-gold-sm);
}

.step-dot.completed {
  background: rgba(212, 175, 55, 0.2);
  border-color: var(--gold-primary);
  color: var(--gold-primary);
}

.step-line {
  flex: 1;
  height: 2px;
  background: rgba(212, 175, 55, 0.3);
  max-width: 100px;
}

/* Wizard Step Container */
.wizard-step {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
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

.posts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: var(--space-xl);
}

.post-item {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: var(--radius-lg);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
}

.post-item:hover {
  border-color: rgba(212, 175, 55, 0.5);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.post-item.selected {
  border: 2px solid var(--gold-primary);
  box-shadow: var(--glow-gold-md);
  transform: translateY(-2px);
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

.post-info {
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

/* Selection Check Indicator */
.selection-check {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60px;
  height: 60px;
  background: var(--gold-primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
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

/* Wizard Actions */
.wizard-actions {
  margin-top: var(--space-2xl);
  padding-top: var(--space-xl);
  border-top: 1px solid rgba(212, 175, 55, 0.2);
}

.wizard-actions.step-2-actions {
  display: flex;
  gap: var(--space-lg);
  justify-content: space-between;
}

/* Selected Post Preview (Step 2) */
.selected-post-preview {
  margin-bottom: var(--space-2xl);
  padding: var(--space-lg);
  background: rgba(0, 0, 0, 0.3);
  border-radius: var(--radius-lg);
  border: 1px solid rgba(212, 175, 55, 0.2);
}

.preview-title {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  color: var(--text-primary);
  margin: 0 0 var(--space-md) 0;
}

.preview-card {
  display: flex;
  gap: var(--space-lg);
  align-items: flex-start;
}

.preview-thumbnail {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: var(--radius-md);
  border: 1px solid rgba(212, 175, 55, 0.3);
}

.preview-text {
  flex: 1;
  color: var(--text-secondary);
  font-size: var(--text-sm);
  line-height: 1.5;
  margin: 0;
}

/* Preview Header */
.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-md);
}

.preview-header .preview-title {
  margin: 0;
}

/* Edit Section Styles */
.edit-section {
  margin-top: var(--space-lg);
  padding: var(--space-lg);
  background: rgba(0, 0, 0, 0.3);
  border-radius: var(--radius-lg);
  border: 1px solid rgba(212, 175, 55, 0.2);
  animation: fadeIn 0.3s ease;
}

.edit-field {
  margin-bottom: var(--space-lg);
}

.edit-field:last-of-type {
  margin-bottom: 0;
}

.edit-label {
  display: block;
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--space-sm);
}

.edit-textarea,
.edit-input {
  width: 100%;
  padding: var(--space-md);
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: var(--text-base);
  transition: all 0.2s ease;
  resize: vertical;
}

.edit-textarea:focus,
.edit-input:focus {
  outline: none;
  border-color: var(--gold-primary);
  background: rgba(0, 0, 0, 0.5);
}

/* Hashtag Editor */
.hashtag-editor {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  transition: all 0.2s ease;
}

.hashtag-editor:focus-within {
  border-color: var(--gold-primary);
  background: rgba(0, 0, 0, 0.5);
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

/* Edit Actions */
.edit-actions {
  display: flex;
  gap: var(--space-md);
  justify-content: flex-end;
  margin-top: var(--space-lg);
  padding-top: var(--space-md);
  border-top: 1px solid rgba(212, 175, 55, 0.1);
}

/* Responsive */
@media (max-width: 768px) {
  .modal-card {
    max-height: 95vh;
  }

  .schedule-settings {
    grid-template-columns: 1fr;
  }

  .posts-grid {
    grid-template-columns: 1fr;
  }
}
</style>

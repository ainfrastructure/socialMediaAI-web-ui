<template>
  <BaseModal
    :model-value="modelValue"
    size="xl"
    :title="currentStep === 1 ? 'Pick a Saved Post' : 'Schedule Your Post'"
    :show-close-button="true"
    card-variant="glass-intense"
    @update:model-value="(val: boolean) => !val && closeModal()"
    @close="closeModal"
  >
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
            <div v-else-if="filteredPosts.length === 0" class="empty-state">
              <p>No posts yet! Create a post first.</p>
              <BaseButton variant="primary" @click="goToCreatePost">
                Create Post
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
                      <span class="material-symbols-outlined">{{ post.content_type === 'image' ? 'photo_camera' : 'videocam' }}</span>
                    </span>

                    <!-- Platform Badge -->
                    <span v-if="post.platform" :class="['platform-badge', `platform-${post.platform}`]">
                      {{ post.platform }}
                    </span>

                    <!-- Selection Indicator -->
                    <div v-if="selectedPost?.id === post.id" class="selection-check">
                      <span class="material-symbols-outlined">check_circle</span>
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
                :total-items="filteredPosts.length"
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

            <!-- Schedule Settings Grid -->
            <div class="schedule-grid">
              <!-- Date Selection -->
              <div class="schedule-section date-section">
                <label class="form-label">
                  Date <span class="required">*</span>
                </label>
                <VueDatePicker
                  v-model="scheduleDate"
                  :min-date="today"
                  :enable-time-picker="false"
                  inline
                  auto-apply
                  dark
                  class="date-picker-inline"
                />
              </div>

              <!-- Time & Timezone Section -->
              <div class="schedule-section time-section">
                <div class="form-group">
                  <label class="form-label">
                    Time <span class="required">*</span>
                  </label>
                  <div class="time-picker-wrapper">
                    <MobileTimePicker
                      v-model="selectedTime"
                      :minutes-increment="1"
                    />
                  </div>
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

                <!-- Platform Selection -->
                <div class="form-group">
                  <label class="form-label">
                    Platform <span class="required">*</span>
                  </label>
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
                      </div>

                      <!-- Platform Info -->
                      <div class="platform-info">
                        <span class="platform-name">{{ platform.name }}</span>
                        <span v-if="platform.comingSoon" class="status coming-soon">
                          Coming Soon
                        </span>
                        <span v-else-if="!platform.isConnected" class="status not-connected">
                          Tap to connect
                        </span>
                      </div>

                      <!-- Connected indicator (green dot) or Selection Checkmark -->
                      <div v-if="selectedPlatforms.includes(platform.id)" class="platform-check">
                        <svg viewBox="0 0 24 24" fill="none" width="24" height="24">
                          <circle cx="12" cy="12" r="10" fill="var(--gold-primary)"/>
                          <path d="M9 12L11 14L15 10" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      </div>
                      <div v-else-if="platform.isConnected" class="connected-dot"></div>
                    </div>
                  </div>
                  <p v-if="selectedPlatforms.length === 0" class="platform-hint error">
                    <span class="material-symbols-outlined">warning</span>
                    Please select a platform to publish to
                  </p>
                </div>
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
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import BaseModal from './BaseModal.vue'
import BaseButton from './BaseButton.vue'
import BasePagination from './BasePagination.vue'
import { VueDatePicker } from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import MobileTimePicker from './MobileTimePicker.vue'
import { api } from '../services/api'
import { useScheduleTime } from '../composables/useScheduleTime'
import { useSocialAccounts } from '../composables/useSocialAccounts'
import { useFacebookStore } from '../stores/facebook'
import { useInstagramStore } from '../stores/instagram'
import { errorLog } from '@/utils/debug'

interface Props {
  modelValue: boolean
  selectedDate: string | null
  restaurantId?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'scheduled', data: { post: any; date: string }): void
}>()

const router = useRouter()
const route = useRoute()
const facebookStore = useFacebookStore()
const instagramStore = useInstagramStore()
const posts = ref<any[]>([])
const loading = ref(false)
const selectedPlatforms = ref<string[]>([])
const { platforms: socialPlatforms, isConnected } = useSocialAccounts()

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
    }
  ]
})

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
    const returnUrl = window.location.pathname + window.location.search
    try {
      if (platform.id === 'facebook') {
        await facebookStore.connectFacebook(returnUrl)
      } else if (platform.id === 'instagram') {
        await instagramStore.connectInstagram(returnUrl)
      }
      // The stores are reactive, so UI will update automatically after connection
    } catch (error) {
      errorLog('Failed to connect:', error)
    }
  }
}

function getPlatformIconStyle(platformId: string) {
  const platform = availablePlatforms.value.find(p => p.id === platformId)
  return {
    backgroundColor: platform?.bgColor || '#666'
  }
}
const selectedTime = ref<{ hours: number; minutes: number }>({ hours: 12, minutes: 0 })
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

// Schedule time utilities from composable
const { getDefaultTimezone } = useScheduleTime()
const defaultTimezone = getDefaultTimezone()
const timezone = ref(defaultTimezone)

// Initialize scheduleDate from prop or null
const initScheduleDate = (): Date | null => {
  if (props.selectedDate) {
    const [year, month, day] = props.selectedDate.split('-').map(Number)
    return new Date(year, month - 1, day, 12, 0, 0)
  }
  return null
}
const scheduleDate = ref<Date | null>(initScheduleDate())

// Filter posts by restaurant if restaurantId is provided
const filteredPosts = computed(() => {
  if (!props.restaurantId) return posts.value
  return posts.value.filter(post => post.restaurant_id === props.restaurantId)
})

// Pagination computed properties
const totalPages = computed(() => Math.ceil(filteredPosts.value.length / itemsPerPage))

const paginatedPosts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredPosts.value.slice(start, end)
})

const today = computed(() => {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return now
})

// Update scheduleDate when selectedDate prop changes
watch(() => props.selectedDate, (newDate) => {
  if (newDate) {
    const [year, month, day] = newDate.split('-').map(Number)
    scheduleDate.value = new Date(year, month - 1, day, 12, 0, 0)
  }
})

// Set default time to current time when modal opens
watch(() => props.modelValue, async (newValue) => {
  if (newValue) {
    // Set default time to current time
    const now = new Date()
    selectedTime.value = { hours: now.getHours(), minutes: now.getMinutes() }

    // Reset timezone to auto-detected
    timezone.value = defaultTimezone

    // Reset platform selection and pagination
    selectedPlatforms.value = []
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

  if (selectedPlatforms.value.length === 0) {
    alert('Please select at least one platform')
    return
  }

  // Format date as YYYY-MM-DD
  const year = scheduleDate.value.getFullYear()
  const month = String(scheduleDate.value.getMonth() + 1).padStart(2, '0')
  const day = String(scheduleDate.value.getDate()).padStart(2, '0')
  const formattedDate = `${year}-${month}-${day}`

  // Format time as HH:MM
  const hours = String(selectedTime.value.hours).padStart(2, '0')
  const minutes = String(selectedTime.value.minutes).padStart(2, '0')
  const formattedTime = `${hours}:${minutes}`

  try {
    const response = await api.schedulePost({
      favorite_post_id: post.id,
      scheduled_date: formattedDate,
      scheduled_time: formattedTime,
      timezone: timezone.value,
      platforms: selectedPlatforms.value,
    })

    if (response.success) {
      emit('scheduled', { post, date: formattedDate })
      closeModal()
    } else {
      alert(response.error || 'Failed to schedule post')
    }
  } catch (error: any) {

    alert(error.message || 'Failed to schedule post')
  }
}

const goToCreatePost = () => {
  const dateParam = props.selectedDate ? `?scheduleDate=${props.selectedDate}` : ''
  router.push(`/posts/create${dateParam}`)
  closeModal()
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
  background: rgba(15, 61, 46, 0.2);
  border: 2px solid rgba(15, 61, 46, 0.3);
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

/* Inline Date Picker Container */
.date-picker-inline {
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

/* Schedule Grid - side by side on desktop */
.schedule-grid {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--space-xl);
  margin-bottom: var(--space-xl);
}

.schedule-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.date-section {
  background: rgba(15, 61, 46, 0.15);
  border: 1px solid rgba(15, 61, 46, 0.2);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  align-self: start;
}

.time-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

/* Platform Grid & Cards */
.platform-grid {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.platform-card {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md);
  background: var(--bg-tertiary);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-base);
}

.platform-card:hover:not(.coming-soon) {
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
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.platform-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.platform-name {
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  font-size: var(--text-sm);
}

.platform-info .status {
  font-size: var(--text-xs);
}

.platform-info .status.connected {
  color: #4ade80;
}

.platform-info .status.coming-soon {
  color: var(--text-muted);
  font-style: italic;
}

.platform-info .status.not-connected {
  color: var(--gold-primary);
}

.platform-check {
  flex-shrink: 0;
}

.connected-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #4ade80;
  flex-shrink: 0;
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


.form-input,
.form-select {
  width: 100%;
  padding: var(--space-md);
  background: rgba(15, 61, 46, 0.2);
  border: 1px solid rgba(15, 61, 46, 0.3);
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
  background: rgba(15, 61, 46, 0.25);
}

.form-select option {
  background: var(--bg-secondary);
  color: var(--text-primary);
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
  background: rgba(15, 61, 46, 0.15);
  border: 1px solid rgba(15, 61, 46, 0.2);
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
  padding: 0.375rem;
  background: rgba(15, 61, 46, 0.4);
  backdrop-filter: blur(10px);
  border-radius: 6px;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.type-badge .material-symbols-outlined {
  font-size: 18px;
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
  color: var(--text-on-gold);
  box-shadow: var(--glow-gold-md);
  animation: scaleIn 0.3s ease;
}

.selection-check .material-symbols-outlined {
  font-size: 36px;
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
  background: rgba(15, 61, 46, 0.15);
  border-radius: var(--radius-lg);
  border: 1px solid rgba(15, 61, 46, 0.2);
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
  background: rgba(15, 61, 46, 0.15);
  border-radius: var(--radius-lg);
  border: 1px solid rgba(15, 61, 46, 0.2);
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
  background: rgba(15, 61, 46, 0.2);
  border: 1px solid rgba(15, 61, 46, 0.3);
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
  background: rgba(15, 61, 46, 0.25);
}

/* Hashtag Editor */
.hashtag-editor {
  background: rgba(15, 61, 46, 0.2);
  border: 1px solid rgba(15, 61, 46, 0.3);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  transition: all 0.2s ease;
}

.hashtag-editor:focus-within {
  border-color: var(--gold-primary);
  background: rgba(15, 61, 46, 0.25);
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
  .schedule-grid {
    grid-template-columns: 1fr;
  }

  .posts-grid {
    grid-template-columns: 1fr;
  }
}
</style>

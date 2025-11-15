<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal-overlay" @click.self="closeModal">
      <BaseCard variant="glass-intense" class="modal-card">
        <div class="modal-header">
          <h3 class="modal-title">Pick a Favorite Post</h3>
          <button class="close-btn" @click="closeModal">&times;</button>
        </div>

        <div class="modal-body">
          <div v-if="selectedDate" class="date-indicator">
            Scheduling for: <strong>{{ formatDate(selectedDate) }}</strong>
          </div>

          <!-- Time and Timezone Selection -->
          <div class="schedule-settings">
            <div class="form-group">
              <label for="scheduled_time" class="form-label">
                Time <span class="required">*</span>
              </label>
              <input
                id="scheduled_time"
                v-model="scheduledTime"
                type="time"
                class="form-input"
                required
              />
            </div>

            <div class="form-group">
              <label for="timezone" class="form-label">Timezone</label>
              <select id="timezone" v-model="timezone" class="form-select">
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern (ET)</option>
                <option value="America/Chicago">Central (CT)</option>
                <option value="America/Denver">Mountain (MT)</option>
                <option value="America/Los_Angeles">Pacific (PT)</option>
                <option value="Europe/London">London (GMT)</option>
                <option value="Europe/Paris">Paris (CET)</option>
              </select>
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
          <div v-else class="favorites-grid">
            <div
              v-for="favorite in favorites"
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
        </div>
      </BaseCard>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import BaseCard from './BaseCard.vue'
import BaseButton from './BaseButton.vue'
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
const timezone = ref('UTC')

// Set default time to current time when modal opens
watch(() => props.modelValue, async (newValue) => {
  if (newValue) {
    // Set default time to current time
    const now = new Date()
    scheduledTime.value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

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
  if (!props.selectedDate) {
    alert('No date selected')
    return
  }

  if (!scheduledTime.value) {
    alert('Please select a time')
    return
  }

  try {
    const response = await api.schedulePost({
      favorite_post_id: favorite.id,
      scheduled_date: props.selectedDate,
      scheduled_time: scheduledTime.value,
      timezone: timezone.value,
    })

    if (response.success) {
      emit('scheduled', { favorite, date: props.selectedDate })
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
  return new Date(dateString).toLocaleDateString('en-US', {
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

.date-indicator {
  text-align: center;
  padding: var(--space-md);
  background: rgba(212, 175, 55, 0.1);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-lg);
  color: var(--text-secondary);
  font-size: var(--text-sm);
}

.date-indicator strong {
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
}
</style>

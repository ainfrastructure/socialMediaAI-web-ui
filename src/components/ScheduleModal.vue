<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal-overlay" @click.self="closeModal">
      <BaseCard variant="glass-intense" class="modal-card">
        <div class="modal-header">
          <h3 class="modal-title">Schedule Post</h3>
          <button class="close-btn" @click="closeModal">&times;</button>
        </div>

        <div class="modal-body">
          <!-- Preview -->
          <div v-if="favoritePost" class="preview-section">
            <h4 class="section-title">Preview</h4>
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
                Date <span class="required">*</span>
              </label>
              <input
                id="scheduled_date"
                v-model="formData.scheduled_date"
                type="date"
                class="form-input"
                :min="today"
                required
              />
              <p v-if="preselectedDate" class="date-hint">
                📅 Date pre-filled from calendar selection
              </p>
            </div>

            <div class="form-group">
              <label for="scheduled_time" class="form-label">Time (Optional)</label>
              <input
                id="scheduled_time"
                v-model="formData.scheduled_time"
                type="time"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label for="timezone" class="form-label">Timezone</label>
              <select id="timezone" v-model="formData.timezone" class="form-select">
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern (ET)</option>
                <option value="America/Chicago">Central (CT)</option>
                <option value="America/Denver">Mountain (MT)</option>
                <option value="America/Los_Angeles">Pacific (PT)</option>
                <option value="Europe/London">London (GMT)</option>
                <option value="Europe/Paris">Paris (CET)</option>
              </select>
            </div>

            <div class="form-group">
              <label for="notes" class="form-label">Notes (Optional)</label>
              <textarea
                id="notes"
                v-model="formData.notes"
                class="form-textarea"
                rows="3"
                placeholder="Add any notes about this scheduled post..."
              ></textarea>
            </div>

            <BaseAlert v-if="error" type="error" class="form-alert">
              {{ error }}
            </BaseAlert>

            <div class="modal-actions">
              <BaseButton variant="ghost" type="button" @click="closeModal">
                Cancel
              </BaseButton>
              <BaseButton variant="primary" type="submit" :disabled="scheduling">
                {{ scheduling ? 'Scheduling...' : 'Schedule Post' }}
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
import BaseCard from './BaseCard.vue'
import BaseButton from './BaseButton.vue'
import BaseAlert from './BaseAlert.vue'
import { api } from '../services/api'

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

const formData = ref({
  scheduled_date: '',
  scheduled_time: '',
  timezone: 'UTC',
  notes: '',
})

const scheduling = ref(false)
const error = ref('')

const today = computed(() => {
  return new Date().toISOString().split('T')[0]
})

watch(() => props.modelValue, (newValue) => {
  console.log('ScheduleModal modelValue changed to:', newValue)
  if (newValue) {
    console.log('Modal opening, favorite post:', props.favoritePost)
    console.log('Preselected date:', props.preselectedDate)

    // Reset form when modal opens
    formData.value = {
      scheduled_date: props.preselectedDate || '',
      scheduled_time: '',
      timezone: 'UTC',
      notes: '',
    }
    error.value = ''
  }
})

const closeModal = () => {
  emit('update:modelValue', false)
}

const handleSchedule = async () => {
  console.log('handleSchedule called')
  console.log('favoritePost:', props.favoritePost)

  if (!props.favoritePost?.id) {
    error.value = 'No favorite post selected'
    console.error('No favorite post ID found')
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
    }

    console.log('Scheduling post with data:', scheduleData)

    const response = await api.schedulePost(scheduleData)

    console.log('Schedule response:', response)

    if (!response.success) {
      error.value = response.error || 'Failed to schedule post'
      return
    }

    emit('scheduled', response.data?.scheduled_post)
    closeModal()
  } catch (err: any) {
    console.error('Error scheduling post:', err)
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
  margin-top: var(--space-sm);
  font-size: var(--text-xs);
  color: var(--gold-primary);
  font-weight: 500;
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

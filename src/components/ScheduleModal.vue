<template>
  <BaseModal
    :model-value="modelValue"
    size="lg"
    :title="$t('scheduleModal.title')"
    :show-close-button="true"
    card-variant="glass-intense"
    @update:model-value="(val: boolean) => !val && closeModal()"
    @close="closeModal"
  >
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

    <!-- Notes -->
    <div class="form-group notes-section">
      <label for="notes" class="form-label">{{ $t('scheduleModal.notesLabel') }}</label>
      <textarea
        id="notes"
        v-model="formData.notes"
        class="form-textarea"
        rows="2"
        :placeholder="$t('scheduleModal.notesPlaceholder')"
      ></textarea>
    </div>

    <!-- Unified Schedule Component -->
    <UnifiedSchedulePost
      :disabled="scheduling"
      :force-schedule-mode="true"
      :show-cancel-button="true"
      :initial-platforms="initialPlatforms"
      @publish="handleUnifiedPublish"
      @cancel="closeModal"
    />

    <BaseAlert v-if="error" type="error" class="form-alert">
      {{ error }}
    </BaseAlert>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import BaseModal from './BaseModal.vue'
import BaseAlert from './BaseAlert.vue'
import UnifiedSchedulePost from './UnifiedSchedulePost.vue'
import { api } from '../services/api'
import { useSocialAccounts } from '../composables/useSocialAccounts'

const { t } = useI18n()

const router = useRouter()

// Social accounts composable
const { isConnected } = useSocialAccounts()

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
  notes: '',
})

const scheduling = ref(false)
const error = ref('')

// Compute initial platforms from favoritePost
const initialPlatforms = computed(() => {
  if (props.favoritePost?.platform && isConnected(props.favoritePost.platform)) {
    return [props.favoritePost.platform]
  }
  return []
})

watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    // Reset form when modal opens
    formData.value = {
      notes: '',
    }
    error.value = ''
  }
})

const closeModal = () => {
  emit('update:modelValue', false)
}

const handleUnifiedPublish = async (data: {
  platforms: string[]
  publishType: 'now' | 'schedule'
  scheduledDate?: string
  scheduledTime?: string
  timezone?: string
}) => {
  if (!props.favoritePost?.id) {
    error.value = 'No favorite post selected'
    return
  }

  if (data.platforms.length === 0) {
    error.value = 'Please select at least one platform'
    return
  }

  try {
    scheduling.value = true
    error.value = ''

    // Single API call with all selected platforms
    const scheduleData = {
      favorite_post_id: props.favoritePost.id,
      scheduled_date: data.scheduledDate,
      scheduled_time: data.scheduledTime || undefined,
      timezone: data.timezone,
      notes: formData.value.notes || undefined,
      platforms: data.platforms,
    }

    const response = await api.schedulePost(scheduleData)

    if (response.success) {
      emit('scheduled', { success: true })
      closeModal()
      router.push('/scheduler')
    } else {
      error.value = response.error || 'Failed to schedule post'
    }

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

.notes-section {
  margin-bottom: var(--space-lg);
  padding-bottom: var(--space-lg);
  border-bottom: 1px solid rgba(212, 175, 55, 0.2);
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

/* Platform Grid */
.platform-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--space-md);
  margin-bottom: var(--space-md);
}

/* Platform Card */
.platform-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-lg);
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid rgba(212, 175, 55, 0.2);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-base);
}

.platform-card:hover:not(.disabled) {
  border-color: rgba(212, 175, 55, 0.4);
  background: rgba(0, 0, 0, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.platform-card.selected {
  border-color: var(--gold-primary);
  background: rgba(212, 175, 55, 0.15);
  box-shadow: 0 0 20px rgba(212, 175, 55, 0.2);
}

.platform-card.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: rgba(0, 0, 0, 0.2);
}

.platform-card.coming-soon {
  opacity: 0.6;
}

/* Platform Icon */
.platform-card-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

/* Platform Content */
.platform-card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  min-width: 0;
}

.platform-name {
  font-family: var(--font-heading);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
}

.connection-status.connected {
  color: var(--gold-primary);
}

.connection-status.not-connected {
  color: var(--text-muted);
}

.connection-status.coming-soon {
  color: #f59e0b;
}

.checkmark-icon {
  width: 14px;
  height: 14px;
}

.account-count {
  color: var(--text-secondary);
  font-size: var(--text-xs);
}

/* Selection Indicator */
.selection-indicator {
  position: absolute;
  top: var(--space-sm);
  right: var(--space-sm);
  width: 24px;
  height: 24px;
  animation: scaleIn 0.2s ease;
}

@keyframes scaleIn {
  from {
    transform: scale(0);
  }
  to {
    transform: scale(1);
  }
}

.selection-indicator svg {
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

/* Responsive */
@media (max-width: 768px) {
  .preview-media {
    max-height: 200px;
  }

  .platform-grid {
    grid-template-columns: 1fr;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .platform-card,
  .selection-indicator {
    animation: none !important;
    transition: none !important;
  }
}
</style>

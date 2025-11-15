<template>
  <div v-if="show" class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <button class="modal-close" @click="$emit('close')">×</button>

      <h2 class="modal-title">Edit Restaurant</h2>

      <div class="modal-form">
        <div class="form-group">
          <label for="website" class="form-label">Website</label>
          <input
            id="website"
            v-model="editedData.website"
            type="url"
            class="form-input"
            placeholder="https://example.com"
          />
        </div>

        <div class="form-group">
          <label class="form-label">Opening Hours</label>
          <div class="hours-list">
            <div v-for="(day, index) in editedData.opening_hours" :key="index" class="hours-item">
              <input
                v-model="editedData.opening_hours[index]"
                type="text"
                class="form-input hours-input"
                placeholder="Monday: 9:00 AM – 5:00 PM"
              />
              <button class="remove-btn" @click="editedData.opening_hours.splice(index, 1)" type="button" title="Remove">
                ✕
              </button>
            </div>
          </div>
          <button class="add-btn" @click="editedData.opening_hours.push('')" type="button">
            ➕ Add Day
          </button>
        </div>

        <div class="form-group">
          <label class="form-label">Social Media</label>
          <div class="social-grid">
            <div class="social-item">
              <label class="social-label">📘 Facebook</label>
              <input
                v-model="editedData.social_media.facebook"
                type="url"
                class="form-input"
                placeholder="Facebook URL"
              />
            </div>
            <div class="social-item">
              <label class="social-label">📸 Instagram</label>
              <input
                v-model="editedData.social_media.instagram"
                type="url"
                class="form-input"
                placeholder="Instagram URL"
              />
            </div>
            <div class="social-item">
              <label class="social-label">🐦 Twitter</label>
              <input
                v-model="editedData.social_media.twitter"
                type="url"
                class="form-input"
                placeholder="Twitter URL"
              />
            </div>
            <div class="social-item">
              <label class="social-label">🎵 TikTok</label>
              <input
                v-model="editedData.social_media.tiktok"
                type="url"
                class="form-input"
                placeholder="TikTok URL"
              />
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button class="btn-cancel" @click="$emit('close')">
            Cancel
          </button>
          <button class="btn-save" @click="handleSave" :disabled="saving">
            {{ saving ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { restaurantService } from '../services/restaurantService'

interface Props {
  show: boolean
  restaurant: any
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'updated'): void
}>()

const editedData = ref({
  website: '',
  opening_hours: [] as string[],
  social_media: {
    facebook: '',
    instagram: '',
    twitter: '',
    tiktok: ''
  }
})

const saving = ref(false)

watch(() => props.restaurant, (newRestaurant) => {
  if (newRestaurant) {
    editedData.value = {
      website: newRestaurant.website || '',
      opening_hours: newRestaurant.opening_hours?.weekday_text
        ? [...newRestaurant.opening_hours.weekday_text]
        : [],
      social_media: {
        facebook: newRestaurant.social_media?.facebook || '',
        instagram: newRestaurant.social_media?.instagram || '',
        twitter: newRestaurant.social_media?.twitter || '',
        tiktok: newRestaurant.social_media?.tiktok || ''
      }
    }
  }
}, { immediate: true })

const handleSave = async () => {
  try {
    saving.value = true
    await restaurantService.updateRestaurant(props.restaurant.place_id, {
      website: editedData.value.website,
      opening_hours: {
        weekday_text: editedData.value.opening_hours
      },
      social_media: editedData.value.social_media
    })
    emit('updated')
    emit('close')
  } catch (error) {
    console.error('Error updating restaurant:', error)
    alert('Failed to update restaurant')
  } finally {
    saving.value = false
  }
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
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: var(--bg-secondary);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: var(--radius-lg);
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  padding: 2rem;
  position: relative;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  font-size: 1.5rem;
  color: var(--text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.modal-close:hover {
  background: rgba(255, 0, 0, 0.2);
  border-color: rgba(255, 0, 0, 0.5);
  transform: rotate(90deg);
}

.modal-title {
  font-family: var(--font-heading);
  font-size: var(--text-3xl);
  font-weight: 700;
  margin: 0 0 2rem 0;
  background: var(--gradient-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-label {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.form-input {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 0.875rem 1rem;
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--text-primary);
  transition: all 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--gold-primary);
  box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1);
}

.form-input::placeholder {
  color: var(--text-muted);
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-color);
}

.btn-cancel,
.btn-save {
  padding: 0.875rem 1.5rem;
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-size: var(--text-base);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.btn-cancel {
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
}

.btn-cancel:hover {
  background: var(--bg-elevated);
  color: var(--text-primary);
}

.btn-save {
  background: var(--gradient-gold);
  color: var(--text-on-gold);
}

.btn-save:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(212, 175, 55, 0.4);
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* Opening Hours */
.hours-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.hours-item {
  display: flex;
  gap: var(--space-sm);
  align-items: center;
}

.hours-input {
  flex: 1;
}

.remove-btn {
  background: transparent;
  border: 1px solid rgba(255, 59, 48, 0.3);
  color: #ff3b30;
  border-radius: var(--radius-md);
  padding: 0.875rem;
  width: 40px;
  height: 40px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-base);
}

.remove-btn:hover {
  background: rgba(255, 59, 48, 0.1);
  border-color: #ff3b30;
}

.add-btn {
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  border-radius: var(--radius-md);
  padding: 0.875rem 1rem;
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: var(--space-sm);
}

.add-btn:hover {
  background: var(--bg-elevated);
  border-color: var(--gold-primary);
  color: var(--gold-primary);
}

/* Social Media */
.social-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-lg);
}

.social-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.social-label {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

@media (max-width: 640px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;
  }

  .social-grid {
    grid-template-columns: 1fr;
  }

  .hours-item {
    flex-direction: column;
  }

  .hours-input {
    width: 100%;
  }

  .remove-btn {
    width: 100%;
  }
}
</style>

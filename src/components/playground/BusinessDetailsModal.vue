<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import BaseButton from '../BaseButton.vue'
import BaseAlert from '../BaseAlert.vue'
import BaseModal from '../BaseModal.vue'
import { businessService, type SavedBusiness } from '../../services/businessService'

const props = defineProps<{
  modelValue: boolean
  business: SavedBusiness | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'updated', business: SavedBusiness): void
  (e: 'deleted', businessId: string): void
}>()

// Edit state
const editingWebsite = ref(false)
const editedWebsite = ref('')
const editingHours = ref(false)
const editedHours = ref<string[]>([])
const editingSocial = ref(false)
const editedSocial = ref({
  facebook: '',
  instagram: '',
  twitter: '',
  youtube: '',
  tiktok: ''
})
const saving = ref(false)
const saveError = ref<string | null>(null)
const deleting = ref(false)
const confirmDelete = ref(false)

// Menu pagination
const menuCurrentPage = ref(1)
const menuItemsPerPage = 12

const close = () => {
  emit('update:modelValue', false)
}

// Reset state when modal opens/closes
watch(() => props.modelValue, (isOpen) => {
  if (!isOpen) {
    resetEditState()
  }
})

const resetEditState = () => {
  editingWebsite.value = false
  editedWebsite.value = ''
  editingHours.value = false
  editedHours.value = []
  editingSocial.value = false
  editedSocial.value = {
    facebook: '',
    instagram: '',
    twitter: '',
    youtube: '',
    tiktok: ''
  }
  saveError.value = null
  menuCurrentPage.value = 1
  confirmDelete.value = false
}

// Delete business
const deleteBusiness = async () => {
  if (!props.business) return

  try {
    deleting.value = true
    saveError.value = null

    const success = await businessService.deleteBusiness(props.business.place_id)

    if (success) {
      emit('deleted', props.business.id)
      close()
    } else {
      saveError.value = 'Failed to delete business'
    }
  } catch (err: any) {
    saveError.value = err.message || 'Failed to delete business'
  } finally {
    deleting.value = false
  }
}

// Website editing
const startEditWebsite = () => {
  editingWebsite.value = true
  editedWebsite.value = props.business?.website || ''
}

const cancelEditWebsite = () => {
  editingWebsite.value = false
  editedWebsite.value = ''
  saveError.value = null
}

const saveWebsite = async () => {
  if (!props.business) return

  try {
    saving.value = true
    saveError.value = null

    const response = await businessService.updateBusiness(props.business.place_id, {
      website: editedWebsite.value || null
    })

    if (response.success && response.data) {
      emit('updated', response.data)
      editingWebsite.value = false
      editedWebsite.value = ''
    } else {
      saveError.value = response.error || 'Failed to save website'
    }
  } catch (err: any) {
    saveError.value = err.message || 'Failed to save website'
  } finally {
    saving.value = false
  }
}

// Opening hours editing
const startEditHours = () => {
  editingHours.value = true
  editedHours.value = props.business?.opening_hours?.weekday_text
    ? [...props.business.opening_hours.weekday_text]
    : []
}

const cancelEditHours = () => {
  editingHours.value = false
  editedHours.value = []
  saveError.value = null
}

const saveHours = async () => {
  if (!props.business) return

  try {
    saving.value = true
    saveError.value = null

    const response = await businessService.updateBusiness(props.business.place_id, {
      opening_hours: {
        weekday_text: editedHours.value.filter(h => h.trim() !== '')
      }
    })

    if (response.success && response.data) {
      emit('updated', response.data)
      editingHours.value = false
      editedHours.value = []
    } else {
      saveError.value = response.error || 'Failed to save opening hours'
    }
  } catch (err: any) {
    saveError.value = err.message || 'Failed to save opening hours'
  } finally {
    saving.value = false
  }
}

// Social media editing
const startEditSocial = () => {
  editingSocial.value = true
  editedSocial.value = {
    facebook: props.business?.social_media?.facebook || '',
    instagram: props.business?.social_media?.instagram || '',
    twitter: props.business?.social_media?.twitter || '',
    youtube: props.business?.social_media?.youtube || '',
    tiktok: props.business?.social_media?.tiktok || ''
  }
}

const cancelEditSocial = () => {
  editingSocial.value = false
  editedSocial.value = {
    facebook: '',
    instagram: '',
    twitter: '',
    youtube: '',
    tiktok: ''
  }
  saveError.value = null
}

const saveSocial = async () => {
  if (!props.business) return

  try {
    saving.value = true
    saveError.value = null

    const response = await businessService.updateBusiness(props.business.place_id, {
      social_media: editedSocial.value
    })

    if (response.success && response.data) {
      emit('updated', response.data)
      editingSocial.value = false
      editedSocial.value = {
        facebook: '',
        instagram: '',
        twitter: '',
        youtube: '',
        tiktok: ''
      }
    } else {
      saveError.value = response.error || 'Failed to save social media'
    }
  } catch (err: any) {
    saveError.value = err.message || 'Failed to save social media'
  } finally {
    saving.value = false
  }
}

const hasSocialMedia = (socialMedia: any): boolean => {
  if (!socialMedia) return false
  return !!(socialMedia.facebook || socialMedia.instagram || socialMedia.twitter || socialMedia.youtube || socialMedia.tiktok)
}

// Menu pagination
const paginatedMenuItems = computed(() => {
  if (!props.business?.menu?.items) return []
  const items = props.business.menu.items
  const start = (menuCurrentPage.value - 1) * menuItemsPerPage
  const end = start + menuItemsPerPage
  return items.slice(start, end)
})

const totalMenuPages = computed(() => {
  if (!props.business?.menu?.items) return 0
  return Math.ceil(props.business.menu.items.length / menuItemsPerPage)
})

const goToMenuPage = (page: number) => {
  menuCurrentPage.value = page
}
</script>

<template>
  <BaseModal :model-value="modelValue" size="lg" @update:model-value="$emit('update:modelValue', $event)">
    <template v-if="business">
      <div class="details-header">
        <h2 class="details-title">{{ business.name }}</h2>
      </div>

      <BaseAlert v-if="saveError" type="error" class="save-alert">
        {{ saveError }}
      </BaseAlert>

      <div class="details-body">
        <!-- Basic Info -->
        <section class="details-section">
          <div class="section-header">
            <h3 class="section-title">Information</h3>
          </div>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Address</span>
              <span class="info-value">{{ business.address }}</span>
            </div>

            <div v-if="business.phone_number" class="info-item">
              <span class="info-label">Phone</span>
              <span class="info-value">{{ business.phone_number }}</span>
            </div>

            <div class="info-item">
              <span class="info-label">Website</span>
              <div class="editable-field">
                <input
                  v-if="editingWebsite"
                  v-model="editedWebsite"
                  type="url"
                  class="edit-input"
                  placeholder="https://example.com"
                />
                <a v-else-if="business.website" :href="business.website" target="_blank" class="info-link">
                  {{ business.website }}
                </a>
                <span v-else class="info-value empty">Not set</span>

                <div class="field-actions">
                  <button v-if="!editingWebsite" class="edit-field-btn" @click="startEditWebsite" title="Edit website">
                    ✏️
                  </button>
                  <template v-else>
                    <BaseButton variant="primary" size="small" @click="saveWebsite" :disabled="saving">
                      {{ saving ? '...' : '💾' }}
                    </BaseButton>
                    <BaseButton variant="ghost" size="small" @click="cancelEditWebsite">
                      ✕
                    </BaseButton>
                  </template>
                </div>
              </div>
            </div>

            <div v-if="business.rating" class="info-item">
              <span class="info-label">Rating</span>
              <span class="info-value">
                ⭐ {{ business.rating }} / 5
                <span v-if="business.user_ratings_total" class="rating-count">
                  ({{ business.user_ratings_total }} reviews)
                </span>
              </span>
            </div>
          </div>
        </section>

        <!-- Brand DNA -->
        <section v-if="business.brand_dna" class="details-section">
          <h3 class="section-title">Brand Identity</h3>

          <!-- Brand Name -->
          <div v-if="business.brand_dna.brand_name" class="brand-item">
            <span class="brand-label">Brand Name</span>
            <span class="brand-value brand-name-text">{{ business.brand_dna.brand_name }}</span>
          </div>

          <!-- Logo -->
          <div v-if="business.brand_dna.logo_url" class="brand-item logo-item">
            <span class="brand-label">Logo</span>
            <div class="logo-container">
              <img
                :src="business.brand_dna.logo_url"
                :alt="business.brand_dna.brand_name || 'Logo'"
                class="brand-logo"
              />
            </div>
          </div>

          <!-- Brand Colors -->
          <div class="brand-item colors-item">
            <span class="brand-label">Brand Colors</span>
            <div class="colors-display">
              <div v-if="business.brand_dna.primary_color" class="color-box">
                <div class="color-swatch-small" :style="{ backgroundColor: business.brand_dna.primary_color }"></div>
                <div class="color-details">
                  <span class="color-name">Primary</span>
                  <span class="color-code">{{ business.brand_dna.primary_color }}</span>
                </div>
              </div>
              <div v-if="business.brand_dna.secondary_color" class="color-box">
                <div class="color-swatch-small" :style="{ backgroundColor: business.brand_dna.secondary_color }"></div>
                <div class="color-details">
                  <span class="color-name">Secondary</span>
                  <span class="color-code">{{ business.brand_dna.secondary_color }}</span>
                </div>
              </div>
              <div
                v-for="(color, index) in business.brand_dna.additional_colors"
                :key="index"
                class="color-box"
              >
                <div class="color-swatch-small" :style="{ backgroundColor: color }"></div>
                <div class="color-details">
                  <span class="color-name">Accent {{ index + 1 }}</span>
                  <span class="color-code">{{ color }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Font Style -->
          <div v-if="business.brand_dna.font_style" class="brand-item">
            <span class="brand-label">Typography</span>
            <span class="brand-value font-badge-small">{{ business.brand_dna.font_style }}</span>
          </div>
        </section>

        <!-- Opening Hours -->
        <section v-if="business.opening_hours || editingHours" class="details-section">
          <div class="section-header">
            <h3 class="section-title">Opening Hours</h3>
            <button v-if="!editingHours" class="edit-section-btn" @click="startEditHours" title="Edit opening hours">
              ✏️ Edit
            </button>
            <div v-else class="section-actions">
              <BaseButton variant="primary" size="small" @click="saveHours" :disabled="saving">
                {{ saving ? 'Saving...' : '💾 Save' }}
              </BaseButton>
              <BaseButton variant="ghost" size="small" @click="cancelEditHours">
                Cancel
              </BaseButton>
            </div>
          </div>

          <div v-if="business.opening_hours?.open_now !== undefined && !editingHours" class="status-badge" :class="{ 'open': business.opening_hours.open_now }">
            {{ business.opening_hours.open_now ? '🟢 Open Now' : '🔴 Closed' }}
          </div>

          <!-- Edit Mode -->
          <div v-if="editingHours" class="hours-edit-list">
            <div v-for="(day, index) in editedHours" :key="index" class="hours-edit-item">
              <input
                v-model="editedHours[index]"
                type="text"
                class="edit-input hours-input"
                placeholder="Monday: 9:00 AM – 5:00 PM"
              />
              <button class="remove-day-btn" @click="editedHours.splice(index, 1)" title="Remove day">
                ✕
              </button>
            </div>
            <BaseButton variant="ghost" size="small" @click="editedHours.push('')">
              ➕ Add Day
            </BaseButton>
          </div>

          <!-- View Mode -->
          <div v-else-if="business.opening_hours?.weekday_text" class="hours-list">
            <div v-for="(day, index) in business.opening_hours.weekday_text" :key="index" class="hours-item">
              {{ day }}
            </div>
          </div>
        </section>

        <!-- Social Media -->
        <section v-if="(business.social_media && hasSocialMedia(business.social_media)) || editingSocial" class="details-section">
          <div class="section-header">
            <h3 class="section-title">Social Media</h3>
            <button v-if="!editingSocial" class="edit-section-btn" @click="startEditSocial" title="Edit social media">
              ✏️ Edit
            </button>
            <div v-else class="section-actions">
              <BaseButton variant="primary" size="small" @click="saveSocial" :disabled="saving">
                {{ saving ? 'Saving...' : '💾 Save' }}
              </BaseButton>
              <BaseButton variant="ghost" size="small" @click="cancelEditSocial">
                Cancel
              </BaseButton>
            </div>
          </div>

          <!-- Edit Mode -->
          <div v-if="editingSocial" class="social-edit-grid">
            <div class="social-edit-item">
              <label class="social-label">
                <span class="social-icon facebook-icon">📘</span>
                Facebook
              </label>
              <input
                v-model="editedSocial.facebook"
                type="url"
                class="edit-input"
                placeholder="https://facebook.com/..."
              />
            </div>

            <div class="social-edit-item">
              <label class="social-label">
                <span class="social-icon instagram-icon">📷</span>
                Instagram
              </label>
              <input
                v-model="editedSocial.instagram"
                type="url"
                class="edit-input"
                placeholder="https://instagram.com/..."
              />
            </div>

            <div class="social-edit-item">
              <label class="social-label">
                <span class="social-icon twitter-icon">🐦</span>
                Twitter/X
              </label>
              <input
                v-model="editedSocial.twitter"
                type="url"
                class="edit-input"
                placeholder="https://twitter.com/..."
              />
            </div>

            <div class="social-edit-item">
              <label class="social-label">
                <span class="social-icon youtube-icon">📺</span>
                YouTube
              </label>
              <input
                v-model="editedSocial.youtube"
                type="url"
                class="edit-input"
                placeholder="https://youtube.com/..."
              />
            </div>

            <div class="social-edit-item">
              <label class="social-label">
                <span class="social-icon tiktok-icon">🎵</span>
                TikTok
              </label>
              <input
                v-model="editedSocial.tiktok"
                type="url"
                class="edit-input"
                placeholder="https://tiktok.com/..."
              />
            </div>
          </div>

          <!-- View Mode -->
          <div v-else class="social-links">
            <a v-if="business.social_media?.facebook" :href="business.social_media.facebook" target="_blank" class="social-link facebook">
              Facebook
            </a>
            <a v-if="business.social_media?.instagram" :href="business.social_media.instagram" target="_blank" class="social-link instagram">
              Instagram
            </a>
            <a v-if="business.social_media?.twitter" :href="business.social_media.twitter" target="_blank" class="social-link twitter">
              Twitter/X
            </a>
            <a v-if="business.social_media?.youtube" :href="business.social_media.youtube" target="_blank" class="social-link youtube">
              YouTube
            </a>
            <a v-if="business.social_media?.tiktok" :href="business.social_media.tiktok" target="_blank" class="social-link tiktok">
              TikTok
            </a>
          </div>
        </section>

        <!-- Menu -->
        <section v-if="business.menu && business.menu.items && business.menu.items.length > 0" class="details-section">
          <h3 class="section-title">
            Menu ({{ business.menu.items.length }} items)
            <span v-if="business.menu.platform" class="platform-badge">
              {{ business.menu.platform.toUpperCase() }}
            </span>
          </h3>
          <div class="menu-grid">
            <div v-for="(item, index) in paginatedMenuItems" :key="index" class="menu-item">
              <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.name" class="menu-image" />
              <div class="menu-item-content">
                <h4 class="menu-item-name">{{ item.name }}</h4>
                <p v-if="item.description" class="menu-item-description">{{ item.description }}</p>
                <p class="menu-item-price">{{ item.price }}</p>
              </div>
            </div>
          </div>

          <!-- Menu Pagination -->
          <div v-if="totalMenuPages > 1" class="pagination">
            <button
              class="pagination-btn"
              :disabled="menuCurrentPage === 1"
              @click="goToMenuPage(menuCurrentPage - 1)"
            >
              ← Previous
            </button>

            <div class="pagination-numbers">
              <button
                v-for="page in totalMenuPages"
                :key="page"
                class="pagination-number"
                :class="{ active: menuCurrentPage === page }"
                @click="goToMenuPage(page)"
              >
                {{ page }}
              </button>
            </div>

            <button
              class="pagination-btn"
              :disabled="menuCurrentPage === totalMenuPages"
              @click="goToMenuPage(menuCurrentPage + 1)"
            >
              Next →
            </button>
          </div>
        </section>

        <!-- Delete Business Section -->
        <section class="details-section delete-section">
          <h3 class="section-title danger">Delete Business</h3>
          <p class="delete-warning">
            This will permanently delete this business and all associated data, including images and menu items. This action cannot be undone.
          </p>

          <div v-if="!confirmDelete" class="delete-actions">
            <BaseButton variant="danger" size="medium" @click="confirmDelete = true">
              Delete Business
            </BaseButton>
          </div>

          <div v-else class="delete-confirm">
            <p class="confirm-text">Are you sure? This cannot be undone.</p>
            <div class="confirm-actions">
              <BaseButton variant="danger" size="medium" @click="deleteBusiness" :disabled="deleting">
                {{ deleting ? 'Deleting...' : 'Yes, Delete' }}
              </BaseButton>
              <BaseButton variant="ghost" size="medium" @click="confirmDelete = false" :disabled="deleting">
                Cancel
              </BaseButton>
            </div>
          </div>
        </section>
      </div>
    </template>
  </BaseModal>
</template>

<style scoped>
.details-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid rgba(15, 61, 46, 0.1);
}

.details-title {
  font-family: var(--font-heading);
  font-size: 2rem;
  color: var(--gold-primary);
  margin: 0;
  flex: 1;
}

.save-alert {
  margin-bottom: 1rem;
}

.details-body {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.details-section {
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(15, 61, 46, 0.05);
  border-radius: 12px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  gap: 1rem;
}

.section-title {
  font-family: var(--font-heading);
  font-size: 1.25rem;
  color: var(--gold-primary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.section-title.danger {
  color: #ef4444;
}

.edit-section-btn {
  padding: 0.5rem 1rem;
  background: rgba(15, 61, 46, 0.05);
  border: 1px solid rgba(15, 61, 46, 0.15);
  border-radius: 6px;
  color: var(--gold-primary);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.edit-section-btn:hover {
  background: rgba(15, 61, 46, 0.1);
  border-color: var(--gold-primary);
  transform: translateY(-1px);
}

.section-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.edit-field-btn {
  padding: 0.375rem 0.75rem;
  background: rgba(15, 61, 46, 0.05);
  border: 1px solid rgba(15, 61, 46, 0.15);
  border-radius: 6px;
  color: var(--gold-primary);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-left: 0.5rem;
}

.edit-field-btn:hover {
  background: rgba(15, 61, 46, 0.1);
  border-color: var(--gold-primary);
}

.editable-field {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.field-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-shrink: 0;
}

.info-grid {
  display: grid;
  gap: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
}

.info-value {
  font-size: 1rem;
  color: var(--text-primary);
}

.info-link {
  color: var(--gold-primary);
  text-decoration: none;
  transition: color 0.2s ease;
  word-break: break-all;
}

.info-link:hover {
  color: var(--text-primary);
  text-decoration: underline;
}

.info-value.empty {
  color: var(--text-muted);
  font-style: italic;
}

.rating-count {
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-weight: normal;
}

.edit-input {
  width: 100%;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(15, 61, 46, 0.15);
  border-radius: 8px;
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.edit-input:focus {
  outline: none;
  border-color: var(--gold-primary);
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 0 0 3px rgba(15, 61, 46, 0.05);
}

.edit-input::placeholder {
  color: var(--text-muted);
}

/* Brand DNA Styles */
.brand-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.brand-item:last-child {
  margin-bottom: 0;
}

.brand-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
}

.brand-value {
  font-size: 1rem;
  color: var(--text-primary);
}

.brand-name-text {
  font-family: var(--font-heading);
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--gold-primary);
}

.logo-item {
  align-items: flex-start;
}

.logo-container {
  width: 100%;
  max-width: 300px;
  padding: 1.5rem;
  background: rgba(15, 61, 46, 0.025);
  border: 1px solid rgba(15, 61, 46, 0.1);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-logo {
  max-width: 100%;
  max-height: 120px;
  width: auto;
  height: auto;
  object-fit: contain;
}

.colors-item {
  align-items: flex-start;
}

.colors-display {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  width: 100%;
}

.color-box {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(15, 61, 46, 0.08);
  border-radius: 8px;
  min-width: 150px;
}

.color-swatch-small {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 2px solid rgba(15, 61, 46, 0.1);
  flex-shrink: 0;
}

.color-details {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.color-name {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.color-code {
  font-size: 0.875rem;
  color: var(--text-primary);
  font-family: monospace;
}

.font-badge-small {
  display: inline-block;
  padding: 0.5rem 1rem;
  background: rgba(15, 61, 46, 0.05);
  border: 1px solid rgba(15, 61, 46, 0.15);
  border-radius: 6px;
  font-size: 0.875rem;
  text-transform: capitalize;
}

/* Hours */
.status-badge {
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 1rem;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444;
}

.status-badge.open {
  background: rgba(34, 197, 94, 0.15);
  border: 1px solid rgba(34, 197, 94, 0.3);
  color: #22c55e;
}

.hours-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.hours-item {
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(15, 61, 46, 0.025);
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.hours-item:last-child {
  border-bottom: none;
}

.hours-edit-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.hours-edit-item {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.hours-input {
  flex: 1;
}

.remove-day-btn {
  padding: 0.5rem 0.75rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 6px;
  color: #ef4444;
  cursor: pointer;
  transition: all 0.2s ease;
}

.remove-day-btn:hover {
  background: rgba(239, 68, 68, 0.2);
}

/* Social Media */
.social-edit-grid {
  display: grid;
  gap: 1rem;
}

.social-edit-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.social-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.social-links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.social-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(15, 61, 46, 0.025);
  border: 1px solid rgba(15, 61, 46, 0.05);
  border-radius: 20px;
  color: var(--text-primary);
  text-decoration: none;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.social-link:hover {
  background: rgba(15, 61, 46, 0.05);
  border-color: rgba(15, 61, 46, 0.15);
  color: var(--gold-primary);
}

/* Menu */
.menu-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.menu-item {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(15, 61, 46, 0.05);
  border-radius: 10px;
  overflow: hidden;
}

.menu-image {
  width: 100%;
  height: 120px;
  object-fit: cover;
}

.menu-item-content {
  padding: 0.75rem;
}

.menu-item-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.25rem 0;
}

.menu-item-description {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin: 0 0 0.5rem 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.menu-item-price {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--gold-primary);
  margin: 0;
}

.platform-badge {
  font-size: 0.625rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  background: rgba(15, 61, 46, 0.08);
  border: 1px solid rgba(15, 61, 46, 0.15);
  border-radius: 4px;
  color: var(--gold-primary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(15, 61, 46, 0.05);
}

.pagination-btn {
  padding: 0.5rem 1rem;
  background: rgba(15, 61, 46, 0.05);
  border: 1px solid rgba(15, 61, 46, 0.15);
  border-radius: 6px;
  color: var(--gold-primary);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-btn:not(:disabled):hover {
  background: rgba(15, 61, 46, 0.1);
}

.pagination-numbers {
  display: flex;
  gap: 0.5rem;
}

.pagination-number {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid rgba(15, 61, 46, 0.15);
  border-radius: 6px;
  color: var(--text-secondary);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.pagination-number:hover {
  background: rgba(15, 61, 46, 0.05);
  color: var(--gold-primary);
}

.pagination-number.active {
  background: var(--gold-primary);
  border-color: var(--gold-primary);
  color: var(--text-on-gold);
}

/* Delete Section */
.delete-section {
  border-color: rgba(239, 68, 68, 0.2);
}

.delete-warning {
  color: var(--text-secondary);
  font-size: 0.875rem;
  margin: 0.5rem 0 1rem;
  line-height: 1.5;
}

.delete-actions {
  margin-top: 1rem;
}

.delete-confirm {
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
}

.confirm-text {
  color: #ef4444;
  font-weight: 500;
  margin: 0 0 1rem;
}

.confirm-actions {
  display: flex;
  gap: 0.75rem;
}

/* Responsive */
@media (max-width: 768px) {
  .details-title {
    font-size: 1.5rem;
  }

  .menu-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }

  .pagination {
    flex-direction: column;
    gap: 0.75rem;
  }
}
</style>

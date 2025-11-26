<script setup lang="ts">
import { ref, computed } from 'vue'
import BaseCard from './BaseCard.vue'
import BaseButton from './BaseButton.vue'
import BaseAlert from './BaseAlert.vue'
import { useFacebookStore } from '@/stores/facebook'
import type { SavedRestaurant } from '@/services/restaurantService'

interface MenuItem {
  name: string
  price?: string
  imageUrl?: string
  [key: string]: any
}

interface StyleTemplate {
  id: string
  name: string
  description: string
  icon: string
  preview: string
}

const props = defineProps<{
  restaurant: SavedRestaurant
  menuItems: MenuItem[]
  generating?: boolean
}>()

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'generate', data: {
    menuItem: MenuItem | null
    context: string
    styleTemplate: string
    includeLogo: boolean
    uploadedImage: File | null
  }): void
}>()

const facebookStore = useFacebookStore()

// State
const selectedMenuItem = ref<MenuItem | null>(null)
const promptContext = ref('')
const selectedStyleTemplate = ref<string>('vibrant')
const includeLogo = ref(true)
const uploadedImage = ref<File | null>(null)
const uploadedImagePreview = ref<string | null>(null)

// Pagination for menu items
const currentPage = ref(1)
const itemsPerPage = 8

// Style templates
const styleTemplates: StyleTemplate[] = [
  {
    id: 'vibrant',
    name: 'Vibrant',
    description: 'Bold colors and energetic design',
    icon: '🎨',
    preview: 'Bright, eye-catching with high contrast'
  },
  {
    id: 'elegant',
    name: 'Elegant',
    description: 'Sophisticated and refined aesthetic',
    icon: '✨',
    preview: 'Classy, premium feel with subtle touches'
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean and modern simplicity',
    icon: '⚪',
    preview: 'Simple, focused on the food'
  },
  {
    id: 'rustic',
    name: 'Rustic',
    description: 'Warm and homestyle appeal',
    icon: '🏡',
    preview: 'Natural, cozy, farm-to-table vibe'
  },
  {
    id: 'luxury',
    name: 'Luxury',
    description: 'Premium high-end presentation',
    icon: '👑',
    preview: 'Upscale, exclusive fine-dining feel'
  }
]

// Computed
const paginatedMenuItems = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return props.menuItems.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(props.menuItems.length / itemsPerPage)
})

const canGenerate = computed(() => {
  return selectedMenuItem.value !== null || uploadedImage.value !== null
})

// Methods
function selectMenuItem(item: MenuItem) {
  selectedMenuItem.value = item
  // Clear uploaded image if menu item is selected
  uploadedImage.value = null
  uploadedImagePreview.value = null
}

function selectStyleTemplate(templateId: string) {
  selectedStyleTemplate.value = templateId
}

function handleImageUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (file) {
    // Clear menu item selection if image is uploaded
    selectedMenuItem.value = null

    uploadedImage.value = file

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      uploadedImagePreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

function removeUploadedImage() {
  uploadedImage.value = null
  uploadedImagePreview.value = null
}

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

function handleGenerate() {
  if (!selectedMenuItem.value && !uploadedImage.value) return

  emit('generate', {
    menuItem: selectedMenuItem.value,
    context: promptContext.value.trim(),
    styleTemplate: selectedStyleTemplate.value,
    includeLogo: includeLogo.value,
    uploadedImage: uploadedImage.value
  })
}
</script>

<template>
  <div class="easy-mode-creation">
    <!-- Step 1: Menu Item Selection or Image Upload -->
    <BaseCard variant="glass" class="step-card">
      <div class="step-header">
        <div class="step-number">1</div>
        <div class="step-info">
          <h3 class="step-title">Pick Your Dish or Upload Image</h3>
          <p class="step-subtitle">Choose a menu item or upload your own image</p>
        </div>
      </div>

      <!-- Image Upload Option -->
      <div class="image-upload-section">
        <div v-if="uploadedImagePreview" class="uploaded-image-preview">
          <img :src="uploadedImagePreview" alt="Uploaded image" class="preview-image" />
          <button class="remove-image-btn" @click="removeUploadedImage" title="Remove image">
            ✕
          </button>
          <div class="upload-badge">
            <span class="badge-icon">✓</span>
          </div>
        </div>
        <label v-else class="upload-button">
          <input
            type="file"
            accept="image/*"
            @change="handleImageUpload"
            class="upload-input"
          />
          <div class="upload-content">
            <span class="upload-icon">📤</span>
            <span class="upload-text">Upload Your Own Image</span>
            <span class="upload-hint">JPG, PNG, or WebP</span>
          </div>
        </label>
      </div>

      <!-- Divider -->
      <div v-if="menuItems.length > 0" class="divider">
        <span class="divider-text">OR</span>
      </div>

      <!-- Menu Items Grid with Pagination -->
      <div v-if="menuItems.length > 0">
        <div class="menu-items-grid-easy">
          <div
            v-for="(item, index) in paginatedMenuItems"
            :key="index"
            :class="['menu-item-card-easy', { 'selected': selectedMenuItem === item }]"
            @click="selectMenuItem(item)"
          >
            <div class="menu-item-image-wrapper">
              <img
                v-if="item.imageUrl"
                :src="item.imageUrl"
                :alt="item.name"
                class="menu-item-image"
              />
              <div v-else class="menu-item-placeholder">
                <span class="placeholder-icon">🍽️</span>
              </div>
            </div>

            <div class="menu-item-details">
              <h4 class="menu-item-name">{{ item.name }}</h4>
              <p v-if="item.price" class="menu-item-price">{{ item.price }}</p>
            </div>

            <div v-if="selectedMenuItem === item" class="selected-badge">
              <span class="badge-icon">✓</span>
            </div>
          </div>
        </div>

        <!-- Pagination Controls -->
        <div v-if="totalPages > 1" class="pagination-controls">
          <button
            class="pagination-btn"
            :disabled="currentPage === 1"
            @click="prevPage"
          >
            ← Previous
          </button>
          <span class="pagination-info">
            Page {{ currentPage }} of {{ totalPages }}
          </span>
          <button
            class="pagination-btn"
            :disabled="currentPage === totalPages"
            @click="nextPage"
          >
            Next →
          </button>
        </div>
      </div>

      <div v-else-if="!uploadedImage" class="empty-state">
        <p class="empty-text">No menu items available. Upload an image to continue.</p>
      </div>
    </BaseCard>

    <!-- Step 2: Style Template Selection -->
    <BaseCard variant="glass" class="step-card">
      <div class="step-header">
        <div class="step-number">2</div>
        <div class="step-info">
          <h3 class="step-title">Choose Your Style</h3>
          <p class="step-subtitle">Select the visual aesthetic for your post</p>
        </div>
      </div>

      <div class="style-templates-grid">
        <div
          v-for="template in styleTemplates"
          :key="template.id"
          :class="['style-template-card', { 'selected': selectedStyleTemplate === template.id }]"
          @click="selectStyleTemplate(template.id)"
        >
          <div class="template-icon">{{ template.icon }}</div>
          <h4 class="template-name">{{ template.name }}</h4>
          <p class="template-description">{{ template.description }}</p>
          <div v-if="selectedStyleTemplate === template.id" class="template-selected-badge">
            <span class="badge-icon">✓</span>
          </div>
        </div>
      </div>
    </BaseCard>

    <!-- Step 3: Optional Customization -->
    <BaseCard variant="glass" class="step-card">
      <div class="step-header">
        <div class="step-number">3</div>
        <div class="step-info">
          <h3 class="step-title">Add Details (Optional)</h3>
          <p class="step-subtitle">Customize your post with promotional text and branding</p>
        </div>
      </div>

      <div class="customization-options">
        <!-- Campaign Context -->
        <div class="option-group">
          <label for="context-input" class="option-label">
            💫 Special Offer or Promotion
          </label>
          <input
            id="context-input"
            v-model="promptContext"
            type="text"
            class="context-input-easy"
            placeholder="e.g., 20% OFF, COMBO DEAL, NEW ITEM..."
            maxlength="50"
          />
          <p class="input-note">
            {{ promptContext.length }}/50 characters
          </p>
        </div>

        <!-- Logo Toggle -->
        <div class="option-group" v-if="restaurant.brand_dna?.logo_url">
          <label class="checkbox-label-easy">
            <input
              type="checkbox"
              v-model="includeLogo"
              class="checkbox-input-easy"
            />
            <span class="checkbox-text">
              <span class="checkbox-icon">🏷️</span>
              <span>Include restaurant logo</span>
            </span>
          </label>
          <p class="option-hint">Your logo will be placed on the image automatically</p>
        </div>
      </div>
    </BaseCard>

    <!-- Step 4: Generate -->
    <BaseCard variant="glass" class="step-card generate-section">
      <div class="step-header">
        <div class="step-number">4</div>
        <div class="step-info">
          <h3 class="step-title">Create Your Post</h3>
          <p class="step-subtitle">Generate an AI-designed image with your selections</p>
        </div>
      </div>

      <div class="generate-features">
        <div class="feature-item">
          <span class="feature-icon">🎨</span>
          <span class="feature-text">{{ styleTemplates.find(t => t.id === selectedStyleTemplate)?.name }} style</span>
        </div>
        <div class="feature-item">
          <span class="feature-icon">📝</span>
          <span class="feature-text">Engaging post text</span>
        </div>
        <div v-if="includeLogo && restaurant.brand_dna?.logo_url" class="feature-item">
          <span class="feature-icon">🏷️</span>
          <span class="feature-text">Restaurant branding</span>
        </div>
        <div v-if="promptContext" class="feature-item">
          <span class="feature-icon">💫</span>
          <span class="feature-text">Promotional sticker</span>
        </div>
      </div>

      <BaseButton
        variant="primary"
        size="large"
        full-width
        :disabled="!canGenerate || props.generating"
        @click="handleGenerate"
        class="generate-button"
      >
        <span v-if="props.generating" class="generating-content">
          <span class="spinner"></span>
          Cooking up your post...
        </span>
        <span v-else-if="!selectedMenuItem && !uploadedImage">Select a Dish or Upload Image</span>
        <span v-else>✨ Generate Picture (1 credit)</span>
      </BaseButton>
    </BaseCard>

    <!-- Loading Overlay -->
    <div v-if="props.generating" class="loading-overlay">
      <div class="loading-content">
        <div class="cooking-animation">
          <img src="../assets/socialchef_logo.svg" alt="SocialChef" class="loading-logo" />
          <div class="cooking-text">Cooking up your post...</div>
          <div class="loading-bar">
            <div class="loading-bar-fill"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.easy-mode-creation {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xl);
  animation: fadeInUp 0.6s var(--ease-smooth);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Step Card */
.step-card {
  animation: fadeInUp 0.6s var(--ease-smooth);
  animation-fill-mode: both;
}

.step-card:nth-child(1) { animation-delay: 0.1s; }
.step-card:nth-child(2) { animation-delay: 0.2s; }
.step-card:nth-child(3) { animation-delay: 0.3s; }
.step-card:nth-child(4) { animation-delay: 0.4s; }

.step-header {
  display: flex;
  align-items: flex-start;
  gap: var(--space-lg);
  margin-bottom: var(--space-xl);
}

.step-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  border-radius: var(--radius-full);
  background: var(--gradient-gold);
  color: var(--text-on-gold);
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  box-shadow: var(--glow-gold-sm);
}

.step-info {
  flex: 1;
}

.step-title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  color: var(--text-primary);
  margin: 0 0 var(--space-xs) 0;
}

.step-subtitle {
  font-size: var(--text-base);
  color: var(--text-secondary);
  margin: 0;
}

/* Menu Items Grid */
.menu-items-grid-easy {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: var(--space-lg);
}

.menu-item-card-easy {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: var(--space-lg);
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: var(--transition-base);
}

.menu-item-card-easy:hover {
  border-color: var(--gold-primary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.menu-item-card-easy.selected {
  border-color: var(--gold-primary);
  background: var(--gold-subtle);
  box-shadow: var(--glow-gold-md);
}

.menu-item-image-wrapper {
  width: 100%;
  aspect-ratio: 1;
  border-radius: var(--radius-md);
  overflow: hidden;
  margin-bottom: var(--space-md);
  background: var(--bg-tertiary);
}

.menu-item-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.menu-item-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-elevated);
}

.placeholder-icon {
  font-size: var(--text-4xl);
  opacity: 0.3;
}

.menu-item-details {
  flex: 1;
}

.menu-item-name {
  font-family: var(--font-heading);
  font-size: var(--text-base);
  color: var(--text-primary);
  margin: 0 0 var(--space-xs) 0;
}

.menu-item-price {
  font-size: var(--text-sm);
  color: var(--gold-primary);
  font-weight: var(--font-semibold);
  margin: 0;
}

.selected-badge {
  position: absolute;
  top: var(--space-md);
  right: var(--space-md);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gradient-gold);
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-md);
}

.badge-icon {
  color: var(--text-on-gold);
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
}

/* Style Templates Grid */
.style-templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: var(--space-lg);
}

.style-template-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-xl);
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: var(--transition-base);
  text-align: center;
}

.style-template-card:hover {
  border-color: var(--gold-primary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.style-template-card.selected {
  border-color: var(--gold-primary);
  background: var(--gold-subtle);
  box-shadow: var(--glow-gold-md);
}

.template-icon {
  font-size: var(--text-5xl);
  margin-bottom: var(--space-md);
}

.template-name {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  color: var(--text-primary);
  margin: 0 0 var(--space-xs) 0;
}

.template-description {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: 0;
  line-height: var(--leading-normal);
}

.template-selected-badge {
  position: absolute;
  top: var(--space-md);
  right: var(--space-md);
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gradient-gold);
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-md);
}

/* Customization Options */
.customization-options {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

.option-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.option-label {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.context-input-easy {
  width: 100%;
  padding: var(--space-lg);
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--text-primary);
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  transition: var(--transition-base);
  outline: none;
}

.context-input-easy::placeholder {
  color: var(--text-muted);
}

.context-input-easy:focus {
  border-color: var(--gold-primary);
  box-shadow: 0 0 0 3px var(--gold-subtle);
}

.input-note {
  font-size: var(--text-xs);
  color: var(--text-muted);
  margin: 0;
  text-align: right;
}

.option-hint {
  font-size: var(--text-sm);
  color: var(--text-muted);
  margin: 0;
}

.checkbox-label-easy {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  cursor: pointer;
  padding: var(--space-lg);
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  transition: var(--transition-base);
}

.checkbox-label-easy:hover {
  border-color: var(--gold-primary);
  background: var(--gold-subtle);
}

.checkbox-input-easy {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: var(--gold-primary);
}

.checkbox-text {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--text-base);
  color: var(--text-primary);
  font-weight: var(--font-medium);
}

.checkbox-icon {
  font-size: var(--text-xl);
}

/* Generate Section */
.generate-features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--space-lg);
  margin-bottom: var(--space-xl);
}

.feature-item {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  border: var(--border-width) solid var(--border-color);
}

.feature-icon {
  font-size: var(--text-2xl);
  flex-shrink: 0;
}

.feature-text {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  font-weight: var(--font-medium);
}

.generate-button {
  font-size: var(--text-lg);
  padding: var(--space-xl);
}

/* Image Upload */
.image-upload-section {
  margin-bottom: var(--space-xl);
}

.upload-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-3xl);
  background: var(--bg-secondary);
  border: 2px dashed var(--border-color);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: var(--transition-base);
}

.upload-button:hover {
  border-color: var(--gold-primary);
  background: var(--gold-subtle);
}

.upload-input {
  display: none;
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
}

.upload-icon {
  font-size: var(--text-4xl);
}

.upload-text {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.upload-hint {
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.uploaded-image-preview {
  position: relative;
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 2px solid var(--gold-primary);
  box-shadow: var(--glow-gold-md);
}

.preview-image {
  width: 100%;
  height: auto;
  display: block;
}

.remove-image-btn {
  position: absolute;
  top: var(--space-md);
  right: var(--space-md);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.7);
  border: none;
  border-radius: var(--radius-full);
  color: var(--text-primary);
  font-size: var(--text-lg);
  cursor: pointer;
  transition: var(--transition-base);
}

.remove-image-btn:hover {
  background: var(--error-bg);
  color: var(--error-text);
}

.upload-badge {
  position: absolute;
  top: var(--space-md);
  left: var(--space-md);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gradient-gold);
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-md);
}

/* Divider */
.divider {
  position: relative;
  text-align: center;
  margin: var(--space-2xl) 0;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--border-color);
}

.divider-text {
  position: relative;
  display: inline-block;
  padding: 0 var(--space-lg);
  background: var(--bg-primary);
  color: var(--text-muted);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
}

/* Pagination Controls */
.pagination-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-lg);
  margin-top: var(--space-xl);
  padding-top: var(--space-xl);
  border-top: 1px solid var(--border-color);
}

.pagination-btn {
  padding: var(--space-md) var(--space-xl);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: var(--transition-base);
}

.pagination-btn:hover:not(:disabled) {
  background: var(--bg-elevated);
  border-color: var(--gold-primary);
  color: var(--gold-primary);
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  font-weight: var(--font-medium);
  min-width: 120px;
  text-align: center;
}

/* Empty State */
.empty-state {
  padding: var(--space-4xl);
  text-align: center;
}

.empty-text {
  font-size: var(--text-lg);
  color: var(--text-muted);
}

/* Loading States */
.generating-content {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  justify-content: center;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: var(--text-on-gold);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(10, 10, 10, 0.95);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.loading-content {
  text-align: center;
}

.cooking-animation {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xl);
}

.loading-logo {
  width: 120px;
  height: auto;
  filter: drop-shadow(0 0 20px rgba(212, 175, 55, 0.5));
  animation: bounce 1s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}

.cooking-text {
  font-family: var(--font-heading);
  font-size: var(--text-3xl);
  color: var(--text-primary);
  background: var(--gradient-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.loading-bar {
  width: 300px;
  height: 6px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.loading-bar-fill {
  height: 100%;
  background: var(--gradient-gold);
  border-radius: var(--radius-full);
  animation: loading 2s ease-in-out infinite;
}

@keyframes loading {
  0% { width: 0%; }
  50% { width: 70%; }
  100% { width: 100%; }
}

/* Responsive */
@media (max-width: 768px) {
  .menu-items-grid-easy {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: var(--space-md);
  }

  .style-templates-grid {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  }

  .step-header {
    gap: var(--space-md);
  }

  .step-number {
    width: 40px;
    height: 40px;
    font-size: var(--text-xl);
  }

  .step-title {
    font-size: var(--text-xl);
  }

  .generate-features {
    grid-template-columns: 1fr;
  }

  .loading-logo {
    width: 80px;
  }

  .cooking-text {
    font-size: var(--text-2xl);
  }

  .loading-bar {
    width: 250px;
  }
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  .easy-mode-creation,
  .step-card,
  .spinner,
  .loading-logo,
  .loading-bar-fill {
    animation: none;
  }
}
</style>

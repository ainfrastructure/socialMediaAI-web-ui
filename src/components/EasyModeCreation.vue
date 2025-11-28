<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
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
const { t } = useI18n()

// Wizard State
const currentStep = ref(1)
const totalSteps = 3

// State
const selectedMenuItem = ref<MenuItem | null>(null)
const promptContext = ref('')
const selectedStyleTemplate = ref<string>('vibrant')
const includeLogo = ref(true)
const uploadedImage = ref<File | null>(null)
const uploadedImagePreview = ref<string | null>(null)

// Pagination for menu items
const currentPage = ref(1)
const itemsPerPage = ref(12)
const gridContainer = ref<HTMLElement | null>(null)

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
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return props.menuItems.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(props.menuItems.length / itemsPerPage.value)
})

const canGenerate = computed(() => {
  return selectedMenuItem.value !== null || uploadedImage.value !== null
})

// Step labels for progress indicator
const stepLabels = computed(() => [
  { number: 1, label: t('easyMode.steps.menu', 'Menu') },
  { number: 2, label: t('easyMode.steps.style', 'Style') },
  { number: 3, label: t('easyMode.steps.review', 'Review') }
])

// Dynamic items per page calculation
function calculateItemsPerPage() {
  if (!gridContainer.value) return

  const containerWidth = gridContainer.value.offsetWidth
  const containerHeight = window.innerHeight - gridContainer.value.getBoundingClientRect().top - 250 // Reserve space for pagination and other elements

  // Grid settings from CSS
  const minCardWidth = 180 // matches CSS minmax(180px, 1fr)
  const gap = 16 // var(--space-lg) = 16px

  // Calculate columns that fit
  const columns = Math.floor((containerWidth + gap) / (minCardWidth + gap))

  // Card has aspect ratio 1:1 for image + additional height for text
  // Estimate total card height: image (180px) + padding (32px) + text (~60px) = ~272px
  const estimatedCardHeight = 272

  // Calculate rows that fit
  const rows = Math.max(2, Math.floor((containerHeight + gap) / (estimatedCardHeight + gap)))

  // Calculate total items
  const calculatedItems = columns * rows

  // Set bounds: minimum 8, maximum 20
  itemsPerPage.value = Math.max(8, Math.min(20, calculatedItems))
}

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

// Step navigation
function nextStep() {
  if (currentStep.value < totalSteps) {
    currentStep.value++
  }
}

function prevStep() {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

function goToStep(step: number) {
  // Allow jumping to any step
  if (step >= 1 && step <= totalSteps) {
    currentStep.value = step
  }
}

// Lifecycle hooks
onMounted(() => {
  // Calculate initial items per page
  setTimeout(() => {
    calculateItemsPerPage()
  }, 100) // Small delay to ensure DOM is fully rendered

  // Add resize listener
  window.addEventListener('resize', calculateItemsPerPage)
})

onUnmounted(() => {
  // Cleanup resize listener
  window.removeEventListener('resize', calculateItemsPerPage)
})
</script>

<template>
  <div class="easy-mode-creation">
    <!-- Progress Indicator - Horizontal Stepper -->
    <div class="wizard-progress">
      <div class="wizard-progress-track">
        <div
          v-for="(step, index) in stepLabels"
          :key="step.number"
          class="progress-step-wrapper"
        >
          <div
            :class="['progress-step-item', {
              'active': currentStep === step.number,
              'completed': currentStep > step.number
            }]"
            @click="goToStep(step.number)"
          >
            <div class="progress-step-circle">
              <span v-if="currentStep > step.number" class="checkmark">✓</span>
              <span v-else>{{ step.number }}</span>
            </div>
            <span class="progress-step-label">{{ step.label }}</span>
          </div>
          <div
            v-if="index < stepLabels.length - 1"
            :class="['progress-line', { 'completed': currentStep > step.number }]"
          ></div>
        </div>
      </div>
    </div>

    <!-- Step 1: Menu Item Selection or Image Upload -->
    <BaseCard v-show="currentStep === 1" variant="glass" class="step-card">
      <div class="step-header">
        <div class="step-info">
          <h3 class="step-title">{{ t('easyMode.step1.title', 'Pick Your Dish or Upload Image') }}</h3>
          <p class="step-subtitle">{{ t('easyMode.step1.subtitle', 'Choose a menu item or upload your own image') }}</p>
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
            <span class="upload-text">{{ t('easyMode.upload.button', 'Upload Your Own Image') }}</span>
            <span class="upload-hint">{{ t('easyMode.upload.hint', 'JPG, PNG, or WebP') }}</span>
          </div>
        </label>
      </div>

      <!-- Divider -->
      <div v-if="menuItems.length > 0" class="divider">
        <span class="divider-text">OR</span>
      </div>

      <!-- Menu Items Grid with Pagination -->
      <div v-if="menuItems.length > 0">
        <div ref="gridContainer" class="menu-items-grid-easy">
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
        <p class="empty-text">{{ t('easyMode.step1.empty', 'No menu items available. Upload an image to continue.') }}</p>
      </div>

      <!-- Step 1 Navigation -->
      <div class="step-navigation">
        <BaseButton
          variant="primary"
          size="large"
          @click="nextStep"
          class="next-button"
        >
          {{ t('common.continue', 'Continue') }}
        </BaseButton>
      </div>
    </BaseCard>

    <!-- Step 2: Style Template Selection -->
    <BaseCard v-show="currentStep === 2" variant="glass" class="step-card">
      <div class="step-header">
        <div class="step-info">
          <h3 class="step-title">{{ t('easyMode.step2.title', 'Choose Your Style') }}</h3>
          <p class="step-subtitle">{{ t('easyMode.step2.subtitle', 'Select the visual aesthetic for your post') }}</p>
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

      <!-- Step 2 Navigation -->
      <div class="step-navigation">
        <BaseButton
          variant="secondary"
          size="large"
          @click="prevStep"
          class="prev-button"
        >
          {{ t('common.back', 'Back') }}
        </BaseButton>
        <BaseButton
          variant="primary"
          size="large"
          @click="nextStep"
          class="next-button"
        >
          {{ t('common.continue', 'Continue') }}
        </BaseButton>
      </div>
    </BaseCard>

    <!-- Step 3: Review & Generate (Combined Details + Generate) -->
    <BaseCard v-show="currentStep === 3" variant="glass" class="step-card generate-section">
      <div class="step-header">
        <div class="step-info">
          <h3 class="step-title">{{ t('easyMode.step3.title', 'Review & Generate') }}</h3>
          <p class="step-subtitle">{{ t('easyMode.step3.subtitle', 'Add final touches and create your post') }}</p>
        </div>
      </div>

      <!-- Optional Customization -->
      <div class="customization-options">
        <!-- Campaign Context -->
        <div class="option-group">
          <label for="context-input" class="option-label">
            💫 {{ t('easyMode.step3.promoLabel', 'Special Offer or Promotion (Optional)') }}
          </label>
          <input
            id="context-input"
            v-model="promptContext"
            type="text"
            class="context-input-easy"
            :placeholder="t('easyMode.step3.promoPlaceholder', 'e.g., 20% OFF, COMBO DEAL, NEW ITEM...')"
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
              <span>{{ t('easyMode.step3.includeLogo', 'Include restaurant logo') }}</span>
            </span>
          </label>
          <p class="option-hint">{{ t('easyMode.step3.logoHint', 'Your logo will be placed on the image automatically') }}</p>
        </div>
      </div>

      <!-- Summary of selections -->
      <div class="generate-summary">
        <h4 class="summary-title">{{ t('easyMode.step3.summaryTitle', 'Your Selections:') }}</h4>
        <div class="generate-features">
          <div class="feature-item">
            <span class="feature-icon">🎨</span>
            <span class="feature-text">{{ styleTemplates.find(t => t.id === selectedStyleTemplate)?.name }} {{ t('easyMode.step3.style', 'style') }}</span>
          </div>
          <div class="feature-item">
            <span class="feature-icon">📝</span>
            <span class="feature-text">{{ t('easyMode.step3.postText', 'Engaging post text') }}</span>
          </div>
          <div v-if="includeLogo && restaurant.brand_dna?.logo_url" class="feature-item">
            <span class="feature-icon">🏷️</span>
            <span class="feature-text">{{ t('easyMode.step3.branding', 'Restaurant branding') }}</span>
          </div>
          <div v-if="promptContext" class="feature-item">
            <span class="feature-icon">💫</span>
            <span class="feature-text">{{ t('easyMode.step3.promo', 'Promotional sticker') }}</span>
          </div>
        </div>
      </div>

      <!-- Step 3 Navigation -->
      <div class="step-navigation">
        <BaseButton
          variant="secondary"
          size="large"
          @click="prevStep"
          class="prev-button"
        >
          {{ t('common.back', 'Back') }}
        </BaseButton>
        <BaseButton
          variant="primary"
          size="large"
          :disabled="!canGenerate || props.generating"
          @click="handleGenerate"
          class="generate-button"
        >
          <span v-if="props.generating" class="generating-content">
            <span class="spinner"></span>
            {{ t('easyMode.step3.generating', 'Cooking up your post...') }}
          </span>
          <span v-else>{{ t('easyMode.step3.generateButton', '✨ Generate Picture (1 credit)') }}</span>
        </BaseButton>
      </div>
    </BaseCard>

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

/* Wizard Progress Indicator */
.wizard-progress {
  padding: var(--space-2xl) var(--space-xl);
  margin-bottom: var(--space-2xl);
}

.wizard-progress-track {
  display: flex;
  justify-content: center;
  align-items: center;
  max-width: 800px;
  margin: 0 auto;
}

.progress-step-wrapper {
  display: flex;
  align-items: center;
  flex: 1;
}

.progress-step-wrapper:last-child {
  flex: 0;
}

.progress-step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  cursor: pointer;
  transition: var(--transition-base);
  z-index: 2;
}

.progress-step-circle {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
  background: var(--bg-secondary);
  border: 3px solid var(--border-color);
  color: var(--text-muted);
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  transition: var(--transition-base);
}

.progress-step-item.active .progress-step-circle {
  background: var(--gradient-gold);
  border-color: var(--gold-primary);
  color: var(--text-on-gold);
  box-shadow: var(--glow-gold-md);
  transform: scale(1.05);
}

.progress-step-item.completed .progress-step-circle {
  background: var(--gradient-gold);
  border-color: var(--gold-primary);
  color: var(--text-on-gold);
}

.progress-step-label {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-secondary);
  transition: var(--transition-base);
  white-space: nowrap;
}

.progress-step-item.active .progress-step-label {
  color: var(--gold-primary);
  font-weight: var(--font-bold);
}

.progress-step-item.completed .progress-step-label {
  color: var(--text-primary);
}

/* Connecting Lines */
.progress-line {
  flex: 1;
  height: 3px;
  background: var(--border-color);
  margin: 0 var(--space-md);
  transition: var(--transition-base);
  position: relative;
  top: -14px; /* Align with center of circles */
}

.progress-line.completed {
  background: var(--gold-primary);
}

/* Step Card */
.step-card {
  animation: fadeInUp 0.6s var(--ease-smooth);
  animation-fill-mode: both;
}

.step-header {
  display: flex;
  align-items: flex-start;
  gap: var(--space-lg);
  margin-bottom: var(--space-xl);
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

/* Step Navigation */
.step-navigation {
  display: flex;
  justify-content: space-between;
  gap: var(--space-lg);
  margin-top: var(--space-2xl);
  padding-top: var(--space-2xl);
  border-top: 1px solid var(--border-color);
}

.step-navigation .next-button,
.step-navigation .prev-button {
  flex: 1;
  max-width: 200px;
}

.step-navigation .next-button:only-child {
  margin-left: auto;
}

.step-navigation .generate-button {
  flex: 1;
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
.generate-summary {
  margin-top: var(--space-2xl);
  padding-top: var(--space-2xl);
  border-top: 1px solid var(--border-color);
}

.summary-title {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  color: var(--text-primary);
  margin: 0 0 var(--space-lg) 0;
  font-weight: var(--font-semibold);
}

.generate-features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--space-lg);
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
  max-width: 500px;
}

.loading-logo {
  width: 100px;
  height: auto;
  filter: drop-shadow(0 0 20px rgba(212, 175, 55, 0.5));
  animation: bounce 1s ease-in-out infinite;
  margin-bottom: var(--space-lg);
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}

/* Progress Steps */
.progress-steps {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  width: 100%;
  margin-bottom: var(--space-xl);
}

.progress-step {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  padding: var(--space-lg);
  background: rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-lg);
  border: 2px solid transparent;
  transition: all 0.3s var(--ease-smooth);
  opacity: 0.5;
}

.progress-step.active {
  opacity: 1;
  border-color: var(--gold-primary);
  background: rgba(212, 175, 55, 0.1);
  box-shadow: 0 0 20px rgba(212, 175, 55, 0.3);
}

.progress-step.completed {
  opacity: 0.8;
  border-color: rgba(46, 213, 115, 0.5);
}

.step-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  flex-shrink: 0;
  position: relative;
}

.progress-step.active .step-icon {
  border-color: var(--gold-primary);
  background: rgba(212, 175, 55, 0.2);
}

.progress-step.completed .step-icon {
  border-color: #2ed573;
  background: rgba(46, 213, 115, 0.2);
}

.step-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid rgba(212, 175, 55, 0.3);
  border-top-color: var(--gold-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.checkmark {
  font-size: var(--text-2xl);
  color: #2ed573;
  font-weight: var(--font-bold);
  animation: checkmarkPop 0.3s var(--ease-smooth);
}

@keyframes checkmarkPop {
  0% { transform: scale(0); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.step-waiting {
  font-size: var(--text-2xl);
  color: var(--text-muted);
}

.step-text {
  flex: 1;
  text-align: left;
}

.step-title {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  color: var(--text-primary);
  font-weight: var(--font-semibold);
  margin-bottom: var(--space-xs);
}

.step-subtitle {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.progress-step.active .step-title {
  color: var(--gold-primary);
}

/* Progress Bar */
.loading-bar {
  width: 100%;
  height: 8px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-full);
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
}

.loading-bar-fill {
  height: 100%;
  background: var(--gradient-gold);
  border-radius: var(--radius-full);
  transition: width 0.3s ease-out;
  box-shadow: 0 0 10px rgba(212, 175, 55, 0.5);
}

.progress-text {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  color: var(--gold-primary);
  font-weight: var(--font-bold);
  margin-top: var(--space-md);
}

/* Responsive */
@media (max-width: 768px) {
  .wizard-progress {
    padding: var(--space-lg) var(--space-sm);
  }

  .wizard-progress-track {
    gap: 0;
  }

  .progress-step-circle {
    width: 44px;
    height: 44px;
    font-size: var(--text-base);
  }

  .progress-step-label {
    font-size: var(--text-xs);
  }

  .progress-line {
    margin: 0 var(--space-xs);
    top: -12px;
    height: 2px;
  }

  .step-navigation {
    flex-direction: column;
    gap: var(--space-md);
  }

  .step-navigation .next-button,
  .step-navigation .prev-button {
    max-width: none;
  }

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

  .step-title {
    font-size: var(--text-xl);
  }

  .generate-features {
    grid-template-columns: 1fr;
  }

  .loading-logo {
    width: 80px;
  }

  .cooking-animation {
    max-width: 90%;
  }

  .progress-steps {
    gap: var(--space-md);
  }

  .progress-step {
    padding: var(--space-md);
    gap: var(--space-md);
  }

  .step-icon {
    width: 40px;
    height: 40px;
  }

  .step-spinner {
    width: 20px;
    height: 20px;
  }

  .step-title {
    font-size: var(--text-base);
  }

  .step-subtitle {
    font-size: var(--text-xs);
  }

  .progress-text {
    font-size: var(--text-lg);
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

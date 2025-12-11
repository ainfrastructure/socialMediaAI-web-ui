<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseCard from './BaseCard.vue'
import BaseButton from './BaseButton.vue'

export interface StyleVariation {
  style: 'behindTheScenes' | 'cleanStrict' | 'zoomIn' | 'oneBite' | 'studioShot' | 'infographic' | 'custom'
  title: string
  hashtags: string[]
  prompt: string
}

const props = defineProps<{
  variations: StyleVariation[]
  generating?: boolean
}>()

const emit = defineEmits<{
  (e: 'select', variation: StyleVariation): void
  (e: 'regenerate'): void
}>()

const { t } = useI18n()

// State
const selectedVariation = ref<StyleVariation | null>(null)
const editedPrompt = ref('')
const isEditingPrompt = ref(false)

// Select a variation
function selectVariation(variation: StyleVariation) {
  selectedVariation.value = variation
  editedPrompt.value = variation.prompt
  isEditingPrompt.value = false

  // Emit with the current (potentially edited) prompt
  emit('select', {
    ...variation,
    prompt: editedPrompt.value
  })
}

// Update prompt when editing
function updatePrompt() {
  if (selectedVariation.value) {
    emit('select', {
      ...selectedVariation.value,
      prompt: editedPrompt.value
    })
  }
}

// Get style icon (Golden SVG)
function getStyleIcon(style: string): string {
  const goldGradient = `<defs><linearGradient id="goldGrad-${style}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#E5C775"/><stop offset="50%" style="stop-color:#D4AF37"/><stop offset="100%" style="stop-color:#B8943D"/></linearGradient></defs>`

  const icons: Record<string, string> = {
    elegant: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">${goldGradient}<path d="M12 2L19 12L12 22L5 12L12 2Z" fill="url(#goldGrad-${style})"/><path d="M12 6L16 12L12 18L8 12L12 6Z" fill="url(#goldGrad-${style})" opacity="0.5"/></svg>`,
    vibrant: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">${goldGradient}<circle cx="12" cy="12" r="5" fill="url(#goldGrad-${style})"/><path d="M12 2V6M12 18V22M2 12H6M18 12H22M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93" stroke="url(#goldGrad-${style})" stroke-width="2" stroke-linecap="round"/></svg>`,
    rustic: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">${goldGradient}<path d="M12 2C10 4 8 7 8 10C8 13 10 15 12 15C14 15 16 13 16 10C16 7 14 4 12 2Z" fill="url(#goldGrad-${style})"/><path d="M12 15V22M8 18H16" stroke="url(#goldGrad-${style})" stroke-width="2"/></svg>`,
    modern: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">${goldGradient}<rect x="3" y="3" width="7" height="7" rx="1" fill="url(#goldGrad-${style})"/><rect x="14" y="3" width="7" height="7" rx="1" fill="url(#goldGrad-${style})" opacity="0.7"/><rect x="3" y="14" width="7" height="7" rx="1" fill="url(#goldGrad-${style})" opacity="0.7"/><rect x="14" y="14" width="7" height="7" rx="1" fill="url(#goldGrad-${style})"/></svg>`
  }

  return icons[style] || icons.vibrant
}

// Check if a variation is selected
function isSelected(variation: StyleVariation): boolean {
  return selectedVariation.value?.style === variation.style
}

// Get translated style info
function getStyleInfo(style: string) {
  const key = `advancedMode.styleVariations.${style}`
  return {
    title: t(`${key}.title`),
    description: t(`${key}.description`)
  }
}
</script>

<template>
  <div class="prompt-variation-selector">
    <!-- Loading State -->
    <div v-if="generating" class="generating-state">
      <img src="/socialchef_logo.svg" alt="Social Chef" class="loading-logo" />
      <p class="loading-title">{{ t('advancedMode.step3.generatingTitle', 'Crafting your styles') }}</p>
      <p class="loading-subtitle">{{ t('advancedMode.step3.generatingSubtitle', 'Our AI is creating unique design options for you') }}</p>
    </div>

    <!-- Variations Grid -->
    <div v-else-if="variations.length > 0" class="variations-container">
      <div class="variations-grid">
        <BaseCard
          v-for="variation in variations"
          :key="variation.style"
          :class="['variation-card', { 'selected': isSelected(variation) }]"
          variant="glass"
          hoverable
          @click="selectVariation(variation)"
        >
          <!-- Style Icon & Title -->
          <div class="variation-header">
            <div class="style-icon" v-html="getStyleIcon(variation.style)"></div>
            <div class="variation-title-section">
              <h3 class="variation-title">{{ variation.title }}</h3>
              <p class="variation-subtitle">{{ getStyleInfo(variation.style).description }}</p>
            </div>
          </div>

          <!-- Hashtags -->
          <div class="hashtags-section">
            <span
              v-for="(hashtag, index) in variation.hashtags.slice(0, 5)"
              :key="index"
              class="hashtag"
            >
              #{{ hashtag }}
            </span>
          </div>

          <!-- Prompt Preview (collapsed) -->
          <div class="prompt-preview">
            <p class="prompt-text">{{ variation.prompt.substring(0, 100) }}...</p>
          </div>

          <!-- Selected Badge -->
          <div v-if="isSelected(variation)" class="selected-badge">
            <span class="badge-icon">✓</span>
            <span class="badge-text">{{ t('playground.selectedBadge') }}</span>
          </div>
        </BaseCard>
      </div>

      <!-- Expanded Selected Variation -->
      <transition name="expand">
        <BaseCard v-if="selectedVariation" variant="glass-intense" class="selected-variation-panel">
          <div class="panel-header">
            <h3 class="panel-title">
              <span class="panel-icon" v-html="getStyleIcon(selectedVariation.style)"></span>
              <span>{{ t('advancedMode.step3.selectedStyle') }}</span>
            </h3>
            <span class="style-name">{{ selectedVariation.title }}</span>
          </div>

          <!-- Full Hashtags -->
          <div class="full-hashtags">
            <span
              v-for="(hashtag, index) in selectedVariation.hashtags"
              :key="index"
              class="hashtag hashtag-large"
            >
              #{{ hashtag }}
            </span>
          </div>

          <!-- Editable Prompt -->
          <div class="prompt-editor">
            <div class="editor-header">
              <label class="editor-label">{{ t('advancedMode.step3.promptLabel') }}</label>
              <button
                v-if="!isEditingPrompt"
                class="edit-button"
                @click="isEditingPrompt = true"
              >
                ✏️ {{ t('advancedMode.step3.editPrompt') }}
              </button>
            </div>

            <textarea
              v-model="editedPrompt"
              :readonly="!isEditingPrompt"
              :class="['prompt-textarea', { 'editing': isEditingPrompt }]"
              :placeholder="t('advancedMode.step3.promptPlaceholder')"
              rows="6"
              @blur="updatePrompt"
            ></textarea>

            <div v-if="isEditingPrompt" class="editor-actions">
              <BaseButton
                variant="primary"
                size="small"
                @click="isEditingPrompt = false; updatePrompt()"
              >
                {{ t('common.save') }}
              </BaseButton>
              <BaseButton
                variant="ghost"
                size="small"
                @click="isEditingPrompt = false; editedPrompt = selectedVariation.prompt"
              >
                {{ t('common.cancel') }}
              </BaseButton>
            </div>
          </div>
        </BaseCard>
      </transition>

      <!-- Regenerate Button -->
      <div class="regenerate-section">
        <BaseButton variant="ghost" @click="emit('regenerate')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: inline-block; margin-right: 8px;">
            <defs>
              <linearGradient id="goldGrad-regenerate" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#E5C775"/>
                <stop offset="50%" style="stop-color:#D4AF37"/>
                <stop offset="100%" style="stop-color:#B8943D"/>
              </linearGradient>
            </defs>
            <path d="M21 10C21 10 18.995 7.26822 17.3662 5.63824C15.7373 4.00827 13.4864 3 11 3C6.02944 3 2 7.02944 2 12C2 16.9706 6.02944 21 11 21C15.1031 21 18.5649 18.2543 19.6482 14.5M21 10V4M21 10H15" stroke="url(#goldGrad-regenerate)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          {{ t('advancedMode.step3.regenerate') }}
        </BaseButton>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <p class="empty-text">{{ t('advancedMode.step3.selectStyle') }}</p>
    </div>
  </div>
</template>

<style scoped>
.prompt-variation-selector {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

/* Generating State */
.generating-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-5xl) var(--space-2xl);
  width: 100%;
}

.loading-logo {
  width: 120px;
  height: 120px;
  margin-bottom: var(--space-xl);
  animation: bounce 2s ease-in-out infinite;
  filter: drop-shadow(0 4px 20px rgba(212, 175, 55, 0.4));
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
}

.loading-title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  color: var(--gold-primary);
  margin: 0 0 var(--space-sm) 0;
  font-weight: var(--font-semibold);
}

.loading-subtitle {
  font-size: var(--text-base);
  color: var(--text-secondary);
  margin: 0;
}

/* Variations Container */
.variations-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xl);
}

.variations-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-lg);
}

.variation-card {
  cursor: pointer;
  transition: var(--transition-base);
  position: relative;
  padding: var(--space-xl);
}

.variation-card.selected {
  border-color: var(--gold-primary);
  background: var(--gold-subtle);
  box-shadow: var(--glow-gold-md);
}

/* Variation Header */
.variation-header {
  display: flex;
  align-items: flex-start;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}

.style-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.variation-title-section {
  flex: 1;
}

.variation-title {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin-bottom: var(--space-xs);
}

.variation-subtitle {
  font-size: var(--text-sm);
  color: var(--text-muted);
  line-height: 1.4;
}

/* Hashtags */
.hashtags-section {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  margin-bottom: var(--space-lg);
}

.hashtag {
  display: inline-block;
  padding: var(--space-xs) var(--space-sm);
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-full);
  color: var(--gold-primary);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
}

.hashtag-large {
  padding: var(--space-sm) var(--space-md);
  font-size: var(--text-sm);
}

/* Prompt Preview */
.prompt-preview {
  margin-bottom: var(--space-md);
}

.prompt-text {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Selected Badge */
.selected-badge {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  background: var(--gold-primary);
  border-radius: var(--radius-full);
  position: absolute;
  top: var(--space-md);
  right: var(--space-md);
}

.badge-icon {
  color: var(--text-on-gold);
  font-weight: var(--font-bold);
}

.badge-text {
  color: var(--text-on-gold);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
}

/* Selected Variation Panel */
.selected-variation-panel {
  padding: var(--space-2xl);
  animation: expandIn 0.3s var(--ease-smooth);
}

@keyframes expandIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.panel-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  margin-bottom: var(--space-xl);
}

.panel-title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.panel-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.style-name {
  font-size: var(--text-lg);
  color: var(--gold-primary);
  font-weight: var(--font-semibold);
}

.full-hashtags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-md);
  margin-bottom: var(--space-2xl);
}

/* Prompt Editor */
.prompt-editor {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.editor-label {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.edit-button {
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: var(--transition-base);
}

.edit-button:hover {
  background: var(--gold-subtle);
  border-color: var(--gold-primary);
  color: var(--gold-primary);
}

.prompt-textarea {
  width: 100%;
  padding: var(--space-lg);
  background: var(--bg-secondary);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--text-base);
  font-family: var(--font-body);
  line-height: 1.6;
  resize: vertical;
  transition: var(--transition-base);
}

.prompt-textarea:focus {
  outline: none;
  border-color: var(--gold-primary);
  box-shadow: 0 0 0 3px var(--gold-subtle);
}

.prompt-textarea.editing {
  background: var(--bg-primary);
  border-color: var(--gold-primary);
}

.prompt-textarea[readonly] {
  cursor: default;
  opacity: 0.8;
}

.editor-actions {
  display: flex;
  gap: var(--space-md);
  justify-content: flex-end;
}

/* Regenerate Section */
.regenerate-section {
  display: flex;
  justify-content: center;
  padding-top: var(--space-lg);
  border-top: 1px solid var(--border-color);
}

/* Empty State */
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-5xl);
  text-align: center;
}

.empty-text {
  color: var(--text-muted);
  font-size: var(--text-lg);
}

/* Transitions */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s var(--ease-smooth);
}

.expand-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.expand-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

/* Responsive */
@media (max-width: 900px) {
  .variations-grid {
    grid-template-columns: 1fr;
  }

  .selected-variation-panel {
    padding: var(--space-lg);
  }
}
</style>

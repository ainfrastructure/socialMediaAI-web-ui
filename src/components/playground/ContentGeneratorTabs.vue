<template>
  <div class="generator-tabs-wrapper">
    <!-- Tabs -->
    <div class="tabs">
      <button
        :class="['tab', { active: activeTab === 'image' }]"
        @click="$emit('update:activeTab', 'image')"
      >
        📸 {{ $t('playground.image', 'Image') }}
      </button>
      <button
        :class="['tab', { active: activeTab === 'video' }]"
        @click="$emit('update:activeTab', 'video')"
      >
        🎥 {{ $t('playground.video', 'Video') }}
      </button>
    </div>

    <!-- Loading Prompts State -->
    <div v-if="loading" class="loading-prompts">
      <div class="spinner"></div>
      <p>{{ $t('playground.generatingIdeas', 'Generating creative ideas with AI...') }}</p>
    </div>

    <!-- Prompt Selection Section -->
    <div v-else class="prompt-section">
      <div class="section-header">
        <h4>{{ $t('playground.aiGeneratedIdeas', 'AI-Generated Ideas') }}</h4>
        <BaseButton
          variant="secondary"
          size="small"
          @click="$emit('refresh')"
          :disabled="loading"
        >
          ✨ {{ $t('playground.getNewIdeas', 'Get New Ideas') }}
        </BaseButton>
      </div>

      <!-- Image Tab -->
      <div v-if="activeTab === 'image'">
        <div v-if="imagePrompts.length > 0" class="prompt-grid">
          <div
            v-for="(prompt, index) in imagePrompts"
            :key="`image-${index}`"
            :class="['prompt-card', { selected: selectedImageIndex === index }]"
            @click="$emit('selectImage', index)"
          >
            <div class="prompt-number">{{ index + 1 }}</div>
            <div class="prompt-preview">{{ truncateText(prompt, 120) }}</div>
            <div v-if="selectedImageIndex === index" class="selected-badge">✓ {{ $t('common.selected', 'Selected') }}</div>
          </div>
        </div>
        <div v-else class="prompt-placeholder">
          <p>{{ $t('playground.clickToGenerateImage', 'Click "Get New Ideas" to generate AI-powered image prompts!') }}</p>
        </div>
      </div>

      <!-- Video Tab -->
      <div v-if="activeTab === 'video'">
        <div v-if="videoPrompts.length > 0" class="prompt-grid">
          <div
            v-for="(prompt, index) in videoPrompts"
            :key="`video-${index}`"
            :class="['prompt-card', { selected: selectedVideoIndex === index }]"
            @click="$emit('selectVideo', index)"
          >
            <div class="prompt-number">{{ index + 1 }}</div>
            <div class="prompt-preview">{{ truncateText(prompt, 120) }}</div>
            <div v-if="selectedVideoIndex === index" class="selected-badge">✓ {{ $t('common.selected', 'Selected') }}</div>
          </div>
        </div>
        <div v-else class="prompt-placeholder">
          <p>{{ $t('playground.clickToGenerateVideo', 'Click "Get New Ideas" to generate AI-powered video prompts!') }}</p>
        </div>
      </div>

      <!-- Selected Prompt Display (Editable) -->
      <div v-if="selectedPrompt" class="selected-prompt">
        <label>{{ $t('playground.selectedPromptEditable', 'Selected Prompt (editable)') }}:</label>
        <textarea
          :value="editablePrompt"
          @input="$emit('update:editablePrompt', ($event.target as HTMLTextAreaElement).value)"
          class="prompt-textarea"
          rows="5"
          :placeholder="$t('playground.selectPromptAbove', 'Select a prompt above...')"
        ></textarea>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import BaseButton from '../BaseButton.vue'

defineProps<{
  activeTab: 'image' | 'video'
  loading: boolean
  imagePrompts: string[]
  videoPrompts: string[]
  selectedImageIndex: number | null
  selectedVideoIndex: number | null
  selectedPrompt: string | null
  editablePrompt: string
}>()

defineEmits<{
  (e: 'update:activeTab', value: 'image' | 'video'): void
  (e: 'refresh'): void
  (e: 'selectImage', index: number): void
  (e: 'selectVideo', index: number): void
  (e: 'update:editablePrompt', value: string): void
}>()

const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}
</script>

<style scoped>
.generator-tabs-wrapper {
  margin-bottom: var(--space-xl);
}

.tabs {
  display: flex;
  gap: var(--space-sm);
  margin-bottom: var(--space-xl);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: var(--space-md);
}

.tab {
  padding: var(--space-md) var(--space-xl);
  background: transparent;
  border: none;
  border-radius: var(--radius-md) var(--radius-md) 0 0;
  color: var(--text-secondary);
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: all var(--transition-base);
}

.tab:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.05);
}

.tab.active {
  color: var(--gold-primary);
  background: rgba(212, 175, 55, 0.1);
  border-bottom: 2px solid var(--gold-primary);
  margin-bottom: -1px;
}

.loading-prompts {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-3xl);
  gap: var(--space-md);
}

.loading-prompts p {
  color: var(--text-secondary);
  margin: 0;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(212, 175, 55, 0.2);
  border-top-color: var(--gold-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.prompt-section {
  margin-bottom: var(--space-xl);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-lg);
}

.section-header h4 {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  color: var(--text-primary);
  margin: 0;
}

.prompt-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}

.prompt-card {
  position: relative;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  cursor: pointer;
  transition: all var(--transition-base);
}

.prompt-card:hover {
  border-color: rgba(212, 175, 55, 0.5);
  transform: translateY(-2px);
}

.prompt-card.selected {
  border-color: var(--gold-primary);
  background: rgba(212, 175, 55, 0.1);
}

.prompt-number {
  position: absolute;
  top: var(--space-sm);
  left: var(--space-sm);
  width: 24px;
  height: 24px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
  color: var(--text-secondary);
}

.prompt-card.selected .prompt-number {
  background: var(--gold-primary);
  color: var(--text-on-gold);
}

.prompt-preview {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: var(--leading-relaxed);
  padding-left: var(--space-xl);
}

.selected-badge {
  position: absolute;
  bottom: var(--space-sm);
  right: var(--space-sm);
  font-size: var(--text-xs);
  color: var(--gold-primary);
  font-weight: var(--font-semibold);
}

.prompt-placeholder {
  text-align: center;
  padding: var(--space-3xl);
  background: rgba(0, 0, 0, 0.2);
  border-radius: var(--radius-md);
  border: 1px dashed rgba(255, 255, 255, 0.1);
}

.prompt-placeholder p {
  color: var(--text-muted);
  margin: 0;
}

.selected-prompt {
  margin-top: var(--space-lg);
}

.selected-prompt label {
  display: block;
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-secondary);
  margin-bottom: var(--space-sm);
}

.prompt-textarea {
  width: 100%;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
  resize: vertical;
  transition: border-color var(--transition-base);
}

.prompt-textarea:focus {
  outline: none;
  border-color: var(--gold-primary);
}

.prompt-textarea::placeholder {
  color: var(--text-muted);
}

@media (max-width: 768px) {
  .tabs {
    flex-direction: column;
  }

  .tab {
    text-align: center;
    border-radius: var(--radius-md);
  }

  .tab.active {
    border-bottom: none;
    border-left: 3px solid var(--gold-primary);
    margin-bottom: 0;
  }

  .prompt-grid {
    grid-template-columns: 1fr;
  }
}
</style>

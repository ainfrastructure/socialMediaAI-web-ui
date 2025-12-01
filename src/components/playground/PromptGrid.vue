<template>
  <div class="prompt-section">
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

    <!-- Loading State -->
    <div v-if="loading" class="loading-prompts">
      <div class="spinner"></div>
      <p>{{ $t('playground.generatingIdeas', 'Generating creative ideas with AI...') }}</p>
    </div>

    <template v-else>
      <!-- Prompts Grid -->
      <div v-if="prompts.length > 0" class="prompt-grid">
        <div
          v-for="(prompt, index) in prompts"
          :key="index"
          :class="['prompt-card', { selected: selectedIndex === index }]"
          @click="$emit('select', index)"
        >
          <div class="prompt-number">{{ index + 1 }}</div>
          <div class="prompt-preview">{{ truncateText(prompt, 120) }}</div>
          <div v-if="selectedIndex === index" class="selected-badge">✓ {{ $t('common.selected', 'Selected') }}</div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="prompt-placeholder">
        <p>{{ $t('playground.clickToGenerate', 'Click "Get New Ideas" to generate AI-powered prompts!') }}</p>
      </div>

      <!-- Selected Prompt Display (Editable) -->
      <div v-if="selectedPrompt" class="selected-prompt">
        <label>{{ $t('playground.selectedPrompt', 'Selected Prompt (editable)') }}:</label>
        <textarea
          :value="editablePrompt"
          @input="$emit('update:editablePrompt', ($event.target as HTMLTextAreaElement).value)"
          class="prompt-textarea"
          rows="5"
          :placeholder="$t('playground.selectPromptAbove', 'Select a prompt above...')"
        ></textarea>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import BaseButton from '../BaseButton.vue'

defineProps<{
  prompts: string[]
  selectedIndex: number | null
  selectedPrompt: string | null
  editablePrompt: string
  loading: boolean
}>()

defineEmits<{
  (e: 'select', index: number): void
  (e: 'refresh'): void
  (e: 'update:editablePrompt', value: string): void
}>()

const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}
</script>

<style scoped>
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
  .prompt-grid {
    grid-template-columns: 1fr;
  }
}
</style>

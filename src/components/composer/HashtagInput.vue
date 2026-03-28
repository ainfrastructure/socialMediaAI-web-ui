<template>
  <div class="hashtag-input-wrapper">
    <label class="hashtag-label">
      Hashtags
      <span v-if="hashtags.length > 0" class="hashtag-count">
        ({{ hashtags.length }})
      </span>
    </label>

    <!-- Current hashtags -->
    <div v-if="hashtags.length > 0" class="hashtag-tags" role="list" aria-label="Selected hashtags">
      <span
        v-for="(tag, idx) in hashtags"
        :key="tag"
        class="hashtag-tag"
        role="listitem"
      >
        {{ tag }}
        <button
          type="button"
          class="hashtag-remove"
          :aria-label="`Remove ${tag}`"
          @click="emit('remove', idx)"
        >
          ×
        </button>
      </span>
    </div>

    <!-- Input for new hashtag -->
    <div class="hashtag-input-row">
      <input
        v-model="newTag"
        type="text"
        class="hashtag-input"
        placeholder="Add hashtag and press Enter…"
        aria-label="Add hashtag"
        @keydown.enter.prevent="handleAdd"
        @keydown.,.prevent="handleAdd"
      />
    </div>

    <!-- Suggestions -->
    <div v-if="suggestions.length > 0" class="hashtag-suggestions">
      <span class="suggestions-label">Suggestions:</span>
      <button
        v-for="suggestion in suggestions"
        :key="suggestion.tag"
        type="button"
        :class="['suggestion-chip', `suggestion-${suggestion.relevance}`]"
        @click="handleSuggestionClick(suggestion.tag)"
      >
        {{ suggestion.tag }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { HashtagSuggestion } from '@/types/composer'

interface Props {
  hashtags: string[]
  suggestions?: HashtagSuggestion[]
}

withDefaults(defineProps<Props>(), {
  suggestions: () => [],
})

const emit = defineEmits<{
  (e: 'add', tag: string): void
  (e: 'remove', index: number): void
}>()

const newTag = ref('')

function handleAdd() {
  const value = newTag.value.trim()
  if (value) {
    emit('add', value)
    newTag.value = ''
  }
}

function handleSuggestionClick(tag: string) {
  emit('add', tag)
}
</script>

<style scoped>
.hashtag-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.hashtag-label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
  font-family: var(--font-body);
}

.hashtag-count {
  color: var(--text-muted);
  font-weight: var(--font-normal);
}

.hashtag-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}

.hashtag-tag {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-sm);
  background: var(--gold-subtle);
  color: var(--gold-primary);
  border: 1px solid var(--gold-primary);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  font-family: var(--font-body);
  transition: var(--transition-base);
}

.hashtag-tag:hover {
  background: var(--gold-primary);
  color: var(--text-on-gold);
}

.hashtag-remove {
  background: none;
  border: none;
  color: inherit;
  font-size: var(--text-lg);
  cursor: pointer;
  padding: 0;
  line-height: 1;
  opacity: 0.7;
  transition: opacity var(--transition-base);
  min-width: 20px;
  min-height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.hashtag-remove:hover {
  opacity: 1;
}

.hashtag-input-row {
  display: flex;
  gap: var(--space-sm);
}

.hashtag-input {
  flex: 1;
  padding: var(--space-md) var(--space-lg);
  background: var(--bg-tertiary);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--text-sm);
  font-family: var(--font-body);
  transition: var(--transition-base);
  outline: none;
}

.hashtag-input::placeholder {
  color: var(--text-muted);
}

.hashtag-input:hover:not(:disabled) {
  border-color: var(--border-hover);
  background: var(--bg-elevated);
}

.hashtag-input:focus {
  border-color: var(--gold-primary);
  background: var(--bg-secondary);
  box-shadow: 0 0 0 3px var(--accent-alpha-12);
}

.hashtag-suggestions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-xs);
  padding-top: var(--space-xs);
}

.suggestions-label {
  font-size: var(--text-xs);
  color: var(--text-muted);
  margin-right: var(--space-xs);
}

.suggestion-chip {
  padding: 2px var(--space-sm);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-family: var(--font-body);
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition-base);
}

.suggestion-chip:hover {
  background: var(--gold-subtle);
  border-color: var(--gold-primary);
  color: var(--gold-primary);
}

.suggestion-high {
  border-color: var(--gold-primary);
  color: var(--gold-primary);
}

.suggestion-medium {
  border-color: var(--border-hover);
}

/* Mobile */
@media (max-width: 768px) {
  .hashtag-tags {
    gap: var(--space-xs);
  }

  .hashtag-tag {
    font-size: var(--text-xs);
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .hashtag-tag,
  .hashtag-input,
  .suggestion-chip {
    transition: none;
  }
}
</style>

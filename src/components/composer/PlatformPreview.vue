<template>
  <div :class="['platform-preview', { 'over-limit': preview.isOverLimit }]">
    <!-- Header -->
    <div class="preview-header">
      <PlatformLogo :platform="platformLogoId" :size="28" />
      <div class="preview-header-info">
        <span class="preview-platform-name">{{ config.name }}</span>
        <CharacterCounter
          :current="preview.charCount"
          :max="preview.maxChars"
        />
      </div>
      <button
        v-if="allowOverride"
        type="button"
        :class="['override-toggle', { active: hasOverride }]"
        :aria-label="hasOverride ? 'Using custom text. Click to reset.' : 'Customize text for this platform'"
        :title="hasOverride ? 'Using custom text. Click to reset.' : 'Customize for this platform'"
        @click="handleOverrideToggle"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>

    <!-- Override editor -->
    <div v-if="hasOverride && allowOverride" class="override-editor">
      <textarea
        :value="overrideText"
        class="override-textarea"
        :placeholder="`Custom text for ${config.name}…`"
        rows="3"
        :aria-label="`Custom text for ${config.name}`"
        @input="handleOverrideInput"
      ></textarea>
      <button
        type="button"
        class="override-reset"
        @click="emit('clearOverride', preview.platform)"
      >
        Reset to shared text
      </button>
    </div>

    <!-- Preview body (phone-like mockup) -->
    <div class="preview-body">
      <!-- Image preview -->
      <div v-if="preview.imagePreviewUrls.length > 0" class="preview-images">
        <div
          v-if="preview.imagePreviewUrls.length === 1"
          class="preview-single-image"
        >
          <img
            :src="preview.imagePreviewUrls[0]"
            alt="Post image preview"
            class="preview-img"
          />
        </div>
        <div v-else class="preview-image-grid">
          <img
            v-for="(url, idx) in preview.imagePreviewUrls.slice(0, 4)"
            :key="idx"
            :src="url"
            :alt="`Post image ${idx + 1}`"
            class="preview-img-grid"
          />
          <div
            v-if="preview.imagePreviewUrls.length > 4"
            class="preview-more-images"
          >
            +{{ preview.imagePreviewUrls.length - 4 }}
          </div>
        </div>
      </div>

      <!-- Text preview -->
      <div class="preview-text">
        <p v-if="preview.text" class="preview-text-content">
          {{ truncatedText }}
        </p>
        <p v-else class="preview-text-placeholder">
          Your post text will appear here…
        </p>
      </div>
    </div>

    <!-- Over limit warning -->
    <div v-if="preview.isOverLimit" class="over-limit-warning" role="alert">
      <span class="warning-icon">⚠</span>
      <span>{{ preview.charCount - preview.maxChars }} characters over limit</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PlatformPreviewData, PlatformConfig, ComposerPlatform } from '@/types/composer'
import PlatformLogo from '@/components/PlatformLogo.vue'
import CharacterCounter from './CharacterCounter.vue'

interface Props {
  preview: PlatformPreviewData
  config: PlatformConfig
  overrideText?: string
  hasOverride?: boolean
  allowOverride?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  overrideText: '',
  hasOverride: false,
  allowOverride: true,
})

const emit = defineEmits<{
  (e: 'setOverride', platform: ComposerPlatform, text: string): void
  (e: 'clearOverride', platform: ComposerPlatform): void
}>()

// Map composer platform to PlatformLogo's expected type
const platformLogoId = computed(() => {
  return props.preview.platform as 'facebook' | 'instagram' | 'twitter' | 'linkedin'
})

const truncatedText = computed(() => {
  const text = props.preview.text
  if (text.length > 500) {
    return text.substring(0, 500) + '…'
  }
  return text
})

function handleOverrideToggle() {
  if (props.hasOverride) {
    emit('clearOverride', props.preview.platform)
  } else {
    // Initialize override with empty string so the editor opens
    emit('setOverride', props.preview.platform, '')
  }
}

function handleOverrideInput(event: Event) {
  const target = event.target as HTMLTextAreaElement
  emit('setOverride', props.preview.platform, target.value)
}
</script>

<style scoped>
.platform-preview {
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-lg);
  background: var(--bg-secondary);
  overflow: hidden;
  transition: var(--transition-base);
}

.platform-preview:hover {
  border-color: var(--border-hover);
  box-shadow: var(--shadow-md);
}

.platform-preview.over-limit {
  border-color: var(--error-border);
}

/* Header */
.preview-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-lg);
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-tertiary);
}

.preview-header-info {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
}

.preview-platform-name {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.override-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: var(--transition-base);
  flex-shrink: 0;
}

.override-toggle:hover {
  border-color: var(--gold-primary);
  color: var(--gold-primary);
  background: var(--gold-subtle);
}

.override-toggle.active {
  background: var(--gold-primary);
  border-color: var(--gold-primary);
  color: var(--text-on-gold);
}

/* Override editor */
.override-editor {
  padding: var(--space-md) var(--space-lg);
  background: var(--gold-subtle);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.override-textarea {
  width: 100%;
  padding: var(--space-md);
  background: var(--bg-secondary);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  resize: vertical;
  min-height: 60px;
  outline: none;
  transition: var(--transition-base);
}

.override-textarea:focus {
  border-color: var(--gold-primary);
  box-shadow: 0 0 0 3px var(--accent-alpha-12);
}

.override-reset {
  align-self: flex-end;
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: var(--text-xs);
  font-family: var(--font-body);
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
  transition: color var(--transition-base);
}

.override-reset:hover {
  color: var(--gold-primary);
}

/* Preview body */
.preview-body {
  padding: var(--space-lg);
}

.preview-images {
  margin-bottom: var(--space-md);
}

.preview-single-image {
  border-radius: var(--radius-md);
  overflow: hidden;
  aspect-ratio: 1;
  max-height: 200px;
}

.preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-image-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-xs);
  border-radius: var(--radius-md);
  overflow: hidden;
  position: relative;
}

.preview-img-grid {
  aspect-ratio: 1;
  object-fit: cover;
  width: 100%;
}

.preview-more-images {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 50%;
  height: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
}

.preview-text-content {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  color: var(--text-primary);
  line-height: var(--leading-relaxed);
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
}

.preview-text-placeholder {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  color: var(--text-muted);
  font-style: italic;
  margin: 0;
}

/* Over limit warning */
.over-limit-warning {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-lg);
  background: var(--error-bg);
  color: var(--error-text);
  font-size: var(--text-xs);
  font-family: var(--font-body);
  border-top: 1px solid var(--error-border);
}

.warning-icon {
  font-size: var(--text-sm);
}

/* Mobile */
@media (max-width: 768px) {
  .preview-header {
    padding: var(--space-sm) var(--space-md);
  }

  .preview-body {
    padding: var(--space-md);
  }

  .preview-single-image {
    max-height: 160px;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .platform-preview,
  .override-toggle,
  .override-textarea {
    transition: none;
  }
}
</style>

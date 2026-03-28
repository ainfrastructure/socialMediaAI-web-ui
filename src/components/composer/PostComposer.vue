<template>
  <div class="post-composer">
    <!-- Section: Platform Selection -->
    <section class="composer-section">
      <h3 class="section-title">Platforms</h3>
      <div class="platform-toggles" role="group" aria-label="Select platforms">
        <button
          v-for="platform in allPlatforms"
          :key="platform.id"
          type="button"
          :class="['platform-toggle', { active: selectedPlatforms.includes(platform.id) }]"
          :aria-pressed="selectedPlatforms.includes(platform.id)"
          :aria-label="`Toggle ${platform.name}`"
          @click="togglePlatform(platform.id)"
        >
          <span class="toggle-icon">{{ platform.icon }}</span>
          <span class="toggle-name">{{ platform.name }}</span>
          <span v-if="selectedPlatforms.includes(platform.id)" class="toggle-check">✓</span>
        </button>
      </div>
    </section>

    <!-- Section: Post Content -->
    <section class="composer-section">
      <div class="section-header">
        <h3 class="section-title">Post Content</h3>
        <div class="char-counters">
          <CharacterCounter
            v-for="preview in platformPreviews"
            :key="preview.platform"
            :current="preview.charCount"
            :max="preview.maxChars"
            :title="`${PLATFORM_CONFIGS[preview.platform].name}: ${preview.charCount}/${preview.maxChars}`"
          />
        </div>
      </div>

      <div class="text-editor">
        <textarea
          v-model="post.text"
          class="post-textarea"
          :placeholder="textareaPlaceholder"
          rows="5"
          aria-label="Post text"
        ></textarea>
        <div v-if="strictestCharLimit < Infinity" class="char-hint">
          <template v-if="hasOverLimitPlatform">
            <span class="char-hint-warning">⚠ Some platforms exceed their character limit</span>
          </template>
          <template v-else>
            Strictest limit: {{ strictestCharLimit }} chars
            <template v-if="selectedPlatforms.includes('twitter')">
              (X/Twitter)
            </template>
          </template>
        </div>
      </div>
    </section>

    <!-- Section: Image Upload -->
    <section class="composer-section">
      <h3 class="section-title">
        Images
        <span v-if="post.images.length > 0" class="section-badge">
          {{ post.images.length }}/{{ maxImagesAllowed }}
        </span>
      </h3>

      <!-- Upload area -->
      <div
        :class="['upload-area', { dragging: isDragging }]"
        role="button"
        tabindex="0"
        aria-label="Upload images. Drag and drop or click to browse."
        @dragenter.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @dragover.prevent
        @drop.prevent="handleDrop"
        @click="openFileDialog"
        @keydown.enter.prevent="openFileDialog"
        @keydown.space.prevent="openFileDialog"
      >
        <input
          ref="fileInputRef"
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          multiple
          class="file-input-hidden"
          @change="handleFileInput"
        />
        <span class="upload-icon">🖼️</span>
        <p class="upload-text">
          Drag & drop images or <span class="upload-highlight">click to browse</span>
        </p>
        <p class="upload-hint">
          Max {{ maxImagesAllowed }} images (JPEG, PNG, WebP)
        </p>
      </div>

      <!-- Image preview grid -->
      <div v-if="post.images.length > 0" class="image-preview-grid">
        <div
          v-for="(file, idx) in post.images"
          :key="file.name + file.lastModified"
          class="image-preview-item"
        >
          <img
            :src="getImagePreviewUrl(file)"
            :alt="file.name"
            class="image-thumb"
          />
          <button
            type="button"
            class="image-remove"
            :aria-label="`Remove ${file.name}`"
            @click="removeImage(idx)"
          >
            ×
          </button>
        </div>
      </div>

      <!-- Upload error -->
      <BaseAlert
        v-if="uploadError"
        v-model="showUploadError"
        type="error"
        :message="uploadError"
      />
    </section>

    <!-- Section: Hashtags -->
    <section class="composer-section">
      <HashtagInput
        :hashtags="post.hashtags"
        :suggestions="hashtagSuggestions"
        @add="addHashtag"
        @remove="removeHashtag"
      />
    </section>

    <!-- Section: Platform Previews -->
    <section v-if="selectedPlatforms.length > 0" class="composer-section">
      <h3 class="section-title">Platform Previews</h3>
      <div class="preview-grid">
        <PlatformPreview
          v-for="preview in platformPreviews"
          :key="preview.platform"
          :preview="preview"
          :config="PLATFORM_CONFIGS[preview.platform]"
          :has-override="!!post.platformOverrides[preview.platform]"
          :override-text="post.platformOverrides[preview.platform]?.text ?? ''"
          @set-override="setPlatformOverride"
          @clear-override="clearPlatformOverride"
        />
      </div>
    </section>

    <!-- Validation errors -->
    <BaseAlert
      v-if="validationErrors.length > 0"
      :model-value="true"
      type="error"
    >
      <ul class="validation-errors">
        <li v-for="error in validationErrors" :key="error">{{ error }}</li>
      </ul>
    </BaseAlert>

    <!-- Actions -->
    <div class="composer-actions">
      <BaseButton variant="ghost" @click="handleReset">
        Clear
      </BaseButton>
      <BaseButton
        variant="primary"
        :disabled="!canSubmit"
        @click="handleSubmit"
      >
        Compose Post
      </BaseButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ComposerPlatform } from '@/types/composer'
import { usePostComposer } from '@/composables/usePostComposer'
import BaseButton from '@/components/BaseButton.vue'
import BaseAlert from '@/components/BaseAlert.vue'
import CharacterCounter from './CharacterCounter.vue'
import HashtagInput from './HashtagInput.vue'
import PlatformPreview from './PlatformPreview.vue'

interface Props {
  initialPlatforms?: ComposerPlatform[]
}

const props = withDefaults(defineProps<Props>(), {
  initialPlatforms: () => ['instagram', 'facebook'],
})

const emit = defineEmits<{
  (e: 'submit', data: {
    text: string
    hashtags: string[]
    images: File[]
    platforms: ComposerPlatform[]
    platformOverrides: Partial<Record<ComposerPlatform, { text: string }>>
  }): void
  (e: 'reset'): void
}>()

const {
  post,
  selectedPlatforms,
  platformPreviews,
  hasOverLimitPlatform,
  strictestCharLimit,
  maxImagesAllowed,
  hashtagSuggestions,
  togglePlatform,
  setPlatformOverride,
  clearPlatformOverride,
  addHashtag,
  removeHashtag,
  addImages,
  removeImage,
  getImagePreviewUrl,
  reset,
  validate,
  PLATFORM_CONFIGS,
} = usePostComposer(props.initialPlatforms)

// All available platforms
const allPlatforms = computed(() => [
  PLATFORM_CONFIGS.instagram,
  PLATFORM_CONFIGS.facebook,
  PLATFORM_CONFIGS.twitter,
  PLATFORM_CONFIGS.linkedin,
])

// File input ref
const fileInputRef = ref<HTMLInputElement | null>(null)

// Drag state
const isDragging = ref(false)

// Upload error state
const uploadError = ref('')
const showUploadError = ref(false)

// Validation
const validationErrors = ref<string[]>([])

const canSubmit = computed(() => {
  return (
    selectedPlatforms.value.length > 0 &&
    (post.value.text.trim().length > 0 || post.value.hashtags.length > 0) &&
    !hasOverLimitPlatform.value
  )
})

const textareaPlaceholder = computed(() => {
  if (selectedPlatforms.value.length === 0) {
    return 'Select a platform first…'
  }
  const names = selectedPlatforms.value
    .map((id) => PLATFORM_CONFIGS[id].name)
    .join(', ')
  return `Write your post for ${names}…`
})

function openFileDialog() {
  fileInputRef.value?.click()
}

function handleFileInput(event: Event) {
  const target = event.target as HTMLInputElement
  const files = Array.from(target.files ?? [])
  if (files.length > 0) {
    const error = addImages(files)
    if (error) {
      uploadError.value = error
      showUploadError.value = true
    }
  }
  // Reset input to allow re-uploading same file
  target.value = ''
}

function handleDrop(event: DragEvent) {
  isDragging.value = false
  const files = Array.from(event.dataTransfer?.files ?? [])
  if (files.length > 0) {
    const error = addImages(files)
    if (error) {
      uploadError.value = error
      showUploadError.value = true
    }
  }
}

function handleSubmit() {
  const errors = validate()
  if (errors.length > 0) {
    validationErrors.value = errors
    return
  }

  validationErrors.value = []
  emit('submit', {
    text: post.value.text,
    hashtags: post.value.hashtags,
    images: post.value.images,
    platforms: [...selectedPlatforms.value],
    platformOverrides: { ...post.value.platformOverrides },
  })
}

function handleReset() {
  reset()
  validationErrors.value = []
  uploadError.value = ''
  showUploadError.value = false
  emit('reset')
}
</script>

<style scoped>
.post-composer {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xl);
  max-width: 900px;
}

/* Section styles */
.composer-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.section-title {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.section-badge {
  font-family: var(--font-body);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--text-muted);
  background: var(--bg-tertiary);
  padding: 2px var(--space-sm);
  border-radius: var(--radius-sm);
}

.char-counters {
  display: flex;
  gap: var(--space-md);
}

/* Platform toggles */
.platform-toggles {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.platform-toggle {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-lg);
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition-base);
  user-select: none;
}

.platform-toggle:hover {
  border-color: var(--border-hover);
  background: var(--bg-elevated);
}

.platform-toggle.active {
  border-color: var(--gold-primary);
  background: var(--gold-subtle);
  color: var(--gold-primary);
}

.toggle-icon {
  font-size: var(--text-lg);
}

.toggle-name {
  white-space: nowrap;
}

.toggle-check {
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
  color: var(--gold-primary);
}

/* Text editor */
.text-editor {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.post-textarea {
  width: 100%;
  padding: var(--space-lg);
  background: var(--bg-tertiary);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: var(--text-base);
  line-height: var(--leading-relaxed);
  resize: vertical;
  min-height: 140px;
  outline: none;
  transition: var(--transition-base);
}

.post-textarea::placeholder {
  color: var(--text-muted);
}

.post-textarea:hover:not(:disabled) {
  border-color: var(--border-hover);
  background: var(--bg-elevated);
}

.post-textarea:focus {
  border-color: var(--gold-primary);
  background: var(--bg-secondary);
  box-shadow: 0 0 0 3px var(--accent-alpha-12);
}

.char-hint {
  font-size: var(--text-xs);
  color: var(--text-muted);
  font-family: var(--font-body);
  text-align: right;
}

.char-hint-warning {
  color: var(--warning-text);
  font-weight: var(--font-medium);
}

/* Upload area */
.upload-area {
  position: relative;
  padding: var(--space-2xl);
  border: 2px dashed var(--border-color);
  border-radius: var(--radius-lg);
  background: var(--bg-secondary);
  text-align: center;
  cursor: pointer;
  transition: var(--transition-base);
}

.upload-area:hover,
.upload-area.dragging {
  border-color: var(--gold-primary);
  background: var(--gold-subtle);
}

.file-input-hidden {
  display: none;
}

.upload-icon {
  font-size: var(--text-4xl);
  display: block;
  margin-bottom: var(--space-sm);
}

.upload-text {
  font-size: var(--text-sm);
  color: var(--text-primary);
  margin: 0 0 var(--space-xs);
}

.upload-highlight {
  color: var(--gold-primary);
  font-weight: var(--font-medium);
}

.upload-hint {
  font-size: var(--text-xs);
  color: var(--text-muted);
  margin: 0;
}

/* Image preview grid */
.image-preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: var(--space-sm);
}

.image-preview-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--bg-tertiary);
  border: var(--border-width) solid var(--border-color);
  transition: var(--transition-base);
}

.image-preview-item:hover {
  border-color: var(--gold-primary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.image-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-remove {
  position: absolute;
  top: var(--space-xs);
  right: var(--space-xs);
  width: 24px;
  height: 24px;
  border-radius: var(--radius-full);
  background: rgba(0, 0, 0, 0.6);
  border: none;
  color: white;
  font-size: var(--text-lg);
  line-height: 1;
  cursor: pointer;
  opacity: 0;
  transition: var(--transition-base);
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-preview-item:hover .image-remove {
  opacity: 1;
}

.image-remove:hover {
  background: var(--error-text);
  transform: scale(1.1);
}

/* Preview grid */
.preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-lg);
}

/* Validation errors */
.validation-errors {
  margin: 0;
  padding: 0 0 0 var(--space-lg);
  list-style: disc;
}

.validation-errors li {
  margin-bottom: var(--space-xs);
}

.validation-errors li:last-child {
  margin-bottom: 0;
}

/* Actions */
.composer-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-md);
  padding-top: var(--space-lg);
  border-top: 1px solid var(--border-color);
}

/* Mobile */
@media (max-width: 768px) {
  .post-composer {
    gap: var(--space-xl);
  }

  .platform-toggles {
    gap: var(--space-xs);
  }

  .platform-toggle {
    padding: var(--space-sm) var(--space-md);
    font-size: var(--text-xs);
    min-height: var(--touch-target-min);
  }

  .preview-grid {
    grid-template-columns: 1fr;
  }

  .image-preview-grid {
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  }

  .composer-actions {
    flex-direction: column;
  }

  .composer-actions .base-button {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .platform-toggle .toggle-name {
    display: none;
  }

  .toggle-icon {
    font-size: var(--text-2xl);
  }

  .post-textarea {
    min-height: 120px;
    font-size: var(--text-sm);
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .platform-toggle,
  .post-textarea,
  .upload-area,
  .image-preview-item,
  .image-remove {
    transition: none;
  }
}
</style>

<script setup lang="ts">
import { computed, watch, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseButton from './BaseButton.vue'
import BaseCard from './BaseCard.vue'
import { useFacebookStore } from '@/stores/facebook'
import SocialChefLogo from '@/assets/socialchef_logo.svg'

const { t } = useI18n()

const props = defineProps<{
  modelValue: boolean
  imageUrl?: string
  postContent?: {
    postText: string
    hashtags: string[]
    callToAction: string
  }
  isGeneratingImage?: boolean
  isGeneratingContent?: boolean
  isPublishing?: boolean
  isPublished?: boolean
  facebookPostUrl?: string
  generationError?: string | null
  facebookReconnectRequired?: boolean
}>()

// Debug logging
watch(() => props.postContent, (newVal) => {
  console.log('[MODAL] postContent prop changed:', newVal)
}, { deep: true })

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'publish'): void
  (e: 'schedule'): void
  (e: 'connectFacebook'): void
  (e: 'retry'): void
  (e: 'contentUpdated', content: { postText: string; hashtags: string[]; callToAction: string }): void
}>()

// Edit state
const isEditing = ref(false)
const editedPostText = ref('')
const editedHashtags = ref<string[]>([])
const editedCallToAction = ref('')
const newHashtag = ref('')

// Initialize edit fields when postContent changes
watch(() => props.postContent, (content) => {
  if (content) {
    editedPostText.value = content.postText || ''
    editedHashtags.value = [...(content.hashtags || [])]
    editedCallToAction.value = content.callToAction || ''
  }
}, { immediate: true, deep: true })

// Reset edit state when modal closes
watch(() => props.modelValue, (isOpen) => {
  if (!isOpen) {
    isEditing.value = false
    newHashtag.value = ''
  }
})

// Edit functions
const toggleEditMode = () => {
  if (props.postContent) {
    editedPostText.value = props.postContent.postText || ''
    editedHashtags.value = [...(props.postContent.hashtags || [])]
    editedCallToAction.value = props.postContent.callToAction || ''
    newHashtag.value = ''
  }
  isEditing.value = true
}

const cancelEdits = () => {
  if (props.postContent) {
    editedPostText.value = props.postContent.postText || ''
    editedHashtags.value = [...(props.postContent.hashtags || [])]
    editedCallToAction.value = props.postContent.callToAction || ''
  }
  isEditing.value = false
  newHashtag.value = ''
}

const addHashtag = () => {
  const tag = newHashtag.value.trim().replace(/^#/, '')
  if (tag && !editedHashtags.value.includes(`#${tag}`)) {
    editedHashtags.value.push(`#${tag}`)
  }
  newHashtag.value = ''
}

const removeHashtag = (index: number) => {
  editedHashtags.value.splice(index, 1)
}

const saveEdits = () => {
  emit('contentUpdated', {
    postText: editedPostText.value,
    hashtags: editedHashtags.value,
    callToAction: editedCallToAction.value
  })
  isEditing.value = false
}

const facebookStore = useFacebookStore()

const hasConnectedFacebook = computed(() => {
  return facebookStore.connectedPages.length > 0
})

const isGenerationComplete = computed(() => {
  return !props.isGeneratingImage && !props.isGeneratingContent && props.imageUrl && props.postContent
})

function close() {
  emit('update:modelValue', false)
}

function handlePublish() {
  emit('publish')
}

function handleSchedule() {
  emit('schedule')
}

function handleConnectFacebook() {
  emit('connectFacebook')
}

function handleRetry() {
  emit('retry')
}
</script>

<template>
  <Transition name="modal">
    <div v-if="modelValue" class="modal-overlay" @click.self="close">
      <BaseCard variant="glass-intense" class="result-modal">
        <!-- Close Button -->
        <button class="close-button" @click="close" title="Close">
          ✕
        </button>

        <!-- Header -->
        <div class="modal-header">
          <div class="success-icon" v-if="!generationError || isGenerationComplete">✨</div>
          <div class="error-icon" v-else-if="generationError && !isGenerationComplete">⚠️</div>
          <h2 class="modal-title">
            {{ (generationError && !isGenerationComplete) ? 'Generation Failed' : (isGenerationComplete ? 'Your Post is Ready!' : 'Cooking Up Your Post...') }}
          </h2>
          <p class="modal-subtitle">
            {{ (generationError && !isGenerationComplete) ? generationError : (isGenerationComplete ? 'Choose what to do with your generated content' : 'Hang tight while we prepare everything') }}
          </p>
        </div>

        <!-- Published Success Banner -->
        <div v-if="isPublished" class="success-banner">
          <div class="success-banner-content">
            <span class="success-icon-large">🎉</span>
            <div class="success-text">
              <h3 class="success-title">Published Successfully!</h3>
              <p class="success-message">
                Your post has been published to
                <a
                  v-if="facebookPostUrl"
                  :href="facebookPostUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="facebook-link"
                >
                  Facebook
                </a>
                <span v-else class="facebook-highlight">Facebook</span>
              </p>
            </div>
          </div>
        </div>

        <!-- Generated Image or Loading State -->
        <div class="image-preview">
          <img v-if="imageUrl" :src="imageUrl" alt="Generated post" class="preview-image" />
          <div v-else-if="isGeneratingImage" class="image-loading">
            <div class="bouncing-logo">
              <img :src="SocialChefLogo" alt="Social Chef" class="logo-image" />
            </div>
            <p class="loading-text">Generating image...</p>
          </div>
        </div>

        <!-- Post Content Preview or Loading State -->
        <div class="post-content-preview">
          <div v-if="postContent" class="content-sections">
            <!-- Content Header with Edit Button -->
            <div class="content-header">
              <span class="content-header-title">Generated Content</span>
              <BaseButton
                v-if="!isEditing && isGenerationComplete"
                variant="secondary"
                size="small"
                @click="toggleEditMode"
              >
                ✏️ Edit
              </BaseButton>
            </div>

            <!-- Display Mode -->
            <template v-if="!isEditing">
              <div class="content-section">
                <h3 class="content-label">Post Text</h3>
                <p class="post-text">{{ postContent.postText }}</p>
              </div>

              <div v-if="postContent.hashtags.length > 0" class="content-section">
                <h3 class="content-label">Hashtags</h3>
                <div class="hashtags">
                  <span v-for="(tag, idx) in postContent.hashtags" :key="idx" class="hashtag">
                    {{ tag }}
                  </span>
                </div>
              </div>

              <div v-if="postContent.callToAction" class="content-section">
                <h3 class="content-label">Call to Action</h3>
                <p class="cta-text">{{ postContent.callToAction }}</p>
              </div>
            </template>

            <!-- Edit Mode -->
            <template v-else>
              <div class="edit-field">
                <label class="edit-label">Post Text</label>
                <textarea
                  v-model="editedPostText"
                  class="edit-textarea"
                  rows="4"
                  placeholder="Enter post text..."
                ></textarea>
              </div>

              <div class="edit-field">
                <label class="edit-label">Hashtags</label>
                <div class="hashtag-editor">
                  <div class="hashtag-tags">
                    <span
                      v-for="(tag, idx) in editedHashtags"
                      :key="idx"
                      class="hashtag-tag"
                    >
                      {{ tag }}
                      <button @click="removeHashtag(idx)" class="remove-tag">&times;</button>
                    </span>
                  </div>
                  <input
                    v-model="newHashtag"
                    @keydown.enter.prevent="addHashtag"
                    @keydown.,.prevent="addHashtag"
                    placeholder="Add hashtag and press Enter..."
                    class="hashtag-input"
                  />
                </div>
              </div>

              <div class="edit-field">
                <label class="edit-label">Call to Action</label>
                <input
                  v-model="editedCallToAction"
                  type="text"
                  class="edit-input"
                  placeholder="Enter call to action..."
                />
              </div>

              <div class="edit-actions">
                <BaseButton
                  variant="ghost"
                  size="small"
                  @click="cancelEdits"
                >
                  Cancel
                </BaseButton>
                <BaseButton
                  variant="primary"
                  size="small"
                  @click="saveEdits"
                >
                  Save Changes
                </BaseButton>
              </div>
            </template>
          </div>

          <div v-else-if="isGeneratingContent" class="content-loading">
            <div class="spinner"></div>
            <p class="loading-text">Generating post content...</p>
          </div>
        </div>

        <!-- Error Actions - Show Retry Button (only if generation failed AND no content was generated) -->
        <div v-if="generationError && !isGenerationComplete" class="modal-actions">
          <BaseButton
            variant="primary"
            size="large"
            full-width
            @click="handleRetry"
          >
            🔄 Try Again
          </BaseButton>
          <BaseButton
            variant="secondary"
            size="large"
            full-width
            @click="close"
          >
            Cancel
          </BaseButton>
        </div>

        <!-- Action Buttons (only show when generation is complete and no error) -->
        <div v-else-if="isGenerationComplete" class="modal-actions">
          <!-- Facebook reconnection required - show reconnect button -->
          <div v-if="facebookReconnectRequired" class="reconnect-section">
            <p class="reconnect-message">{{ t('contentCreate.facebookReconnectMessage') }}</p>
            <BaseButton
              variant="primary"
              size="large"
              full-width
              @click="handleConnectFacebook"
            >
              🔗 {{ t('contentCreate.reconnectFacebook') }}
            </BaseButton>
          </div>

          <!-- Post is auto-saved, show publish/schedule options -->
          <div v-else-if="hasConnectedFacebook" class="action-row">
            <BaseButton
              variant="primary"
              size="medium"
              @click="handlePublish"
              :disabled="isPublishing"
              class="action-button"
            >
              {{ isPublishing ? '⏳ Publishing...' : '📤 Publish Now' }}
            </BaseButton>

            <BaseButton
              variant="secondary"
              size="medium"
              @click="handleSchedule"
              :disabled="isPublishing"
              class="action-button"
            >
              📅 Schedule Post
            </BaseButton>
          </div>

          <BaseButton
            v-else
            variant="primary"
            size="large"
            full-width
            @click="handleConnectFacebook"
          >
            🔗 Connect Facebook to Post
          </BaseButton>
        </div>
      </BaseCard>
    </div>
  </Transition>
</template>

<style scoped>
/* Modal Overlay */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-xl);
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  overflow-y: auto;
}

/* Result Modal */
.result-modal {
  position: relative;
  max-width: 700px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  padding: var(--space-3xl);
  animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(40px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Close Button */
.close-button {
  position: absolute;
  top: var(--space-lg);
  right: var(--space-lg);
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  font-size: var(--text-2xl);
  cursor: pointer;
  transition: var(--transition-base);
  z-index: 10;
}

.close-button:hover {
  background: var(--bg-elevated);
  color: var(--text-primary);
}

/* Modal Header */
.modal-header {
  text-align: center;
  margin-bottom: var(--space-3xl);
}

/* Success Banner */
.success-banner {
  margin-bottom: var(--space-xl);
  padding: var(--space-lg);
  background: var(--success-bg);
  border: 2px solid var(--success-border);
  border-radius: var(--radius-lg);
  animation: slideDown 0.4s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.success-banner-content {
  display: flex;
  align-items: flex-start;
  gap: var(--space-lg);
}

.success-icon-large {
  font-size: var(--text-4xl);
  flex-shrink: 0;
}

.success-text {
  flex: 1;
}

.success-title {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  color: var(--success-text);
  margin: 0 0 var(--space-xs) 0;
}

.success-message {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: 0;
}

.facebook-highlight {
  color: var(--gold-primary);
  font-weight: var(--font-semibold);
}

.facebook-link {
  color: var(--gold-primary);
  font-weight: var(--font-bold);
  text-decoration: underline;
  cursor: pointer;
  transition: var(--transition-base);
}

.facebook-link:hover {
  color: var(--gold-light);
  text-decoration: underline;
}

.success-icon {
  font-size: 64px;
  margin-bottom: var(--space-lg);
  animation: celebrate 0.6s ease-in-out;
}

.error-icon {
  font-size: 64px;
  margin-bottom: var(--space-lg);
  filter: drop-shadow(0 0 10px rgba(255, 100, 100, 0.5));
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(5px); }
}

@keyframes celebrate {
  0%, 100% { transform: scale(1) rotate(0deg); }
  25% { transform: scale(1.2) rotate(-10deg); }
  50% { transform: scale(1.1) rotate(10deg); }
  75% { transform: scale(1.2) rotate(-5deg); }
}

.loading-icon {
  margin-bottom: var(--space-lg);
  animation: bounce 1s ease-in-out infinite;
}

.loading-icon .logo-image {
  width: 80px;
  height: 80px;
  object-fit: contain;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}

.modal-title {
  font-family: var(--font-heading);
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  margin: 0 0 var(--space-sm) 0;
  background: var(--gradient-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.modal-subtitle {
  font-size: var(--text-base);
  color: var(--text-secondary);
  margin: 0;
}

/* Image Preview */
.image-preview {
  margin-bottom: var(--space-3xl);
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

.image-loading {
  min-height: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-lg);
  background: var(--bg-secondary);
}

.bouncing-logo {
  animation: bounce 1s ease-in-out infinite;
}

.bouncing-logo .logo-image {
  width: 100px;
  height: 100px;
  object-fit: contain;
}

.loading-text {
  color: var(--text-secondary);
  font-size: var(--text-base);
  margin: 0;
}

/* Post Content Preview */
.post-content-preview {
  margin-bottom: var(--space-3xl);
  padding: var(--space-xl);
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  border: var(--border-width) solid var(--border-color);
  min-height: 200px;
}

.content-sections {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.content-loading {
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border-color);
  border-top-color: var(--gold-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.content-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.content-label {
  font-family: var(--font-heading);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--gold-primary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0;
}

.post-text {
  font-size: var(--text-base);
  color: var(--text-primary);
  line-height: var(--leading-normal);
  margin: 0;
  white-space: pre-wrap;
}

.hashtags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.hashtag {
  padding: var(--space-xs) var(--space-md);
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: var(--gold-primary);
  font-weight: var(--font-medium);
}

.cta-text {
  font-size: var(--text-base);
  color: var(--text-secondary);
  margin: 0;
  font-style: italic;
}

/* Content Header */
.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-md);
  padding-bottom: var(--space-md);
  border-bottom: 1px solid rgba(212, 175, 55, 0.2);
}

.content-header-title {
  font-family: var(--font-heading);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Edit Field Styles */
.edit-field {
  margin-bottom: var(--space-lg);
}

.edit-field:last-of-type {
  margin-bottom: 0;
}

.edit-label {
  display: block;
  font-family: var(--font-heading);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--gold-primary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: var(--space-sm);
}

.edit-textarea,
.edit-input {
  width: 100%;
  padding: var(--space-md);
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: var(--text-base);
  transition: all 0.2s ease;
  resize: vertical;
}

.edit-textarea:focus,
.edit-input:focus {
  outline: none;
  border-color: var(--gold-primary);
  background: rgba(0, 0, 0, 0.5);
}

/* Hashtag Editor */
.hashtag-editor {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  transition: all 0.2s ease;
}

.hashtag-editor:focus-within {
  border-color: var(--gold-primary);
  background: rgba(0, 0, 0, 0.5);
}

.hashtag-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  margin-bottom: var(--space-sm);
}

.hashtag-tag {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-sm);
  background: rgba(212, 175, 55, 0.15);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: var(--radius-full);
  color: var(--gold-primary);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
}

.remove-tag {
  background: none;
  border: none;
  color: var(--gold-primary);
  font-size: var(--text-base);
  cursor: pointer;
  padding: 0;
  line-height: 1;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.remove-tag:hover {
  opacity: 1;
}

.hashtag-input {
  width: 100%;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: var(--text-base);
  padding: var(--space-xs) 0;
}

.hashtag-input:focus {
  outline: none;
}

.hashtag-input::placeholder {
  color: var(--text-muted);
}

/* Edit Actions */
.edit-actions {
  display: flex;
  gap: var(--space-md);
  justify-content: flex-end;
  margin-top: var(--space-lg);
  padding-top: var(--space-md);
  border-top: 1px solid rgba(212, 175, 55, 0.1);
}

/* Modal Actions */
.modal-actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.action-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-md);
}

.action-button {
  width: 100%;
}

.reconnect-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  padding: var(--space-lg);
  background: var(--warning-bg);
  border: 1px solid var(--warning-border);
  border-radius: var(--radius-md);
}

.reconnect-message {
  color: var(--warning-text);
  font-size: var(--text-sm);
  text-align: center;
  margin: 0;
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .result-modal {
  animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-leave-active .result-modal {
  animation: slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideDown {
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateY(40px) scale(0.95);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .modal-overlay {
    padding: var(--space-lg);
  }

  .result-modal {
    padding: var(--space-2xl);
  }

  .modal-title {
    font-size: var(--text-2xl);
  }

  .success-icon {
    font-size: 48px;
  }

  .action-row {
    grid-template-columns: 1fr;
  }

  .post-content-preview {
    padding: var(--space-lg);
  }
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  .result-modal,
  .success-icon,
  .modal-enter-active .result-modal,
  .modal-leave-active .result-modal {
    animation: none;
  }
}
</style>

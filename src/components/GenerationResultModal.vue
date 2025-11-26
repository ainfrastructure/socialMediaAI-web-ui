<script setup lang="ts">
import { computed } from 'vue'
import BaseButton from './BaseButton.vue'
import BaseCard from './BaseCard.vue'
import { useFacebookStore } from '@/stores/facebook'

const props = defineProps<{
  modelValue: boolean
  imageUrl?: string
  postContent?: {
    postText: string
    hashtags: string[]
    callToAction: string
  }
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save'): void
  (e: 'publish'): void
  (e: 'schedule'): void
  (e: 'connectFacebook'): void
}>()

const facebookStore = useFacebookStore()

const hasConnectedFacebook = computed(() => {
  return facebookStore.connectedPages.length > 0
})

function close() {
  emit('update:modelValue', false)
}

function handleSave() {
  emit('save')
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
</script>

<template>
  <Transition name="modal">
    <div v-if="modelValue" class="modal-overlay" @click.self="close">
      <BaseCard variant="glass-intense" class="result-modal">
        <!-- Close Button -->
        <button class="close-button" @click="close" title="Close">
          ✕
        </button>

        <!-- Success Header -->
        <div class="modal-header">
          <div class="success-icon">✨</div>
          <h2 class="modal-title">Your Post is Ready!</h2>
          <p class="modal-subtitle">Choose what to do with your generated content</p>
        </div>

        <!-- Generated Image -->
        <div v-if="imageUrl" class="image-preview">
          <img :src="imageUrl" alt="Generated post" class="preview-image" />
        </div>

        <!-- Post Content Preview -->
        <div v-if="postContent" class="post-content-preview">
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
        </div>

        <!-- Action Buttons -->
        <div class="modal-actions">
          <BaseButton
            variant="secondary"
            size="large"
            full-width
            @click="handleSave"
          >
            ⭐ Save to Favorites
          </BaseButton>

          <div v-if="hasConnectedFacebook" class="action-row">
            <BaseButton
              variant="primary"
              size="medium"
              @click="handlePublish"
              class="action-button"
            >
              📤 Publish Now
            </BaseButton>

            <BaseButton
              variant="secondary"
              size="medium"
              @click="handleSchedule"
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

.success-icon {
  font-size: 64px;
  margin-bottom: var(--space-lg);
  animation: celebrate 0.6s ease-in-out;
}

@keyframes celebrate {
  0%, 100% { transform: scale(1) rotate(0deg); }
  25% { transform: scale(1.2) rotate(-10deg); }
  50% { transform: scale(1.1) rotate(10deg); }
  75% { transform: scale(1.2) rotate(-5deg); }
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

/* Post Content Preview */
.post-content-preview {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  margin-bottom: var(--space-3xl);
  padding: var(--space-xl);
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  border: var(--border-width) solid var(--border-color);
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

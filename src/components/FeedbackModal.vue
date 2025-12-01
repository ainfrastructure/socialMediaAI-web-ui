<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseModal from './BaseModal.vue'
import BaseButton from './BaseButton.vue'
import MaterialIcon from './MaterialIcon.vue'

const { t } = useI18n()

const props = defineProps<{
  modelValue: boolean
  favoritePostId?: string
  imageUrl?: string
  postContent?: {
    postText: string
    hashtags: string[]
  }
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'submit', feedback: FeedbackData): void
  (e: 'skip'): void
  (e: 'close'): void
}>()

interface FeedbackData {
  imageRating: number | null
  contentRating: number | null
  hashtagsRating: number | null
  additionalFeedback: string
}

// Rating state
const imageRating = ref<number | null>(null)
const contentRating = ref<number | null>(null)
const hashtagsRating = ref<number | null>(null)
const additionalFeedback = ref('')

// Hover state for star ratings
const imageHover = ref<number | null>(null)
const contentHover = ref<number | null>(null)
const hashtagsHover = ref<number | null>(null)

// Check if all ratings are provided (required)
const hasAllRatings = computed(() => {
  return imageRating.value !== null && contentRating.value !== null && hashtagsRating.value !== null
})

// Rating label
const getRatingLabel = (rating: number | null): string => {
  if (!rating) return ''
  return t(`feedback.ratingLabels.${rating}`)
}

// Set rating
const setImageRating = (rating: number) => {
  imageRating.value = imageRating.value === rating ? null : rating
}

const setContentRating = (rating: number) => {
  contentRating.value = contentRating.value === rating ? null : rating
}

const setHashtagsRating = (rating: number) => {
  hashtagsRating.value = hashtagsRating.value === rating ? null : rating
}

// Submit feedback
const handleSubmit = () => {
  const feedback: FeedbackData = {
    imageRating: imageRating.value,
    contentRating: contentRating.value,
    hashtagsRating: hashtagsRating.value,
    additionalFeedback: additionalFeedback.value.trim(),
  }
  emit('submit', feedback)
  resetForm()
}

// Skip feedback
const handleSkip = () => {
  emit('skip')
  resetForm()
}

// Close modal
const close = () => {
  emit('update:modelValue', false)
  emit('close')
  resetForm()
}

// Reset form
const resetForm = () => {
  imageRating.value = null
  contentRating.value = null
  hashtagsRating.value = null
  additionalFeedback.value = ''
  imageHover.value = null
  contentHover.value = null
  hashtagsHover.value = null
}
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    size="md"
    :show-close-button="true"
    card-variant="glass-intense"
    @update:model-value="(val: boolean) => !val && close()"
    @close="close"
  >
    <div class="feedback-modal">
      <!-- Header -->
      <div class="feedback-header">
        <div class="feedback-icon">
          <MaterialIcon icon="star_rate" size="3xl" />
        </div>
        <h2 class="feedback-title">{{ $t('feedback.title') }}</h2>
        <p class="feedback-subtitle">{{ $t('feedback.subtitle') }}</p>
      </div>

      <!-- Preview Section -->
      <div v-if="imageUrl || postContent" class="preview-section">
        <img v-if="imageUrl" :src="imageUrl" alt="Generated post" class="preview-image" />
        <div v-if="postContent" class="preview-content">
          <p class="preview-text">{{ postContent.postText.substring(0, 100) }}{{ postContent.postText.length > 100 ? '...' : '' }}</p>
          <div v-if="postContent.hashtags.length > 0" class="preview-hashtags">
            <span v-for="(tag, idx) in postContent.hashtags.slice(0, 3)" :key="idx" class="preview-hashtag">
              {{ tag }}
            </span>
            <span v-if="postContent.hashtags.length > 3" class="preview-more">+{{ postContent.hashtags.length - 3 }}</span>
          </div>
        </div>
      </div>

      <!-- Rating Sections -->
      <div class="rating-sections">
        <!-- Image Rating -->
        <div class="rating-section">
          <label class="rating-label">
            <MaterialIcon icon="image" size="md" class="rating-icon" />
            {{ $t('feedback.imageQuality') }}
          </label>
          <div class="stars-container">
            <div class="stars">
              <button
                v-for="star in 5"
                :key="`image-${star}`"
                type="button"
                class="star"
                :class="{
                  filled: star <= (imageHover || imageRating || 0),
                  active: star <= (imageRating || 0)
                }"
                @click="setImageRating(star)"
                @mouseenter="imageHover = star"
                @mouseleave="imageHover = null"
              >
                ★
              </button>
            </div>
            <span v-if="imageRating" class="rating-text">{{ getRatingLabel(imageRating) }}</span>
          </div>
        </div>

        <!-- Content Rating -->
        <div class="rating-section">
          <label class="rating-label">
            <MaterialIcon icon="article" size="md" class="rating-icon" />
            {{ $t('feedback.contentQuality') }}
          </label>
          <div class="stars-container">
            <div class="stars">
              <button
                v-for="star in 5"
                :key="`content-${star}`"
                type="button"
                class="star"
                :class="{
                  filled: star <= (contentHover || contentRating || 0),
                  active: star <= (contentRating || 0)
                }"
                @click="setContentRating(star)"
                @mouseenter="contentHover = star"
                @mouseleave="contentHover = null"
              >
                ★
              </button>
            </div>
            <span v-if="contentRating" class="rating-text">{{ getRatingLabel(contentRating) }}</span>
          </div>
        </div>

        <!-- Hashtags Rating -->
        <div class="rating-section">
          <label class="rating-label">
            <MaterialIcon icon="tag" size="md" class="rating-icon" />
            {{ $t('feedback.hashtagsQuality') }}
          </label>
          <div class="stars-container">
            <div class="stars">
              <button
                v-for="star in 5"
                :key="`hashtags-${star}`"
                type="button"
                class="star"
                :class="{
                  filled: star <= (hashtagsHover || hashtagsRating || 0),
                  active: star <= (hashtagsRating || 0)
                }"
                @click="setHashtagsRating(star)"
                @mouseenter="hashtagsHover = star"
                @mouseleave="hashtagsHover = null"
              >
                ★
              </button>
            </div>
            <span v-if="hashtagsRating" class="rating-text">{{ getRatingLabel(hashtagsRating) }}</span>
          </div>
        </div>
      </div>

      <!-- Additional Feedback -->
      <div class="additional-feedback-section">
        <label class="feedback-label">{{ $t('feedback.additionalFeedback') }}</label>
        <textarea
          v-model="additionalFeedback"
          class="feedback-textarea"
          rows="3"
          :placeholder="$t('feedback.additionalFeedbackPlaceholder')"
        ></textarea>
      </div>

      <!-- Actions -->
      <div class="feedback-actions">
        <BaseButton
          variant="ghost"
          size="medium"
          full-width
          @click="handleSkip"
        >
          {{ $t('feedback.skip') }}
        </BaseButton>
        <BaseButton
          variant="primary"
          size="medium"
          full-width
          :disabled="!hasAllRatings"
          @click="handleSubmit"
        >
          {{ $t('feedback.submit') }}
        </BaseButton>
      </div>
    </div>
  </BaseModal>
</template>

<style scoped>
.feedback-modal {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xl);
}

/* Header */
.feedback-header {
  text-align: center;
}

.feedback-icon {
  margin-bottom: var(--space-md);
  color: var(--gold-primary);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.feedback-title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  margin: 0 0 var(--space-sm) 0;
  background: var(--gradient-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.feedback-subtitle {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: 0;
}

/* Preview Section */
.preview-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  padding: var(--space-lg);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
}

.preview-image {
  width: 100%;
  max-height: 200px;
  object-fit: cover;
  border-radius: var(--radius-sm);
}

.preview-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.preview-text {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: var(--leading-normal);
  margin: 0;
}

.preview-hashtags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}

.preview-hashtag {
  font-size: var(--text-xs);
  color: var(--gold-primary);
  background: rgba(212, 175, 55, 0.1);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-sm);
}

.preview-more {
  font-size: var(--text-xs);
  color: var(--text-muted);
  padding: var(--space-xs) var(--space-sm);
}

/* Rating Sections */
.rating-sections {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

.rating-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.rating-label {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-family: var(--font-body);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.rating-icon {
  color: var(--gold-primary);
}

.stars-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.stars {
  display: flex;
  gap: var(--space-sm);
}

.star {
  background: none;
  border: none;
  font-size: var(--text-3xl);
  color: var(--text-muted);
  cursor: pointer;
  transition: all var(--transition-fast);
  padding: 0;
  line-height: 1;
}

.star.filled {
  color: var(--gold-primary);
  transform: scale(1.1);
}

.star.active {
  color: var(--gold-primary);
}

.star:hover {
  transform: scale(1.2);
}

.rating-text {
  font-size: var(--text-sm);
  color: var(--gold-primary);
  font-weight: var(--font-medium);
}

/* Additional Feedback */
.additional-feedback-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.feedback-label {
  font-family: var(--font-body);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.feedback-textarea {
  width: 100%;
  padding: var(--space-md);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: var(--text-base);
  line-height: var(--leading-normal);
  resize: vertical;
  transition: all var(--transition-base);
}

.feedback-textarea:focus {
  outline: none;
  border-color: var(--gold-primary);
  background: var(--bg-elevated);
}

.feedback-textarea::placeholder {
  color: var(--text-muted);
}

/* Actions */
.feedback-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-md);
  padding-top: var(--space-lg);
  border-top: 1px solid var(--border-color);
}

/* Responsive */
@media (max-width: 600px) {
  .feedback-title {
    font-size: var(--text-xl);
  }

  .feedback-actions {
    grid-template-columns: 1fr;
  }

  .star {
    font-size: var(--text-2xl);
  }
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  .feedback-icon {
    animation: none;
  }

  .star {
    transition: none;
  }

  .star:hover {
    transform: none;
  }
}
</style>
